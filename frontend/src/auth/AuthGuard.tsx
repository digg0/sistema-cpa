import { useEffect, type ReactNode } from 'react'
import { isSessionValid, type AuthSession } from './session'

export default function AuthGuard({
  session,
  onExpired,
  children,
}: {
  session: AuthSession
  onExpired: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!isSessionValid(session)) {
      onExpired()
      return
    }

    const remaining = session.expiresAt - Date.now()
    const timer = window.setTimeout(onExpired, Math.max(0, remaining))
    return () => window.clearTimeout(timer)
  }, [session, onExpired])

  if (!isSessionValid(session)) return null
  return <>{children}</>
}
