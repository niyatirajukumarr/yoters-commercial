'use client'

import { motion } from 'framer-motion'
import { fadeUp, viewportOnce } from '@/lib/motion'

export function AnimatedSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeUp}
      style={{ marginTop: 24 }}
    >
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: 'var(--navy)' }}>{title}</h2>
      <div style={{ fontSize: 14.5, color: 'var(--text2)' }}>{children}</div>
    </motion.section>
  )
}
