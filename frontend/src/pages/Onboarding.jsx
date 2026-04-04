import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeProfile } from '../utils/api'

const STEPS = [
  {
    id: 'basics',
    title: 'Tell us about yourself',
    subtitle: 'This helps us tailor your risk assessment.',
    fields: [
      { key: 'age', label: 'Your age', type: 'number', placeholder: '32', min: 18, max: 100 },
      {
        key: 'income_range', label: 'Annual household income', type: 'select',
        options: [
          { value: 'under_30k', label: 'Under $30,000' },
          { value: '30k_60k',   label: '$30,000 – $60,000' },
          { value: '60k_100k',  label: '$60,000 – $100,000' },
          { value: 'over_100k', label: 'Over $100,000' },
        ],
      },
      {
        key: 'employment', label: 'Employment status', type: 'select',
        options: [
          { value: 'employed',      label: 'Full-time employed' },
          { value: 'self_employed', label: 'Self-employed / Freelance' },
          { value: 'unemployed',    label: 'Unemployed / Seeking work' },
          { value: 'retired',       label: 'Retired' },
        ],
      },
    ],
  },
  {
    id: 'family',
    title: 'Family & housing',
    subtitle: 'Your living situation affects your insurance needs significantly.',
    fields: [
      { key: 'dependents', label: 'Number of dependents (children, elderly parents, etc.)', type: 'number', placeholder: '0', min: 0, max: 20 },
      {
        key: 'housing_type', label: 'Housing situation', type: 'select',
        options: [
          { value: 'rent',  label: 'I rent an apartment/home' },
          { value: 'own',   label: 'I own my home' },
          { value: 'other', label: 'Other (living with family, etc.)' },
        ],
      },
      { key: 'zip_code', label: 'ZIP code (for disaster risk)', type: 'text', placeholder: '90210', maxLength: 5 },
    ],
  },
  {
    id: 'savings',
    title: 'Your current savings',
    subtitle: "Be honest — there's no judgment here.",
    fields: [
      {
        key: 'has_savings', label: 'Do you have any dedicated emergency savings?', type: 'select',
        options: [
          { value: 'true',  label: 'Yes, I have some savings' },
          { value: 'false', label: 'No, I don\'t have emergency savings' },
        ],
      },
      {
        key: 'savings_months', label: 'Roughly how many months of expenses could you cover?', type: 'select',
        options: [
          { value: '0', label: 'None / Less than 1 month' },
          { value: '1', label: 'About 1 month' },
          { value: '2', label: 'About 2 months' },
          { value: '3', label: '3 months' },
          { value: '4', label: '4–5 months' },
          { value: '6', label: '6+ months ✓' },
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
  housing_type: '',
  zip_code: '',
  has_savings: '',
  savings_months: '',
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid var(--border)',
  borderRadius: 10,
  fontSize: '0.9rem',
  background: 'var(--white)',
  color: 'var(--navy)',
  appearance: 'none',
  WebkitAppearance: 'none',
}
const focusStyle = { borderColor: 'var(--emerald)', boxShadow: '0 0 0 3px rgba(5,150,105,0.15)' }

export default function Onboarding({ setProfile, setResults }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(null)
  const navigate = useNavigate()

  const current = STEPS[step]
  const progress = ((step) / STEPS.length) * 100

  function validate() {
    const errs = {}
    for (const field of current.fields) {
      const val = form[field.key]
      if (!val && val !== 0) errs[field.key] = 'This field is required'
      if (field.key === 'zip_code' && val && !/^\d{5}$/.test(val)) errs[field.key] = 'Enter a valid 5-digit ZIP'
      if (field.key === 'age' && val && (parseInt(val) < 18 || parseInt(val) > 100)) errs[field.key] = 'Enter a valid age (18–100)'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleNext() {
    if (!validate()) return
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
      return
    }
    // Submit
    setLoading(true)
    try {
      const payload = {
        ...form,
        age: parseInt(form.age),
        dependents: parseInt(form.dependents),
        has_savings: form.has_savings === 'true',
        savings_months: parseInt(form.savings_months),
      }
      setProfile(payload)
      const data = await analyzeProfile(payload)
      setResults(data)
      navigate('/dashboard')
    } catch (e) {
      alert('Something went wrong. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Progress */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>
              Step {step + 1} of {STEPS.length}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: 600 }}>
              {Math.round(((step + 1) / STEPS.length) * 100)}%
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
            <div style={{
              height: '100%',
              width: `${((step + 1) / STEPS.length) * 100}%`,
              background: 'var(--emerald)',
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {STEPS.map((s, i) => (
              <span key={s.id} style={{
                fontSize: '0.72rem',
                color: i <= step ? 'var(--emerald)' : 'var(--muted)',
                fontWeight: i === step ? 600 : 400,
              }}>
                {s.id.charAt(0).toUpperCase() + s.id.slice(1)}
              </span>
            ))}
          </div>
        </div>

        {/* Card */}
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
                  <select
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    onFocus={() => setFocused(field.key)}
                    onBlur={() => setFocused(null)}
                    style={{ ...inputStyle, ...(focused === field.key ? focusStyle : {}) }}
                  >
                    <option value="">Select an option…</option>
                    {field.options.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    onFocus={() => setFocused(field.key)}
                    onBlur={() => setFocused(null)}
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    maxLength={field.maxLength}
                    style={{ ...inputStyle, ...(focused === field.key ? focusStyle : {}) }}
                  />
                )}
                {errors[field.key] && (
                  <p style={{ color: 'var(--red)', fontSize: '0.78rem', marginTop: 4 }}>
                    ⚠ {errors[field.key]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: '2rem' }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: 'transparent', border: '1.5px solid var(--border)',
                  color: 'var(--muted)',
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={loading}
              style={{
                flex: 2, padding: '12px', borderRadius: 10,
                background: loading ? 'var(--muted)' : 'var(--emerald)',
                color: '#fff', fontWeight: 600, fontSize: '0.95rem',
              }}
            >
              {loading ? 'Analyzing…' : step === STEPS.length - 1 ? 'See My Results →' : 'Continue →'}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '1rem' }}>
          🔒 Your data stays private. We don't sell or store it.
        </p>
      </div>
    </div>
  )
}
