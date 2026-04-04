import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { analyzeProfile } from '../utils/api'

const STEPS = [
  {
    id: 'profile',
    title: 'Tell us about your life context',
    subtitle: 'This helps the simulator reason about stress, resilience, and tradeoffs.',
    fields: [
      { key: 'age', label: 'Your age', type: 'number', placeholder: '29', min: 18, max: 100 },
      {
        key: 'income_range',
        label: 'Annual household income',
        type: 'select',
        options: [
          { value: 'under_30k', label: 'Under $30,000' },
          { value: '30k_60k', label: '$30,000 - $60,000' },
          { value: '60k_100k', label: '$60,000 - $100,000' },
          { value: 'over_100k', label: 'Over $100,000' },
        ],
      },
      {
        key: 'employment',
        label: 'Employment status',
        type: 'select',
        options: [
          { value: 'employed', label: 'Employed full time' },
          { value: 'self_employed', label: 'Self-employed' },
          { value: 'unemployed', label: 'Between jobs' },
          { value: 'retired', label: 'Retired' },
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
        key: 'decision_type',
        label: 'Decision type',
        type: 'select',
        options: [
          { value: 'buy_car', label: 'Buy a car' },
          { value: 'move_city', label: 'Move to a new city' },
          { value: 'take_loan', label: 'Take a loan' },
          { value: 'change_job', label: 'Change jobs' },
        ],
      },
      { key: 'decision_cost', label: 'Expected monthly cost or income hit', type: 'number', placeholder: '850', min: 100, max: 10000 },
      { key: 'time_horizon', label: 'Planning horizon (months)', type: 'number', placeholder: '12', min: 3, max: 36 },
      {
        key: 'goal_priority',
        label: 'Top life goal to protect',
        type: 'select',
        options: [
          { value: 'emergency_fund', label: 'Build emergency fund' },
          { value: 'family_security', label: 'Support family security' },
          { value: 'homeownership', label: 'Save for homeownership' },
          { value: 'career_growth', label: 'Invest in career growth' },
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
        key: 'current_savings',
        label: 'Emergency savings available today',
        type: 'select',
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
        key: 'stress_level',
        label: 'Current stress level',
        type: 'select',
        options: [
          { value: '2', label: 'Low and manageable' },
          { value: '5', label: 'Moderate and steady' },
          { value: '8', label: 'High and tiring' },
        ],
      },
    ],
  },
]

const DEFAULT_FORM = {
  age: '',
  income_range: '',
  employment: '',
  dependents: '',
  current_savings: '',
  stress_level: '',
  goal_priority: '',
  decision_type: '',
  decision_cost: '',
  time_horizon: '',
}

const inputStyle = {
  width: '100%',
  padding: '13px 14px',
  border: '1px solid var(--border)',
  borderRadius: 18,
  fontSize: '0.95rem',
  background: 'rgba(255,255,255,0.88)',
  color: 'var(--ink)',
  appearance: 'none',
  WebkitAppearance: 'none',
}

export default function Onboarding({ setProfile, setResults }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()

  const current = STEPS[step]

  function validate() {
    const nextErrors = {}
    for (const field of current.fields) {
      const value = form[field.key]
      if (value === '') nextErrors[field.key] = 'This field is required.'
      if (field.key === 'age' && value && (parseInt(value, 10) < 18 || parseInt(value, 10) > 100)) {
        nextErrors[field.key] = 'Enter an age between 18 and 100.'
      }
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleNext() {
    if (!validate()) return
    if (step < STEPS.length - 1) {
      setStep((value) => value + 1)
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        age: parseInt(form.age, 10),
        dependents: parseInt(form.dependents, 10),
        current_savings: parseInt(form.current_savings, 10),
        stress_level: parseInt(form.stress_level, 10),
        decision_cost: parseInt(form.decision_cost, 10),
        time_horizon: parseInt(form.time_horizon, 10),
      }
      setProfile(payload)
      const getToken = isAuthenticated
        ? () => getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } })
        : null
      const data = await analyzeProfile(payload, getToken)
      setResults(data)
      navigate('/dashboard')
    } catch {
      alert('Something went wrong. Make sure the backend is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 68px)', padding: '2rem 1rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 620 }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--muted)' }}>Step {step + 1} of {STEPS.length}</span>
            <span style={{ color: 'var(--accent-strong)', fontWeight: 700 }}>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(119, 96, 73, 0.1)', borderRadius: 999 }}>
            <div style={{ width: `${((step + 1) / STEPS.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-strong))', borderRadius: 999, transition: 'width 0.25s ease' }} />
          </div>
        </div>

        <div className="glass-panel fade-up" style={{ padding: '2rem' }}>
          <div className="mini-kicker">Decision intake</div>
          <h2 style={{ marginTop: '0.35rem' }}>{current.title}</h2>
          <p style={{ marginTop: '0.5rem', marginBottom: '1.75rem' }}>{current.subtitle}</p>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {current.fields.map((field) => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{field.label}</label>
                {field.type === 'select' ? (
                  <select value={form[field.key]} onChange={(event) => setForm((value) => ({ ...value, [field.key]: event.target.value }))} style={inputStyle}>
                    <option value="">Select an option</option>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={(event) => setForm((value) => ({ ...value, [field.key]: event.target.value }))}
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    style={inputStyle}
                  />
                )}
                {errors[field.key] && <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: 6 }}>{errors[field.key]}</p>}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: '1.8rem' }}>
            {step > 0 && (
              <button className="secondary-button" style={{ flex: 1 }} onClick={() => setStep((value) => value - 1)}>
                Back
              </button>
            )}
            <button className="primary-button" style={{ flex: 2, justifyContent: 'center' }} onClick={handleNext} disabled={loading}>
              {loading ? 'Simulating...' : 'Generate futures'}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '1rem' }}>Private by design. Sign in is optional for the demo, and voice features work best when authenticated.</p>
      </div>
    </div>
  )
}
