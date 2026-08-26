'use client'

export interface DeliveryBillSheetProps {
  cafeteriaName: string
  tokenNumber: number | null
  customerName: string
  phone: string
  items: Array<{ name: string; quantity: number }>
  totalAmount: number
  isPrepaid: boolean
  address: string | null
  mapsUrl: string | null
}

// Purely presentational — used both in the vendor's own preview modal
// (app/vendor/page.tsx) and on the public, no-login delivery page
// (app/delivery/[orderId]/page.tsx) so the delivery person sees exactly the
// same sheet the vendor previewed before sharing it.
export function DeliveryBillSheet(props: DeliveryBillSheetProps) {
  const { cafeteriaName, tokenNumber, customerName, phone, items, totalAmount, isPrepaid, address, mapsUrl } = props

  return (
    <div style={{
      background: '#ffffff', borderRadius: 16, overflow: 'hidden',
      border: '1px solid #eee', boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 22px 16px', textAlign: 'center', borderBottom: '1px dashed #ddd' }}>
        <div style={{ fontSize: 11, color: '#999', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
          Delivery Slip
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>{cafeteriaName}</div>
        {tokenNumber != null && (
          <div style={{
            display: 'inline-block', fontFamily: 'var(--font-head)', fontSize: 40, fontWeight: 900,
            color: 'var(--accent, #E8334A)', border: '2px solid var(--accent, #E8334A)', borderRadius: 12,
            padding: '2px 22px', lineHeight: 1.3,
          }}>
            {String(tokenNumber).padStart(3, '0')}
          </div>
        )}
      </div>

      {/* Customer */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ fontSize: 11, color: '#999', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Deliver To
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{customerName}</div>
        <a href={`tel:${phone}`} style={{ fontSize: 14, color: '#059669', fontWeight: 600, textDecoration: 'none' }}>
          📞 {phone}
        </a>
      </div>

      {/* Items */}
      <div style={{ padding: '18px 22px 0' }}>
        <div style={{ fontSize: 11, color: '#999', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
          Order Summary
        </div>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#333', marginBottom: 7 }}>
            <span>{item.name}</span>
            <span style={{ color: '#999' }}>×{item.quantity}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px dashed #eee', marginTop: 8, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>
            {isPrepaid ? 'Total (Paid Online)' : 'Collect on Delivery'}
          </span>
          <span style={{ fontWeight: 900, fontSize: 20, color: isPrepaid ? '#059669' : 'var(--accent, #E8334A)' }}>
            {isPrepaid ? '✓ ' : ''}₹{totalAmount}
          </span>
        </div>
      </div>

      {/* Location */}
      {address && (
        <div style={{ padding: '18px 22px 0' }}>
          <div style={{ fontSize: 11, color: '#999', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            Location
          </div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>📍 {address}</div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700,
                color: '#1a73e8', background: '#e8f0fe', padding: '8px 14px', borderRadius: 8, textDecoration: 'none',
              }}
            >
              🗺️ Open in Google Maps ↗
            </a>
          )}
        </div>
      )}

      {/* Tear line */}
      <div style={{
        margin: '20px -1px 0', height: 16,
        background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #f5f5f5 10px, #f5f5f5 20px)',
      }} />

      {/* Footer instruction */}
      <div style={{ padding: '16px 22px 22px' }}>
        <div style={{
          background: 'var(--accent-bg, #fdeaec)', border: '1px solid var(--accent, #E8334A)', borderRadius: 10,
          padding: '12px 14px', fontSize: 13, color: '#7a1a26', fontWeight: 600, lineHeight: 1.5,
        }}>
          📢 Please tell the customer to mark this order as <strong>Collected</strong> on their page once it's delivered.
        </div>
      </div>
    </div>
  )
}
