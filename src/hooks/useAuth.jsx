import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, TABLES, hashString, verifyHash } from '../lib/supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('alnafyweb_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password, pin) => {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('username', username.toLowerCase())
      .single()

    if (error || !data) throw new Error('Username tidak ditemukan')
    if (data.is_banned) throw new Error('Akun ini telah diblokir: ' + (data.ban_reason || ''))

    // Check admin credentials
    if (username === 'almajidnafiisadmin') {
      const pwOk = await verifyHash(password, data.password_hash)
      const pinOk = await verifyHash(pin, data.pin_hash)
      if (!pwOk || !pinOk) throw new Error('Password atau PIN salah')
    } else {
      const pwOk = await verifyHash(password, data.password_hash)
      const pinOk = await verifyHash(pin, data.pin_hash)
      if (!pwOk || !pinOk) throw new Error('Password atau PIN salah')
    }

    // Update last seen
    await supabase.from(TABLES.USERS).update({ last_seen: new Date().toISOString() }).eq('id', data.id)

    const userObj = { id: data.id, username: data.username, avatar_url: data.avatar_url, bio: data.bio, is_admin: data.is_admin, follower_count: data.follower_count, following_count: data.following_count, created_at: data.created_at }
    setUser(userObj)
    localStorage.setItem('alnafyweb_user', JSON.stringify(userObj))
    return userObj
  }, [])

  const register = useCallback(async (username, password, confirmPassword, pin) => {
    if (password !== confirmPassword) throw new Error('Password tidak cocok')
    if (password.length < 6) throw new Error('Password minimal 6 karakter')
    if (pin.length !== 6 || isNaN(pin)) throw new Error('PIN harus 6 digit angka')
    if (!/^[a-z0-9_]+$/.test(username)) throw new Error('Username hanya boleh huruf kecil, angka, dan underscore')
    if (username.length < 3) throw new Error('Username minimal 3 karakter')

    const { data: existing } = await supabase.from(TABLES.USERS).select('id').eq('username', username.toLowerCase()).single()
    if (existing) throw new Error('Username sudah digunakan')

    const pwHash = await hashString(password)
    const pinHash = await hashString(pin)
    const isAdmin = username === 'almajidnafiisadmin'

    const { data, error } = await supabase.from(TABLES.USERS).insert({
      username: username.toLowerCase(),
      password_hash: pwHash,
      pin_hash: pinHash,
      is_admin: isAdmin
    }).select().single()

    if (error) throw new Error('Gagal membuat akun: ' + error.message)

    // Create default store
    await supabase.from(TABLES.STORES).insert({
      user_id: data.id,
      username: username.toLowerCase(),
      store_name: username + "'s Store",
      tagline: 'Selamat datang di toko saya!',
    })

    const userObj = { id: data.id, username: data.username, avatar_url: null, bio: '', is_admin: isAdmin, follower_count: 0, following_count: 0, created_at: data.created_at }
    setUser(userObj)
    localStorage.setItem('alnafyweb_user', JSON.stringify(userObj))
    return userObj
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('alnafyweb_user')
  }, [])

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem('alnafyweb_user', JSON.stringify(updated))
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
