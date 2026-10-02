import { useEffect, useState, type FormEvent } from 'react'
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CirclePause,
  Plus,
  RefreshCcw,
  Search,
  Snowflake,
  X,
} from 'lucide-react'
import { Badge, Button } from '../components/ui'
import { formatDate, formatINR } from '../lib/demo-data'
import { listMembers, listPlans, type MemberRecord, type PlanRecord } from '../lib/api'
import {
  createMembership,
  listMemberships,
  renewMembership,
  transitionMembership,
  type MembershipRecord,
  type MembershipStatus,
} from '../lib/memberships-api'

const PAGE_SIZE = 20

type StatusFilter = MembershipStatus | 'all'
type MembershipDialogMode = 'create' | 'renew'

function statusTone(status: MembershipStatus) {
  if (status === 'active') return 'success' as const
  if (status === 'cancelled' || status === 'expired') return 'neutral' as const
  if (status === 'frozen') return 'warning' as const
  return 'accent' as const
}

function MembershipFormDialog({
  mode,
  source,
  publicPreview,
  onClose,
  onSaved,
}: {
  mode: MembershipDialogMode
  source: MembershipRecord | null
  publicPreview: boolean
  onClose: () => void
  onSaved: (record: MembershipRecord) => void
}) {
  const [members, setMembers] = useState<MemberRecord[]>([])
  const [plans, setPlans] = useState<PlanRecord[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      listMembers({ status: 'active', limit: 200 }),
      listPlans({ status: 'active', limit: 100 }),
    ])
      .then(([memberResponse, planResponse]) => {
        if (!active) return
        setMembers(memberResponse.items)
        setPlans(planResponse.items)
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load options')
        }
      })
      .finally(() => {
        if (active) setLoadingOptions(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, submitting])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const data = new FormData(event.currentTarget)
    const value = (name: string) => String(data.get(name) ?? '').trim()

    try {
      const saved =
        mode === 'create'
          ? await createMembership({
              member_id: value('member_id'),
              plan_id: value('plan_id'),
              start_date: value('start_date') || null,
              notes: value('notes') || null,
            })
          : await renewMembership(source!.id, {
              plan_id: value('plan_id') || null,
              start_date: value('start_date') || null,
              notes: value('notes') || null,
            })
      onSaved(saved)
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save membership')
      setSubmitting(false)
    }
  }

  return (
    <div className="member-form-dialog" role="presentation">
      <section
        className="member-form-dialog__surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby="membership-form-title"
      >
        <div className="member-form-dialog__header">
          <div>
            <p className="card-eyebrow">
              {publicPreview
                ? 'Demo sandbox'
                : mode === 'create'
                  ? 'Membership assignment'
                  : 'Renewal'}
            </p>
            <h2 id="membership-form-title">
              {mode === 'create'
                ? 'Assign membership'
                : `Renew ${source?.member_name ?? 'membership'}`}
            </h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close membership form"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="member-form" onSubmit={submit}>
          {mode === 'create' && (
            <label className="field">
              <span className="field__label">Member</span>
              <select name="member_id" required disabled={loadingOptions} defaultValue="">
                <option value="" disabled>
                  Select an active member
                </option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.member_code} — {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span className="field__label">Plan</span>
            <select
              name="plan_id"
              required={mode === 'create'}
              disabled={loadingOptions}
              defaultValue={mode === 'renew' ? (source?.plan_id ?? '') : ''}
            >
              {mode === 'renew' && <option value="">Keep current plan</option>}
              {mode === 'create' && (
                <option value="" disabled>
                  Select an active plan
                </option>
              )}
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.code} — {plan.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">
              Start date <small>(optional)</small>
            </span>
            <input name="start_date" type="date" />
          </label>

          <label className="field">
            <span className="field__label">
              Notes <small>(optional)</small>
            </span>
            <textarea name="notes" rows={3} maxLength={2000} />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {publicPreview && (
            <p className="membership-detail__note">
              Assignment and renewal changes remain inside the synthetic demo sandbox.
            </p>
          )}

          <div className="member-form__actions">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || loadingOptions}>
              {submitting ? 'Saving…' : mode === 'create' ? 'Assign membership' : 'Create renewal'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

export function MembershipsPage({ publicPreview }: { publicPreview: boolean }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [records, setRecords] = useState<MembershipRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<MembershipDialogMode | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => setPage(1), [debouncedQuery, status])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    void listMemberships({
      query: debouncedQuery || undefined,
      status,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      signal: controller.signal,
    })
      .then((response) => {
        setRecords(response.items)
        setTotal(response.total)
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load memberships')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [debouncedQuery, page, refreshKey, status])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const selected = records.find((item) => item.id === selectedId) ?? null

  function saved(record: MembershipRecord) {
    setDialog(null)
    setSelectedId(record.id)
    setRefreshKey((value) => value + 1)
  }

  async function transition(action: 'cancel' | 'freeze' | 'resume') {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      const savedRecord = await transitionMembership(selected.id, action)
      setSelectedId(savedRecord.id)
      setRefreshKey((value) => value + 1)
    } catch (transitionError: unknown) {
      setError(
        transitionError instanceof Error ? transitionError.message : 'Unable to update membership',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-stack">
      <header className="page-heading membership-page-heading">
        <div>
          <p className="page-eyebrow">Membership lifecycle</p>
          <h1>Memberships & Renewals</h1>
          <p>
            Connect members to plans, preserve historical pricing, control access state and create
            traceable renewals.
          </p>
        </div>
        <Button
          type="button"
          icon={<Plus size={16} aria-hidden="true" />}
          onClick={() => setDialog('create')}
        >
          {publicPreview ? 'Assign demo membership' : 'Assign membership'}
        </Button>
      </header>

      <section className="membership-metrics" aria-label="Membership summary">
        <article>
          <CalendarClock size={18} aria-hidden="true" />
          <span>Results</span>
          <strong>{total}</strong>
        </article>
        <article>
          <RefreshCcw size={18} aria-hidden="true" />
          <span>Active on page</span>
          <strong>{records.filter((item) => item.status === 'active').length}</strong>
        </article>
        <article>
          <Snowflake size={18} aria-hidden="true" />
          <span>Frozen on page</span>
          <strong>{records.filter((item) => item.status === 'frozen').length}</strong>
        </article>
      </section>

      {publicPreview && (
        <aside className="demo-notice" aria-label="Membership demo notice">
          <RefreshCcw size={18} aria-hidden="true" />
          <div>
            <strong>Complete synthetic lifecycle sandbox</strong>
            <p>
              Active, scheduled, frozen, expired and cancelled examples share the same member and
              plan records. Assign, renew, freeze, resume and cancel to see the lifecycle update.
            </p>
          </div>
          <Badge tone="success">Interactive</Badge>
        </aside>
      )}

      <section className="membership-workspace">
        <article className="data-card membership-directory">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Lifecycle ledger</p>
              <h2>Find membership history quickly.</h2>
            </div>
            <Badge tone="neutral">{loading ? 'Loading…' : `${total} results`}</Badge>
          </div>

          <div className="data-toolbar membership-toolbar">
            <label className="search-field">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search memberships</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search member or plan"
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
                <option value="scheduled">Scheduled</option>
                <option value="frozen">Frozen</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="workspace-alert" role="alert">
              {error}
            </div>
          )}

          <div className="data-table-wrap membership-table-wrap" aria-live="polite">
            <table className="data-table membership-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Dates</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {!loading &&
                  records.map((item) => (
                    <tr
                      key={item.id}
                      className={selectedId === item.id ? 'membership-row--selected' : undefined}
                    >
                      <td data-label="Member">
                        <button
                          className="membership-name-button"
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                        >
                          <strong>{item.member_name}</strong>
                          <small>{item.member_code}</small>
                        </button>
                      </td>
                      <td data-label="Plan">
                        <strong>{item.plan_name}</strong>
                        <small>{item.plan_code}</small>
                      </td>
                      <td data-label="Dates">
                        <span className="stacked-cell">
                          <strong>{formatDate(item.start_date)}</strong>
                          <small>to {formatDate(item.end_date)}</small>
                        </span>
                      </td>
                      <td data-label="Price">
                        {item.currency === 'INR'
                          ? formatINR(Number(item.price_amount))
                          : `${item.currency} ${item.price_amount}`}
                      </td>
                      <td data-label="Status">
                        <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                      </td>
                      <td>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setSelectedId(item.id)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {!loading && records.length === 0 && (
              <div className="data-empty" role="status">
                No memberships match those filters.
              </div>
            )}
          </div>

          <nav className="preview-pagination" aria-label="Membership result pages">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft size={16} aria-hidden="true" /> Previous
            </Button>
            <span>
              Page {page} of {pageCount}
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              Next <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </nav>
        </article>

        <aside className="data-card membership-detail" aria-live="polite">
          {selected ? (
            <>
              <div className="membership-detail__heading">
                <div>
                  <p className="card-eyebrow">{selected.member_code}</p>
                  <h2>{selected.member_name}</h2>
                </div>
                <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
              </div>
              <dl className="membership-detail__facts">
                <div>
                  <dt>Plan</dt>
                  <dd>
                    {selected.plan_name} · {selected.plan_code}
                  </dd>
                </div>
                <div>
                  <dt>Term</dt>
                  <dd>
                    {formatDate(selected.start_date)} — {formatDate(selected.end_date)}
                  </dd>
                </div>
                <div>
                  <dt>Snapshot price</dt>
                  <dd>
                    {selected.currency === 'INR'
                      ? formatINR(Number(selected.price_amount))
                      : `${selected.currency} ${selected.price_amount}`}
                  </dd>
                </div>
                <div>
                  <dt>Renewal lineage</dt>
                  <dd>{selected.renewed_from_membership_id ? 'Renewal' : 'Original membership'}</dd>
                </div>
              </dl>
              {selected.notes && <p className="membership-detail__notes">{selected.notes}</p>}

              <div className="membership-detail__actions">
                {!['cancelled', 'scheduled'].includes(selected.status) && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setDialog('renew')}
                    disabled={busy}
                  >
                    <RefreshCcw size={16} aria-hidden="true" /> Renew
                  </Button>
                )}
                {selected.status === 'active' && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void transition('freeze')}
                    disabled={busy}
                  >
                    <Snowflake size={16} aria-hidden="true" /> Freeze
                  </Button>
                )}
                {selected.status === 'frozen' && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void transition('resume')}
                    disabled={busy}
                  >
                    <RefreshCcw size={16} aria-hidden="true" /> Resume
                  </Button>
                )}
                {!['cancelled', 'expired'].includes(selected.status) && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void transition('cancel')}
                    disabled={busy}
                  >
                    <CirclePause size={16} aria-hidden="true" /> Cancel
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="data-empty">Select a membership to inspect its lifecycle.</div>
          )}
        </aside>
      </section>

      {dialog && (
        <MembershipFormDialog
          mode={dialog}
          source={selected}
          publicPreview={publicPreview}
          onClose={() => setDialog(null)}
          onSaved={saved}
        />
      )}
    </div>
  )
}
