import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { simulateProfile } from '../utils/api'

const STEPS = [
  {
    id: 'profile',
    title: 'Tell us about your life context',
    subtitle: 'This helps the simulator reason about stress, resilience, and tradeoffs.',
    fields: [
      { key: 'age', label: 'Your age', type: 'number', placeholder: '29', min: 18, max: 100 },
      {
        key: 'income_range', label: 'Annual household income', type: 'select',
        options: [
          { value: 'under_30k', label: 'Under $30,000' },
          { value: '30k_60k',   label: '$30,000 - $60,000' },
          { value: '60k_100k',  label: '$60,000 - $100,000' },
          { value: 'over_100k', label: 'Over $100,000' },
        ],
      },
      {
        key: 'employment', label: 'Employment status', type: 'select',
        options: [
          { value: 'employed',      label: 'Employed full time' },
          { value: 'self_employed', label: 'Self-employed' },
          { value: 'unemployed',    label: 'Between jobs' },
          { value: 'retired',       label: 'Retired' },
        ],
      },
      { key: 'dependents', label: 'Dependents relying on you', type: 'number', placeholder: '1', min: 0, max: 10 },
    ],
  },
  {
    id: 'decision',
    title: 'What decision are you considering?',
    subtitle: 'We will simulate its impact across money, stress, risk, and goals.',
    fields: [
      {
        key: 'decision_type', label: 'Decision type', type: 'select',
        options: [
          { value: 'buy_car',    label: '🚗 Buy a car' },
          { value: 'move_city',  label: '🏙️ Move to a new city' },
          { value: 'take_loan',  label: '💳 Take a loan' },
          { value: 'change_job', label: '💼 Change jobs' },
        ],
      },
      { key: 'decision_cost', label: 'Expected monthly cost or income hit ($)', type: 'number', placeholder: '850', min: 100, max: 10000 },
      { key: 'time_horizon',  label: 'Planning horizon (months)',               type: 'number', placeholder: '12',  min: 3,   max: 36 },
      {
        key: 'goal_priority', label: 'Top life goal to protect', type: 'select',
        options: [
          { value: 'emergency_fund',  label: '🛡️ Build emergency fund' },
          { value: 'family_security', label: '👨‍👩‍👧 Support family security' },
          { value: 'homeownership',   label: '🏡 Save for homeownership' },
          { value: 'career_growth',   label: '🚀 Invest in career growth' },
        ],
      },
    ],
  },
  {
    id: 'resilience',
    title: 'How prepared do you feel today?',
    subtitle: 'This helps the AI coach understand your current buffer and stress load.',
    fields: [
      {
        key: 'current_savings', label: 'Emergency savings available today', type: 'select',
        options: [
          { value: '0', label: 'Less than 1 month' },
          { value: '1', label: 'About 1 month' },
          { value: '2', label: 'About 2 months' },
          { value: '3', label: 'About 3 months' },
          { value: '4', label: '4 to 5 months' },
          { value: '6', label: '6 or more months' },
        ],
      },
      {
        key: 'stress_level', label: 'Current financial stress level', type: 'select',
        options: [
          { value: '2', label: '😌 Low and manageable' },
          { value: '5', label: '😐 Moderate and steady' },
          { value: '8', label: '😰 High and tiring' },
        ],
      },
    ],
  },
]

const DEFAULT_FORM = {
  age: '', income_range: '', employment: '', dependents: '',
  decision_type: '', decision_cost: '', time_horizon: '', goal_priority: '',
  current_savings: '', stress_level: '',
}

export default function SimulatorOnboarding({ setSimProfile, setSimResults }) {
  const [step, setStep]       = useState(0)
  const [form, setForm]       = useState(DEFAULT_FORM)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()

  const current = STEPS[step]

  function validate() {
    const errs = {}
    for (const field of current.fields) {
      const val = form[field.key]
      if (val === '') errs[field.key] = 'This field is required.'
      if (field.key === 'age' && val && (parseInt(val) < 18 || parseInt(val) > 100))
        errs[field.key] = 'Enter an age between 18 and 100.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleNext() {
    if (!validate()) return
    if (step < STEPS.length - 1) { setStep(s => s + 1); return }

    setLoading(true)
    try {
      const payload = {
        ...form,
        age:            parseInt(form.age),
        dependents:     parseInt(form.dependents),
        current_savings:parseInt(form.current_savings),
        stress_level:   parseInt(form.stress_level),
        decision_cost:  parseInt(form.decision_cost),
        time_horizon:   parseInt(form.time_horizon),
      }
      setSimProfile(payload)
      const getToken = isAuthenticated
        ? () => getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } })
        : null
      const data = await simulateProfile(payload, getToken)
      setSimResults(data)
      navigate('/simulator/results')
    } catch {
      alert('Something went wrong. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: '0.9rem', background: 'var(--white)', color: 'var(--navy)',
    appearance: 'none', WebkitAppearance: 'none',
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>

        {/* Progress bar */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>Step {step + 1} of {STEPS.length}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: 600 }}>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, background: 'var(--emerald)', borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Mode badge */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <span className="badge badge-amber">⚡ Life Impact Simulator</span>
        </div>

        <div className="card fade-up" style={{ padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>{current.title}</h2>
          <p style={{ marginBottom: '2rem', fontSize: '0.9rem' }}>{current.subtitle}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {current.fields.map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--navy)', marginBottom: 6 }}>
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} style={inputStyle}>
                    <option value="">Select an option...</option>
                    {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input type={field.type} value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder} min={field.min} max={field.max} style={inputStyle} />
                )}
                {errors[field.key] && (
                  <p style={{ color: 'var(--red)', fontSize: '0.78rem', marginTop: 4 }}>{errors[field.key]}</p>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: '2rem' }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'transparent', border: '1.5px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}>
                ← Back
              </button>
            )}
            <button onClick={handleNext} disabled={loading}
              style={{ flex: 2, padding: '12px', borderRadius: 10, background: loading ? 'var(--muted)' : 'var(--emerald)', color: '#fff', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '⚡ Simulating futures...' : step === STEPS.length - 1 ? 'Run Simulation →' : 'Continue →'}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '1rem', color: 'var(--muted)' }}>
          Private by design. Sign in is optional for the demo.
        </p>
      </div>
    </div>
  )
}
