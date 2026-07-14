'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type AuthMode = 'login' | 'signup' | 'forgot'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  // Open the correct tab when arriving from the landing page (?mode=signup)
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get('mode')
    if (m === 'signup' || m === 'login') setMode(m)
  }, [])

  // After auth, send students to the landing page and vendors to their dashboard
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
    router.push('/?splash=true')
  }

  async function handleLogin() {
    if (!email || !password) { setError('Enter your email and password.'); return }
    setLoading(true); setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) { setError('Invalid credentials. Try again.'); setLoading(false); return }
      await goAfterAuth(email)
    } catch { setError('Connection error. Check your internet.'); setLoading(false) }
  }

  async function handleSignup() {
    if (!name || !email || !password || !phone) { setError('Name, email, password, and phone are required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) { setError(authError.message); setLoading(false); return }
      // Store extra profile info
      if (data.user) {
        await supabase.from('profiles').upsert({
            id: data.user.id,
            name,
            phone: phone || null,
            email,
        })
        await goAfterAuth(email)  // session is already created, go straight in
        return
        }
        // Only hits here if data.user is null (email confirmation required by Supabase settings)
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
      if (resetError) { setError(resetError.message); setLoading(false); return }
      setForgotSent(true)
      setSuccess('Password reset link sent to your email! Check your inbox.')
      setLoading(false)
      setTimeout(() => { setMode('login'); setForgotSent(false); setSuccess('') }, 4000)
    } catch { setError('Connection error. Check your internet.'); setLoading(false) }
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .auth-bg-blob {
          position: fixed; pointer-events: none; z-index: 0; border-radius: 50%; filter: blur(80px); opacity: 0.18;
        }
        .auth-card { animation: authFadeUp 0.45s cubic-bezier(.22,1,.36,1) both; }
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
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
          borderRadius: 20px; padding: 6px 13px; font-size: 12px; color: var(--text2);
          border-radius: 20px;
        }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="Yoters" style={{ width: 38, height: 38, objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>Yoters</span>
            </div>
          </div>
        </div>
        <Link href="/vendor/login" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
          Vendor Login →
        </Link>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 420 }} className="auth-card">

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
          <div className="auth-inner" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 28px', boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>

            {/* Tab toggle */}
            {mode !== 'forgot' && (
              <div style={{ display: 'flex', gap: 4, background: 'var(--surface2)', borderRadius: 11, padding: 4, marginBottom: 24 }}>
                <button className={`tab-pill ${mode === 'login' ? 'active' : 'inactive'}`} onClick={() => { setMode('login'); setError(''); setSuccess('') }}>
                  Sign In
                </button>
                <button className={`tab-pill ${mode === 'signup' ? 'active' : 'inactive'}`} onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>
                  Create Account
                </button>
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
                  <input
                    className="auth-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    style={inp}
                  />
                  {mode === 'signup' && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>Minimum 6 characters</div>
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

              <button className="submit-btn" onClick={handleSubmit} disabled={loading} style={{ marginTop: 2 }}>
                {loading
                  ? (mode === 'login' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending reset link...')
                  : (mode === 'login' ? 'Sign In →' : mode === 'signup' ? 'Create Account →' : 'Send Reset Link →')
                }
              </button>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)', lineHeight: 1.8 }}>
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
                  <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Terms</span>
                  {' & '}
                  <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Privacy Policy</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}