'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { validatePassword } from '@/lib/validation'

export const dynamic = 'force-dynamic'

function ResetPasswordContent() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isValidToken, setIsValidToken] = useState(true)

  useEffect(() => {
    // Check if there's a valid session (token in URL)
    const checkToken = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setIsValidToken(false)
        setError('Reset link is invalid or expired. Please request a new one.')
      }
    }
    checkToken()
  }, [])

  async function handleResetPassword() {
    if (!password || !confirmPassword) {
      setError('Please enter and confirm your password.')
      return
    }
    const pw = validatePassword(password)
    if (!pw.ok) {
      setError(pw.message!)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError('Could not reset your password. The link may have expired — please request a new one.')
        setLoading(false)
        return
      }

      setSuccess('Password reset successfully! Redirecting to login...')
      setLoading(false)
      setTimeout(() => {
        router.push('/auth')
      }, 2000)
    } catch (err: any) {
      setError('Failed to reset password. Please try again.')
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const lbl: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--text2)',
    marginBottom: 6,
    display: 'block',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .auth-bg-blob {
          position: fixed; pointer-events: none; z-index: 0; border-radius: 50%; filter: blur(80px); opacity: 0.18;
        }
        .auth-input:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px rgba(var(--accent-rgb,220,100,50),0.12); }
        .submit-btn {
          width: 100%; padding: 13px; border-radius: 11px; border: none;
          background: var(--accent); color: white; font-size: 15px; font-weight: 700;
          cursor: pointer; font-family: var(--font-body); letter-spacing: 0.2px;
          transition: opacity 0.15s, transform 0.1s;
        }
        .submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        @media (max-width: 480px) {
          .auth-inner { padding: 24px 20px !important; }
          .auth-hero { padding: 0 !important; margin-bottom: 28px !important; }
        }
      `}</style>

      {/* Decorative bg blobs */}
      <div className="auth-bg-blob" style={{ width: 400, height: 400, background: 'var(--accent)', top: -100, right: -100 }} />
      <div className="auth-bg-blob" style={{ width: 300, height: 300, background: '#7c5cfc', bottom: -50, left: -80 }} />

      {/* Nav */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', borderBottom: '1px solid var(--border)', background: 'rgba(253,248,245,0.85)', backdropFilter: 'blur(16px)' }}>
        <Link href="/auth" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Yoters" style={{ width: 38, height: 38, objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>Yoters</span>
            </div>
          </div>
        </Link>
        <Link href="/vendor/login" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
          Vendor Login →
        </Link>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', zIndex: 1 }}>
        <motion.div
          style={{ width: '100%', maxWidth: 420 }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >

          {/* Hero */}
          <div className="auth-hero" style={{ textAlign: 'center', marginBottom: 32, padding: '0 8px' }}>
            <div style={{ fontSize: 52, marginBottom: 10, lineHeight: 1 }}>🔐</div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 800, color: 'var(--navy)', margin: '0 0 8px' }}>
              Reset Your Password
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
              Enter a new password to regain access to your account.
            </p>
          </div>

          {/* Card */}
          <div className="auth-inner" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 28px', boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>

            {isValidToken ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={lbl}>New Password *</label>
                  <input
                    className="auth-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                    style={inp}
                  />
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>At least 8 characters, including a letter and a number</div>
                </div>

                <div>
                  <label style={lbl}>Confirm Password *</label>
                  <input
                    className="auth-input"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                    style={inp}
                  />
                </div>

                {error && (
                  <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(232,51,74,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--red)' }}>
                    {error}
                  </div>
                )}

                {success && (
                  <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(46,158,107,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--green)' }}>
                    {success}
                  </div>
                )}

                <motion.button
                  className="submit-btn"
                  onClick={handleResetPassword}
                  disabled={loading}
                  style={{ marginTop: 2 }}
                  whileHover={!loading ? { scale: 1.015, y: -1 } : undefined}
                  whileTap={!loading ? { scale: 0.98 } : undefined}
                >
                  {loading ? 'Resetting password...' : 'Reset Password →'}
                </motion.button>

                <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
                  <Link href="/auth" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                    ← Back to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
                <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(232,51,74,0.2)', borderRadius: 10, padding: '16px 14px', fontSize: 13, color: 'var(--red)' }}>
                  {error}
                </div>
                <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>
                  The password reset link has expired or is invalid.
                </p>
                <Link href="/auth" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', marginTop: 10 }}>
                  Request a new password reset
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
