import { type FormEvent, useState } from 'react'
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { login, type AuthUser } from '../lib/api'
import type { HealthState } from '../lib/app-state'
import { Brand } from '../components/Brand'
import { ThemeToggle } from '../components/ThemeToggle'
import { Button } from '../components/ui'

function healthCopy(health: HealthState) {
  if (health.kind === 'loaded') return 'API + PostgreSQL online'
  if (health.kind === 'error') return 'System health unavailable'
  return 'Checking system health…'
}

export function LoginPage({
  health,
  onAuthenticated,
}: {
  health: HealthState
  onAuthenticated: (user: AuthUser) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      onAuthenticated(await login(email, password))
    } catch (loginError: unknown) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main id="main-content" className="login-page">
      <div className="ambient-layer" aria-hidden="true">
        <span className="ambient-orb ambient-orb--one" />
        <span className="ambient-orb ambient-orb--two" />
      </div>

      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      <section className="login-visual" aria-labelledby="gridstone-login-title">
        <Brand />

        <div className="login-copy">
          <p className="kicker">Gym operations, rebuilt</p>
          <h1 id="gridstone-login-title">Run the floor. Keep the business moving.</h1>
          <p className="login-lede">
            One secure workspace for members, plans, memberships and renewals, attendance, and
            operational reporting—backed by the same persistent records throughout the day.
          </p>

          <div className="login-feature-row" aria-label="Gridstone product principles">
            <span>
              <Sparkles size={16} aria-hidden="true" />
              Fast at the front desk
            </span>
            <span>
              <ShieldCheck size={16} aria-hidden="true" />
              Secure by default
            </span>
            <span>
              <LockKeyhole size={16} aria-hidden="true" />
              Staff-only access
            </span>
          </div>
        </div>

        <div className="proof-card" aria-label="Gridstone design statement">
          <div className="proof-card__signal" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className="proof-card__eyebrow">Built for pressure</p>
            <p className="proof-card__copy">
              Clear hierarchy, large touch targets, responsive layouts and user-selectable light or
              dark mode keep the interface calm when the desk gets busy.
            </p>
          </div>
        </div>
      </section>

      <section className="signin-wrap" aria-labelledby="signin-title">
        <div className="signin-panel">
          <div className="signin-header">
            <span className="signin-icon" aria-hidden="true">
              <LockKeyhole size={20} />
            </span>
            <div>
              <p className="signin-eyebrow">Secure staff access</p>
              <h2 id="signin-title">Welcome back.</h2>
            </div>
          </div>

          <p className="signin-intro">
            Sign in with your Gridstone staff or administrator account.
          </p>

          <form className="signin-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field__label">Email</span>
              <input
                className="field__control"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={error ? true : undefined}
                required
              />
            </label>

            <label className="field">
              <span className="field__label">Password</span>
              <input
                className="field__control"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={error ? true : undefined}
                required
              />
            </label>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Enter Gridstone'}
              {!submitting && <ArrowRight size={17} aria-hidden="true" />}
            </Button>
          </form>

          <div className={`health-strip health-strip--${health.kind}`} aria-live="polite">
            <span className="health-strip__dot" aria-hidden="true" />
            <span>{healthCopy(health)}</span>
          </div>
        </div>

        <p className="signin-footnote">Gridstone · Group 11 · Staff operations workspace</p>
      </section>
    </main>
  )
}
