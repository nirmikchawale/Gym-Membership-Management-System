export type AttendanceRecord = {
  id: string
  member_id: string
  member_code: string
  member_name: string
  membership_id: string | null
  plan_code: string | null
  plan_name: string | null
  checked_in_at: string
  checked_out_at: string | null
  is_open: boolean
  duration_minutes: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type AttendanceAccess = {
  member_id: string
  member_code: string
  member_name: string
  member_active: boolean
  eligible: boolean
  reason: string
  membership: {
    id: string
    plan_code: string
    plan_name: string
    start_date: string
    end_date: string
    status: string
  } | null
  open_visit: AttendanceRecord | null
}

export type AttendanceListResponse = {
  items: AttendanceRecord[]
  total: number
  limit: number
  offset: number
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
  const token = readCookie('__Host-gridstone_csrf', 'gridstone_csrf')
  if (!token) throw new Error('Your session security token is missing. Refresh and try again.')
  return { 'X-CSRF-Token': token }
}

export async function getAttendanceAccess(
  memberId: string,
  signal?: AbortSignal,
): Promise<AttendanceAccess> {
  const response = await fetch(`/api/v1/attendance/access/${memberId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  })
  if (!response.ok) throw new Error(await errorMessage(response, 'Unable to validate member access'))
  return (await response.json()) as AttendanceAccess
}

export async function listAttendance({
  query,
  state = 'all',
  from,
  to,
  limit = 25,
  offset = 0,
  signal,
}: {
  query?: string
  state?: 'all' | 'open' | 'closed'
  from?: string
  to?: string
  limit?: number
  offset?: number
  signal?: AbortSignal
} = {}): Promise<AttendanceListResponse> {
  const params = new URLSearchParams({ state, limit: String(limit), offset: String(offset) })
  if (query?.trim()) params.set('query', query.trim())
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const response = await fetch(`/api/v1/attendance?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  })
  if (!response.ok) throw new Error(await errorMessage(response, 'Unable to load attendance'))
  return (await response.json()) as AttendanceListResponse
}

export async function checkIn(memberId: string, notes?: string | null): Promise<AttendanceRecord> {
  const response = await fetch('/api/v1/attendance', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...csrfHeaders(),
    },
    credentials: 'same-origin',
    body: JSON.stringify({ member_id: memberId, notes: notes || null }),
  })
  if (!response.ok) throw new Error(await errorMessage(response, 'Unable to check member in'))
  return (await response.json()) as AttendanceRecord
}

export async function checkOut(attendanceId: string): Promise<AttendanceRecord> {
  const response = await fetch(`/api/v1/attendance/${attendanceId}/checkout`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...csrfHeaders() },
    credentials: 'same-origin',
  })
  if (!response.ok) throw new Error(await errorMessage(response, 'Unable to check member out'))
  return (await response.json()) as AttendanceRecord
}
