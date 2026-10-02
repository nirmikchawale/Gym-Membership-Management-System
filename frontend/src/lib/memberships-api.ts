import {
  demoCreateMembership,
  demoListMemberships,
  demoRenewMembership,
  demoTransitionMembership,
  isInteractiveDemoRuntime,
} from './demo-runtime'

export type MembershipStatus = 'scheduled' | 'active' | 'expired' | 'cancelled' | 'frozen'

export type MembershipRecord = {
  id: string
  member_id: string
  member_code: string
  member_name: string
  plan_id: string
  plan_code: string
  plan_name: string
  renewed_from_membership_id: string | null
  start_date: string
  end_date: string
  status: MembershipStatus
  price_amount: string
  currency: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type MembershipListResponse = {
  items: MembershipRecord[]
  total: number
  limit: number
  offset: number
}

export type MembershipInput = {
  member_id: string
  plan_id: string
  start_date?: string | null
  notes?: string | null
}

export type MembershipRenewInput = {
  plan_id?: string | null
  start_date?: string | null
  notes?: string | null
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

function readCookie(...names: string[]) {
  const cookies = document.cookie.split(';').map((cookie) => cookie.trim())
  for (const name of names) {
    const prefix = `${name}=`
    const match = cookies.find((cookie) => cookie.startsWith(prefix))
    if (match) return decodeURIComponent(match.slice(prefix.length))
  }
  return null
}

function csrfHeaders(): Record<string, string> {
  const token = readCookie('__Host-gridstone_csrf', 'gridstone_csrf')
  if (!token) throw new Error('Your session security token is missing. Refresh and try again.')
  return { 'X-CSRF-Token': token }
}

export async function listMemberships({
  query,
  status = 'all',
  memberId,
  limit = 20,
  offset = 0,
  signal,
}: {
  query?: string
  status?: MembershipStatus | 'all'
  memberId?: string
  limit?: number
  offset?: number
  signal?: AbortSignal
} = {}): Promise<MembershipListResponse> {
  if (isInteractiveDemoRuntime()) {
    return demoListMemberships({ query, status, memberId, limit, offset })
  }

  const params = new URLSearchParams({ status, limit: String(limit), offset: String(offset) })
  if (query?.trim()) params.set('query', query.trim())
  if (memberId) params.set('member_id', memberId)
  const response = await fetch(`/api/v1/memberships?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  })
  if (!response.ok) throw new Error(await errorMessage(response, 'Unable to load memberships'))
  return (await response.json()) as MembershipListResponse
}

export async function createMembership(payload: MembershipInput): Promise<MembershipRecord> {
  if (isInteractiveDemoRuntime()) return demoCreateMembership(payload)

  const response = await fetch('/api/v1/memberships', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...csrfHeaders(),
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await errorMessage(response, 'Unable to create membership'))
  return (await response.json()) as MembershipRecord
}

export async function renewMembership(
  membershipId: string,
  payload: MembershipRenewInput,
): Promise<MembershipRecord> {
  if (isInteractiveDemoRuntime()) return demoRenewMembership(membershipId, payload)

  const response = await fetch(`/api/v1/memberships/${membershipId}/renew`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...csrfHeaders(),
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await errorMessage(response, 'Unable to renew membership'))
  return (await response.json()) as MembershipRecord
}

export async function transitionMembership(
  membershipId: string,
  action: 'cancel' | 'freeze' | 'resume',
): Promise<MembershipRecord> {
  if (isInteractiveDemoRuntime()) return demoTransitionMembership(membershipId, action)

  const response = await fetch(`/api/v1/memberships/${membershipId}/${action}`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...csrfHeaders() },
    credentials: 'same-origin',
  })
  if (!response.ok) throw new Error(await errorMessage(response, `Unable to ${action} membership`))
  return (await response.json()) as MembershipRecord
}
