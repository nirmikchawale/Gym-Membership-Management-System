import type {
  MemberInput,
  MemberListResponse,
  MemberRecord,
  MemberUpdateInput,
  PlanInput,
  PlanListResponse,
  PlanRecord,
  PlanUpdateInput,
} from './api'
import type { AttendanceAccess, AttendanceListResponse, AttendanceRecord } from './attendance-api'
import type { DashboardOverview } from './dashboard-api'
import type {
  MembershipInput,
  MembershipListResponse,
  MembershipRecord,
  MembershipRenewInput,
  MembershipStatus,
} from './memberships-api'
import { demoAttendance, demoMemberships, demoPlans } from './demo-data'
import { registeredDemoMembers } from './registered-demo-members'

export const DEMO_AS_OF_DATE = '2026-10-03'
const STORAGE_KEY = 'gridstone-interactive-demo-v1'
const CHANGE_EVENT = 'gridstone:demo-change'

type DemoRuntimeState = {
  members: MemberRecord[]
  plans: PlanRecord[]
  memberships: MembershipRecord[]
  attendance: AttendanceRecord[]
  sequence: number
}

function isBrowser() {
  return typeof window !== 'undefined'
}

export function isInteractiveDemoRuntime() {
  return import.meta.env.VITE_PUBLIC_PREVIEW === 'true'
}

