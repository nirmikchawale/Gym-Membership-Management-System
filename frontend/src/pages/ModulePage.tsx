import { useMemo, useState, type ReactNode } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  DatabaseZap,
  IndianRupee,
  Search,
  ShieldCheck,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'
import type { ModuleDefinition } from '../lib/navigation'
import {
  demoAttendance,
  demoDataset,
  demoMembers,
  demoMemberships,
  demoMetrics,
  demoPayments,
  demoPlans,
  demoRevenueByMonth,
  formatDate,
  formatINR,
} from '../lib/demo-data'
import { Badge } from '../components/ui'

function toneForStatus(status: string) {
  if (['Active', 'Paid', 'Completed', 'In gym'].includes(status)) return 'success' as const
  if (['Expiring', 'Pending'].includes(status)) return 'warning' as const
  if (status === 'Paused') return 'danger' as const
  return 'neutral' as const
}

function DataSourceNotice() {
  return (
    <aside className="demo-notice" aria-label="Demo data notice">
      <DatabaseZap size={18} aria-hidden="true" />
      <div>
        <strong>Synthetic demo dataset</strong>
        <p>
          These records are fabricated for the public Gridstone preview. They demonstrate the
          planned workflows without exposing real member or payment data.
        </p>
      </div>
      <Badge tone="accent">As of {demoDataset.asOf}</Badge>
    </aside>
  )
}

function MetricStrip({
  items,
}: {
  items: Array<{ label: string; value: string; meta: string; icon: ReactNode }>
}) {
  return (
    <section className="metric-strip" aria-label="Module summary">
      {items.map((item) => (
        <article className="metric-card" key={item.label}>
          <span className="metric-card__icon" aria-hidden="true">
            {item.icon}
          </span>
          <div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.meta}</small>
          </div>
        </article>
      ))}
    </section>
  )
}

function MembersDemo() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'All' | 'Active' | 'Paused'>('All')

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return demoMembers.filter((member) => {
      const matchesStatus = status === 'All' || member.status === status
      const matchesQuery =
        normalized.length === 0 ||
        [member.name, member.code, member.email, member.phone, member.planCode].some((value) =>
          value.toLowerCase().includes(normalized),
        )
      return matchesStatus && matchesQuery
    })
  }, [query, status])

  return (
    <>
      <MetricStrip
        items={[
          {
            label: 'Members',
            value: String(demoMetrics.members),
            meta: 'demo records loaded',
            icon: <UsersRound size={19} />,
          },
          {
            label: 'Active',
            value: String(demoMetrics.activeMembers),
            meta: 'currently enabled',
            icon: <UserRoundCheck size={19} />,
          },
          {
            label: 'Expiring soon',
            value: String(demoMetrics.expiringMemberships),
            meta: 'membership follow-ups',
            icon: <CalendarClock size={19} />,
          },
        ]}
      />

      <section className="data-card" aria-labelledby="member-directory-heading">
        <div className="data-card__header">
          <div>
            <p className="card-eyebrow">Member directory</p>
            <h2 id="member-directory-heading">Find a member in seconds.</h2>
          </div>
          <Badge tone="accent">{filteredMembers.length} shown</Badge>
        </div>

        <div className="data-toolbar">
          <label className="search-field">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search members</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, code, email, phone or plan"
            />
          </label>
          <label className="filter-field">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as 'All' | 'Active' | 'Paused')}
            >
              <option>All</option>
              <option>Active</option>
              <option>Paused</option>
            </select>
          </label>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Contact</th>
                <th>Plan</th>
                <th>Membership ends</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.code}>
                  <td>
                    <span className="member-cell">
                      <span className="member-cell__avatar" aria-hidden="true">
                        {member.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                      <span>
                        <strong>{member.name}</strong>
                        <small>{member.code}</small>
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className="stacked-cell">
                      <strong>{member.phone}</strong>
                      <small>{member.email}</small>
                    </span>
                  </td>
                  <td>{member.planCode}</td>
                  <td>{formatDate(member.membershipEnds)}</td>
                  <td>
                    <Badge tone={toneForStatus(member.status)}>{member.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="data-empty" role="status">
            No demo members match that search.
          </div>
        )}
      </section>
    </>
  )
}

