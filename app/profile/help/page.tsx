'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { hoverScale } from '@/lib/motion'
import { GRIEVANCE_OFFICER } from '@/lib/config'

const FAQS = [
  {
    q: 'When do I get my token number?',
    a: "Right after the vendor approves your order — that's your confirmation from them that it's been received and is being prepared. You'll see a ticket pop up automatically once it's ready, and it's also shown on the tracking page.",
  },
  {
    q: 'How do I track an order?',
    a: 'Open the Orders tab and tap the order — it shows live status (approved → preparing → ready) along with your token number.',
  },
  {
    q: 'Can I cancel an order after placing it?',
    a: "Orders can't be self-cancelled from the app — only the vendor cancels one, usually if they're out of an item. If that happens you'll see the reason on the tracking page and any payment is refunded automatically.",
  },
  {
    q: 'Where do I see my refund status?',
    a: 'Profile → My Refunds. Each refund shows as Processing, Refund Initiated, or Refund Successful.',
  },
  {
    q: 'How do I remove an old order from my history?',
    a: 'Open a past order (one marked Cancelled or Collected) on your Profile page and tap "Delete Order" — this permanently removes it.',
  },
  {
    q: 'How do I update my name, phone, or email?',
    a: 'Tap Edit at the top of your Profile page.',
  },
  {
    q: "I'm a restaurant/vendor, where do I sign in?",
    a: 'Use the "Vendor Login" link on the sign-in page — that\'s a separate login from the student/customer account.',
  },
]

export default function HelpPage() {
  const router = useRouter()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb' }}>
      <div style={{ background: '#f5f0eb', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
        <motion.button {...hoverScale} onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
          <ArrowLeft size={22} color="#333" />
        </motion.button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>Help</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '20px 16px 48px', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' }}>
          Common Questions
        </div>

        {FAQS.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div key={item.q} style={{ background: 'white', borderRadius: 14, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{item.q}</span>
                {isOpen ? <ChevronUp size={18} color="#aaa" style={{ flexShrink: 0 }} /> : <ChevronDown size={18} color="#aaa" style={{ flexShrink: 0 }} />}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '0 18px 16px', fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#999' }}>
          Still stuck?{' '}
          <a href={`mailto:${GRIEVANCE_OFFICER.email}`} style={{ color: '#E8334A', fontWeight: 600 }}>
            Email us
          </a>
        </div>
      </div>
    </div>
  )
}
