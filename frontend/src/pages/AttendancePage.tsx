import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DoorOpen,
  LogIn,
  LogOut,
  Search,
  ShieldCheck,
  ShieldX,
  UsersRound,
} from 'lucide-react'
import { Badge, Button } from '../components/ui'
import {
  checkIn,
  checkOut,
  getAttendanceAccess,
  listAttendance,
  type AttendanceAccess,
  type AttendanceRecord,
} from '../lib/attendance-api'
import { listMembers, type MemberRecord } from '../lib/api'
import { demoAttendance, demoMembers, demoMemberships } from '../lib/demo-data'

const PAGE_SIZE = 20

type AttendanceState = 'all' | 'open' | 'closed'

type LookupMember = {
  id: string
  member_code: string
  member_name: string
  is_active: boolean
}

function formatDateTime(value: string | null) {
  if (!value) return 'Still in gym'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value))
}

function durationLabel(minutes: number | null) {
  if (minutes === null) return 'Open visit'
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return hours ? `${hours}h ${remaining}m` : `${remaining}m`
}

function memberFromApi(member: MemberRecord): LookupMember {
  return {
    id: member.id,
    member_code: member.member_code,
    member_name: `${member.first_name} ${member.last_name}`.trim(),
    is_active: member.is_active,
  }
}

function previewVisits(): AttendanceRecord[] {
  return demoAttendance.map((visit) => {
    const membership = demoMemberships.find((item) => item.memberCode === visit.memberCode)
    const checkedIn = `${visit.date}T${visit.checkIn}:00+05:30`
    const checkedOut = visit.checkOut ? `${visit.date}T${visit.checkOut}:00+05:30` : null
    const durationMinutes = checkedOut
      ? Math.max(
          0,
          Math.round((new Date(checkedOut).getTime() - new Date(checkedIn).getTime()) / 60000),
        )
      : null
    return {
      id: `demo:${visit.id}`,
      member_id: `demo:${visit.memberCode}`,
      member_code: visit.memberCode,
      member_name: visit.memberName,
      membership_id: membership ? `demo:${membership.id}` : null,
      plan_code: membership?.planCode ?? null,
      plan_name: membership?.planName ?? null,
      checked_in_at: checkedIn,
      checked_out_at: checkedOut,
      is_open: visit.checkOut === null,
      duration_minutes: durationMinutes,
      notes: null,
      created_at: checkedIn,
      updated_at: checkedOut ?? checkedIn,
    }
  })
}

