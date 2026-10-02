import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CirclePause,
  Pencil,
  Plus,
  Search,
  UserCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import {
  createMember,
  listMembers,
  setMemberActive,
  updateMember,
  type MemberInput,
  type MemberRecord,
} from '../lib/api'
import { formatDate, type DemoMember } from '../lib/demo-data'
import {
  registeredDemoMemberMetrics,
  registeredDemoMembers,
} from '../lib/registered-demo-members'
import { Badge, Button } from '../components/ui'

type StatusFilter = 'all' | 'active' | 'inactive'

type DisplayMember = {
  id: string
  code: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  joinedOn: string
  dateOfBirth: string | null
  isActive: boolean
  demoPlanCode?: string
  demoMembershipEnds?: string
}

const PAGE_SIZE = 20

function fromApi(member: MemberRecord): DisplayMember {
  return {
    id: member.id,
    code: member.member_code,
    firstName: member.first_name,
    lastName: member.last_name,
    email: member.email,
    phone: member.phone,
    joinedOn: member.joined_on,
    dateOfBirth: member.date_of_birth,
    isActive: member.is_active,
  }
}

function fromDemo(member: DemoMember): DisplayMember {
  const [firstName, ...rest] = member.name.split(' ')
  return {
    id: `demo:${member.code}`,
    code: member.code,
    firstName,
    lastName: rest.join(' '),
    email: member.email,
    phone: member.phone,
    joinedOn: member.joinedOn,
    dateOfBirth: null,
    isActive: member.status === 'Active',
    demoPlanCode: member.planCode,
    demoMembershipEnds: member.membershipEnds,
  }
}

function fullName(member: DisplayMember) {
  return `${member.firstName} ${member.lastName}`.trim()
}

