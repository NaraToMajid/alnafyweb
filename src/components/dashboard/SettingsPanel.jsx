import { useState, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, TABLES, hashString, verifyHash } from '../../lib/supabase'
import { useToast } from '../shared/Toast'
import { Avatar } from '../shared/Avatar'

export default function SettingsPanel() {
  const { user, updateUser, logout } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({ bio: user?.bio || '' })
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pinForm, setPinForm] = useState({ currentPin: ['', '', '', '', '', ''], newPin: ['', '', '', '', '', ''] })
  const [showPw, setShowPw] = useState({})
  const fileRef = useRef()

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast('Ukuran file maksimal 2MB', 'error'); return }
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      const { error } = await supabase.from(TABLES.USERS).update({ avatar_url: base64 }).eq('id', user.id)
      if (error) { toast('Gagal mengupload avatar', 'error'); return }
      updateUser({ avatar_url: base64 })
      toast('Avatar berhasil diperbarui!', 'success')
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from(TABLES.USERS).update({ bio: profile.bio }).eq('id', user.id)
      if (error) throw error
      updateUser({ bio: profile.bio })
      toast('Profil berhasil disimpan!', 'success')
    } catch (err) { toast(err.message, 'error') }
    setSaving(false)
  }

  const changePassword = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { toast('Semua field wajib diisi', 'error'); return }
    if (pwForm.newPw !== pwForm.confirm) { toast('Password baru tidak cocok', 'error'); return }
    if (pwForm.newPw.length < 6) { toast('Password minimal 6 karakter', 'error'); return }
    setSaving(true)
    try {
      const { data } = await supabase.from(TABLES.USERS).select('password_hash').eq('id', user.id).single()
      const ok = await verifyHash(pwForm.current, data.password_hash)
      if (!ok) throw new Error('Password saat ini salah')
      const newHash = await hashString(pwForm.newPw)
      await supabase.from(TABLES.USERS).update({ password_hash: newHash }).eq('id', user.id)
      toast('Password berhasil diubah!', 'success')
      setPwForm({ current: '', newPw: '', confirm: '' })
    } catch (err) { toast(err.message, 'error') }
    setSaving(false)
  }

  const changePIN = async () => {
    const current = pinForm.currentPin.join('')
    const newPin = pinForm.newPin.join('')
    if (current.length !== 6 || newPin.length !== 6) { toast('PIN harus 6 digit', 'error'); return }
    setSaving(true)
    try {
      const { data } = await supabase.from(TABLES.USERS).select('pin_hash').eq('id', user.id).single()
      const ok = await verifyHash(current, data.pin_hash)
      if (!ok) throw new Error('PIN saat ini salah')
      const newHash = await hashString(newPin)
      await supabase.from(TABLES.USERS).update({ pin_hash: newHash }).eq('id', user.id)
      toast('PIN berhasil diubah!', 'success')
      setPinForm({ currentPin: ['', '', '', '', '', ''], newPin: ['', '', '', '', '', ''] })
    } catch (err) { toast(err.message, 'error') }
    setSaving(false)
  }

  const handlePinInput = (group, idx, val) => {
    if (!/^\d*$/.test(val)) return
    const arr = [...pinForm[group]]
    arr[idx] = val.slice(-1)
    setPinForm(p => ({ ...p, [group]: arr }))
    if (val && idx < 5) document.getElementById(`${group}-${idx + 1}`)?.focus()
    if (!val && idx > 0) document.getElementById(`${group}-${idx - 1}`)?.focus()
  }

  const PinRow = ({ group }) => (
    <div style={{ display: 'flex', gap: 8 }}>
      {pinForm[group].map((d, i) => (
        <input key={i} id={`${group}-${i}`} type="password" maxLength={1} value={d}
          onChange={e => handlePinInput(group, i, e.target.value)}
          onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) document.getElementById(`${group}-${i - 1}`)?.focus() }}
          style={{ flex: 1, textAlign: 'center', padding: '10px 0', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}
        />
      ))}
    </div>
  )

  return (
    <div className="slide-up">
      <h2 style={{ marginBottom: 20, fontSize: '1.5rem' }}>Pengaturan Akun</h2>

      <div className="tabs" style={{ marginBottom: 24 }}>
        {[['profile', 'fa-user', 'Profil'], ['security', 'fa-shield-halved', 'Keamanan'], ['account', 'fa-gear', 'Akun']].map(([id, icon, label]) => (
          <div key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            <i className={`fa-solid ${icon}`} style={{ marginRight: 6 }} />{label}
          </div>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 20 }}>Foto Profil</h3>
            <div className="flex items-center gap-2" style={{ gap: 20 }}>
              <Avatar src={user?.avatar_url} username={user?.username} size="xl" />
              <div>
                <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                  <i className="fa-solid fa-camera" /> Ganti Foto
                </button>
                <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 6 }}>Format JPG/PNG, maksimal 2MB</p>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Informasi Profil</h3>
            <div className="form-group">
              <label className="input-label">Username</label>
              <input className="input" value={user?.username} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 4 }}>Username tidak bisa diubah</div>
            </div>
            <div className="form-group">
              <label className="input-label">Bio</label>
              <textarea className="input" rows={3} placeholder="Ceritakan tentang kamu atau toko kamu..." value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} style={{ resize: 'vertical', minHeight: 80 }} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={saving}>
              {saving ? <span className="spinner" /> : <><i className="fa-solid fa-floppy-disk" /> Simpan Profil</>}
            </button>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Info Akun</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Username', value: '@' + user?.username, icon: 'fa-at' },
                { label: 'Status', value: user?.is_admin ? 'Administrator' : 'Penjual', icon: 'fa-tag' },
                { label: 'Bergabung', value: new Date(user?.created_at || Date.now()).toLocaleDateString('id', { day: 'numeric', month: 'long', year: 'numeric' }), icon: 'fa-calendar' },
                { label: 'Pengikut', value: (user?.follower_count || 0) + ' orang', icon: 'fa-users' },
                { label: 'Mengikuti', value: (user?.following_count || 0) + ' orang', icon: 'fa-user-plus' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text3)' }}><i className={`fa-solid ${row.icon}`} style={{ marginRight: 8, width: 16 }} />{row.label}</span>
                  <span style={{ fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Ubah Password</h3>
            {['current', 'newPw', 'confirm'].map((field, i) => (
              <div key={field} className="form-group">
                <label className="input-label">{['Password Saat Ini', 'Password Baru', 'Konfirmasi Password Baru'][i]}</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPw[field] ? 'text' : 'password'}
                    placeholder={['Masukkan password lama', 'Minimal 6 karakter', 'Ulangi password baru'][i]}
                    value={pwForm[field]} onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                    style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text3)', border: 'none', cursor: 'pointer' }}>
                    <i className={`fa-solid ${showPw[field] ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>
            ))}
            <button className="btn btn-primary btn-sm" onClick={changePassword} disabled={saving}>
              {saving ? <span className="spinner" /> : <><i className="fa-solid fa-key" /> Ubah Password</>}
            </button>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Ubah PIN</h3>
            <div className="form-group">
              <label className="input-label">PIN Saat Ini (6 Digit)</label>
              <PinRow group="currentPin" />
            </div>
            <div className="form-group">
              <label className="input-label">PIN Baru (6 Digit)</label>
              <PinRow group="newPin" />
            </div>
            <button className="btn btn-primary btn-sm" onClick={changePIN} disabled={saving}>
              {saving ? <span className="spinner" /> : <><i className="fa-solid fa-lock" /> Ubah PIN</>}
            </button>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {tab === 'account' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>URL Toko Kamu</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 16 }}>Link publik toko kamu</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              <i className="fa-solid fa-link" style={{ color: 'var(--text3)' }} />
              <span style={{ color: 'var(--info)', flex: 1 }}>alnafyweb.vercel.app/toko/{user?.username}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(`https://alnafyweb.vercel.app/toko/${user?.username}`); toast('URL disalin!', 'success') }}>
                <i className="fa-solid fa-copy" />
              </button>
            </div>
          </div>

          <div className="card" style={{ borderColor: 'rgba(224,85,85,0.3)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 4, color: 'var(--danger)' }}>Zona Berbahaya</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 16 }}>Tindakan ini tidak dapat dibatalkan</p>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => { if (confirm('Yakin ingin keluar?')) logout() }}>
              <i className="fa-solid fa-right-from-bracket" /> Keluar dari Akun
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
