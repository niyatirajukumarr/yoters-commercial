'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function LandingPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [scrollY, setScrollY] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<{ id: string; name?: string; email?: string } | null>(null)
  const [restaurants, setRestaurants] = useState<{ name: string; image: string; image_url?: string }[]>([])

  const { scrollY: scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 600], [0, -80])
  const heroOpacity = useTransform(scrollYProgress, [0, 400], [1, 0])

  useEffect(() => {
    const checkAuth = async () => {
      // Check if we've already shown splash (splash=true param means user already saw it)
      const params = new URLSearchParams(window.location.search)
      const hasSplash = params.get('splash') === 'true'

      const { data: { session } } = await supabase.auth.getSession()

      if (!session && !hasSplash) {
        // Unauthenticated & haven't seen splash → show splash
        router.replace('/splash')
      } else if (session && !hasSplash) {
        // Authenticated & haven't seen splash → show splash
        router.replace('/splash')
      } else if (session && hasSplash) {
        // Authenticated & already seen splash → show landing page
        setIsChecking(false)
        // Fetch user profile for students
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', session.user.id)
          .single()
        if (profile) {
          setUser({ id: session.user.id, name: profile.name, email: profile.email })
        } else {
          setUser({ id: session.user.id, email: session.user.email })
        }
      }
      // If unauthenticated with splash=true, redirect to /auth happens in splash
    }

    // Fetch cafeterias from database
    const fetchCafeterias = async () => {
      const { data: cafes } = await supabase
        .from('cafeterias')
        .select('name, image_url')
        .limit(4)

      if (cafes) {
        const cafeList = cafes.map(cafe => ({
          name: cafe.name,
          image_url: cafe.image_url,
          image: cafe.image_url || `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1565299585323-38d6b0865b47' : '1568901346375-23c9450c58cd'}?w=500&h=400&fit=crop`
        }))
        setRestaurants(cafeList)
      }
    }

    checkAuth()
    fetchCafeterias()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])


  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }


  const steps = [
    { n: '01', title: 'Browse & Choose', desc: "Open Yoters, pick your cafeteria, browse today's menu and add items to your cart — all before your break starts.", img: '🍽️', bg: '#fff0f2' },
    { n: '02', title: 'Pre-order & Pay', desc: 'Place your order, pay via UPI in seconds. Your queue position is reserved instantly.', img: '📱', bg: '#fff8ec' },
    { n: '03', title: 'Walk in. Pick up. Leave.', desc: 'Head to the counter when your order is marked ready. Skip the entire queue.', img: '🎉', bg: '#edfaf3' },
  ]

  const aboutCards = [
    { icon: '📅', title: 'Pre-book Before Break', desc: "Order your meal before your break starts so it's ready the moment you walk in." },
    { icon: '⚡', title: 'Zero Queue Time', desc: 'Walk in, pick up your food, and leave — no waiting in lines, no wasted break time.' },
    { icon: '♻️', title: 'Reduce Food Waste', desc: 'Cafeterias prepare based on real demand — exact quantities, fresher food, less waste.' },
  ]

  const transitionEase = [0.22, 1, 0.36, 1] as const

  const whyCards = [
    { n: '01', title: 'Know Your Meal in Advance', desc: 'Browse the menu, choose your meal, and schedule pickup before your break even begins.' },
    { n: '02', title: 'No More Waiting', desc: 'Walk straight to the counter, collect your food, and leave — no queues, no rush.' },
    { n: '03', title: 'Less Waste, Smarter Cooking', desc: 'Cafeterias prepare food based on real demand, reducing waste and serving students better.' },
  ]

  const foodEmojis = ['🍛', '🥟', '🍕', '🥗', '🍜', '🫕', '🥘', '🍱', '🥙', '🍔', '🧆', '🍝']

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: transitionEase } }
  }

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } }
  }

  const slideLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: transitionEase } }
  }

  const slideRight = {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: transitionEase } }
  }

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: transitionEase } }
  }

  function Section({ children, className, id, style }: { children: React.ReactNode, className?: string, id?: string, style?: React.CSSProperties }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-80px' })
    return (
      <motion.section
        ref={ref}
        id={id}
        className={className}
        style={style}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        {children}
      </motion.section>
    )
  }

  if (isChecking) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #fdf8f5; }
        .lp { background: #fdf8f5; color: #1a1f2e; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }

        .glitch { position: relative; display: inline-block; cursor: pointer; transition: color 0.2s; }
        .glitch:hover { color: #E8334A !important; }
        .glitch::before, .glitch::after { content: attr(data-text); position: absolute; left: 0; top: 0; width: 100%; height: 100%; opacity: 0; pointer-events: none; }
        .glitch:hover::before { opacity: 0.7; color: #E8334A; clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); animation: glitch1 0.3s steps(1) infinite; }
        .glitch:hover::after { opacity: 0.5; color: #1a1f2e; clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); animation: glitch2 0.3s steps(1) infinite; }
        @keyframes glitch1 { 0%,100%{transform:translateX(-2px) skewX(-1deg)} 25%{transform:translateX(2px) skewX(1deg)} 50%{transform:translateX(-1px)} 75%{transform:translateX(3px) skewX(-2deg)} }
        @keyframes glitch2 { 0%,100%{transform:translateX(2px) skewX(1deg)} 25%{transform:translateX(-2px) skewX(-1deg)} 50%{transform:translateX(1px)} 75%{transform:translateX(-3px) skewX(2deg)} }

        .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 14px 48px; display: flex; align-items: center; justify-content: space-between; transition: all 0.3s; }
        .lp-nav.scrolled { background: rgba(253,248,245,0.95); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(26,31,46,0.07); box-shadow: 0 2px 24px rgba(26,31,46,0.06); padding: 10px 48px; }
        .lp-nav-links { display: flex; gap: 36px; list-style: none; }
        .lp-nav-links a { color: #4a5068; font-size: 14px; font-weight: 500; text-decoration: none; cursor: pointer; }
        .lp-nav-right { display: flex; gap: 10px; align-items: center; }
        .profile-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--accent, #E8334A); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; cursor: pointer; position: relative; }
        .profile-menu { position: absolute; top: 50px; right: 0; background: white; border: 1px solid #eee; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); min-width: 220px; z-index: 200; }
        .profile-menu-item { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer; font-size: 14px; color: #333; }
        .profile-menu-item:last-child { border-bottom: none; }
        .profile-menu-item:hover { background: #f8f8f8; }
        .profile-menu-item.logout { color: #E8334A; font-weight: 600; }
        .lp-vendor-btn { padding: 9px 20px; border: 1.5px solid rgba(26,31,46,0.15); border-radius: 10px; background: transparent; color: #4a5068; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; text-decoration: none; display: inline-block; transition: all 0.2s; }
        .lp-vendor-btn:hover { border-color: #E8334A; color: #E8334A; }
        .lp-join-btn { padding: 10px 22px; background: #E8334A; color: white; border: none; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; border-radius: 10px; transition: all 0.2s; }
        .lp-join-btn:hover { background: #c9293f; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(232,51,74,0.3); }
        .hamburger-btn { display: none; background: none; border: none; cursor: pointer; padding: 4px; }
        .hamburger-btn span { display: block; width: 22px; height: 2px; background: #1a1f2e; margin: 5px 0; border-radius: 2px; }

        .btn-primary { padding: 15px 34px; background: #E8334A; color: white; border: none; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; border-radius: 10px; transition: all 0.2s; }
        .btn-primary:hover { background: #c9293f; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,51,74,0.3); }
        .btn-outline { padding: 15px 34px; background: transparent; color: #1a1f2e; border: 1.5px solid rgba(26,31,46,0.2); font-family: 'DM Sans', sans-serif; font-size: 15px; cursor: pointer; border-radius: 10px; transition: all 0.2s; }
        .btn-outline:hover { border-color: #E8334A; color: #E8334A; }

        .tag-dot { width: 6px; height: 6px; border-radius: 50%; background: #E8334A; animation: pulse 2s infinite; display:inline-block; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }

        .orbit-wrap { position: relative; width: 340px; height: 340px; margin: 0 auto; }
        .orbit-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 90px; height: 90px; border-radius: 50%; background: rgba(232,51,74,0.15); border: 2px solid rgba(232,51,74,0.4); display: flex; align-items: center; justify-content: center; font-size: 36px; z-index: 2; }
        .orbit-ring { position: absolute; top: 50%; left: 50%; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); transform: translate(-50%,-50%); }
        .orbit-ring-1 { width: 180px; height: 180px; animation: spin 8s linear infinite; }
        .orbit-ring-2 { width: 280px; height: 280px; animation: spin 14s linear infinite reverse; }
        .orbit-ring-3 { width: 340px; height: 340px; animation: spin 22s linear infinite; }
        @keyframes spin { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
        .orbit-dot { position: absolute; width: 36px; height: 36px; border-radius: 50%; background: #1a1f2e; border: 1px solid rgba(232,51,74,0.4); display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .dot-top { top: -18px; left: 50%; transform: translateX(-50%); }
        .dot-right { right: -18px; top: 50%; transform: translateY(-50%); }
        .dot-bottom { bottom: -18px; left: 50%; transform: translateX(-50%); }
        .dot-left { left: -18px; top: 50%; transform: translateY(-50%); }

        .track-scroll { display: flex; gap: 32px; width: max-content; animation: scrollTrack 22s linear infinite; padding: 16px 0; }
        .track-scroll:hover { animation-play-state: paused; }
        @keyframes scrollTrack { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .track-emoji-wrap { width: 72px; height: 72px; border-radius: 50%; background: white; border: 1.5px solid rgba(232,51,74,0.15); display: flex; align-items: center; justify-content: center; font-size: 32px; box-shadow: 0 4px 16px rgba(26,31,46,0.06); transition: transform 0.2s; }
        .track-emoji-wrap:hover { transform: scale(1.15) rotate(8deg); }

        .rest-card { background: white; border: 1px solid rgba(26,31,46,0.07); border-radius: 20px; padding: 28px 32px; display: flex; align-items: center; gap: 28px; cursor: pointer; }
        .rest-card:hover { border-color: rgba(232,51,74,0.25); box-shadow: 0 12px 48px rgba(232,51,74,0.08); }
        .rest-card-arrow { font-size: 20px; color: #E8334A; opacity: 0; transition: opacity 0.2s; }
        .rest-card:hover .rest-card-arrow { opacity: 1; }

        .how-card { border: 1px solid rgba(26,31,46,0.07); border-radius: 20px; padding: 32px 28px; position: relative; overflow: hidden; }
        .how-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background: linear-gradient(90deg,#E8334A,#ff8fa3); opacity:0; transition:opacity 0.3s; }
        .how-card:hover::before { opacity:1; }
        .how-card:hover { border-color: rgba(232,51,74,0.2); box-shadow: 0 16px 48px rgba(232,51,74,0.08); }

        .about-card { background: #fdf8f5; border: 1px solid rgba(26,31,46,0.07); border-radius: 20px; padding: 32px 28px; position: relative; overflow: hidden; }
        .about-card::after { content:''; position:absolute; bottom:0; left:0; right:0; height:3px; background: linear-gradient(90deg,#E8334A,#ff8fa3); transform:scaleX(0); transform-origin:left; transition:transform 0.3s; }
        .about-card:hover::after { transform:scaleX(1); }
        .about-card:hover { box-shadow: 0 12px 40px rgba(232,51,74,0.08); border-color: rgba(232,51,74,0.15); }

        .why-card { background: white; border: 1px solid rgba(26,31,46,0.07); border-radius: 20px; padding: 32px 28px; }
        .why-card:hover { border-color: rgba(232,51,74,0.2); box-shadow: 0 16px 48px rgba(232,51,74,0.1); }

        .footer-3d-inner { width:72px; height:72px; border-radius:50%; background: linear-gradient(135deg, rgba(232,51,74,0.3), rgba(255,143,163,0.1)); border: 1px solid rgba(232,51,74,0.3); display:flex; align-items:center; justify-content:center; font-size:32px; animation: float3d 4s ease-in-out infinite; }
        @keyframes float3d { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-8px) rotate(5deg)} 66%{transform:translateY(4px) rotate(-3deg)} }

        .footer-back-btn { margin-top:16px; padding:11px 24px; border:1.5px solid rgba(255,255,255,0.15); border-radius:10px; background:transparent; color:rgba(255,255,255,0.5); font-family:'DM Sans',sans-serif; font-size:13px; cursor:pointer; transition:all 0.2s; font-weight:500; width:fit-content; }
        .footer-back-btn:hover { border-color:#E8334A; color:#E8334A; }
        .footer-nl-input { flex:1; padding:10px 14px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; }
        .footer-nl-input::placeholder { color:rgba(255,255,255,0.2); }
        .footer-nl-btn { padding:10px 16px; background:#E8334A; border:none; border-radius:8px; color:white; font-size:13px; font-weight:600; cursor:pointer; }

        .mobile-menu-overlay { position:fixed; inset:0; background:#fdf8f5; z-index:99; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:36px; }

        @media (max-width: 900px) {
          .lp-nav { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
          .lp-nav.scrolled { padding: 10px 16px; }
          .lp-nav-links { display: none !important; }
          .lp-nav-right { display: flex; gap: 10px; align-items: center; }
          .hamburger-btn { display: block; background: none; border: none; cursor: pointer; padding: 4px; }
          .lp-grid-3 { grid-template-columns: 1fr !important; }
          .lp-grid-2 { grid-template-columns: 1fr !important; }
          .lp-grid-4 { grid-template-columns: repeat(2,1fr) !important; }
          .lp-footer-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .lp-section { padding-left: 20px !important; padding-right: 20px !important; }
          .lp-hero { padding: 100px 20px 60px !important; }
          .orbit-wrap { display: none; }
          .rest-card { flex-direction: column; align-items: flex-start; gap: 16px; padding: 20px !important; }
          .lp-footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
        }
        @media (max-width: 480px) {
          .lp-grid-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="lp">

        {/* NAV */}
        <nav className={`lp-nav ${scrollY > 50 ? 'scrolled' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={() => scrollTo('hero')}>
            <img src="/logo.png" alt="Yoters" style={{ width: 56, height: 56, objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: '#E8334A', lineHeight: 1 }}>Yoters</span>
            </div>
          </div>
          <ul className="lp-nav-links">
            {['Home', 'About', 'Contact'].map(item => (
              <li key={item}><a className="glitch" data-text={item} onClick={() => scrollTo(item.toLowerCase())}>{item}</a></li>
            ))}
          </ul>
          <div className="lp-nav-right">
            {user && (
              <div style={{ position: 'relative' }}>
                <div className="profile-avatar" onClick={() => router.push('/profile')}>
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            <button
              type="button"
              className="hamburger-btn"
              style={{ display: 'block' }}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen(!menuOpen)}>
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div className="mobile-menu-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {['Home', 'About', 'Contact'].map(item => (
                <motion.a key={item} className="glitch" data-text={item}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => scrollTo(item.toLowerCase())}
                  style={{ fontFamily: 'Playfair Display, serif', fontSize: 40, fontWeight: 700, color: '#1a1f2e', cursor: 'pointer' }}>
                  {item}
                </motion.a>
              ))}
              <button className="lp-join-btn" onClick={() => { scrollTo('contact'); setMenuOpen(false) }}>Join Now!</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HERO */}
        <section id="hero" className="lp-hero" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '120px 48px 80px', background: '#fdf8f5' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(232,51,74,0.15) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', maskImage: 'radial-gradient(ellipse 70% 70% at 80% 50%, black 0%, transparent 100%)', zIndex: 0 }} />
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute', right: 0, top: 0,
              width: '80%', height: '100%',
              objectFit: 'cover', zIndex: 0,
              opacity: 0.65,
              maskImage: 'linear-gradient(to left, black 20%, rgba(0,0,0,0.5) 55%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, black 20%, rgba(0,0,0,0.5) 55%, transparent 100%)'
            }}
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          <motion.div style={{ position: 'relative', zIndex: 2, maxWidth: 660, y: heroY, opacity: heroOpacity }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff0f2', border: '1px solid #ffd6dc', color: '#E8334A', padding: '6px 16px', borderRadius: 20, marginBottom: 28, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
              <span className="tag-dot" /> Now accepting early access
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22,1,0.36,1] }}
              style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(44px, 6.5vw, 84px)', fontWeight: 700, lineHeight: 1.02, letterSpacing: -1.5, color: '#1a1f2e', marginBottom: 20 }}>
              Skip the Cafeteria<br /><em style={{ fontStyle: 'italic', color: '#E8334A' }}>Rush.</em>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              style={{ fontSize: 18, color: '#4a5068', lineHeight: 1.72, maxWidth: 500, marginBottom: 36 }}>
              Pre-book meals from your college cafeteria and pick them up without waiting in lines. Your food. Ready when you are.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => scrollTo('contact')}>Get Early Access</button>
              <button className="btn-outline" onClick={() => scrollTo('about')}>Learn More</button>
            </motion.div>
          </motion.div>
        </section>

        {/* THE PROBLEM */}
        <section className="lp-section" style={{ padding: '100px 48px', background: '#1a1f2e', overflow: 'hidden' }}>
          <div className="lp-grid-2" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}>
              <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#E8334A', marginBottom: 16 }}>The Problem</motion.p>
              <motion.h2 variants={fadeUp} style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 20 }}>
                The Hidden Cost of <em style={{ fontStyle: 'italic', color: '#ff8fa3' }}>Waiting in Line</em>
              </motion.h2>
              <motion.p variants={fadeUp} style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, marginBottom: 32 }}>
                Every minute spent queuing is a minute stolen from your break. Students lose up to 20 minutes daily.
              </motion.p>
              <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: '⏰', title: 'Wasted Break Time', desc: 'Average 15–20 min spent queuing. That\'s your lunch break, gone.' },
                  { icon: '😤', title: 'Unpredictable Waits', desc: 'No way to know how long it\'ll take. Plans ruined, stress added.' },
                  { icon: '🗑️', title: 'Overcooked & Wasted Food', desc: 'Cafeterias overprepare without demand data. Food wasted daily.' },
                  { icon: '📉', title: 'Poor Cafeteria Efficiency', desc: 'Staff overwhelmed at peak hours, slow service, frustrated students.' },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, background: 'rgba(232,51,74,0.15)', border: '1px solid rgba(232,51,74,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 3 }}>{item.title}</h4>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="orbit-wrap">
                <div className="orbit-center">🐧</div>
                <div className="orbit-ring orbit-ring-1">
                  <div className="orbit-dot dot-top">⏰</div>
                  <div className="orbit-dot dot-bottom">🍱</div>
                </div>
                <div className="orbit-ring orbit-ring-2">
                  <div className="orbit-dot dot-top">📱</div>
                  <div className="orbit-dot dot-right">⚡</div>
                  <div className="orbit-dot dot-bottom">✅</div>
                  <div className="orbit-dot dot-left">🎓</div>
                </div>
                <div className="orbit-ring orbit-ring-3" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* OUR CAFETERIAS */}
        <section className="lp-section" style={{ padding: '100px 48px', background: '#fdf8f5' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
              <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#E8334A', marginBottom: 14 }}>Our Cafeterias</motion.p>
              <motion.h2 variants={fadeUp} style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 700, color: '#1a1f2e', lineHeight: 1.15, marginBottom: 10 }}>
                Campus Cafeterias,<br /><span style={{ color: '#E8334A', fontStyle: 'italic' }}>Live & Ready.</span>
              </motion.h2>
              <motion.p variants={fadeUp} style={{ fontSize: 16, color: '#8a90a8', maxWidth: 520, lineHeight: 1.7, marginBottom: 52 }}>
                Real-time queue visibility across every cafeteria on campus. Pre-order from any, skip the line at all.
              </motion.p>
            </motion.div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40 }}>
              {restaurants.map((r, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22,1,0.36,1] }}
                  style={{ position: 'relative', height: 320, borderRadius: 20, overflow: 'hidden', cursor: 'pointer' }}>
                  {/* Background Image */}
                  <img src={r.image} alt={r.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

                  {/* Dark Overlay Gradient */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)' }} />

                  {/* Content */}
                  <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 24, color: 'white' }}>
                    {/* Restaurant Name */}
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, lineHeight: 1.2, maxWidth: '90%' }}>
                      {r.name}
                    </h3>

                    {/* CTA Button */}
                    <Link href="/browse" style={{ alignSelf: 'flex-start', padding: '12px 20px', background: '#E8334A', color: 'white', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none', transition: 'all 0.3s', border: 'none', cursor: 'pointer', letterSpacing: 0.5 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(232,51,74,0.3)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                      Wanna know more? Start ordering →
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="lp-section" style={{ padding: '100px 48px', background: 'white' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
              <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#E8334A', marginBottom: 14 }}>How It Works</motion.p>
              <motion.h2 variants={fadeUp} style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 700, color: '#1a1f2e', lineHeight: 1.15, marginBottom: 10 }}>
                Simple. Fast.<br /><span style={{ color: '#E8334A', fontStyle: 'italic' }}>Delicious.</span>
              </motion.h2>
              <motion.p variants={fadeUp} style={{ fontSize: 16, color: '#8a90a8', maxWidth: 520, lineHeight: 1.7, marginBottom: 52 }}>
                Three steps between you and a hot meal — no queues, no guessing, no wasted time.
              </motion.p>
            </motion.div>
            <div className="lp-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {steps.map((step, i) => (
                <motion.div key={i} className="how-card"
                  style={{ background: step.bg, marginTop: i === 1 ? 24 : i === 2 ? 48 : 0 }}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: i === 1 ? 24 : i === 2 ? 48 : 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.65, delay: i * 0.15, ease: [0.22,1,0.36,1] }}
                  whileHover={{ y: (i === 1 ? 24 : i === 2 ? 48 : 0) - 6 }}>
                  <span style={{ fontSize: 52, marginBottom: 20, display: 'block' }}>{step.img}</span>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#E8334A', marginBottom: 12 }}>STEP {step.n}</div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1a1f2e', marginBottom: 10 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: '#8a90a8', lineHeight: 1.72 }}>{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOD TRACK */}
        <section style={{ padding: '80px 0', background: '#fdf8f5', overflow: 'hidden', borderTop: '1px solid rgba(26,31,46,0.06)', borderBottom: '1px solid rgba(26,31,46,0.06)' }}>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#E8334A', marginBottom: 12 }}>Always Fresh</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', fontFamily: 'Playfair Display, serif', fontSize: 'clamp(22px,3vw,36px)', fontWeight: 700, color: '#1a1f2e', marginBottom: 8 }}>Every Cuisine. One Platform.</motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', fontSize: 15, color: '#8a90a8', marginBottom: 40, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
            From South Indian breakfasts to multi-cuisine lunches — your entire campus food scene, right here.
          </motion.p>
          <div style={{ overflow: 'hidden' }}>
            <div className="track-scroll">
              {[...foodEmojis, ...foodEmojis].map((emoji, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div className="track-emoji-wrap">{emoji}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY */}
        <section className="lp-section" style={{ padding: '100px 48px', background: '#fdf8f5' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
              <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#E8334A', marginBottom: 14 }}>Why Choose Us</motion.p>
              <motion.h2 variants={fadeUp} style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 700, color: '#1a1f2e', lineHeight: 1.15, marginBottom: 10 }}>
                Why it <em style={{ fontStyle: 'italic', color: '#E8334A' }}>Matters</em>
              </motion.h2>
              <motion.p variants={fadeUp} style={{ fontSize: 16, color: '#8a90a8', maxWidth: 520, lineHeight: 1.7, marginBottom: 52 }}>
                College breaks are short, cafeteria crowds are large, and food is often wasted. Pre-booking changes all of that.
              </motion.p>
            </motion.div>
            <motion.div className="lp-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
              {whyCards.map((card, i) => (
                <motion.div key={i} className="why-card" variants={fadeUp} whileHover={{ scale: 1.02, y: -4 }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 56, fontWeight: 700, color: 'rgba(232,51,74,0.1)', lineHeight: 1, marginBottom: 14 }}>{card.n}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1a1f2e', marginBottom: 8 }}>{card.title}</h3>
                  <p style={{ fontSize: 14, color: '#8a90a8', lineHeight: 1.72 }}>{card.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section id="contact" className="lp-section" style={{ padding: '100px 48px', background: '#1a1f2e', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,51,74,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <motion.div style={{ position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto' }}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
            <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#E8334A', marginBottom: 16 }}>Get Started</motion.p>
            <motion.h2 variants={fadeUp} style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px,4.5vw,58px)', fontWeight: 700, color: 'white', lineHeight: 1.1, marginBottom: 16 }}>
              Ready to <em style={{ fontStyle: 'italic', color: '#ff8fa3' }}>Skip the Line?</em>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 36 }}>
              Join hundreds of students already on the waitlist. Be the first to pre-order when we launch on your campus.
            </motion.p>
            <motion.div variants={scaleIn}>
              <button className="btn-primary" style={{ padding: '16px 40px', fontSize: 16 }}
                onClick={() => router.push('/browse')}>
                Start Ordering Now →
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* STATS */}
        <section className="lp-section" style={{ padding: '80px 48px', background: 'white' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <motion.div className="lp-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'rgba(26,31,46,0.06)', borderRadius: 20, overflow: 'hidden' }}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              {[{ val: 'Students', label: 'Built for' }, { val: 'Cafeterias', label: 'Partnering with' }, { val: 'Zero Waste', label: 'Real demand only' }, { val: 'Soon', label: 'Launching' }].map((s, i) => (
                <motion.div key={i} variants={fadeUp} style={{ padding: '40px 24px', textAlign: 'center', background: 'white' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: '#E8334A', marginBottom: 6 }}>{s.val}</h3>
                  <p style={{ fontSize: 11, color: '#8a90a8', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-section" style={{ background: '#1a1f2e', padding: '72px 48px 40px' }}>
          <div className="lp-footer-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: 60, marginBottom: 56 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', marginBottom: 14 }} onClick={() => scrollTo('hero')}>
                <img src="/logo.png" alt="Yoters" style={{ width: 52, height: 52, objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#E8334A' }}>Yoters</span>
                </div>
              </div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 260, marginBottom: 24 }}>Skip the queue. Pre-book your meal. Walk in, pick up, and enjoy your break.</p>
              <div className="footer-3d-inner">🐧</div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: 20 }}>Navigation</p>
              {['Home', 'About', 'Contact'].map(item => (
                <a key={item} className="glitch" data-text={item} onClick={() => scrollTo(item.toLowerCase())}
                  style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 500, marginBottom: 12, display: 'block' }}>{item}</a>
              ))}
              <Link href="/browse" className="glitch" data-text="Browse Cafeterias"
                style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginBottom: 12, display: 'block' }}>Browse Cafeterias</Link>
              <Link href="/vendor/login"
                style={{ fontSize: 13, color: 'white', fontWeight: 600, display: 'inline-block', marginTop: 4, padding: '8px 16px', background: '#E8334A', borderRadius: 8, textDecoration: 'none' }}>
                🔐 Vendor Login
              </Link>
              <button className="footer-back-btn" onClick={() => scrollTo('hero')}>↑ Back to Top</button>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: 20 }}>Connect</p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                {[{ href: 'https://x.com/YotersOfficial', label: '𝕏' }, { href: 'https://www.instagram.com/yotersofficial.tech', label: 'IG' }, { href: 'https://www.linkedin.com/company/yotersofficial', label: 'in' }].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="glitch" data-text={s.label}
                    style={{ width: 38, height: 38, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, textDecoration: 'none', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                    {s.label}
                  </a>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', display: 'block', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2, fontWeight: 600 }}>Email</span><p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>yotersofficial@gmail.com</p></div>
              <div style={{ marginBottom: 12 }}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', display: 'block', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2, fontWeight: 600 }}>Location</span><p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>Bengaluru, Karnataka, IN</p></div>
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 8 }}>Subscribe to updates</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="footer-nl-input" type="email" placeholder="you@college.edu" />
                  <button className="footer-nl-btn">→</button>
                </div>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom" style={{ maxWidth: 1100, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} Yoters. All Rights Reserved.</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Built with ❤️ for students</p>
          </div>
        </footer>
      </div>
    </>
  )
}