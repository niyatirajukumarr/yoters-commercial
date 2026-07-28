import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { logger, shortId } from '@/lib/logger'
import { isValidUpiId, isValidAmount, isNonEmptyString } from '@/lib/validation'
import { isAdmin } from '@/lib/config'
import { enforceRateLimit } from '@/lib/rate-limit'
import { toPaise, fromPaise } from '@/lib/money'

// Service-role client for verifying the caller's token and writing the payout
// ledger. Never exposed to the client.
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Razorpay payout credentials come strictly from env — never hardcoded.
const RAZORPAY_KEY_ID = process.env.RAZORPAY_PAYOUT_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
const RAZORPAY_ACCOUNT_NUMBER = process.env.RAZORPAY_PAYOUT_ACCOUNT_NUMBER

/** Payout states that represent money already committed. */
const SPENT_STATUSES = ['processing', 'processed']

async function createRazorpayPayout(
  amountPaise: number,
  upiId: string,
  vendorName: string,
  idempotencyKey: string
) {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')

  const response = await fetch('https://api.razorpay.com/v1/payouts', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      // A retry carrying the same key returns the original payout instead of
      // creating a second transfer.
      'X-Payout-Idempotency': idempotencyKey,
    },
    body: JSON.stringify({
      account_number: RAZORPAY_ACCOUNT_NUMBER,
      amount: amountPaise,
      currency: 'INR',
      mode: 'UPI',
      purpose: 'payout',
      vpa: upiId,
      description: `Payout to ${vendorName}`,
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    // Surface Razorpay's error server-side only.
    logger.error('[Payout] Razorpay rejected payout:', data)
    const reason = typeof data?.error?.description === 'string' ? data.error.description : 'rejected'
    throw Object.assign(new Error('Razorpay payout request failed'), { reason, rejected: true })
  }
  return data
}

// Verify the bearer token belongs to an authenticated admin.
async function requireAdmin(req: NextRequest): Promise<{ ok: boolean; email?: string }> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return { ok: false }
  const { data, error } = await adminSupabase.auth.getUser(token)
  if (error || !data.user) return { ok: false }
  if (!isAdmin(data.user.email)) return { ok: false }
  return { ok: true, email: data.user.email || undefined }
}

