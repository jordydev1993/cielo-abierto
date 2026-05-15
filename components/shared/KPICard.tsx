import * as React from 'react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  label: string
  value: number | string
  icon?: React.ReactNode
  variant?: 'default' | 'primary' | 'error' | 'secondary'
  description?: string
}

const iconBg: Record<NonNullable<KPICardProps['variant']>, string> = {
  default: 'bg-surface-container',
  primary: 'bg-primary-fixed',
  error: 'bg-error-container',
  secondary: 'bg-secondary-container',
}

export function KPICard({ label, value, icon, variant = 'default', description }: KPICardProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-3">
      {icon && (
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', iconBg[variant])}>
          {icon}
        </div>
      )}
      <div>
        <p className="font-heading text-3xl font-bold text-on-surface">{value}</p>
        <p className="text-sm text-on-surface-variant mt-0.5">{label}</p>
        {description && <p className="text-xs text-outline mt-1">{description}</p>}
      </div>
    </div>
  )
}
