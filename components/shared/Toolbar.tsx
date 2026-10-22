import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolbarProps {
  // Búsqueda opcional; si no se pasa, la barra muestra solo los filtros.
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  children?: React.ReactNode
  className?: string
}

// Barra de herramientas sobre una tabla (prompts/052): búsqueda y filtros en una fila.
export function Toolbar({ search, children, className }: ToolbarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {search && (
        <label className="relative w-full max-w-xs">
          <span className="sr-only">{search.placeholder ?? 'Buscar'}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" aria-hidden="true" />
          <input
            type="search"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? 'Buscar…'}
            className="h-9 w-full rounded-md border border-outline-variant bg-surface-container-lowest pl-9 pr-3 text-body text-on-surface placeholder:text-outline focus-visible:border-serie-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serie-1/20"
          />
        </label>
      )}
      {children}
    </div>
  )
}
