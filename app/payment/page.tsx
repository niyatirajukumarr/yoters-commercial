'use client'

export const dynamic = 'force-dynamic'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Script from 'next/script'

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
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize payment on mount
  useEffect(() => {
    const initializePayment = async () => {
      if (!orderId || !amount || !name) {
        setError('Missing payment information')
        setLoading(false)
        return
      }

      try {
        // Get user email from Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        const email = session?.user?.email || `student-${orderId}@yoters.local`

        // Create Razorpay order
        const response = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            amount: parseInt(amount),
            studentEmail: email,
            studentPhone: '9999999999',
            studentName: name,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create payment order')
        }

        const data = await response.json()
        console.log('[Payment] Razorpay order created:', data.razorpayOrderId)

        setProcessing(true)

        // Start polling for payment confirmation
        startPaymentPolling(orderId)

        setLoading(false)
      } catch (err: any) {
        console.error('Payment initialization error:', err)
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

  // Poll for payment confirmation
  const startPaymentPolling = (orderId: string) => {
    let pollCount = 0
    const maxPolls = 150

    pollIntervalRef.current = setInterval(async () => {
      pollCount++

      try {
        const { data: order } = await supabase
          .from('orders')
          .select('payment_status, status')
          .eq('id', orderId)
          .single()

        if (order && order.payment_status === 'paid') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          console.log('[Payment] Payment confirmed, redirecting to track page')
          // Redirect to track order page immediately on payment success
          router.push(`/mobile/track/${orderId}`)
        }
      } catch (err) {
        console.error('Payment polling error:', err)
      }

      if (pollCount >= maxPolls) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        setProcessing(false)
        setError('Payment verification timeout. Please check your order status.')
      }
    }, 2000)
  }

  // Handle SDK loaded and open Razorpay checkout
  const handleSDKLoad = async () => {
    console.log('[Payment] Razorpay SDK loaded')

    if (!orderId || !amount || !name || !processing) {
      return
    }

    try {
      // Fetch the order details to get razorpay_order_id
      const { data: order } = await supabase
        .from('orders')
        .select('razorpay_order_id')
        .eq('id', orderId)
        .single()

      if (!order?.razorpay_order_id) {
        setError('Failed to get payment order ID')
        setProcessing(false)
        return
      }

      const Razorpay = (window as RazorpayWindow).Razorpay
      if (!Razorpay) {
        console.error('[Payment] Razorpay SDK not available')
        setError('Payment SDK failed to load')
        setProcessing(false)
        return
      }

      console.log('[Payment] Opening Razorpay checkout...')

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: order.razorpay_order_id,
        name: 'Yoters',
        description: 'Food Order',
        prefill: {
          name: name,
          email: `student-${orderId}@yoters.local`,
          contact: '9999999999',
        },
        theme: {
          color: '#667eea',
        },
        handler: function (response: any) {
          console.log('[Payment] Razorpay payment response:', response)
          // Payment is already being handled by webhook
          // Just show a message and let polling detect the confirmation
        },
        modal: {
          ondismiss: function () {
            console.log('[Payment] Razorpay modal closed by user')
            setProcessing(false)
            setError('Payment cancelled. Please try again.')
          },
        },
      }

      const razorpayInstance = new Razorpay(options)
      razorpayInstance.open()
    } catch (err: any) {
      console.error('[Payment] Checkout error:', err)
      setError(`Payment error: ${err.message}`)
      setProcessing(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={handleSDKLoad}
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
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 32,
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12, animation: 'spin 2s linear infinite' }}>💳</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1f2e', margin: '0 0 8px' }}>
                Initializing Payment
              </h2>
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                Setting up secure payment gateway...
              </p>
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1f2e', margin: '0 0 8px' }}>
                Payment Error
              </h2>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                {error}
              </p>
              <button
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
              </button>
            </div>
          ) : processing ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔄</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1f2e', margin: '0 0 8px' }}>
                Processing Payment
              </h2>
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                Please complete payment in the popup...
              </p>
            </div>
          ) : null}
        </div>
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
