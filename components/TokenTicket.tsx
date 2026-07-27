'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { hoverScale } from '@/lib/motion'

interface TokenTicketProps {
  token: number
  cafeteriaName: string
  items: Array<{ name: string; quantity: number }>
  total: number
  orderId: string
  onClose: () => void
}

// Drawn on a canvas rather than rasterizing the DOM node (html2canvas et al.
// choke on gradients/custom fonts and add a dependency for something this
// simple) — the ticket's layout is plain enough to redraw directly.
function drawTicketImage(props: TokenTicketProps): Promise<Blob | null> {
  const { token, cafeteriaName, items, total, orderId } = props
  const scale = 2
  const width = 640
  const rowHeight = 26
  const height = 520 + items.length * rowHeight
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  ctx.scale(scale, scale)

  const accent = '#E8334A'

  // Card background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // Header
  const headerHeight = 220
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, width, headerHeight)

  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = '700 20px sans-serif'
  ctx.fillText('Y O U R   T O K E N', width / 2, 56)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 140px sans-serif'
  ctx.fillText(String(token).padStart(2, '0'), width / 2, 168)

  ctx.font = '400 22px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText(cafeteriaName, width / 2, 202)

  // Tear line
  ctx.strokeStyle = '#eeeeee'
  ctx.lineWidth = 3
  ctx.setLineDash([10, 8])
  ctx.beginPath()
  ctx.moveTo(0, headerHeight + 14)
  ctx.lineTo(width, headerHeight + 14)
  ctx.stroke()
  ctx.setLineDash([])

  // Order summary
  let y = headerHeight + 60
  ctx.textAlign = 'left'
  ctx.fillStyle = '#999999'
  ctx.font = '700 18px sans-serif'
  ctx.fillText('ORDER SUMMARY', 40, y)
  y += 34

  ctx.font = '400 22px sans-serif'
  items.forEach(item => {
    ctx.fillStyle = '#333333'
    ctx.textAlign = 'left'
    ctx.fillText(item.name, 40, y)
    ctx.fillStyle = '#999999'
    ctx.textAlign = 'right'
    ctx.fillText(`x${item.quantity}`, width - 40, y)
    y += rowHeight
  })

  y += 8
  ctx.strokeStyle = '#eeeeee'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  ctx.moveTo(40, y)
  ctx.lineTo(width - 40, y)
  ctx.stroke()
  ctx.setLineDash([])
  y += 40

  ctx.font = '700 24px sans-serif'
  ctx.fillStyle = '#1a1a1a'
  ctx.textAlign = 'left'
  ctx.fillText('Total Paid', 40, y)
  ctx.fillStyle = accent
  ctx.textAlign = 'right'
  ctx.fillText(`₹${total}`, width - 40, y)
  y += 36

  ctx.font = '400 16px sans-serif'
  ctx.fillStyle = '#bbbbbb'
  ctx.textAlign = 'center'
  ctx.fillText(`Order #${orderId.slice(0, 8).toUpperCase()}`, width / 2, y)
  y += 30

  ctx.strokeStyle = '#eeeeee'
  ctx.lineWidth = 3
  ctx.setLineDash([10, 8])
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(width, y)
  ctx.stroke()
  ctx.setLineDash([])
  y += 46

  ctx.font = '400 18px sans-serif'
  ctx.fillStyle = '#666666'
  ctx.textAlign = 'center'
  ctx.fillText('Your order is ready!', width / 2, y)
  y += 30
  ctx.font = '700 20px sans-serif'
  ctx.fillStyle = '#222222'
  ctx.fillText('Show this token at the counter to collect it.', width / 2, y)

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

export function TokenTicket(props: TokenTicketProps) {
  const { token, cafeteriaName, items, total, orderId, onClose } = props
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const blob = await drawTicketImage(props)
      if (!blob) return
      const filename = `yoters-token-${String(token).padStart(2, '0')}.png`
      const file = new File([blob], filename, { type: 'image/png' })

      // Web Share (with files) puts it straight into "Save Image"/Photos on
      // supporting mobile browsers — the actual "save to gallery" experience.
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: filename })
          return
        } catch {
          // User cancelled the share sheet, or share failed — fall through
          // to a plain download so they still get the file.
        }
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20,
      backdropFilter: 'blur(2px)',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
        position: 'relative', background: 'white', borderRadius: 24, width: '100%', maxWidth: 340,
        overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
      }}>
        <style>{`
          .ticket-tear {
            background: repeating-linear-gradient(
              90deg, transparent, transparent 10px,
              #f5f5f5 10px, #f5f5f5 20px
            );
            height: 16px; margin: 0 -1px;
          }
          .ticket-close-btn {
            position: absolute; top: 14px; right: 14px; z-index: 1;
            width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer;
            background: rgba(255,255,255,0.2); color: white; font-size: 16px; font-weight: 700;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.4), 0 0 16px 4px rgba(255,255,255,0.55);
          }
        `}</style>

        <motion.button {...hoverScale} className="ticket-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </motion.button>

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
            Your order is ready!<br />
            <span style={{ fontWeight: 700, color: '#222' }}>Show this token at the counter to collect it.</span>
          </div>
          <motion.button {...(downloading ? {} : hoverScale)} onClick={handleDownload} disabled={downloading} style={{
            width: '100%', padding: '12px', borderRadius: 12, border: 'none',
            background: 'var(--accent, #E8334A)', color: 'white', fontWeight: 700,
            fontSize: 15, cursor: downloading ? 'default' : 'pointer', opacity: downloading ? 0.7 : 1,
          }}>
            {downloading ? 'Saving...' : '⬇ Save Receipt'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
