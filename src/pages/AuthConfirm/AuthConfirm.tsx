import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import './AuthConfirm.css'

export default function AuthConfirm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [resendLoading, setResendLoading] = useState(false)
  const [resendDone, setResendDone] = useState(false)

  // Email passed via query string from Auth.tsx on signup: /auth/confirm?email=...
  const email = searchParams.get('email') ?? ''

  // If the user is already confirmed and signed in (e.g. clicked email link and
  // returned to the app), redirect them to dashboard
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const handleResend = async () => {
    if (!email || resendLoading) return
    setResendLoading(true)
    try {
      await supabase.auth.resend({ type: 'signup', email })
      setResendDone(true)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="auth-confirm">
      <motion.div
        className="auth-confirm__card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-confirm__icon" aria-hidden="true">✉️</div>
        <h1 className="auth-confirm__title">Check your email</h1>
        <p className="auth-confirm__desc">
          We sent a confirmation link to
        </p>
        {email && <p className="auth-confirm__email">{email}</p>}
        <p className="auth-confirm__desc" style={{ marginTop: 8 }}>
          Click the link in the email to activate your account. It may take a minute or two to arrive.
        </p>

        <div className="auth-confirm__divider" />

        <p className="auth-confirm__hint">
          After confirming your email, come back here and sign in to get started.
        </p>

        <div className="auth-confirm__actions">
          <button
            className="auth-confirm__btn-primary"
            onClick={() => navigate('/auth')}
          >
            Sign In →
          </button>
          <button
            className="auth-confirm__btn-ghost"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>

        <p className="auth-confirm__resend">
          Didn't receive it?{' '}
          {resendDone ? (
            <span>Email resent ✓</span>
          ) : (
            <button onClick={handleResend} disabled={resendLoading}>
              {resendLoading ? 'Sending…' : 'Resend email'}
            </button>
          )}
        </p>
      </motion.div>
    </div>
  )
}
