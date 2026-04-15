import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, TABLES } from '../../lib/supabase'
import { useToast } from '../shared/Toast'

const FAQ = [
  { q: 'Bagaimana cara membuat toko?', a: 'Setelah mendaftar, toko kamu otomatis dibuat. Pergi ke menu "Bangun Toko" untuk menyesuaikan tampilan dan kontennya.' },
  { q: 'Apakah gratis selamanya?', a: 'Ya! ALNAFYWEB 100% gratis. Tidak ada biaya tersembunyi atau paket berbayar.' },
  { q: 'Berapa banyak produk yang bisa saya tambah?', a: 'Tidak ada batasan jumlah produk. Tambahkan sebanyak yang kamu mau.' },
  { q: 'Bisakah saya mengganti username?', a: 'Username tidak bisa diubah karena digunakan sebagai URL toko kamu. Pastikan memilih username yang tepat saat mendaftar.' },
  { q: 'Bagaimana cara membagikan toko saya?', a: 'Salin URL toko kamu dari menu Pengaturan Toko atau klik tombol "Preview" di dashboard.' },
  { q: 'Apakah toko saya bisa ditemukan di Google?', a: 'Toko yang dipublikasikan bisa diindeks oleh mesin pencari secara bertahap.' },
  { q: 'Bagaimana cara menghubungi penjual lain?', a: 'Pergi ke menu "Jelajahi" untuk menemukan pengguna, lalu klik ikon chat untuk memulai percakapan.' },
  { q: 'Bagaimana cara mengubah template toko?', a: 'Buka "Bangun Toko" > tab "Tampilan" > pilih template yang diinginkan, lalu klik Simpan.' },
]

