'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function VendorLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login() {
    if (!email || !password) { setError('Incorrect email or password'); return }
    setLoading(true)
    setError('')
    try {
      // Go through the hardened server route (validation + rate limit + lockout).
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.session) {
        setError(data?.error || 'Incorrect email or password')
        setLoading(false)
        return
      }
      const { error: setErr } = await supabase.auth.setSession(data.session)
      if (setErr) { setError('Incorrect email or password'); setLoading(false); return }
      const { data: cafeteria } = await supabase.from('cafeterias').select('id').eq('vendor_email', email).single()
      if (!cafeteria) { setError('No cafeteria linked to this account.'); await supabase.auth.signOut(); setLoading(false); return }
      router.push('/vendor')
    } catch { setError('Connection error. Check your internet.'); setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav className="y-nav">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Yoters" style={{ width: 100, height: 100, objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: 32, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>Yoters</span>
          </div>
        </Link>
      </nav>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ width:'100%', maxWidth:420 }} className="scale-in">
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🐧</div>
            <h1 style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:700, color:'var(--navy)', marginBottom:6 }}>Vendor Login</h1>
            <p style={{ fontSize:14, color:'var(--muted)' }}>Access your restaurant dashboard</p>
          </div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:32 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ fontSize:12, color:'var(--text2)', marginBottom:6, display:'block', fontWeight:600 }}>Email</label>
                <input type="email" placeholder="lethafi@yoters.com" value={email}
                  onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==='Enter' && login()}
                  style={{ width:'100%', padding:'12px 16px' }} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text2)', marginBottom:6, display:'block', fontWeight:600 }}>Password</label>
                <input type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && login()}
                  style={{ width:'100%', padding:'12px 16px' }} />
              </div>
              {error && <div style={{ background:'var(--red-bg)', border:'1px solid rgba(232,51,74,0.2)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'var(--red)' }}>{error}</div>}
              <button onClick={login} disabled={loading} className="btn-primary" style={{ padding:14, fontSize:16, opacity:loading?0.6:1, marginTop:4 }}>
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}