function addDays(day: string, offset: number) {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

function nowIso(sequence = 0) {
  const base = new Date(`${DEMO_AS_OF_DATE}T12:00:00+05:30`)
  base.setMinutes(base.getMinutes() + sequence)
  return base.toISOString()
}

function splitName(name: string) {
  const [firstName, ...lastParts] = name.trim().split(/\s+/)
  return { firstName: firstName || 'Demo', lastName: lastParts.join(' ') || 'Member' }
}

function durationDays(plan: PlanRecord) {
  return Math.max(1, plan.duration_days)
}

function baselinePlans(): PlanRecord[] {
  return demoPlans.map((plan, index) => ({
    id: `demo-plan:${plan.code}`,
    code: plan.code,
    name: plan.name,
    description: plan.description,
    duration_days: Number.parseInt(plan.duration, 10),
    price: plan.price.toFixed(2),
    currency: 'INR',
    is_active: plan.availability === 'Active',
    created_at: `2026-01-${String(index + 2).padStart(2, '0')}T00:00:00Z`,
    updated_at: `2026-01-${String(index + 2).padStart(2, '0')}T00:00:00Z`,
  }))
}

function baselineMembers(): MemberRecord[] {
  return registeredDemoMembers.map((member, index) => {
    const { firstName, lastName } = splitName(member.name)
    return {
      id: `demo-member:${member.code}`,
      member_code: member.code,
      first_name: firstName,
      last_name: lastName,
      email: member.email,
      phone: member.phone,
      date_of_birth: addDays('1990-01-01', (index * 97) % 3650),
      joined_on: member.joinedOn,
      is_active: member.status === 'Active',
      created_at: `${member.joinedOn}T00:00:00Z`,
      updated_at: `${member.joinedOn}T00:00:00Z`,
    }
  })
}

function statusForGeneratedMember(index: number, memberActive: boolean): MembershipStatus | null {
  if (index % 37 === 0) return null
  if (!memberActive) return 'frozen'
  if (index % 29 === 0) return 'cancelled'
  if (index % 23 === 0) return 'expired'
  if (index % 19 === 0) return 'scheduled'
  return 'active'
}

function baselineMemberships(members: MemberRecord[], plans: PlanRecord[]) {
  const records: MembershipRecord[] = []

  demoMemberships.forEach((membership, index) => {
    const member = members.find((item) => item.member_code === membership.memberCode)
    const plan = plans.find((item) => item.code === membership.planCode)
    if (!member || !plan) return
    const previous = records
      .filter((item) => item.member_id === member.id)
      .sort((left, right) => right.end_date.localeCompare(left.end_date))[0]
    const status: MembershipStatus =
      membership.status === 'Scheduled' ? 'scheduled' : member.is_active ? 'active' : 'frozen'
    records.push({
      id: `demo-membership:${membership.id}`,
      member_id: member.id,
      member_code: member.member_code,
      member_name: `${member.first_name} ${member.last_name}`.trim(),
      plan_id: plan.id,
      plan_code: plan.code,
      plan_name: plan.name,
      renewed_from_membership_id: membership.status === 'Scheduled' ? (previous?.id ?? null) : null,
      start_date: membership.startsOn,
      end_date: membership.endsOn,
      status,
      price_amount: membership.value.toFixed(2),
      currency: 'INR',
      notes: index === 0 ? 'Synthetic baseline membership' : null,
      created_at: `${membership.startsOn}T00:00:00Z`,
      updated_at: `${membership.startsOn}T00:00:00Z`,
    })
  })

  members.slice(12).forEach((member, index) => {
    const plan = plans[index % plans.length]
    const status = statusForGeneratedMember(index, member.is_active)
    if (!plan || status === null) return

    const duration = durationDays(plan)
    let startDate: string
    let endDate: string
    if (status === 'scheduled') {
      startDate = addDays(DEMO_AS_OF_DATE, 5 + (index % 18))
      endDate = addDays(startDate, duration - 1)
    } else if (status === 'expired') {
      endDate = addDays(DEMO_AS_OF_DATE, -(5 + (index % 50)))
      startDate = addDays(endDate, -(duration - 1))
    } else {
      endDate = addDays(DEMO_AS_OF_DATE, 15 + ((index * 7) % 300))
      startDate = addDays(endDate, -(duration - 1))
    }

    const original: MembershipRecord = {
      id: `demo-membership:AUTO-${String(index + 1).padStart(3, '0')}`,
      member_id: member.id,
      member_code: member.member_code,
      member_name: `${member.first_name} ${member.last_name}`.trim(),
      plan_id: plan.id,
      plan_code: plan.code,
      plan_name: plan.name,
      renewed_from_membership_id: null,
      start_date: startDate,
      end_date: endDate,
      status,
      price_amount: plan.price,
      currency: plan.currency,
      notes: index % 11 === 0 ? 'Deterministic synthetic lifecycle example' : null,
      created_at: `${startDate}T00:00:00Z`,
      updated_at: `${startDate}T00:00:00Z`,
    }
    records.push(original)

    if (status === 'active' && index % 16 === 0) {
      const renewalStart = addDays(endDate, 1)
      records.push({
        ...original,
        id: `demo-membership:RN-${String(index + 1).padStart(3, '0')}`,
        renewed_from_membership_id: original.id,
        start_date: renewalStart,
        end_date: addDays(renewalStart, duration - 1),
        status: 'scheduled',
        notes: 'Scheduled synthetic renewal',
        created_at: `${DEMO_AS_OF_DATE}T08:00:00Z`,
        updated_at: `${DEMO_AS_OF_DATE}T08:00:00Z`,
      })
    }
  })

  return records
}

function visitDurationMinutes(checkIn: string, checkOut: string | null) {
  if (!checkOut) return null
  return Math.max(
    0,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000),
  )
}

function latestMembershipForMember(memberships: MembershipRecord[], memberId: string) {
  return memberships
    .filter((membership) => membership.member_id === memberId)
    .sort((left, right) => right.start_date.localeCompare(left.start_date))[0]
}

