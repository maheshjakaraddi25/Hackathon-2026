import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Navbar from './components/Navbar'

export default function App() {
  const [profile, setProfile] = useState(null)
  const [results, setResults] = useState(null)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar hasProfile={!!profile} />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/onboarding"
            element={<Onboarding setProfile={setProfile} setResults={setResults} />}
          />
          <Route
            path="/dashboard"
            element={
              results
                ? <Dashboard profile={profile} results={results} />
                : <Navigate to="/onboarding" replace />
            }
          />
          <Route
            path="/chat"
            element={<Chat profile={profile} />}
          />
        </Routes>
      </main>
    </div>
  )
}
