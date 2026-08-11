import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

interface LoginResult { ok: boolean; error?: string }
interface SignupResult { ok: boolean; confirmEmail?: boolean; error?: string }
interface UsernameCheck { available: boolean; error?: string }

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<LoginResult>
  signup: (username: string, email: string, password: string) => Promise<SignupResult>
  checkUsernameAvailable: (username: string) => Promise<UsernameCheck>
  resetPassword: (email: string) => Promise<LoginResult>
  updatePassword: (newPassword: string) => Promise<LoginResult>
  logout: () => Promise<void>
  loginWithGoogle: () => Promise<LoginResult>
  sendPhoneOtp: (phone: string) => Promise<LoginResult>
  verifyPhoneOtp: (phone: string, token: string) => Promise<LoginResult>
}

const AuthContext = createContext<AuthContextType | null>(null)

function mapUser(u: SupabaseUser): User {
  const username =
    (u.user_metadata?.username as string) ||
    (u.user_metadata?.name as string) ||
    u.email?.split('@')[0] ||
    'User'
  return {
    id: u.id,
    email: u.email ?? '',
    username,
    name: (u.user_metadata?.name as string) || username,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? mapUser(session.user) : null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapUser(session.user) : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (identifier: string, password: string): Promise<LoginResult> => {
    let email = identifier.trim()

    if (!email.includes('@')) {
      const { data, error } = await supabase.rpc('get_email_by_username', {
        uname: email,
      })
      if (error) return { ok: false, error: 'Could not verify that username. Try again.' }
      if (!data) return { ok: false, error: 'No account found for that username.' }
      email = data as string
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  const checkUsernameAvailable = async (username: string): Promise<UsernameCheck> => {
    const { data, error } = await supabase.rpc('is_username_available', {
      uname: username.trim(),
    })
    if (error) return { available: false, error: error.message }
    return { available: data as boolean }
  }

  const signup = async (username: string, email: string, password: string): Promise<SignupResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) return { ok: false, error: error.message }
    if (!data.session) return { ok: true, confirmEmail: true }
    return { ok: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string): Promise<LoginResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  const updatePassword = async (newPassword: string): Promise<LoginResult> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  // Requires Google OAuth provider enabled in Supabase Auth settings
  const loginWithGoogle = async (): Promise<LoginResult> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  // Requires SMS provider (e.g. Twilio) enabled in Supabase Auth > Providers > Phone
  const sendPhoneOtp = async (phone: string): Promise<LoginResult> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    } catch {
      return { ok: false, error: 'Network error. Check your connection and try again.' }
    }
  }

  const verifyPhoneOtp = async (phone: string, token: string): Promise<LoginResult> => {
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    } catch {
      return { ok: false, error: 'Network error. Check your connection and try again.' }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, checkUsernameAvailable, resetPassword, updatePassword, logout, loginWithGoogle, sendPhoneOtp, verifyPhoneOtp }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
