import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const nav = useNavigate()

  return (
    <div>
      {/* Hero */}
      <section style={{ padding: '5rem 1.5rem 4rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(5,150,105,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto' }}>
          <div className="badge badge-green fade-up" style={{ marginBottom: '1.5rem', fontSize: '0.8rem' }}>
            🛡️ State Farm Financial Wellness Track
          </div>
          <h1 className="fade-up" style={{ animationDelay: '0.05s', marginBottom: '1.25rem' }}>
            Your Personal<br />
            <em style={{ color: 'var(--emerald)', fontStyle: 'italic' }}>Financial Safety Net</em>
          </h1>
          <p className="fade-up" style={{ fontSize: '1.1rem', marginBottom: '2.5rem', animationDelay: '0.1s', maxWidth: 520, margin: '0 auto 2.5rem' }}>
            FinGuard AI helps you understand your financial risks, close insurance gaps, and build an emergency fund — in plain English.
          </p>
          <div className="fade-up" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.15s' }}>
            <button
              onClick={() => nav('/onboarding')}
              style={{
                background: 'var(--emerald)', color: '#fff',
                padding: '14px 32px', borderRadius: 99,
                fontSize: '1rem', fontWeight: 600,
                boxShadow: '0 4px 20px rgba(5,150,105,0.35)',
              }}
            >
              Get My Free Assessment →
            </button>
            <button
              onClick={() => nav('/chat')}
              style={{
                background: '#fff', color: 'var(--navy)',
                padding: '14px 32px', borderRadius: 99,
                border: '1.5px solid var(--border)',
                fontSize: '1rem', fontWeight: 500,
              }}
            >
              Ask AI Coach a Question
            </button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '2rem 1.5rem' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
          {[
            { stat: '56%', label: 'of Americans can\'t cover a $1,000 emergency' },
            { stat: '40M+', label: 'renters lack renters insurance' },
            { stat: '~$15/mo', label: 'average cost of renters insurance' },
            { stat: '6 mo', label: 'recommended emergency fund size' },
          ].map(({ stat, label }) => (
            <div key={stat}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--emerald)' }}>{stat}</div>
              <p style={{ fontSize: '0.85rem', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '4rem 1.5rem' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '0.75rem' }}>How FinGuard Works</h2>
          <p style={{ textAlign: 'center', marginBottom: '3rem' }}>Three steps to financial peace of mind</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {[
              {
                icon: '📋',
                step: '1',
                title: '5-Minute Assessment',
                desc: 'Tell us about your income, family, housing, and savings. No Social Security number needed.',
              },
              {
                icon: '📊',
                step: '2',
                title: 'See Your Risk Scores',
                desc: 'Get a clear picture of your emergency fund gap, insurance gaps, and disaster risk by zip code.',
              },
              {
                icon: '🗓️',
                step: '3',
                title: 'Your 90-Day Action Plan',
                desc: 'A week-by-week plan to close your gaps — with specific, affordable steps tailored to your situation.',
              },
            ].map(({ icon, step, title, desc }) => (
              <div key={step} className="card" style={{ padding: '2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
                <div className="badge badge-green" style={{ marginBottom: '0.75rem' }}>Step {step}</div>
                <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ fontSize: '0.9rem' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--emerald-dark)', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Ready to protect your future?</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>Free, private, and takes under 5 minutes.</p>
        <button
          onClick={() => nav('/onboarding')}
          style={{
            background: '#fff', color: 'var(--emerald-dark)',
            padding: '14px 36px', borderRadius: 99,
            fontSize: '1rem', fontWeight: 700,
          }}
        >
          Start My Assessment →
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem 1.5rem', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.8rem' }}>
          FinGuard AI • Built for StateFarm Financial Wellness Track •{' '}
          <span style={{ color: 'var(--emerald)' }}>Not financial advice</span> — always consult a licensed professional.
        </p>
      </footer>
    </div>
  )
}
