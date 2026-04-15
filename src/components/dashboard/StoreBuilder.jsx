import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, TABLES } from '../../lib/supabase'
import { useToast } from '../shared/Toast'
import { useNavigate } from 'react-router-dom'

const TEMPLATES = ['minimal', 'bold', 'warm', 'pastel', 'dark', 'corporate']
const FONTS = ['Outfit', 'Cormorant Garamond', 'DM Mono', 'Georgia', 'Arial', 'Trebuchet MS', 'Verdana', 'Tahoma', 'Palatino', 'Bookman']
const HEADER_STYLES = ['centered', 'left', 'split', 'overlay']
const SOCIAL_PLATFORMS = [
  { key: 'whatsapp', icon: 'fa-whatsapp', label: 'WhatsApp', prefix: 'https://wa.me/' },
  { key: 'instagram', icon: 'fa-instagram', label: 'Instagram', prefix: 'https://instagram.com/' },
  { key: 'telegram', icon: 'fa-telegram', label: 'Telegram', prefix: 'https://t.me/' },
  { key: 'tiktok', icon: 'fa-tiktok', label: 'TikTok', prefix: 'https://tiktok.com/@' },
  { key: 'youtube', icon: 'fa-youtube', label: 'YouTube', prefix: 'https://youtube.com/' },
  { key: 'twitter', icon: 'fa-x-twitter', label: 'X/Twitter', prefix: 'https://x.com/' },
  { key: 'facebook', icon: 'fa-facebook', label: 'Facebook', prefix: 'https://facebook.com/' },
  { key: 'email', icon: 'fa-envelope', label: 'Email', prefix: 'mailto:' },
  { key: 'phone', icon: 'fa-phone', label: 'Nomor Telepon', prefix: 'tel:' },
]

const TABS = ['Tampilan', 'Konten', 'Sosial', 'Produk', 'Tombol', 'Pengaturan']

