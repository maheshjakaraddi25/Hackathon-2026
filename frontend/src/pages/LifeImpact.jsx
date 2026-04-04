import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts'
import { getLifeImpactSimulation } from '../utils/api'

const DECISIONS = [
  { value: 'buy_car', label: 'Buy a car' },
  { value: 'move_city', label: 'Move cities' },
  { value: 'take_loan', label: 'Take a loan' },
  { value: 'change_job', label: 'Change jobs' },
]

const EVENTS = [
  { value: 'none', label: 'No stress test' },
  { value: 'job_loss', label: 'Inject job loss' },
  { value: 'medical_emergency', label: 'Inject medical emergency' },
  { value: 'economic_downturn', label: 'Inject economic downturn' },
]

const DEFAULT_PROFILE = {
  age: 31,
  income_range: '60k_100k',
  dependents: 1,
  housing_type: 'rent',
  zip_code: '85001',
  employment: 'employed',
  has_savings: true,
  savings_months: 2,
}

const selectStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--white)',
  color: 'var(--navy)',
}

const cardStyle = {
  padding: '1.5rem',
  borderRadius: 24,
  border: '1px solid var(--border)',
  background: 'var(--white)',
  boxShadow: 'var(--shadow)',
}

function formatMoney(value) {
  return `$${value.toLocaleString()}`
}

function formatSignedMoney(value) {
  return `${value >= 0 ? '+' : '-'}$${Math.abs(value).toLocaleString()}`
}

