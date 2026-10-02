import {
  ArrowUpRight,
  Database,
  KeyRound,
  PanelsTopLeft,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AuthUser } from '../lib/api'
import type { HealthState } from '../lib/app-state'
import { moduleDefinitions } from '../lib/navigation'
import { Badge } from '../components/ui'

function databaseCopy(health: HealthState) {
  if (health.kind === 'loaded') return 'PostgreSQL connected'
  if (health.kind === 'error') return 'Connection status unavailable'
  return 'Verifying connection'
}

export function HomePage({ user, health }: { user: AuthUser; health: HealthState }) {
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">Gridstone workspace</p>
          <h1>The front desk, without the friction.</h1>
          <p>
            Welcome back, <strong>{user.full_name}</strong>. The Phase 3D shell is the operating
            surface every Gridstone workflow will build on.
          </p>
        </div>
        <Badge tone="accent"><Sparkles size={13} aria-hidden="true" />Design system active</Badge>
      </header>

      <section className="hero-grid" aria-label="Gridstone workspace foundation">
        <article className="hero-panel">
          <div className="hero-panel__glow" aria-hidden="true" />
          <div className="hero-copy">
            <p className="hero-kicker">Built around the shift</p>
            <h2>One calm surface for every handoff.</h2>
            <p>
              Navigation, responsive behavior, secure identity, feedback states and visual
              hierarchy now share one system—so the business features can stay fast and familiar.
            </p>
            <Link className="text-link" to="/members">
              Explore the member surface <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="hero-metrics" aria-label="Gridstone shell facts">
            <div className="hero-metric"><strong>06</strong><span>operational modules structured</span></div>
            <div className="hero-metric"><strong>02</strong><span>server-enforced staff roles</span></div>
            <div className="hero-metric"><strong>01</strong><span>single secure workspace</span></div>
          </div>
        </article>

        <article className="signal-panel">
          <div className="signal-panel__header">
            <div>
              <p className="card-eyebrow">Live foundation</p>
              <h2>System signal</h2>
            </div>
            <span className={`signal-light signal-light--${health.kind}`} aria-hidden="true" />
          </div>

          <div className="signal-list">
            <div className="signal-row">
              <span className="signal-row__icon"><Database size={17} aria-hidden="true" /></span>
              <span><strong>Data backbone</strong><small>{databaseCopy(health)}</small></span>
            </div>
            <div className="signal-row">
              <span className="signal-row__icon"><KeyRound size={17} aria-hidden="true" /></span>
              <span><strong>Staff identity</strong><small>Opaque sessions + CSRF protection</small></span>
            </div>
            <div className="signal-row">
              <span className="signal-row__icon"><PanelsTopLeft size={17} aria-hidden="true" /></span>
              <span><strong>Product shell</strong><small>Deep-link routes + shared primitives</small></span>
            </div>
          </div>
        </article>
      </section>

      <section aria-labelledby="module-heading">
        <div className="section-heading">
          <div>
            <p className="card-eyebrow">Operational map</p>
            <h2 id="module-heading">Everything has a place now.</h2>
          </div>
          <p>These are real routes and real design surfaces. Business actions remain intentionally gated to their feature phases.</p>
        </div>

        <div className="module-grid">
          {moduleDefinitions.map((module, index) => {
            const Icon = module.icon
            return (
              <Link className="module-card" to={module.path} key={module.path}>
                <span className={`module-card__icon module-card__icon--${(index % 3) + 1}`} aria-hidden="true">
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

      <section className="principle-grid" aria-label="Gridstone design principles">
        <article className="principle-card">
          <span><Smartphone size={19} aria-hidden="true" /></span>
          <div><strong>Mobile is first-class</strong><p>Drawer navigation, stacked layouts and touch-safe controls—not a squeezed desktop.</p></div>
        </article>
        <article className="principle-card">
          <span><KeyRound size={19} aria-hidden="true" /></span>
          <div><strong>Security stays visible</strong><p>Identity, role and system state are clear without exposing implementation detail.</p></div>
        </article>
        <article className="principle-card">
          <span><Sparkles size={19} aria-hidden="true" /></span>
          <div><strong>Motion knows when to stop</strong><p>Ambient scroll-tide depth is subtle and automatically removed for reduced-motion users.</p></div>
        </article>
      </section>

      <section className="next-strip">
        <div>
          <p className="card-eyebrow">Next build slice</p>
          <h2>Members turns this shell into a working product.</h2>
        </div>
        <div className="next-strip__steps" aria-label="Upcoming product sequence">
          <span className="next-step next-step--active">01 <strong>Members</strong></span>
          <span className="next-step">02 Plans</span>
          <span className="next-step">03 Memberships</span>
          <span className="next-step">04 Attendance</span>
        </div>
      </section>
    </div>
  )
}
