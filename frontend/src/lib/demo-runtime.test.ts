import { beforeEach, describe, expect, it } from 'vitest'
import {
  demoAttendanceAccess,
  demoCheckIn,
  demoCheckOut,
  demoCreateMember,
  demoListMembers,
  demoRenewMembership,
  demoSetMemberActive,
  demoUpdateMember,
  demoUpdatePlan,
  getDemoStateSnapshot,
  getInteractiveDemoDashboard,
  resetInteractiveDemo,
} from './demo-runtime'

describe('interactive demo runtime', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    resetInteractiveDemo()
  })

  it('starts with a complete deterministic cross-feature dataset', () => {
    const state = getDemoStateSnapshot()
    const dashboard = getInteractiveDemoDashboard(30, 90)

    expect(state.members).toHaveLength(112)
    expect(state.plans.length).toBeGreaterThanOrEqual(4)
    expect(state.memberships.length).toBeGreaterThan(80)
    expect(state.attendance.length).toBeGreaterThan(150)
    expect(new Set(state.memberships.map((item) => item.status))).toEqual(
      new Set(['active', 'scheduled', 'frozen', 'expired', 'cancelled']),
    )
    expect(state.memberships.some((item) => item.renewed_from_membership_id !== null)).toBe(true)
    expect(state.attendance.some((item) => item.is_open)).toBe(true)
    expect(state.attendance.some((item) => !item.is_open)).toBe(true)
    expect(dashboard.members.total).toBe(state.members.length)
    expect(dashboard.memberships.total).toBe(state.memberships.length)
    expect(dashboard.attendance.open_visits).toBe(
      state.attendance.filter((item) => item.is_open).length,
    )
  })

  it('supports synthetic member creation, editing and activation controls', () => {
    const created = demoCreateMember({
      member_code: 'GST-DEMO-NEW',
      first_name: 'Demo',
      last_name: 'Operator',
      email: 'demo.operator@example.invalid',
      phone: '+91 90000 99999',
      joined_on: '2026-10-03',
    })

    const edited = demoUpdateMember(created.id, { first_name: 'Updated' })
    const inactive = demoSetMemberActive(created.id, false)
    const result = demoListMembers({ query: 'GST-DEMO-NEW' })

    expect(edited.first_name).toBe('Updated')
    expect(inactive.is_active).toBe(false)
    expect(result.total).toBe(1)
    expect(result.items[0]?.member_code).toBe('GST-DEMO-NEW')
    expect(getInteractiveDemoDashboard().members.total).toBe(113)
  })

  it('preserves historical membership prices when a plan catalogue price changes', () => {
    const before = getDemoStateSnapshot()
    const membership = before.memberships.find((item) => item.plan_id === before.plans[0]?.id)
    const plan = before.plans[0]

    expect(plan).toBeDefined()
    expect(membership).toBeDefined()

    const snapshotPrice = membership!.price_amount
    demoUpdatePlan(plan!.id, { price: '99999.00', name: `${plan!.name} Demo Edit` })

    const after = getDemoStateSnapshot()
    const sameMembership = after.memberships.find((item) => item.id === membership!.id)
    const editedPlan = after.plans.find((item) => item.id === plan!.id)

    expect(editedPlan?.price).toBe('99999.00')
    expect(sameMembership?.price_amount).toBe(snapshotPrice)
    expect(sameMembership?.plan_name).toBe(`${plan!.name} Demo Edit`)
  })

  it('creates traceable synthetic renewals', () => {
    const source = getDemoStateSnapshot().memberships.find((item) => item.status === 'active')
    expect(source).toBeDefined()

    const renewal = demoRenewMembership(source!.id, {})

    expect(renewal.renewed_from_membership_id).toBe(source!.id)
    expect(renewal.start_date > source!.end_date).toBe(true)
    expect(getInteractiveDemoDashboard().memberships.renewals).toBeGreaterThan(0)
  })

  it('supports access validation, check-in and check-out using the same demo ledger', () => {
    const state = getDemoStateSnapshot()
    const eligibleMember = state.members.find((member) => {
      try {
        return demoAttendanceAccess(member.id).eligible
      } catch {
        return false
      }
    })

    expect(eligibleMember).toBeDefined()

    const beforeOpen = getInteractiveDemoDashboard().attendance.open_visits
    const visit = demoCheckIn(eligibleMember!.id, 'Interactive demo visit')
    const duringAccess = demoAttendanceAccess(eligibleMember!.id)

    expect(visit.is_open).toBe(true)
    expect(duringAccess.eligible).toBe(false)
    expect(duringAccess.open_visit?.id).toBe(visit.id)
    expect(getInteractiveDemoDashboard().attendance.open_visits).toBe(beforeOpen + 1)

    const closed = demoCheckOut(visit.id)
    const afterAccess = demoAttendanceAccess(eligibleMember!.id)

    expect(closed.is_open).toBe(false)
    expect(closed.checked_out_at).not.toBeNull()
    expect(afterAccess.open_visit).toBeNull()
    expect(getInteractiveDemoDashboard().attendance.open_visits).toBe(beforeOpen)
  })

  it('restores the deterministic baseline after reset', () => {
    demoCreateMember({
      first_name: 'Temporary',
      last_name: 'Demo',
      joined_on: '2026-10-03',
    })
    expect(getInteractiveDemoDashboard().members.total).toBe(113)

    resetInteractiveDemo()

    expect(getInteractiveDemoDashboard().members.total).toBe(112)
    expect(demoListMembers({ query: 'Temporary Demo' }).total).toBe(0)
  })
})
