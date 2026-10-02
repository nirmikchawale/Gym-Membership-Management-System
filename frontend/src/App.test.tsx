import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders foundation status returned by the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 'ok',
            database: 'ok',
            service: 'gym-membership-api',
            version: '0.1.0',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    render(<App />)

    expect(screen.getByRole('heading', { name: /gym membership management system/i })).toBeVisible()
    expect(await screen.findByText(/PostgreSQL connected/i)).toBeVisible()
  })
})
