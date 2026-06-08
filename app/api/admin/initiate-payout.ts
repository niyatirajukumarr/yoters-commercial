import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Razorpay from 'razorpay'

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_SydTJERNFEVhv6',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'IjzjfXi3VdatcieikU3PvFhY'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: NextRequest) {
  try {
    const { vendorName, upiId, amount, orderId } = await req.json()

    if (!vendorName || !upiId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create payout via Razorpay
    const payout = await razorpay.transfers.create({
      account: process.env.RAZORPAY_ACCOUNT_ID,
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      mode: 'NEFT', // or 'IMPS' or 'UPI'
      purpose: 'payout',
      notes: {
        vendor: vendorName,
        order_id: orderId,
        upi: upiId
      }
    })

    // Save payout record to Supabase
    const { error: saveError } = await supabase
      .from('payouts')
      .insert([{
        vendor_name: vendorName,
        upi_id: upiId,
        amount: amount,
        razorpay_payout_id: payout.id,
        status: 'initiated',
        created_at: new Date().toISOString()
      }])

    if (saveError) {
      console.error('Error saving payout:', saveError)
    }

    return NextResponse.json({
      success: true,
      payout_id: payout.id,
      status: payout.status,
      amount: amount
    })
  } catch (error) {
    console.error('Payout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payout failed' },
      { status: 500 }
    )
  }
}
