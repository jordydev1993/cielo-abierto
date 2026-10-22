'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import { CartelArea } from '@/components/shared/CartelArea'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { areasVisibles, esRutaActiva } from '@/lib/navegacion'
import { useAlertasPendientesCount } from '@/hooks/alertas/useAlertasPendientesCount'
import { useNotificacionesPropuestasCount } from '@/hooks/propuestas-mejora/useNotificacionesPropuestasCount'

function Contador({ count }: { count: number | undefined }) {
  if (!count) return null
  return (
    <span className="ml-auto min-w-[1.5rem] bg-error px-1.5 text-center font-heading text-[11px] font-bold leading-5 text-on-error">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function AlertasBadge() {
  const { data: count } = useAlertasPendientesCount()
  return <Contador count={count} />
}

function PropuestasBadge() {
  const { data: count } = useNotificacionesPropuestasCount()
  return <Contador count={count} />
}

// Barra lateral como el directorio del hall de un hospital: un grupo por área, con su
// color; el módulo activo se rellena con el color de su área (prompts/051).
function Sidebar() {
  const pathname = usePathname()
  const { role, loading, signOut } = useAuth()
  const areas = areasVisibles(role, loading)

  return (
    <aside className="flex w-62 shrink-0 flex-col bg-ink text-[#e9eeec]">
      <div className="px-5 pb-4 pt-5">
        <p className="font-heading text-lg font-extrabold leading-tight">Argüello Infancias</p>
        <p className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-[#9fb0ac]">Residencia NNyA</p>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4" aria-label="Módulos">
        {areas.map((area) => (
          <div key={area.id}>
            <p className="flex items-center gap-2 px-2 pb-1 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-[#9fb0ac]">
              <span className={cn('h-2.5 w-2.5', area.fondo)} aria-hidden="true" />
              {area.nombre}
            </p>
            <ul>
              {area.items.map(({ href, label, icon: Icon }) => {
                const active = esRutaActiva(pathname, href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex min-h-10 items-center gap-3 px-2 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white',
                        active ? cn(area.fondo, 'font-semibold text-white') : 'hover:bg-surface-container-lowest/8'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-[#9fb0ac]')} />
                      {label}
                      {href === '/alertas' && <AlertasBadge />}
                      {href === '/propuestas-mejora' && <PropuestasBadge />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <button
          onClick={() => signOut()}
          className="flex min-h-10 w-full items-center gap-3 px-2 text-sm transition-colors hover:bg-surface-container-lowest/8 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
        >
          <LogOut className="h-4 w-4 text-[#9fb0ac]" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <div className="flex h-screen bg-surface">
          <Sidebar />
          <main className="flex min-w-0 flex-1 flex-col overflow-auto">
            <CartelArea />
            <div className="flex-1">{children}</div>
          </main>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  )
}
