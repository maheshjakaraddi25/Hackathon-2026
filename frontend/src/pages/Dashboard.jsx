import { useNavigate } from 'react-router-dom'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import ScoreRing from '../components/ScoreRing'

const RISK_COLOR = (score) => score >= 70 ? 'var(--emerald)' : score >= 40 ? 'var(--amber)' : 'var(--red)'
const RISK_LABEL = (score) => score >= 70 ? 'Good' : score >= 40 ? 'Needs Work' : 'At Risk'
const RISK_BADGE = (score) => score >= 70 ? 'badge-green' : score >= 40 ? 'badge-amber' : 'badge-red'

const IMPORTANCE_COLOR = { critical: '#dc2626', high: '#d97706', medium: '#0284c7', low: '#64748b' }
const IMPORTANCE_LABEL = { critical: '🚨 Critical', high: '⚠️ High', medium: '📌 Recommended', low: '💡 Optional' }

export default function Dashboard({ profile, results }) {
  const nav = useNavigate()
  const { scores, action_plan, insurance_recommendations } = results

  const radarData = [
    { subject: 'Emergency Fund', A: scores.emergency_fund.score },
    { subject: 'Insurance',      A: scores.insurance.score },
    { subject: 'Disaster Prep',  A: scores.flood.score },
    { subject: 'Income Security', A: profile?.employment === 'employed' ? 75 : 45 },
    { subject: 'Future Planning', A: profile?.age < 40 ? 60 : 70 },
  ]

  const fundData = [
    { name: 'Current', value: scores.emergency_fund.current_months, fill: 'var(--emerald)' },
    { name: 'Target',  value: scores.emergency_fund.target_months,  fill: 'var(--border)' },
  ]

  return (
    <div style={{ padding: '2rem 1rem' }}>
      <div className="container">

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: '2rem' }}>
          <div className="badge badge-green" style={{ marginBottom: '0.75rem' }}>Your Financial Health Report</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Overall Score: <span style={{ color: RISK_COLOR(scores.overall) }}>{scores.overall}/100</span>
          </h1>
          <p>Here's a personalized breakdown of your financial preparedness.</p>
        </div>

        {/* Score cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { score: scores.overall,                   label: 'Overall Health' },
            { score: scores.emergency_fund.score,      label: 'Emergency Fund' },
            { score: scores.insurance.score,           label: 'Insurance Coverage' },
            { score: scores.flood.score,               label: 'Disaster Readiness' },
          ].map(({ score, label }) => (
            <div key={label} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ScoreRing score={score} label={label} size={100} />
              <span className={`badge ${RISK_BADGE(score)}`} style={{ marginTop: 8 }}>
                {RISK_LABEL(score)}
              </span>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

          {/* Radar chart */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>📊 Financial Health Radar</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <Radar name="Score" dataKey="A" stroke="var(--emerald)" fill="var(--emerald)" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Emergency fund detail */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>💰 Emergency Fund Status</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              You have <strong style={{ color: 'var(--navy)' }}>{scores.emergency_fund.current_months} month(s)</strong> saved.
              {' '}Target: <strong style={{ color: 'var(--navy)' }}>{scores.emergency_fund.target_months} months</strong>.
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={fundData} barSize={40}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                <YAxis hide domain={[0, 8]} />
                <Tooltip formatter={(v) => [`${v} months`]} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {fundData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {scores.emergency_fund.gap_months > 0 && (
              <div style={{
                marginTop: '1rem', padding: '12px 14px',
                background: 'var(--amber-light)', borderRadius: 8,
                border: '1px solid #fcd34d',
              }}>
                <p style={{ fontSize: '0.85rem', color: '#78350f', fontWeight: 500 }}>
                  Gap: ${scores.emergency_fund.gap_amount.toLocaleString()} ({scores.emergency_fund.gap_months} more months needed)
                </p>
              </div>
            )}
          </div>

          {/* Flood risk */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>🌊 Disaster Risk — ZIP {profile?.zip_code}</h3>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '1rem', borderRadius: 10,
              background: scores.flood.risk_level === 'high' ? 'var(--red-light)' :
                          scores.flood.risk_level === 'medium' ? 'var(--amber-light)' : 'var(--emerald-light)',
              marginBottom: '1rem',
            }}>
              <span style={{ fontSize: '2rem' }}>
                {scores.flood.risk_level === 'high' ? '🔴' : scores.flood.risk_level === 'medium' ? '🟡' : '🟢'}
              </span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--navy)', textTransform: 'capitalize' }}>
                  {scores.flood.risk_level} Flood Risk
                </div>
                <p style={{ fontSize: '0.8rem', marginTop: 2 }}>Based on your ZIP code area</p>
              </div>
            </div>
            {scores.flood.risk_level !== 'low' && (
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                ⚠ Standard renters/homeowners insurance typically does <strong>not</strong> cover flooding. 
                Consider a separate flood insurance policy through FEMA's NFIP program.
              </div>
            )}
            {scores.flood.risk_level === 'low' && (
              <p style={{ fontSize: '0.85rem' }}>
                Your area has relatively low flood risk. Your standard insurance should provide adequate coverage for most weather events.
              </p>
            )}
          </div>

          {/* Insurance gaps */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>🛡️ Recommended Insurance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insurance_recommendations.map(ins => (
                <div key={ins.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: ins.importance === 'critical' ? 'var(--red-light)' : 'var(--white)',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--navy)' }}>{ins.name}</span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600,
                        color: IMPORTANCE_COLOR[ins.importance],
                        padding: '1px 6px', borderRadius: 99,
                        background: `${IMPORTANCE_COLOR[ins.importance]}18`,
                      }}>
                        {IMPORTANCE_LABEL[ins.importance]}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', margin: 0 }}>{ins.description}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--emerald-dark)' }}>
                      ~${ins.avg_cost}/mo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Plan */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>🗓️ Your 90-Day Action Plan</h2>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Personalized steps to close your financial gaps.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {action_plan.map((item, idx) => (
              <div key={idx} style={{
                display: 'grid', gridTemplateColumns: '80px 1fr',
                gap: '1rem', alignItems: 'start',
                padding: '1.25rem', borderRadius: 12,
                border: '1px solid var(--border)',
                background: idx === 0 ? 'rgba(5,150,105,0.03)' : 'var(--white)',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: item.priority === 'high' ? 'var(--emerald)' : 'var(--border)',
                    color: item.priority === 'high' ? '#fff' : 'var(--muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: '1rem',
                    margin: '0 auto 6px',
                  }}>
                    {idx + 1}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                    Week {item.week}
                  </span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{item.title}</h3>
                    <span className={`badge ${item.priority === 'high' ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                      {item.priority === 'high' ? 'High priority' : 'Medium'}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      ⏱ {item.time_estimate}
                    </span>
                  </div>
                  <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {item.tasks.map((task, ti) => (
                      <li key={ti} style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5 }}>{task}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <button
            onClick={() => nav('/chat')}
            style={{
              background: 'var(--emerald)', color: '#fff',
              padding: '14px 28px', borderRadius: 99,
              fontWeight: 600, fontSize: '0.95rem',
              boxShadow: '0 4px 20px rgba(5,150,105,0.3)',
            }}
          >
            💬 Ask AI Coach a Question
          </button>
          <button
            onClick={() => nav('/onboarding')}
            style={{
              background: 'var(--white)', color: 'var(--navy)',
              padding: '14px 28px', borderRadius: 99,
              border: '1.5px solid var(--border)',
              fontWeight: 500, fontSize: '0.95rem',
            }}
          >
            Retake Assessment
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', paddingBottom: '2rem' }}>
          This is for educational purposes only. Consult a licensed financial advisor or insurance professional.
        </p>
      </div>
    </div>
  )
}
