import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the Gridstone sign-in screen when there is no authenticated session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/auth/me')) {
          return Promise.resolve(jsonResponse({ detail: 'Authentication required' }, 401))
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

    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /run the gym from one solid system/i }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeVisible()
    expect(await screen.findByText(/PostgreSQL connected/i)).toBeVisible()
  })

  it('shows the authenticated Gridstone staff shell for an existing session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/auth/me')) {
          return Promise.resolve(
            jsonResponse({
              id: '00000000-0000-0000-0000-000000000001',
              email: 'admin@example.test',
              full_name: 'Gridstone Admin',
              role: 'admin',
            }),
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

    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /authentication foundation active/i }),
    ).toBeVisible()
    expect(screen.getByText(/Gridstone Admin/i)).toBeVisible()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeVisible()
  })
})
