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

export async function logout(): Promise<void> {
  const csrfToken = readCookie('__Host-gridstone_csrf', 'gridstone_csrf')
  if (!csrfToken) {
    throw new Error('Your session security token is missing. Refresh and try again.')
  }

  const response = await fetch('/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Unable to sign out'))
  }
}
