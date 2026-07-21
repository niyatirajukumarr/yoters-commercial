'use client'

export const dynamic = 'force-dynamic'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils/slug'
import { isValidEmail, isValidPhone } from '@/lib/validation'
import { hoverScale, scaleIn } from '@/lib/motion'
import Script from 'next/script'
import { withTimeout } from '@/lib/utils/withTimeout'

interface RazorpayWindow extends Window {
  Razorpay?: any
}

function PaymentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const name = searchParams.get('name')

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const razorpayOrderIdRef = useRef<string | null>(null)
  const cafeSlugRef = useRef<string | null>(null)
  // Real, validated contact info pulled from the order record (never placeholders).
  const contactRef = useRef<{ name: string; email: string; phone: string } | null>(null)

  // Get cafeteria slug from order
  const getCafeSlug = async (orderId: string) => {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('cafeteria_id')
        .eq('id', orderId)
        .single()

      if (order?.cafeteria_id) {
        const { data: cafe } = await supabase
          .from('cafeterias')
          .select('name')
          .eq('id', order.cafeteria_id)
          .single()

        if (cafe) {
          const slug = generateSlug(cafe.name)
          cafeSlugRef.current = slug
          return slug
        }
      }
      return null
    } catch (err) {
      console.error('Error getting cafe slug:', err)
      return null
    }
  }

  // Initialize payment on mount
  useEffect(() => {
    const initializePayment = async () => {
      if (!orderId || !amount || !name) {
        setError('Missing payment information')
        setLoading(false)
        return
      }

      try {
        console.log('[Payment] Initializing payment for order')

        // Pull the real contact details captured when the order was placed.
        // These are validated below — no placeholder phone/email is ever sent to
        // Razorpay, so refunds, receipts and SMS reach the actual customer.
        const { data: order } = await withTimeout(
          supabase.from('orders').select('student_name, student_email, student_phone').eq('id', orderId).single(),
          8000,
          'Order fetch timed out'
        ) as any

        // Fall back to the authenticated session email if the order has none.
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000, 'Session check timed out')
        const email = order?.student_email || session?.user?.email || ''
        const phone = order?.student_phone || ''
        const contactName = order?.student_name || name || ''

        if (!isValidEmail(email) || !isValidPhone(phone)) {
          setError('This order is missing valid contact details. Please re-place your order with a valid phone and email.')
          setLoading(false)
          return
        }

        contactRef.current = { name: contactName, email, phone }

        // Create Razorpay order
        const response = await withTimeout(
          fetch('/api/razorpay/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              amount: parseInt(amount),
              studentEmail: email,
              studentPhone: phone,
              studentName: contactName,
            }),
          }),
          15000,
          'Payment order creation timed out'
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create payment order')
        }

        const data = await response.json()
        console.log('[Payment] Razorpay order created:', data.razorpayOrderId)
        razorpayOrderIdRef.current = data.razorpayOrderId

        setLoading(false)
        setProcessing(true)

        // Start polling for payment confirmation
        startPaymentPolling(orderId)
      } catch (err: any) {
        console.error('[Payment] Initialization error:', err)
        setError(err.message || 'Failed to initialize payment')
        setLoading(false)
      }
    }

    initializePayment()

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [orderId, amount, name])

  // When SDK is loaded AND order is ready, open the modal
  useEffect(() => {
    if (sdkLoaded && processing && razorpayOrderIdRef.current) {
      console.log('[Payment] Both SDK and order ready, opening modal')
      openRazorpayModal()
    }
  }, [sdkLoaded, processing])

  // Poll for payment confirmation
  const startPaymentPolling = (orderId: string) => {
    let pollCount = 0
    const maxPolls = 150

    pollIntervalRef.current = setInterval(async () => {
      pollCount++

      try {
        const { data: order } = await supabase
          .from('orders')
          .select('payment_status')
          .eq('id', orderId)
          .single()

        if (order && order.payment_status === 'paid') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          setProcessing(false)
          setPaymentConfirmed(true)
          if (window.opener) {
            window.opener.postMessage({ type: 'PAYMENT_SUCCESS', orderId }, '*')
          }
          // Get cafeteria slug for redirect
          const slug = cafeSlugRef.current || (orderId ? await getCafeSlug(orderId) : null)

          setTimeout(() => {
            if (window.opener) window.close()
            else router.push(slug ? `/mobile/order/${slug}` : `/mobile`)
          }, 4000)
          return
        }
      } catch (err) {
        console.error('[Payment] Polling error:', err)
      }

      if (pollCount >= maxPolls) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        setProcessing(false)
        setError('Payment verification timeout. Please check your order status.')
      }
    }, 2000)
  }

  // Open Razorpay modal
  const openRazorpayModal = async () => {
    try {
      const Razorpay = (window as RazorpayWindow).Razorpay

      if (!Razorpay) {
        console.error('[Payment] Razorpay SDK not available')
        setError('Payment SDK failed to load')
        setProcessing(false)
        return
      }

      if (!razorpayOrderIdRef.current) {
        console.error('[Payment] No Razorpay order ID')
        setError('Payment order not created')
        setProcessing(false)
        return
      }

      console.log('[Payment] Creating Razorpay instance')

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: razorpayOrderIdRef.current,
        name: 'Yoters',
        description: 'Food Order',
        prefill: {
          name: contactRef.current?.name || name || 'Customer',
          email: contactRef.current?.email || '',
          contact: contactRef.current?.phone || '',
        },
        theme: {
          color: '#E8334A',
        },
        // UPI Only
        method: {
          upi: true,
          card: false,
          netbanking: false,
          wallet: false,
        },
        handler: async function (response: any) {
          // Verify signature server-side before trusting the payment, then mark order as paid
          const verifyRes = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          })

          if (!verifyRes.ok) {
            console.error('[Payment] Signature verification failed')
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            setProcessing(false)
            setError('Payment verification failed. If money was deducted, contact support.')
            return
          }

          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          setProcessing(false)
          setPaymentConfirmed(true)
          if (window.opener) {
            window.opener.postMessage({ type: 'PAYMENT_SUCCESS', orderId }, '*')
            setTimeout(() => window.close(), 3000)
          } else {
            const slug = cafeSlugRef.current || (orderId ? await getCafeSlug(orderId) : null)
            setTimeout(() => router.push(slug ? `/mobile/order/${slug}` : `/mobile`), 3000)
          }
        },
        modal: {
          ondismiss: function () {
            console.log('[Payment] Modal closed/failed')
            setProcessing(false)
            setError('Payment failed or cancelled.')
            if (window.opener) {
              window.opener.postMessage({ type: 'PAYMENT_FAILED', orderId }, '*')
            }
          },
        },
      }

      const razorpayInstance = new Razorpay(options)
      console.log('[Payment] Opening Razorpay modal')
      razorpayInstance.open()
    } catch (err: any) {
      console.error('[Payment] Error opening modal:', err)
      setError(`Payment error: ${err.message}`)
      setProcessing(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[Payment] Razorpay SDK script loaded')
          setSdkLoaded(true)
        }}
        onError={() => {
          console.error('[Payment] Failed to load Razorpay SDK')
          setError('Failed to load payment SDK')
          setLoading(false)
        }}
      />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: 'var(--font-body, sans-serif)',
      }}>
        <motion.div initial="hidden" animate="visible" variants={scaleIn} style={{
          background: 'white',
          borderRadius: 20,
          padding: 32,
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <AnimatePresence mode="wait">
            {paymentConfirmed ? (
              <motion.div key="confirmed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center' }}>
                <motion.div initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }} style={{ fontSize: 64, marginBottom: 16 }}>✅</motion.div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1f2e', margin: '0 0 8px' }}>
                  Payment Confirmed!
                </h2>
                <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
                  Redirecting to your order...
                </p>
              </motion.div>
            ) : loading ? (
              <motion.div key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  style={{ fontSize: 48, marginBottom: 12 }}
                >📱</motion.div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1f2e', margin: '0 0 8px' }}>
                  UPI Payment
                </h2>
                <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                  Initializing secure UPI payment...
                </p>
              </motion.div>
            ) : error ? (
              <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1f2e', margin: '0 0 8px' }}>
                  Payment Error
                </h2>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                  {error}
                </p>
                <motion.button
                  {...hoverScale}
                  onClick={() => window.location.reload()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </motion.button>
              </motion.div>
            ) : processing ? (
              <motion.div key="processing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  style={{ fontSize: 48, marginBottom: 12 }}
                >🔄</motion.div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1f2e', margin: '0 0 8px' }}>
                  Waiting for UPI Payment
                </h2>
                <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                  Please complete payment in your UPI app (PhonePe, Google Pay, Paytm, etc.)
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading payment...</div>}>
      <PaymentPageContent />
    </Suspense>
  )
}
