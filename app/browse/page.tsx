'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUserInfo } from '@/lib/hooks/useUserInfo'
import { Cafeteria, CafeteriaQueue, formatWait, getWaitLevel } from '@/lib/types'

interface CafeteriaWithQueue extends Cafeteria { queue: CafeteriaQueue }

export default function StudentHome() {
  const { user } = useUserInfo()
  const [cafeterias, setCafeterias] = useState<CafeteriaWithQueue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const router = useRouter()

  // Check if user is vendor and redirect
  useEffect(() => {
    const checkVendor = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: cafeteria } = await supabase
          .from('cafeterias')
          .select('id')
          .eq('vendor_email', session.user.email)
          .single()
        if (cafeteria) {
          router.replace('/vendor')
        }
      }
    }
    checkVendor()
  }, [router])

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from('cafeterias')
      .select('*, queue:cafeteria_queues(*)')
      .eq('is_open', true)
      .order('name')
    if (data) setCafeterias(data as CafeteriaWithQueue[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const ch = supabase.channel('student-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafeteria_queues' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchData])

  const filtered = cafeterias.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  )

  const waitColor = (level: string) => ({
    low: { bg: 'var(--green-bg)', color: 'var(--green)', border: 'rgba(46,158,107,0.2)' },
    mid: { bg: 'var(--yellow-bg)', color: 'var(--yellow)', border: 'rgba(212,130,26,0.2)' },
    high: { bg: 'var(--red-bg)', color: 'var(--red)', border: 'rgba(232,51,74,0.2)' },
  }[level] ?? { bg: 'var(--surface2)', color: 'var(--muted)', border: 'var(--border)' })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .browse-nav { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; border-bottom:1px solid var(--border); position:sticky; top:0; background:rgba(253,248,245,0.95); backdrop-filter:blur(12px); z-index:100; }
        .browse-hero { padding:32px 20px 20px; }
        .browse-stats { padding:0 20px; }
        .browse-list { padding:24px 20px 100px; }
        .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); background:var(--surface); border-radius:var(--radius-lg); border:1px solid var(--border); overflow:hidden; }
        .stat-cell { padding:16px 12px; text-align:center; }
        .stat-cell:not(:last-child) { border-right:1px solid var(--border); }
        .stat-val { font-family:var(--font-head); font-size:24px; font-weight:700; }
        .stat-label { font-size:10px; color:var(--muted); margin-top:2px; line-height:1.3; }
        .cafe-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:16px; }
        .search-input { width:100%; padding:13px 18px; margin-bottom:20px; background:var(--surface); border:1px solid var(--border2); border-radius:var(--radius); font-size:15px; }
        @media (max-width: 768px) {
          .browse-hero { padding:24px 16px 16px; }
          .browse-stats { padding:0 16px; }
          .browse-list { padding:20px 16px 90px; }
          .stat-cell { padding:14px 8px; }
          .stat-val { font-size:20px; }
          .stat-label { font-size:9px; }
          .cafe-grid { grid-template-columns:1fr; gap:12px; }
          .cafe-card-inner { display:flex; align-items:center; gap:14px; padding:14px; }
          .cafe-card-emoji { width:60px; height:60px; font-size:30px; flex-shrink:0; border-radius:12px; display:flex; align-items:center; justify-content:center; }
          .cafe-card-img { display:none; }
          .cafe-card-body { flex:1; }
          .h1-browse { font-size:26px !important; letter-spacing:-0.5px !important; }
        }
        @media (min-width: 769px) {
          .cafe-card-inner { display:none; }
        }
      `}</style>

      {/* NAV */}
      <nav className="browse-nav">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Yoters" style={{ width: 48, height: 48, objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>Yoters</span>
          </div>
        </Link>
        <Link href="/mobile/profile">
          <button style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            fontSize: 18,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(232,51,74,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
          </button>
        </Link>
      </nav>

      {/* HERO */}
      <div className="browse-hero" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-light)', border: '1px solid var(--accent-light2)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 14px', borderRadius: 20, marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Live Queue Visibility
        </div>
        <h1 className="h1-browse" style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(28px,5vw,58px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: -1, marginBottom: 10, color: 'var(--navy)' }}>
          Pre-book your meal.<br />
          <span style={{ color: 'var(--accent)' }}>Walk in. Pick up. Leave.</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 460, lineHeight: 1.65 }}>
          Browse campus cafeterias, pre-order your food, and skip the queue entirely.
        </p>
      </div>

      {/* LIST */}
      <div className="browse-list" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <input
          className="search-input"
          placeholder="Search cafeteria or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Loading cafeterias...</div>
        ) : (
          <>
            {/* DESKTOP grid */}
            <div className="cafe-grid">
              {filtered.map((c, idx) => {
                const wait = c.queue?.avg_wait_mins ?? 0
                const level = getWaitLevel(wait)
                const wc = waitColor(level)
                return (
                  <div key={c.id} className="card" style={{ overflow: 'hidden' }}>
                    {/* Desktop image header */}
                    <div className="cafe-card-img" style={{ height: 120, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, position: 'relative' }}>
                      {c.image_emoji}
                      <div style={{ position: 'absolute', top: 12, right: 12, background: wc.bg, color: wc.color, border: `1.5px solid ${wc.color}`, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                        {formatWait(wait)}
                      </div>
                    </div>
                    {/* Mobile row layout */}
                    <div className="cafe-card-inner">
                      <div className="cafe-card-emoji" style={{ background: wc.bg }}>
                        {c.image_emoji}
                      </div>
                      <div className="cafe-card-body">
                        <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>📍 {c.location}</div>
                        <div />
                      </div>
                    </div>
                    {/* Desktop body */}
                    <div style={{ padding: 18 }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, marginBottom: 3, color: 'var(--navy)' }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>📍 {c.location}</div>
                      {c.description && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>{c.description}</div>}
                      <Link href={`/student?cafeteria=${c.id}`} style={{ display: 'block', marginTop: 12 }}>
                        <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>Pre-order →</button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>No cafeterias found for &quot;{search}&quot;</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
