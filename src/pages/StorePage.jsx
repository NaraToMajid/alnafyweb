import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, TABLES } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const SOCIAL_ICONS = {
  whatsapp: { icon: 'fa-whatsapp', label: 'WhatsApp', color: '#25D366' },
  instagram: { icon: 'fa-instagram', label: 'Instagram', color: '#E1306C' },
  telegram: { icon: 'fa-telegram', label: 'Telegram', color: '#2CA5E0' },
  tiktok: { icon: 'fa-tiktok', label: 'TikTok', color: '#000000' },
  youtube: { icon: 'fa-youtube', label: 'YouTube', color: '#FF0000' },
  twitter: { icon: 'fa-x-twitter', label: 'X/Twitter', color: '#1DA1F2' },
  facebook: { icon: 'fa-facebook', label: 'Facebook', color: '#1877F2' },
  email: { icon: 'fa-envelope', label: 'Email', color: '#888888' },
  phone: { icon: 'fa-phone', label: 'Telepon', color: '#555555' },
}

const SOCIAL_PREFIXES = {
  whatsapp: 'https://wa.me/',
  instagram: 'https://instagram.com/',
  telegram: 'https://t.me/',
  tiktok: 'https://tiktok.com/@',
  youtube: 'https://youtube.com/',
  twitter: 'https://x.com/',
  facebook: 'https://facebook.com/',
  email: 'mailto:',
  phone: 'tel:',
}

