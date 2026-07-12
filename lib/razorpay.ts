import Razorpay from 'razorpay'
import crypto from 'crypto'

const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

// Initialize Razorpay instance
let razorpayInstance: Razorpay | null = null

export function getRazorpayInstance() {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error('Razorpay credentials not configured')
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: KEY_ID,
      key_secret: KEY_SECRET,
    })
  }

  return razorpayInstance
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(
  orderId: string,
  amount: number, // in INR
  customerEmail: string,
  customerPhone: string,
  customerName: string
): Promise<any> {
  const razorpay = getRazorpayInstance()

  try {
    console.log('[Razorpay] Creating order:', { orderId, amount })

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: orderId,
      notes: {
        order_id: orderId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
    })

    console.log('[Razorpay] Order created:', order.id)
    return order
  } catch (error: any) {
    console.error('Razorpay order creation error:', error)
    throw error
  }
}

/**
 * Verify a Standard Checkout payment signature.
 * Formula: HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, KEY_SECRET)
 */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  if (!KEY_SECRET) {
    console.error('Razorpay secret not configured')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(razorpaySignature, 'hex')
    )
  } catch {
    // Buffer length mismatch or invalid hex -> not a valid signature
    return false
  }
}

/**
 * Verify webhook signature from Razorpay
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  if (!KEY_SECRET) {
    console.error('Razorpay secret not configured')
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(body)
      .digest('hex')

    return signature === expectedSignature
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * Get payment details from Razorpay
 */
export async function getPaymentDetails(paymentId: string): Promise<any> {
  const razorpay = getRazorpayInstance()

  try {
    const payment = await razorpay.payments.fetch(paymentId)
    return payment
  } catch (error: any) {
    console.error('Razorpay payment fetch error:', error)
    throw error
  }
}

/**
 * Send payout to vendor's bank account/UPI
 * TODO: Implement when Razorpay payouts are ready
 */
export async function sendVendorPayout(
  vendorUpiId: string,
  amount: number, // in INR
  orderId: string,
  vendorName: string
): Promise<any> {
  console.log('[Razorpay] Payout queued (implementation paused):', {
    vendor: vendorName,
    amount,
    upi: vendorUpiId,
  })

  // TODO: Implement actual payout when Razorpay setup is complete
  return {
    id: `payout-${orderId}-${Date.now()}`,
    status: 'queued',
    notes: { vendor: vendorName, order_id: orderId }
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(
  paymentId: string,
  amount?: number // Optional: partial refund amount in INR
): Promise<any> {
  const razorpay = getRazorpayInstance()

  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount ? amount * 100 : undefined, // Convert to paise if provided
    })

    console.log('[Razorpay] Refund created:', refund.id)
    return refund
  } catch (error: any) {
    console.error('Razorpay refund error:', error)
    throw error
  }
}
