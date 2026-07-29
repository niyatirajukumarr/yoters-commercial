import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { isValidAmount, isNonEmptyString } from '@/lib/validation'
import { isAdmin } from '@/lib/config'
import { enforceRateLimit } from '@/lib/rate-limit'
import { toPaise, fromPaise } from '@/lib/money'
import { getPayoutBalance } from '@/lib/payout-balance'

// Records a payout that was made by hand from a UPI app.
//
// The money moves outside this system entirely — the admin taps the deep link,
// pays from Google Pay or PhonePe, and comes back. Nothing here can verify the
// transfer happened, so this endpoint is bookkeeping, not payment: it writes
// the ledger row so "Pending" reflects reality and the same balance is not
// sent twice.

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

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
    const limited = enforceRateLimit(req, 'record-payout', 20, 60_000)
    if (limited) return limited

    const admin = await requireAdmin(req)
    if (!admin.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { cafeteriaId, amount, reference } = body

    if (!isNonEmptyString(cafeteriaId, 64)) {
      return NextResponse.json({ error: 'Invalid cafeteria.' }, { status: 400 })
    }
    if (!isValidAmount(amount, { min: 1, max: 500000 })) {
      return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 })
    }
    // The UPI reference is what makes this row auditable later. Without it the
    // ledger says money moved but gives no way to prove it.
    if (!isNonEmptyString(reference, 64)) {
      return NextResponse.json(
        { error: 'Enter the UPI reference / transaction ID from your payment app.' },
        { status: 400 }
      )
    }

    const { data: cafe, error: cafeErr } = await adminSupabase
      .from('cafeterias')
      .select('id, name, upi_id')
      .eq('id', cafeteriaId)
      .single()

    if (cafeErr || !cafe) {
      return NextResponse.json({ error: 'Cafeteria not found.' }, { status: 404 })
    }

    // Same balance rule as the Razorpay route — recorded manually or not, you
    // cannot book more than is owed.
    const balance = await getPayoutBalance(adminSupabase, cafeteriaId)
    if ('error' in balance) {
      logger.error('[RecordPayout] Balance check failed:', balance.error)
      return NextResponse.json({ error: 'Could not verify the payout balance.' }, { status: 500 })
    }

    const requestPaise = toPaise(amount)
    if (balance.owedPaise <= 0) {
      return NextResponse.json(
        { error: 'Nothing is currently owed to this restaurant.' },
        { status: 400 }
      )
    }
    if (requestPaise > balance.owedPaise) {
      return NextResponse.json(
        { error: `Amount exceeds the ₹${fromPaise(balance.owedPaise)} owed.` },
        { status: 400 }
      )
    }

    const { data: ledger, error: ledgerErr } = await adminSupabase
      .from('payouts')
      .insert({
        cafeteria_id: cafeteriaId,
        amount: fromPaise(requestPaise),
        // 'processed' rather than 'processing': the admin is asserting the
        // transfer already completed in their UPI app, so there is nothing
        // pending confirmation.
        status: 'processed',
        method: 'manual_upi',
        reference: String(reference).trim(),
        upi_id: cafe.upi_id,
        initiated_by: admin.email,
      })
      .select('id')
      .single()

    if (ledgerErr || !ledger) {
      logger.error('[RecordPayout] Ledger insert failed:', ledgerErr)
      return NextResponse.json({ error: 'Could not record the payout.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      payout_id: ledger.id,
      amount: fromPaise(requestPaise),
      remaining: fromPaise(balance.owedPaise - requestPaise),
      message: `✅ ₹${fromPaise(requestPaise)} recorded as paid`,
    })
  } catch (error) {
    logger.error('[RecordPayout] Error:', error)
    return NextResponse.json({ error: 'Could not record the payout.' }, { status: 500 })
  }
}
