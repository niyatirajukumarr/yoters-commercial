import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger, shortId } from '@/lib/logger'
import { isValidUpiId, isValidAmount, isNonEmptyString } from '@/lib/validation'
import { isAdmin } from '@/lib/config'
import { enforceRateLimit } from '@/lib/rate-limit'

// Service-role client for verifying the caller's token and (future) recording
// payouts. Never exposed to the client.
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Razorpay payout credentials come strictly from env — never hardcoded.
const RAZORPAY_KEY_ID = process.env.RAZORPAY_PAYOUT_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
const RAZORPAY_ACCOUNT_NUMBER = process.env.RAZORPAY_PAYOUT_ACCOUNT_NUMBER

async function createRazorpayPayout(amount: number, upiId: string, vendorName: string) {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')

  const response = await fetch('https://api.razorpay.com/v1/payouts', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account_number: RAZORPAY_ACCOUNT_NUMBER,
      amount: Math.round(amount * 100), // paise
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
    throw new Error('Razorpay payout request failed')
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
  try {
    const limited = enforceRateLimit(req, 'initiate-payout', 10, 60_000)
    if (limited) return limited

    // 1) AuthN + AuthZ — only an authenticated admin may trigger payouts.
    const admin = await requireAdmin(req)
    if (!admin.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2) Config check — fail closed if payout secrets are not configured.
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !RAZORPAY_ACCOUNT_NUMBER) {
      logger.error('[Payout] Missing Razorpay payout configuration')
      return NextResponse.json(
        { error: 'Payouts are not configured.' },
        { status: 503 }
      )
    }

    // 3) Input validation.
    const body = await req.json()
    const { vendorName, upiId, amount } = body

    if (!isNonEmptyString(vendorName, 120)) {
      return NextResponse.json({ error: 'Invalid vendor name.' }, { status: 400 })
    }
    if (!isValidUpiId(upiId)) {
      return NextResponse.json({ error: 'Invalid UPI ID.' }, { status: 400 })
    }
    if (!isValidAmount(amount, { min: 1, max: 500000 })) {
      return NextResponse.json({ error: 'Invalid payout amount.' }, { status: 400 })
    }

    const payout = await createRazorpayPayout(amount, upiId, vendorName)

    logger.debug('[Payout] Initiated', { payoutId: shortId(payout.id), amount })

    return NextResponse.json(
      {
        success: true,
        payout_id: payout.id,
        status: payout.status,
        amount,
        message: `✅ ₹${amount} payout initiated`,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('[Payout] Error:', error)
    return NextResponse.json(
      { error: 'Payout could not be processed. Please try again.' },
      { status: 500 }
    )
  }
}
