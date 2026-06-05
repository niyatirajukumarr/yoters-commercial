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
        @import url('https://fonts.googleapis.com/css2?family=Allura&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes tilt { 0% { transform: perspective(1000px) rotateX(0) rotateY(0); } 100% { transform: perspective(1000px) rotateX(2deg) rotateY(2deg); } }

        .browse-nav { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; border-bottom:1px solid var(--border); position:sticky; top:0; background:rgba(253,248,245,0.95); backdrop-filter:blur(12px); z-index:100; }
        .browse-hero { padding:32px 20px 20px; }
        .browse-list { padding:40px 20px 100px; }
        .search-input { width:100%; padding:13px 18px; margin-bottom:40px; background:var(--surface); border:1px solid var(--border2); border-radius:var(--radius); font-size:15px; }

        .newspaper-grid { display:flex; flex-direction:column; gap:60px; max-width:1100px; margin:0 auto; }

        .cafe-newspaper-card { display:grid; grid-template-columns:1fr 1fr; gap:40px; align-items:center; }
        .cafe-newspaper-card.reversed { direction:rtl; }
        .cafe-newspaper-card.reversed > * { direction:ltr; }

        .cafe-menu-image { position:relative; height:400px; border-radius:12px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.1); cursor:pointer; transition:all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); transform-style:preserve-3d; }
        .cafe-menu-image:hover { box-shadow:0 30px 60px rgba(0,0,0,0.15); transform:translateY(-8px) rotateX(2deg) rotateY(2deg); }
        .cafe-menu-image img { width:100%; height:100%; object-fit:cover; }

        .cafe-info { display:flex; flex-direction:column; justify-content:center; padding:20px; }
        .cafe-name { font-family:'Allura', cursive; font-size:64px; font-weight:400; color:var(--accent); margin-bottom:12px; line-height:1; }
        .cafe-location { font-size:14px; color:var(--muted); margin-bottom:16px; display:flex; align-items:center; gap:6px; }
        .cafe-description { font-size:15px; color:var(--text2); line-height:1.7; margin-bottom:24px; }
        .cafe-see-menu-btn { display:inline-block; padding:12px 28px; background:var(--accent); color:white; border:none; border-radius:8px; font-weight:600; font-size:14px; cursor:pointer; transition:all 0.3s; text-decoration:none; }
        .cafe-see-menu-btn:hover { transform:scale(1.05); box-shadow:0 8px 20px rgba(232,51,74,0.3); }

        @media (max-width: 900px) {
          .cafe-newspaper-card { grid-template-columns:1fr; gap:20px; }
          .cafe-newspaper-card.reversed { direction:ltr; }
          .cafe-menu-image { height:280px; }
          .cafe-name { font-size:48px; }
          .browse-list { padding:20px 20px 90px; }
        }
        @media (max-width: 480px) {
          .newspaper-grid { gap:40px; }
          .cafe-menu-image { height:220px; }
          .cafe-name { font-size:36px; }
          .cafe-info { padding:0; }
          .h1-browse { font-size:26px !important; }
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
      <div className="browse-list">
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
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>No cafeterias found for &quot;{search}&quot;</div>
            ) : (
              <div className="newspaper-grid">
                {filtered.map((c, idx) => (
                  <div key={c.id} className={`cafe-newspaper-card ${idx % 2 === 1 ? 'reversed' : ''}`}>
                    {/* Menu Image with Tilt Effect */}
                    <div className="cafe-menu-image">
                      <img
                        src={c.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop'}
                        alt={c.name}
                      />
                    </div>

                    {/* Restaurant Info */}
                    <div className="cafe-info">
                      <h2 className="cafe-name">{c.name}</h2>
                      <div className="cafe-location">
                        📍 {c.location}
                      </div>
                      <p className="cafe-description">
                        {c.description || 'Discover delicious meals and skip the queue. Pre-order your favorites now!'}
                      </p>
                      <Link href={`/mobile/order/${c.id}`}>
                        <button className="cafe-see-menu-btn">
                          See Full Menu →
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
