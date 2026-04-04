export default function ScoreRing({ score, label, size = 120 }) {
  const r = (size / 2) - 10
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 70 ? 'var(--emerald)' : score >= 40 ? 'var(--amber)' : 'var(--red)'
  const textColor = score >= 70 ? 'var(--emerald-dark)' : score >= 40 ? '#78350f' : '#7f1d1d'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--border)" strokeWidth={8}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text
          x={size / 2} y={size / 2 + 2}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.22} fontWeight="600"
          fill={textColor}
          fontFamily="var(--font-display)"
        >
          {score}
        </text>
      </svg>
      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted)', textAlign: 'center', maxWidth: 90 }}>
        {label}
      </span>
    </div>
  )
}
