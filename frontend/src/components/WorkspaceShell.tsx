import { useEffect, useState } from 'react'
import { Database, LogOut, Menu, ShieldCheck, X } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { AuthUser } from '../lib/api'
import type { HealthState } from '../lib/app-state'
import { navItems } from '../lib/navigation'
import { Brand } from './Brand'
import { Badge, Button } from './ui'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function healthLabel(health: HealthState) {
  if (health.kind === 'loaded') return 'Systems online'
  if (health.kind === 'error') return 'Health unavailable'
  return 'Checking systems'
}

export function WorkspaceShell({
  user,
  health,
  onLogout,
}: {
  user: AuthUser
  health: HealthState
  onLogout: () => Promise<void>
}) {
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [signoutError, setSignoutError] = useState<string | null>(null)
  const currentItem = navItems.find((item) => item.path === location.pathname) ?? navItems[0]

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileNavOpen) return

    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileNavOpen])

  async function handleLogout() {
    setSignoutError(null)
    try {
      await onLogout()
    } catch (error: unknown) {
      setSignoutError(error instanceof Error ? error.message : 'Unable to sign out')
    }
  }

  return (
    <div className="workspace-shell">
      <div className="ambient-layer ambient-layer--workspace" aria-hidden="true">
        <span className="ambient-orb ambient-orb--one" />
        <span className="ambient-orb ambient-orb--two" />
      </div>

      {mobileNavOpen && (
        <button
          className="mobile-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside className={`sidebar${mobileNavOpen ? ' sidebar--open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar__top">
          <Brand compact />
          <button
            className="icon-button sidebar__close"
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="workspace-chip">
          <span className="workspace-chip__dot" aria-hidden="true" />
          <span>Operations workspace</span>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="system-card">
            <div className="system-card__icon" aria-hidden="true"><Database size={18} /></div>
            <div>
              <p>Gridstone core</p>
              <span>{healthLabel(health)}</span>
            </div>
            <span className={`system-card__pulse system-card__pulse--${health.kind}`} aria-hidden="true" />
          </div>
          <p className="sidebar__caption">Asia/Kolkata · Secure staff session</p>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="topbar">
          <div className="topbar__left">
            <button
              className="icon-button topbar__menu"
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div>
              <p className="topbar__eyebrow">Gridstone / {currentItem.label}</p>
              <p className="topbar__title">Operations workspace</p>
            </div>
          </div>

          <div className="topbar__actions">
            <Badge tone={health.kind === 'loaded' ? 'success' : health.kind === 'error' ? 'danger' : 'neutral'}>
              <span className="badge__dot" aria-hidden="true" />
              {healthLabel(health)}
            </Badge>

            <div className="user-chip">
              <span className="user-chip__avatar" aria-hidden="true">{initials(user.full_name)}</span>
              <span className="user-chip__identity">
                <strong>{user.full_name}</strong>
                <small><ShieldCheck size={12} aria-hidden="true" />{user.role}</small>
              </span>
            </div>

            <Button
              variant="ghost"
              className="topbar__logout"
              type="button"
              icon={<LogOut size={16} aria-hidden="true" />}
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </div>
        </header>

        {signoutError && (
          <div className="workspace-alert" role="alert">
            {signoutError}
          </div>
        )}

        <main id="main-content" className="workspace-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
