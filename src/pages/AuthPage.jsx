import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/shared/Toast'

const generateCaptcha = () => {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  const ops = ['+', '-', '*']
  const op = ops[Math.floor(Math.random() * 3)]
  let answer
  if (op === '+') answer = a + b
  else if (op === '-') answer = a - b
  else answer = a * b
  return { question: `${a} ${op} ${b} = ?`, answer }
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { login, register, user } = useAuth()
  const toast = useToast()
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [clickCaptcha, setClickCaptcha] = useState(false)
  const [mathCaptcha, setMathCaptcha] = useState(generateCaptcha())
  const [mathAnswer, setMathAnswer] = useState('')
  const [form, setForm] = useState({ username: '', password: '', confirm: '', pin: '' })
  const [pinDigits, setPinDigits] = useState(['', '', '', '', '', ''])

  useEffect(() => { if (user) navigate('/dashboard') }, [user])
  useEffect(() => { setMathCaptcha(generateCaptcha()); setMathAnswer(''); setClickCaptcha(false) }, [mode])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handlePinChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const digits = [...pinDigits]
    digits[i] = val.slice(-1)
    setPinDigits(digits)
    if (val && i < 5) document.getElementById(`pin-${i + 1}`)?.focus()
    if (!val && i > 0) document.getElementById(`pin-${i - 1}`)?.focus()
  }

  const handlePinKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !pinDigits[i] && i > 0) {
      document.getElementById(`pin-${i - 1}`)?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!clickCaptcha) { toast('Klik kotak verifikasi terlebih dahulu', 'error'); return }
    if (parseInt(mathAnswer) !== mathCaptcha.answer) { toast('Jawaban captcha matematika salah', 'error'); setMathCaptcha(generateCaptcha()); setMathAnswer(''); return }
    const pin = pinDigits.join('')
    if (pin.length !== 6) { toast('PIN harus 6 digit', 'error'); return }
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.username, form.password, pin)
        toast('Selamat datang kembali!', 'success')
        navigate('/dashboard')
      } else {
        await register(form.username, form.password, form.confirm, pin)
        toast('Akun berhasil dibuat! Selamat datang di ALNAFYWEB!', 'success')
        navigate('/dashboard')
      }
    } catch (err) {
      toast(err.message, 'error')
      setMathCaptcha(generateCaptcha()); setMathAnswer(''); setClickCaptcha(false)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ padding: '0 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
        <div className="container flex items-center justify-between" style={{ height: 60 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/')}>ALNAFYWEB</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            <i className="fa-solid fa-arrow-left" /> Kembali
          </button>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ marginBottom: 8 }}>{mode === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}</h2>
            <p style={{ fontSize: '0.875rem' }}>{mode === 'login' ? 'Masuk ke dashboard toko kamu' : 'Mulai bangun toko online impianmu'}</p>
          </div>

          {/* Mode toggle */}
          <div className="tabs" style={{ marginBottom: 28 }}>
            <div className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Masuk</div>
            <div className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Daftar</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="input-label"><i className="fa-solid fa-at" style={{ marginRight: 6 }} />Username</label>
              <input className="input" type="text" placeholder="contoh: tokobaju123" value={form.username} onChange={set('username')} required autoFocus style={{ textTransform: 'lowercase' }} />
              {mode === 'register' && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 4 }}>URL toko: alnafyweb.com/toko/{form.username || 'usernamemu'}</div>}
            </div>

            <div className="form-group">
              <label className="input-label"><i className="fa-solid fa-lock" style={{ marginRight: 6 }} />Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} placeholder="Minimal 6 karakter" value={form.password} onChange={set('password')} required style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text3)', fontSize: '0.9rem' }}>
                  <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="input-label"><i className="fa-solid fa-lock-open" style={{ marginRight: 6 }} />Konfirmasi Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showConfirm ? 'text' : 'password'} placeholder="Ulangi password" value={form.confirm} onChange={set('confirm')} required style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text3)', fontSize: '0.9rem' }}>
                    <i className={`fa-solid ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>
            )}

            {/* PIN - Responsive dengan flex-wrap */}
            <div className="form-group">
              <label className="input-label"><i className="fa-solid fa-key" style={{ marginRight: 6 }} />PIN (6 Digit)</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(6, 1fr)', 
                gap: '8px',
                maxWidth: '100%'
              }}>
                {pinDigits.map((d, i) => (
                  <input 
                    key={i} 
                    id={`pin-${i}`} 
                    type="password" 
                    maxLength={1} 
                    value={d}
                    onChange={e => handlePinChange(i, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(e, i)}
                    style={{ 
                      width: '100%',
                      minWidth: 0, // Mencegah overflow
                      textAlign: 'center', 
                      padding: '12px 0',
                      background: 'var(--bg3)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius)', 
                      color: 'var(--text)', 
                      fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                      letterSpacing: 2,
                      fontFamily: 'var(--font-mono)',
                      aspectRatio: '1 / 1', // Membuat kotak persegi
                      boxSizing: 'border-box'
                    }} 
                  />
                ))}
              </div>
            </div>

            {/* Captcha click */}
            <div className="form-group">
              <div
                onClick={() => setClickCaptcha(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg3)', border: `1px solid ${clickCaptcha ? 'var(--success)' : 'var(--border)'}`, borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all var(--transition)' }}
              >
                <div style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${clickCaptcha ? 'var(--success)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: clickCaptcha ? 'var(--success)' : 'transparent', transition: 'all 0.2s' }}>
                  {clickCaptcha && <i className="fa-solid fa-check" style={{ fontSize: '0.75rem', color: 'white' }} />}
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>Saya bukan robot</span>
                <i className="fa-solid fa-robot" style={{ marginLeft: 'auto', color: 'var(--text3)' }} />
              </div>
            </div>

            {/* Math captcha */}
            <div className="form-group">
              <label className="input-label"><i className="fa-solid fa-calculator" style={{ marginRight: 6 }} />Verifikasi Matematika</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ padding: '10px 16px', background: 'var(--bg4)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: '1rem', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{mathCaptcha.question}</div>
                <input className="input" type="number" placeholder="Jawaban" value={mathAnswer} onChange={e => setMathAnswer(e.target.value)} style={{ width: 100, flexShrink: 0 }} />
                <button type="button" onClick={() => { setMathCaptcha(generateCaptcha()); setMathAnswer('') }} style={{ background: 'none', color: 'var(--text3)', fontSize: '1rem', padding: 8 }}>
                  <i className="fa-solid fa-rotate" />
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }} disabled={loading}>
              {loading ? <span className="spinner" /> : <><i className={`fa-solid ${mode === 'login' ? 'fa-sign-in-alt' : 'fa-user-plus'}`} /> {mode === 'login' ? 'Masuk' : 'Buat Akun'}</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text3)' }}>
            {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <span style={{ color: 'var(--text)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Daftar gratis' : 'Masuk'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}