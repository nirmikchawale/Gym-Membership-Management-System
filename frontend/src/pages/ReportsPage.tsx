import { useEffect, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { DashboardOverviewPanels } from '../components/DashboardOverview'
import { Badge, Button } from '../components/ui'
import { getDashboard, type DashboardOverview } from '../lib/dashboard-api'
import { getPreviewDashboard } from '../lib/dashboard-preview'

type TrendDays = 7 | 14 | 30
type ExpiringDays = 30 | 60 | 90

export function ReportsPage({ publicPreview }: { publicPreview: boolean }) {
  const [trendDays, setTrendDays] = useState<TrendDays>(7)
  const [expiringDays, setExpiringDays] = useState<ExpiringDays>(30)
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (publicPreview) {
      setData(getPreviewDashboard(trendDays, expiringDays))
      setError(null)
      return
    }

    const controller = new AbortController()
    setData(null)
    setError(null)
    void getDashboard({ trendDays, expiringDays, signal: controller.signal })
      .then(setData)
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load reports')
        }
      })
    return () => controller.abort()
  }, [expiringDays, publicPreview, retryKey, trendDays])

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">Operational reporting</p>
          <h1>Reports</h1>
          <p>
            Review member, membership and attendance signals using bounded windows backed by the
            same operational records as the front-desk workflows.
          </p>
        </div>
        <Badge tone={publicPreview ? 'accent' : 'neutral'}>
          {publicPreview ? 'Interactive synthetic data' : 'Payments excluded'}
        </Badge>
      </header>

      {publicPreview && (
        <aside className="demo-notice" aria-label="Reporting demo notice">
          <SlidersHorizontal size={18} aria-hidden="true" />
          <div>
            <strong>Reports reconcile with the shared demo sandbox</strong>
            <p>
              Member, membership and attendance changes made elsewhere in the demo are reflected in
              these operational metrics when the reporting workspace is opened.
            </p>
          </div>
          <Badge tone="success">Reconciled</Badge>
        </aside>
      )}

      <article className="data-card">
        <div className="data-card__header">
          <div>
            <p className="card-eyebrow">Reporting controls</p>
            <h2>Choose the operational window.</h2>
          </div>
          <span className="insight-list__icon" aria-hidden="true">
            <SlidersHorizontal size={18} />
          </span>
        </div>
        <div className="data-toolbar">
          <label className="filter-field">
            <span>Attendance trend</span>
            <select
              value={trendDays}
              onChange={(event) => setTrendDays(Number(event.target.value) as TrendDays)}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </label>
          <label className="filter-field">
            <span>Expiry queue</span>
            <select
              value={expiringDays}
              onChange={(event) => setExpiringDays(Number(event.target.value) as ExpiringDays)}
            >
              <option value={30}>Next 30 days</option>
              <option value={60}>Next 60 days</option>
              <option value={90}>Next 90 days</option>
            </select>
          </label>
        </div>
      </article>

      {error ? (
        <article className="data-card" role="alert">
          <p className="card-eyebrow">Reports unavailable</p>
          <h2>The selected reporting window could not be loaded.</h2>
          <p className="data-empty">{error}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRetryKey((value) => value + 1)}
          >
            Try again
          </Button>
        </article>
      ) : data ? (
        <DashboardOverviewPanels data={data} />
      ) : (
        <article className="data-card" aria-live="polite" aria-busy="true">
          <p className="data-empty">Loading the selected reporting window...</p>
        </article>
      )}
    </div>
  )
}
