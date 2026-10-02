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

const dashboardRecord = {
  as_of: '2026-10-02',
  trend_days: 7,
  expiring_within_days: 30,
  members: { total: 12, active: 10, inactive: 2 },
  memberships: {
    total: 14,
    scheduled: 1,
    active: 8,
    frozen: 1,
    expired: 3,
    cancelled: 1,
    renewals: 2,
  },
  attendance: { open_visits: 3, today_checkins: 7, period_checkins: 26 },
  expiring_soon: [
    {
      membership_id: '00000000-0000-0000-0000-000000000311',
      member_id: memberRecord.id,
      member_code: memberRecord.member_code,
      member_name: 'Aarav Mehta',
      plan_code: planRecord.code,
      plan_name: planRecord.name,
      end_date: '2026-10-12',
      days_remaining: 10,
    },
  ],
  attendance_trend: [
    { date: '2026-09-26', checkins: 2 },
    { date: '2026-09-27', checkins: 3 },
    { date: '2026-09-28', checkins: 4 },
    { date: '2026-09-29', checkins: 5 },
    { date: '2026-09-30', checkins: 3 },
    { date: '2026-10-01', checkins: 2 },
    { date: '2026-10-02', checkins: 7 },
  ],
  plan_distribution: [
    {
      plan_id: planRecord.id,
      plan_code: planRecord.code,
      plan_name: planRecord.name,
      memberships: 6,
    },
  ],
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
      if (url.includes('/api/v1/dashboard')) {
        const params = new URL(url, 'https://gridstone.test').searchParams
        const trendDays = Number(params.get('trend_days') ?? 7)
        const expiringDays = Number(params.get('expiring_days') ?? 30)
        return Promise.resolve(
          jsonResponse({
            ...dashboardRecord,
            trend_days: trendDays,
            expiring_within_days: expiringDays,
            attendance_trend: Array.from({ length: trendDays }, (_, index) => ({
              date: `2026-09-${String(index + 1).padStart(2, '0')}`,
              checkins: index % 4,
            })),
          }),
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
    window.sessionStorage.clear()
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

  it('shows reconciled operational dashboard data without unfinished-module notices', async () => {
    mockFetch(true)
    render(<App />)

    expect(await screen.findByRole('heading', { name: /today at gridstone/i })).toBeVisible()
    expect(await screen.findByText(/2 inactive · 12 total/i)).toBeVisible()
    expect(screen.getByText(/Active members/i)).toBeVisible()
    expect(screen.getByText(/26 in last 7 days/i)).toBeVisible()
    expect(screen.getAllByText(/Gridstone Admin/i)).toHaveLength(2)
    expect(screen.getByRole('link', { name: /^reports$/i })).toBeVisible()
    expect(screen.getByRole('link', { name: /^payments$/i })).toBeVisible()
    expect(screen.getByText(/Reconciled reporting/i)).toBeVisible()
    expect(screen.queryByText(/Payments excluded/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/not implemented/i)).not.toBeInTheDocument()
  })

  it('supports the completed Members vertical slice', async () => {
    window.history.replaceState({}, '', '/members')
    mockFetch(true)
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Members', level: 1 })).toBeVisible()
    expect(await screen.findByText(/Aarav Mehta/i)).toBeVisible()
    expect(screen.getByRole('button', { name: /add member/i })).toBeVisible()
    expect(screen.getByPlaceholderText(/search name, code, email or phone/i)).toBeVisible()
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

  it('supports bounded operational reporting without unfinished-module notices', async () => {
    window.history.replaceState({}, '', '/reports')
    mockFetch(true)
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Reports', level: 1 })).toBeVisible()
    const attendanceRange = screen.getByLabelText(/Attendance trend/i)
    fireEvent.change(attendanceRange, { target: { value: '14' } })
    expect(await screen.findByText(/Last 14 days/i)).toBeVisible()
    expect(screen.getByText(/Live operational data/i)).toBeVisible()
    expect(screen.queryByText(/Payments excluded/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/not implemented/i)).not.toBeInTheDocument()
  })

  it('keeps Payments as the sole explicit unavailable module', async () => {
    window.history.replaceState({}, '', '/payments')
    mockFetch(true)
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Payments', level: 1 })).toBeVisible()
    expect(screen.getByText(/Not implemented — intentionally out of scope/i)).toBeVisible()
    expect(screen.getByText(/All other navigation modules are implemented/i)).toBeVisible()
  })

  it('persists explicit light and dark theme selection', async () => {
    mockFetch(true)
    render(<App />)
    await screen.findByRole('heading', { name: /today at gridstone/i })

    const toggle = screen.getByRole('button', { name: /switch to light mode/i })
    fireEvent.click(toggle)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(window.localStorage.getItem('gridstone-theme')).toBe('light')
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeVisible()
  })
})
