import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, TABLES } from '../../lib/supabase'

export default function StatsPanel() {
  const { user } = useAuth()
  const [store, setStore] = useState(null)
  const [visits, setVisits] = useState([])
  const [period, setPeriod] = useState('week')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, year: 0, total: 0 })

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data: storeData } = await supabase.from(TABLES.STORES).select('*').eq('user_id', user.id).single()
      setStore(storeData)
      if (!storeData) { setLoading(false); return }

      const now = new Date()
      const ranges = {
        today: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
        week: new Date(now - 7 * 86400000).toISOString(),
        month: new Date(now - 30 * 86400000).toISOString(),
        year: new Date(now - 365 * 86400000).toISOString(),
      }

      const results = await Promise.all(
        Object.entries(ranges).map(([k, v]) =>
          supabase.from(TABLES.STORE_VISITS).select('*', { count: 'exact', head: true }).eq('store_id', storeData.id).gte('visited_at', v)
        )
      )
      const [todayR, weekR, monthR, yearR] = results
      setStats({ today: todayR.count || 0, week: weekR.count || 0, month: monthR.count || 0, year: yearR.count || 0, total: storeData.visit_count || 0 })

      // Get visit data for chart
      const daysBack = period === 'week' ? 7 : period === 'month' ? 30 : 365
      const from = new Date(now - daysBack * 86400000).toISOString()
      const { data: visitData } = await supabase.from(TABLES.STORE_VISITS).select('visited_at').eq('store_id', storeData.id).gte('visited_at', from).order('visited_at')
      setVisits(visitData || [])
      setLoading(false)
    }
    load()
  }, [user, period])

  // Group visits by day
  const chartData = (() => {
    if (!visits.length) return []
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 12
    const grouped = {}
    visits.forEach(v => {
      const d = new Date(v.visited_at)
      const key = period === 'year' ? `${d.getFullYear()}-${d.getMonth() + 1}` : d.toISOString().split('T')[0]
      grouped[key] = (grouped[key] || 0) + 1
    })
    return Object.entries(grouped).slice(-days).map(([date, count]) => ({ date, count }))
  })()

  const maxVal = Math.max(...chartData.map(d => d.count), 1)

  if (loading) return <div className="flex items-center justify-center" style={{ height: 300 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>

  return (
    <div className="slide-up">
      <h2 style={{ marginBottom: 20, fontSize: '1.5rem' }}>Statistik Toko</h2>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Hari Ini', value: stats.today, icon: 'fa-calendar-day', color: 'var(--info)' },
          { label: 'Minggu Ini', value: stats.week, icon: 'fa-calendar-week', color: 'var(--success)' },
          { label: 'Bulan Ini', value: stats.month, icon: 'fa-calendar', color: 'var(--warning)' },
          { label: 'Total', value: stats.total, icon: 'fa-eye', color: 'var(--text)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ color: s.color, fontSize: '1.2rem', marginBottom: 10 }}><i className={`fa-solid ${s.icon}`} /></div>
            <div className="stat-value">{s.value.toLocaleString()}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem' }}>Grafik Kunjungan</h3>
          <div className="tabs" style={{ width: 'auto' }}>
            {[['week', '7 Hari'], ['month', '30 Hari'], ['year', '12 Bulan']].map(([v, l]) => (
              <div key={v} className={`tab ${period === v ? 'active' : ''}`} onClick={() => setPeriod(v)} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>{l}</div>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="empty-state"><i className="fa-solid fa-chart-bar" /><p>Belum ada data kunjungan</p></div>
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 4px' }}>
            {chartData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text3)' }}>{d.count}</div>
                <div title={`${d.date}: ${d.count}`} style={{ width: '100%', height: `${Math.max((d.count / maxVal) * 160, 4)}px`, background: 'var(--text)', borderRadius: '3px 3px 0 0', transition: 'height 0.3s', cursor: 'default', minHeight: 4, opacity: 0.7 + 0.3 * (d.count / maxVal) }} />
                <div style={{ fontSize: '0.55rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                  {period === 'week' ? new Date(d.date).toLocaleDateString('id', { weekday: 'short' }) : period === 'year' ? d.date.split('-')[1] : d.date.slice(8)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Percentage breakdown */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Ringkasan Persentase</h3>
        {stats.total === 0 ? (
          <div className="empty-state" style={{ padding: '20px 0' }}><p>Belum ada kunjungan</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Hari Ini', value: stats.today, color: 'var(--info)' },
              { label: 'Minggu Ini', value: stats.week, color: 'var(--success)' },
              { label: 'Bulan Ini', value: stats.month, color: 'var(--warning)' },
            ].map(s => {
              const pct = stats.total > 0 ? Math.round((s.value / stats.total) * 100) : 0
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6, fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text2)' }}>{s.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: s.color }}>{s.value} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
