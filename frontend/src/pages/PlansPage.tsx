import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  BadgeIndianRupee,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CirclePause,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import {
  createPlan,
  listPlans,
  setPlanActive,
  updatePlan,
  type AuthUser,
  type PlanInput,
  type PlanRecord,
} from '../lib/api'
import { demoPlans, formatINR, type DemoPlan } from '../lib/demo-data'
import { Badge, Button } from '../components/ui'

type StatusFilter = 'all' | 'active' | 'inactive'

type DisplayPlan = {
  id: string
  code: string
  name: string
  description: string | null
  durationDays: number
  price: string
  currency: string
  isActive: boolean
  activeMembers?: number
}

const PAGE_SIZE = 20

function fromApi(plan: PlanRecord): DisplayPlan {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description,
    durationDays: plan.duration_days,
    price: plan.price,
    currency: plan.currency,
    isActive: plan.is_active,
  }
}

function durationFromDemo(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function fromDemo(plan: DemoPlan): DisplayPlan {
  return {
    id: `demo:${plan.code}`,
    code: plan.code,
    name: plan.name,
    description: plan.description,
    durationDays: durationFromDemo(plan.duration),
    price: plan.price.toFixed(2),
    currency: 'INR',
    isActive: plan.availability === 'Active',
    activeMembers: plan.activeMembers,
  }
}

function money(plan: DisplayPlan) {
  if (plan.currency === 'INR') return formatINR(Number(plan.price))
  return `${plan.currency} ${Number(plan.price).toLocaleString()}`
}

function PlanFormDialog({
  mode,
  plan,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit'
  plan: DisplayPlan | null
  onClose: () => void
  onSaved: (plan: DisplayPlan) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, submitting])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const data = new FormData(event.currentTarget)
    const value = (name: string) => String(data.get(name) ?? '').trim()
    const payload: PlanInput = {
      code: value('code'),
      name: value('name'),
      description: value('description') || null,
      duration_days: Number(value('duration_days')),
      price: value('price'),
      currency: value('currency') || 'INR',
    }

    try {
      const saved =
        mode === 'create' || plan === null
          ? await createPlan(payload)
          : await updatePlan(plan.id, payload)
      onSaved(fromApi(saved))
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error ? submitError.message : 'Unable to save membership plan',
      )
      setSubmitting(false)
    }
  }

  return (
    <div
      className="member-form-dialog"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose()
      }}
    >
      <section
        className="member-form-dialog__surface plan-form-surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-form-title"
      >
        <div className="member-form-dialog__header">
          <div>
            <p className="card-eyebrow">
              {mode === 'create' ? 'New membership plan' : 'Plan settings'}
            </p>
            <h2 id="plan-form-title">{mode === 'create' ? 'Create a plan' : 'Edit plan'}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close plan form"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="member-form" onSubmit={handleSubmit}>
          <div className="member-form__split">
            <label className="field">
              <span className="field__label">Plan code</span>
              <input
                name="code"
                defaultValue={plan?.code ?? ''}
                maxLength={32}
                autoFocus
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Plan name</span>
              <input name="name" defaultValue={plan?.name ?? ''} maxLength={120} required />
            </label>
          </div>
          <label className="field">
            <span className="field__label">Description</span>
            <textarea name="description" defaultValue={plan?.description ?? ''} rows={3} />
          </label>
          <div className="member-form__split">
            <label className="field">
              <span className="field__label">Duration in days</span>
              <input
                name="duration_days"
                type="number"
                min="1"
                max="3650"
                defaultValue={plan?.durationDays ?? 30}
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Price</span>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={plan?.price ?? '0.00'}
                required
              />
            </label>
          </div>
          <label className="field plan-currency-field">
            <span className="field__label">Currency</span>
            <input
              name="currency"
              defaultValue={plan?.currency ?? 'INR'}
              minLength={3}
              maxLength={3}
              required
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="member-form__actions">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : mode === 'create' ? 'Create plan' : 'Save changes'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

