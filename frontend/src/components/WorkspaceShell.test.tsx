import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { WorkspaceShell } from './WorkspaceShell'

const user = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'staff@example.test',
  full_name: 'Front Desk Staff',
  role: 'staff' as const,
}

const health = {
  kind: 'loaded' as const,
  data: {
    status: 'ok' as const,
    database: 'ok' as const,
    service: 'gridstone-api',
    version: '0.2.0',
  },
}

function renderShell() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={<WorkspaceShell user={user} health={health} onLogout={async () => undefined} />}
        >
          <Route index element={<p>Workspace content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('WorkspaceShell mobile navigation', () => {
  it('moves focus into the drawer and restores it after Escape', () => {
    renderShell()

    const menuButton = screen.getByRole('button', { name: /open navigation/i })
    fireEvent.click(menuButton)

    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(document.activeElement).toHaveClass('sidebar__close')
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(menuButton).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })
})
