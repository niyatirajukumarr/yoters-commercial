'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { validatePassword, isValidEmail, isValidPhone } from '@/lib/validation'
import { CONSENT_VERSION } from '@/lib/config'

// 3D penguin (Three.js) — client only, lazy-loaded so it never blocks the form
const PenguinScene = dynamic(() => import('@/components/PenguinScene'), { ssr: false })

type AuthMode = 'login' | 'signup' | 'forgot'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [consent, setConsent] = useState(false)

  // Open the correct tab when arriving from the landing page (?mode=signup)
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get('mode')
    if (m === 'signup' || m === 'login') setMode(m)
  }, [])

  // After auth, send students straight to browse and vendors to their dashboard
  async function goAfterAuth(userEmail?: string | null) {
    try {
      if (userEmail) {
        const { data: cafeteria } = await supabase
          .from('cafeterias')
          .select('id')
          .eq('vendor_email', userEmail)
          .single()
        if (cafeteria) { router.push('/vendor'); return }
      }
    } catch { /* not a vendor — fall through */ }
    router.push('/browse')
  }

  async function handleLogin() {
    // Client checks are a UX convenience only — the /api/auth/login route
    // re-validates everything server-side and enforces rate limiting + lockout.
    if (!email || !password) { setError('Incorrect email or password'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.session) {
        // Single generic message for wrong email, wrong password, OR lockout.
        setError(data?.error || 'Incorrect email or password')
        setLoading(false)
        return
      }
      // Establish the browser session from the server-verified tokens.
      const { error: setErr } = await supabase.auth.setSession(data.session)
      if (setErr) { setError('Incorrect email or password'); setLoading(false); return }
      await goAfterAuth(email)
    } catch { setError('Connection error. Check your internet.'); setLoading(false) }
  }

  async function handleSignup() {
    // Mirror the server rules for fast feedback; the server is authoritative.
    if (!name || !email || !password || !phone) { setError('Please check your details and try again.'); return }
    if (!isValidEmail(email)) { setError('Please check your details and try again.'); return }
    if (!isValidPhone(phone)) { setError('Please check your details and try again.'); return }
    const pw = validatePassword(password)
    if (!pw.ok) { setError(pw.message!); return }
    // DPDP: no account without explicit, recorded consent to the privacy notice.
    if (!consent) { setError('Please agree to the Privacy Policy and Terms to continue.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone, consent: true, consentVersion: CONSENT_VERSION }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        // Never confirms whether the email already exists.
        setError(data?.error || 'Could not create your account. Please check your details and try again.')
        setLoading(false)
        return
      }
      if (data.session) {
        const { error: setErr } = await supabase.auth.setSession(data.session)
        if (!setErr) { await goAfterAuth(email); return }
      }
      // No session → email confirmation is required by Supabase settings.
      setSuccess('Account created! Check your email to confirm, then log in.')
      setLoading(false)
      setTimeout(() => { setMode('login'); setSuccess('') }, 3000)
    } catch { setError('Connection error. Check your internet.'); setLoading(false) }
  }

  async function handleForgotPassword() {
    if (!email) { setError('Enter your email address.'); return }
    setLoading(true); setError('')
    try {
      // Use production URL for password reset link
      const resetUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset`
        : `${window.location.origin}/auth/reset`

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl,
      })
      // Do not reveal whether the email exists — show the same confirmation
      // regardless (prevents account enumeration). We intentionally swallow the
      // error and never log any credential material.
      void resetError
      setForgotSent(true)
      setSuccess("If that email is registered, you'll receive a reset link")
      setLoading(false)
      setTimeout(() => { setMode('login'); setForgotSent(false); setSuccess('') }, 4000)
    } catch { setError('Connection error. Check your internet.'); setLoading(false) }
  }

  // Social login via Supabase Auth (provider must be enabled in the Supabase
  // dashboard: Authentication → Providers → Google).
  async function handleOAuth(provider: 'google') {
    setError('')
    // Must redirect to a proxy-public path: the session is only established
    // client-side (detectSessionInUrl) once this page's JS runs, and proxy.ts
    // would otherwise bounce an unauthenticated-looking request straight back
    // to /auth before that JS ever executes. '/' handles the post-OAuth bounce
    // to /browse itself once the session is detected (see app/page.tsx).
    const redirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/`
      : `${window.location.origin}/`
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })
    if (oauthError) setError('Could not start social sign-in. Please try again.')
  }

  const handleSubmit = mode === 'login' ? handleLogin : (mode === 'signup' ? handleSignup : handleForgotPassword)

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
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <style>{`
        .tab-pill {
          flex: 1; padding: 10px; border: none; font-size: 14px; font-weight: 600;
          font-family: var(--font-body); cursor: pointer; transition: all 0.2s; border-radius: 9px;
          letter-spacing: 0.2px;
        }
        .tab-pill.active { background: var(--accent); color: white; box-shadow: 0 2px 12px rgba(var(--accent-rgb,220,100,50),0.25); }
        .tab-pill.inactive { background: transparent; color: var(--muted); }
        .tab-pill.inactive:hover { color: var(--text); background: var(--surface2); }
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
        .divider-row { display: flex; align-items: center; gap: 12px; margin: 6px 0; }
        .divider-line { flex: 1; height: 1px; background: var(--border); }
        .guest-btn {
          width: 100%; padding: 11px; border-radius: 11px; background: var(--surface2);
          border: 1px solid var(--border); color: var(--text2); font-size: 14px;
          font-weight: 600; cursor: pointer; font-family: var(--font-body);
          transition: background 0.15s, color 0.15s;
        }
        .guest-btn:hover { background: var(--surface); color: var(--text); }
        .feature-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 20px; padding: 6px 13px; font-size: 12px; color: var(--text2);
        }

        /* Split layout: form left, penguin standing on the right, spotlight glow behind both */
        .auth-split { position: relative; flex: 1; display: flex; align-items: stretch; min-height: calc(100vh - 68px); }
        .auth-form-col { position: relative; z-index: 2; flex: 1 1 480px; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
        .auth-penguin-col { position: relative; z-index: 1; flex: 1 1 520px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .auth-penguin-stage { transform: scale(1.9); transform-origin: center; }

        @media (max-width: 900px) {
          .auth-split { flex-direction: column; min-height: 0; }
          .auth-penguin-col { flex: 0 0 240px; }
          .auth-penguin-stage { transform: scale(1.05); }
        }
        @media (max-width: 480px) {
          .auth-inner { padding: 24px 20px !important; }
          .auth-hero { padding: 0 !important; margin-bottom: 24px !important; }
          .auth-penguin-col { flex-basis: 190px; }
          .auth-penguin-stage { transform: scale(0.82); }
        }
      `}</style>

      {/* Ambient spotlight glow — same idea as the Spline "Spotlight" pattern:
          a large, soft radial glow drifting behind the content on a near-black
          background, just tinted to the brand colors instead of white/blue. */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <motion.div
          initial={{ opacity: 0, x: '-20%', y: '-10%' }}
          animate={{ opacity: 0.55, x: '-10%', y: '-15%' }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: 0, left: 0, width: '70vw', height: '70vw', maxWidth: 900, maxHeight: 900,
            background: 'radial-gradient(circle, rgba(232,51,74,0.35) 0%, transparent 65%)', filter: 'blur(60px)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, x: '20%', y: '10%' }}
          animate={{ opacity: 0.4, x: '15%', y: '10%' }}
          transition={{ duration: 1.6, delay: 0.15, ease: 'easeOut' }}
          style={{
            position: 'absolute', bottom: '-10%', right: '-5%', width: '55vw', height: '55vw', maxWidth: 700, maxHeight: 700,
            background: 'radial-gradient(circle, rgba(124,92,252,0.28) 0%, transparent 65%)', filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Nav */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,10,15,0.75)', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="Yoters" style={{ width: 38, height: 38, objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>Yoters</span>
        </div>
        <Link href="/vendor/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
          Vendor Login →
        </Link>
      </nav>

      {/* Body — split: form / penguin */}
      <div className="auth-split">
        <div className="auth-form-col">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', maxWidth: 420 }}
          >
            {/* Hero */}
            <div className="auth-hero" style={{ textAlign: 'center', marginBottom: 32, padding: '0 8px' }}>
              <div style={{ fontSize: 52, marginBottom: 10, lineHeight: 1 }}>🍱</div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 800, color: 'var(--navy)', margin: '0 0 8px' }}>
                Skip the queue.
              </h1>
              <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
                Order from your favourite restaurant and pick up when it's ready.
              </p>
              {/* Feature chips */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                {['⚡ Real-time queue', '💳 Pay online', '🔔 Get notified'].map(f => (
                  <span key={f} className="feature-chip">{f}</span>
                ))}
              </div>
            </div>

            {/* Card */}
            <div className="auth-inner" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>

              {/* Tab toggle */}
              {mode !== 'forgot' && (
                <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 11, padding: 4, marginBottom: 24 }}>
                  <motion.button whileTap={{ scale: 0.96 }} className={`tab-pill ${mode === 'login' ? 'active' : 'inactive'}`} onClick={() => { setMode('login'); setError(''); setSuccess('') }}>
                    Sign In
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} className={`tab-pill ${mode === 'signup' ? 'active' : 'inactive'}`} onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>
                    Create Account
                  </motion.button>
                </div>
              )}

              {/* Forgot password header */}
              {mode === 'forgot' && (
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>Reset Password</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>We'll send a reset link to your email</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mode === 'signup' && (
                  <div>
                    <label style={lbl}>Your Name *</label>
                    <input
                      className="auth-input"
                      type="text"
                      placeholder="Arjun Mehta"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      style={inp}
                    />
                  </div>
                )}

                {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                  <div>
                    <label style={lbl}>Email *</label>
                    <input
                      className="auth-input"
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      style={inp}
                    />
                  </div>
                )}

                {(mode === 'login' || mode === 'signup') && (
                  <div>
                    <label style={lbl}>Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="auth-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        style={{ ...inp, paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        style={{
                          position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0,
                        }}
                      >
                        {showPassword ? (
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {mode === 'signup' && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>At least 8 characters, including a letter and a number</div>
                    )}
                  </div>
                )}

                {mode === 'login' && (
                  <div style={{ textAlign: 'right', marginTop: -8 }}>
                    <button
                      onClick={() => { setMode('forgot'); setError(''); setPassword(''); setEmail('') }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', fontSize: 12, padding: 0, textDecoration: 'none' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <label style={lbl}>Phone *</label>
                    <input
                      className="auth-input"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      style={inp}
                    />
                  </div>
                )}

                {mode === 'signup' && (
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={e => setConsent(e.target.checked)}
                      style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, cursor: 'pointer' }}
                    />
                    <span>
                      I am 18 or older and I consent to Yoters processing my personal data as described in the{' '}
                      <Link href="/privacy" target="_blank" style={{ color: 'var(--accent)', fontWeight: 600 }}>Privacy Policy</Link>
                      {' '}and I agree to the{' '}
                      <Link href="/terms" target="_blank" style={{ color: 'var(--accent)', fontWeight: 600 }}>Terms</Link>.
                    </span>
                  </label>
                )}

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
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ marginTop: 2 }}
                  whileHover={!loading ? { scale: 1.015, y: -1 } : undefined}
                  whileTap={!loading ? { scale: 0.98 } : undefined}
                >
                  {loading
                    ? (mode === 'login' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending reset link...')
                    : (mode === 'login' ? 'Sign In →' : mode === 'signup' ? 'Create Account →' : 'Send Reset Link →')
                  }
                </motion.button>

                {/* Social login (Google) — only on sign in / sign up */}
                {mode !== 'forgot' && (
                  <>
                    <div className="divider-row">
                      <div className="divider-line" />
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>or continue with</span>
                      <div className="divider-line" />
                    </div>
                    <motion.button
                      type="button"
                      className="guest-btn"
                      onClick={() => handleOAuth('google')}
                      disabled={loading}
                      style={{ width: '100%' }}
                      whileHover={!loading ? { scale: 1.01 } : undefined}
                      whileTap={!loading ? { scale: 0.98 } : undefined}
                    >
                      Google
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => { setMode('signup'); setError(''); setEmail('') }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', fontSize: 12, padding: 0 }}>
                    Sign up free
                  </button>
                </>
              ) : mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button onClick={() => { setMode('login'); setError(''); setName(''); setPhone('') }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', fontSize: 12, padding: 0 }}>
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setMode('login'); setError(''); setForgotSent(false) }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', fontSize: 12, padding: 0 }}>
                    ← Back to Sign In
                  </button>
                </>
              )}
              {mode !== 'forgot' && (
                <>
                  <br />
                  <span style={{ fontSize: 11 }}>
                    By continuing you agree to our{' '}
                    <Link href="/terms" style={{ color: 'var(--accent)' }}>Terms</Link>
                    {' & '}
                    <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>
                  </span>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Penguin standing next to the card — no more "pulling" choreography,
            just a clean fade/rise in; PenguinScene's own drop-in + idle-bob
            animation plays out as a self-contained greeting gesture. */}
        <div className="auth-penguin-col" aria-hidden="true">
          <motion.div
            className="auth-penguin-stage"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <PenguinScene width={340} height={400} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
