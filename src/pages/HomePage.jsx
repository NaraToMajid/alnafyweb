import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, TABLES } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const FEATURES = [
  { icon: 'fa-store', title: 'Website Toko Instan', desc: 'Buat website toko profesional dalam hitungan menit tanpa perlu keahlian coding sama sekali.' },
  { icon: 'fa-palette', title: 'Kustomisasi Penuh', desc: 'Atur warna, font, template, tombol, galeri, dan ratusan elemen lainnya sesuai selera.' },
  { icon: 'fa-comments', title: 'Chat & Komunitas', desc: 'Terhubung dengan sesama penjual, kirim pesan langsung, dan bangun jaringan bisnis.' },
  { icon: 'fa-chart-line', title: 'Statistik Lengkap', desc: 'Pantau pengunjung, klik, dan performa toko secara real-time setiap saat.' },
  { icon: 'fa-link', title: 'Link Toko Unik', desc: 'Dapatkan URL toko eksklusif seperti alnafyweb.com/toko/namamu yang mudah diingat.' },
  { icon: 'fa-shield-halved', title: '100% Gratis Selamanya', desc: 'Tidak ada biaya tersembunyi. Bangun dan kelola toko online tanpa perlu mengeluarkan biaya.' },
]

const TEMPLATES = [
  { id: 'minimal', name: 'Minimal', desc: 'Bersih & Elegan', preview: '#111' },
  { id: 'bold', name: 'Bold', desc: 'Berani & Tegas', preview: '#1a1a2e' },
  { id: 'warm', name: 'Warm', desc: 'Hangat & Ramah', preview: '#2d1b00' },
  { id: 'pastel', name: 'Pastel', desc: 'Lembut & Manis', preview: '#1a1a3e' },
  { id: 'dark', name: 'Dark', desc: 'Misterius & Modern', preview: '#0d0d0d' },
  { id: 'corporate', name: 'Corporate', desc: 'Profesional & Bersih', preview: '#0a192f' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [storeCount, setStoreCount] = useState(0)
  const [topStores, setTopStores] = useState([])
  const [onlineCount] = useState(Math.floor(Math.random() * 40) + 20)
  const counterRef = useRef(null)
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      const { count } = await supabase.from(TABLES.STORES).select('*', { count: 'exact', head: true })
      setStoreCount(count || 0)
      const { data } = await supabase.from(TABLES.STORES).select('store_name, username, visit_count, logo_url').order('visit_count', { ascending: false }).limit(5)
      setTopStores(data || [])
    }
    fetchStats()

    // Realtime subscription for store count
    const channel = supabase.channel('store-count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.STORES }, () => {
        setStoreCount(prev => prev + 1)
      }).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    if (storeCount === 0) return
    let start = 0
    const step = Math.ceil(storeCount / 60)
    const timer = setInterval(() => {
      start += step
      if (start >= storeCount) { setDisplayed(storeCount); clearInterval(timer) }
      else setDisplayed(start)
    }, 30)
    return () => clearInterval(timer)
  }, [storeCount])

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
        <div className="container flex items-center justify-between" style={{ height: 64 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            ALNAFYWEB
          </div>
          <div className="flex items-center gap-1">
            <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
              <span className="live-dot" style={{ marginRight: 6 }} />{onlineCount} online
            </span>
            {user ? (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
                <i className="fa-solid fa-gauge" /> Dashboard
              </button>
            ) : (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/auth')}>Masuk</button>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/auth?mode=register')}>Daftar Gratis</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '100px 20px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="container-sm" style={{ position: 'relative' }}>
          <div className="badge badge-default" style={{ marginBottom: 20, display: 'inline-flex' }}>
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            Platform Toko Online Gratis Terbaik
          </div>
          <h1 style={{ marginBottom: 20, letterSpacing: '-0.03em' }}>
            Bangun Website Toko<br />
            <span style={{ color: 'var(--text3)' }}>Profesionalmu Sekarang</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text2)', marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            Platform all-in-one untuk membuat, mengelola, dan mengembangkan toko online impianmu. Gratis. Selamanya.
          </p>
          <div className="flex items-center justify-center gap-2" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth?mode=register')}>
              <i className="fa-solid fa-rocket" /> Buat Toko Gratis
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/auth')}>
              <i className="fa-solid fa-sign-in-alt" /> Masuk
            </button>
          </div>
          
          {/* Counter */}
          <div style={{ marginTop: 60, padding: '24px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius2)', display: 'inline-block' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 700, lineHeight: 1 }}>{displayed.toLocaleString()}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text3)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Website Toko Profesional Tercipta
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 20px', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2>Semua yang Kamu Butuhkan</h2>
            <p style={{ marginTop: 12, maxWidth: 480, margin: '12px auto 0' }}>Satu platform, ribuan kemungkinan untuk mengembangkan bisnis online kamu.</p>
          </div>
          <div className="grid-3">
            {FEATURES.map(f => (
              <div key={f.icon} className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ width: 52, height: 52, borderRadius: 'var(--radius)', background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <i className={`fa-solid ${f.icon}`} style={{ fontSize: '1.3rem' }} />
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: 8, fontFamily: 'var(--font-body)', fontWeight: 600 }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text3)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates preview */}
      <section style={{ padding: '80px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2>Pilih Template Favoritmu</h2>
            <p style={{ marginTop: 12 }}>Tersedia {TEMPLATES.length} template premium yang bisa dikustomisasi sepenuhnya.</p>
          </div>
          <div className="grid-3">
            {TEMPLATES.map(t => (
              <div key={t.id} className="card" style={{ overflow: 'hidden', padding: 0, cursor: 'pointer' }} onClick={() => navigate('/auth?mode=register')}>
                <div style={{ height: 120, background: t.preview, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
                  <i className="fa-solid fa-store" style={{ fontSize: '2rem', opacity: 0.3 }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Stores */}
      {topStores.length > 0 && (
        <section style={{ padding: '80px 20px', borderTop: '1px solid var(--border)' }}>
          <div className="container-sm">
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div className="flex items-center justify-center gap-1" style={{ marginBottom: 12 }}>
                <span className="live-dot" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live</span>
              </div>
              <h2>Toko Paling Ramai Dikunjungi</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topStores.map((store, i) => (
                <div key={store.username} className="card flex items-center gap-2" style={{ padding: '14px 20px', cursor: 'pointer' }} onClick={() => navigate(`/toko/${store.username}`)}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text3)', width: 24 }}>#{i + 1}</div>
                  <div className="avatar avatar-sm" style={{ background: 'var(--bg4)' }}>{store.store_name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{store.store_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>alnafyweb.com/toko/{store.username}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{(store.visit_count || 0).toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>kunjungan</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding: '100px 20px', borderTop: '1px solid var(--border)', textAlign: 'center', background: 'var(--bg2)' }}>
        <div className="container-sm">
          <h2>Siap Memulai?</h2>
          <p style={{ marginTop: 16, marginBottom: 40, maxWidth: 440, margin: '16px auto 40px' }}>
            Bergabung dengan ribuan penjual yang sudah memiliki website toko profesional mereka sendiri.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth?mode=register')}>
            <i className="fa-solid fa-store" /> Buat Toko Sekarang — Gratis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
          &copy; 2024 <strong style={{ color: 'var(--text2)' }}>ALNAFYWEB</strong> — Platform Toko Online Gratis
        </p>
      </footer>
    </div>
  )
}