export function PlansPage({ publicPreview, user }: { publicPreview: boolean; user: AuthUser }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [plans, setPlans] = useState<DisplayPlan[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(!publicPreview)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [statusBusy, setStatusBusy] = useState(false)

  const canManage = !publicPreview && user.role === 'admin'

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => setPage(1), [debouncedQuery, status])

  const filteredDemoPlans = useMemo(() => {
    if (!publicPreview) return []
    const normalized = debouncedQuery.toLowerCase()
    return demoPlans.map(fromDemo).filter((plan) => {
      const matchesStatus =
        status === 'all' || (status === 'active' ? plan.isActive : !plan.isActive)
      const matchesQuery =
        !normalized ||
        [plan.code, plan.name, plan.description ?? '', String(plan.durationDays)]
          .join(' ')
          .toLowerCase()
          .includes(normalized)
      return matchesStatus && matchesQuery
    })
  }, [debouncedQuery, publicPreview, status])

  useEffect(() => {
    if (publicPreview) {
      const offset = (page - 1) * PAGE_SIZE
      setPlans(filteredDemoPlans.slice(offset, offset + PAGE_SIZE))
      setTotal(filteredDemoPlans.length)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)
    void listPlans({
      query: debouncedQuery || undefined,
      status,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      signal: controller.signal,
    })
      .then((response) => {
        setPlans(response.items.map(fromApi))
        setTotal(response.total)
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error ? loadError.message : 'Unable to load membership plans',
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [debouncedQuery, filteredDemoPlans, page, publicPreview, refreshKey, status])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const selected = plans.find((plan) => plan.id === selectedId) ?? null
  const activeCount = publicPreview
    ? demoPlans.filter((plan) => plan.availability === 'Active').length
    : plans.filter((plan) => plan.isActive).length

  async function togglePlan(plan: DisplayPlan) {
    if (!canManage) return
    setStatusBusy(true)
    setError(null)
    try {
      const saved = fromApi(await setPlanActive(plan.id, !plan.isActive))
      setSelectedId(saved.id)
      setRefreshKey((value) => value + 1)
    } catch (toggleError: unknown) {
      setError(
        toggleError instanceof Error ? toggleError.message : 'Unable to change plan availability',
      )
    } finally {
      setStatusBusy(false)
    }
  }

  function savedPlan(plan: DisplayPlan) {
    setFormMode(null)
    setSelectedId(plan.id)
    setRefreshKey((value) => value + 1)
  }

  return (
    <div className="page-stack">
      <header className="page-heading plan-page-heading">
        <div>
          <p className="page-eyebrow">Commercial configuration</p>
          <h1>Membership Plans</h1>
          <p>
            Manage duration, pricing and availability without rewriting the price snapshots already
            stored on historical memberships.
          </p>
        </div>
        {publicPreview ? (
          <Badge tone="accent">Read-only plan preview</Badge>
        ) : canManage ? (
          <Button
            type="button"
            icon={<Plus size={16} aria-hidden="true" />}
            onClick={() => setFormMode('create')}
          >
            Create plan
          </Button>
        ) : (
          <Badge tone="neutral">
            <ShieldCheck size={13} aria-hidden="true" />
            Admin changes only
          </Badge>
        )}
      </header>

      <section className="plan-metrics" aria-label="Plan summary">
        <article>
          <CalendarDays size={18} aria-hidden="true" />
          <span>Total plans</span>
          <strong>{publicPreview ? demoPlans.length : total}</strong>
        </article>
        <article>
          <BadgeIndianRupee size={18} aria-hidden="true" />
          <span>Active availability</span>
          <strong>{activeCount}</strong>
        </article>
        <article>
          <CirclePause size={18} aria-hidden="true" />
          <span>Inactive on this view</span>
          <strong>{plans.filter((plan) => !plan.isActive).length}</strong>
        </article>
      </section>

      <section className="plan-workspace" aria-label="Membership plan workspace">
        <article className="data-card plan-directory">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Plan catalog</p>
              <h2>Price and package configuration</h2>
            </div>
            <Badge tone="neutral">
              {loading ? 'Loading…' : `${total} result${total === 1 ? '' : 's'}`}
            </Badge>
          </div>

          <div className="data-toolbar plan-toolbar">
            <label className="search-field">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search plans</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search code, name or description"
                autoComplete="off"
              />
            </label>
            <label className="filter-field">
              <span>Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="workspace-alert" role="alert">
              {error}
            </div>
          )}

          <div className="data-table-wrap plan-table-wrap" aria-live="polite">
            <table className="data-table plan-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Duration</th>
                  <th>Price</th>
                  {publicPreview && <th>Demo members</th>}
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {!loading &&
                  plans.map((plan) => (
                    <tr
                      key={plan.id}
                      className={selectedId === plan.id ? 'plan-row--selected' : undefined}
                    >
                      <td data-label="Plan">
                        <button
                          className="plan-name-button"
                          type="button"
                          onClick={() => setSelectedId(plan.id)}
                        >
                          <strong>{plan.name}</strong>
                          <small>{plan.code}</small>
                        </button>
                      </td>
                      <td data-label="Duration">{plan.durationDays} days</td>
                      <td data-label="Price">
                        <strong>{money(plan)}</strong>
                      </td>
                      {publicPreview && (
                        <td data-label="Demo members">{plan.activeMembers ?? 0}</td>
                      )}
                      <td data-label="Status">
                        <Badge tone={plan.isActive ? 'success' : 'neutral'}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="plan-table__action">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setSelectedId(plan.id)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {!loading && plans.length === 0 && (
              <div className="plan-empty">
                <strong>No plans match this view.</strong>
                <p>Adjust the search or availability filter.</p>
              </div>
            )}
          </div>

          <div className="plan-pagination" aria-label="Plan pagination">
            <span>
              Page {page} of {pageCount}
            </span>
            <div>
              <Button
                type="button"
                variant="secondary"
                icon={<ChevronLeft size={16} aria-hidden="true" />}
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= pageCount || loading}
                onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              >
                Next <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </article>

        <aside className="data-card plan-detail" aria-live="polite">
          {selected ? (
            <>
              <div className="plan-detail__heading">
                <div>
                  <p className="card-eyebrow">{selected.code}</p>
                  <h2>{selected.name}</h2>
                </div>
                <Badge tone={selected.isActive ? 'success' : 'neutral'}>
                  {selected.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="plan-detail__description">
                {selected.description ?? 'No description has been added for this plan.'}
              </p>
              <dl className="plan-detail__facts">
                <div>
                  <dt>Duration</dt>
                  <dd>{selected.durationDays} days</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>{money(selected)}</dd>
                </div>
                <div>
                  <dt>Currency</dt>
                  <dd>{selected.currency}</dd>
                </div>
                {publicPreview && (
                  <div>
                    <dt>Demo members</dt>
                    <dd>{selected.activeMembers ?? 0}</dd>
                  </div>
                )}
              </dl>
              {canManage ? (
                <div className="plan-detail__actions">
                  <Button
                    type="button"
                    variant="secondary"
                    icon={<Pencil size={16} aria-hidden="true" />}
                    onClick={() => setFormMode('edit')}
                  >
                    Edit plan
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={statusBusy}
                    onClick={() => void togglePlan(selected)}
                  >
                    {statusBusy
                      ? 'Updating…'
                      : selected.isActive
                        ? 'Deactivate plan'
                        : 'Reactivate plan'}
                  </Button>
                </div>
              ) : (
                <p className="plan-detail__note">
                  {publicPreview
                    ? 'This deployment is a read-only synthetic preview.'
                    : 'Plan pricing and availability changes require an administrator account.'}
                </p>
              )}
            </>
          ) : (
            <div className="plan-detail__empty">
              <BadgeIndianRupee size={24} aria-hidden="true" />
              <strong>Select a plan</strong>
              <p>Inspect duration, price, availability and commercial notes.</p>
            </div>
          )}
        </aside>
      </section>

      <aside className="demo-notice" aria-label="Plan history guarantee">
        <ShieldCheck size={18} aria-hidden="true" />
        <div>
          <strong>Historical pricing stays historical</strong>
          <p>
            Editing a plan changes the catalog for future work only. Existing memberships retain the
            price and currency snapshot captured when they were created.
          </p>
        </div>
      </aside>

      {formMode && canManage && (
        <PlanFormDialog
          mode={formMode}
          plan={formMode === 'edit' ? selected : null}
          onClose={() => setFormMode(null)}
          onSaved={savedPlan}
        />
      )}
    </div>
  )
}