function PlansDemo() {
  return (
    <>
      <MetricStrip
        items={[
          {
            label: 'Published plans',
            value: String(demoPlans.length),
            meta: 'available to staff',
            icon: <CheckCircle2 size={19} />,
          },
          {
            label: 'Most popular',
            value: 'Momentum',
            meta: '4 active members',
            icon: <TrendingUp size={19} />,
          },
          {
            label: 'Annual value',
            value: formatINR(11999),
            meta: 'Summit plan',
            icon: <IndianRupee size={19} />,
          },
        ]}
      />

      <section className="plan-grid" aria-label="Membership plans">
        {demoPlans.map((plan) => (
          <article className="plan-card" key={plan.code}>
            <div className="plan-card__top">
              <div>
                <p className="card-eyebrow">{plan.code}</p>
                <h2>{plan.name}</h2>
              </div>
              <Badge tone="success">{plan.availability}</Badge>
            </div>
            <p>{plan.description}</p>
            <div className="plan-price">
              <strong>{formatINR(plan.price)}</strong>
              <span>/ {plan.duration}</span>
            </div>
            <div className="plan-card__footer">
              <span>{plan.activeMembers} active members</span>
              <span>INR · historical pricing protected</span>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

function MembershipsDemo() {
  return (
    <>
      <MetricStrip
        items={[
          {
            label: 'Active memberships',
            value: String(
              demoMemberships.filter((membership) => membership.status === 'Active').length,
            ),
            meta: 'live agreements',
            icon: <ShieldCheck size={19} />,
          },
          {
            label: 'Expiring',
            value: String(demoMetrics.expiringMemberships),
            meta: 'within the demo horizon',
            icon: <CalendarClock size={19} />,
          },
          {
            label: 'Scheduled renewal',
            value: String(
              demoMemberships.filter((membership) => membership.status === 'Scheduled').length,
            ),
            meta: 'future membership',
            icon: <Clock3 size={19} />,
          },
        ]}
      />

      <section className="data-card" aria-labelledby="membership-ledger-heading">
        <div className="data-card__header">
          <div>
            <p className="card-eyebrow">Lifecycle ledger</p>
            <h2 id="membership-ledger-heading">Memberships & renewals</h2>
          </div>
          <Badge tone="neutral">{demoMemberships.length} records</Badge>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Starts</th>
                <th>Ends</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {demoMemberships.map((membership) => (
                <tr key={membership.id}>
                  <td>
                    <span className="stacked-cell">
                      <strong>{membership.memberName}</strong>
                      <small>{membership.memberCode}</small>
                    </span>
                  </td>
                  <td>
                    <span className="stacked-cell">
                      <strong>{membership.planName}</strong>
                      <small>{membership.planCode}</small>
                    </span>
                  </td>
                  <td>{formatDate(membership.startsOn)}</td>
                  <td>{formatDate(membership.endsOn)}</td>
                  <td>{formatINR(membership.value)}</td>
                  <td>
                    <Badge tone={toneForStatus(membership.status)}>{membership.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function AttendanceDemo() {
  const todayVisits = demoAttendance.filter((visit) => visit.date === demoDataset.asOf)

  return (
    <>
      <MetricStrip
        items={[
          {
            label: 'Visits today',
            value: String(demoMetrics.visitsToday),
            meta: 'check-ins on 02 Oct',
            icon: <UserRoundCheck size={19} />,
          },
          {
            label: 'In gym now',
            value: String(demoMetrics.inGymNow),
            meta: 'open visits',
            icon: <Clock3 size={19} />,
          },
          {
            label: 'Completed today',
            value: String(todayVisits.filter((visit) => visit.status === 'Completed').length),
            meta: 'closed visits',
            icon: <CheckCircle2 size={19} />,
          },
        ]}
      />

      <section className="data-card" aria-labelledby="attendance-heading">
        <div className="data-card__header">
          <div>
            <p className="card-eyebrow">Front-desk activity</p>
            <h2 id="attendance-heading">Today’s check-ins</h2>
          </div>
          <Badge tone="success">{demoMetrics.inGymNow} currently inside</Badge>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Date</th>
                <th>Check in</th>
                <th>Check out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {demoAttendance.map((visit) => (
                <tr key={visit.id}>
                  <td>
                    <span className="stacked-cell">
                      <strong>{visit.memberName}</strong>
                      <small>{visit.memberCode}</small>
                    </span>
                  </td>
                  <td>{formatDate(visit.date)}</td>
                  <td>{visit.checkIn}</td>
                  <td>{visit.checkOut ?? 'Open visit'}</td>
                  <td>
                    <Badge tone={toneForStatus(visit.status)}>{visit.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function PaymentsDemo() {
  return (
    <>
      <MetricStrip
        items={[
          {
            label: 'Collected',
            value: formatINR(demoMetrics.collectedRevenue),
            meta: 'successful demo payments',
            icon: <CircleDollarSign size={19} />,
          },
          {
            label: 'Paid records',
            value: String(demoPayments.filter((payment) => payment.status === 'Paid').length),
            meta: 'settled transactions',
            icon: <CheckCircle2 size={19} />,
          },
          {
            label: 'Pending',
            value: String(demoPayments.filter((payment) => payment.status === 'Pending').length),
            meta: 'requires follow-up',
            icon: <Clock3 size={19} />,
          },
        ]}
      />

      <section className="data-card" aria-labelledby="payments-heading">
        <div className="data-card__header">
          <div>
            <p className="card-eyebrow">Transaction ledger</p>
            <h2 id="payments-heading">Recent payments</h2>
          </div>
          <Badge tone="neutral">Metadata only · no payment secrets</Badge>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Member</th>
                <th>Date</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {demoPayments.map((payment) => (
                <tr key={payment.receipt}>
                  <td>{payment.receipt}</td>
                  <td>
                    <span className="stacked-cell">
                      <strong>{payment.memberName}</strong>
                      <small>{payment.memberCode}</small>
                    </span>
                  </td>
                  <td>{formatDate(payment.date)}</td>
                  <td>{payment.method}</td>
                  <td>{formatINR(payment.amount)}</td>
                  <td>
                    <Badge tone={toneForStatus(payment.status)}>{payment.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function ReportsDemo() {
  const maxRevenue = Math.max(...demoRevenueByMonth.map((item) => item.amount))

  return (
    <>
      <MetricStrip
        items={[
          {
            label: 'Active members',
            value: String(demoMetrics.activeMembers),
            meta: 'of 12 demo members',
            icon: <UsersRound size={19} />,
          },
          {
            label: 'Visits today',
            value: String(demoMetrics.visitsToday),
            meta: 'front-desk throughput',
            icon: <UserRoundCheck size={19} />,
          },
          {
            label: 'Collected',
            value: formatINR(demoMetrics.collectedRevenue),
            meta: 'demo payment ledger',
            icon: <IndianRupee size={19} />,
          },
        ]}
      />

      <div className="report-grid">
        <section className="data-card" aria-labelledby="revenue-report-heading">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Revenue pulse</p>
              <h2 id="revenue-report-heading">Six-month demo trend</h2>
            </div>
            <Badge tone="accent">INR</Badge>
          </div>
          <div className="bar-list">
            {demoRevenueByMonth.map((item) => (
              <div className="bar-row" key={item.month}>
                <span>{item.month}</span>
                <div className="bar-track" aria-hidden="true">
                  <span style={{ width: `${Math.max(8, (item.amount / maxRevenue) * 100)}%` }} />
                </div>
                <strong>{formatINR(item.amount)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="data-card" aria-labelledby="operations-report-heading">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Operational signals</p>
              <h2 id="operations-report-heading">What staff should notice</h2>
            </div>
          </div>
          <div className="insight-list">
            <article>
              <span className="insight-list__icon">
                <CalendarClock size={17} aria-hidden="true" />
              </span>
              <div>
                <strong>{demoMetrics.expiringMemberships} memberships need attention</strong>
                <p>Renewal follow-up is the clearest near-term retention opportunity.</p>
              </div>
            </article>
            <article>
              <span className="insight-list__icon">
                <Clock3 size={17} aria-hidden="true" />
              </span>
              <div>
                <strong>{demoMetrics.inGymNow} members are currently checked in</strong>
                <p>Open visits are visible without inventing occupancy beyond the records.</p>
              </div>
            </article>
            <article>
              <span className="insight-list__icon">
                <TrendingUp size={17} aria-hidden="true" />
              </span>
              <div>
                <strong>Momentum is the most represented demo plan</strong>
                <p>Four demo members are attached to the quarterly membership option.</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </>
  )
}

function ModuleBody({ path }: { path: string }) {
  switch (path) {
    case '/members':
      return <MembersDemo />
    case '/plans':
      return <PlansDemo />
    case '/memberships':
      return <MembershipsDemo />
    case '/attendance':
      return <AttendanceDemo />
    case '/payments':
      return <PaymentsDemo />
    case '/reports':
      return <ReportsDemo />
    default:
      return null
  }
}

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
        <Badge tone="accent">Demo data live</Badge>
      </header>

      <DataSourceNotice />
      <ModuleBody path={module.path} />
    </div>
  )
}
