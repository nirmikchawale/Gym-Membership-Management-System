import { Check, Layers3, ShieldCheck } from 'lucide-react'
import type { ModuleDefinition } from '../lib/navigation'
import { Badge } from '../components/ui'

export function ModulePage({ module }: { module: ModuleDefinition }) {
  const Icon = module.icon

  return (
    <div className="page-stack">
      <header className="module-hero">
        <div className="module-hero__icon" aria-hidden="true">
          <Icon size={28} strokeWidth={1.7} />
        </div>
        <div className="module-hero__copy">
          <p className="page-eyebrow">{module.eyebrow}</p>
          <h1>{module.title}</h1>
          <p>{module.description}</p>
        </div>
        <Badge tone="warning">Feature slice not started</Badge>
      </header>

      <div className="module-layout">
        <section className="blueprint-card" aria-labelledby={`${module.path.slice(1)}-blueprint`}>
          <div className="blueprint-card__header">
            <div>
              <p className="card-eyebrow">Interface blueprint</p>
              <h2 id={`${module.path.slice(1)}-blueprint`}>The surface is ready for real data.</h2>
            </div>
            <Badge tone="neutral">
              <Layers3 size={13} aria-hidden="true" />
              Phase 3D
            </Badge>
          </div>

          <div className="blueprint-toolbar" aria-hidden="true">
            <span className="skeleton skeleton--search" />
            <span className="skeleton skeleton--button" />
          </div>
          <div className="blueprint-table" aria-hidden="true">
            {[1, 2, 3, 4].map((row) => (
              <div className="blueprint-row" key={row}>
                <span className="skeleton skeleton--avatar" />
                <span className="skeleton skeleton--wide" />
                <span className="skeleton skeleton--medium" />
                <span className="skeleton skeleton--short" />
              </div>
            ))}
          </div>
          <p className="blueprint-caption">
            This is a design-system blueprint, not simulated business data. Search, forms and
            actions arrive with the module’s vertical feature slice.
          </p>
        </section>

        <aside className="capability-card" aria-labelledby={`${module.path.slice(1)}-capabilities`}>
          <p className="card-eyebrow">Planned capability</p>
          <h2 id={`${module.path.slice(1)}-capabilities`}>What this module will own</h2>
          <ul className="capability-list">
            {module.capabilities.map((capability) => (
              <li key={capability}>
                <Check size={15} aria-hidden="true" />
                <span>{capability}</span>
              </li>
            ))}
          </ul>

          <div className="foundation-note">
            <ShieldCheck size={18} aria-hidden="true" />
            <p>
              <strong>Foundation ready.</strong> Auth gate, route, responsive shell and PostgreSQL
              model boundary are already in place.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
