import { demoAttendance, demoMembers, demoMemberships } from './demo-data'
import type { DashboardOverview } from './dashboard-api'

const PREVIEW_AS_OF = '2026-10-02'

function isoDayOffset(day: string, offset: number) {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

export function getPreviewDashboard(
  trendDays: 7 | 14 | 30 = 7,
  expiringDays: 30 | 60 | 90 = 30,
): DashboardOverview {
  const memberActive = demoMembers.filter((member) => member.status === 'Active').length
  const activeMemberships = demoMemberships.filter((membership) =>
    ['Active', 'Expiring'].includes(membership.status),
  )
  const scheduledMemberships = demoMemberships.filter(
    (membership) => membership.status === 'Scheduled',
  )
  const openVisits = demoAttendance.filter((visit) => visit.checkOut === null)
  const attendanceTrend = Array.from({ length: trendDays }, (_, index) => {
    const date = isoDayOffset(PREVIEW_AS_OF, index - (trendDays - 1))
    return {
      date,
      checkins: demoAttendance.filter((visit) => visit.date === date).length,
    }
  })
  const planCounts = new Map<string, { name: string; count: number }>()
  demoMemberships
    .filter((membership) => ['Active', 'Expiring', 'Scheduled'].includes(membership.status))
    .forEach((membership) => {
      const current = planCounts.get(membership.planCode)
      planCounts.set(membership.planCode, {
        name: membership.planName,
        count: (current?.count ?? 0) + 1,
      })
    })

  const asOfTime = new Date(`${PREVIEW_AS_OF}T00:00:00Z`).getTime()
  const expiring = activeMemberships
    .map((membership) => ({
      membership,
      daysRemaining: Math.round(
        (new Date(`${membership.endsOn}T00:00:00Z`).getTime() - asOfTime) / 86_400_000,
      ),
    }))
    .filter(({ daysRemaining }) => daysRemaining >= 0 && daysRemaining <= expiringDays)
    .sort((left, right) => left.daysRemaining - right.daysRemaining)
    .slice(0, 12)

  return {
    as_of: PREVIEW_AS_OF,
    trend_days: trendDays,
    expiring_within_days: expiringDays,
    members: {
      total: demoMembers.length,
      active: memberActive,
      inactive: demoMembers.length - memberActive,
    },
    memberships: {
      total: demoMemberships.length,
      scheduled: scheduledMemberships.length,
      active: activeMemberships.length,
      frozen: 0,
      expired: 0,
      cancelled: 0,
      renewals: 0,
    },
    attendance: {
      open_visits: openVisits.length,
      today_checkins: demoAttendance.filter((visit) => visit.date === PREVIEW_AS_OF).length,
      period_checkins: attendanceTrend.reduce((total, day) => total + day.checkins, 0),
    },
    expiring_soon: expiring.map(({ membership, daysRemaining }) => ({
      membership_id: `demo:${membership.id}`,
      member_id: `demo:${membership.memberCode}`,
      member_code: membership.memberCode,
      member_name: membership.memberName,
      plan_code: membership.planCode,
      plan_name: membership.planName,
      end_date: membership.endsOn,
      days_remaining: daysRemaining,
    })),
    attendance_trend: attendanceTrend,
    plan_distribution: [...planCounts.entries()]
      .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))
      .map(([code, data]) => ({
        plan_id: `demo:${code}`,
        plan_code: code,
        plan_name: data.name,
        memberships: data.count,
      })),
  }
}