function baselineAttendance(members: MemberRecord[], memberships: MembershipRecord[]) {
  const records: AttendanceRecord[] = []

  demoAttendance.forEach((visit) => {
    const member = members.find((item) => item.member_code === visit.memberCode)
    if (!member) return
    const membership = latestMembershipForMember(memberships, member.id)
    const checkedIn = `${visit.date}T${visit.checkIn}:00+05:30`
    const checkedOut = visit.checkOut ? `${visit.date}T${visit.checkOut}:00+05:30` : null
    records.push({
      id: `demo-attendance:${visit.id}`,
      member_id: member.id,
      member_code: member.member_code,
      member_name: `${member.first_name} ${member.last_name}`.trim(),
      membership_id: membership?.id ?? null,
      plan_code: membership?.plan_code ?? null,
      plan_name: membership?.plan_name ?? null,
      checked_in_at: checkedIn,
      checked_out_at: checkedOut,
      is_open: checkedOut === null,
      duration_minutes: visitDurationMinutes(checkedIn, checkedOut),
      notes: null,
      created_at: checkedIn,
      updated_at: checkedOut ?? checkedIn,
    })
  })

  members.slice(12).forEach((member, index) => {
    const membership = latestMembershipForMember(memberships, member.id)
    if (!membership) return
    const visits = index % 4 === 0 ? 3 : 2
    for (let visitIndex = 0; visitIndex < visits; visitIndex += 1) {
      const dayOffset = -((index * 3 + visitIndex * 5) % 30)
      const date = addDays(DEMO_AS_OF_DATE, dayOffset)
      const hour = 6 + ((index + visitIndex * 2) % 12)
      const minute = (index * 7 + visitIndex * 13) % 60
      const duration = 45 + ((index * 11 + visitIndex * 17) % 70)
      const checkedIn = `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+05:30`
      const checkoutDate = new Date(checkedIn)
      checkoutDate.setMinutes(checkoutDate.getMinutes() + duration)
      const checkedOut = checkoutDate.toISOString()
      records.push({
        id: `demo-attendance:AUTO-${String(index + 1).padStart(3, '0')}-${visitIndex + 1}`,
        member_id: member.id,
        member_code: member.member_code,
        member_name: `${member.first_name} ${member.last_name}`.trim(),
        membership_id: membership.id,
        plan_code: membership.plan_code,
        plan_name: membership.plan_name,
        checked_in_at: checkedIn,
        checked_out_at: checkedOut,
        is_open: false,
        duration_minutes: duration,
        notes: visitIndex === 0 && index % 13 === 0 ? 'Synthetic morning visit' : null,
        created_at: checkedIn,
        updated_at: checkedOut,
      })
    }

    const eligibleNow =
      member.is_active &&
      membership.status === 'active' &&
      membership.start_date <= DEMO_AS_OF_DATE &&
      membership.end_date >= DEMO_AS_OF_DATE
    const alreadyOpen = records.some((visit) => visit.member_id === member.id && visit.is_open)
    if (eligibleNow && index % 21 === 0 && !alreadyOpen) {
      const checkedIn = `${DEMO_AS_OF_DATE}T${String(8 + (index % 5)).padStart(2, '0')}:15:00+05:30`
      records.push({
        id: `demo-attendance:OPEN-${String(index + 1).padStart(3, '0')}`,
        member_id: member.id,
        member_code: member.member_code,
        member_name: `${member.first_name} ${member.last_name}`.trim(),
        membership_id: membership.id,
        plan_code: membership.plan_code,
        plan_name: membership.plan_name,
        checked_in_at: checkedIn,
        checked_out_at: null,
        is_open: true,
        duration_minutes: null,
        notes: 'Synthetic open visit',
        created_at: checkedIn,
        updated_at: checkedIn,
      })
    }
  })

  return records.sort((left, right) => right.checked_in_at.localeCompare(left.checked_in_at))
}

function buildBaselineState(): DemoRuntimeState {
  const plans = baselinePlans()
  const members = baselineMembers()
  const memberships = baselineMemberships(members, plans)
  return {
    members,
    plans,
    memberships,
    attendance: baselineAttendance(members, memberships),
    sequence: 1000,
  }
}

let memoryState: DemoRuntimeState | null = null

function loadState(): DemoRuntimeState {
  if (memoryState) return memoryState
  if (isBrowser()) {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        memoryState = JSON.parse(raw) as DemoRuntimeState
        return memoryState
      }
    } catch {
      // Fall back to deterministic in-memory state when session storage is unavailable.
    }
  }
  memoryState = buildBaselineState()
  persistState(memoryState)
  return memoryState
}

function persistState(state: DemoRuntimeState) {
  memoryState = state
  if (isBrowser()) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
    } catch {
      // Demo remains functional in memory if storage is disabled.
    }
  }
}

function updateState(mutator: (state: DemoRuntimeState) => void) {
  const state = structuredClone(loadState())
  mutator(state)
  persistState(state)
  return state
}

