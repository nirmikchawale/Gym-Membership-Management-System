import { CreditCard, LockKeyhole, ReceiptText, ShieldCheck } from 'lucide-react'
import { Badge } from '../components/ui'

export function PaymentsPage() {
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">Explicit project boundary</p>
          <h1>Payments</h1>
          <p>
            Membership billing, payment capture and receipts are intentionally excluded from the
            approved Gridstone project scope.
          </p>
        </div>
        <Badge tone="neutral">Not implemented — intentionally out of scope</Badge>
      </header>

      <section className="metric-strip" aria-label="Payments scope summary">
        <article className="metric-card">
          <div>
            <span>Payment capture</span>
            <strong>Excluded</strong>
            <small>No card, UPI or banking workflow</small>
          </div>
        </article>
        <article className="metric-card">
          <div>
            <span>Receipts</span>
            <strong>Excluded</strong>
            <small>No financial document generation</small>
          </div>
        </article>
        <article className="metric-card">
          <div>
            <span>Revenue analytics</span>
            <strong>Excluded</strong>
            <small>Operational reporting only</small>
          </div>
        </article>
      </section>

      <div className="module-layout">
        <section className="blueprint-card" aria-labelledby="payments-boundary">
          <div className="blueprint-card__header">
            <div>
              <p className="card-eyebrow">Scope decision</p>
              <h2 id="payments-boundary">Why this is the one unavailable module</h2>
            </div>
            <Badge tone="accent">
              <ShieldCheck size={13} aria-hidden="true" />
              Intentional
            </Badge>
          </div>
          <p className="blueprint-caption module-boundary-copy">
            The approved academic and MVP scope covers gym operations: members, plans, membership
            lifecycle and renewals, attendance, dashboard and reporting. Payments were explicitly
            removed from the completion roadmap, so Gridstone does not fake financial behavior in
            either production or the synthetic demo.
          </p>
        </section>

        <aside className="capability-card" aria-labelledby="payments-excluded-capabilities">
          <p className="card-eyebrow">Excluded financial capabilities</p>
          <h2 id="payments-excluded-capabilities">No sensitive payment handling</h2>
          <ul className="capability-list">
            <li>
              <CreditCard size={15} aria-hidden="true" />
              <span>Card or payment-provider capture</span>
            </li>
            <li>
              <ReceiptText size={15} aria-hidden="true" />
              <span>Receipts and transaction history</span>
            </li>
            <li>
              <LockKeyhole size={15} aria-hidden="true" />
              <span>UPI PINs, CVVs or banking credentials</span>
            </li>
          </ul>

          <div className="foundation-note">
            <ShieldCheck size={18} aria-hidden="true" />
            <p>
              <strong>All other navigation modules are implemented.</strong> Payments is the sole
              deliberate exception and remains separated from operational membership records.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
