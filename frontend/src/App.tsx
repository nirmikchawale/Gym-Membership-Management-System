import { useEffect, useState } from 'react'
import { getHealth, type HealthResponse } from './lib/api'

type HealthState =
  | { kind: 'loading' }
  | { kind: 'loaded'; data: HealthResponse }
  | { kind: 'error'; message: string }

export function App() {
  const [health, setHealth] = useState<HealthState>({ kind: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    void getHealth(controller.signal)
      .then((data) => setHealth({ kind: 'loaded', data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Unknown health-check error'
        setHealth({ kind: 'error', message })
      })

    return () => controller.abort()
  }, [])

  return (
    <main id="main-content" className="page-shell">
      <section className="foundation-card" aria-labelledby="foundation-title">
        <p className="eyebrow">Group 11 · Phase 3A</p>
        <h1 id="foundation-title">Gym Membership Management System</h1>
        <p className="lede">
          Engineering foundation is active. Business features remain intentionally out of scope for
          this phase.
        </p>

        <div className="status-panel" aria-live="polite">
          <span className="status-label">System health</span>
          {health.kind === 'loading' && <strong>Checking API and database…</strong>}
          {health.kind === 'loaded' && (
            <strong>
              API online · PostgreSQL connected · {health.data.service} {health.data.version}
            </strong>
          )}
          {health.kind === 'error' && (
            <strong className="status-error">Unavailable · {health.message}</strong>
          )}
        </div>

        <div className="foundation-grid" aria-label="Phase 3A foundation scope">
          <article>
            <h2>Frontend</h2>
            <p>React, TypeScript, Vite, mobile-first global tokens and accessibility baseline.</p>
          </article>
          <article>
            <h2>Backend</h2>
            <p>FastAPI REST foundation with OpenAPI and PostgreSQL connectivity.</p>
          </article>
          <article>
            <h2>Quality</h2>
            <p>Linting, type checking, tests, container verification and GitHub Actions.</p>
          </article>
        </div>

        <a className="text-link" href="/api/docs">
          Open API documentation
        </a>
      </section>
    </main>
  )
}
