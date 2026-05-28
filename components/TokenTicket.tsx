'use client'

interface TokenTicketProps {
  token: number
  cafeteriaName: string
  items: Array<{ name: string; quantity: number }>
  total: number
  orderId: string
  onClose: () => void
}

export function TokenTicket({ token, cafeteriaName, items, total, orderId, onClose }: TokenTicketProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20,
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: 'white', borderRadius: 24, width: '100%', maxWidth: 340,
        overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
        animation: 'ticketPop 0.4s cubic-bezier(.22,1,.36,1) both',
      }}>
        <style>{`
          @keyframes ticketPop {
            from { opacity:0; transform: scale(0.8) translateY(20px); }
            to   { opacity:1; transform: scale(1) translateY(0); }
          }
          .ticket-tear {
            background: repeating-linear-gradient(
              90deg, transparent, transparent 10px,
              #f5f5f5 10px, #f5f5f5 20px
            );
            height: 16px; margin: 0 -1px;
          }
        `}</style>

        {/* Header */}
        <div style={{ background: 'var(--accent, #E8334A)', padding: '24px 24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            Your Token
          </div>
          <div style={{
            fontSize: 80, fontWeight: 900, color: 'white', lineHeight: 1,
            fontFamily: 'var(--font-head)',
          }}>
            {String(token).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
            {cafeteriaName}
          </div>
        </div>

        {/* Tear line */}
        <div className="ticket-tear" />

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 12, color: '#999', fontWeight: 700, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>
            Order Summary
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#333', marginBottom: 6 }}>
              <span>{item.name}</span>
              <span style={{ color: '#999' }}>x{item.quantity}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed #eee', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15 }}>
            <span>Total Paid</span>
            <span style={{ color: 'var(--accent, #E8334A)' }}>₹{total}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#bbb', textAlign: 'center' }}>
            Order #{orderId.slice(0, 8).toUpperCase()}
          </div>
        </div>

        {/* Tear line */}
        <div className="ticket-tear" />

        {/* Footer */}
        <div style={{ padding: '16px 24px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.5 }}>
            We&apos;ll notify you when your order is ready!<br />
            Show this token at the counter.
          </div>
          <button onClick={onClose} style={{
            width: '100%', padding: '12px', borderRadius: 12, border: 'none',
            background: 'var(--accent, #E8334A)', color: 'white', fontWeight: 700,
            fontSize: 15, cursor: 'pointer',
          }}>
            Track My Order →
          </button>
        </div>
      </div>
    </div>
  )
}
