import type { SupabaseClient } from '@supabase/supabase-js'
import { toPaise } from '@/lib/money'

/**
 * Payout states that represent money already committed.
 *
 * 'processing' counts as spent on purpose: its outcome is unconfirmed, and
 * treating unknown money as unspent is how a vendor gets paid twice.
 */
export const SPENT_STATUSES = ['processing', 'processed'] as const

export type PayoutBalance = {
  receivedPaise: number
  alreadyPaidPaise: number
  owedPaise: number
}

/**
 * What a cafeteria is owed, in integer paise.
 *
 * Shared by both payout routes deliberately — the automatic Razorpay one and
 * the manual UPI one must never disagree about the balance, or one of them
 * becomes a way to over-send.
 */
export async function getPayoutBalance(
  db: SupabaseClient,
  cafeteriaId: string
): Promise<PayoutBalance | { error: string }> {
  const [paidOrders, priorPayouts] = await Promise.all([
    db
      .from('orders')
      .select('total_amount')
      .eq('cafeteria_id', cafeteriaId)
      .eq('payment_status', 'paid'),
    db
      .from('payouts')
      .select('amount, status')
      .eq('cafeteria_id', cafeteriaId)
      .in('status', SPENT_STATUSES as unknown as string[]),
  ])

  if (paidOrders.error || priorPayouts.error) {
    return { error: (paidOrders.error || priorPayouts.error)!.message }
  }

  const receivedPaise = (paidOrders.data ?? []).reduce((s, o) => s + toPaise(o.total_amount), 0)
  const alreadyPaidPaise = (priorPayouts.data ?? []).reduce((s, p) => s + toPaise(p.amount), 0)

  return {
    receivedPaise,
    alreadyPaidPaise,
    owedPaise: receivedPaise - alreadyPaidPaise,
  }
}
