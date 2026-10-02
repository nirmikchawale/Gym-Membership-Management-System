export type DashboardOverview = {
  as_of: string
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
    last_7_days_checkins: number
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

async function errorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ApiErrorBody
    return body.detail ?? fallback
  } catch {
    return fallback
  }
}

export async function getDashboard(signal?: AbortSignal): Promise<DashboardOverview> {
  const response = await fetch('/api/v1/dashboard', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  })
  if (!response.ok) throw new Error(await errorMessage(response, 'Unable to load operational dashboard'))
  return (await response.json()) as DashboardOverview
}
