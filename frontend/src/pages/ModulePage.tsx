import { Check, Layers3, LockKeyhole } from 'lucide-react'
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
        <Badge tone="neutral">Later approved slice</Badge>
      </header>

      <div className="module-layout">
        <section className="blueprint-card" aria-labelledby={`${module.path.slice(1)}-boundary`}>
          <div className="blueprint-card__header">
            <div>
              <p className="card-eyebrow">Phase boundary</p>
              <h2 id={`${module.path.slice(1)}-boundary`}>Members is the active product slice.</h2>
            </div>
            <Badge tone="accent">
              <Layers3 size={13} aria-hidden="true" />
              Sequenced delivery
            </Badge>
          </div>
          <p className="blueprint-caption module-boundary-copy">
            This module remains intentionally outside the current build scope. Gridstone will add it
            only after the Members slice is complete and verified, so demo presentation never gets
            confused with finished business behavior.
          </p>
        </section>

        <aside className="capability-card" aria-labelledby={`${module.path.slice(1)}-capabilities`}>
          <p className="card-eyebrow">Planned capability</p>
          <h2 id={`${module.path.slice(1)}-capabilities`}>What this later slice will own</h2>
          <ul className="capability-list">
            {module.capabilities.map((capability) => (
              <li key={capability}>
                <Check size={15} aria-hidden="true" />
                <span>{capability}</span>
              </li>
            ))}
          </ul>

          <div className="foundation-note">
            <LockKeyhole size={18} aria-hidden="true" />
            <p>
              <strong>Scope protected.</strong> Navigation and design primitives exist, but no
              unfinished data-entry behavior is being presented as production-ready functionality.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