function normalized(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function nextId(state: DemoRuntimeState, prefix: string) {
  state.sequence += 1
  return `demo-${prefix}:${state.sequence}`
}

function uniqueMemberCode(state: DemoRuntimeState) {
  let number = 2000 + state.sequence
  while (state.members.some((member) => member.member_code === `GST-${number}`)) number += 1
  return `GST-${number}`
}

function dateForMembershipEnd(startDate: string, plan: PlanRecord) {
  return addDays(startDate, durationDays(plan) - 1)
}

function currentCoverage(state: DemoRuntimeState, memberId: string) {
  return state.memberships
    .filter(
      (membership) =>
        membership.member_id === memberId &&
        membership.status === 'active' &&
        membership.start_date <= DEMO_AS_OF_DATE &&
        membership.end_date >= DEMO_AS_OF_DATE,
    )
    .sort((left, right) => right.end_date.localeCompare(left.end_date))[0]
}

export function resetInteractiveDemo() {
  memoryState = buildBaselineState()
  persistState(memoryState)
}

export function onInteractiveDemoChange(listener: () => void) {
  if (!isBrowser()) return () => undefined
  window.addEventListener(CHANGE_EVENT, listener)
  return () => window.removeEventListener(CHANGE_EVENT, listener)
}

export function demoListMembers({
  query,
  status = 'all',
  limit = 20,
  offset = 0,
}: {
  query?: string
  status?: 'all' | 'active' | 'inactive'
  limit?: number
  offset?: number
} = {}): MemberListResponse {
  const state = loadState()
  const search = normalized(query)
  const items = state.members.filter((member) => {
    const statusMatch =
      status === 'all' || (status === 'active' ? member.is_active : !member.is_active)
    const searchMatch =
      !search ||
      [member.member_code, member.first_name, member.last_name, member.email, member.phone]
        .map(normalized)
        .join(' ')
        .includes(search)
    return statusMatch && searchMatch
  })
  return { items: items.slice(offset, offset + limit), total: items.length, limit, offset }
}

export function demoCreateMember(payload: MemberInput): MemberRecord {
  let created!: MemberRecord
  updateState((state) => {
    const memberCode = payload.member_code?.trim() || uniqueMemberCode(state)
    if (
      state.members.some((member) => member.member_code.toLowerCase() === memberCode.toLowerCase())
    ) {
      throw new Error('Member code already exists in the demo sandbox')
    }
    const id = nextId(state, 'member')
    const timestamp = nowIso(state.sequence)
    created = {
      id,
      member_code: memberCode,
      first_name: payload.first_name.trim(),
      last_name: payload.last_name.trim(),
      email: payload.email?.trim() || null,
      phone: payload.phone?.trim() || null,
      date_of_birth: payload.date_of_birth || null,
      joined_on: payload.joined_on || DEMO_AS_OF_DATE,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    }
    state.members.unshift(created)
  })
  return created
}

export function demoUpdateMember(memberId: string, payload: MemberUpdateInput): MemberRecord {
  let updated!: MemberRecord
  updateState((state) => {
    const member = state.members.find((item) => item.id === memberId)
    if (!member) throw new Error('Demo member not found')
    const nextCode = payload.member_code?.trim() || member.member_code
    if (
      state.members.some(
        (item) => item.id !== memberId && item.member_code.toLowerCase() === nextCode.toLowerCase(),
      )
    ) {
      throw new Error('Member code already exists in the demo sandbox')
    }
    Object.assign(member, {
      member_code: nextCode,
      first_name: payload.first_name?.trim() ?? member.first_name,
      last_name: payload.last_name?.trim() ?? member.last_name,
      email: payload.email === undefined ? member.email : payload.email?.trim() || null,
      phone: payload.phone === undefined ? member.phone : payload.phone?.trim() || null,
      date_of_birth:
        payload.date_of_birth === undefined ? member.date_of_birth : payload.date_of_birth || null,
      joined_on: payload.joined_on ?? member.joined_on,
      updated_at: nowIso(state.sequence),
    })
    const memberName = `${member.first_name} ${member.last_name}`.trim()
    state.memberships
      .filter((item) => item.member_id === memberId)
      .forEach((item) => {
        item.member_code = member.member_code
        item.member_name = memberName
      })
    state.attendance
      .filter((item) => item.member_id === memberId)
      .forEach((item) => {
        item.member_code = member.member_code
        item.member_name = memberName
      })
    updated = { ...member }
  })
  return updated
}

export function demoSetMemberActive(memberId: string, isActive: boolean): MemberRecord {
  let updated!: MemberRecord
  updateState((state) => {
    const member = state.members.find((item) => item.id === memberId)
    if (!member) throw new Error('Demo member not found')
    member.is_active = isActive
    member.updated_at = nowIso(state.sequence)
    updated = { ...member }
  })
  return updated
}

export function demoListPlans({
  query,
  status = 'all',
  limit = 20,
  offset = 0,
}: {
  query?: string
  status?: 'all' | 'active' | 'inactive'
  limit?: number
  offset?: number
} = {}): PlanListResponse {
  const state = loadState()
  const search = normalized(query)
  const items = state.plans.filter((plan) => {
    const statusMatch = status === 'all' || (status === 'active' ? plan.is_active : !plan.is_active)
    const searchMatch =
      !search ||
      [plan.code, plan.name, plan.description, String(plan.duration_days)]
        .map(normalized)
        .join(' ')
        .includes(search)
    return statusMatch && searchMatch
  })
  return { items: items.slice(offset, offset + limit), total: items.length, limit, offset }
}

export function demoCreatePlan(payload: PlanInput): PlanRecord {
  let created!: PlanRecord
  updateState((state) => {
    if (state.plans.some((plan) => plan.code.toLowerCase() === payload.code.trim().toLowerCase())) {
      throw new Error('Plan code already exists in the demo sandbox')
    }
    const timestamp = nowIso(state.sequence)
    created = {
      id: nextId(state, 'plan'),
      code: payload.code.trim(),
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      duration_days: payload.duration_days,
      price: Number(payload.price).toFixed(2),
      currency: (payload.currency || 'INR').toUpperCase(),
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    }
    state.plans.unshift(created)
  })
  return created
}

export function demoUpdatePlan(planId: string, payload: PlanUpdateInput): PlanRecord {
  let updated!: PlanRecord
  updateState((state) => {
    const plan = state.plans.find((item) => item.id === planId)
    if (!plan) throw new Error('Demo plan not found')
    const nextCode = payload.code?.trim() || plan.code
    if (
      state.plans.some(
        (item) => item.id !== planId && item.code.toLowerCase() === nextCode.toLowerCase(),
      )
    ) {
      throw new Error('Plan code already exists in the demo sandbox')
    }
    plan.code = nextCode
    plan.name = payload.name?.trim() ?? plan.name
    plan.description =
      payload.description === undefined ? plan.description : payload.description?.trim() || null
    plan.duration_days = payload.duration_days ?? plan.duration_days
    plan.price = payload.price === undefined ? plan.price : Number(payload.price).toFixed(2)
    plan.currency = payload.currency?.toUpperCase() ?? plan.currency
    plan.updated_at = nowIso(state.sequence)
    state.memberships
      .filter((membership) => membership.plan_id === planId)
      .forEach((membership) => {
        membership.plan_code = plan.code
        membership.plan_name = plan.name
      })
    state.attendance
      .filter(
        (visit) =>
          visit.membership_id &&
          state.memberships.find((item) => item.id === visit.membership_id)?.plan_id === planId,
      )
      .forEach((visit) => {
        visit.plan_code = plan.code
        visit.plan_name = plan.name
      })
    updated = { ...plan }
  })
  return updated
}

export function demoSetPlanActive(planId: string, isActive: boolean): PlanRecord {
  let updated!: PlanRecord
  updateState((state) => {
    const plan = state.plans.find((item) => item.id === planId)
    if (!plan) throw new Error('Demo plan not found')
    plan.is_active = isActive
    plan.updated_at = nowIso(state.sequence)
    updated = { ...plan }
  })
  return updated
}

export function demoListMemberships({
  query,
  status = 'all',
  memberId,
  limit = 20,
  offset = 0,
}: {
  query?: string
  status?: MembershipStatus | 'all'
  memberId?: string
  limit?: number
  offset?: number
} = {}): MembershipListResponse {
  const state = loadState()
  const search = normalized(query)
  const items = state.memberships
    .filter((membership) => {
      const statusMatch = status === 'all' || membership.status === status
      const memberMatch = !memberId || membership.member_id === memberId
      const searchMatch =
        !search ||
        [membership.member_code, membership.member_name, membership.plan_code, membership.plan_name]
          .map(normalized)
          .join(' ')
          .includes(search)
      return statusMatch && memberMatch && searchMatch
    })
    .sort((left, right) => right.start_date.localeCompare(left.start_date))
  return { items: items.slice(offset, offset + limit), total: items.length, limit, offset }
}

export function demoCreateMembership(payload: MembershipInput): MembershipRecord {
  let created!: MembershipRecord
  updateState((state) => {
    const member = state.members.find((item) => item.id === payload.member_id)
    const plan = state.plans.find((item) => item.id === payload.plan_id)
    if (!member?.is_active) throw new Error('Select an active demo member')
    if (!plan?.is_active) throw new Error('Select an active demo plan')
    const latest = state.memberships
      .filter((item) => item.member_id === member.id && item.status !== 'cancelled')
      .sort((left, right) => right.end_date.localeCompare(left.end_date))[0]
    const requested = payload.start_date || null
    const startDate =
      requested ||
      (latest && latest.end_date >= DEMO_AS_OF_DATE ? addDays(latest.end_date, 1) : DEMO_AS_OF_DATE)
    const timestamp = nowIso(state.sequence)
    created = {
      id: nextId(state, 'membership'),
      member_id: member.id,
      member_code: member.member_code,
      member_name: `${member.first_name} ${member.last_name}`.trim(),
      plan_id: plan.id,
      plan_code: plan.code,
      plan_name: plan.name,
      renewed_from_membership_id: null,
      start_date: startDate,
      end_date: dateForMembershipEnd(startDate, plan),
      status: startDate > DEMO_AS_OF_DATE ? 'scheduled' : 'active',
      price_amount: plan.price,
      currency: plan.currency,
      notes: payload.notes?.trim() || null,
      created_at: timestamp,
      updated_at: timestamp,
    }
    state.memberships.unshift(created)
  })
  return created
}

export function demoRenewMembership(
  membershipId: string,
  payload: MembershipRenewInput,
): MembershipRecord {
  let created!: MembershipRecord
  updateState((state) => {
    const source = state.memberships.find((item) => item.id === membershipId)
    if (!source) throw new Error('Demo membership not found')
    const plan = state.plans.find((item) => item.id === (payload.plan_id || source.plan_id))
    if (!plan?.is_active) throw new Error('Select an active demo plan')
    const startDate = payload.start_date || addDays(source.end_date, 1)
    const timestamp = nowIso(state.sequence)
    created = {
      id: nextId(state, 'membership'),
      member_id: source.member_id,
      member_code: source.member_code,
      member_name: source.member_name,
      plan_id: plan.id,
      plan_code: plan.code,
      plan_name: plan.name,
      renewed_from_membership_id: source.id,
      start_date: startDate,
      end_date: dateForMembershipEnd(startDate, plan),
      status: startDate > DEMO_AS_OF_DATE ? 'scheduled' : 'active',
      price_amount: plan.price,
      currency: plan.currency,
      notes: payload.notes?.trim() || 'Synthetic renewal',
      created_at: timestamp,
      updated_at: timestamp,
    }
    state.memberships.unshift(created)
  })
  return created
}

export function demoTransitionMembership(
  membershipId: string,
  action: 'cancel' | 'freeze' | 'resume',
): MembershipRecord {
  let updated!: MembershipRecord
  updateState((state) => {
    const membership = state.memberships.find((item) => item.id === membershipId)
    if (!membership) throw new Error('Demo membership not found')
    if (action === 'freeze') {
      if (membership.status !== 'active') throw new Error('Only active memberships can be frozen')
      membership.status = 'frozen'
    } else if (action === 'resume') {
      if (membership.status !== 'frozen') throw new Error('Only frozen memberships can be resumed')
      membership.status = 'active'
    } else {
      if (['cancelled', 'expired'].includes(membership.status))
        throw new Error('Membership is already closed')
      membership.status = 'cancelled'
    }
    membership.updated_at = nowIso(state.sequence)
    updated = { ...membership }
  })
  return updated
}

export function demoListAttendance({
  query,
  state: visitState = 'all',
  from,
  to,
  limit = 25,
  offset = 0,
}: {
  query?: string
  state?: 'all' | 'open' | 'closed'
  from?: string
  to?: string
  limit?: number
  offset?: number
} = {}): AttendanceListResponse {
  const state = loadState()
  const search = normalized(query)
  const items = state.attendance.filter((visit) => {
    const searchMatch =
      !search ||
      [visit.member_code, visit.member_name, visit.plan_code, visit.plan_name]
        .map(normalized)
        .join(' ')
        .includes(search)
    const stateMatch =
      visitState === 'all' || (visitState === 'open' ? visit.is_open : !visit.is_open)
    const day = visit.checked_in_at.slice(0, 10)
    const fromMatch = !from || day >= from
    const toMatch = !to || day <= to
    return searchMatch && stateMatch && fromMatch && toMatch
  })
  return { items: items.slice(offset, offset + limit), total: items.length, limit, offset }
}

export function demoAttendanceAccess(memberId: string): AttendanceAccess {
  const state = loadState()
  const member = state.members.find((item) => item.id === memberId)
  if (!member) throw new Error('Demo member not found')
  const openVisit =
    state.attendance.find((visit) => visit.member_id === memberId && visit.is_open) ?? null
  const membership = currentCoverage(state, memberId)
  const eligible = member.is_active && Boolean(membership) && !openVisit
  const reason = !member.is_active
    ? 'Member account is inactive'
    : openVisit
      ? 'Member is already checked in'
      : membership
        ? 'Access valid for check-in'
        : 'No active membership covers today'
  return {
    member_id: member.id,
    member_code: member.member_code,
    member_name: `${member.first_name} ${member.last_name}`.trim(),
    member_active: member.is_active,
    eligible,
    reason,
    membership: membership
      ? {
          id: membership.id,
          plan_code: membership.plan_code,
          plan_name: membership.plan_name,
          start_date: membership.start_date,
          end_date: membership.end_date,
          status: membership.status,
        }
      : null,
    open_visit: openVisit,
  }
}

export function demoCheckIn(memberId: string, notes?: string | null): AttendanceRecord {
  let created!: AttendanceRecord
  updateState((state) => {
    const member = state.members.find((item) => item.id === memberId)
    if (!member) throw new Error('Demo member not found')
    if (!member.is_active) throw new Error('Member account is inactive')
    if (state.attendance.some((visit) => visit.member_id === memberId && visit.is_open)) {
      throw new Error('Member is already checked in')
    }
    const membership = currentCoverage(state, memberId)
    if (!membership) throw new Error('No active membership covers today')
    const checkedIn = nowIso(state.sequence)
    created = {
      id: nextId(state, 'attendance'),
      member_id: member.id,
      member_code: member.member_code,
      member_name: `${member.first_name} ${member.last_name}`.trim(),
      membership_id: membership.id,
      plan_code: membership.plan_code,
      plan_name: membership.plan_name,
      checked_in_at: checkedIn,
      checked_out_at: null,
      is_open: true,
      duration_minutes: null,
      notes: notes?.trim() || null,
      created_at: checkedIn,
      updated_at: checkedIn,
    }
    state.attendance.unshift(created)
  })
  return created
}

export function demoCheckOut(attendanceId: string): AttendanceRecord {
  let updated!: AttendanceRecord
  updateState((state) => {
    const visit = state.attendance.find((item) => item.id === attendanceId)
    if (!visit?.is_open) throw new Error('Open demo visit not found')
    const checkedOut = nowIso(state.sequence + 75)
    visit.checked_out_at = checkedOut
    visit.is_open = false
    visit.duration_minutes = visitDurationMinutes(visit.checked_in_at, checkedOut)
    visit.updated_at = checkedOut
    updated = { ...visit }
  })
  return updated
}

export function getInteractiveDemoDashboard(
  trendDays: 7 | 14 | 30 = 7,
  expiringDays: 30 | 60 | 90 = 30,
): DashboardOverview {
  const state = loadState()
  const memberships = state.memberships
  const attendanceTrend = Array.from({ length: trendDays }, (_, index) => {
    const date = addDays(DEMO_AS_OF_DATE, index - (trendDays - 1))
    return {
      date,
      checkins: state.attendance.filter((visit) => visit.checked_in_at.slice(0, 10) === date)
        .length,
    }
  })

  const expiring = memberships
    .filter((membership) => membership.status === 'active')
    .map((membership) => ({
      membership,
      daysRemaining: Math.round(
        (new Date(`${membership.end_date}T00:00:00Z`).getTime() -
          new Date(`${DEMO_AS_OF_DATE}T00:00:00Z`).getTime()) /
          86_400_000,
      ),
    }))
    .filter(({ daysRemaining }) => daysRemaining >= 0 && daysRemaining <= expiringDays)
    .sort((left, right) => left.daysRemaining - right.daysRemaining)
    .slice(0, 12)

  const distribution = new Map<string, { plan: PlanRecord; count: number }>()
  memberships
    .filter((membership) => ['active', 'scheduled', 'frozen'].includes(membership.status))
    .forEach((membership) => {
      const plan = state.plans.find((item) => item.id === membership.plan_id)
      if (!plan) return
      const current = distribution.get(plan.id)
      distribution.set(plan.id, { plan, count: (current?.count ?? 0) + 1 })
    })

  return {
    as_of: DEMO_AS_OF_DATE,
    trend_days: trendDays,
    expiring_within_days: expiringDays,
    members: {
      total: state.members.length,
      active: state.members.filter((member) => member.is_active).length,
      inactive: state.members.filter((member) => !member.is_active).length,
    },
    memberships: {
      total: memberships.length,
      scheduled: memberships.filter((membership) => membership.status === 'scheduled').length,
      active: memberships.filter((membership) => membership.status === 'active').length,
      frozen: memberships.filter((membership) => membership.status === 'frozen').length,
      expired: memberships.filter((membership) => membership.status === 'expired').length,
      cancelled: memberships.filter((membership) => membership.status === 'cancelled').length,
      renewals: memberships.filter((membership) => membership.renewed_from_membership_id !== null)
        .length,
    },
    attendance: {
      open_visits: state.attendance.filter((visit) => visit.is_open).length,
      today_checkins: state.attendance.filter(
        (visit) => visit.checked_in_at.slice(0, 10) === DEMO_AS_OF_DATE,
      ).length,
      period_checkins: attendanceTrend.reduce((sum, item) => sum + item.checkins, 0),
    },
    expiring_soon: expiring.map(({ membership, daysRemaining }) => ({
      membership_id: membership.id,
      member_id: membership.member_id,
      member_code: membership.member_code,
      member_name: membership.member_name,
      plan_code: membership.plan_code,
      plan_name: membership.plan_name,
      end_date: membership.end_date,
      days_remaining: daysRemaining,
    })),
    attendance_trend: attendanceTrend,
    plan_distribution: [...distribution.values()]
      .sort(
        (left, right) => right.count - left.count || left.plan.code.localeCompare(right.plan.code),
      )
      .map(({ plan, count }) => ({
        plan_id: plan.id,
        plan_code: plan.code,
        plan_name: plan.name,
        memberships: count,
      })),
  }
}

export function getDemoPlanMemberCount(planId: string) {
  return loadState().memberships.filter(
    (membership) =>
      membership.plan_id === planId &&
      ['active', 'scheduled', 'frozen'].includes(membership.status),
  ).length
}

export function getDemoStateSnapshot() {
  return structuredClone(loadState())
}
