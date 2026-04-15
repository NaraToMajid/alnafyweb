import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase, TABLES } from '../lib/supabase'
import { useToast } from '../components/shared/Toast'
import { Avatar } from '../components/shared/Avatar'
import { useNavigate } from 'react-router-dom'

export default function AdminPage({ inline = false }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [users, setUsers] = useState([])
  const [stores, setStores] = useState([])
  const [reports, setReports] = useState([])
  const [globalChats, setGlobalChats] = useState([])
  const [stats, setStats] = useState({ users: 0, stores: 0, visits: 0, messages: 0, reports: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [banReason, setBanReason] = useState('')
  const [showBanModal, setShowBanModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!user?.is_admin) return
    loadAll()

    const ch = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.USERS }, () => setStats(p => ({ ...p, users: p.users + 1 })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.STORES }, () => setStats(p => ({ ...p, stores: p.stores + 1 })))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.REPORTS }, () => {
        setStats(p => ({ ...p, reports: p.reports + 1 }))
        loadReports()
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  const loadAll = async () => {
    setLoading(true)
    const [usersRes, storesRes, visitsRes, msgsRes, reportsRes, chatsRes] = await Promise.all([
      supabase.from(TABLES.USERS).select('*').order('created_at', { ascending: false }),
      supabase.from(TABLES.STORES).select('*').order('visit_count', { ascending: false }),
      supabase.from(TABLES.STORE_VISITS).select('*', { count: 'exact', head: true }),
      supabase.from(TABLES.MESSAGES).select('*', { count: 'exact', head: true }),
      supabase.from(TABLES.REPORTS).select('*').order('created_at', { ascending: false }),
      supabase.from(TABLES.GLOBAL_CHAT).select('*').order('created_at', { ascending: false }).limit(50),
    ])
    setUsers(usersRes.data || [])
    setStores(storesRes.data || [])
    setReports(reportsRes.data || [])
    setGlobalChats(chatsRes.data || [])
    setStats({
      users: (usersRes.data || []).length,
      stores: (storesRes.data || []).length,
      visits: visitsRes.count || 0,
      messages: msgsRes.count || 0,
      reports: (reportsRes.data || []).filter(r => r.status === 'pending').length
    })
    setLoading(false)
  }

  const loadReports = async () => {
    const { data } = await supabase.from(TABLES.REPORTS).select('*').order('created_at', { ascending: false })
    setReports(data || [])
  }

  const banUser = async () => {
    if (!selectedUser || !banReason.trim()) { toast('Isi alasan ban', 'error'); return }
    setActionLoading(true)
    await supabase.from(TABLES.USERS).update({ is_banned: true, ban_reason: banReason }).eq('id', selectedUser.id)
    toast(`@${selectedUser.username} telah diblokir`, 'success')
    setUsers(p => p.map(u => u.id === selectedUser.id ? { ...u, is_banned: true, ban_reason: banReason } : u))
    setShowBanModal(false); setBanReason(''); setSelectedUser(null)
    setActionLoading(false)
  }

  const unbanUser = async (u) => {
    await supabase.from(TABLES.USERS).update({ is_banned: false, ban_reason: null }).eq('id', u.id)
    toast(`@${u.username} telah dibuka blokirnya`, 'success')
    setUsers(p => p.map(x => x.id === u.id ? { ...x, is_banned: false } : x))
  }

  const deleteStore = async (store) => {
    if (!confirm(`Hapus toko @${store.username}?`)) return
    await supabase.from(TABLES.STORES).delete().eq('id', store.id)
    toast('Toko dihapus', 'success')
    setStores(p => p.filter(s => s.id !== store.id))
  }

  const resolveReport = async (id) => {
    await supabase.from(TABLES.REPORTS).update({ status: 'resolved' }).eq('id', id)
    setReports(p => p.map(r => r.id === id ? { ...r, status: 'resolved' } : r))
    setStats(p => ({ ...p, reports: Math.max(0, p.reports - 1) }))
    toast('Laporan ditandai selesai', 'success')
  }

  const deleteGlobalMessage = async (id) => {
    await supabase.from(TABLES.GLOBAL_CHAT).delete().eq('id', id)
    setGlobalChats(p => p.filter(m => m.id !== id))
    toast('Pesan dihapus', 'success')
  }

  const togglePublish = async (store) => {
    await supabase.from(TABLES.STORES).update({ is_published: !store.is_published }).eq('id', store.id)
    setStores(p => p.map(s => s.id === store.id ? { ...s, is_published: !s.is_published } : s))
    toast(`Toko ${store.is_published ? 'disembunyikan' : 'dipublikasikan'}`, 'success')
  }

  const filteredUsers = users.filter(u => u.username?.includes(search.toLowerCase()))
  const filteredStores = stores.filter(s => s.username?.includes(search.toLowerCase()) || s.store_name?.toLowerCase().includes(search.toLowerCase()))

  if (!user?.is_admin) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <i className="fa-solid fa-shield-halved" style={{ fontSize: '3rem', color: 'var(--danger)', marginBottom: 16, display: 'block' }} />
      <h3>Akses Ditolak</h3>
      <p style={{ marginTop: 8 }}>Kamu tidak memiliki izin untuk mengakses halaman ini.</p>
    </div>
  )

  const content = (
    <div className={inline ? '' : 'slide-up'}>
      {!inline && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Panel Admin</h2>
            <p style={{ fontSize: '0.8rem' }}>Kontrol penuh platform ALNAFYWEB</p>
          </div>
          <div className="badge badge-warning"><i className="fa-solid fa-shield-halved" style={{ marginRight: 4 }} />ADMIN</div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Pengguna', value: stats.users, icon: 'fa-users', color: 'var(--info)' },
          { label: 'Total Toko', value: stats.stores, icon: 'fa-store', color: 'var(--success)' },
          { label: 'Total Kunjungan', value: stats.visits, icon: 'fa-eye', color: 'var(--warning)' },
          { label: 'Laporan Pending', value: stats.reports, icon: 'fa-flag', color: stats.reports > 0 ? 'var(--danger)' : 'var(--text3)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ color: s.color, fontSize: '1.1rem', marginBottom: 8 }}><i className={`fa-solid ${s.icon}`} /></div>
            <div className="stat-value">{s.value.toLocaleString()}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          ['overview', 'fa-gauge', 'Ringkasan'],
          ['users', 'fa-users', 'Pengguna'],
          ['stores', 'fa-store', 'Toko'],
          ['reports', 'fa-flag', 'Laporan'],
          ['chat', 'fa-comments', 'Chat Global'],
        ].map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`btn btn-sm ${tab === id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap', position: 'relative' }}>
            <i className={`fa-solid ${icon}`} /> {label}
            {id === 'reports' && stats.reports > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 4, minWidth: 18, justifyContent: 'center' }}>{stats.reports}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ height: 200 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : (
        <>
          {/* Overview */}
          {tab === 'overview' && (
            <div className="grid-2">
              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Top 10 Toko Ramai</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stores.slice(0, 10).map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2" style={{ fontSize: '0.875rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', width: 22 }}>#{i + 1}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.store_name}</span>
                      <span className={`badge ${s.is_published ? 'badge-success' : 'badge-warning'}`}>{s.is_published ? 'Aktif' : 'Draft'}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text3)' }}>{(s.visit_count || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  {stores.length === 0 && <p style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>Belum ada toko</p>}
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Pengguna Terbaru</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {users.slice(0, 8).map(u => (
                    <div key={u.id} className="flex items-center gap-2" style={{ fontSize: '0.875rem' }}>
                      <Avatar src={u.avatar_url} username={u.username} size="sm" />
                      <span style={{ flex: 1 }}>@{u.username}</span>
                      {u.is_admin && <span className="badge badge-warning">Admin</span>}
                      {u.is_banned && <span className="badge badge-danger">Banned</span>}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>
                        {new Date(u.created_at).toLocaleDateString('id', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Laporan Menunggu</h3>
                {reports.filter(r => r.status === 'pending').length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px 0' }}>
                    <i className="fa-solid fa-check-circle" style={{ fontSize: '2rem', color: 'var(--success)' }} />
                    <p>Tidak ada laporan pending</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {reports.filter(r => r.status === 'pending').slice(0, 5).map(r => (
                      <div key={r.id} style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span className={`badge ${r.type === 'bug' ? 'badge-danger' : r.type === 'abuse' ? 'badge-warning' : 'badge-info'}`}>{r.type}</span>
                          <span style={{ color: 'var(--text3)', fontSize: '0.7rem' }}>{new Date(r.created_at).toLocaleDateString('id')}</span>
                        </div>
                        <p style={{ color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Aktivitas Platform</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Total Pengguna', value: stats.users, max: Math.max(stats.users, 1), color: 'var(--info)' },
                    { label: 'Total Toko', value: stats.stores, max: Math.max(stats.users, 1), color: 'var(--success)' },
                    { label: 'Total Kunjungan', value: stats.visits, max: Math.max(stats.visits, 1), color: 'var(--warning)' },
                    { label: 'Total Pesan', value: stats.messages, max: Math.max(stats.messages, 1), color: 'var(--text3)' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between" style={{ fontSize: '0.8rem', marginBottom: 6 }}>
                        <span style={{ color: 'var(--text2)' }}>{item.label}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: item.color }}>{item.value.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${Math.min((item.value / item.max) * 100, 100)}%`, background: item.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users management */}
          {tab === 'users' && (
            <div>
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <input className="input" placeholder="Cari username..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Pengguna</th>
                        <th>Status</th>
                        <th>Pengikut</th>
                        <th>Bergabung</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <Avatar src={u.avatar_url} username={u.username} size="sm" />
                              <div>
                                <div style={{ fontWeight: 500 }}>@{u.username}</div>
                                {u.bio && <div style={{ fontSize: '0.7rem', color: 'var(--text3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {u.is_admin && <span className="badge badge-warning">Admin</span>}
                              {u.is_banned ? <span className="badge badge-danger">Banned</span> : <span className="badge badge-success">Aktif</span>}
                            </div>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{u.follower_count || 0}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
                            {new Date(u.created_at).toLocaleDateString('id', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td>
                            <div className="flex gap-1">
                              <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/toko/${u.username}`)}>
                                <i className="fa-solid fa-store" />
                              </button>
                              {!u.is_admin && (
                                u.is_banned ? (
                                  <button className="btn btn-success btn-sm" onClick={() => unbanUser(u)}>
                                    <i className="fa-solid fa-unlock" />
                                  </button>
                                ) : (
                                  <button className="btn btn-danger btn-sm" onClick={() => { setSelectedUser(u); setShowBanModal(true) }}>
                                    <i className="fa-solid fa-ban" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="empty-state"><i className="fa-solid fa-user-slash" /><p>Tidak ada pengguna ditemukan</p></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stores management */}
          {tab === 'stores' && (
            <div>
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <input className="input" placeholder="Cari toko atau username..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Toko</th>
                        <th>Template</th>
                        <th>Kunjungan</th>
                        <th>Status</th>
                        <th>Produk</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStores.map(s => (
                        <tr key={s.id}>
                          <td>
                            <div>
                              <div style={{ fontWeight: 500 }}>{s.store_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>@{s.username}</div>
                            </div>
                          </td>
                          <td><span className="badge badge-default" style={{ textTransform: 'capitalize' }}>{s.template}</span></td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{(s.visit_count || 0).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${s.is_published ? 'badge-success' : 'badge-warning'}`}>
                              {s.is_published ? 'Aktif' : 'Draft'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{(s.products || []).length}</td>
                          <td>
                            <div className="flex gap-1">
                              <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/toko/${s.username}`)}>
                                <i className="fa-solid fa-eye" />
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => togglePublish(s)} title={s.is_published ? 'Sembunyikan' : 'Publikasikan'}>
                                <i className={`fa-solid ${s.is_published ? 'fa-eye-slash' : 'fa-eye'}`} />
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => deleteStore(s)}>
                                <i className="fa-solid fa-trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredStores.length === 0 && (
                    <div className="empty-state"><i className="fa-solid fa-store-slash" /><p>Tidak ada toko ditemukan</p></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reports */}
          {tab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reports.length === 0 ? (
                <div className="empty-state card"><i className="fa-solid fa-flag" /><h3>Tidak Ada Laporan</h3><p>Semua laporan sudah ditangani</p></div>
              ) : (
                reports.map(r => {
                  const reporter = users.find(u => u.id === r.reporter_id)
                  return (
                    <div key={r.id} className="card" style={{ borderColor: r.status === 'pending' ? 'var(--warning)' : 'var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className={`badge ${r.type === 'bug' ? 'badge-danger' : r.type === 'abuse' ? 'badge-warning' : r.type === 'suggestion' ? 'badge-info' : 'badge-default'}`}>
                            <i className={`fa-solid ${r.type === 'bug' ? 'fa-bug' : r.type === 'abuse' ? 'fa-flag' : r.type === 'suggestion' ? 'fa-lightbulb' : 'fa-ellipsis'}`} style={{ marginRight: 4 }} />
                            {r.type}
                          </span>
                          <span className={`badge ${r.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>{r.status}</span>
                          {reporter && <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>dari @{reporter.username}</span>}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                          {new Date(r.created_at).toLocaleDateString('id', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text2)', marginBottom: 12, lineHeight: 1.6 }}>{r.description}</p>
                      {r.status === 'pending' && (
                        <button className="btn btn-success btn-sm" onClick={() => resolveReport(r.id)}>
                          <i className="fa-solid fa-check" /> Tandai Selesai
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Global Chat Management */}
          {tab === 'chat' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Pesan Chat Global ({globalChats.length})</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>50 pesan terbaru</span>
              </div>
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {globalChats.map(msg => (
                  <div key={msg.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <Avatar src={msg.avatar_url} username={msg.username} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>@{msg.username}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{new Date(msg.created_at).toLocaleString('id')}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', wordBreak: 'break-word', color: 'var(--text2)' }}>{msg.message}</p>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteGlobalMessage(msg.id)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                ))}
                {globalChats.length === 0 && (
                  <div className="empty-state"><i className="fa-solid fa-comments" /><p>Belum ada pesan global</p></div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div onClick={() => setShowBanModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} className="modal">
            <div className="modal-header">
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Blokir Pengguna</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 2 }}>@{selectedUser?.username}</p>
              </div>
              <button onClick={() => setShowBanModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.1rem' }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="input-label">Alasan Pemblokiran</label>
                <textarea className="input" rows={3} placeholder="Masukkan alasan pemblokiran..." value={banReason} onChange={e => setBanReason(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
                Pengguna tidak akan bisa login setelah diblokir.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBanModal(false)}>Batal</button>
              <button className="btn btn-danger btn-sm" onClick={banUser} disabled={actionLoading || !banReason.trim()}>
                {actionLoading ? <span className="spinner" /> : <><i className="fa-solid fa-ban" /> Blokir Pengguna</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (inline) return content

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 20px' }}>
      <div className="container">
        {content}
      </div>
    </div>
  )
}
