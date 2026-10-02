import {
  ArrowUpRight,
  Database,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AuthUser } from '../lib/api'
import type { HealthState } from '../lib/app-state'
import { registeredDemoMemberMetrics, registeredDemoMembers } from '../lib/registered-demo-members'
import { moduleDefinitions } from '../lib/navigation'
import { Badge } from '../components/ui'

function databaseCopy(health: HealthState) {
  if (health.kind === 'loaded') return 'PostgreSQL connected'
  if (health.kind === 'error') return 'Public preview or backend unavailable'
  return 'Verifying connection'
}

export function HomePage({ user, health }: { user: AuthUser; health: HealthState }) {
  const recentDemoMembers = registeredDemoMembers.slice(-4).reverse()

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">Gridstone workspace</p>
          <h1>The front desk, without the friction.</h1>
          <p>
            Welcome, <strong>{user.full_name}</strong>. Members and Membership Plans are now real
            product workflows on the verified Phase 3D foundation.
          </p>
        </div>
        <Badge tone="accent">
          <Sparkles size={13} aria-hidden="true" />
          Members + Plans active
        </Badge>
      </header>

      <section className="hero-grid" aria-label="Gridstone operations overview">
        <article className="hero-panel">
          <div className="hero-panel__glow" aria-hidden="true" />
          <div className="hero-copy">
            <p className="hero-kicker">Current product slices</p>
            <h2>Member operations and plan configuration are real.</h2>
            <p>
              The authenticated app supports member lifecycle operations plus searchable membership
              plan configuration with admin-controlled pricing and availability. The public preview
              remains read-only and uses safe synthetic records.
            </p>
            <Link className="text-link" to="/plans">
              Open membership plans <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="hero-metrics" aria-label="Gridstone member metrics">
            <div className="hero-metric">
              <strong>{registeredDemoMemberMetrics.total}</strong>
              <span>synthetic preview members</span>
            </div>
            <div className="hero-metric">
              <strong>{registeredDemoMemberMetrics.active}</strong>
              <span>active demo records</span>
            </div>
            <div className="hero-metric">
              <strong>{registeredDemoMemberMetrics.paused}</strong>
              <span>paused demo records</span>
            </div>
          </div>
        </article>

        <article className="signal-panel">
          <div className="signal-panel__header">
            <div>
              <p className="card-eyebrow">Foundation signal</p>
              <h2>System status</h2>
            </div>
            <span className={`signal-light signal-light--${health.kind}`} aria-hidden="true" />
          </div>
          <div className="signal-list">
            <div className="signal-row">
              <span className="signal-row__icon">
                <Database size={17} aria-hidden="true" />
              </span>
              <span>
                <strong>Data backbone</strong>
                <small>{databaseCopy(health)}</small>
              </span>
            </div>
            <div className="signal-row">
              <span className="signal-row__icon">
                <KeyRound size={17} aria-hidden="true" />
              </span>
              <span>
                <strong>Staff identity</strong>
                <small>Opaque sessions + CSRF protection</small>
              </span>
            </div>
            <div className="signal-row">
              <span className="signal-row__icon">
                <ShieldCheck size={17} aria-hidden="true" />
              </span>
              <span>
                <strong>Business APIs</strong>
                <small>Members + plans validated and paginated</small>
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="report-grid" aria-label="Member preview summary">
        <article className="data-card">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Registered preview</p>
              <h2>Latest synthetic members</h2>
            </div>
            <Badge tone="success">+100 entries added</Badge>
          </div>
          <div className="compact-list">
            {recentDemoMembers.map((member) => (
              <div className="compact-list__row" key={member.code}>
                <span>
                  <strong>{member.name}</strong>
                  <small>{member.code}</small>
                </span>
                <span>
                  <strong>{member.planCode}</strong>
                  <small>{member.status}</small>
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="data-card">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Delivery sequence</p>
              <h2>What stays outside these slices</h2>
            </div>
            <Badge tone="neutral">Scope locked</Badge>
          </div>
          <div className="compact-list">
            {moduleDefinitions
              .filter((module) => module.path !== '/members' && module.path !== '/plans')
              .slice(0, 4)
              .map((module) => (
                <div className="compact-list__row" key={module.path}>
                  <span>
                    <strong>{module.label}</strong>
                    <small>{module.eyebrow}</small>
                  </span>
                  <span>
                    <strong>Later</strong>
                    <small>approved slice</small>
                  </span>
                </div>
              ))}
          </div>
        </article>
      </section>

      <section className="principle-grid" aria-label="Gridstone product principles">
        <article className="principle-card">
          <span>
            <UsersRound size={19} aria-hidden="true" />
          </span>
          <div>
            <strong>112-record public dataset</strong>
            <p>All preview member identities and contacts are synthetic and deterministic.</p>
          </div>
        </article>
        <article className="principle-card">
          <span>
            <Smartphone size={19} aria-hidden="true" />
          </span>
          <div>
            <strong>Desktop and mobile</strong>
            <p>Members and plans adapt from desktop tables to touch-friendly narrow layouts.</p>
          </div>
        </article>
        <article className="principle-card">
          <span>
            <Sparkles size={19} aria-hidden="true" />
          </span>
          <div>
            <strong>Light and dark themes</strong>
            <p>The user can switch modes at any time; the preference persists on the device.</p>
          </div>
        </article>
      </section>
    </div>
  )
}
