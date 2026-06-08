import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const RAZORPAY_KEY_ID = 'rzp_live_SydTJERNFEVhv6'
const RAZORPAY_KEY_SECRET = 'IjzjfXi3VdatcieikU3PvFhY'
const RAZORPAY_ACCOUNT_ID = 'StUKJCKV9glTR7'

async function createRazorpayPayout(amount: number, upiId: string, vendorName: string) {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')

  const response = await fetch('https://api.razorpay.com/v1/payouts', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      account_number: RAZORPAY_ACCOUNT_ID,
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      mode: 'UPI',
      purpose: 'refund',
      vpa: upiId,
      description: `Payout to ${vendorName}`,
      notes: {
        vendor: vendorName,
        settlement_date: new Date().toISOString()
      }
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.description || 'Payout failed')
  }

  return await response.json()
}

export async function POST(req: NextRequest) {
  try {
    const { vendorName, upiId, amount } = await req.json()

    if (!vendorName || !upiId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    // Create payout via Razorpay
    const payout = await createRazorpayPayout(amount, upiId, vendorName)

    // Save payout record to Supabase
    const { error: saveError } = await supabase
      .from('payouts')
      .insert([{
        vendor_name: vendorName,
        upi_id: upiId,
        amount: amount,
        razorpay_payout_id: payout.id,
        status: payout.status || 'processing',
        created_at: new Date().toISOString()
      }])

    if (saveError) {
      console.error('Error saving payout record:', saveError)
    }

    return NextResponse.json({
      success: true,
      payout_id: payout.id,
      status: payout.status,
      amount: amount,
      message: `₹${amount} payout initiated to ${upiId}`
    })
  } catch (error) {
    console.error('Payout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payout failed' },
      { status: 500 }
    )
  }
}