export default function StoreBuilder() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState({})
  const [socialLinks, setSocialLinks] = useState({})
  const [products, setProducts] = useState([])
  const [customButtons, setCustomButtons] = useState([])
  const [galleryImages, setGalleryImages] = useState([])
  const [newProduct, setNewProduct] = useState({ name: '', price: '', desc: '', image: '' })
  const [newButton, setNewButton] = useState({ label: '', url: '', icon: 'fa-link', color: '#ffffff', bg: '#222222' })
  const fileRef = useRef()
  const bannerRef = useRef()

  useEffect(() => {
    if (!user) return
    supabase.from(TABLES.STORES).select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setStore(data)
        setForm({ store_name: data.store_name, tagline: data.tagline, description: data.description, template: data.template, primary_color: data.primary_color, secondary_color: data.secondary_color, accent_color: data.accent_color, bg_color: data.bg_color, font_family: data.font_family, header_style: data.header_style, address: data.address, city: data.city, province: data.province, is_published: data.is_published })
        setSocialLinks(data.social_links || {})
        setProducts(data.products || [])
        setCustomButtons(data.custom_buttons || [])
        setGalleryImages(data.gallery_images || [])
      }
      setLoading(false)
    })
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from(TABLES.STORES).update({
        ...form, social_links: socialLinks, products, custom_buttons: customButtons, gallery_images: galleryImages, updated_at: new Date().toISOString()
      }).eq('user_id', user.id)
      if (error) throw error
      toast('Toko berhasil disimpan!', 'success')
    } catch (err) { toast('Gagal menyimpan: ' + err.message, 'error') }
    setSaving(false)
  }

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast('Ukuran file maksimal 2MB', 'error'); return }
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      if (field === 'gallery') { setGalleryImages(prev => [...prev, base64]) }
      else { setForm(p => ({ ...p, [field]: base64 })) }
    }
    reader.readAsDataURL(file)
  }

  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) { toast('Nama dan harga produk wajib diisi', 'error'); return }
    setProducts(prev => [...prev, { ...newProduct, id: Date.now() }])
    setNewProduct({ name: '', price: '', desc: '', image: '' })
  }

  const addButton = () => {
    if (!newButton.label || !newButton.url) { toast('Label dan URL wajib diisi', 'error'); return }
    setCustomButtons(prev => [...prev, { ...newButton, id: Date.now() }])
    setNewButton({ label: '', url: '', icon: 'fa-link', color: '#ffffff', bg: '#222222' })
  }

  if (loading) return <div className="flex items-center justify-center" style={{ height: 300 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>

  const set = k => e => setForm(p => ({ ...p, [k]: e.target?.value ?? e }))
  const setColor = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="slide-up">
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Bangun Toko</h2>
          <p style={{ fontSize: '0.8rem' }}>Kustomisasi semua aspek website toko kamu</p>
        </div>
        <div className="flex gap-1">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/toko/${user?.username}`)}>
            <i className="fa-solid fa-external-link-alt" /> Preview
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : <><i className="fa-solid fa-floppy-disk" /> Simpan</>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={`btn btn-sm ${tab === i ? 'btn-primary' : 'btn-ghost'}`} style={{ whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      {/* Tab 0: Tampilan */}
      {tab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Template</h3>
            <div className="grid-3">
              {TEMPLATES.map(t => (
                <div key={t} onClick={() => setForm(p => ({ ...p, template: t }))} style={{ border: `2px solid ${form.template === t ? 'var(--text)' : 'var(--border)'}`, borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                  <div style={{ height: 70, background: t === 'minimal' ? '#111' : t === 'bold' ? '#1a1a2e' : t === 'warm' ? '#2d1b00' : t === 'pastel' ? '#1a1a3e' : t === 'dark' ? '#050505' : '#0a192f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-store" style={{ opacity: 0.4 }} />
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--bg3)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' }}>{t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Warna</h3>
            <div className="grid-2">
              {[
                { key: 'primary_color', label: 'Warna Utama' },
                { key: 'secondary_color', label: 'Warna Sekunder' },
                { key: 'accent_color', label: 'Warna Aksen' },
                { key: 'bg_color', label: 'Warna Latar' },
              ].map(c => (
                <div key={c.key} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">{c.label}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form[c.key] || '#000000'} onChange={setColor(c.key)} style={{ width: 44, height: 36, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }} />
                    <input className="input" value={form[c.key] || ''} onChange={setColor(c.key)} placeholder="#000000" style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Font & Header</h3>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Font</label>
                <select className="input" value={form.font_family || 'Outfit'} onChange={set('font_family')}>
                  {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Style Header</label>
                <select className="input" value={form.header_style || 'centered'} onChange={set('header_style')}>
                  {HEADER_STYLES.map(h => <option key={h} value={h} style={{ textTransform: 'capitalize' }}>{h}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Media</h3>
            <div className="grid-2">
              <div>
                <label className="input-label">Logo Toko</label>
                {form.logo_url && <img src={form.logo_url} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />}
                <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                  <i className="fa-solid fa-upload" /> Unggah Logo
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e, 'logo_url')} />
              </div>
              <div>
                <label className="input-label">Banner Toko</label>
                {form.banner_url && <img src={form.banner_url} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />}
                <button className="btn btn-ghost btn-sm" onClick={() => bannerRef.current?.click()}>
                  <i className="fa-solid fa-image" /> Unggah Banner
                </button>
                <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e, 'banner_url')} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label className="input-label">Galeri Gambar</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {galleryImages.map((img, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={img} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                    <button onClick={() => setGalleryImages(p => p.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--danger)', color: 'white', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                ))}
              </div>
              <label style={{ cursor: 'pointer' }}>
                <span className="btn btn-ghost btn-sm"><i className="fa-solid fa-plus" /> Tambah Gambar</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e, 'gallery')} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Konten */}
      {tab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Informasi Toko</h3>
            <div className="form-group">
              <label className="input-label">Nama Toko</label>
              <input className="input" value={form.store_name || ''} onChange={set('store_name')} placeholder="Nama toko kamu" />
            </div>
            <div className="form-group">
              <label className="input-label">Tagline</label>
              <input className="input" value={form.tagline || ''} onChange={set('tagline')} placeholder="Slogan singkat toko kamu" />
            </div>
            <div className="form-group">
              <label className="input-label">Deskripsi</label>
              <textarea className="input" value={form.description || ''} onChange={set('description')} rows={4} placeholder="Ceritakan tentang toko kamu..." style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Lokasi</h3>
            <div className="form-group">
              <label className="input-label">Alamat</label>
              <input className="input" value={form.address || ''} onChange={set('address')} placeholder="Jl. Contoh No. 1" />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Kota</label>
                <input className="input" value={form.city || ''} onChange={set('city')} placeholder="Medan" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Provinsi</label>
                <input className="input" value={form.province || ''} onChange={set('province')} placeholder="Sumatera Utara" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sosial */}
      {tab === 2 && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Tautan Sosial & Kontak</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 16 }}>Tambahkan informasi kontak agar pengunjung bisa menghubungi kamu.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SOCIAL_PLATFORMS.map(p => (
              <div key={p.key} className="form-group" style={{ marginBottom: 0 }}>
                <label className="input-label">
                  <i className={`fa-brands ${p.icon}`} style={{ marginRight: 6 }} />{p.label}
                </label>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120, flexShrink: 0 }}>{p.prefix}</span>
                  <input className="input" value={socialLinks[p.key] || ''} onChange={e => setSocialLinks(prev => ({ ...prev, [p.key]: e.target.value }))} placeholder={p.key === 'email' ? 'email@kamu.com' : p.key === 'phone' ? '081234567890' : 'username'} style={{ flex: 1 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Produk */}
      {tab === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Tambah Produk</h3>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Nama Produk</label>
                <input className="input" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="Nama produk" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Harga</label>
                <input className="input" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} placeholder="Rp 50.000" />
              </div>
            </div>
            <div className="form-group">
              <label className="input-label">Deskripsi</label>
              <input className="input" value={newProduct.desc} onChange={e => setNewProduct(p => ({ ...p, desc: e.target.value }))} placeholder="Deskripsi singkat produk" />
            </div>
            <button className="btn btn-primary btn-sm" onClick={addProduct}>
              <i className="fa-solid fa-plus" /> Tambah Produk
            </button>
          </div>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Daftar Produk ({products.length})</h3>
            {products.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <i className="fa-solid fa-box" style={{ fontSize: '2rem' }} />
                <p>Belum ada produk</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {products.map((p, i) => (
                  <div key={p.id || i} className="flex items-center gap-2" style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{p.price}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setProducts(prev => prev.filter((_, j) => j !== i))}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Custom Buttons */}
      {tab === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Tambah Tombol Custom</h3>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Label Tombol</label>
                <input className="input" value={newButton.label} onChange={e => setNewButton(p => ({ ...p, label: e.target.value }))} placeholder="Contoh: Hubungi Kami" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Icon (Font Awesome class)</label>
                <input className="input" value={newButton.icon} onChange={e => setNewButton(p => ({ ...p, icon: e.target.value }))} placeholder="fa-link" />
              </div>
            </div>
            <div className="form-group">
              <label className="input-label">URL Tujuan</label>
              <input className="input" value={newButton.url} onChange={e => setNewButton(p => ({ ...p, url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Warna Teks</label>
                <div className="flex gap-2">
                  <input type="color" value={newButton.color} onChange={e => setNewButton(p => ({ ...p, color: e.target.value }))} style={{ width: 44, height: 36, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                  <input className="input" value={newButton.color} onChange={e => setNewButton(p => ({ ...p, color: e.target.value }))} style={{ flex: 1, fontFamily: 'var(--font-mono)' }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Warna Tombol</label>
                <div className="flex gap-2">
                  <input type="color" value={newButton.bg} onChange={e => setNewButton(p => ({ ...p, bg: e.target.value }))} style={{ width: 44, height: 36, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                  <input className="input" value={newButton.bg} onChange={e => setNewButton(p => ({ ...p, bg: e.target.value }))} style={{ flex: 1, fontFamily: 'var(--font-mono)' }} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <label className="input-label">Preview</label>
              <button style={{ background: newButton.bg, color: newButton.color, padding: '10px 20px', borderRadius: 8, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'default', fontFamily: 'var(--font-body)' }}>
                <i className={`fa-solid ${newButton.icon}`} /> {newButton.label || 'Preview Tombol'}
              </button>
            </div>
            <button className="btn btn-primary btn-sm" onClick={addButton}><i className="fa-solid fa-plus" /> Tambah Tombol</button>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Tombol Custom ({customButtons.length})</h3>
            {customButtons.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}><i className="fa-solid fa-hand-pointer" style={{ fontSize: '2rem' }} /><p>Belum ada tombol custom</p></div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {customButtons.map((b, i) => (
                  <div key={b.id || i} style={{ position: 'relative' }}>
                    <button style={{ background: b.bg, color: b.color, padding: '10px 20px', borderRadius: 8, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', cursor: 'default' }}>
                      <i className={`fa-solid ${b.icon}`} /> {b.label}
                    </button>
                    <button onClick={() => setCustomButtons(p => p.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', background: 'var(--danger)', color: 'white', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Pengaturan */}
      {tab === 5 && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Pengaturan Toko</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Publikasikan Toko</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Toko akan bisa diakses publik</div>
            </div>
            <div onClick={() => setForm(p => ({ ...p, is_published: !p.is_published }))} style={{ width: 48, height: 26, borderRadius: 13, background: form.is_published ? 'var(--success)' : 'var(--bg4)', border: '1px solid var(--border2)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 3, left: form.is_published ? 24 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </div>
          </div>
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: 4 }}>URL Toko Kamu</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              <i className="fa-solid fa-link" style={{ color: 'var(--text3)' }} />
              <span style={{ color: 'var(--info)' }}>alnafyweb.com/toko/{user?.username}</span>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { navigator.clipboard.writeText(`https://alnafyweb.vercel.app/toko/${user?.username}`); toast('URL disalin!', 'success') }}>
                <i className="fa-solid fa-copy" />
              </button>
            </div>
          </div>
          <div style={{ paddingTop: 16 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
              {saving ? <span className="spinner" /> : <><i className="fa-solid fa-floppy-disk" /> Simpan Semua Perubahan</>}
            </button>
          </div>
        </div>
      )}

      {/* Save button bottom */}
      <div style={{ position: 'sticky', bottom: 20, display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ boxShadow: 'var(--shadow2)' }}>
          {saving ? <span className="spinner" /> : <><i className="fa-solid fa-floppy-disk" /> Simpan Perubahan</>}
        </button>
      </div>
    </div>
  )
}
