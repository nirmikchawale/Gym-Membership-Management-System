import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getCurrentUser, getHealth, logout, type AuthUser } from './lib/api'
import type { HealthState } from './lib/app-state'
import { moduleDefinitions } from './lib/navigation'
import { useScrollTide } from './lib/useScrollTide'
import { Brand } from './components/Brand'
import { Button } from './components/ui'
import { WorkspaceShell } from './components/WorkspaceShell'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MembersPage } from './pages/MembersPage'
import { ModulePage } from './pages/ModulePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlansPage } from './pages/PlansPage'

type AuthState =
  | { kind: 'loading' }
  | { kind: 'anonymous' }
  | { kind: 'authenticated'; user: AuthUser }
  | { kind: 'error'; message: string }

const publicPreviewUser: AuthUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'preview@gridstone.app',
  full_name: 'Gridstone Preview',
  role: 'staff',
}

function isPublicPreviewBuild() {
  return import.meta.env.VITE_PUBLIC_PREVIEW === 'true'
}

function BootScreen() {
  return (
    <main id="main-content" className="boot-screen" aria-live="polite">
      <Brand />
      <div className="boot-screen__signal" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p>Opening your workspace…</p>
    </main>
  )
}

function SessionError({ message }: { message: string }) {
  return (
    <main id="main-content" className="error-screen" role="alert">
      <span className="error-screen__icon" aria-hidden="true">
        <AlertTriangle size={24} />
      </span>
      <p className="page-eyebrow">Gridstone session</p>
      <h1>We couldn’t verify your workspace.</h1>
      <p>{message}</p>
      <Button type="button" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </main>
  )
}

function GridstoneApplication() {
  useScrollTide()

  const publicPreview = isPublicPreviewBuild()
  const [auth, setAuth] = useState<AuthState>(
    publicPreview ? { kind: 'authenticated', user: publicPreviewUser } : { kind: 'loading' },
  )
  const [health, setHealth] = useState<HealthState>(
    publicPreview ? { kind: 'error' } : { kind: 'loading' },
  )

  useEffect(() => {
    if (publicPreview) return

    const controller = new AbortController()

    void getCurrentUser(controller.signal)
      .then((user) => setAuth(user ? { kind: 'authenticated', user } : { kind: 'anonymous' }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setAuth({
          kind: 'error',
          message: error instanceof Error ? error.message : 'Unable to verify your session',
        })
      })

    void getHealth(controller.signal)
      .then((data) => setHealth({ kind: 'loaded', data }))
      .catch(() => {
        if (!controller.signal.aborted) setHealth({ kind: 'error' })
      })

    return () => controller.abort()
  }, [publicPreview])

  if (auth.kind === 'loading') return <BootScreen />
  if (auth.kind === 'error') return <SessionError message={auth.message} />

  if (auth.kind === 'anonymous') {
    return (
      <Routes>
        <Route
          path="*"
          element={
            <LoginPage
              health={health}
              onAuthenticated={(user) => setAuth({ kind: 'authenticated', user })}
            />
          }
        />
      </Routes>
    )
  }

  async function handleLogout() {
    if (publicPreview) return
    await logout()
    setAuth({ kind: 'anonymous' })
  }

  const laterModules = moduleDefinitions.filter(
    (module) => module.path !== '/members' && module.path !== '/plans',
  )

  return (
    <Routes>
      <Route
        element={
          <WorkspaceShell
            user={auth.user}
            health={health}
            onLogout={handleLogout}
            publicPreview={publicPreview}
          />
        }
      >
        <Route index element={<HomePage user={auth.user} health={health} />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="members" element={<MembersPage publicPreview={publicPreview} />} />
        <Route
          path="plans"
          element={<PlansPage publicPreview={publicPreview} user={auth.user} />}
        />
        {laterModules.map((module) => (
          <Route
            key={module.path}
            path={module.path.slice(1)}
            element={<ModulePage module={module} />}
          />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <GridstoneApplication />
    </BrowserRouter>
  )
}
