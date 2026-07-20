'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface NavbarProps {
  user: { name?: string; email?: string } | null
  isAuthed: boolean
  orderHref: string
}

const NAV_LINKS = [
  { label: 'Features', id: 'features' },
  { label: 'Pricing', id: 'pricing' },
  { label: 'FAQ', id: 'faq' },
]

export function Navbar({ user, isAuthed, orderHref }: NavbarProps) {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          paddingTop: scrolled ? 10 : 14,
          paddingBottom: scrolled ? 10 : 14,
          backgroundColor: scrolled ? 'rgba(253,248,245,0.95)' : 'rgba(253,248,245,0)',
          boxShadow: scrolled ? '0 2px 24px rgba(26,31,46,0.06)' : '0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-12 backdrop-blur-md border-b"
        style={{ borderBottomColor: scrolled ? 'rgba(26,31,46,0.07)' : 'transparent', borderBottomWidth: 1 }}
      >
        <button
          onClick={() => scrollTo('hero')}
          className="flex items-center gap-1 cursor-pointer"
          aria-label="Yoters home"
        >
          <img
            src="/logo.png"
            alt="Yoters"
            className="w-14 h-14 object-contain"
            onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
          />
          <span className="font-display text-2xl font-bold text-brand-accent">Yoters</span>
        </button>

        <ul className="hidden md:flex gap-9 list-none">
          {NAV_LINKS.map(item => (
            <li key={item.id}>
              <button
                onClick={() => scrollTo(item.id)}
                className="text-sm font-medium text-brand-text2 hover:text-brand-accent transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5">
          {user ? (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/profile')}
              className="w-10 h-10 rounded-full bg-brand-accent text-white flex items-center justify-center font-bold cursor-pointer"
            >
              {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
            </motion.button>
          ) : !isAuthed ? (
            <div className="hidden sm:flex items-center gap-2.5">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/auth?mode=login')}
                className="px-5 py-2 rounded-[10px] border-[1.5px] border-black/15 text-brand-text2 text-sm font-medium cursor-pointer hover:border-brand-accent hover:text-brand-accent transition-colors"
              >
                Log in
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/auth?mode=signup')}
                className="px-[22px] py-2.5 rounded-[10px] bg-brand-accent text-white text-sm font-semibold cursor-pointer shadow-[0_4px_16px_rgba(232,51,74,0.15)]"
              >
                Sign up
              </motion.button>
            </div>
          ) : null}

          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden flex flex-col gap-[5px] p-1"
            onClick={() => setMenuOpen(o => !o)}
          >
            <span className="block w-[22px] h-0.5 bg-brand-navy rounded-sm" />
            <span className="block w-[22px] h-0.5 bg-brand-navy rounded-sm" />
            <span className="block w-[22px] h-0.5 bg-brand-navy rounded-sm" />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99] bg-brand-bg flex flex-col items-center justify-center gap-9 md:hidden"
          >
            {NAV_LINKS.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => scrollTo(item.id)}
                className="font-display text-4xl font-bold text-brand-navy cursor-pointer"
              >
                {item.label}
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: NAV_LINKS.length * 0.06 }}
              onClick={() => { setMenuOpen(false); router.push(orderHref) }}
              className="px-8 py-3 rounded-[10px] bg-brand-accent text-white font-semibold cursor-pointer"
            >
              Start Ordering
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