export default function LifeImpact({ profile, results }) {
  const nav = useNavigate()
  const activeProfile = profile || DEFAULT_PROFILE
  const [decision, setDecision] = useState('buy_car')
  const [eventType, setEventType] = useState('job_loss')
  const [simulation, setSimulation] = useState(results?.life_impact_preview || null)
  const [loading, setLoading] = useState(!results?.life_impact_preview)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadSimulation() {
      setLoading(true)
      setError('')
      try {
        const data = await getLifeImpactSimulation(decision, eventType, activeProfile)
        if (!cancelled) setSimulation(data)
      } catch (err) {
        if (!cancelled) setError('The simulator could not reach the backend. Start the API to view decision scenarios.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSimulation()
    return () => {
      cancelled = true
    }
  }, [decision, eventType])

  const bestScenario = simulation?.scenarios?.reduce((best, current) => (
    !best || current.post_event.resilience_score > best.post_event.resilience_score ? current : best
  ), null)

  const timelineChart = simulation?.scenarios?.[0]?.timeline?.map((point, index) => {
    const row = { month: point.month }
    simulation.scenarios.forEach((scenario) => {
      row[scenario.label] = scenario.timeline[index].savings
    })
    return row
  }) || []

  return (
    <div style={{ padding: '2rem 1rem 4rem' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section
          style={{
            ...cardStyle,
            background: 'linear-gradient(135deg, #062c25 0%, #0f766e 56%, #ecfeff 160%)',
            color: '#fff',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 35%)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
            <div>
              <div className="badge" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', marginBottom: '1rem' }}>
                Life Impact AI
              </div>
              <h1 style={{ marginBottom: '0.9rem', maxWidth: 560 }}>
                Smarter decisions beyond money.
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '1rem', maxWidth: 600 }}>
                Simulate what a decision does to your finances, stress, resilience, and savings goals before real life forces the answer.
              </p>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ padding: '1rem', borderRadius: 18, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.72)' }}>Pitch line</div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                  We do not just help users manage money. We help them make smarter life decisions powered by AI.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ ...cardStyle }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.84rem', fontWeight: 600 }}>Life decision</label>
              <select value={decision} onChange={(e) => setDecision(e.target.value)} style={selectStyle}>
                {DECISIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.84rem', fontWeight: 600 }}>Unexpected event</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} style={selectStyle}>
                {EVENTS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div style={{ padding: '0.9rem 1rem', borderRadius: 16, background: 'var(--bg)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Profile used for simulation</div>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                {activeProfile.savings_months} month buffer, {activeProfile.dependents} dependents, {activeProfile.housing_type}
              </div>
            </div>
            <button
              onClick={() => nav('/onboarding')}
              style={{ background: 'var(--emerald)', color: '#fff', padding: '12px 18px', borderRadius: 12, fontWeight: 700 }}
            >
              Update My Profile
            </button>
          </div>
        </section>

        {error && (
          <section style={{ ...cardStyle, borderColor: '#fecaca', background: '#fff7f7' }}>
            <p style={{ color: '#991b1b' }}>{error}</p>
          </section>
        )}

        {loading && (
          <section style={{ ...cardStyle }}>
            <p>Running the future simulation...</p>
          </section>
        )}

        {simulation && !loading && (
          <>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div style={{ ...cardStyle }}>
                <div className="badge badge-green" style={{ marginBottom: '0.9rem' }}>Decision summary</div>
                <h2 style={{ marginBottom: '0.6rem' }}>{simulation.title}</h2>
                <p style={{ marginBottom: '1rem' }}>{simulation.headline}</p>
                <div style={{ padding: '1rem', borderRadius: 16, background: 'var(--bg)', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>AI readout</div>
                  <p>{simulation.ai_summary}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.9rem', borderRadius: 16, background: '#ecfdf5' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Protected goal</div>
                    <div style={{ fontWeight: 700 }}>{simulation.goal_context.protected_goal}</div>
                  </div>
                  <div style={{ padding: '0.9rem', borderRadius: 16, background: '#fff7ed' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Delay pressure</div>
                    <div style={{ fontWeight: 700 }}>{simulation.goal_context.estimated_delay_pressure} months</div>
                  </div>
                  <div style={{ padding: '0.9rem', borderRadius: 16, background: '#eff6ff' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Stress test</div>
                    <div style={{ fontWeight: 700 }}>{simulation.event}</div>
                  </div>
                </div>
              </div>

              <div style={{ ...cardStyle }}>
                <div className="badge badge-amber" style={{ marginBottom: '0.9rem' }}>AI coach</div>
                <h3 style={{ marginBottom: '0.5rem' }}>Personalized nudge</h3>
                <p style={{ marginBottom: '1rem' }}>{bestScenario?.coach_nudge || simulation.coach_tip}</p>
                <div style={{ padding: '1rem', borderRadius: 16, background: 'var(--bg)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Best post-event path</div>
                  <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{simulation.resilience_story.best_case}</div>
                  <p style={{ fontSize: '0.88rem' }}>{simulation.resilience_story.best_case_reason}</p>
                </div>
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {simulation.scenarios.map((scenario) => {
                const radarData = [
                  { metric: 'Financial room', value: scenario.financial_impact },
                  { metric: 'Low stress', value: 100 - scenario.stress_level },
                  { metric: 'Low risk', value: 100 - scenario.risk_exposure },
                  { metric: 'Resilience', value: scenario.resilience_score },
                ]
                const statusColors = {
                  stable: '#059669',
                  warning: '#d97706',
                  failure: '#dc2626',
                }

                return (
                  <div key={scenario.id} style={{ ...cardStyle }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: '0.9rem', alignItems: 'center' }}>
                      <h3>{scenario.label}</h3>
                      <span
                        className="badge"
                        style={{
                          background: `${statusColors[scenario.post_event.status]}18`,
                          color: statusColors[scenario.post_event.status],
                        }}
                      >
                        {scenario.post_event.status}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Monthly cost</div>
                        <div style={{ fontWeight: 700 }}>{formatMoney(scenario.monthly_cost)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Monthly cash flow</div>
                        <div style={{ fontWeight: 700 }}>{formatSignedMoney(scenario.monthly_cash_flow_after)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Goal delay</div>
                        <div style={{ fontWeight: 700 }}>{scenario.goal_delay_months} mo</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Upfront impact</div>
                        <div style={{ fontWeight: 700 }}>
                          {scenario.cash_received > 0 ? formatSignedMoney(scenario.cash_received) : formatSignedMoney(-scenario.upfront_cost)}
                        </div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                        <Radar dataKey="value" stroke="var(--emerald)" fill="var(--emerald)" fillOpacity={0.18} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 16, background: 'var(--bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>After {simulation.event.toLowerCase()}</span>
                        <strong style={{ color: 'var(--navy)' }}>{scenario.post_event.resilience_score}/100 resilience</strong>
                      </div>
                      <p style={{ marginTop: 8, fontSize: '0.88rem' }}>
                        Remaining savings: {formatMoney(scenario.post_event.remaining_savings)}. Runway after the event: {scenario.post_event.remaining_runway_months} months.
                      </p>
                    </div>
                    <p style={{ marginTop: '0.85rem', fontSize: '0.84rem' }}>{scenario.assumptions.model_summary}</p>
                  </div>
                )
              })}
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <div style={{ ...cardStyle }}>
                <h3 style={{ marginBottom: '1rem' }}>Parallel future timelines</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={timelineChart}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                    <Tooltip formatter={(value) => formatMoney(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="Safe choice" stroke="#059669" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="Balanced choice" stroke="#0284c7" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="Risky choice" stroke="#dc2626" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ ...cardStyle }}>
                <h3 style={{ marginBottom: '1rem' }}>Scenario comparison</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={simulation.comparison_chart}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="scenario" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="12M Buffer" fill="#059669" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Goal Progress" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Event Resilience" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section style={{ ...cardStyle }}>
              <h3 style={{ marginBottom: '1rem' }}>How the math works</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: 16, background: 'var(--bg)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Monthly income estimate</div>
                  <div style={{ fontWeight: 700 }}>{formatMoney(simulation.profile_basis.monthly_income)}</div>
                </div>
                <div style={{ padding: '1rem', borderRadius: 16, background: 'var(--bg)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Essential expenses</div>
                  <div style={{ fontWeight: 700 }}>{formatMoney(simulation.profile_basis.essential_expenses)}</div>
                </div>
                <div style={{ padding: '1rem', borderRadius: 16, background: 'var(--bg)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Starting savings</div>
                  <div style={{ fontWeight: 700 }}>{formatMoney(simulation.profile_basis.current_savings)}</div>
                </div>
                <div style={{ padding: '1rem', borderRadius: 16, background: 'var(--bg)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Target runway</div>
                  <div style={{ fontWeight: 700 }}>{simulation.profile_basis.target_months} months</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {Object.entries(simulation.methodology).map(([key, value]) => (
                  <div key={key} style={{ padding: '0.95rem', borderRadius: 14, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{key.replaceAll('_', ' ')}</div>
                    <p style={{ fontSize: '0.86rem' }}>{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ ...cardStyle }}>
                <div className="badge badge-green" style={{ marginBottom: '0.75rem' }}>Problem</div>
                <h3 style={{ marginBottom: '0.5rem' }}>Why this matters</h3>
                <p>Most financial tools only look backward. This simulator helps users see future tradeoffs, risk, and emotional pressure before they commit.</p>
              </div>
              <div style={{ ...cardStyle }}>
                <div className="badge badge-amber" style={{ marginBottom: '0.75rem' }}>Inclusion</div>
                <h3 style={{ marginBottom: '0.5rem' }}>Accessible by design</h3>
                <p>Voice-first coaching, SMS and WhatsApp-ready delivery, and plain-language guidance support users who are often excluded from traditional fintech.</p>
              </div>
              <div style={{ ...cardStyle }}>
                <div className="badge badge-red" style={{ marginBottom: '0.75rem' }}>Impact</div>
                <h3 style={{ marginBottom: '0.5rem' }}>User outcome</h3>
                <p>Better decisions, less stress, stronger savings habits, and clearer visibility into how life events affect financial stability.</p>
              </div>
            </section>

            <section style={{ ...cardStyle }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.75rem' }}>High-level architecture</h3>
                  <ul style={{ paddingLeft: '1.1rem', color: 'var(--muted)' }}>
                    <li>Frontend web and mobile experience for simulation, coaching, and comparison.</li>
                    <li>API layer that handles profile analysis, scenario generation, and coach interactions.</li>
                    <li>AI engine for reasoning, forecasting, and behavior-aware nudges.</li>
                    <li>Data layer for financial context, user behavior, and future readiness signals.</li>
                    <li>Banking and messaging integrations for real-world delivery.</li>
                  </ul>
                </div>
                <div>
                  <h3 style={{ marginBottom: '0.75rem' }}>Technology stack</h3>
                  <ul style={{ paddingLeft: '1.1rem', color: 'var(--muted)' }}>
                    <li>LLM-guided decision reasoning and time-series prediction for future simulation.</li>
                    <li>AWS-aligned deployment model with Lambda, S3, DynamoDB, and SageMaker.</li>
                    <li>Encrypted financial data handling and secure API access by default.</li>
                    <li>Extensible channels for voice, SMS, and WhatsApp experiences.</li>
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
