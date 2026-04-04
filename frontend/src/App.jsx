import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Navbar from './components/Navbar'

// Wraps routes that require login
function ProtectedRoute({ element }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) {
    loginWithRedirect()
    return <LoadingScreen />
  }
  return element
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: '3px solid var(--emerald-light)', borderTopColor: 'var(--emerald)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function App() {
  const [profile, setProfile] = useState(null)
  const [results, setResults] = useState(null)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar hasProfile={!!profile} />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding setProfile={setProfile} setResults={setResults} />} />
          <Route path="/dashboard" element={
            results
              ? <ProtectedRoute element={<Dashboard profile={profile} results={results} />} />
              : <Navigate to="/onboarding" replace />
          } />
          <Route path="/chat" element={<ProtectedRoute element={<Chat profile={profile} />} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
