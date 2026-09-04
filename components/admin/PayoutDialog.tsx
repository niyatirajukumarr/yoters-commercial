'use client'

import { apiFetch } from '@/lib/api'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { buildUpiLink, buildUpiQrPayload, UPI_APPS, type UpiApp } from '@/lib/upi'

export type PayoutTarget = {
  id: string
  name: string
  upi_id: string | null
  pending_payout: number
}

type Props = {
  cafe: PayoutTarget
  onClose: () => void
  /** Called after the payout is successfully written to the ledger. */
  onRecorded: () => void
}

// Paying happens in the admin's own UPI app — this dialog only hands them a
// pre-filled link and then records what they say they sent. Nothing here can
// observe the transfer, which is why recording it is a separate, explicit step
// rather than something assumed on tapping the link.
export function PayoutDialog({ cafe, onClose, onRecorded }: Props) {
  const [qr, setQr] = useState<string | null>(null)
  const [reference, setReference] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [opened, setOpened] = useState(false)

  const amount = cafe.pending_payout
  const vpa = cafe.upi_id || ''
  const request = { vpa, payeeName: cafe.name, amount, note: `Yoters payout ${cafe.name}` }

  useEffect(() => {
    if (!vpa) return
    QRCode.toDataURL(buildUpiQrPayload(request), { margin: 1, width: 220 })
      .then(setQr)
      .catch(() => setQr(null))
    // Regenerating only when the destination or amount changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vpa, amount, cafe.name])

  const openApp = (app: UpiApp) => {
    setOpened(true)
    window.location.href = buildUpiLink(request, app)
  }

  async function record() {
    setError('')
    if (!reference.trim()) {
      setError('Enter the UPI reference / transaction ID so this payment can be traced later.')
      return
    }
    setSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      const res = await apiFetch('/api/admin/record-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ cafeteriaId: cafe.id, amount, reference: reference.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not record the payout')
      onRecorded()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record the payout')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, padding: 22, width: '100%', maxWidth: 420,
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>Pay {cafe.name}</div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          ₹{amount.toLocaleString()} to <strong>{vpa || 'no UPI ID saved'}</strong>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 8 }}>
          1. Pay from your phone
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {UPI_APPS.map(app => (
            <button
              key={app.id}
              onClick={() => openApp(app.id)}
              disabled={!vpa}
              style={{
                padding: '11px 8px', borderRadius: 10, border: '1.5px solid #e2e2e6',
                background: '#fff', fontWeight: 700, fontSize: 13,
                cursor: vpa ? 'pointer' : 'not-allowed',
              }}
            >
              {app.label}
            </button>
          ))}
        </div>

        {qr && (
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
              On a computer? Scan this from any UPI app —<br />the amount is already filled in.
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="UPI QR code" width={180} height={180} style={{ borderRadius: 10 }} />
          </div>
        )}

        <div style={{ height: 1, background: '#eee', margin: '4px 0 14px' }} />

        <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>
          2. Then record it here
        </div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 10, lineHeight: 1.5 }}>
          The app can&apos;t see your UPI payment, so this is what keeps &ldquo;Pending&rdquo; correct.
          Until you record it, this ₹{amount.toLocaleString()} stays owed and could be paid twice.
        </div>
        <input
          value={reference}
          onChange={e => setReference(e.target.value)}
          placeholder="UPI reference / transaction ID"
          style={{
            width: '100%', padding: '11px 12px', borderRadius: 10,
            border: '1.5px solid #e2e2e6', fontSize: 13, marginBottom: 10,
          }}
        />

        {error && (
          <div style={{ fontSize: 12, color: '#c62828', background: '#ffebee', padding: '8px 10px', borderRadius: 8, marginBottom: 10 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #e2e2e6',
              background: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={record}
            disabled={saving || !reference.trim()}
            style={{
              flex: 2, padding: '12px', borderRadius: 10, border: 'none',
              background: reference.trim() && !saving ? '#2e9e6b' : '#ccc',
              color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: reference.trim() && !saving ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'Recording…' : `Mark ₹${amount.toLocaleString()} as paid`}
          </button>
        </div>

        {opened && !reference.trim() && (
          <div style={{ fontSize: 11, color: '#d4821a', marginTop: 10, textAlign: 'center' }}>
            Paid in your UPI app? Paste the reference above so it&apos;s recorded.
          </div>
        )}
      </div>
    </div>
  )
}
