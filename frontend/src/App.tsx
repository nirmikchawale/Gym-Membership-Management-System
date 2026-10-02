import { FormEvent, useEffect, useState } from 'react'
import {
  getCurrentUser,
  getHealth,
  login,
  logout,
  type AuthUser,
  type HealthResponse,
} from './lib/api'

type AuthState =
  | { kind: 'loading' }
  | { kind: 'anonymous' }
  | { kind: 'authenticated'; user: AuthUser }
  | { kind: 'error'; message: string }

type HealthState =
  | { kind: 'loading' }
  | { kind: 'loaded'; data: HealthResponse }
  | { kind: 'error' }

function LoginPanel({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
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
    <section className="auth-card" aria-labelledby="login-title">
      <div>
        <p className="eyebrow">Gridstone · Staff access</p>
        <h1 id="login-title">Run the gym from one solid system.</h1>
        <p className="lede">
          Sign in with your staff or administrator account. Member self-service is intentionally not
          part of this phase.
        </p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  )
}

function AuthenticatedShell({
  user,
  onSignedOut,
}: {
  user: AuthUser
  onSignedOut: () => void
}) {
  const [signoutError, setSignoutError] = useState<string | null>(null)

  async function handleLogout() {
    setSignoutError(null)
    try {
      await logout()
      onSignedOut()
    } catch (logoutError: unknown) {
      setSignoutError(logoutError instanceof Error ? logoutError.message : 'Unable to sign out')
    }
  }

  return (
    <section className="app-card" aria-labelledby="app-title">
      <header className="app-header">
        <div>
          <p className="eyebrow">Gridstone · Phase 3C</p>
          <h1 id="app-title">Authentication foundation active.</h1>
        </div>
        <button className="secondary-button" type="button" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <p className="lede">
        Signed in as <strong>{user.full_name}</strong> ({user.role}). The secure staff shell is
        ready for the business workflows that will be implemented in later phases.
      </p>

      {signoutError && (
        <p className="form-error" role="alert">
          {signoutError}
        </p>
      )}

      <div className="foundation-grid" aria-label="Phase 3C security scope">
        <article>
          <h2>Authentication</h2>
          <p>Argon2 password hashing and opaque database-backed sessions.</p>
        </article>
        <article>
          <h2>Authorization</h2>
          <p>Server-side admin/staff role enforcement with default-deny protected routes.</p>
        </article>
        <article>
          <h2>Session safety</h2>
          <p>HttpOnly session cookies, CSRF protection, expiry and explicit logout revocation.</p>
        </article>
      </div>

      <p className="phase-note">
        Member management, plans, renewals, attendance, payments and reporting are still future
        product pages—not hidden unfinished screens.
      </p>
    </section>
  )
}

export function App() {
  const [auth, setAuth] = useState<AuthState>({ kind: 'loading' })
  const [health, setHealth] = useState<HealthState>({ kind: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    void getCurrentUser(controller.signal)
      .then((user) =>
        setAuth(user ? { kind: 'authenticated', user } : { kind: 'anonymous' }),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setAuth({
          kind: 'error',
          message: error instanceof Error ? error.message : 'Unable to verify your session',
        })
      })

    void getHealth(controller.signal)
      .then((data) => setHealth({ kind: 'loaded', data }))
      .catch(() => {
        if (!controller.signal.aborted) setHealth({ kind: 'error' })
      })

    return () => controller.abort()
  }, [])

  return (
    <main id="main-content" className="page-shell">
      <div className="brand-mark" aria-label="Gridstone">
        <span aria-hidden="true">G</span>
        <strong>Gridstone</strong>
      </div>

      {auth.kind === 'loading' && (
        <section className="auth-card" aria-live="polite">
          <p className="eyebrow">Gridstone</p>
          <h1>Checking your session…</h1>
        </section>
      )}

      {auth.kind === 'anonymous' && (
        <LoginPanel onAuthenticated={(user) => setAuth({ kind: 'authenticated', user })} />
      )}

      {auth.kind === 'authenticated' && (
        <AuthenticatedShell user={auth.user} onSignedOut={() => setAuth({ kind: 'anonymous' })} />
      )}

      {auth.kind === 'error' && (
        <section className="auth-card" role="alert">
          <p className="eyebrow">Gridstone</p>
          <h1>Session check unavailable.</h1>
          <p className="lede">{auth.message}</p>
        </section>
      )}

      <footer className="system-footer" aria-live="polite">
        {health.kind === 'loading' && 'Checking system health…'}
        {health.kind === 'loaded' &&
          `API online · PostgreSQL connected · ${health.data.service} ${health.data.version}`}
        {health.kind === 'error' && 'System health unavailable'}
      </footer>
    </main>
  )
}