export function AttendancePage({ publicPreview }: { publicPreview: boolean }) {
  const [lookup, setLookup] = useState('')
  const [debouncedLookup, setDebouncedLookup] = useState('')
  const [matches, setMatches] = useState<LookupMember[]>([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [selectedMember, setSelectedMember] = useState<LookupMember | null>(null)
  const [access, setAccess] = useState<AttendanceAccess | null>(null)
  const [accessLoading, setAccessLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [historyQuery, setHistoryQuery] = useState('')
  const [debouncedHistoryQuery, setDebouncedHistoryQuery] = useState('')
  const [state, setState] = useState<AttendanceState>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [total, setTotal] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(!publicPreview)

  const syntheticVisits = useMemo(() => previewVisits(), [])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedLookup(lookup.trim()), 220)
    return () => window.clearTimeout(timer)
  }, [lookup])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedHistoryQuery(historyQuery.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [historyQuery])

  useEffect(() => setPage(1), [debouncedHistoryQuery, state, fromDate, toDate])

  useEffect(() => {
    if (!debouncedLookup) {
      setMatches([])
      setLookupLoading(false)
      return
    }
    if (publicPreview) {
      const query = debouncedLookup.toLowerCase()
      setMatches(
        demoMembers
          .filter((member) =>
            [member.code, member.name, member.email, member.phone]
              .join(' ')
              .toLowerCase()
              .includes(query),
          )
          .slice(0, 8)
          .map((member) => ({
            id: `demo:${member.code}`,
            member_code: member.code,
            member_name: member.name,
            is_active: member.status === 'Active',
          })),
      )
      setLookupLoading(false)
      return
    }

    const controller = new AbortController()
    setLookupLoading(true)
    void listMembers({ query: debouncedLookup, status: 'all', limit: 8, signal: controller.signal })
      .then((response) => setMatches(response.items.map(memberFromApi)))
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted)
          setError(loadError instanceof Error ? loadError.message : 'Unable to search members')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLookupLoading(false)
      })
    return () => controller.abort()
  }, [debouncedLookup, publicPreview])

  useEffect(() => {
    if (!selectedMember) {
      setAccess(null)
      return
    }
    if (publicPreview) {
      const member = demoMembers.find((item) => `demo:${item.code}` === selectedMember.id)
      const openVisit =
        syntheticVisits.find((item) => item.member_code === member?.code && item.is_open) ?? null
      const membership = demoMemberships.find((item) => item.memberCode === member?.code)
      const active = member?.status === 'Active' && Boolean(membership)
      setAccess({
        member_id: selectedMember.id,
        member_code: selectedMember.member_code,
        member_name: selectedMember.member_name,
        member_active: selectedMember.is_active,
        eligible: active && !openVisit,
        reason: !selectedMember.is_active
          ? 'Member account is inactive'
          : openVisit
            ? 'Member is already checked in'
            : active
              ? 'Access valid for check-in'
              : 'No active membership covers today',
        membership: membership
          ? {
              id: `demo:${membership.id}`,
              plan_code: membership.planCode,
              plan_name: membership.planName,
              start_date: membership.startsOn,
              end_date: membership.endsOn,
              status: membership.status.toLowerCase(),
            }
          : null,
        open_visit: openVisit,
      })
      setAccessLoading(false)
      return
    }

    const controller = new AbortController()
    setAccessLoading(true)
    setError(null)
    void getAttendanceAccess(selectedMember.id, controller.signal)
      .then(setAccess)
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted)
          setError(loadError instanceof Error ? loadError.message : 'Unable to validate access')
      })
      .finally(() => {
        if (!controller.signal.aborted) setAccessLoading(false)
      })
    return () => controller.abort()
  }, [publicPreview, refreshKey, selectedMember, syntheticVisits])

  useEffect(() => {
    if (publicPreview) {
      const query = debouncedHistoryQuery.toLowerCase()
      const filtered = syntheticVisits.filter((visit) => {
        const queryMatch =
          !query ||
          [visit.member_code, visit.member_name, visit.plan_code ?? '']
            .join(' ')
            .toLowerCase()
            .includes(query)
        const stateMatch = state === 'all' || (state === 'open' ? visit.is_open : !visit.is_open)
        const visitDate = visit.checked_in_at.slice(0, 10)
        const fromMatch = !fromDate || visitDate >= fromDate
        const toMatch = !toDate || visitDate <= toDate
        return queryMatch && stateMatch && fromMatch && toMatch
      })
      const offset = (page - 1) * PAGE_SIZE
      setRecords(filtered.slice(offset, offset + PAGE_SIZE))
      setTotal(filtered.length)
      setHistoryLoading(false)
      return
    }

    const controller = new AbortController()
    setHistoryLoading(true)
    setError(null)
    void listAttendance({
      query: debouncedHistoryQuery || undefined,
      state,
      from: fromDate || undefined,
      to: toDate || undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      signal: controller.signal,
    })
      .then((response) => {
        setRecords(response.items)
        setTotal(response.total)
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted)
          setError(loadError instanceof Error ? loadError.message : 'Unable to load attendance')
      })
      .finally(() => {
        if (!controller.signal.aborted) setHistoryLoading(false)
      })
    return () => controller.abort()
  }, [
    debouncedHistoryQuery,
    fromDate,
    page,
    publicPreview,
    refreshKey,
    state,
    syntheticVisits,
    toDate,
  ])

  async function performCheckIn() {
    if (!selectedMember || publicPreview) return
    setBusy(true)
    setError(null)
    try {
      await checkIn(selectedMember.id, notes.trim() || null)
      setNotes('')
      setRefreshKey((value) => value + 1)
    } catch (actionError: unknown) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to check member in')
    } finally {
      setBusy(false)
    }
  }

  async function performCheckOut() {
    if (!access?.open_visit || publicPreview) return
    setBusy(true)
    setError(null)
    try {
      await checkOut(access.open_visit.id)
      setRefreshKey((value) => value + 1)
    } catch (actionError: unknown) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to check member out')
    } finally {
      setBusy(false)
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const openOnPage = records.filter((item) => item.is_open).length

  return (
    <div className="page-stack attendance-page">
      <header className="page-heading attendance-page__heading">
        <div>
          <p className="page-eyebrow">Front desk operations</p>
          <h1>Attendance & Access</h1>
          <p>
            Validate today’s membership access, check members in or out, and keep a searchable visit
            ledger.
          </p>
        </div>
        {publicPreview ? (
          <Badge tone="accent">Read-only attendance preview</Badge>
        ) : (
          <Badge tone="success">Live access control</Badge>
        )}
      </header>

      <section className="attendance-metrics" aria-label="Attendance summary">
        <article>
          <DoorOpen size={18} aria-hidden="true" />
          <span>Open on page</span>
          <strong>{openOnPage}</strong>
        </article>
        <article>
          <UsersRound size={18} aria-hidden="true" />
          <span>Ledger results</span>
          <strong>{total}</strong>
        </article>
        <article>
          <Clock3 size={18} aria-hidden="true" />
          <span>Workflow</span>
          <strong>Access first</strong>
        </article>
      </section>

      {error && (
        <div className="workspace-alert" role="alert">
          {error}
        </div>
      )}

      <section className="attendance-frontdesk">
        <article className="data-card attendance-lookup-card">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Member lookup</p>
              <h2>Find the member before opening the gate.</h2>
            </div>
            <Search size={20} aria-hidden="true" />
          </div>
          <label className="search-field attendance-member-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search members for attendance</span>
            <input
              value={lookup}
              onChange={(event) => setLookup(event.target.value)}
              placeholder="Member code, name, phone or email"
              autoComplete="off"
            />
          </label>
          <div className="attendance-match-list" aria-live="polite">
            {lookupLoading && <p className="muted-copy">Searching members…</p>}
            {!lookupLoading && debouncedLookup && matches.length === 0 && (
              <p className="muted-copy">No matching members.</p>
            )}
            {matches.map((member) => (
              <button
                key={member.id}
                type="button"
                className={
                  selectedMember?.id === member.id
                    ? 'attendance-match attendance-match--selected'
                    : 'attendance-match'
                }
                onClick={() => setSelectedMember(member)}
              >
                <span>
                  <strong>{member.member_name}</strong>
                  <small>{member.member_code}</small>
                </span>
                <Badge tone={member.is_active ? 'success' : 'neutral'}>
                  {member.is_active ? 'Active member' : 'Inactive member'}
                </Badge>
              </button>
            ))}
          </div>
        </article>

        <article className="data-card attendance-access-card" aria-live="polite">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Access decision</p>
              <h2>{selectedMember ? selectedMember.member_name : 'Select a member'}</h2>
            </div>
            {access?.eligible ? (
              <ShieldCheck size={24} aria-hidden="true" />
            ) : (
              <ShieldX size={24} aria-hidden="true" />
            )}
          </div>
          {!selectedMember && (
            <p className="muted-copy">Search and select a member to validate access.</p>
          )}
          {accessLoading && <p className="muted-copy">Validating membership…</p>}
          {access && !accessLoading && (
            <>
              <div
                className={
                  access.eligible
                    ? 'access-decision access-decision--allow'
                    : 'access-decision access-decision--deny'
                }
              >
                <strong>{access.eligible ? 'Check-in allowed' : 'Check-in blocked'}</strong>
                <span>{access.reason}</span>
              </div>
              {access.membership && (
                <dl className="attendance-access-details">
                  <div>
                    <dt>Plan</dt>
                    <dd>
                      {access.membership.plan_name} · {access.membership.plan_code}
                    </dd>
                  </div>
                  <div>
                    <dt>Access term</dt>
                    <dd>
                      {access.membership.start_date} → {access.membership.end_date}
                    </dd>
                  </div>
                </dl>
              )}
              {access.open_visit ? (
                <div className="attendance-current-visit">
                  <span>Checked in {formatDateTime(access.open_visit.checked_in_at)}</span>
                  {!publicPreview && (
                    <Button
                      type="button"
                      variant="secondary"
                      icon={<LogOut size={16} aria-hidden="true" />}
                      disabled={busy}
                      onClick={performCheckOut}
                    >
                      {busy ? 'Updating…' : 'Check out'}
                    </Button>
                  )}
                </div>
              ) : access.eligible && !publicPreview ? (
                <div className="attendance-checkin-actions">
                  <label className="field">
                    <span className="field__label">
                      Visit note <small>(optional)</small>
                    </span>
                    <input
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      maxLength={1000}
                      placeholder="Front-desk note"
                    />
                  </label>
                  <Button
                    type="button"
                    icon={<LogIn size={16} aria-hidden="true" />}
                    disabled={busy}
                    onClick={performCheckIn}
                  >
                    {busy ? 'Checking in…' : 'Check in member'}
                  </Button>
                </div>
              ) : null}
              {publicPreview && (
                <p className="preview-note">
                  Preview mode shows the access decision but does not mutate attendance.
                </p>
              )}
            </>
          )}
        </article>
      </section>

      <section className="data-card attendance-ledger">
        <div className="data-card__header">
          <div>
            <p className="card-eyebrow">Visit ledger</p>
            <h2>Open visits and attendance history.</h2>
          </div>
          <Badge tone="neutral">{historyLoading ? 'Loading…' : `${total} results`}</Badge>
        </div>
        <div className="attendance-toolbar">
          <label className="search-field">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search attendance</span>
            <input
              value={historyQuery}
              onChange={(event) => setHistoryQuery(event.target.value)}
              placeholder="Search member"
              autoComplete="off"
            />
          </label>
          <label className="filter-field">
            <span>Visit state</span>
            <select
              value={state}
              onChange={(event) => setState(event.target.value as AttendanceState)}
            >
              <option value="all">All</option>
              <option value="open">In gym</option>
              <option value="closed">Checked out</option>
            </select>
          </label>
          <label className="filter-field">
            <span>From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>
          <label className="filter-field">
            <span>To</span>
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </label>
        </div>

        <div className="attendance-table-wrap" aria-live="polite">
          <table className="data-table attendance-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Check in</th>
                <th>Check out</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!historyLoading &&
                records.map((visit) => (
                  <tr key={visit.id}>
                    <td data-label="Member">
                      <strong>{visit.member_name}</strong>
                      <small>{visit.member_code}</small>
                    </td>
                    <td data-label="Plan">
                      {visit.plan_name ? (
                        <>
                          <strong>{visit.plan_name}</strong>
                          <small>{visit.plan_code}</small>
                        </>
                      ) : (
                        <span className="muted-copy">Legacy visit</span>
                      )}
                    </td>
                    <td data-label="Check in">{formatDateTime(visit.checked_in_at)}</td>
                    <td data-label="Check out">{formatDateTime(visit.checked_out_at)}</td>
                    <td data-label="Duration">{durationLabel(visit.duration_minutes)}</td>
                    <td data-label="Status">
                      <Badge tone={visit.is_open ? 'success' : 'neutral'}>
                        {visit.is_open ? 'In gym' : 'Completed'}
                      </Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!historyLoading && records.length === 0 && (
            <div className="empty-table-state">
              <CalendarDays size={22} aria-hidden="true" />
              <strong>No attendance visits match these filters.</strong>
            </div>
          )}
        </div>
        <div className="pagination-bar">
          <span>
            Page {page} of {pageCount}
          </span>
          <div>
            <Button
              type="button"
              variant="ghost"
              aria-label="Previous attendance page"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft size={16} aria-hidden="true" /> Previous
            </Button>
            <Button
              type="button"
              variant="ghost"
              aria-label="Next attendance page"
              disabled={page >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              Next <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
