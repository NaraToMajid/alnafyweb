import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, TABLES } from '../../lib/supabase'
import { Avatar } from '../shared/Avatar'

export default function GlobalChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [onlineCount] = useState(Math.floor(Math.random() * 30) + 10)
  const endRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from(TABLES.GLOBAL_CHAT).select('*').order('created_at', { ascending: false }).limit(60)
      setMessages((data || []).reverse())
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    load()

    const ch = supabase.channel('global-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.GLOBAL_CHAT }, (payload) => {
        setMessages(prev => [...prev, payload.new])
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const send = async () => {
    if (!input.trim() || sending || !user) return
    setSending(true)
    await supabase.from(TABLES.GLOBAL_CHAT).insert({ user_id: user.id, username: user.username, avatar_url: user.avatar_url, message: input.trim() })
    setInput('')
    setSending(false)
  }

  return (
    <div style={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius2)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-globe" />
          <span style={{ fontWeight: 600 }}>Chat Global</span>
          <span className="badge badge-default">ALNAFYWEB</span>
        </div>
        <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
          <span className="live-dot" />
          <span>{onlineCount} online</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => {
          const isMine = msg.user_id === user?.id
          return (
            <div key={msg.id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isMine ? 'row-reverse' : 'row' }}>
              <Avatar src={msg.avatar_url} username={msg.username} size="sm" />
              <div style={{ maxWidth: '70%' }}>
                {!isMine && <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: 3, fontWeight: 500 }}>@{msg.username}</div>}
                <div style={{ padding: '10px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMine ? 'var(--text)' : 'var(--bg4)', color: isMine ? 'var(--bg)' : 'var(--text)', fontSize: '0.875rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {msg.message}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 3, textAlign: isMine ? 'right' : 'left' }}>
                  {new Date(msg.created_at).toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input className="input" placeholder="Kirim pesan ke semua..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={send} disabled={!input.trim() || sending}>
          {sending ? <span className="spinner" /> : <i className="fa-solid fa-paper-plane" />}
        </button>
      </div>
    </div>
  )
}
