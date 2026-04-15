import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, TABLES } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function DashboardOverview({ setActiveTab }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [store, setStore] = useState(null)
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 })
  const [totalStores, setTotalStores] = useState(0)
  const [topStores, setTopStores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchAll = async () => {
      const [storeRes, countRes, topRes] = await Promise.all([
        supabase.from(TABLES.STORES).select('*').eq('user_id', user.id).single(),
        supabase.from(TABLES.STORES).select('*', { count: 'exact', head: true }),
        supabase.from(TABLES.STORES).select('store_name,username,visit_count').order('visit_count', { ascending: false }).limit(10)
      ])
      setStore(storeRes.data)
      setTotalStores(countRes.count || 0)
      setTopStores(topRes.data || [])

      // Get visit stats
      if (storeRes.data) {
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
        const weekAgo = new Date(now - 7 * 86400000).toISOString()
        const monthAgo = new Date(now - 30 * 86400000).toISOString()
        const [todayVisits, weekVisits, monthVisits] = await Promise.all([
          supabase.from(TABLES.STORE_VISITS).select('*', { count: 'exact', head: true }).eq('store_id', storeRes.data.id).gte('visited_at', todayStr),
          supabase.from(TABLES.STORE_VISITS).select('*', { count: 'exact', head: true }).eq('store_id', storeRes.data.id).gte('visited_at', weekAgo),
          supabase.from(TABLES.STORE_VISITS).select('*', { count: 'exact', head: true }).eq('store_id', storeRes.data.id).gte('visited_at', monthAgo),
        ])
        setStats({ today: todayVisits.count || 0, week: weekVisits.count || 0, month: monthVisits.count || 0, total: storeRes.data.visit_count || 0 })
      }
      setLoading(false)
    }
    fetchAll()

    // Realtime store count
    const ch = supabase.channel('overview-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.STORES }, () => setTotalStores(p => p + 1))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.STORE_VISITS }, (payload) => {
        if (store && payload.new?.store_id === store.id) setStats(p => ({ ...p, today: p.today + 1, week: p.week + 1, month: p.month + 1, total: p.total + 1 }))
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user, store?.id])

  if (loading) return <div className="flex items-center justify-center" style={{ height: 300 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>

  return (
    <div className="slide-up">
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 4 }}>Halo, @{user?.username} 👋</h2>
        <p style={{ fontSize: '0.875rem' }}>Berikut ringkasan aktivitas toko kamu hari ini.</p>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('builder')}><i className="fa-solid fa-hammer" /> Edit Toko</button>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/toko/${user?.username}`)} target="_blank"><i className="fa-solid fa-external-link-alt" /> Lihat Toko</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('stats')}><i className="fa-solid fa-chart-line" /> Statistik</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('chat')}><i className="fa-solid fa-comments" /> Pesan</button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Hari Ini', value: stats.today, icon: 'fa-calendar-day', color: 'var(--info)' },
          { label: 'Minggu Ini', value: stats.week, icon: 'fa-calendar-week', color: 'var(--success)' },
          { label: 'Bulan Ini', value: stats.month, icon: 'fa-calendar', color: 'var(--warning)' },
          { label: 'Total Kunjungan', value: stats.total, icon: 'fa-eye', color: 'var(--text)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <div style={{ color: s.color, fontSize: '1.1rem' }}><i className={`fa-solid ${s.icon}`} /></div>
            </div>
            <div className="stat-value">{s.value.toLocaleString()}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Store info */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-store" /> Info Toko
          </div>
          {store ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text3)' }}>Nama Toko</span>
                <span style={{ fontWeight: 500 }}>{store.store_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text3)' }}>Status</span>
                <span className={`badge ${store.is_published ? 'badge-success' : 'badge-warning'}`}>{store.is_published ? 'Aktif' : 'Draft'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text3)' }}>Template</span>
                <span style={{ textTransform: 'capitalize' }}>{store.template}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text3)' }}>URL</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--info)', cursor: 'pointer' }} onClick={() => navigate(`/toko/${user?.username}`)}>
                  /toko/{user?.username}
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setActiveTab('builder')}>
                <i className="fa-solid fa-pen" /> Edit Toko
              </button>
            </div>
          ) : <div style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>Toko belum dibuat</div>}
        </div>

        {/* Top stores realtime */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="live-dot" />
            Top Toko Ramai
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text3)', marginLeft: 'auto' }}>{totalStores} toko</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topStores.slice(0, 5).map((s, i) => (
              <div key={s.username} className="flex items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => navigate(`/toko/${s.username}`)}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text3)', width: 18 }}>#{i + 1}</span>
                <span style={{ flex: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.store_name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text3)' }}>{(s.visit_count || 0).toLocaleString()}</span>
              </div>
            ))}
            {topStores.length === 0 && <div style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>Belum ada data</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
