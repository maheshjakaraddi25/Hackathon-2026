import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell,
} from 'recharts'
import ScoreRing from '../components/ScoreRing'

const SCENARIO_COLOR = { safe: '#059669', balanced: '#d97706', risky: '#dc2626' }
const SHOCK_COLOR    = { holds: '#059669', 'under pressure': '#d97706', fails: '#dc2626' }

export default function SimulatorDashboard({ simProfile, simResults }) {
  const nav = useNavigate()
  const { metrics, scenarios, shock_test: shockTest, coach_nudges: nudges, action_plan: actionPlan, headline, decision, goal, base_math: baseMath } = simResults

  const radarData = useMemo(() => {
    const balanced = scenarios.find(s => s.id === 'balanced') || scenarios[0]
    return [
      { subject: 'Financial',  value: balanced.financial_score },
      { subject: 'Stress',     value: balanced.stress_score },
      { subject: 'Risk',       value: balanced.risk_score },
      { subject: 'Goal',       value: balanced.goal_score },
      { subject: 'Resilience', value: balanced.resilience_score },
    ]
  }, [scenarios])

  const comparisonData = scenarios.map(s => ({
    name: s.title.replace(' choice', ''),
    Financial: s.financial_score, Stress: s.stress_score,
    Risk: s.risk_score, Goal: s.goal_score,
  }))

  const timelineData = scenarios[0].timeline.map((point, i) => {
    const row = { month: `M${point.month}` }
    scenarios.forEach(s => { row[s.id] = s.timeline[i]?.savings ?? 0 })
    return row
  })

  const shockData = shockTest.results.map(e => ({
    name: e.scenario_title.replace(' choice', ''),
    Resilience: e.shock.resilience_score, status: e.shock.status,
  }))

  const card = { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: 'var(--shadow)' }

  return (
    <div style={{ padding: '2rem 1rem 3rem' }}>
      <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>

        {/* ── Header banner ── */}
        <div style={{ ...card, padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <span className="badge badge-amber" style={{ marginBottom: '0.5rem' }}>⚡ Life Impact Simulator</span>
            <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', marginTop: '0.35rem' }}>{headline}</h1>
            <p style={{ marginTop: '0.6rem', maxWidth: 680 }}>
              Decision: <strong style={{ color: 'var(--navy)' }}>{decision.label}</strong> &nbsp;·&nbsp;
              Goal: <strong style={{ color: 'var(--navy)' }}>{goal.label}</strong> &nbsp;·&nbsp;
              Horizon: <strong style={{ color: 'var(--navy)' }}>{decision.time_horizon} months</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => nav('/chat')} style={{ padding: '11px 22px', borderRadius: 99, background: 'var(--emerald)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              💬 Ask AI Coach
            </button>
            <button onClick={() => nav('/simulator')} style={{ padding: '11px 22px', borderRadius: 99, background: 'var(--white)', color: 'var(--navy)', border: '1.5px solid var(--border)', fontWeight: 500, cursor: 'pointer' }}>
              ↩ New Simulation
            </button>
          </div>
        </div>

        {/* ── 4 Score rings ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
          {[
            ['Life Impact',     metrics.life_impact_score],
            ['Stress Readiness',metrics.stress_readiness],
            ['Risk Exposure',   metrics.risk_exposure],
            ['Goal Protection', metrics.goal_protection],
          ].map(([label, score]) => (
            <div key={label} style={{ ...card, padding: '1.4rem', display: 'flex', justifyContent: 'center' }}>
              <ScoreRing score={score} label={label} size={100} />
            </div>
          ))}
        </div>

        {/* ── Comparison chart + Radar ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(280px,0.8fr)', gap: '1rem' }}>
          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.25rem' }}>📊 Parallel Future Timelines</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Compare safe, balanced, and risky paths across all metrics.</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Financial" fill="#059669" radius={[6,6,0,0]} />
                <Bar dataKey="Stress"    fill="#d97706" radius={[6,6,0,0]} />
                <Bar dataKey="Risk"      fill="#64748b" radius={[6,6,0,0]} />
                <Bar dataKey="Goal"      fill="#7c3aed" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.25rem' }}>🎯 Life Impact Radar</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Balanced scenario breakdown.</p>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <Radar dataKey="value" stroke="var(--emerald)" fill="var(--emerald)" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Timeline chart ── */}
        <div style={{ ...card, padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.25rem' }}>📈 Cash Buffer Over Time</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>How your savings evolve across all 3 scenarios.</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={timelineData}>
              <defs>
                {[['safe','#059669'],['balanced','#d97706'],['risky','#dc2626']].map(([id,c]) => (
                  <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={c} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`$${Number(v).toLocaleString()}`, '']} />
              <Legend />
              {['safe','balanced','risky'].map(id => (
                <Area key={id} type="monotone" dataKey={id} stroke={SCENARIO_COLOR[id]} fill={`url(#grad-${id})`} strokeWidth={2} name={id.charAt(0).toUpperCase()+id.slice(1)} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Scenario cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '1rem' }}>
          {scenarios.map(s => (
            <div key={s.id} style={{ ...card, padding: '1.4rem', borderTop: `4px solid ${SCENARIO_COLOR[s.id]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: SCENARIO_COLOR[s.id] }}>{s.title}</span>
                  <h3 style={{ fontSize: '1.1rem', marginTop: 4 }}>${s.monthly_impact}/mo</h3>
                </div>
                <span className="badge badge-amber">+{s.goal_delay_months}mo delay</span>
              </div>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{s.summary}</p>
              {[['Financial', s.financial_score],['Stress', s.stress_score],['Risk', s.risk_score],['Goal', s.goal_score],['Resilience', s.resilience_score]].map(([label, val]) => (
                <div key={label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                    <span style={{ color: 'var(--muted)' }}>{label}</span>
                    <strong style={{ color: 'var(--navy)' }}>{val}</strong>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: 'var(--border)' }}>
                    <div style={{ width: `${val}%`, height: '100%', borderRadius: 999, background: SCENARIO_COLOR[s.id] }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── Base math cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '1rem' }}>
          {[
            ['💵 Monthly Income', `$${baseMath.monthly_income.toLocaleString()}`],
            ['🏠 Essential Expenses', `$${baseMath.essential_expenses.toLocaleString()}`],
            ['💰 Starting Savings', `$${baseMath.starting_savings.toLocaleString()}`],
            ['📊 Free Cash Before', `$${baseMath.free_cash_before_decision.toLocaleString()}`],
            ['🔒 Employment Stability', `${Math.round(baseMath.employment_stability * 100)}%`],
          ].map(([label, val]) => (
            <div key={label} style={{ ...card, padding: '1.25rem' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>{label}</p>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* ── Shock test + Coach nudges ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(280px,0.9fr)', gap: '1rem' }}>
          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.25rem' }}>⚡ Shock Test — Job Loss</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>What happens if you lose income? Resilience after the shock:</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={shockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis domain={[0,100]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Resilience" radius={[6,6,0,0]}>
                  {shockData.map(e => <Cell key={e.name} fill={SHOCK_COLOR[e.status]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 12, background: 'var(--red-light)', border: '1px solid #fca5a5' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7f1d1d', marginBottom: 4 }}>⚠ Weakest Path</p>
              <p style={{ fontSize: '0.85rem', color: '#7f1d1d' }}>{shockTest.weakest_path.shock.insight}</p>
            </div>
          </div>

          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>🤖 AI Coach Nudges</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {nudges.map(nudge => (
                <div key={nudge.title} style={{ padding: '1rem', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{nudge.title}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--navy)', lineHeight: 1.5 }}>{nudge.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Action Plan ── */}
        <div style={{ ...card, padding: '1.75rem' }}>
          <h2 style={{ marginBottom: '0.4rem' }}>🗓️ Action Plan</h2>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Steps to protect your position before committing to the decision.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {actionPlan.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '1rem', alignItems: 'start', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border)', background: i === 0 ? 'rgba(5,150,105,0.03)' : 'var(--white)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: item.priority === 'high' ? 'var(--emerald)' : 'var(--border)', color: item.priority === 'high' ? '#fff' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, margin: '0 auto 5px' }}>{i+1}</div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{item.week}</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{item.title}</h3>
                    <span className={`badge ${item.priority === 'high' ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: '0.68rem' }}>
                      {item.priority === 'high' ? 'High' : 'Medium'}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--muted)' }}>⏱ {item.time_estimate}</span>
                  </div>
                  <ul style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {item.tasks.map((task, ti) => (
                      <li key={ti} style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5 }}>{task}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => nav('/chat')} style={{ padding: '13px 28px', borderRadius: 99, background: 'var(--emerald)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(5,150,105,0.3)' }}>
            💬 Chat with AI Coach
          </button>
          <button onClick={() => nav('/simulator')} style={{ padding: '13px 28px', borderRadius: 99, background: 'var(--white)', color: 'var(--navy)', border: '1.5px solid var(--border)', fontWeight: 500, cursor: 'pointer' }}>
            ↩ Run New Simulation
          </button>
          <button onClick={() => nav('/dashboard')} style={{ padding: '13px 28px', borderRadius: 99, background: 'var(--white)', color: 'var(--navy)', border: '1.5px solid var(--border)', fontWeight: 500, cursor: 'pointer' }}>
            📊 View Health Dashboard
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', paddingBottom: '1rem' }}>
          Educational simulation for presentation and prototyping. Not licensed financial advice.
        </p>
      </div>
    </div>
  )
}
