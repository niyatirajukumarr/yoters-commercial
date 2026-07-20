'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'yoters_cookie_consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      // localStorage unavailable (private mode / disabled) — don't block the app on it.
    }
  }, [])

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie notice"
          className="cookie-consent-banner"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            zIndex: 500,
            maxWidth: 560,
            margin: '0 auto',
            background: 'var(--navy)',
            color: 'white',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <style>{`
            .cookie-consent-banner { bottom: calc(16px + env(safe-area-inset-bottom, 0px)); }
            @media (max-width: 600px) {
              .cookie-consent-banner { bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }
            }
          `}</style>
          <div style={{ flex: '1 1 260px', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
            We use only essential cookies to keep you signed in — no ads, no tracking.{' '}
            <Link href="/privacy#cookies" style={{ color: '#ff8fa3', fontWeight: 600 }}>Learn more</Link>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={dismiss}
            style={{
              flexShrink: 0,
              padding: '10px 22px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Got it
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
