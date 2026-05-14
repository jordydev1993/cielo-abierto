'use client'

import { useAuth, type AppRole } from '@/context/AuthContext'

interface AccessGuardProps {
  roles: AppRole[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function AccessGuard({ roles, fallback = null, children }: AccessGuardProps) {
  const { role } = useAuth()
  if (!role || !roles.includes(role)) return <>{fallback}</>
  return <>{children}</>
}
