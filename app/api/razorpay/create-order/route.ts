import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRazorpayOrder } from '@/lib/razorpay'
import { logger } from '@/lib/logger'
import { isValidEmail, isValidPhone, isValidAmount, isNonEmptyString } from '@/lib/validation'
import { enforceSharedNetworkRateLimit } from '@/lib/rate-limit'
import { expectedOrderTotal, type OrderLine, type PricedMenuItem } from '@/lib/utils/orderTotal'

// Service-role client: this route reads the order and writes the Razorpay order
// id, which must work even once RLS is tightened to owner-scoped policies.
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * How far under the recomputed price an order may sit before it is refused.
 *
 * Not zero, and the reason matters. Re-pricing an order against today's menu
 * is not the same as re-pricing it against the menu it was built from: vendors
 * edit prices, and pricing rules themselves change. Replaying the last 60 real
 * orders through this function put 17 of them outside a ±₹0.50 window — flat
 * parcel charges from before it went per-item, subtotals off by ₹15-₹35 where
 * a price had since been edited. Every one of those was an honest order, and
 * strict equality would have refused them at the payment screen.
 *
 * So this is a floor against forgery, not a lock on the price: it catches the
 * cart that claims ₹1 for ₹500 of food, and lets ordinary drift through. Every
 * mismatch is logged whether or not it is refused, so the real spread can be
 * watched. The lasting fix is to price the order server-side when it is
 * inserted, at which point this becomes a redundant second opinion.
 */
function underpaymentAllowance(expected: number): number {
  return Math.max(25, expected * 0.1)
}

/**
 * Re-price a stored order from the menu and compare.
 *
 * Deliberately lenient in one direction: if a line cannot be priced — an item
 * the vendor has since deleted, or a cart saved before menu ids were stored —
 * the subtotal is unknowable, and refusing would strand a paying customer over
 * the restaurant's own edit. In that case the two charges the server can still
 * compute on its own, parcel and delivery, are checked instead. Those are the
 * ones a tampered client would zero.
 */
