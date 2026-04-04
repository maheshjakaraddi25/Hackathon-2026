import { Link, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

export default function Navbar({ hasProfile }) {
  const { pathname } = useLocation()
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0()

  const navStyle = {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 100,
  }
  const inner = {
    maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem',
    height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }
  const logo = {
    display: 'flex', alignItems: 'center', gap: 10,
    textDecoration: 'none', fontFamily: 'var(--font-display)',
    fontSize: '1.25rem', color: 'var(--navy)',
  }
  const linkStyle = (active) => ({
    textDecoration: 'none', padding: '6px 14px', borderRadius: 8,
    fontSize: '0.875rem', fontWeight: 500,
    color: active ? 'var(--emerald-dark)' : 'var(--muted)',
    background: active ? 'var(--emerald-light)' : 'transparent',
    transition: 'all 0.15s',
  })

  return (
    <nav style={navStyle}>
      <div style={inner}>
        {/* Logo */}
        <Link to="/" style={logo}>
          <ShieldIcon />
          FinGuard AI
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasProfile && isAuthenticated && (
            <>
              <Link to="/dashboard" style={linkStyle(pathname === '/dashboard')}>Dashboard</Link>
              <Link to="/chat"      style={linkStyle(pathname === '/chat')}>AI Coach</Link>
            </>
          )}

          {!isLoading && (
            isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* User avatar */}
                {user?.picture
                  ? <img src={user.picture} alt={user.name} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--emerald-light)' }} />
                  : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                }
                {/* User name (desktop only) */}
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.given_name || user?.name?.split(' ')[0] || 'User'}
                </span>
                {/* Logout */}
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  style={{ padding: '6px 14px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => loginWithRedirect()}
                  style={{ padding: '6px 16px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--navy)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
                >
                  Sign in
                </button>
                <button
                  onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
                  style={{ padding: '6px 18px', borderRadius: 8, background: 'var(--emerald)', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Get Started
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  )
}

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z"
        fill="var(--emerald)" opacity="0.15" stroke="var(--emerald)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
