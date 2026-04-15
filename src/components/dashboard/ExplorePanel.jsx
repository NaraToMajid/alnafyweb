import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, TABLES } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Avatar } from '../shared/Avatar'

export default function ExplorePanel({ setActiveTab, setDmUser }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stores, setStores] = useState([])
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState('stores')
  const [search, setSearch] = useState('')
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    if (user) loadFollowing()
  }, [])

  const load = async () => {
    const [storesRes, usersRes] = await Promise.all([
      supabase.from(TABLES.STORES).select('*').eq('is_published', true).order('visit_count', { ascending: false }).limit(20),
      supabase.from(TABLES.USERS).select('id,username,avatar_url,bio,follower_count').order('follower_count', { ascending: false }).limit(20)
    ])
    setStores(storesRes.data || [])
    setUsers(usersRes.data || [])
    setLoading(false)
  }

  const loadFollowing = async () => {
    const { data } = await supabase.from(TABLES.FOLLOWERS).select('following_id').eq('follower_id', user.id)
    setFollowing((data || []).map(f => f.following_id))
  }

  const toggleFollow = async (targetId) => {
    if (!user) return
    const isFollowing = following.includes(targetId)
    if (isFollowing) {
      await supabase.from(TABLES.FOLLOWERS).delete().eq('follower_id', user.id).eq('following_id', targetId)
      await supabase.from(TABLES.USERS).update({ follower_count: supabase.rpc('decrement', { x: 1 }) }).eq('id', targetId)
      setFollowing(p => p.filter(id => id !== targetId))
    } else {
      await supabase.from(TABLES.FOLLOWERS).insert({ follower_id: user.id, following_id: targetId })
      await supabase.from(TABLES.USERS).update({ follower_count: supabase.rpc('increment', { x: 1 }) }).eq('id', targetId)
      setFollowing(p => [...p, targetId])
    }
    setUsers(p => p.map(u => u.id === targetId ? { ...u, follower_count: u.follower_count + (isFollowing ? -1 : 1) } : u))
  }

  const filteredStores = stores.filter(s => s.store_name?.toLowerCase().includes(search.toLowerCase()) || s.username?.includes(search.toLowerCase()))
  const filteredUsers = users.filter(u => u.username?.includes(search.toLowerCase()))

  if (loading) return <div className="flex items-center justify-center" style={{ height: 200 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>

  return (
    <div className="slide-up">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Jelajahi</h2>
        <div style={{ position: 'relative' }}>
          <input className="input" placeholder="Cari toko atau pengguna..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        <div className={`tab ${tab === 'stores' ? 'active' : ''}`} onClick={() => setTab('stores')}><i className="fa-solid fa-store" style={{ marginRight: 6 }} />Toko ({stores.length})</div>
        <div className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}><i className="fa-solid fa-users" style={{ marginRight: 6 }} />Pengguna ({users.length})</div>
      </div>

      {tab === 'stores' && (
        <div className="grid-3">
          {filteredStores.map(store => (
            <div key={store.id} className="card" style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 80, background: store.bg_color || 'var(--bg4)', position: 'relative' }}>
                {store.banner_url && <img src={store.banner_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                <div style={{ position: 'absolute', bottom: -20, left: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: store.primary_color || 'var(--bg2)', border: '2px solid var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {store.logo_url ? <img src={store.logo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-store" style={{ fontSize: '1rem' }} />}
                  </div>
                </div>
              </div>
              <div style={{ padding: '28px 16px 16px' }} onClick={() => navigate(`/toko/${store.username}`)}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{store.store_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 8 }}>@{store.username}</div>
                {store.tagline && <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{store.tagline}</p>}
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}><i className="fa-solid fa-eye" style={{ marginRight: 4 }} />{store.visit_count || 0} kunjungan</div>
              </div>
            </div>
          ))}
          {filteredStores.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><i className="fa-solid fa-store" /><p>Tidak ada toko ditemukan</p></div>}
        </div>
      )}

      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredUsers.filter(u => u.id !== user?.id).map(u => (
            <div key={u.id} className="card flex items-center gap-2" style={{ padding: '14px 16px' }}>
              <Avatar src={u.avatar_url} username={u.username} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>@{u.username}</div>
                {u.bio && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</div>}
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 2 }}>{u.follower_count || 0} pengikut</div>
              </div>
              <div className="flex gap-1">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/toko/${u.username}`)}>
                  <i className="fa-solid fa-store" />
                </button>
                {user && user.id !== u.id && (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setActiveTab('chat') }}>
                      <i className="fa-solid fa-comment" />
                    </button>
                    <button className={`btn btn-sm ${following.includes(u.id) ? 'btn-ghost' : 'btn-primary'}`} onClick={() => toggleFollow(u.id)}>
                      {following.includes(u.id) ? 'Unfollow' : 'Follow'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && <div className="empty-state"><i className="fa-solid fa-user-slash" /><p>Tidak ada pengguna ditemukan</p></div>}
        </div>
      )}
    </div>
  )
}
