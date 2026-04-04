import { useNavigate } from 'react-router-dom'

const features = [
  {
    title: 'Life Decision Simulator',
    text: 'Model decisions like buying a car, moving cities, taking a loan, or changing jobs with multi-dimensional impact.',
  },
  {
    title: 'Parallel Future Timelines',
    text: 'Compare safe, balanced, and risky futures side by side before you commit.',
  },
  {
    title: 'Real-World Event Simulation',
    text: 'Inject shocks like job loss, medical emergencies, and downturns to see how resilient each path is.',
  },
  {
    title: 'Personalized AI Coach',
    text: 'Get nudges that connect spending choices to stress, resilience, and your most important goals.',
  },
]

const differentiators = [
  ['Budget tracking', 'Yes', 'Yes'],
  ['AI recommendations', 'Yes', 'Yes'],
  ['Future prediction', 'Limited', 'Advanced'],
  ['Life impact simulation', 'No', 'Yes'],
  ['Emotional feedback', 'No', 'Yes'],
  ['Scenario comparison', 'No', 'Yes'],
]

export default function Landing() {
  const nav = useNavigate()

  return (
    <div>
      <section style={{ padding: '4.5rem 1.5rem 3rem', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-orb hero-orb-a" />
        <div className="hero-orb hero-orb-b" />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="badge badge-accent fade-up" style={{ marginBottom: '1.25rem' }}>
            Hackathon concept: proactive life decision intelligence
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: '2rem', alignItems: 'center' }}>
            <div>
              <h1 className="fade-up" style={{ maxWidth: 720 }}>
                Smarter decisions <span style={{ color: 'var(--accent)' }}>beyond money</span>
              </h1>
              <p className="fade-up" style={{ maxWidth: 640, fontSize: '1.08rem', marginTop: '1rem', animationDelay: '0.05s' }}>
                Life Impact AI helps people ask a better question than “Can I afford this?” It shows what a decision will do to future cash flow, stress, resilience, and goal timing before real life makes the choice for them.
              </p>
              <div className="fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: '1.75rem', animationDelay: '0.1s' }}>
                <button className="primary-button" onClick={() => nav('/onboarding')}>
                  Launch simulator
                </button>
                <button className="secondary-button" onClick={() => nav('/chat')}>
                  Ask the AI coach
                </button>
              </div>
              <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: '2rem', animationDelay: '0.15s' }}>
                {[
                  ['3 futures', 'Safe, balanced, risky'],
                  ['Shock tests', 'Job loss and emergencies'],
                  ['Accessible', 'Voice and messaging ready'],
                ].map(([value, label]) => (
                  <div key={value} className="glass-panel" style={{ padding: '1rem 1.1rem' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--ink)' }}>{value}</div>
                    <p style={{ fontSize: '0.82rem', marginTop: 4 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel fade-up" style={{ padding: '1.4rem', animationDelay: '0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Demo flow</div>
                  <h3 style={{ marginTop: 6 }}>Buy a car simulation</h3>
                </div>
                <span className="badge badge-accent">Live concept</span>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  'User selects: Buy a car',
                  'System generates 3 future scenarios',
                  'Shock event injected: Job loss',
                  'One timeline fails and exposes the risk clearly',
                ].map((step, index) => (
                  <div key={step} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12, alignItems: 'start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(200, 88, 54, 0.15)', color: 'var(--accent-strong)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.82rem' }}>{index + 1}</div>
                    <div style={{ paddingTop: 2, color: 'var(--ink)' }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '1rem 1.5rem 4rem' }}>
        <div className="container">
          <div className="section-heading">
            <span>Problem statement</span>
            <h2>Most financial tools look backward</h2>
            <p>People see spending history, but not how a new decision changes future stress, risk, and goal progress.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {[
              'Users cannot see the future impact of big decisions.',
              'Choices get made without understanding downside risk.',
              'Stress, emergencies, and real goals are usually missing from the model.',
              'That gap creates anxiety, poor planning, and reactive behavior.',
            ].map((item) => (
              <div key={item} className="card-panel" style={{ padding: '1.35rem' }}>
                <p style={{ color: 'var(--ink)' }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 1.5rem 4rem' }}>
        <div className="container">
          <div className="section-heading">
            <span>Key features</span>
            <h2>How Life Impact AI works</h2>
            <p>Future prediction with life context, not just balance-sheet math.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {features.map((feature) => (
              <div key={feature.title} className="card-panel" style={{ padding: '1.5rem' }}>
                <div className="mini-kicker">Feature</div>
                <h3 style={{ margin: '0.35rem 0 0.65rem' }}>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 1.5rem 4rem' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.95fr) minmax(280px, 1.05fr)', gap: '1.5rem' }}>
          <div className="card-panel" style={{ padding: '1.6rem' }}>
            <div className="section-heading" style={{ marginBottom: '1rem' }}>
              <span>Technology stack</span>
              <h2>Built for scale and inclusion</h2>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div><strong>AI and ML:</strong> LLM reasoning for coaching plus time-based future simulation.</div>
              <div><strong>Cloud:</strong> Lambda, S3, DynamoDB, and SageMaker style architecture.</div>
              <div><strong>Security:</strong> Encrypted financial data and secure API access.</div>
              <div><strong>Access:</strong> Web, mobile, voice, SMS, and WhatsApp support for underserved communities.</div>
            </div>
          </div>
          <div className="card-panel" style={{ padding: '1.6rem' }}>
            <div className="section-heading" style={{ marginBottom: '1rem' }}>
              <span>Differentiation</span>
              <h2>Why this is different</h2>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {differentiators.map(([feature, oldTools, lifeImpact]) => (
                <div key={feature} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr 0.6fr', gap: 10, padding: '0.8rem 0.9rem', borderRadius: 16, background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(119, 96, 73, 0.08)' }}>
                  <strong>{feature}</strong>
                  <span style={{ color: 'var(--muted)' }}>{oldTools}</span>
                  <span style={{ color: 'var(--accent-strong)', fontWeight: 700 }}>{lifeImpact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 1.5rem 4.5rem' }}>
        <div className="container">
          <div className="impact-banner">
            <div>
              <div className="mini-kicker">Final pitch</div>
              <h2 style={{ marginTop: '0.35rem' }}>We do not just help users manage money.</h2>
              <p style={{ maxWidth: 640, marginTop: '0.7rem' }}>We help them make smarter life decisions powered by AI, with clearer tradeoffs, lower stress, and better preparation for uncertainty.</p>
            </div>
            <button className="primary-button" onClick={() => nav('/onboarding')}>
              Build a timeline
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
