export default function Loading() {
  return (
    <div style={{ paddingBottom: 100 }}>
      <style>{`
        .sk { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 200% 100%; animation: sk 1.4s infinite; border-radius: 8px; }
        @keyframes sk { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
      <div style={{ padding: '16px 16px 0', marginBottom: 16 }}>
        <div className="sk" style={{ height: 32, width: 200, marginBottom: 4 }} />
      </div>
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div className="sk" style={{ height: 44, borderRadius: 10 }} />
      </div>
      <div style={{ padding: '0 16px' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(26,31,46,0.08)', marginBottom: 12 }}>
            <div className="sk" style={{ height: 140, borderRadius: 0 }} />
            <div style={{ padding: 16, background: 'white' }}>
              <div className="sk" style={{ height: 16, width: '55%', marginBottom: 8 }} />
              <div className="sk" style={{ height: 12, width: '38%', marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="sk" style={{ height: 26, width: 80 }} />
                <div className="sk" style={{ height: 26, width: 90 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
