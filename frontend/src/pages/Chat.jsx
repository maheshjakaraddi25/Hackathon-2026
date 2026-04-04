import { useState, useRef, useEffect } from 'react'
import { sendChat } from '../utils/api'
import ReactMarkdown from 'react-markdown'

const SUGGESTIONS = [
  'What is an emergency fund and how much do I need?',
  'What does renters insurance actually cover?',
  'Do I need life insurance?',
  'How does the 50/30/20 budget rule work?',
  'What is disability insurance?',
]

export default function Chat({ profile }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm your FinGuard AI financial wellness coach. 👋

I can explain insurance products, help you understand emergency funds, walk you through budgeting basics, and answer any financial literacy questions — all in plain English, no jargon.

What would you like to know?`,
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
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const data = await sendChat(msg, profile)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ I couldn\'t connect to the server. Make sure the backend is running on port 8000.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 60px)',
      maxWidth: 720, margin: '0 auto', padding: '0 1rem',
    }}>

      {/* Header */}
      <div style={{ padding: '1rem 0 0.5rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--emerald)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
          }}>🛡</div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--navy)' }}>FinGuard AI Coach</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--emerald)' }}>● Online — financial wellness expert</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--emerald)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', marginRight: 8, marginTop: 4,
              }}>🛡</div>
            )}
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
              background: msg.role === 'user' ? 'var(--emerald)' : 'var(--white)',
              color: msg.role === 'user' ? '#fff' : 'var(--navy)',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              fontSize: '0.9rem', lineHeight: 1.65,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p style={{ margin: '0 0 0.5rem', color: 'var(--navy)' }}>{children}</p>,
                    strong: ({ children }) => <strong style={{ color: 'var(--navy)', fontWeight: 600 }}>{children}</strong>,
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
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: 'var(--emerald)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
            }}>🛡</div>
            <div style={{
              padding: '10px 16px', background: 'var(--white)', border: '1px solid var(--border)',
              borderRadius: '4px 18px 18px 18px', display: 'flex', gap: 4,
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, background: 'var(--muted)', borderRadius: '50%',
                  animation: 'fadeUp 0.6s ease infinite',
                  animationDelay: `${i * 0.15}s`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.78rem', marginBottom: 8 }}>Suggested questions:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  padding: '6px 12px', borderRadius: 99,
                  background: 'var(--white)', border: '1px solid var(--border)',
                  color: 'var(--navy)', fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '0.75rem 0 1rem',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about budgeting, insurance, emergency funds…"
          disabled={loading}
          style={{
            flex: 1, padding: '11px 16px',
            border: '1.5px solid var(--border)', borderRadius: 99,
            fontSize: '0.9rem', background: 'var(--white)', color: 'var(--navy)',
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: input.trim() ? 'var(--emerald)' : 'var(--border)',
            color: '#fff', fontSize: '1.1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          →
        </button>
      </div>
    </div>
  )
}
