'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useUserInfo } from '@/lib/hooks/useUserInfo'
import { generateSlug } from '@/lib/utils/slug'
import { Cafeteria, CafeteriaQueue, formatWait, getWaitLevel } from '@/lib/types'
import { slideLeft, slideRight, viewportOnce } from '@/lib/motion'
import RestaurantMapLoader from '@/components/RestaurantMap.loader'
import { withTimeout } from '@/lib/utils/withTimeout'
import { CAFETERIA_LOGOS } from '@/lib/cafeteriaLogos'
import { AppTabBar } from '@/components/AppTabBar'
import { focusPageSearch } from '@/lib/utils/focusPageSearch'
import { getLethafiLocation } from '@/lib/utils/lethafiLocation'
import { getBombayDineLocation } from '@/lib/utils/bombayDineLocation'

interface CafeteriaWithQueue extends Cafeteria { queue: CafeteriaQueue }

export default function StudentHome() {
  const { user } = useUserInfo()
  // Whether there is a real session, which is not the same as `user` above:
  // useUserInfo reads a name and phone out of local storage, so a guest who
  // once typed their name would otherwise be shown their own initial and a
  // link to a profile page they cannot open.
  const [isAuthed, setIsAuthed] = useState(false)
  const [cafeterias, setCafeterias] = useState<CafeteriaWithQueue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedMaps, setExpandedMaps] = useState<Set<string>>(new Set())
  const [closedNotification, setClosedNotification] = useState(false)
  const router = useRouter()

  // Arriving from the Search tab on a page that has no search box of its own
  // (?focus=search) — land here with the cursor already in the box.
  useEffect(() => {
    if (loading) return
    if (new URLSearchParams(window.location.search).get('focus') !== 'search') return
    const id = setTimeout(() => focusPageSearch(), 80)
    return () => clearTimeout(id)
  }, [loading])

  const toggleMap = (id: string) => {
    setExpandedMaps(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleClosedCafeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setClosedNotification(true)
    setTimeout(() => setClosedNotification(false), 3000)
  }

  // Check if user is vendor and redirect
  useEffect(() => {
    const checkVendor = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthed(Boolean(session))
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
    // Show cached data instantly
    try {
      const cached = sessionStorage.getItem('browse-cache')
      if (cached) {
        setCafeterias(JSON.parse(cached))
        setLoading(false)
      }
    } catch {}

    // Fetch fresh in background
    try {
      const result = await withTimeout(
        supabase
          .from('cafeterias')
          .select('id, name, description, location, image_url, image_emoji, is_open, is_closed, queue:cafeteria_queues(cafeteria_id, avg_wait_mins, queue_count)')
          .order('name'),
        8000,
        'Cafeterias fetch timed out'
      ) as any

      if (result.data) {
        const combined = result.data.map((cafe: any) => ({
          ...cafe,
          queue: cafe.queue && cafe.queue.length > 0 ? cafe.queue[0] : { avg_wait_mins: 0, queue_count: 0 }
        }))
        setCafeterias(combined as CafeteriaWithQueue[])
        sessionStorage.setItem('browse-cache', JSON.stringify(combined))
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const ch = supabase.channel('student-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafeteria_queues' }, fetchData)
      .subscribe()

    // Refetch when tab becomes visible again (handles back navigation)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchData() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      supabase.removeChannel(ch)
      document.removeEventListener('visibilitychange', onVisible)
    }
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
      {closedNotification && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#E8334A', color: 'white', padding: '14px 24px', borderRadius: 8,
          fontSize: 14, fontWeight: 600, zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          The cafe is closed for now, you'll be notified soon!
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Allura&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes tilt { 0% { transform: perspective(1000px) rotateX(0) rotateY(0); } 100% { transform: perspective(1000px) rotateX(2deg) rotateY(2deg); } }
        @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes slideDown { 0% { opacity: 0; transform: translateX(-50%) translateY(-10px); } 100% { opacity: 1; transform: translateX(-50%) translateY(0); } }

        .browse-hero-wrap { position: relative; padding: 36px 0 24px; overflow: hidden; }
        .floating-food-img {
          position: absolute; width: auto; height: auto; object-fit: contain;
          filter: drop-shadow(0 12px 20px rgba(0,0,0,0.25));
          animation: floatY 4.5s ease-in-out infinite; pointer-events: none;
        }
        .ff-burger    { width: 220px; top: 6px;   left: 4px;    animation-delay: 0s; }
        .ff-dumplings { width: 150px; top: 0;     right: 20px;  animation-delay: 0.7s; }
        .ff-pizza     { width: 160px; bottom: 4px; right: 60px; animation-delay: 1.4s; }
        .ff-leaf      { width: 34px;  top: 40px;  left: 42%;    animation-delay: 0.9s; }
        .ff-tomato-1  { width: 30px;  top: 62%;   right: 26%;   animation-delay: 0.35s; }
        .ff-tomato-2  { width: 30px;  bottom: 8px; left: 24%;   animation-delay: 1.1s; }
        @media (max-width: 900px) {
          .ff-burger    { width: 160px; left: 4px; }
          .ff-dumplings { width: 110px; right: 4px; }
          .ff-pizza     { width: 120px; right: 10px; }
        }
        @media (max-width: 600px) {
          .browse-hero-wrap { padding-top: 20px; }
          .ff-burger    { width: 100px; top: 4px; left: 2px; }
          .ff-dumplings { width: 74px; top: 0; right: 2px; }
          .ff-pizza     { width: 82px; bottom: 2px; right: 6px; }
          .ff-leaf      { width: 22px; top: 20px; }
          .ff-tomato-1  { width: 20px; }
          .ff-tomato-2  { width: 20px; bottom: 0; }
        }

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
        /* Flat background + a 3D perspective tilt shows a seam/shading artifact
           at the edges (invisible on a busy full-bleed photo, obvious here) —
           drop the tilt for the logo variant, keep just a plain lift. */
        .cafe-menu-image-logo { background: #fffdf7; transform-style: flat; }
        .cafe-menu-image-logo:hover { transform: translateY(-8px); }
        .cafe-menu-image-logo img { object-fit: contain; padding: 16px; box-sizing: border-box; }

        .cafe-info { display:flex; flex-direction:column; justify-content:center; padding:20px; }
        .cafe-name { font-family:'Allura', cursive; font-size:64px; font-weight:400; color:var(--accent); margin-bottom:12px; line-height:1; }
        .cafe-location { font-size:14px; color:var(--muted); margin-bottom:16px; display:flex; align-items:center; gap:6px; }
        .cafe-description { font-size:15px; color:var(--text2); line-height:1.7; margin-bottom:24px; }
        .cafe-see-menu-btn { display:inline-block; padding:12px 28px; background:var(--accent); color:white; border:none; border-radius:8px; font-weight:600; font-size:14px; cursor:pointer; text-decoration:none; }

        @media (max-width: 900px) {
          .cafe-newspaper-card { grid-template-columns:1fr; gap:20px; }
          .cafe-newspaper-card.reversed { direction:ltr; }
          .cafe-menu-image { height:280px; }
          .cafe-menu-image-logo img { padding: 12px; }
          .cafe-name { font-size:48px; }
          .browse-list { padding:20px 20px calc(90px + env(safe-area-inset-bottom)); }
        }
        @media (max-width: 480px) {
          .newspaper-grid { gap:40px; }
          .cafe-menu-image { height:220px; }
          .cafe-menu-image-logo img { padding: 10px; }
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
        {/* Guests get the plain icon and are sent to sign in. The profile page
            is gated, so linking a guest straight at it only bounced them. */}
        <Link href={isAuthed ? '/mobile/profile' : '/auth?mode=login&next=/mobile/profile'}>
          <motion.button
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #ff5068, var(--accent) 60%, var(--accent-hover))',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.85)',
              boxShadow: '0 2px 8px rgba(232,51,74,0.35), inset 0 1px 1px rgba(255,255,255,0.3)',
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: 0.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            whileHover={{ scale: 1.08, boxShadow: '0 6px 16px rgba(232,51,74,0.4), inset 0 1px 1px rgba(255,255,255,0.3)' }}
            whileTap={{ scale: 0.95 }}
          >
            {isAuthed && user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
          </motion.button>
        </Link>
      </nav>

      {/* HERO — a central text block with gently floating food photos around it,
          modeled on the "Floating Food Hero" pattern (21st.dev/@ravikatiyar162). */}
      <div className="browse-hero-wrap" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <img className="floating-food-img ff-burger" alt="" aria-hidden="true"
          src="https://b.zmtcdn.com/data/o2_assets/110a09a9d81f0e5305041c1b507d0f391743058910.png"
          onError={e => (e.currentTarget.style.display = 'none')} />
        <img className="floating-food-img ff-dumplings" alt="" aria-hidden="true"
          src="https://b.zmtcdn.com/data/o2_assets/b4f62434088b0ddfa9b370991f58ca601743060218.png"
          onError={e => (e.currentTarget.style.display = 'none')} />
        <img className="floating-food-img ff-pizza" alt="" aria-hidden="true"
          src="https://b.zmtcdn.com/data/o2_assets/316495f4ba2a9c9d9aa97fed9fe61cf71743059024.png"
          onError={e => (e.currentTarget.style.display = 'none')} />
        <img className="floating-food-img ff-leaf" alt="" aria-hidden="true"
          src="https://b.zmtcdn.com/data/o2_assets/70b50e1a48a82437bfa2bed925b862701742892555.png"
          onError={e => (e.currentTarget.style.display = 'none')} />
        <img className="floating-food-img ff-tomato-1" alt="" aria-hidden="true"
          src="https://b.zmtcdn.com/data/o2_assets/9ef1cc6ecf1d92798507ffad71e9492d1742892584.png"
          onError={e => (e.currentTarget.style.display = 'none')} />
        <img className="floating-food-img ff-tomato-2" alt="" aria-hidden="true"
          src="https://b.zmtcdn.com/data/o2_assets/9ef1cc6ecf1d92798507ffad71e9492d1742892584.png"
          onError={e => (e.currentTarget.style.display = 'none')} />

        <div className="browse-hero" style={{ textAlign: 'center' }}>
          <h1 className="h1-browse" style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(28px,5vw,58px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: -1, marginBottom: 10, color: 'var(--navy)' }}>
            Pre-book your meal.<br />
            <span style={{ color: 'var(--accent)' }}>Walk in. Pick up. Leave.</span>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 460, lineHeight: 1.65, margin: '0 auto' }}>
            Browse local restaurants, pre-order your food, and skip the queue entirely.
          </p>
        </div>
      </div>

      {/* LIST */}
      <div className="browse-list">
        <input
          className="search-input"
          data-app-search
          placeholder="Search restaurant or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Loading restaurants...</div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>No restaurants found for &quot;{search}&quot;</div>
            ) : (
              <div className="newspaper-grid">
                {filtered.map((c, idx) => (
                  <motion.div
                    key={c.id}
                    className={`cafe-newspaper-card ${idx % 2 === 1 ? 'reversed' : ''}`}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportOnce}
                    variants={idx % 2 === 1 ? slideRight : slideLeft}
                  >
                    {/* Menu Image with Tilt Effect.
                        The image opens the restaurant, same destination as the
                        See Full Menu button below. It already had cursor:pointer
                        and a hover lift, so it advertised being clickable while
                        doing nothing.
                        Only the image is wrapped, not the whole card: the card
                        also holds the map toggle and that button, and nesting
                        those inside an anchor would turn every click on them
                        into a navigation. Inside the .map, so it holds for any
                        restaurant added later. */}
                    <div className={`cafe-menu-image ${CAFETERIA_LOGOS[c.name] ? 'cafe-menu-image-logo' : ''}`} style={{ filter: c.is_closed ? 'grayscale(100%) brightness(0.7)' : 'none', opacity: c.is_closed ? 0.5 : 1, transition: 'all 0.2s' }}>
                      <Link
                        href={c.is_closed ? '#' : `/mobile/order/${generateSlug(c.name)}`}
                        aria-label={`Open ${c.name}`}
                        style={{ display: 'block', width: '100%', height: '100%' }}
                        onClick={c.is_closed ? handleClosedCafeClick : undefined}
                      >
                        <img
                          src={CAFETERIA_LOGOS[c.name] || c.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop'}
                          alt={c.name}
                          loading="lazy"
                        />
                      </Link>
                    </div>

                    {/* Restaurant Info */}
                    <div className="cafe-info">
                      <h2 className="cafe-name">{c.name}</h2>
                      <div className="cafe-location">
                        📍 {c.location}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleMap(c.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          font: 'inherit',
                          textAlign: 'left',
                          color: '#e8334a',
                          fontWeight: 600,
                          fontSize: 14,
                          marginTop: 8,
                          display: 'block',
                          textDecoration: 'none'
                        }}
                      >
                        · How far is this from you? 🗺️ {expandedMaps.has(c.id) ? 'Hide map' : 'See map'}
                      </button>
                      <p className="cafe-description">
                        {c.description || 'Discover delicious meals and skip the queue. Pre-order your favorites now!'}
                      </p>
                      {expandedMaps.has(c.id) && (
                        <div style={{ marginBottom: 24 }}>
                          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(26,31,46,0.08)', height: 280 }}>
                            <RestaurantMapLoader
                              restaurant={c.name === 'LETHAFI' ? getLethafiLocation() : c.name === 'Bombay Dine' ? getBombayDineLocation() : undefined}
                              showRoute
                            />
                          </div>
                        </div>
                      )}
                      <Link href={c.is_closed ? '#' : `/mobile/order/${generateSlug(c.name)}`} onClick={c.is_closed ? handleClosedCafeClick : undefined}>
                        <motion.button
                          className="cafe-see-menu-btn"
                          whileHover={!c.is_closed ? { scale: 1.05, boxShadow: '0 8px 20px rgba(232,51,74,0.3)' } : {}}
                          whileTap={!c.is_closed ? { scale: 0.97 } : {}}
                          style={{ opacity: c.is_closed ? 0.5 : 1, cursor: c.is_closed ? 'not-allowed' : 'pointer' }}
                        >
                          {c.is_closed ? 'Cafe Closed' : 'See Full Menu →'}
                        </motion.button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AppTabBar />
    </div>
  )
}
