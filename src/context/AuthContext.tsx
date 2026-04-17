import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

interface LoginResult { ok: boolean; error?: string }
interface SignupResult { ok: boolean; confirmEmail?: boolean; error?: string }

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  signup: (name: string, email: string, password: string) => Promise<SignupResult>
  logout: () => Promise<void>
  loginWithGoogle: () => Promise<LoginResult>
  sendPhoneOtp: (phone: string) => Promise<LoginResult>
  verifyPhoneOtp: (phone: string, token: string) => Promise<LoginResult>
}

const AuthContext = createContext<AuthContextType | null>(null)

function mapUser(u: SupabaseUser): User {
  return {
    id: u.id,
    email: u.email ?? '',
    name: (u.user_metadata?.name as string) || u.email?.split('@')[0] || 'User',
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

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  const signup = async (name: string, email: string, password: string): Promise<SignupResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) return { ok: false, error: error.message }
    if (!data.session) return { ok: true, confirmEmail: true }
    return { ok: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
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
    <AuthContext.Provider value={{ user, loading, login, signup, logout, loginWithGoogle, sendPhoneOtp, verifyPhoneOtp }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
