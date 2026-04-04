import { useNavigate } from 'react-router-dom'

const features = [
  {
    title: 'Life Decision Simulator',
    text: 'Model major decisions like buying a car, moving cities, taking a loan, or changing jobs.',
  },
  {
    title: 'Parallel Future Timelines',
    text: 'Compare safe, balanced, and risky paths before committing to a new cost or life change.',
  },
  {
    title: 'Real-World Event Injection',
    text: 'Stress-test every plan against job loss, medical emergencies, and economic downturns.',
  },
  {
    title: 'Personalized AI Coach',
    text: 'Receive nudges that connect spending behavior to stress, resilience, and savings goals.',
  },
]

export default function Landing() {
  const nav = useNavigate()

  return (
    <div>
      <section style={{ padding: '5rem 1.5rem 4rem', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 15% 15%, rgba(5,150,105,0.16), transparent 30%), radial-gradient(circle at 85% 20%, rgba(14,116,144,0.14), transparent 30%), linear-gradient(180deg, #f0fdfa 0%, #f8fafc 75%)',
          }}
        />
        <div className="container" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
          <div>
            <div className="badge badge-green" style={{ marginBottom: '1rem' }}>
              Life Impact AI
            </div>
            <h1 style={{ marginBottom: '1rem' }}>
              Smarter decisions
              <br />
              beyond money
            </h1>
            <p style={{ fontSize: '1.05rem', maxWidth: 580, marginBottom: '1.5rem' }}>
              FinGuard now helps people answer a better question: what will this decision do to my future life, not just my bank balance?
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => nav('/onboarding')}
                style={{
                  background: 'var(--emerald)',
                  color: '#fff',
                  padding: '14px 28px',
                  borderRadius: 999,
                  fontWeight: 700,
                  boxShadow: '0 10px 30px rgba(5,150,105,0.24)',
                }}
              >
                Start My Assessment
              </button>
              <button
                onClick={() => nav('/life-impact')}
                style={{
                  background: '#fff',
                  color: 'var(--navy)',
                  padding: '14px 28px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  fontWeight: 600,
                }}
              >
                Explore Life Impact AI
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: 18, background: '#ecfdf5' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Demo flow</div>
                <div style={{ fontWeight: 700, color: 'var(--navy)' }}>Buy a car, generate 3 futures, inject job loss, and expose the fragile path.</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {[
                  ['Safe', '73', '#ecfdf5'],
                  ['Balanced', '58', '#eff6ff'],
                  ['Risky', '29', '#fef2f2'],
                ].map(([label, score, bg]) => (
                  <div key={label} style={{ padding: '1rem', borderRadius: 18, background: bg }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--navy)' }}>{score}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Resilience</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.88rem' }}>
                Existing tools track what already happened. Life Impact AI helps users compare what happens next.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '1rem 1.5rem 3rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {[
              ['Future prediction', 'Advanced'],
              ['Life impact simulation', 'Built in'],
              ['Emotional feedback', 'Stress-aware'],
              ['Scenario comparison', 'Side-by-side'],
            ].map(([label, value]) => (
              <div key={label} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{label}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--navy)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '1rem 1.5rem 4rem' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '0.75rem' }}>How Life Impact AI works</h2>
          <p style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            A proactive life decision intelligence layer on top of financial wellness.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
            {features.map((feature, index) => (
              <div key={feature.title} className="card" style={{ padding: '1.5rem' }}>
                <div className="badge badge-green" style={{ marginBottom: '0.75rem' }}>0{index + 1}</div>
                <h3 style={{ marginBottom: '0.5rem' }}>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 1.5rem 4rem' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>User impact</h3>
            <p>Better decisions, reduced stress, stronger savings, and clearer visibility into long-term tradeoffs.</p>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Social impact</h3>
            <p>Voice, SMS, and WhatsApp-ready guidance improves access for underserved communities.</p>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Business impact</h3>
            <p>A differentiated fintech platform with higher engagement through interactive scenario intelligence.</p>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--emerald-dark)', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', marginBottom: '0.75rem' }}>From reactive tracking to proactive decision intelligence</h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '1.5rem' }}>
          See the life impact of a decision before the stress shows up in your account.
        </p>
        <button
          onClick={() => nav('/life-impact')}
          style={{ background: '#fff', color: 'var(--emerald-dark)', padding: '14px 28px', borderRadius: 999, fontWeight: 700 }}
        >
          Launch the simulator
        </button>
      </section>
    </div>
  )
}
