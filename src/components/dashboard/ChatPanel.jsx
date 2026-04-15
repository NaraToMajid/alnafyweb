import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, TABLES } from '../../lib/supabase'
import { Avatar } from '../shared/Avatar'
import { useToast } from '../shared/Toast'

export default function ChatPanel() {
  const { user } = useAuth()
  const toast = useToast()
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [otherUser, setOtherUser] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!user) return
    loadConversations()
    const ch = supabase.channel('chat-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.MESSAGES }, (payload) => {
        if (selected && payload.new.conversation_id === selected.id) {
          setMessages(p => [...p, payload.new])
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
        loadConversations()
      }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [user, selected?.id])

  const loadConversations = async () => {
    const { data } = await supabase.from(TABLES.CONVERSATIONS)
      .select('*').or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
    // Enrich with other user info
    const enriched = await Promise.all((data || []).map(async conv => {
      const otherId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1
      const { data: other } = await supabase.from(TABLES.USERS).select('id,username,avatar_url').eq('id', otherId).single()
      return { ...conv, other }
    }))
    setConversations(enriched)
    setLoading(false)
  }

  const selectConversation = async (conv) => {
    setSelected(conv)
    setOtherUser(conv.other)
    const { data } = await supabase.from(TABLES.MESSAGES).select('*').eq('conversation_id', conv.id).order('created_at')
    setMessages(data || [])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    // Mark as read
    const unreadField = conv.participant_1 === user.id ? 'unread_1' : 'unread_2'
    await supabase.from(TABLES.CONVERSATIONS).update({ [unreadField]: 0 }).eq('id', conv.id)
  }

  const handleSearch = async (q) => {
    setSearchUser(q)
    if (q.length < 2) { setSearchResults([]); return }
    const { data } = await supabase.from(TABLES.USERS).select('id,username,avatar_url').ilike('username', `%${q}%`).neq('id', user.id).limit(5)
    setSearchResults(data || [])
  }

  const startConversation = async (targetUser) => {
    // Check if conversation exists
    const { data: existing } = await supabase.from(TABLES.CONVERSATIONS).select('*')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${targetUser.id}),and(participant_1.eq.${targetUser.id},participant_2.eq.${user.id})`).single()
    if (existing) {
      setSearchUser(''); setSearchResults([])
      selectConversation({ ...existing, other: targetUser }); return
    }
    const { data } = await supabase.from(TABLES.CONVERSATIONS).insert({ participant_1: user.id, participant_2: targetUser.id }).select().single()
    setSearchUser(''); setSearchResults([])
    await loadConversations()
    selectConversation({ ...data, other: targetUser })
  }

  const sendMessage = async () => {
    if (!input.trim() || !selected || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    await supabase.from(TABLES.MESSAGES).insert({ conversation_id: selected.id, sender_id: user.id, content })
    const unreadField = selected.participant_1 === user.id ? 'unread_2' : 'unread_1'
    await supabase.from(TABLES.CONVERSATIONS).update({ last_message: content, last_message_at: new Date().toISOString(), [unreadField]: supabase.rpc('increment', { row_id: selected.id }) }).eq('id', selected.id)
    setSending(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const unreadCount = (conv) => {
    if (!user) return 0
    return conv.participant_1 === user.id ? conv.unread_1 : conv.unread_2
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 110px)', gap: 16 }}>
      {/* Left: conversations */}
      <div style={{ width: 280, flexShrink: 0, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>Pesan</h3>
          <div style={{ position: 'relative' }}>
            <input className="input" placeholder="Cari pengguna..." value={searchUser} onChange={e => handleSearch(e.target.value)} style={{ paddingLeft: 36 }} />
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: '0.8rem' }} />
          </div>
          {searchResults.length > 0 && (
            <div style={{ position: 'absolute', zIndex: 10, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginTop: 4, maxWidth: 248 }}>
              {searchResults.map(u => (
                <div key={u.id} className="flex items-center gap-2" style={{ padding: '10px 12px', cursor: 'pointer' }} onClick={() => startConversation(u)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg4)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <Avatar src={u.avatar_url} username={u.username} size="sm" />
                  <span style={{ fontSize: '0.875rem' }}>@{u.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div className="flex items-center justify-center" style={{ height: 100 }}><div className="spinner" /></div>
          ) : conversations.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <i className="fa-solid fa-comments" />
              <p style={{ fontSize: '0.8rem' }}>Cari pengguna untuk mulai chat</p>
            </div>
          ) : (
            conversations.map(conv => {
              const unread = unreadCount(conv)
              return (
                <div key={conv.id} onClick={() => selectConversation(conv)}
                  style={{ padding: '12px 16px', cursor: 'pointer', background: selected?.id === conv.id ? 'var(--bg4)' : 'transparent', borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (selected?.id !== conv.id) e.currentTarget.style.background = 'var(--bg3)' }}
                  onMouseLeave={e => { if (selected?.id !== conv.id) e.currentTarget.style.background = '' }}>
                  <div className="flex items-center gap-2">
                    <Avatar src={conv.other?.avatar_url} username={conv.other?.username} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: unread > 0 ? 700 : 500, fontSize: '0.875rem' }}>@{conv.other?.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.last_message || 'Mulai percakapan...'}</div>
                    </div>
                    {unread > 0 && <span className="badge badge-danger">{unread}</span>}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Right: messages */}
      <div style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-comment-dots" style={{ fontSize: '3rem', marginBottom: 16 }} />
            <h3>Pilih Percakapan</h3>
            <p style={{ fontSize: '0.875rem' }}>Pilih percakapan atau cari pengguna baru</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar src={otherUser?.avatar_url} username={otherUser?.username} size="sm" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>@{otherUser?.username}</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map(msg => {
                const isMine = msg.sender_id === user.id
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMine ? 'var(--text)' : 'var(--bg4)',
                      color: isMine ? 'var(--bg)' : 'var(--text)',
                      fontSize: '0.875rem', lineHeight: 1.5,
                    }}>
                      {msg.content}
                      <div style={{ fontSize: '0.65rem', marginTop: 4, opacity: 0.6, textAlign: 'right' }}>
                        {new Date(msg.created_at).toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input className="input" placeholder="Ketik pesan..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm" onClick={sendMessage} disabled={!input.trim() || sending}>
                {sending ? <span className="spinner" /> : <i className="fa-solid fa-paper-plane" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