function initials(member: DisplayMember) {
  return `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase()
}

function MemberFormDialog({
  mode,
  member,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit'
  member: DisplayMember | null
  onClose: () => void
  onSaved: (member: DisplayMember) => void
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
    const payload: MemberInput = {
      first_name: value('first_name'),
      last_name: value('last_name'),
      email: value('email') || null,
      phone: value('phone') || null,
      date_of_birth: value('date_of_birth') || null,
      joined_on: value('joined_on'),
    }
    const code = value('member_code')
    if (code) payload.member_code = code

    try {
      const saved =
        mode === 'create' || member === null
          ? await createMember(payload)
          : await updateMember(member.id, payload)
      onSaved(fromApi(saved))
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save member')
      setSubmitting(false)
    }
  }

  return (
    <div className="member-form-dialog" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !submitting) onClose()
    }}>
      <section
        className="member-form-dialog__surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-form-title"
      >
        <div className="member-form-dialog__header">
          <div>
            <p className="card-eyebrow">{mode === 'create' ? 'New member' : 'Member record'}</p>
            <h2 id="member-form-title">{mode === 'create' ? 'Add a member' : 'Edit member'}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close member form" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="member-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Member code <small>optional</small></span>
            <input name="member_code" defaultValue={member?.code ?? ''} maxLength={32} autoComplete="off" />
          </label>
          <div className="member-form__split">
            <label className="field">
              <span className="field__label">First name</span>
              <input name="first_name" defaultValue={member?.firstName ?? ''} maxLength={100} autoFocus required />
            </label>
            <label className="field">
              <span className="field__label">Last name</span>
              <input name="last_name" defaultValue={member?.lastName ?? ''} maxLength={100} required />
            </label>
          </div>
          <div className="member-form__split">
            <label className="field">
              <span className="field__label">Email</span>
              <input name="email" type="email" defaultValue={member?.email ?? ''} maxLength={320} autoComplete="email" />
            </label>
            <label className="field">
              <span className="field__label">Phone</span>
              <input name="phone" type="tel" defaultValue={member?.phone ?? ''} maxLength={32} autoComplete="tel" />
            </label>
          </div>
          <div className="member-form__split">
            <label className="field">
              <span className="field__label">Date of birth</span>
              <input name="date_of_birth" type="date" defaultValue={member?.dateOfBirth ?? ''} />
            </label>
            <label className="field">
              <span className="field__label">Joined on</span>
              <input name="joined_on" type="date" defaultValue={member?.joinedOn ?? new Date().toISOString().slice(0, 10)} required />
            </label>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="member-form__actions">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : mode === 'create' ? 'Add member' : 'Save changes'}</Button>
          </div>
        </form>
      </section>
    </div>
  )
}

export function MembersPage({ publicPreview }: { publicPreview: boolean }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [members, setMembers] = useState<DisplayMember[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(!publicPreview)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [statusBusy, setStatusBusy] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => setPage(1), [debouncedQuery, status])

  const filteredDemoMembers = useMemo(() => {
    if (!publicPreview) return []
    const normalized = debouncedQuery.toLowerCase()
    return registeredDemoMembers
      .map(fromDemo)
      .filter((member) => {
        const matchesStatus =
          status === 'all' || (status === 'active' ? member.isActive : !member.isActive)
        const matchesQuery =
          !normalized ||
          [member.code, fullName(member), member.email ?? '', member.phone ?? '', member.demoPlanCode ?? '']
            .join(' ')
            .toLowerCase()
            .includes(normalized)
        return matchesStatus && matchesQuery
      })
  }, [debouncedQuery, publicPreview, status])

  useEffect(() => {
    if (publicPreview) {
      const offset = (page - 1) * PAGE_SIZE
      setMembers(filteredDemoMembers.slice(offset, offset + PAGE_SIZE))
      setTotal(filteredDemoMembers.length)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)
    void listMembers({
      query: debouncedQuery || undefined,
      status,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      signal: controller.signal,
    })
      .then((response) => {
        setMembers(response.items.map(fromApi))
        setTotal(response.total)
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load members')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [debouncedQuery, filteredDemoMembers, page, publicPreview, refreshKey, status])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const selected = members.find((member) => member.id === selectedId) ?? null
  const activeOnPage = members.filter((member) => member.isActive).length

  async function toggleMember(member: DisplayMember) {
    if (publicPreview) return
    setStatusBusy(true)
    setError(null)
    try {
      const saved = fromApi(await setMemberActive(member.id, !member.isActive))
      setSelectedId(saved.id)
      setRefreshKey((value) => value + 1)
    } catch (toggleError: unknown) {
      setError(toggleError instanceof Error ? toggleError.message : 'Unable to change member status')
    } finally {
      setStatusBusy(false)
    }
  }

  function savedMember(member: DisplayMember) {
    setFormMode(null)
    setSelectedId(member.id)
    setRefreshKey((value) => value + 1)
  }

  return (
    <div className="page-stack">
      <header className="page-heading member-page-heading">
        <div>
          <p className="page-eyebrow">Member operations</p>
          <h1>Members</h1>
          <p>
            Search, inspect and maintain the member directory. This is the first completed vertical
            product slice after the verified Phase 3D shell.
          </p>
        </div>
        {publicPreview ? (
          <Badge tone="accent">Read-only demo · {registeredDemoMemberMetrics.total} records</Badge>
        ) : (
          <Button type="button" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setFormMode('create')}>
            Add member
          </Button>
        )}
      </header>

      <section className="member-metrics" aria-label="Member summary">
        <article>
          <UsersRound size={18} aria-hidden="true" />
          <span>Total records</span>
          <strong>{publicPreview ? registeredDemoMemberMetrics.total : total}</strong>
        </article>
        <article>
          <UserCheck size={18} aria-hidden="true" />
          <span>Active {publicPreview ? 'demo members' : 'on this page'}</span>
          <strong>{publicPreview ? registeredDemoMemberMetrics.active : activeOnPage}</strong>
        </article>
        <article>
          <CirclePause size={18} aria-hidden="true" />
          <span>{publicPreview ? 'Paused demo members' : 'Directory mode'}</span>
          <strong>{publicPreview ? registeredDemoMemberMetrics.paused : status === 'all' ? 'All' : status}</strong>
        </article>
      </section>

      {publicPreview && (
        <aside className="demo-notice member-demo-notice" aria-label="Demo data notice">
          <UserRound size={18} aria-hidden="true" />
          <div>
            <strong>Synthetic member dataset</strong>
            <p>
              Gridstone now contains the original 12 demo members plus 100 additional deterministic
              member records. All names and contact details are fabricated for demonstration.
            </p>
          </div>
          <Badge tone="success">112 total</Badge>
        </aside>
      )}

      <section className="member-workspace" aria-label="Member directory workspace">
        <article className="data-card member-directory">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Member directory</p>
              <h2>Find a member in seconds.</h2>
            </div>
            <Badge tone="neutral" className="member-result-count">{loading ? 'Loading…' : `${total} match${total === 1 ? '' : 'es'}`}</Badge>
          </div>

          <div className="data-toolbar member-toolbar">
            <label className="search-field">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search members</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, code, email, phone or plan"
                autoComplete="off"
              />
            </label>
            <label className="filter-field">
              <span>Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Paused / inactive</option>
              </select>
            </label>
          </div>

          {error && <div className="workspace-alert member-error" role="alert">{error}</div>}

          <div className="data-table-wrap member-table-wrap" aria-live="polite">
            <table className="data-table member-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Joined</th>
                  {publicPreview && <th>Plan</th>}
                  <th>Status</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {!loading && members.map((member) => (
                  <tr key={member.id} className={selectedId === member.id ? 'member-row--selected' : undefined}>
                    <td data-label="Member">
                      <button className="member-cell member-cell--button" type="button" onClick={() => setSelectedId(member.id)}>
                        <span className="member-cell__avatar" aria-hidden="true">{initials(member)}</span>
                        <span><strong>{fullName(member)}</strong><small>{member.code}</small></span>
                      </button>
                    </td>
                    <td data-label="Contact">
                      <span className="stacked-cell"><strong>{member.phone ?? 'No phone'}</strong><small>{member.email ?? 'No email'}</small></span>
                    </td>
                    <td data-label="Joined">{formatDate(member.joinedOn)}</td>
                    {publicPreview && <td data-label="Plan">{member.demoPlanCode}</td>}
                    <td data-label="Status"><Badge tone={member.isActive ? 'success' : 'warning'}>{member.isActive ? 'Active' : 'Paused'}</Badge></td>
                    <td data-label="Action"><Button type="button" variant="ghost" onClick={() => setSelectedId(member.id)}>View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <div className="member-loading" role="status">Loading member directory…</div>}
            {!loading && members.length === 0 && <div className="data-empty" role="status">No members match this search and status filter.</div>}
          </div>

          <div className="member-pagination" aria-label="Member directory pagination">
            <span>Page {page} of {pageCount}</span>
            <div>
              <Button type="button" variant="secondary" icon={<ChevronLeft size={16} aria-hidden="true" />} disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
              <Button type="button" variant="secondary" disabled={page >= pageCount || loading} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next <ChevronRight size={16} aria-hidden="true" /></Button>
            </div>
          </div>
        </article>

        <aside className="member-detail" aria-live="polite">
          {selected ? (
            <>
              <div className="member-detail__header">
                <span className="member-detail__avatar" aria-hidden="true">{initials(selected)}</span>
                <div><p className="card-eyebrow">{selected.code}</p><h2>{fullName(selected)}</h2></div>
              </div>
              <dl className="member-detail__list">
                <div><dt>Status</dt><dd><Badge tone={selected.isActive ? 'success' : 'warning'}>{selected.isActive ? 'Active' : 'Paused'}</Badge></dd></div>
                <div><dt>Email</dt><dd>{selected.email ?? 'Not provided'}</dd></div>
                <div><dt>Phone</dt><dd>{selected.phone ?? 'Not provided'}</dd></div>
                <div><dt>Joined</dt><dd>{formatDate(selected.joinedOn)}</dd></div>
                {selected.dateOfBirth && <div><dt>Date of birth</dt><dd>{formatDate(selected.dateOfBirth)}</dd></div>}
                {selected.demoPlanCode && <div><dt>Demo plan</dt><dd>{selected.demoPlanCode}</dd></div>}
                {selected.demoMembershipEnds && <div><dt>Demo membership ends</dt><dd>{formatDate(selected.demoMembershipEnds)}</dd></div>}
              </dl>
              {publicPreview ? (
                <p className="member-detail__note">Public preview records are intentionally read-only. Editing is enabled only in the authenticated application.</p>
              ) : (
                <div className="member-detail__actions">
                  <Button type="button" variant="secondary" icon={<Pencil size={15} aria-hidden="true" />} onClick={() => setFormMode('edit')}>Edit member</Button>
                  <Button type="button" variant={selected.isActive ? 'danger' : 'secondary'} disabled={statusBusy} onClick={() => void toggleMember(selected)}>{statusBusy ? 'Saving…' : selected.isActive ? 'Deactivate' : 'Reactivate'}</Button>
                </div>
              )}
            </>
          ) : (
            <div className="member-detail__empty"><UserRound size={26} aria-hidden="true" /><h2>Select a member</h2><p>Open any row to inspect contact details, status and lifecycle context.</p></div>
          )}
        </aside>
      </section>

      {formMode && !publicPreview && (
        <MemberFormDialog
          mode={formMode}
          member={formMode === 'edit' ? selected : null}
          onClose={() => setFormMode(null)}
          onSaved={savedMember}
        />
      )}
    </div>
  )
}