export default function StorePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [contactModal, setContactModal] = useState(false)

  useEffect(() => {
    const fetchStore = async () => {
      const { data, error } = await supabase
        .from(TABLES.STORES)
        .select('*')
        .eq('username', username.toLowerCase())
        .single()

      if (error || !data) { setNotFound(true); setLoading(false); return }
      if (!data.is_published && !(user?.username === username)) { setNotFound(true); setLoading(false); return }

      setStore(data)
      setLoading(false)

      // Record visit (throttle per session)
      const visitKey = `visited_${data.id}`
      if (!sessionStorage.getItem(visitKey)) {
        sessionStorage.setItem(visitKey, '1')
        await supabase.from(TABLES.STORE_VISITS).insert({ store_id: data.id, visitor_ip: 'web' })
        await supabase.from(TABLES.STORES).update({ visit_count: (data.visit_count || 0) + 1 }).eq('id', data.id)
      }
    }
    fetchStore()
  }, [username])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px', borderColor: '#333', borderTopColor: '#fff' }} />
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.8rem', color: '#666' }}>Memuat toko...</div>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#f5f5f5', textAlign: 'center', padding: 20 }}>
      <i className="fa-solid fa-store-slash" style={{ fontSize: '4rem', color: '#333', marginBottom: 24 }} />
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', marginBottom: 12 }}>Toko Tidak Ditemukan</h2>
      <p style={{ color: '#666', marginBottom: 32 }}>Toko <strong style={{ color: '#aaa' }}>@{username}</strong> tidak ada atau belum dipublikasikan.</p>
      <button onClick={() => navigate('/')} style={{ padding: '12px 28px', background: '#f5f5f5', color: '#0a0a0a', border: 'none', borderRadius: 8, fontFamily: 'Outfit, sans-serif', cursor: 'pointer', fontWeight: 500 }}>
        <i className="fa-solid fa-arrow-left" style={{ marginRight: 8 }} />Kembali ke Beranda
      </button>
    </div>
  )

  const s = store
  const primary = s.primary_color || '#000000'
  const secondary = s.secondary_color || '#ffffff'
  const accent = s.accent_color || '#888888'
  const bg = s.bg_color || '#ffffff'
  const font = s.font_family || 'Outfit'
  const socialLinks = s.social_links || {}
  const products = s.products || []
  const gallery = s.gallery_images || []
  const buttons = s.custom_buttons || []

  const templateStyles = {
    minimal: { navBg: primary, navText: secondary, heroBg: bg, heroText: primary, cardBg: '#f9f9f9', cardBorder: '#e8e8e8' },
    bold: { navBg: primary, navText: secondary, heroBg: primary, heroText: secondary, cardBg: bg, cardBorder: accent },
    warm: { navBg: primary, navText: secondary, heroBg: bg, heroText: primary, cardBg: '#fff8f0', cardBorder: accent },
    pastel: { navBg: bg, navText: primary, heroBg: `linear-gradient(135deg, ${bg}, ${accent}22)`, heroText: primary, cardBg: bg, cardBorder: accent },
    dark: { navBg: '#050505', navText: '#f0f0f0', heroBg: '#050505', heroText: '#f0f0f0', cardBg: '#111', cardBorder: '#222' },
    corporate: { navBg: primary, navText: secondary, heroBg: `linear-gradient(135deg, ${primary}, ${accent})`, heroText: secondary, cardBg: bg, cardBorder: accent },
  }
  const ts = templateStyles[s.template] || templateStyles.minimal

  const hasSocial = Object.entries(socialLinks).some(([k, v]) => v && v.trim())

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: `${font}, Outfit, sans-serif`, color: primary }}>
      {/* Navbar */}
      <nav style={{ background: ts.navBg, color: ts.navText, position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 20px rgba(0,0,0,0.15)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {s.logo_url ? (
              <img src={s.logo_url} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} alt="logo" />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 8, background: accent + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-store" style={{ color: ts.navText, fontSize: '1.1rem' }} />
              </div>
            )}
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: '1.2rem', lineHeight: 1 }}>{s.store_name}</div>
              {s.tagline && <div style={{ fontSize: '0.7rem', opacity: 0.7, lineHeight: 1, marginTop: 2 }}>{s.tagline}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {products.length > 0 && (
              <button onClick={() => setActiveSection('products')} style={{ background: 'transparent', border: `1px solid ${ts.navText}44`, color: ts.navText, padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                <i className="fa-solid fa-box" style={{ marginRight: 6 }} />Produk
              </button>
            )}
            {gallery.length > 0 && (
              <button onClick={() => setActiveSection('gallery')} style={{ background: 'transparent', border: `1px solid ${ts.navText}44`, color: ts.navText, padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                <i className="fa-solid fa-images" style={{ marginRight: 6 }} />Galeri
              </button>
            )}
            <button onClick={() => setContactModal(true)} style={{ background: ts.navText, color: ts.navBg, padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', border: 'none', fontFamily: 'inherit', fontWeight: 600 }}>
              <i className="fa-solid fa-address-book" style={{ marginRight: 6 }} />Kontak
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ background: ts.heroBg, color: ts.heroText, minHeight: 360, display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        {s.banner_url && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <img src={s.banner_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="banner" />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          </div>
        )}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 20px', position: 'relative', width: '100%' }}>
          <div style={{ maxWidth: 640, textAlign: s.header_style === 'centered' ? 'center' : 'left', margin: s.header_style === 'centered' ? '0 auto' : undefined }}>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: 16, color: s.banner_url ? '#ffffff' : ts.heroText }}>
              {s.store_name}
            </h1>
            {s.tagline && <p style={{ fontSize: '1.1rem', marginBottom: 24, opacity: 0.85, color: s.banner_url ? '#eeeeee' : ts.heroText }}>{s.tagline}</p>}
            {s.description && <p style={{ fontSize: '0.9rem', marginBottom: 32, lineHeight: 1.7, opacity: 0.75, color: s.banner_url ? '#dddddd' : ts.heroText }}>{s.description}</p>}

            {/* Custom Buttons */}
            {buttons.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: s.header_style === 'centered' ? 'center' : 'flex-start' }}>
                {buttons.map((btn, i) => (
                  <a key={i} href={btn.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 8, background: btn.bg, color: btn.color, textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', fontFamily: 'inherit', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <i className={`fa-solid ${btn.icon || 'fa-link'}`} /> {btn.label}
                  </a>
                ))}
              </div>
            )}

            {/* Social Links in hero */}
            {hasSocial && (
              <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: s.header_style === 'centered' ? 'center' : 'flex-start' }}>
                {Object.entries(socialLinks).map(([key, val]) => {
                  if (!val || !val.trim()) return null
                  const si = SOCIAL_ICONS[key]
                  if (!si) return null
                  const href = val.startsWith('http') || val.startsWith('mailto:') || val.startsWith('tel:') ? val : (SOCIAL_PREFIXES[key] || '') + val
                  return (
                    <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                      style={{ width: 42, height: 42, borderRadius: '50%', background: s.banner_url ? 'rgba(255,255,255,0.15)' : accent + '22', border: `1px solid ${s.banner_url ? 'rgba(255,255,255,0.3)' : accent + '44'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.banner_url ? '#fff' : ts.heroText, textDecoration: 'none', transition: 'all 0.2s', fontSize: '1rem' }}
                      onMouseEnter={e => { e.currentTarget.style.background = si.color; e.currentTarget.style.borderColor = si.color; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = s.banner_url ? 'rgba(255,255,255,0.15)' : accent + '22'; e.currentTarget.style.borderColor = s.banner_url ? 'rgba(255,255,255,0.3)' : accent + '44'; e.currentTarget.style.color = s.banner_url ? '#fff' : ts.heroText }}>
                      <i className={`fa-brands ${si.icon}`} />
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Store Info Bar */}
      {(s.city || s.province || s.address) && (
        <div style={{ background: accent + '11', borderTop: `1px solid ${accent}22`, borderBottom: `1px solid ${accent}22`, padding: '12px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: '0.85rem', color: primary, opacity: 0.7 }}>
            {(s.city || s.province) && <span><i className="fa-solid fa-location-dot" style={{ marginRight: 6 }} />{[s.city, s.province].filter(Boolean).join(', ')}</span>}
            {s.address && <span><i className="fa-solid fa-map-marker-alt" style={{ marginRight: 6 }} />{s.address}</span>}
            <span style={{ marginLeft: 'auto' }}><i className="fa-solid fa-eye" style={{ marginRight: 6 }} />{(s.visit_count || 0).toLocaleString()} kunjungan</span>
          </div>
        </div>
      )}

      {/* Products Section */}
      {products.length > 0 && (
        <section id="products" style={{ padding: '60px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', marginBottom: 8, color: primary }}>Produk Kami</h2>
            <p style={{ color: primary, opacity: 0.6, marginBottom: 40, fontSize: '0.9rem' }}>Pilihan produk terbaik untuk kamu</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {products.map((p, i) => (
                <div key={p.id || i} style={{ background: ts.cardBg, border: `1px solid ${ts.cardBorder}`, borderRadius: 12, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                  {p.image ? (
                    <img src={p.image} style={{ width: '100%', height: 160, objectFit: 'cover' }} alt={p.name} />
                  ) : (
                    <div style={{ height: 160, background: accent + '11', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-box-open" style={{ fontSize: '2.5rem', color: accent, opacity: 0.4 }} />
                    </div>
                  )}
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4, color: primary }}>{p.name}</div>
                    {p.desc && <div style={{ fontSize: '0.8rem', color: primary, opacity: 0.6, marginBottom: 8, lineHeight: 1.5 }}>{p.desc}</div>}
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: accent }}>{p.price}</div>
                    {socialLinks.whatsapp && (
                      <a href={`https://wa.me/${socialLinks.whatsapp}?text=Halo, saya tertarik dengan produk ${p.name}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: 'block', marginTop: 12, padding: '8px 16px', background: '#25D366', color: '#fff', borderRadius: 6, textAlign: 'center', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}>
                        <i className="fa-brands fa-whatsapp" style={{ marginRight: 6 }} />Pesan via WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {gallery.length > 0 && (
        <section id="gallery" style={{ padding: '60px 20px', background: accent + '06' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', marginBottom: 8, color: primary }}>Galeri</h2>
            <p style={{ color: primary, opacity: 0.6, marginBottom: 40, fontSize: '0.9rem' }}>Foto dan dokumentasi toko</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {gallery.map((img, i) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: `1px solid ${ts.cardBorder}` }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = ''}>
                  <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} alt={`gallery-${i}`} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {hasSocial && (
        <section style={{ padding: '60px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', marginBottom: 8, color: primary }}>Hubungi Kami</h2>
            <p style={{ color: primary, opacity: 0.6, marginBottom: 40, fontSize: '0.9rem' }}>Temukan kami di berbagai platform</p>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 14 }}>
              {Object.entries(socialLinks).map(([key, val]) => {
                if (!val || !val.trim()) return null
                const si = SOCIAL_ICONS[key]
                if (!si) return null
                const href = val.startsWith('http') || val.startsWith('mailto:') || val.startsWith('tel:') ? val : (SOCIAL_PREFIXES[key] || '') + val
                return (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', background: ts.cardBg, border: `1px solid ${ts.cardBorder}`, borderRadius: 10, textDecoration: 'none', color: primary, fontWeight: 500, fontSize: '0.9rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = si.color; e.currentTarget.style.borderColor = si.color; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = ts.cardBg; e.currentTarget.style.borderColor = ts.cardBorder; e.currentTarget.style.color = primary }}>
                    <i className={`fa-brands ${si.icon}`} style={{ fontSize: '1.1rem' }} />
                    {si.label}
                  </a>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ background: primary + 'dd', color: secondary, padding: '24px 20px', textAlign: 'center', marginTop: 'auto' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{s.store_name}</div>
          {s.tagline && <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 12 }}>{s.tagline}</div>}
          <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
            Dibuat dengan <i className="fa-solid fa-heart" style={{ color: '#e05555', margin: '0 4px' }} />
            menggunakan <strong style={{ color: secondary }}>ALNAFYWEB</strong>
          </div>
          {user?.username !== username && (
            <div style={{ marginTop: 12 }}>
              <a href="/" style={{ fontSize: '0.75rem', opacity: 0.5, color: secondary, textDecoration: 'none' }}>
                Buat toko kamu sendiri di ALNAFYWEB — Gratis!
              </a>
            </div>
          )}
        </div>
      </footer>

      {/* Contact Modal */}
      {contactModal && (
        <div onClick={() => setContactModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: bg, border: `1px solid ${accent}33`, borderRadius: 16, width: '100%', maxWidth: 460, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: primary }}>Kontak {s.store_name}</h3>
                <p style={{ fontSize: '0.8rem', color: primary, opacity: 0.6, marginTop: 2 }}>Pilih cara menghubungi</p>
              </div>
              <button onClick={() => setContactModal(false)} style={{ background: 'none', border: 'none', color: primary, opacity: 0.5, cursor: 'pointer', fontSize: '1.2rem' }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(socialLinks).map(([key, val]) => {
                if (!val || !val.trim()) return null
                const si = SOCIAL_ICONS[key]
                if (!si) return null
                const href = val.startsWith('http') || val.startsWith('mailto:') || val.startsWith('tel:') ? val : (SOCIAL_PREFIXES[key] || '') + val
                return (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: si.color + '11', border: `1px solid ${si.color}33`, borderRadius: 10, textDecoration: 'none', color: primary, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = si.color; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = si.color + '11'; e.currentTarget.style.color = primary }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: si.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`fa-brands ${si.icon}`} style={{ color: si.color, fontSize: '1.1rem' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{si.label}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{val}</div>
                    </div>
                    <i className="fa-solid fa-arrow-right" style={{ marginLeft: 'auto', opacity: 0.4 }} />
                  </a>
                )
              })}
              {!hasSocial && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: primary, opacity: 0.5 }}>
                  <i className="fa-solid fa-phone-slash" style={{ fontSize: '2rem', marginBottom: 8, display: 'block' }} />
                  Belum ada info kontak
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
