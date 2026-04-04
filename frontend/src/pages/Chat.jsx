import { useState, useRef, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { sendChat, textToSpeech } from '../utils/api'
import ReactMarkdown from 'react-markdown'

const SUGGESTIONS = [
  'What is an emergency fund and how much do I need?',
  'What does renters insurance actually cover?',
  'Do I need life insurance?',
  'How does the 50/30/20 budget rule work?',
  'What is disability insurance?',
]

export default function Chat({ profile }) {
  const { getAccessTokenSilently, user } = useAuth0()
  const getToken = () => getAccessTokenSilently({ authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE } })

  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi ${user?.given_name || ''}! I'm your FinGuard AI financial wellness coach — powered by Google Gemini. 👋\n\nAsk me anything about budgeting, insurance, emergency funds, or financial planning in plain English. I'm here to help!`,
  }])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [playingIdx, setPlayingIdx] = useState(null)
  const bottomRef = useRef(null)
  const audioRef  = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const data = await sendChat(msg, profile, getToken)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, source: data.source }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Could not connect to the server. Make sure the backend is running on port 8000.' }])
    } finally {
      setLoading(false)
    }
  }

  async function handleListen(text, idx) {
    // Stop if already playing this message
    if (playingIdx === idx) {
      audioRef.current?.pause()
      setPlayingIdx(null)
      return
    }
    try {
      setPlayingIdx(idx)
      const blob = await textToSpeech(text, getToken)
      const url  = URL.createObjectURL(blob)
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src) }
      audioRef.current = new Audio(url)
      audioRef.current.play()
      audioRef.current.onended = () => setPlayingIdx(null)
    } catch (e) {
      console.error('TTS error:', e)
      setPlayingIdx(null)
      alert('Could not play audio. Check your ElevenLabs API key.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', maxWidth: 720, margin: '0 auto', padding: '0 1rem' }}>

      {/* Header */}
      <div style={{ padding: '1rem 0 0.5rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🛡</div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--navy)' }}>FinGuard AI Coach</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--emerald)' }}>● Powered by Google Gemini · Voice by ElevenLabs</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--emerald)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', marginRight: 8, marginTop: 4 }}>🛡</div>
            )}
            <div style={{ maxWidth: '80%' }}>
              <div style={{ padding: '10px 14px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px', background: msg.role === 'user' ? 'var(--emerald)' : 'var(--white)', color: msg.role === 'user' ? '#fff' : 'var(--navy)', border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none', fontSize: '0.9rem', lineHeight: 1.65, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown components={{
                    p:      ({ children }) => <p style={{ margin: '0 0 0.5rem', color: 'var(--navy)' }}>{children}</p>,
                    strong: ({ children }) => <strong style={{ color: 'var(--navy)', fontWeight: 600 }}>{children}</strong>,
                    ul:     ({ children }) => <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0' }}>{children}</ul>,
                    li:     ({ children }) => <li style={{ color: 'var(--muted)', marginBottom: 4 }}>{children}</li>,
                  }}>
                    {msg.content}
                  </ReactMarkdown>
                ) : msg.content}
              </div>

              {/* ElevenLabs Listen button — only on assistant messages */}
              {msg.role === 'assistant' && i > 0 && (
                <button
                  onClick={() => handleListen(msg.content, i)}
                  style={{ marginTop: 6, padding: '4px 12px', borderRadius: 99, border: '1px solid var(--border)', background: playingIdx === i ? 'var(--emerald-light)' : 'var(--white)', color: playingIdx === i ? 'var(--emerald-dark)' : 'var(--muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  {playingIdx === i ? '⏹ Stop' : '🔊 Listen'}
                  <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>ElevenLabs</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>🛡</div>
            <div style={{ padding: '10px 16px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '4px 18px 18px 18px', display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, background: 'var(--muted)', borderRadius: '50%', animation: 'fadeUp 0.6s ease infinite', animationDelay: `${i * 0.15}s` }} />)}
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
              <button key={s} onClick={() => send(s)} style={{ padding: '6px 12px', borderRadius: 99, background: 'var(--white)', border: '1px solid var(--border)', color: 'var(--navy)', fontSize: '0.78rem', cursor: 'pointer' }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '0.75rem 0 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Ask about budgeting, insurance, emergency funds…" disabled={loading} style={{ flex: 1, padding: '11px 16px', border: '1.5px solid var(--border)', borderRadius: 99, fontSize: '0.9rem', background: 'var(--white)', color: 'var(--navy)' }} />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{ width: 44, height: 44, borderRadius: '50%', background: input.trim() ? 'var(--emerald)' : 'var(--border)', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>→</button>
      </div>
    </div>
  )
}
