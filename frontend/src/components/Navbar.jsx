import { Link, useLocation } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

export default function Navbar({ hasProfile }) {
  const { pathname } = useLocation()
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0()

  const navStyle = {
    background: 'rgba(250, 247, 241, 0.88)',
    backdropFilter: 'blur(18px)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  }

  const linkStyle = (active) => ({
    textDecoration: 'none',
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: active ? 'var(--ink)' : 'var(--muted)',
    background: active ? 'rgba(200, 88, 54, 0.12)' : 'transparent',
    transition: 'all 0.2s ease',
  })

  return (
    <nav style={navStyle}>
      <div className="container" style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'var(--ink)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))', display: 'grid', placeItems: 'center', color: '#fff', boxShadow: 'var(--shadow)' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700 }}>LI</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', lineHeight: 1 }}>Life Impact AI</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Smarter decisions beyond money</div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {hasProfile && isAuthenticated && (
            <>
              <Link to="/dashboard" style={linkStyle(pathname === '/dashboard')}>Simulator</Link>
              <Link to="/chat" style={linkStyle(pathname === '/chat')}>AI Coach</Link>
            </>
          )}

          {!isLoading && (
            isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid rgba(200, 88, 54, 0.18)' }} />
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.given_name || user?.name?.split(' ')[0] || 'User'}
                </span>
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  style={{ padding: '9px 14px', borderRadius: 999, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)' }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => loginWithRedirect()}
                  style={{ padding: '9px 14px', borderRadius: 999, background: 'transparent', border: '1px solid var(--border)', color: 'var(--ink)' }}
                >
                  Sign in
                </button>
                <button
                  onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
                  style={{ padding: '9px 16px', borderRadius: 999, background: 'var(--accent)', color: '#fff', fontWeight: 700 }}
                >
                  Try simulator
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  )
}
