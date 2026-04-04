import { useNavigate } from 'react-router-dom'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import ScoreRing from '../components/ScoreRing'

const RISK_COLOR = (score) => (score >= 70 ? 'var(--emerald)' : score >= 40 ? 'var(--amber)' : 'var(--red)')
const RISK_LABEL = (score) => (score >= 70 ? 'Good' : score >= 40 ? 'Needs Work' : 'At Risk')
const RISK_BADGE = (score) => (score >= 70 ? 'badge-green' : score >= 40 ? 'badge-amber' : 'badge-red')

const IMPORTANCE_COLOR = { critical: '#dc2626', high: '#d97706', medium: '#0284c7', low: '#64748b' }
const IMPORTANCE_LABEL = { critical: 'Critical', high: 'High', medium: 'Recommended', low: 'Optional' }

export default function Dashboard({ profile, results }) {
  const nav = useNavigate()
  const { scores, action_plan, insurance_recommendations, life_impact_preview } = results

  const radarData = [
    { subject: 'Emergency Fund', A: scores.emergency_fund.score },
    { subject: 'Insurance', A: scores.insurance.score },
    { subject: 'Disaster Prep', A: scores.flood.score },
    { subject: 'Income Security', A: profile?.employment === 'employed' ? 75 : profile?.employment === 'self_employed' ? 60 : 40 },
    { subject: 'Future Planning', A: Math.max(35, 75 - scores.emergency_fund.gap_months * 10) },
  ]

  const fundData = [
    { name: 'Current', value: scores.emergency_fund.current_months, fill: 'var(--emerald)' },
    { name: 'Target', value: scores.emergency_fund.target_months, fill: 'var(--border)' },
  ]

  const previewScenario = life_impact_preview?.scenarios?.find((item) => item.id === 'risky') || life_impact_preview?.scenarios?.[0]

  return (
    <div style={{ padding: '2rem 1rem 4rem' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)' }}>
          <div className="badge badge-green" style={{ marginBottom: '0.75rem' }}>Life Impact AI dashboard</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Overall preparedness: <span style={{ color: RISK_COLOR(scores.overall) }}>{scores.overall}/100</span>
          </h1>
          <p style={{ maxWidth: 700 }}>
            Your assessment now combines financial health with future-decision readiness, stress exposure, and resilience under real-life events.
          </p>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {[
            { score: scores.overall, label: 'Overall Health' },
            { score: scores.emergency_fund.score, label: 'Emergency Fund' },
            { score: scores.insurance.score, label: 'Insurance Coverage' },
            { score: scores.flood.score, label: 'Disaster Readiness' },
          ].map(({ score, label }) => (
            <div key={label} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ScoreRing score={score} label={label} size={100} />
              <span className={`badge ${RISK_BADGE(score)}`} style={{ marginTop: 8 }}>
                {RISK_LABEL(score)}
              </span>
            </div>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Financial health radar</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <Radar name="Score" dataKey="A" stroke="var(--emerald)" fill="var(--emerald)" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Emergency fund status</h3>
            <p style={{ fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              You currently cover <strong style={{ color: 'var(--navy)' }}>{scores.emergency_fund.current_months} month(s)</strong> of expenses.
              Target runway: <strong style={{ color: 'var(--navy)' }}>{scores.emergency_fund.target_months} months</strong>.
            </p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={fundData} barSize={44}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                <YAxis hide domain={[0, 8]} />
                <Tooltip formatter={(value) => [`${value} months`]} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {fundData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {scores.emergency_fund.gap_months > 0 && (
              <div style={{ marginTop: '1rem', padding: '12px 14px', background: 'var(--amber-light)', borderRadius: 10 }}>
                <p style={{ color: '#78350f', fontWeight: 600 }}>
                  Gap to close: ${scores.emergency_fund.gap_amount.toLocaleString()} across {scores.emergency_fund.gap_months} more month(s) of runway.
                </p>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Disaster risk by ZIP</h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '1rem',
                borderRadius: 12,
                background: scores.flood.risk_level === 'high' ? 'var(--red-light)' : scores.flood.risk_level === 'medium' ? 'var(--amber-light)' : 'var(--emerald-light)',
                marginBottom: '1rem',
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: scores.flood.risk_level === 'high' ? '#dc2626' : scores.flood.risk_level === 'medium' ? '#d97706' : '#059669' }} />
              <div>
                <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{scores.flood.risk_level} risk area</div>
                <p style={{ fontSize: '0.82rem' }}>ZIP {profile?.zip_code}</p>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem' }}>
              Standard home and renters coverage may not protect against every weather-related loss. Review flood exclusions before assuming you are covered.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Recommended protection</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insurance_recommendations.map((ins) => (
                <div key={ins.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{ins.name}</div>
                    <div style={{ fontWeight: 700, color: 'var(--emerald-dark)' }}>~${ins.avg_cost}/mo</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <p style={{ fontSize: '0.82rem' }}>{ins.description}</p>
                    <span
                      className="badge"
                      style={{
                        background: `${IMPORTANCE_COLOR[ins.importance]}18`,
                        color: IMPORTANCE_COLOR[ins.importance],
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {IMPORTANCE_LABEL[ins.importance]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {life_impact_preview && (
          <section className="card" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)', color: '#fff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
              <div>
                <div className="badge" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', marginBottom: '0.75rem' }}>
                  Simulator preview
                </div>
                <h2 style={{ marginBottom: '0.5rem' }}>What happens if you buy a car and then lose your job?</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>{life_impact_preview.ai_summary}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {life_impact_preview.scenarios.map((scenario) => (
                  <div key={scenario.id} style={{ padding: '1rem', borderRadius: 16, background: 'rgba(255,255,255,0.09)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)' }}>{scenario.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{scenario.post_event.resilience_score}</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)' }}>Post-event resilience</div>
                  </div>
                ))}
              </div>
            </div>
            {previewScenario && (
              <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: 16, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{previewScenario.label} warning</div>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Remaining savings after the event: ${previewScenario.post_event.remaining_savings.toLocaleString()}.
                  Goal delay: {previewScenario.goal_delay_months} months.
                </p>
              </div>
            )}
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={() => nav('/life-impact')}
                style={{ background: '#fff', color: 'var(--emerald-dark)', padding: '12px 18px', borderRadius: 12, fontWeight: 700 }}
              >
                Open Life Impact AI
              </button>
            </div>
          </section>
        )}

        <section className="card" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Your 90-day action plan</h2>
          <p style={{ marginBottom: '1.5rem' }}>A practical plan to reduce risk now and make future decisions from a stronger position.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {action_plan.map((item, idx) => (
              <div
                key={`${item.week}-${item.title}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr',
                  gap: '1rem',
                  alignItems: 'start',
                  padding: '1.25rem',
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: idx === 0 ? 'rgba(5,150,105,0.03)' : 'var(--white)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: item.priority === 'high' ? 'var(--emerald)' : 'var(--border)',
                      color: item.priority === 'high' ? '#fff' : 'var(--muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: '1rem',
                      margin: '0 auto 6px',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Week {item.week}</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 700 }}>{item.title}</h3>
                    <span className={`badge ${item.priority === 'high' ? 'badge-red' : 'badge-amber'}`}>
                      {item.priority === 'high' ? 'High priority' : 'Medium priority'}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--muted)' }}>{item.time_estimate}</span>
                  </div>
                  <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {item.tasks.map((task) => (
                      <li key={task} style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.5 }}>{task}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => nav('/life-impact')}
            style={{
              background: 'var(--emerald)',
              color: '#fff',
              padding: '14px 24px',
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            Simulate a life decision
          </button>
          <button
            onClick={() => nav('/chat')}
            style={{
              background: 'var(--white)',
              color: 'var(--navy)',
              padding: '14px 24px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              fontWeight: 600,
            }}
          >
            Ask the AI coach
          </button>
        </div>
      </div>
    </div>
  )
}
