import { Navigate, Outlet, useLocation } from 'react-router'
import { BrandLoader } from '@/components/feedback/BrandLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useSession } from '@/features/auth/api'
import { CurrentUserContext, useCurrentUser } from '@/features/auth/current-user'
import { AccessDeniedPage } from '@/features/auth/StatusPages'
import type { Role } from '@/features/auth/types'

function SessionGate({ children }: { children: (signedIn: boolean) => React.ReactNode }) {
  const session = useSession()

  if (session.data === undefined) {
    // Offline or unreachable server: show a recoverable screen
    return session.isError ? (
      <div className="mx-auto grid min-h-dvh max-w-md content-center px-4">
        <ErrorState error={session.error} onRetry={() => void session.refetch()} />
      </div>
    ) : (
      <BrandLoader fullScreen label="Loading Campus Connect" />
    )
  }

  return children(session.data !== null)
}

export function RequireAuth() {
  const location = useLocation()
  const session = useSession()

  return (
    <SessionGate>
      {() =>
        session.data ? (
          <CurrentUserContext value={session.data}>
            <Outlet />
          </CurrentUserContext>
        ) : (
          <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
        )
      }
    </SessionGate>
  )
}

export function GuestOnly() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  return (
    <SessionGate>
      {(signedIn) => (signedIn ? <Navigate to={from ?? '/'} replace /> : <Outlet />)}
    </SessionGate>
  )
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useCurrentUser()
  return roles.some((role) => user.roles.includes(role)) ? <Outlet /> : <AccessDeniedPage />
}
