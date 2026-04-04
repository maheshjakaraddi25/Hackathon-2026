const BASE = '/api'

async function authFetch(url, options = {}, getToken = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (getToken) {
    try {
      const token = await getToken({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } })
      headers['Authorization'] = `Bearer ${token}`
    } catch (e) {
      // Not logged in — proceed without token (for optional-auth routes)
    }
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res
}

export async function analyzeProfile(profile, getToken = null) {
  const res = await authFetch(`${BASE}/analyze`, {
    method: 'POST', body: JSON.stringify(profile),
  }, getToken)
  return res.json()
}

export async function sendChat(message, profile = null, getToken = null) {
  const res = await authFetch(`${BASE}/chat`, {
    method: 'POST', body: JSON.stringify({ message, profile }),
  }, getToken)
  return res.json()
}

export async function textToSpeech(text, getToken) {
  const res = await authFetch(`${BASE}/tts`, {
    method: 'POST', body: JSON.stringify({ text }),
  }, getToken)
  // Returns audio/mpeg blob
  return res.blob()
}

export async function getFloodRisk(zipCode, getToken = null) {
  const res = await authFetch(`${BASE}/flood-risk/${zipCode}`, {}, getToken)
  return res.json()
}

export async function getMe(getToken) {
  const res = await authFetch(`${BASE}/me`, {}, getToken)
  return res.json()
}
