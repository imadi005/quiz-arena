import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types'

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode
  allowedRoles: Role[]
}) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
