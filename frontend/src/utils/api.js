const BASE = '/api'

export async function analyzeProfile(profile) {
  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!res.ok) throw new Error('Analysis failed')
  return res.json()
}

export async function sendChat(message, profile = null) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, profile }),
  })
  if (!res.ok) throw new Error('Chat failed')
  return res.json()
}

export async function getLifeImpactSimulation(decisionType, eventType, profile) {
  const res = await fetch(`${BASE}/life-impact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision_type: decisionType,
      event_type: eventType,
      profile,
    }),
  })
  if (!res.ok) throw new Error('Life impact simulation failed')
  return res.json()
}

export async function getFloodRisk(zipCode) {
  const res = await fetch(`${BASE}/flood-risk/${zipCode}`)
  if (!res.ok) throw new Error('Flood risk lookup failed')
  return res.json()
}
