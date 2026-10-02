import {
  ArrowUpRight,
  CalendarClock,
  Database,
  IndianRupee,
  KeyRound,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AuthUser } from '../lib/api'
import type { HealthState } from '../lib/app-state'
import {
  demoAttendance,
  demoDataset,
  demoMetrics,
  demoMemberships,
  formatINR,
} from '../lib/demo-data'
import { moduleDefinitions } from '../lib/navigation'
import { Badge } from '../components/ui'

function databaseCopy(health: HealthState) {
  if (health.kind === 'loaded') return 'PostgreSQL connected'
  return 'Public preview uses synthetic read-only data'
}

export function HomePage({ user, health }: { user: AuthUser; health: HealthState }) {
  const expiringMembers = demoMemberships
    .filter((membership) => membership.status === 'Expiring')
    .slice(0, 3)
  const latestVisits = demoAttendance.filter((visit) => visit.date === demoDataset.asOf).slice(-4)

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">Gridstone workspace</p>
          <h1>The front desk, without the friction.</h1>
          <p>
            Welcome, <strong>{user.full_name}</strong>. This public build now includes a populated,
            synthetic gym dataset so every operational module can be explored end to end.
          </p>
        </div>
        <Badge tone="accent">Synthetic demo · 02 Oct 2026</Badge>
      </header>

      <section className="hero-grid" aria-label="Gridstone demo overview">
        <article className="hero-panel">
          <div className="hero-panel__glow" aria-hidden="true" />
          <div className="hero-copy">
            <p className="hero-kicker">Live product preview</p>
            <h2>Real workflows. Safe demo records.</h2>
            <p>
              Members, plans, renewals, attendance, payments and reports now contain realistic
              example entries. Nothing here is scraped or personal: the entire preview dataset is
              fabricated for Gridstone.
            </p>
            <Link className="text-link" to="/members">
              Open the member directory <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="hero-metrics" aria-label="Gridstone demo metrics">
            <div className="hero-metric">
              <strong>{demoMetrics.activeMembers}</strong>
              <span>active demo members</span>
            </div>
            <div className="hero-metric">
              <strong>{demoMetrics.visitsToday}</strong>
              <span>check-ins today</span>
            </div>
            <div className="hero-metric">
              <strong>{formatINR(demoMetrics.collectedRevenue)}</strong>
              <span>recorded demo revenue</span>
            </div>
          </div>
        </article>

        <article className="signal-panel">
          <div className="signal-panel__header">
            <div>
              <p className="card-eyebrow">Workspace signal</p>
              <h2>Today at a glance</h2>
            </div>
            <span className="signal-light signal-light--loaded" aria-hidden="true" />
          </div>

          <div className="signal-list">
            <div className="signal-row">
              <span className="signal-row__icon">
                <UsersRound size={17} aria-hidden="true" />
              </span>
              <span>
                <strong>{demoMetrics.members} member records</strong>
                <small>{demoMetrics.activeMembers} active · 1 paused</small>
              </span>
            </div>
            <div className="signal-row">
              <span className="signal-row__icon">
                <CalendarClock size={17} aria-hidden="true" />
              </span>
              <span>
                <strong>{demoMetrics.expiringMemberships} renewals need attention</strong>
                <small>Surfaced from the demo membership ledger</small>
              </span>
            </div>
            <div className="signal-row">
              <span className="signal-row__icon">
                <UserRoundCheck size={17} aria-hidden="true" />
              </span>
              <span>
                <strong>{demoMetrics.inGymNow} members currently in gym</strong>
                <small>Open visits remain visible until checkout</small>
              </span>
            </div>
          </div>
        </article>
      </section>

      <section aria-labelledby="module-heading">
        <div className="section-heading">
          <div>
            <p className="card-eyebrow">Operational map</p>
            <h2 id="module-heading">Every module now has visible data.</h2>
          </div>
          <p>
            The public preview is read-only by design. It demonstrates information architecture and
            workflows without pretending that synthetic records are production data.
          </p>
        </div>

        <div className="module-grid">
          {moduleDefinitions.map((module, index) => {
            const Icon = module.icon
            return (
              <Link className="module-card" to={module.path} key={module.path}>
                <span
                  className={`module-card__icon module-card__icon--${(index % 3) + 1}`}
                  aria-hidden="true"
                >
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <span className="module-card__body">
                  <span className="module-card__meta">{module.eyebrow}</span>
                  <strong>{module.label}</strong>
                  <small>{module.description}</small>
                </span>
                <ArrowUpRight className="module-card__arrow" size={17} aria-hidden="true" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="report-grid" aria-label="Gridstone demo operations">
        <article className="data-card">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Renewal queue</p>
              <h2>Expiring memberships</h2>
            </div>
            <Badge tone="warning">{expiringMembers.length} priority</Badge>
          </div>
          <div className="compact-list">
            {expiringMembers.map((membership) => (
              <div className="compact-list__row" key={membership.id}>
                <span>
                  <strong>{membership.memberName}</strong>
                  <small>{membership.planName}</small>
                </span>
                <span>
                  <strong>{membership.endsOn}</strong>
                  <small>{formatINR(membership.value)}</small>
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="data-card">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Recent activity</p>
              <h2>Latest check-ins</h2>
            </div>
            <Badge tone="success">{demoMetrics.inGymNow} open</Badge>
          </div>
          <div className="compact-list">
            {latestVisits.map((visit) => (
              <div className="compact-list__row" key={visit.id}>
                <span>
                  <strong>{visit.memberName}</strong>
                  <small>{visit.memberCode}</small>
                </span>
                <span>
                  <strong>{visit.checkIn}</strong>
                  <small>{visit.checkOut ?? 'In gym now'}</small>
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="principle-grid" aria-label="Gridstone preview guarantees">
        <article className="principle-card">
          <span>
            <Database size={19} aria-hidden="true" />
          </span>
          <div>
            <strong>Demo data is explicit</strong>
            <p>{databaseCopy(health)}. No real member records are exposed in this deployment.</p>
          </div>
        </article>
        <article className="principle-card">
          <span>
            <KeyRound size={19} aria-hidden="true" />
          </span>
          <div>
            <strong>Secure architecture remains intact</strong>
            <p>
              The FastAPI/PostgreSQL session architecture remains in the source; this Vercel surface
              is a public read-only preview.
            </p>
          </div>
        </article>
        <article className="principle-card">
          <span>
            <IndianRupee size={19} aria-hidden="true" />
          </span>
          <div>
            <strong>Payment data stays safe</strong>
            <p>
              The preview contains only synthetic payment metadata and never stores card numbers,
              CVV, UPI PINs or bank credentials.
            </p>
          </div>
        </article>
      </section>
    </div>
  )
}
