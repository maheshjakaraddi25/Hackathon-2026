import { useEffect, useRef, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import ReactMarkdown from 'react-markdown'
import { sendChat, textToSpeech } from '../utils/api'

const SUGGESTIONS = [
  'Compare the safe and risky version of buying a car.',
  'How would a job change affect stress and goal delays?',
  'What should I protect before taking a loan?',
  'How do I prepare for a job loss shock event?',
  'Give me a low-stress version of this decision.',
]

export default function Chat({ profile }) {
  const { getAccessTokenSilently, user } = useAuth0()
  const getToken = () => getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } })

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${user?.given_name || ''}! I am your Life Impact AI coach. Ask me how a decision could change your money, stress, risk exposure, or goal timeline, and I will walk through the tradeoffs in plain language.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [playingIdx, setPlayingIdx] = useState(null)
  const bottomRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const message = text || input.trim()
    if (!message) return
    setInput('')
    setMessages((value) => [...value, { role: 'user', content: message }])
    setLoading(true)
    try {
      const data = await sendChat(message, profile, getToken)
      setMessages((value) => [...value, { role: 'assistant', content: data.response }])
    } catch {
      setMessages((value) => [...value, { role: 'assistant', content: 'I could not connect to the backend. Please make sure the API is running on port 8000.' }])
    } finally {
      setLoading(false)
    }
  }

  async function handleListen(text, idx) {
    if (playingIdx === idx) {
      audioRef.current?.pause()
      setPlayingIdx(null)
      return
    }
    try {
      setPlayingIdx(idx)
      const blob = await textToSpeech(text, getToken)
      const url = URL.createObjectURL(blob)
      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
      }
      audioRef.current = new Audio(url)
      audioRef.current.play()
      audioRef.current.onended = () => setPlayingIdx(null)
    } catch {
      setPlayingIdx(null)
      alert('Voice playback is not available right now. Check the ElevenLabs configuration.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 68px)', maxWidth: 860, margin: '0 auto', padding: '1rem' }}>
      <div className="glass-panel" style={{ padding: '1rem 1.1rem', marginBottom: '1rem' }}>
        <div className="mini-kicker">AI coach</div>
        <h2 style={{ marginTop: '0.3rem' }}>Talk through the decision before life makes it expensive</h2>
        <p style={{ marginTop: '0.45rem' }}>This coach explains tradeoffs in future cash flow, resilience, stress, and goal delays. It is especially helpful after you run the simulator.</p>
      </div>

      <div className="card-panel" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, index) => (
          <div key={`${msg.role}-${index}`} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '80%' }}>
              <div style={{ padding: '0.9rem 1rem', borderRadius: msg.role === 'user' ? '20px 20px 8px 20px' : '8px 20px 20px 20px', background: msg.role === 'user' ? 'var(--accent)' : 'rgba(255,255,255,0.86)', color: msg.role === 'user' ? '#fff' : 'var(--ink)', border: msg.role === 'assistant' ? '1px solid rgba(119, 96, 73, 0.12)' : 'none' }}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ marginBottom: '0.55rem', color: 'var(--ink)' }}>{children}</p>,
                      ul: ({ children }) => <ul style={{ paddingLeft: '1.1rem', display: 'grid', gap: 4 }}>{children}</ul>,
                      li: ({ children }) => <li style={{ color: 'var(--ink)' }}>{children}</li>,
                      strong: ({ children }) => <strong style={{ color: 'var(--accent-strong)' }}>{children}</strong>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : msg.content}
              </div>
              {msg.role === 'assistant' && index > 0 && (
                <button onClick={() => handleListen(msg.content, index)} style={{ marginTop: 6, padding: '6px 12px', borderRadius: 999, border: '1px solid var(--border)', background: playingIdx === index ? 'rgba(200, 88, 54, 0.12)' : 'rgba(255,255,255,0.9)', color: 'var(--muted)', fontSize: '0.76rem' }}>
                  {playingIdx === index ? 'Stop audio' : 'Play voice response'}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.9)', borderRadius: '8px 20px 20px 20px', border: '1px solid rgba(119, 96, 73, 0.12)' }}>
              Thinking through the tradeoffs...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div style={{ padding: '0.8rem 0 0.2rem' }}>
          <p style={{ fontSize: '0.82rem', marginBottom: 8 }}>Try one of these prompts:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} className="secondary-button" style={{ padding: '0.6rem 0.9rem' }} onClick={() => send(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, paddingTop: '0.9rem' }}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && send()}
          placeholder="Ask how this decision affects your future life..."
          disabled={loading}
          style={{ flex: 1, padding: '0.95rem 1rem', borderRadius: 999, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.92)', color: 'var(--ink)' }}
        />
        <button className="primary-button" onClick={() => send()} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  )
}
