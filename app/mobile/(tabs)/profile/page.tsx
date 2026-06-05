'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useUserInfo } from '@/lib/hooks/useUserInfo'
import { useCart } from '@/lib/hooks/useCart'
import { Edit2, Trash2, Heart, Trash } from 'lucide-react'
import { useFavourites } from '@/lib/hooks/useFavourites'

export default function MobileProfile() {
  const { user, updateUser, isLoaded } = useUserInfo()
  const { clear: clearCart } = useCart()
  const { favourites, removeFavourite, isLoaded: favsLoaded } = useFavourites()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' })
  const [notifications, setNotifications] = useState(true)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
      })
    }
  }, [user])

  const handleSave = () => {
    if (formData.name && formData.phone) {
      updateUser(formData)
      setEditing(false)
    }
  }

  if (!isLoaded) {
    return (
      <div style={{ padding: 'var(--mobile-spacing)' }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          Profile
        </div>
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 'var(--mobile-spacing)' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          Profile
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          Manage your account information
        </div>
      </div>

      {/* User Info Section */}
      {editing ? (
        <div className="mobile-card" style={{ padding: 'var(--mobile-spacing)', marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>
            Edit Profile
          </h3>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              className="mobile-input"
              placeholder="Your name"
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
              className="mobile-input"
              placeholder="+91 98765 43210"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
              className="mobile-input"
              placeholder="your@email.com"
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              className="mobile-btn mobile-btn-primary"
              style={{ flex: 1 }}
            >
              Save Changes
            </button>
            <button
              onClick={() => setEditing(false)}
              className="mobile-btn mobile-btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mobile-card" style={{ padding: 'var(--mobile-spacing)', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              Account Info
            </h3>
            <button
              onClick={() => setEditing(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: 'var(--accent)',
              }}
            >
              <Edit2 size={18} />
            </button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
              Name
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)' }}>
              {user?.name || 'Not set'}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
              Phone
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)' }}>
              {user?.phone || 'Not set'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
              Email
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)' }}>
              {user?.email || 'Not set'}
            </div>
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="mobile-card" style={{ padding: 'var(--mobile-spacing)', marginBottom: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>
          Preferences
        </h3>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={notifications}
              onChange={e => setNotifications(e.target.checked)}
              style={{ width: 20, height: 20, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 14, color: 'var(--text)' }}>
              Notify when order is ready
            </span>
          </label>
        </div>
      </div>

      {/* Favourites */}
      <div className="mobile-card" style={{ padding: 'var(--mobile-spacing)', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Heart size={18} color="#E8334A" fill="#E8334A" />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Favourites
          </h3>
        </div>
        {!favsLoaded ? (
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Loading...</div>
        ) : favourites.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>
            No favourites yet. Tap the ♡ on any menu item to save it here.
          </div>
        ) : (
          favourites.map(fav => (
            <div
              key={fav.menuId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid rgba(26,31,46,0.06)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  {fav.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {fav.cafeteriaName} · ₹{fav.price}
                </div>
              </div>
              <button
                onClick={() => removeFavourite(fav.menuId)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--muted)' }}
                aria-label="Remove from favourites"
              >
                <Trash size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Danger Zone */}
      <div className="mobile-card" style={{ padding: 'var(--mobile-spacing)', borderColor: 'rgba(232,51,74,0.2)', backgroundColor: 'rgba(232,51,74,0.02)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
          Danger Zone
        </h3>

        <button
          onClick={clearCart}
          style={{
            width: '100%',
            padding: '12px 14px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid rgba(232,51,74,0.3)',
            borderRadius: 'var(--mobile-radius)',
            background: 'white',
            color: '#E8334A',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 'var(--mobile-touch-min)',
          }}
        >
          <Trash2 size={16} />
          Clear Cart
        </button>

        <a
          href="/"
          style={{
            width: '100%',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 'var(--mobile-radius)',
            background: '#f5f5f5',
            color: 'var(--text)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 'var(--mobile-touch-min)',
            textDecoration: 'none',
            border: 'none',
            justifyContent: 'center',
          }}
        >
          Back to Home
        </a>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 28, paddingBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          Yoters v1.0 - Built for students
        </div>
      </div>
    </div>
  )
}
