import { fireEvent, render, screen } from '@testing-library/react'
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

const memberRecord = {
  id: '00000000-0000-0000-0000-000000000111',
  member_code: 'GST-TEST01',
  first_name: 'Aarav',
  last_name: 'Mehta',
  email: 'aarav@example.test',
  phone: '+91 90000 00001',
  date_of_birth: null,
  joined_on: '2026-09-01',
  is_active: true,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

const planRecord = {
  id: '00000000-0000-0000-0000-000000000211',
  code: 'PRO-6M',
  name: 'Forge Plus',
  description: 'Six months of focused access.',
  duration_days: 180,
  price: '6999.00',
  currency: 'INR',
  is_active: true,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
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
      if (url.includes('/api/v1/attendance')) {
        return Promise.resolve(jsonResponse({ items: [], total: 0, limit: 20, offset: 0 }))
      }
      if (url.includes('/api/v1/members')) {
        return Promise.resolve(
          jsonResponse({ items: [memberRecord], total: 1, limit: 20, offset: 0 }),
        )
      }
      if (url.includes('/api/v1/plans')) {
        return Promise.resolve(
          jsonResponse({ items: [planRecord], total: 1, limit: 20, offset: 0 }),
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
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('shows sign-in and exposes a theme switch for anonymous sessions', async () => {
    mockFetch(false)
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /run the floor\. keep the business moving/i }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: /enter gridstone/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeVisible()
    expect(await screen.findByText(/API \+ PostgreSQL online/i)).toBeVisible()
  })

  it('shows the Gridstone workspace for an authenticated session', async () => {
    mockFetch(true)
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /the front desk, without the friction/i }),
    ).toBeVisible()
    expect(screen.getAllByText(/Gridstone Admin/i)).toHaveLength(2)
    expect(screen.getByRole('link', { name: /^members$/i })).toBeVisible()
    expect(screen.getByRole('link', { name: /^plans$/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeVisible()
  })

  it('supports the completed Members vertical slice', async () => {
    window.history.replaceState({}, '', '/members')
    mockFetch(true)
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Members', level: 1 })).toBeVisible()
    expect(await screen.findByText(/Aarav Mehta/i)).toBeVisible()
    expect(screen.getByRole('button', { name: /add member/i })).toBeVisible()
    expect(screen.getByPlaceholderText(/search name, code, email, phone or plan/i)).toBeVisible()
  })

  it('supports the Membership Plans vertical slice for administrators', async () => {
    window.history.replaceState({}, '', '/plans')
    mockFetch(true)
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Membership Plans', level: 1 })).toBeVisible()
    expect(await screen.findByText(/Forge Plus/i)).toBeVisible()
    expect(screen.getByRole('button', { name: /create plan/i })).toBeVisible()
    expect(screen.getByPlaceholderText(/search code, name or description/i)).toBeVisible()
    expect(screen.getByText(/Historical pricing stays historical/i)).toBeVisible()
  })

  it('supports the completed Attendance Operations slice', async () => {
    window.history.replaceState({}, '', '/attendance')
    mockFetch(true)
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: 'Attendance & Access', level: 1 }),
    ).toBeVisible()
    expect(screen.getByText(/Find the member before opening the gate/i)).toBeVisible()
    expect(screen.getByPlaceholderText(/Member code, name, phone or email/i)).toBeVisible()
    expect(await screen.findByText(/No attendance visits match these filters/i)).toBeVisible()
  })

  it('persists explicit light and dark theme selection', async () => {
    mockFetch(true)
    render(<App />)
    await screen.findByRole('heading', { name: /the front desk, without the friction/i })

    const toggle = screen.getByRole('button', { name: /switch to light mode/i })
    fireEvent.click(toggle)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(window.localStorage.getItem('gridstone-theme')).toBe('light')
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeVisible()
  })
})
