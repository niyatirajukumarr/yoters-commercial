'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DeliveryBillSheet } from '@/components/DeliveryBillSheet'

interface DeliveryInfo {
  cafeteriaName: string
  customerName: string
  phone: string
  items: Array<{ name: string; quantity: number }>
  totalAmount: number
  tokenNumber: number | null
  isPrepaid: boolean
  address: string | null
  latitude: number | null
  longitude: number | null
}

export default function DeliverySlipPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [info, setInfo] = useState<DeliveryInfo | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/delivery/${orderId}`)
      .then(res => {
        if (!res.ok) throw new Error('not found')
        return res.json()
      })
      .then(data => { if (!cancelled) setInfo(data) })
      .catch(() => { if (!cancelled) setNotFound(true) })
    return () => { cancelled = true }
  }, [orderId])

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: 20 }}>
        <div style={{ textAlign: 'center', color: '#999' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
          <div style={{ fontWeight: 700 }}>Delivery slip not found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>This link may have expired or is invalid.</div>
        </div>
      </div>
    )
  }

  if (!info) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <div style={{ color: '#999', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

  const mapsUrl = info.latitude != null && info.longitude != null
    ? `https://www.google.com/maps/search/?api=1&query=${info.latitude},${info.longitude}`
    : info.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.address)}`
      : null

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '32px 16px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <DeliveryBillSheet
          cafeteriaName={info.cafeteriaName}
          tokenNumber={info.tokenNumber}
          customerName={info.customerName}
          phone={info.phone}
          items={info.items}
          totalAmount={info.totalAmount}
          isPrepaid={info.isPrepaid}
          address={info.address}
          mapsUrl={mapsUrl}
        />
      </div>
    </div>
  )
}
