import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ hasProfile }) {
  const { pathname } = useLocation()

  const navStyle = {
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  }
  const inner = {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 1.5rem',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }
  const logo = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    color: 'var(--navy)',
  }
  const links = { display: 'flex', alignItems: 'center', gap: 8 }
  const linkStyle = (active) => ({
    textDecoration: 'none',
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: '0.875rem',
    fontWeight: 500,
    color: active ? 'var(--emerald-dark)' : 'var(--muted)',
    background: active ? 'var(--emerald-light)' : 'transparent',
    transition: 'all 0.15s',
  })

  return (
    <nav style={navStyle}>
      <div style={inner}>
        <Link to="/" style={logo}>
          <ShieldIcon />
          FinGuard AI
        </Link>
        <div style={links}>
          {hasProfile && (
            <>
              <Link to="/dashboard" style={linkStyle(pathname === '/dashboard')}>
                Dashboard
              </Link>
              <Link to="/life-impact" style={linkStyle(pathname === '/life-impact')}>
                Life Impact AI
              </Link>
              <Link to="/chat" style={linkStyle(pathname === '/chat')}>
                AI Coach
              </Link>
            </>
          )}
          <Link
            to="/onboarding"
            style={{
              ...linkStyle(false),
              background: 'var(--emerald)',
              color: '#fff',
              padding: '6px 18px',
            }}
          >
            {hasProfile ? 'Retake Quiz' : 'Get Started'}
          </Link>
        </div>
      </div>
    </nav>
  )
}

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z"
        fill="var(--emerald)"
        opacity="0.15"
        stroke="var(--emerald)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="var(--emerald)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