export async function POST(req: NextRequest) {
  let ledgerId: string | null = null

  try {
    const limited = enforceRateLimit(req, 'initiate-payout', 10, 60_000)
    if (limited) return limited

    // 1) AuthN + AuthZ — only an authenticated admin may trigger payouts.
    const admin = await requireAdmin(req)
    if (!admin.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2) Config check — fail closed if payout credentials are not configured.
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !RAZORPAY_ACCOUNT_NUMBER) {
      logger.error('[Payout] Missing Razorpay payout configuration')
      return NextResponse.json({ error: 'Payouts are not configured.' }, { status: 503 })
    }

    // 3) Input. Only the cafeteria and the amount come from the client — the
    // destination VPA is read from the database below, never from the request.
    // A stolen admin session could otherwise redirect money to any UPI id.
    const body = await req.json()
    const { cafeteriaId, amount } = body

    if (!isNonEmptyString(cafeteriaId, 64)) {
      return NextResponse.json({ error: 'Invalid cafeteria.' }, { status: 400 })
    }
    if (!isValidAmount(amount, { min: 1, max: 500000 })) {
      return NextResponse.json({ error: 'Invalid payout amount.' }, { status: 400 })
    }

    const { data: cafe, error: cafeErr } = await adminSupabase
      .from('cafeterias')
      .select('id, name, upi_id')
      .eq('id', cafeteriaId)
      .single()

    if (cafeErr || !cafe) {
      return NextResponse.json({ error: 'Cafeteria not found.' }, { status: 404 })
    }
    if (!isValidUpiId(cafe.upi_id)) {
      return NextResponse.json(
        { error: 'This restaurant has no valid UPI ID saved.' },
        { status: 400 }
      )
    }

    // 4) Work out what is actually owed, server-side. The client's figure is
    // only ever allowed to be smaller — never the source of truth.
    const [paidOrders, priorPayouts] = await Promise.all([
      adminSupabase
        .from('orders')
        .select('total_amount')
        .eq('cafeteria_id', cafeteriaId)
        .eq('payment_status', 'paid'),
      adminSupabase
        .from('payouts')
        .select('amount, status')
        .eq('cafeteria_id', cafeteriaId)
        .in('status', SPENT_STATUSES),
    ])

    if (paidOrders.error || priorPayouts.error) {
      logger.error('[Payout] Could not compute balance:', paidOrders.error || priorPayouts.error)
      return NextResponse.json({ error: 'Could not verify the payout balance.' }, { status: 500 })
    }

    const receivedPaise = (paidOrders.data ?? []).reduce((s, o) => s + toPaise(o.total_amount), 0)
    const alreadyPaidPaise = (priorPayouts.data ?? []).reduce((s, p) => s + toPaise(p.amount), 0)
    const owedPaise = receivedPaise - alreadyPaidPaise
    const requestPaise = toPaise(amount)

    if (owedPaise <= 0) {
      return NextResponse.json(
        { error: 'Nothing is currently owed to this restaurant.' },
        { status: 400 }
      )
    }
    if (requestPaise > owedPaise) {
      return NextResponse.json(
        { error: `Amount exceeds the ₹${fromPaise(owedPaise)} owed.` },
        { status: 400 }
      )
    }

    // 5) Record the attempt BEFORE any money moves. If the process dies
    // mid-flight the row survives as evidence, and it counts as spent so the
    // same balance cannot be sent again.
    const idempotencyKey = randomUUID()
    const { data: ledger, error: ledgerErr } = await adminSupabase
      .from('payouts')
      .insert({
        cafeteria_id: cafeteriaId,
        amount: fromPaise(requestPaise),
        status: 'processing',
        idempotency_key: idempotencyKey,
        upi_id: cafe.upi_id,
        initiated_by: admin.email,
      })
      .select('id')
      .single()

    if (ledgerErr || !ledger) {
      // The partial unique index on in-flight payouts rejects a second
      // concurrent attempt for the same cafeteria — two admins clicking at
      // once would otherwise both pass the balance check above.
      const conflict = ledgerErr?.code === '23505'
      logger.error('[Payout] Ledger insert failed:', ledgerErr)
      return NextResponse.json(
        {
          error: conflict
            ? 'A payout for this restaurant is already in progress.'
            : 'Could not record the payout.',
        },
        { status: conflict ? 409 : 500 }
      )
    }
    ledgerId = ledger.id

    // 6) Move the money.
    const payout = await createRazorpayPayout(
      requestPaise,
      cafe.upi_id,
      cafe.name,
      idempotencyKey
    )

    await adminSupabase
      .from('payouts')
      .update({
        status: 'processed',
        razorpay_payout_id: payout.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ledgerId)

    logger.debug('[Payout] Initiated', { payoutId: shortId(payout.id), amount })

    return NextResponse.json(
      {
        success: true,
        payout_id: payout.id,
        status: payout.status,
        amount: fromPaise(requestPaise),
        remaining: fromPaise(owedPaise - requestPaise),
        message: `✅ ₹${fromPaise(requestPaise)} payout initiated`,
      },
      { status: 200 }
    )
  } catch (error) {
    const rejected = (error as { rejected?: boolean })?.rejected === true
    logger.error('[Payout] Error:', error)

    if (ledgerId) {
      // Only mark the row failed when Razorpay explicitly rejected it — that
      // is the one case where we know no money moved, so the balance should be
      // released. Anything else (timeout, crash, network drop) is genuinely
      // unknown: the row stays 'processing', keeps counting as spent, and
      // blocks further payouts until a human checks Razorpay. Releasing it
      // automatically is how you pay a vendor twice.
      await adminSupabase
        .from('payouts')
        .update({
          status: rejected ? 'failed' : 'processing',
          failure_reason:
            (error as { reason?: string })?.reason ??
            (rejected ? 'rejected' : 'unconfirmed — verify in Razorpay before retrying'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', ledgerId)
    }

    return NextResponse.json(
      {
        error: rejected
          ? 'Razorpay rejected the payout. Nothing was sent.'
          : 'Payout status is unconfirmed. Check Razorpay before retrying.',
      },
      { status: 500 }
    )
  }
}
