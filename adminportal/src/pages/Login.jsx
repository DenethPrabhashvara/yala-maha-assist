import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Droplets, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { status, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from && location.state.from !== '/login' ? location.state.from : '/'

  if (status === 'in') return <Navigate to={from} replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    setError('')
    try {
      await signIn(String(form.get('username')).trim(), String(form.get('password')))
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-label="Sign in to Yala Maha Assist">
        <div className="login-intro">
          <a className="login-brand" href="/" aria-label="Yala Maha Assist home">
            <span className="login-brand-mark"><Droplets size={21} /></span>
            <span>Yala Maha <strong>Assist</strong></span>
          </a>

          <div className="login-intro-copy">
            <span className="login-eyebrow">COMMAND CENTER</span>
            <h1>Building the future of Sri Lankan farmers</h1>
            <p>Sign in to access your operations dashboard</p>
          </div>

          <div className="login-trust-note">
            <span className="login-trust-icon"><ShieldCheck size={18} /></span>
            <span><strong>Secure access</strong><small>For authorized team members </small></span>
          </div>
          <div className="login-decoration login-decoration-one" />
          <div className="login-decoration login-decoration-two" />
        </div>

        <div className="login-form-panel">
          <div className="login-form-heading">
            <span className="login-mobile-mark"><Droplets size={19} /></span>
            <h2>Welcome back</h2>
            <p>Enter your credentials to continue.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              <span>Username</span>
              <span className="login-input-wrap">
                <UserRound size={17} aria-hidden="true" />
                <input
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  required
                />
              </span>
            </label>

            <label className="login-field">
              <span>Password</span>
              <span className="login-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  className="login-password-toggle"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {error && (
              <p className="login-error" role="alert">
                <AlertTriangle size={15} />
                {error}
              </p>
            )}

            <button className="login-submit" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  Signing in <Loader2 size={17} className="spin" />
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="login-form-footnote">
            <ShieldCheck size={15} />
            Accounts are created by a super administrator. Every sign-in is recorded.
            <br />
            Unauthorized access is prohibited.
          </p>
        </div>
      </section>
      <footer className="login-footer">Yala Maha Assist <span>·</span> Watering a better future</footer>
    </main>
  )
}
