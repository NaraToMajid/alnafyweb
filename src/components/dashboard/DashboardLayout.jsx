import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase, TABLES } from '../../lib/supabase'
import { Avatar } from '../shared/Avatar'

const NAV_ITEMS = [
  { section: 'Utama' },
  { id: 'overview', icon: 'fa-gauge', label: 'Ringkasan' },
  { id: 'builder', icon: 'fa-hammer', label: 'Bangun Toko' },
  { id: 'stats', icon: 'fa-chart-line', label: 'Statistik' },
  { section: 'Sosial' },
  { id: 'chat', icon: 'fa-comments', label: 'Pesan', badge: 'messages' },
  { id: 'global', icon: 'fa-globe', label: 'Chat Global' },
  { id: 'explore', icon: 'fa-compass', label: 'Jelajahi' },
  { section: 'Akun' },
  { id: 'settings', icon: 'fa-gear', label: 'Pengaturan' },
  { id: 'help', icon: 'fa-circle-question', label: 'Bantuan' },
  { id: 'report', icon: 'fa-bug', label: 'Laporan Bug' },
]

export default function DashboardLayout({ children, activeTab, setActiveTab }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [notifications, setNotifications] = useState(0)

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (!user) return
    const fetchUnread = async () => {
      const { count } = await supabase.from(TABLES.CONVERSATIONS)
        .select('*', { count: 'exact', head: true })
        .or(`and(participant_1.eq.${user.id},unread_1.gt.0),and(participant_2.eq.${user.id},unread_2.gt.0)`)
      setUnreadMessages(count || 0)
    }
    fetchUnread()
    const { count: notifCount } = supabase.from(TABLES.NOTIFICATIONS)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('is_read', false)
    // realtime
    const ch = supabase.channel('dash-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.MESSAGES }, fetchUnread)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  const handleLogout = () => { logout(); navigate('/') }
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <div className="sidebar-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, backdropFilter: 'blur(2px)' }} />}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/')}>ALNAFYWEB</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>Dashboard</div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-1" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('settings')}>
            <Avatar src={user?.avatar_url} username={user?.username} size="md" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{user?.username}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{user?.is_admin ? 'Administrator' : 'Penjual'}</div>
            </div>
            {user?.is_admin && <div className="badge badge-warning" style={{ marginLeft: 'auto', flexShrink: 0 }}>ADMIN</div>}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item, i) => {
            if (item.section) return <div key={i} className="section-label">{item.section}</div>
            const unread = item.badge === 'messages' ? unreadMessages : 0
            return (
              <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}>
                <i className={`fa-solid ${item.icon}`} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {unread > 0 && <span className="badge badge-danger" style={{ minWidth: 20, justifyContent: 'center' }}>{unread}</span>}
              </div>
            )
          })}
          {user?.is_admin && (
            <>
              <div className="section-label">Admin</div>
              <div className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => { setActiveTab('admin'); setSidebarOpen(false) }}>
                <i className="fa-solid fa-shield-halved" />
                <span>Panel Admin</span>
              </div>
            </>
          )}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
          <div className="nav-item" onClick={toggleTheme}>
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
            <span>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
          </div>
          <div className="nav-item" onClick={() => navigate(`/toko/${user?.username}`)} style={{ color: 'var(--info)' }}>
            <i className="fa-solid fa-store" />
            <span>Lihat Toko</span>
          </div>
          <div className="nav-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            <i className="fa-solid fa-right-from-bracket" />
            <span>Keluar</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(true)} style={{ display: 'none' }} id="menu-btn">
            <i className="fa-solid fa-bars" />
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, textTransform: 'capitalize' }}>
            {NAV_ITEMS.find(n => n.id === activeTab)?.label || activeTab}
          </div>
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/toko/${user?.username}`)}>
              <i className="fa-solid fa-store" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: '24px 20px', minHeight: 'calc(100vh - 60px)' }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #menu-btn { display: flex !important; }
        }
        .light-theme .main-content > div:first-child {
          background: rgba(248,248,248,0.9) !important;
        }
      `}</style>
    </div>
  )
}
