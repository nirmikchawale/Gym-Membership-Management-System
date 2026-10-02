import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const authenticatedUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@example.test',
  full_name: 'Gridstone Admin',
  role: 'admin',
}

function mockFetch(authenticated: boolean) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/auth/me')) {
        return Promise.resolve(
          authenticated
            ? jsonResponse(authenticatedUser)
            : jsonResponse({ detail: 'Authentication required' }, 401),
        )
      }
      return Promise.resolve(
        jsonResponse({
          status: 'ok',
          database: 'ok',
          service: 'gridstone-api',
          version: '0.2.0',
        }),
      )
    }),
  )
}

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.history.replaceState({}, '', '/')
  })

  it('shows the redesigned Gridstone sign-in experience for an anonymous session', async () => {
    mockFetch(false)
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /run the floor\. keep the business moving/i }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: /enter gridstone/i })).toBeVisible()
    expect(await screen.findByText(/API \+ PostgreSQL online/i)).toBeVisible()
  })

  it('shows the responsive Gridstone workspace for an authenticated session', async () => {
    mockFetch(true)
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /the front desk, without the friction/i }),
    ).toBeVisible()
    expect(screen.getAllByText(/Gridstone Admin/i)).toHaveLength(2)
    expect(screen.getByRole('link', { name: /members/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeVisible()
  })

  it('supports direct deep links to future module surfaces', async () => {
    window.history.replaceState({}, '', '/attendance')
    mockFetch(true)
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Attendance', level: 1 })).toBeVisible()
    expect(screen.getByText(/Feature slice not started/i)).toBeVisible()
    expect(screen.getByText(/This is a design-system blueprint/i)).toBeVisible()
  })
})
