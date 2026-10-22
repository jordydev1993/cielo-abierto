import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: React.ReactNode
  // Botones o enlaces a la derecha del título.
  actions?: React.ReactNode
  className?: string
}

// Encabezado de página (prompts/052): título, descripción opcional y acciones a la derecha.
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-title font-semibold text-on-surface">{title}</h1>
        {description && <p className="mt-1 text-body text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// Contenedor de página: márgenes y ritmo vertical comunes a todas las pantallas.
export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('space-y-6 px-8 py-6', className)}>{children}</div>
}
