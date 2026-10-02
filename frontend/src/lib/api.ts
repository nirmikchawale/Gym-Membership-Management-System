import {
  demoCreateMember,
  demoCreatePlan,
  demoListMembers,
  demoListPlans,
  demoSetMemberActive,
  demoSetPlanActive,
  demoUpdateMember,
  demoUpdatePlan,
  isInteractiveDemoRuntime,
} from './demo-runtime'

export type HealthResponse = {
  status: 'ok'
  database: 'ok'
  service: string
  version: string
}

export type AuthUser = {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'staff'
}

export type MemberRecord = {
  id: string
  member_code: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  joined_on: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type MemberInput = {
  member_code?: string
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  date_of_birth?: string | null
  joined_on?: string
}

export type MemberUpdateInput = Partial<MemberInput>

export type MemberListResponse = {
  items: MemberRecord[]
  total: number
  limit: number
  offset: number
}

export type PlanRecord = {
  id: string
  code: string
  name: string
  description: string | null
  duration_days: number
  price: string
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PlanInput = {
  code: string
  name: string
  description?: string | null
  duration_days: number
  price: string
  currency?: string
}

export type PlanUpdateInput = Partial<PlanInput>

export type PlanListResponse = {
  items: PlanRecord[]
  total: number
  limit: number
  offset: number
}

type LoginResponse = {
  user: AuthUser
}

type ApiErrorBody = {
  detail?: string
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody
    return body.detail ?? fallback
  } catch {
    return fallback
  }
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch('/api/v1/health', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  })

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`)
  }

  return (await response.json()) as HealthResponse
}

export async function getCurrentUser(signal?: AbortSignal): Promise<AuthUser | null> {
  const response = await fetch('/api/v1/auth/me', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  })

  if (response.status === 401) return null
  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Unable to verify your session'))
  }

  return (await response.json()) as AuthUser
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Unable to sign in'))
  }

  return ((await response.json()) as LoginResponse).user
}

function readCookie(...names: string[]): string | null {
  const cookies = document.cookie.split(';').map((cookie) => cookie.trim())

  for (const name of names) {
    const prefix = `${name}=`
    const match = cookies.find((cookie) => cookie.startsWith(prefix))
    if (match) return decodeURIComponent(match.slice(prefix.length))
  }

  return null
}

function csrfHeaders(): Record<string, string> {
  const csrfToken = readCookie('__Host-gridstone_csrf', 'gridstone_csrf')
  if (!csrfToken) {
    throw new Error('Your session security token is missing. Refresh and try again.')
  }
  return { 'X-CSRF-Token': csrfToken }
}

export async function logout(): Promise<void> {
  const response = await fetch('/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...csrfHeaders(),
    },
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Unable to sign out'))
  }
}

export async function listMembers({
  query,
  status = 'all',
  limit = 20,
  offset = 0,
  signal,
}: {
  query?: string
  status?: 'all' | 'active' | 'inactive'
  limit?: number
  offset?: number
  signal?: AbortSignal
} = {}): Promise<MemberListResponse> {
  if (isInteractiveDemoRuntime()) return demoListMembers({ query, status, limit, offset })

  const params = new URLSearchParams({ status, limit: String(limit), offset: String(offset) })
  if (query?.trim()) params.set('query', query.trim())

  const response = await fetch(`/api/v1/members?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  })
  if (!response.ok) throw new Error(await errorMessage(response, 'Unable to load members'))
  return (await response.json()) as MemberListResponse
}

export async function createMember(payload: MemberInput): Promise<MemberRecord> {
  if (isInteractiveDemoRuntime()) return demoCreateMember(payload)

  const response = await fetch('/api/v1/members', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...csrfHeaders(),
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await errorMessage(response, 'Unable to create member'))
  return (await response.json()) as MemberRecord
}

export async function updateMember(
  memberId: string,
  payload: MemberUpdateInput,
): Promise<MemberRecord> {
  if (isInteractiveDemoRuntime()) return demoUpdateMember(memberId, payload)

  const response = await fetch(`/api/v1/members/${memberId}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...csrfHeaders(),
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await errorMessage(response, 'Unable to update member'))
  return (await response.json()) as MemberRecord
}

export async function setMemberActive(memberId: string, isActive: boolean): Promise<MemberRecord> {
  if (isInteractiveDemoRuntime()) return demoSetMemberActive(memberId, isActive)

  const action = isActive ? 'activate' : 'deactivate'
  const response = await fetch(`/api/v1/members/${memberId}/${action}`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...csrfHeaders() },
    credentials: 'same-origin',
  })
  if (!response.ok) {
    throw new Error(await errorMessage(response, `Unable to ${action} member`))
  }
  return (await response.json()) as MemberRecord
}

export async function listPlans({
  query,
  status = 'all',
  limit = 20,
  offset = 0,
  signal,
}: {
  query?: string
  status?: 'all' | 'active' | 'inactive'
  limit?: number
  offset?: number
  signal?: AbortSignal
} = {}): Promise<PlanListResponse> {
  if (isInteractiveDemoRuntime()) return demoListPlans({ query, status, limit, offset })

  const params = new URLSearchParams({ status, limit: String(limit), offset: String(offset) })
  if (query?.trim()) params.set('query', query.trim())

  const response = await fetch(`/api/v1/plans?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  })
  if (!response.ok) throw new Error(await errorMessage(response, 'Unable to load membership plans'))
  return (await response.json()) as PlanListResponse
}

export async function createPlan(payload: PlanInput): Promise<PlanRecord> {
  if (isInteractiveDemoRuntime()) return demoCreatePlan(payload)

  const response = await fetch('/api/v1/plans', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...csrfHeaders(),
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  })
  if (!response.ok)
    throw new Error(await errorMessage(response, 'Unable to create membership plan'))
  return (await response.json()) as PlanRecord
}

export async function updatePlan(planId: string, payload: PlanUpdateInput): Promise<PlanRecord> {
  if (isInteractiveDemoRuntime()) return demoUpdatePlan(planId, payload)

  const response = await fetch(`/api/v1/plans/${planId}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...csrfHeaders(),
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  })
  if (!response.ok)
    throw new Error(await errorMessage(response, 'Unable to update membership plan'))
  return (await response.json()) as PlanRecord
}

export async function setPlanActive(planId: string, isActive: boolean): Promise<PlanRecord> {
  if (isInteractiveDemoRuntime()) return demoSetPlanActive(planId, isActive)

  const action = isActive ? 'activate' : 'deactivate'
  const response = await fetch(`/api/v1/plans/${planId}/${action}`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...csrfHeaders() },
    credentials: 'same-origin',
  })
  if (!response.ok) {
    throw new Error(await errorMessage(response, `Unable to ${action} membership plan`))
  }
  return (await response.json()) as PlanRecord
}
