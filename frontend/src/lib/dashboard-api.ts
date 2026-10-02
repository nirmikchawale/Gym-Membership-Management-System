export type DashboardOverview = {
  as_of: string
  trend_days: number
  expiring_within_days: number
  members: {
    total: number
    active: number
    inactive: number
  }
  memberships: {
    total: number
    scheduled: number
    active: number
    frozen: number
    expired: number
    cancelled: number
    renewals: number
  }
  attendance: {
    open_visits: number
    today_checkins: number
    period_checkins: number
  }
  expiring_soon: Array<{
    membership_id: string
    member_id: string
    member_code: string
    member_name: string
    plan_code: string
    plan_name: string
    end_date: string
    days_remaining: number
  }>
  attendance_trend: Array<{
    date: string
    checkins: number
  }>
  plan_distribution: Array<{
    plan_id: string
    plan_code: string
    plan_name: string
    memberships: number
  }>
}

type ApiErrorBody = { detail?: string }

type DashboardOptions = {
  trendDays?: 7 | 14 | 30
  expiringDays?: 30 | 60 | 90
  signal?: AbortSignal
}

async function errorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ApiErrorBody
    return body.detail ?? fallback
  } catch {
    return fallback
  }
}

export async function getDashboard({
  trendDays = 7,
  expiringDays = 30,
  signal,
}: DashboardOptions = {}): Promise<DashboardOverview> {
  const query = new URLSearchParams({
    trend_days: String(trendDays),
    expiring_days: String(expiringDays),
  })
  const response = await fetch(`/api/v1/dashboard?${query.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  })
  if (!response.ok)
    throw new Error(await errorMessage(response, 'Unable to load operational dashboard'))
  return (await response.json()) as DashboardOverview
}