export default function HelpPanel({ tab: initialTab = 'help' }) {
  const { user } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState(initialTab)
  const [openFaq, setOpenFaq] = useState(null)
  const [report, setReport] = useState({ type: 'bug', description: '' })
  const [sending, setSending] = useState(false)

  const submitReport = async () => {
    if (!report.description.trim()) { toast('Deskripsikan masalahnya', 'error'); return }
    if (report.description.length < 20) { toast('Deskripsi terlalu singkat (min 20 karakter)', 'error'); return }
    setSending(true)
    try {
      const { error } = await supabase.from(TABLES.REPORTS).insert({
        reporter_id: user.id,
        type: report.type,
        description: report.description,
        status: 'pending'
      })
      if (error) throw error
      toast('Laporan berhasil dikirim! Terima kasih.', 'success')
      setReport({ type: 'bug', description: '' })
    } catch (err) { toast('Gagal mengirim laporan: ' + err.message, 'error') }
    setSending(false)
  }

  return (
    <div className="slide-up">
      <h2 style={{ marginBottom: 20, fontSize: '1.5rem' }}>Bantuan & Dukungan</h2>

      <div className="tabs" style={{ marginBottom: 24 }}>
        <div className={`tab ${tab === 'help' ? 'active' : ''}`} onClick={() => setTab('help')}>
          <i className="fa-solid fa-circle-question" style={{ marginRight: 6 }} />Bantuan
        </div>
        <div className={`tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>
          <i className="fa-solid fa-bug" style={{ marginRight: 6 }} />Laporan Bug
        </div>
        <div className={`tab ${tab === 'contact' ? 'active' : ''}`} onClick={() => setTab('contact')}>
          <i className="fa-solid fa-envelope" style={{ marginRight: 6 }} />Kontak
        </div>
      </div>

      {tab === 'help' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius)', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                <i className="fa-solid fa-book-open" />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Panduan Cepat</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Pelajari cara menggunakan ALNAFYWEB</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { step: '1', text: 'Daftar akun dengan username unik kamu', icon: 'fa-user-plus' },
                { step: '2', text: 'Buka "Bangun Toko" dan pilih template', icon: 'fa-palette' },
                { step: '3', text: 'Isi informasi toko, produk, dan kontak', icon: 'fa-pen' },
                { step: '4', text: 'Publikasikan dan bagikan URL toko kamu!', icon: 'fa-share-nodes' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--text)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{item.step}</div>
                  <i className={`fa-solid ${item.icon}`} style={{ color: 'var(--text3)', width: 16 }} />
                  <span style={{ fontSize: '0.875rem' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Pertanyaan Umum (FAQ)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FAQ.map((item, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <div onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: openFaq === i ? 'var(--bg3)' : 'transparent', transition: 'background 0.2s' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.q}</span>
                    <i className={`fa-solid fa-chevron-${openFaq === i ? 'up' : 'down'}`} style={{ color: 'var(--text3)', fontSize: '0.75rem', transition: 'transform 0.2s' }} />
                  </div>
                  {openFaq === i && (
                    <div style={{ padding: '12px 16px', background: 'var(--bg4)', fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.6, borderTop: '1px solid var(--border)' }}>
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'report' && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>Laporkan Bug atau Masalah</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 20 }}>Bantuan kamu sangat berarti untuk meningkatkan platform ini</p>

          <div className="form-group">
            <label className="input-label">Jenis Laporan</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { val: 'bug', icon: 'fa-bug', label: 'Bug/Error' },
                { val: 'suggestion', icon: 'fa-lightbulb', label: 'Saran' },
                { val: 'abuse', icon: 'fa-flag', label: 'Pelanggaran' },
                { val: 'other', icon: 'fa-ellipsis', label: 'Lainnya' },
              ].map(type => (
                <button key={type.val} onClick={() => setReport(p => ({ ...p, type: type.val }))}
                  className={`btn btn-sm ${report.type === type.val ? 'btn-primary' : 'btn-ghost'}`}>
                  <i className={`fa-solid ${type.icon}`} /> {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Deskripsi Masalah</label>
            <textarea className="input" rows={5} value={report.description}
              onChange={e => setReport(p => ({ ...p, description: e.target.value }))}
              placeholder="Ceritakan masalah secara detail. Apa yang terjadi? Apa yang seharusnya terjadi? Langkah apa yang menyebabkan masalah ini?"
              style={{ resize: 'vertical', minHeight: 120 }} />
            <div style={{ fontSize: '0.75rem', color: report.description.length < 20 ? 'var(--text3)' : 'var(--success)', marginTop: 4 }}>
              {report.description.length}/20 karakter minimum
            </div>
          </div>

          <button className="btn btn-primary" onClick={submitReport} disabled={sending || report.description.length < 20}>
            {sending ? <span className="spinner" /> : <><i className="fa-solid fa-paper-plane" /> Kirim Laporan</>}
          </button>
        </div>
      )}

      {tab === 'contact' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <i className="fa-solid fa-headset" style={{ fontSize: '3rem', marginBottom: 16, color: 'var(--text3)' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Tim Dukungan ALNAFYWEB</h3>
            <p style={{ fontSize: '0.875rem', marginBottom: 24 }}>Kami siap membantu kamu 7 hari seminggu</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
              {[
                { icon: 'fa-envelope', label: 'Email Support', value: 'support@alnafyweb.id', href: 'mailto:support@alnafyweb.id', color: '#5599e0' },
                { icon: 'fa-brands fa-whatsapp', label: 'WhatsApp', value: 'Chat langsung', href: 'https://wa.me/6281234567890', color: '#25D366' },
                { icon: 'fa-brands fa-telegram', label: 'Telegram', value: '@alnafyweb', href: 'https://t.me/alnafyweb', color: '#2CA5E0' },
              ].map(item => (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, textDecoration: 'none', color: 'var(--text)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.background = item.color + '11' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg3)' }}>
                  <i className={item.icon} style={{ color: item.color, fontSize: '1.2rem', width: 20 }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{item.value}</div>
                  </div>
                  <i className="fa-solid fa-arrow-right" style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: '0.75rem' }} />
                </a>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <i className="fa-solid fa-circle-info" style={{ color: 'var(--info)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Informasi Platform</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text3)' }}>Versi</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>v1.0.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text3)' }}>Platform</span>
                <span>ALNAFYWEB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text3)' }}>Status</span>
                <span style={{ color: 'var(--success)' }}><span className="live-dot" style={{ marginRight: 6 }} />Semua Sistem Aktif</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
