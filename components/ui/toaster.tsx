'use client'

import * as React from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'success' | 'info' | 'warning' | 'destructive'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  // Milisegundos en pantalla (4000 por defecto); `null` lo deja fijo hasta cerrarlo.
  duracion?: number | null
}

type ToastFn = (opts: Omit<ToastItem, 'id'>) => void

let _toast: ToastFn | null = null

export function toast(opts: Omit<ToastItem, 'id'>) {
  _toast?.(opts)
}

// Cada variante lleva ícono además de color (prompts/053): el estado nunca depende solo
// del color. Advertencias y errores se anuncian con prioridad a los lectores de pantalla.
const VARIANTES: Record<ToastVariant, { icono: LucideIcon | null; color: string; urgente: boolean }> = {
  default: { icono: null, color: '', urgente: false },
  success: { icono: CircleCheck, color: 'text-exito', urgente: false },
  info: { icono: Info, color: 'text-serie-1', urgente: false },
  warning: { icono: TriangleAlert, color: 'text-tertiary', urgente: true },
  destructive: { icono: CircleAlert, color: 'text-error', urgente: true },
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const cerrar = React.useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  React.useEffect(() => {
    _toast = (opts) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { ...opts, id }])
      const duracion = opts.duracion === undefined ? 4000 : opts.duracion
      if (duracion !== null) setTimeout(() => cerrar(id), duracion)
    }
    return () => { _toast = null }
  }, [cerrar])

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const v = VARIANTES[t.variant ?? 'default']
        const Icono = v.icono
        return (
          <div
            key={t.id}
            role={v.urgente ? 'alert' : 'status'}
            aria-live={v.urgente ? 'assertive' : 'polite'}
            onKeyDown={(e) => { if (e.key === 'Escape') cerrar(t.id) }}
            className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-lg shadow-ink/10 animate-in slide-in-from-bottom-2"
          >
            {Icono && <Icono className={cn('mt-0.5 h-4 w-4 shrink-0', v.color)} aria-hidden="true" />}
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-on-surface">{t.title}</p>
              {t.description && <p className="mt-0.5 text-small text-on-surface-variant">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => cerrar(t.id)}
              aria-label="Cerrar aviso"
              className="shrink-0 rounded-md p-0.5 text-outline transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
