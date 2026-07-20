import Link from 'next/link'
import { GRIEVANCE_OFFICER, CONSENT_VERSION } from '@/lib/config'
import { AnimatedSection } from '@/components/legal/AnimatedSection'

export const metadata = {
  title: 'Privacy Policy — Yoters',
  description: 'How Yoters collects, uses, and protects your personal data under the DPDP Act, 2023.',
}

// DPDP Act, 2023 privacy notice (s.5 notice requirements). This is a public
// page — it must be reachable without a session (see proxy.ts PUBLIC list).
export default function PrivacyPolicyPage() {
  const updated = CONSENT_VERSION
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderBottom: '1px solid var(--border)', background: 'rgba(253,248,245,0.85)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <img src="/logo.png" alt="Yoters" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>Yoters</span>
      </nav>

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px 80px', color: 'var(--text)', lineHeight: 1.65 }}>
        <Link href="/" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>← Back</Link>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 800, margin: '16px 0 4px', color: 'var(--navy)' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0 }}>
          Last updated: {updated} · Compliant with the Digital Personal Data Protection Act, 2023 (India)
        </p>

        <AnimatedSection title="1. Who we are (Data Fiduciary)">
          Yoters (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a cafeteria pre-ordering platform. Under the
          Digital Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;) we are the <b>Data Fiduciary</b>
          {' '}for the personal data described below, and you are the <b>Data Principal</b>.
        </AnimatedSection>

        <AnimatedSection title="2. What personal data we collect">
          <ul>
            <li><b>Account data:</b> name, email address, phone number, and password (stored hashed by our auth provider).</li>
            <li><b>Order data:</b> items ordered, amounts, order/queue status, and (for delivery) the address you provide.</li>
            <li><b>Payment data:</b> processed by Razorpay; we store only a payment/order reference, never your card or bank details.</li>
            <li><b>Approximate/precise location:</b> only when you explicitly allow your browser to share it, to show the restaurant on a map and estimate distance. You can decline; the app still works.</li>
            <li><b>Technical data:</b> IP address and request metadata, used for security and rate limiting.</li>
            <li><b>Cookies:</b> essential cookies to keep you signed in and remember your preferences (see our{' '}
              <Link href="/privacy#cookies" style={{ color: 'var(--accent)' }}>cookie notice</Link> below).</li>
          </ul>
        </AnimatedSection>

        <AnimatedSection title="3. Why we use it (purposes) & legal basis">
          We process your data on the basis of your <b>consent</b> (DPDP s.6) and for the following purposes only:
          creating and managing your account; placing, tracking, and fulfilling orders; processing payments and refunds;
          sending order-status notifications; security, fraud-prevention and rate-limiting; and complying with law.
          We practise <b>purpose limitation</b> and <b>data minimisation</b> — we do not use your data for unrelated purposes.
        </AnimatedSection>

        <AnimatedSection title="4. Who we share it with (Data Processors)">
          We share the minimum necessary data with processors that act on our instructions:
          <ul>
            <li><b>Supabase</b> — database, authentication, and storage.</li>
            <li><b>Razorpay</b> — payment and refund processing.</li>
            <li><b>Twilio / Resend</b> — SMS and email notifications.</li>
          </ul>
          We do not sell your personal data.
        </AnimatedSection>

        <AnimatedSection title="5. How long we keep it (retention)">
          We retain account and order data only as long as needed for the purposes above and to meet legal
          obligations — by default up to <b>{GRIEVANCE_OFFICER.retentionDays} days</b> after an order is completed
          or cancelled, after which records are eligible for deletion or anonymisation. You may request earlier
          erasure at any time (see your rights below).
        </AnimatedSection>

        <AnimatedSection title="6. Your rights as a Data Principal">
          Under the DPDP Act you have the right to:
          <ul>
            <li><b>Access</b> a summary of the personal data we hold and how it is processed.</li>
            <li><b>Correction &amp; updating</b> of inaccurate or incomplete data.</li>
            <li><b>Erasure</b> — ask us to delete your data and account.</li>
            <li><b>Withdraw consent</b> at any time, as easily as you gave it.</li>
            <li><b>Grievance redressal</b> — raise a complaint with our Grievance Officer (below), and escalate to the Data Protection Board of India.</li>
            <li><b>Nominate</b> another individual to exercise your rights in the event of death or incapacity.</li>
          </ul>
          You can <b>download your data</b> or <b>delete your account</b> yourself from{' '}
          <Link href="/profile/settings" style={{ color: 'var(--accent)' }}>Settings → Your data &amp; privacy</Link>,
          or contact our Grievance Officer.
        </AnimatedSection>

        <AnimatedSection title="7. Children's data">
          The service is intended for users aged 18 and over. We do not knowingly process the personal data of a child
          (under 18) without verifiable consent of a parent/guardian, and we do not undertake tracking, behavioural
          monitoring, or targeted advertising directed at children (DPDP s.9). If you believe a minor has provided data
          without appropriate consent, contact us and we will delete it.
        </AnimatedSection>

        <AnimatedSection title="8. How we protect your data">
          We apply reasonable security safeguards: encrypted transport (HTTPS/HSTS), a strict Content-Security-Policy,
          server-side authentication and authorisation on privileged operations, server-side payment-signature
          verification, rate limiting, PII-scrubbed logging, and least-privilege database access. No system is perfectly
          secure; in the event of a personal-data breach we will notify the Data Protection Board of India and affected
          Data Principals as required by the DPDP Act.
        </AnimatedSection>

        <div id="cookies">
          <AnimatedSection title="9. Cookies">
            We use only what's necessary to run the app: a session cookie to keep you signed in, and a small
            local preference that remembers your cookie choice so we don't ask again every visit. We do not use
            third-party advertising or tracking cookies. You can control cookies at the browser level at any time;
            blocking the session cookie will sign you out.
          </AnimatedSection>
        </div>

        <AnimatedSection title="10. Grievance Officer">
          For any privacy question, request, or complaint, contact:
          <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-light2)', borderRadius: 10, padding: 14, marginTop: 8 }}>
            <div><b>{GRIEVANCE_OFFICER.name}</b></div>
            <div>Email: <a href={`mailto:${GRIEVANCE_OFFICER.email}`} style={{ color: 'var(--accent)' }}>{GRIEVANCE_OFFICER.email}</a></div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              We aim to respond within the timelines prescribed by the DPDP Act and its rules.
            </div>
          </div>
        </AnimatedSection>

        <p style={{ marginTop: 32, fontSize: 12, color: 'var(--muted)' }}>
          We may update this policy; material changes will require your renewed consent. See also our{' '}
          <Link href="/terms" style={{ color: 'var(--accent)' }}>Terms of Service</Link>.
        </p>
      </main>
    </div>
  )
}
