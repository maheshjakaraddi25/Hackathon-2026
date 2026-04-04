import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { sendChat } from '../utils/api'

const SUGGESTIONS = [
  'What would buying a car do to my future stability?',
  'How should I prepare for job loss if I only have 2 months saved?',
  'Would taking a loan delay my goals too much?',
  'How do I reduce money stress before making a big purchase?',
  'What protection matters most for my situation?',
]

export default function Chat({ profile }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I am your Life Impact AI coach.

I can help you think through future decisions, financial tradeoffs, stress exposure, insurance gaps, and emergency-fund planning in plain language.

Ask me about a choice you are considering, or use the simulator to compare safe, balanced, and risky futures.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const data = await sendChat(msg, profile)
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I could not connect to the server. Make sure the backend is running on port 8000.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 60px)',
        maxWidth: 760,
        margin: '0 auto',
        padding: '0 1rem',
      }}
    >
      <div style={{ padding: '1rem 0 0.75rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--emerald), #0f766e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            AI
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--navy)' }}>Life Impact AI Coach</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--emerald)' }}>Online and ready to reason through decisions with you</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--emerald)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  marginRight: 8,
                  marginTop: 4,
                }}
              >
                AI
              </div>
            )}
            <div
              style={{
                maxWidth: '82%',
                padding: '12px 14px',
                borderRadius: msg.role === 'user' ? '18px 18px 6px 18px' : '6px 18px 18px 18px',
                background: msg.role === 'user' ? 'var(--emerald)' : 'var(--white)',
                color: msg.role === 'user' ? '#fff' : 'var(--navy)',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                fontSize: '0.92rem',
                lineHeight: 1.65,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p style={{ margin: '0 0 0.6rem', color: 'var(--navy)' }}>{children}</p>,
                    strong: ({ children }) => <strong style={{ color: 'var(--navy)', fontWeight: 700 }}>{children}</strong>,
                    ul: ({ children }) => <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0' }}>{children}</ul>,
                    li: ({ children }) => <li style={{ color: 'var(--muted)', marginBottom: 4 }}>{children}</li>,
                    h2: ({ children }) => <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem', marginTop: '0.75rem' }}>{children}</h2>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--emerald)' }} />
            <div style={{ padding: '10px 16px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px 18px 18px 18px' }}>
              <span style={{ color: 'var(--muted)' }}>Thinking through the tradeoffs...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div style={{ padding: '0.5rem 0 0.75rem' }}>
          <p style={{ fontSize: '0.78rem', marginBottom: 8 }}>Suggested questions</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => send(suggestion)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 999,
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  color: 'var(--navy)',
                  fontSize: '0.8rem',
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '0.75rem 0 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about a decision, risk, savings, or stress trigger..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1.5px solid var(--border)',
            borderRadius: 999,
            fontSize: '0.92rem',
            background: 'var(--white)',
            color: 'var(--navy)',
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: input.trim() ? 'var(--emerald)' : 'var(--border)',
            color: '#fff',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          Go
        </button>
      </div>
    </div>
  )
}
