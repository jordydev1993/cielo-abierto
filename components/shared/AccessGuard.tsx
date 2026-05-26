'use client'

import { useAuth, type AppRole } from '@/context/AuthContext'

interface AccessGuardProps {
  roles: AppRole[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function AccessGuard({ roles, fallback = null, children }: AccessGuardProps) {
  const { role, loading } = useAuth()
  if (loading) return null
  if (!role || !roles.includes(role)) return <>{fallback}</>
  return <>{children}</>
}
