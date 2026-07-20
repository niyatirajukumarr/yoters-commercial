import Link from 'next/link'
import { AnimatedSection } from '@/components/legal/AnimatedSection'

export const metadata = {
  title: 'Terms of Service — Yoters',
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderBottom: '1px solid var(--border)', background: 'rgba(253,248,245,0.85)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <img src="/logo.png" alt="Yoters" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>Yoters</span>
      </nav>

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px 80px', color: 'var(--text)', lineHeight: 1.65 }}>
        <Link href="/" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>← Back</Link>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 800, margin: '16px 0 16px', color: 'var(--navy)' }}>Terms of Service</h1>

        <AnimatedSection title="Agreement">
          By creating an account or placing an order on Yoters you agree to these terms. Yoters is a platform that lets
          you pre-order food from participating restaurants and pick it up or have it delivered.
        </AnimatedSection>

        <AnimatedSection title="Your account">
          You are responsible for the accuracy of the details you provide and for keeping your login credentials secure.
          You must be 18 or older to hold an account.
        </AnimatedSection>

        <AnimatedSection title="Orders & payments">
          Prices and availability are set by the restaurants. Payments are processed securely by Razorpay. Refunds for
          cancelled orders are processed to your original payment method and may take a few business days to settle.
        </AnimatedSection>

        <AnimatedSection title="Your data">
          We handle your personal data in line with our{' '}
          <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>, in compliance with the Digital
          Personal Data Protection Act, 2023.
        </AnimatedSection>

        <AnimatedSection title="Contact">
          Questions about these terms? Reach us via the contact in our{' '}
          <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>.
        </AnimatedSection>
      </main>
    </div>
  )
}
