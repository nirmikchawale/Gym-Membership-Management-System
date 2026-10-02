import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardOverviewPanels } from '../components/DashboardOverview'
import { Badge, Button } from '../components/ui'
import type { AuthUser } from '../lib/api'
import type { HealthState } from '../lib/app-state'
import { getDashboard, type DashboardOverview } from '../lib/dashboard-api'
import { getPreviewDashboard } from '../lib/dashboard-preview'

function DashboardLoading() {
  return (
    <div className="page-stack" aria-live="polite" aria-busy="true">
      <section className="metric-strip" aria-label="Loading operational metrics">
        {['Members', 'Memberships', 'Attendance'].map((label) => (
          <article className="metric-card" key={label}>
            <div>
              <span>{label}</span>
              <strong>-</strong>
              <small>Loading persisted records...</small>
            </div>
          </article>
        ))}
      </section>
      <article className="data-card">
        <p className="data-empty">Reconciling operational data...</p>
      </article>
    </div>
  )
}

export function HomePage({
  user,
  health,
  publicPreview,
}: {
  user: AuthUser
  health: HealthState
  publicPreview: boolean
}) {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (publicPreview) {
      setData(getPreviewDashboard())
      setError(null)
      return
    }

    const controller = new AbortController()
    setError(null)
    void getDashboard({ signal: controller.signal })
      .then(setData)
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error ? loadError.message : 'Unable to load operational dashboard',
          )
        }
      })
    return () => controller.abort()
  }, [publicPreview, retryKey])

  const sourceLabel = publicPreview
    ? 'Synthetic preview'
    : health.kind === 'loaded'
      ? 'API + PostgreSQL online'
      : 'Data connection checking'
  const sourceTone = publicPreview ? 'accent' : health.kind === 'loaded' ? 'success' : 'neutral'

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">Operational dashboard</p>
          <h1>Today at Gridstone.</h1>
          <p>
            Welcome, <strong>{user.full_name}</strong>. Every number below is derived from member,
            membership and attendance records already used by the operational workflows.
          </p>
        </div>
        <Badge tone={sourceTone}>{sourceLabel}</Badge>
      </header>

      {error ? (
        <article className="data-card" role="alert">
          <p className="card-eyebrow">Dashboard unavailable</p>
          <h2>Operational data could not be loaded.</h2>
          <p className="data-empty">{error}</p>
          <Button type="button" variant="secondary" onClick={() => setRetryKey((value) => value + 1)}>
            Try again
          </Button>
        </article>
      ) : data ? (
        <DashboardOverviewPanels data={data} />
      ) : (
        <DashboardLoading />
      )}

      <article className="data-card">
        <div className="data-card__header">
          <div>
            <p className="card-eyebrow">Reporting workspace</p>
            <h2>Change the operational window without changing the source of truth.</h2>
          </div>
          <Badge tone="neutral">Payments excluded</Badge>
        </div>
        <p className="data-empty">
          Reports supports bounded attendance and expiry windows while keeping the same reconciled
          member, membership and attendance aggregates.
        </p>
        <Link className="text-link" to="/reports">
          Open reports <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </article>
    </div>
  )
}
