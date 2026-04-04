import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ScoreRing from '../components/ScoreRing'

const scenarioColors = {
  safe: '#2e7d5b',
  balanced: '#c85836',
  risky: '#8f3b2e',
}

const shockColors = {
  holds: '#2e7d5b',
  'under pressure': '#d08b28',
  fails: '#b5432a',
}

export default function Dashboard({ profile, results }) {
  const nav = useNavigate()
  const { metrics, scenarios, shock_test: shockTest, coach_nudges: coachNudges, action_plan: actionPlan, headline, decision, goal, architecture, base_math: baseMath } = results

  const radarData = useMemo(() => {
    const balanced = scenarios.find((item) => item.id === 'balanced') || scenarios[0]
    return [
      { subject: 'Financial', value: balanced.financial_score },
      { subject: 'Stress', value: balanced.stress_score },
      { subject: 'Risk', value: balanced.risk_score },
      { subject: 'Goal', value: balanced.goal_score },
      { subject: 'Resilience', value: balanced.resilience_score },
    ]
  }, [scenarios])

  const comparisonData = scenarios.map((scenario) => ({
    name: scenario.title.replace(' choice', ''),
    financial: scenario.financial_score,
    stress: scenario.stress_score,
    risk: scenario.risk_score,
    goal: scenario.goal_score,
    color: scenarioColors[scenario.id],
  }))

  const timelineData = scenarios[0].timeline.map((point, index) => {
    const row = { month: `M${point.month}` }
    scenarios.forEach((scenario) => {
      row[scenario.id] = scenario.timeline[index]?.savings ?? 0
    })
    return row
  })

  const shockData = shockTest.results.map((entry) => ({
    name: entry.scenario_title.replace(' choice', ''),
    resilience: entry.shock.resilience_score,
    status: entry.shock.status,
  }))

  return (
    <div style={{ padding: '2rem 1rem 3rem' }}>
      <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
        <section className="impact-banner" style={{ alignItems: 'stretch' }}>
          <div>
            <div className="mini-kicker">Life Impact AI simulator</div>
            <h1 style={{ fontSize: '2.2rem', marginTop: '0.35rem' }}>{headline}</h1>
            <p style={{ marginTop: '0.8rem', maxWidth: 720 }}>
              Decision under review: <strong style={{ color: 'var(--ink)' }}>{decision.label}</strong>. Primary goal: <strong style={{ color: 'var(--ink)' }}>{goal.label}</strong>. Planning horizon: <strong style={{ color: 'var(--ink)' }}>{decision.time_horizon} months</strong>.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 10, minWidth: 220 }}>
            <button className="primary-button" onClick={() => nav('/chat')}>Talk to the AI coach</button>
            <button className="secondary-button" onClick={() => nav('/onboarding')}>Run another simulation</button>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            ['Life impact', metrics.life_impact_score],
            ['Stress readiness', metrics.stress_readiness],
            ['Risk exposure', metrics.risk_exposure],
            ['Goal protection', metrics.goal_protection],
          ].map(([label, score]) => (
            <div key={label} className="card-panel" style={{ padding: '1.4rem', display: 'flex', justifyContent: 'center' }}>
              <ScoreRing score={score} label={label} size={112} />
            </div>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(300px, 0.9fr)', gap: '1rem' }}>
          <div className="card-panel" style={{ padding: '1.5rem' }}>
            <div className="section-heading" style={{ marginBottom: '0.75rem' }}>
              <span>Parallel future timelines</span>
              <h2>Compare safe, balanced, and risky paths</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(119, 96, 73, 0.15)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="financial" fill="#2e7d5b" radius={[8, 8, 0, 0]} />
                <Bar dataKey="stress" fill="#c85836" radius={[8, 8, 0, 0]} />
                <Bar dataKey="risk" fill="#7f6857" radius={[8, 8, 0, 0]} />
                <Bar dataKey="goal" fill="#d08b28" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-panel" style={{ padding: '1.5rem' }}>
            <div className="section-heading" style={{ marginBottom: '0.75rem' }}>
              <span>Balanced scenario</span>
              <h2>Life impact radar</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(119, 96, 73, 0.16)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#5f5145', fontSize: 12 }} />
                <Radar dataKey="value" stroke="#c85836" fill="#c85836" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="card-panel" style={{ padding: '1.4rem' }}>
            <div className="mini-kicker">Base math</div>
            <h3 style={{ marginTop: '0.35rem' }}>Income and essentials</h3>
            <p style={{ marginTop: '0.55rem' }}>
              Monthly income: <strong style={{ color: 'var(--ink)' }}>${baseMath.monthly_income.toLocaleString()}</strong>
            </p>
            <p>
              Essential expenses: <strong style={{ color: 'var(--ink)' }}>${baseMath.essential_expenses.toLocaleString()}</strong>
            </p>
          </div>
          <div className="card-panel" style={{ padding: '1.4rem' }}>
            <div className="mini-kicker">Starting position</div>
            <h3 style={{ marginTop: '0.35rem' }}>Before the decision</h3>
            <p style={{ marginTop: '0.55rem' }}>
              Savings buffer: <strong style={{ color: 'var(--ink)' }}>${baseMath.starting_savings.toLocaleString()}</strong>
            </p>
            <p>
              Free cash before decision: <strong style={{ color: 'var(--ink)' }}>${baseMath.free_cash_before_decision.toLocaleString()}</strong>
            </p>
          </div>
          <div className="card-panel" style={{ padding: '1.4rem' }}>
            <div className="mini-kicker">Employment factor</div>
            <h3 style={{ marginTop: '0.35rem' }}>Risk baseline</h3>
            <p style={{ marginTop: '0.55rem' }}>
              Stability factor: <strong style={{ color: 'var(--ink)' }}>{Math.round(baseMath.employment_stability * 100)}%</strong>
            </p>
            <p>
              This directly affects the risk and shock calculations.
            </p>
          </div>
        </section>

        <section className="card-panel" style={{ padding: '1.5rem' }}>
          <div className="section-heading" style={{ marginBottom: '0.75rem' }}>
            <span>Timeline simulation</span>
            <h2>How your cash buffer changes over time</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="safeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2e7d5b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2e7d5b" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="balancedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c85836" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#c85836" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="riskyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8f3b2e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8f3b2e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(119, 96, 73, 0.15)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Legend />
              <Area type="monotone" dataKey="safe" stroke="#2e7d5b" fill="url(#safeFill)" strokeWidth={2} />
              <Area type="monotone" dataKey="balanced" stroke="#c85836" fill="url(#balancedFill)" strokeWidth={2} />
              <Area type="monotone" dataKey="risky" stroke="#8f3b2e" fill="url(#riskyFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="card-panel" style={{ padding: '1.4rem', borderTop: `4px solid ${scenarioColors[scenario.id]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                <div>
                  <div className="mini-kicker">{scenario.title}</div>
                  <h3 style={{ marginTop: '0.35rem' }}>${scenario.monthly_impact}/mo impact</h3>
                </div>
                <span className="badge badge-accent">Delay {scenario.goal_delay_months} mo</span>
              </div>
              <p style={{ marginTop: '0.7rem' }}>{scenario.summary}</p>
              <div style={{ display: 'grid', gap: 8, marginTop: '1rem' }}>
                {[
                  ['Financial', scenario.financial_score],
                  ['Stress', scenario.stress_score],
                  ['Risk', scenario.risk_score],
                  ['Goal', scenario.goal_score],
                  ['Resilience', scenario.resilience_score],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                      <span>{label}</span>
                      <strong style={{ color: 'var(--ink)' }}>{value}</strong>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: 'rgba(119, 96, 73, 0.12)' }}>
                      <div style={{ width: `${value}%`, height: '100%', borderRadius: 999, background: scenarioColors[scenario.id] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 0.9fr)', gap: '1rem' }}>
          <div className="card-panel" style={{ padding: '1.5rem' }}>
            <div className="section-heading" style={{ marginBottom: '0.75rem' }}>
              <span>Shock event simulation</span>
              <h2>What happens if a job loss hits?</h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={shockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(119, 96, 73, 0.15)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="resilience" radius={[8, 8, 0, 0]}>
                  {shockData.map((entry) => (
                    <Cell key={entry.name} fill={shockColors[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="glass-panel" style={{ padding: '1rem', marginTop: '1rem' }}>
              <div className="mini-kicker">Weakest path</div>
              <h3 style={{ marginTop: '0.35rem' }}>{shockTest.weakest_path.scenario_title}</h3>
              <p style={{ marginTop: '0.5rem' }}>{shockTest.weakest_path.shock.insight}</p>
            </div>
          </div>

          <div className="card-panel" style={{ padding: '1.5rem' }}>
            <div className="section-heading" style={{ marginBottom: '0.75rem' }}>
              <span>Personalized AI coach</span>
              <h2>Real-time nudges</h2>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {coachNudges.map((nudge) => (
                <div key={nudge.title} className="glass-panel" style={{ padding: '1rem' }}>
                  <div className="mini-kicker">{nudge.title}</div>
                  <p style={{ marginTop: '0.4rem', color: 'var(--ink)' }}>{nudge.message}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 0.9fr)', gap: '1rem' }}>
          <div className="card-panel" style={{ padding: '1.5rem' }}>
            <div className="section-heading" style={{ marginBottom: '0.75rem' }}>
              <span>Action plan</span>
              <h2>What to do next</h2>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {actionPlan.map((item) => (
                <div key={item.week} style={{ padding: '1rem 1.1rem', borderRadius: 20, border: '1px solid rgba(119, 96, 73, 0.12)', background: 'rgba(255,255,255,0.75)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div className="mini-kicker">{item.week}</div>
                      <h3 style={{ marginTop: '0.3rem', fontSize: '1.05rem' }}>{item.title}</h3>
                    </div>
                    <span className={`badge ${item.priority === 'high' ? 'badge-danger' : 'badge-warm'}`}>{item.time_estimate}</span>
                  </div>
                  <ul style={{ paddingLeft: '1.1rem', marginTop: '0.7rem', display: 'grid', gap: 6 }}>
                    {item.tasks.map((task) => <li key={task}>{task}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="card-panel" style={{ padding: '1.5rem' }}>
            <div className="section-heading" style={{ marginBottom: '0.75rem' }}>
              <span>Architecture snapshot</span>
              <h2>System design</h2>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div><strong>Frontend:</strong> {architecture.frontend}</div>
              <div><strong>API layer:</strong> {architecture.api_layer}</div>
              <div><strong>AI engine:</strong> {architecture.ai_engine}</div>
              <div><strong>Data layer:</strong> {architecture.data_layer}</div>
              <div><strong>Integrations:</strong> {architecture.integrations.join(', ')}</div>
              <div className="glass-panel" style={{ padding: '1rem', marginTop: 4 }}>
                <div className="mini-kicker">Inclusive design</div>
                <p style={{ marginTop: '0.45rem', color: 'var(--ink)' }}>This concept supports voice interaction and messaging channels so decision guidance reaches users beyond polished banking apps.</p>
              </div>
            </div>
          </div>
        </section>

        <p style={{ textAlign: 'center', fontSize: '0.8rem' }}>
          Educational simulation for presentation and prototyping. It is designed to clarify tradeoffs, not replace licensed financial advice.
        </p>
      </div>
    </div>
  )
}