async function verifyStoredTotal(order: any): Promise<{
  ok: boolean
  expected?: number
  detail?: string
}> {
  const items: OrderLine[] = Array.isArray(order.items) ? order.items : []
  if (!items.length) return { ok: false, detail: 'order has no items' }

  const { data: cafeteria } = await adminSupabase
    .from('cafeterias')
    .select('name, latitude, longitude')
    .eq('id', order.cafeteria_id)
    .single()

  const menuIds = items.map(i => i.menuId).filter((id): id is string => typeof id === 'string')
  const { data: menuRows } = menuIds.length
    ? await adminSupabase
        .from('cafeteria_menu')
        .select('id, price, category, variants')
        .eq('cafeteria_id', order.cafeteria_id)
        .in('id', menuIds)
    : { data: [] as PricedMenuItem[] }

  const menuById = new Map<string, PricedMenuItem>()
  for (const row of (menuRows ?? []) as PricedMenuItem[]) menuById.set(row.id, row)

  const expected = expectedOrderTotal({
    items,
    menuById,
    orderType: order.order_type,
    cafeteria: { latitude: cafeteria?.latitude ?? null, longitude: cafeteria?.longitude ?? null },
    delivery: { latitude: order.delivery_latitude, longitude: order.delivery_longitude },
    restaurantName: cafeteria?.name,
  })

  const stored = Number(order.total_amount)

  // Items that no longer price leave the subtotal unknowable, so compare only
  // the parts the server computed itself.
  const comparable = expected.itemsPriced
    ? { stored, expected: expected.total, what: 'total' }
    : {
        stored: Number(order.parcel_charge ?? 0) + Number(order.delivery_charge ?? 0),
        expected: expected.parcelCharge + expected.deliveryCharge,
        what: 'charges',
      }

  const shortfall = comparable.expected - comparable.stored
  const detail =
    `${comparable.what}: stored ${comparable.stored}, expected ${comparable.expected} ` +
    `(subtotal ${expected.subtotal} + parcel ${expected.parcelCharge} + delivery ${expected.deliveryCharge})` +
    (expected.itemsPriced ? '' : ' — some items no longer on the menu')

  if (shortfall > underpaymentAllowance(comparable.expected)) {
    return { ok: false, expected: comparable.expected, detail }
  }

  // Within the allowance but not equal: almost always a menu edit or a pricing
  // rule that moved. Worth seeing, not worth blocking a customer over.
  if (Math.abs(shortfall) > 0.5) {
    logger.warn('Order total differs from the recomputed price', { orderId: order.id, detail })
  }

  return { ok: true }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, amount, studentEmail, studentPhone, studentName } = body

    // Limit per checkout, not per IP: a whole campus shares one public address
    // at lunch, and an IP-only cap would stop everyone after the first handful
    // of orders. The IP tier stays as a backstop, sized for a crowded network.
    const limited = enforceSharedNetworkRateLimit(req, 'create-order', orderId, {
      perIdentity: 10,
      perIp: 600,
    })
    if (limited) return limited

    if (!orderId || !amount || !studentEmail || !studentPhone || !studentName) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      )
    }

    // Validate formats/ranges server-side — never trust client-supplied values.
    if (!isValidEmail(studentEmail)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }
    if (!isValidPhone(studentPhone)) {
      return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 })
    }
    if (!isNonEmptyString(studentName, 120)) {
      return NextResponse.json({ error: 'Invalid name.' }, { status: 400 })
    }
    // amount is in INR rupees at this boundary (converted to paise downstream).
    if (!isValidAmount(amount, { min: 1, max: 100000 })) {
      return NextResponse.json(
        { error: 'Amount must be between ₹1 and ₹100000.' },
        { status: 400 }
      )
    }

    // Fetch order to verify it exists, and cross-check the amount against the
    // server-side record so a tampered client cannot pay an arbitrary total.
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select(
        'id, total_amount, razorpay_order_id, items, order_type, cafeteria_id, delivery_latitude, delivery_longitude, parcel_charge, delivery_charge'
      )
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    // Trust the stored order total, not the client-provided amount.
    const authoritativeAmount = Number(order.total_amount)
    if (!isValidAmount(authoritativeAmount, { min: 1, max: 100000 })) {
      return NextResponse.json({ error: 'Order has an invalid total.' }, { status: 400 })
    }

    // ...but the stored total came from the browser too: the orders table takes
    // an INSERT straight from the client with no validation on total_amount, so
    // "trust the row" only moved the forgery one step earlier. Price the order
    // again here, from the menu.
    const priceCheck = await verifyStoredTotal(order)
    if (!priceCheck.ok) {
      logger.error('Order total mismatch', {
        orderId,
        stored: authoritativeAmount,
        expected: priceCheck.expected,
        detail: priceCheck.detail,
      })
      return NextResponse.json(
        { error: 'This order could not be priced. Please rebuild your cart and try again.' },
        { status: 409 }
      )
    }

    // Check if we already have a Razorpay order ID (from a previous attempt)
    if (order.razorpay_order_id) {
      return NextResponse.json(
        {
          success: true,
          razorpayOrderId: order.razorpay_order_id,
          razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          message: 'Returning existing order',
        },
        { status: 200 }
      )
    }

    // Create Razorpay order using the authoritative amount.
    const razorpayOrder = await createRazorpayOrder(
      orderId,
      authoritativeAmount,
      studentEmail,
      studentPhone,
      studentName
    )

    // Store Razorpay order ID in our database
    const { error: updateError } = await adminSupabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', orderId)

    if (updateError) {
      logger.error('Error storing Razorpay order ID:', updateError)
    }

    return NextResponse.json(
      {
        success: true,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        message: 'Order created successfully',
      },
      { status: 200 }
    )
  } catch (error: any) {
    // Log full detail server-side only; return a generic message to the client.
    logger.error('Create order error:', error)
    const isAuthFailure =
      error?.statusCode === 401 ||
      (error?.error?.code === 'BAD_REQUEST_ERROR' && /key|auth/i.test(error?.error?.description || ''))
    if (isAuthFailure) {
      return NextResponse.json(
        { error: 'Payment gateway is temporarily unavailable. Please try again later.' },
        { status: 502 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create payment order. Please try again.' },
      { status: 500 }
    )
  }
}
