import { useCallback, useEffect, useRef, useState } from 'react'
import { Database, LogOut, Menu, ShieldCheck, X } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { AuthUser } from '../lib/api'
import type { HealthState } from '../lib/app-state'
import { navItems } from '../lib/navigation'
import { Brand } from './Brand'
import { ThemeToggle } from './ThemeToggle'
import { Badge, Button } from './ui'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function healthLabel(health: HealthState, publicPreview: boolean) {
  if (publicPreview) return 'Public preview'
  if (health.kind === 'loaded') return 'Systems online'
  if (health.kind === 'error') return 'Health unavailable'
  return 'Checking systems'
}

export function WorkspaceShell({
  user,
  health,
  onLogout,
  publicPreview = false,
}: {
  user: AuthUser
  health: HealthState
  onLogout: () => Promise<void>
  publicPreview?: boolean
}) {
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [signoutError, setSignoutError] = useState<string | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const currentItem = navItems.find((item) => item.path === location.pathname) ?? navItems[0]

  const closeMobileNav = useCallback((restoreFocus = true) => {
    setMobileNavOpen(false)
    if (restoreFocus) menuButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileNavOpen) return

    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileNav()
    }

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [closeMobileNav, mobileNavOpen])

  async function handleLogout() {
    setSignoutError(null)
    try {
      await onLogout()
    } catch (error: unknown) {
      setSignoutError(error instanceof Error ? error.message : 'Unable to sign out')
    }
  }

  const systemLabel = healthLabel(health, publicPreview)

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
          onClick={() => closeMobileNav()}
        />
      )}

      <aside
        id="primary-navigation"
        className={`sidebar${mobileNavOpen ? ' sidebar--open' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="sidebar__top">
          <Brand compact />
          <button
            ref={closeButtonRef}
            className="icon-button sidebar__close"
            type="button"
            aria-label="Close navigation"
            onClick={() => closeMobileNav()}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="workspace-chip">
          <span className="workspace-chip__dot" aria-hidden="true" />
          <span>{publicPreview ? 'Gridstone public preview' : 'Operations workspace'}</span>
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
                onClick={() => setMobileNavOpen(false)}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="system-card">
            <div className="system-card__icon" aria-hidden="true">
              <Database size={18} />
            </div>
            <div>
              <p>Gridstone core</p>
              <span>{systemLabel}</span>
            </div>
            <span
              className={`system-card__pulse system-card__pulse--${
                publicPreview ? 'loading' : health.kind
              }`}
              aria-hidden="true"
            />
          </div>
          <p className="sidebar__caption">
            {publicPreview
              ? 'Synthetic dataset · no production customer data'
              : 'Asia/Kolkata · Secure staff session'}
          </p>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="topbar">
          <div className="topbar__left">
            <button
              ref={menuButtonRef}
              className="icon-button topbar__menu"
              type="button"
              aria-label="Open navigation"
              aria-controls="primary-navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div>
              <p className="topbar__eyebrow">Gridstone / {currentItem.label}</p>
              <p className="topbar__title">
                {publicPreview ? 'Gridstone product preview' : 'Operations workspace'}
              </p>
            </div>
          </div>

          <div className="topbar__actions">
            <Badge
              tone={
                publicPreview
                  ? 'accent'
                  : health.kind === 'loaded'
                    ? 'success'
                    : health.kind === 'error'
                      ? 'danger'
                      : 'neutral'
              }
            >
              <span className="badge__dot" aria-hidden="true" />
              {systemLabel}
            </Badge>

            <ThemeToggle compact />

            <div className="user-chip">
              <span className="user-chip__avatar" aria-hidden="true">
                {initials(user.full_name)}
              </span>
              <span className="user-chip__identity">
                <strong>{user.full_name}</strong>
                <small>
                  <ShieldCheck size={12} aria-hidden="true" />
                  {publicPreview ? 'preview' : user.role}
                </small>
              </span>
            </div>

            {!publicPreview && (
              <Button
                variant="ghost"
                className="topbar__logout"
                type="button"
                icon={<LogOut size={16} aria-hidden="true" />}
                onClick={handleLogout}
              >
                Sign out
              </Button>
            )}
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
