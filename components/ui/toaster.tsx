'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'success' | 'destructive'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

type ToastFn = (opts: Omit<ToastItem, 'id'>) => void

let _toast: ToastFn | null = null

export function toast(opts: Omit<ToastItem, 'id'>) {
  _toast?.(opts)
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  React.useEffect(() => {
    _toast = (opts) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { ...opts, id }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
    }
    return () => { _toast = null }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 shadow-md bg-white animate-in slide-in-from-bottom-2',
            t.variant === 'destructive' && 'border-red-200 bg-red-50',
            t.variant === 'success' && 'border-green-200 bg-green-50'
          )}
        >
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-sm font-semibold',
              t.variant === 'destructive' && 'text-red-800',
              t.variant === 'success' && 'text-green-800'
            )}>
              {t.title}
            </p>
            {t.description && (
              <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="text-slate-400 hover:text-slate-600 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
