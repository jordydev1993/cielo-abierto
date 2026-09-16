'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import {
  Users, User, FileText, Home, BookOpen, Shield, UserCheck,
  LogOut, AlertTriangle, CalendarClock, Siren, PartyPopper, Contact2,
  ClipboardCheck, KanbanSquare, UserCog, HeartHandshake,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAlertasPendientesCount } from '@/hooks/alertas/useAlertasPendientesCount'
import { useNotificacionesPropuestasCount } from '@/hooks/propuestas-mejora/useNotificacionesPropuestasCount'

const NAV_ALL = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/nnya', label: 'NNyA', icon: Users },
  { href: '/legajos', label: 'Legajos', icon: BookOpen },
  { href: '/tutores', label: 'Tutores', icon: UserCheck },
  { href: '/referentes', label: 'Referentes', icon: Contact2 },
]

const NAV_ADMIN_TECNICO = [
  { href: '/incidentes', label: 'Incidentes', icon: Siren },
  { href: '/alertas', label: 'Alertas', icon: AlertTriangle },
  { href: '/turnos', label: 'Turnos', icon: CalendarClock },
  { href: '/turnos-personal', label: 'Turnos de Personal', icon: UserCog },
  { href: '/actividades', label: 'Actividades', icon: PartyPopper },
  { href: '/informes', label: 'Informes', icon: FileText },
  { href: '/evaluacion-institucional', label: 'Evaluación Institucional', icon: ClipboardCheck },
  { href: '/propuestas-mejora', label: 'Propuestas de Mejora', icon: KanbanSquare },
  { href: '/seguimiento-post-egreso', label: 'Seguimiento Post-Egreso', icon: HeartHandshake },
]

const NAV_ADMIN_ONLY = [
  { href: '/usuarios', label: 'Usuarios', icon: User },
  { href: '/roles', label: 'Roles', icon: Shield },
]

function AlertasBadge() {
  const { data: count } = useAlertasPendientesCount()
  if (!count) return null
  return (
    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center leading-4">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function PropuestasBadge() {
  const { data: count } = useNotificacionesPropuestasCount()
  if (!count) return null
  return (
    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center leading-4">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function Sidebar() {
  const pathname = usePathname()
  const { role, loading, signOut } = useAuth()

  const navItems = [
    ...NAV_ALL,
    ...(!loading && (role === 'Admin' || role === 'Equipo Tecnico') ? NAV_ADMIN_TECNICO : []),
    ...(!loading && role === 'Admin' ? NAV_ADMIN_ONLY : []),
  ]

  return (
    <aside className="w-60 bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-outline-variant">
        <h1 className="font-heading font-bold text-primary text-sm tracking-tight">Argüello Infancias</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">Residencia NNyA</p>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-secondary-container text-on-secondary-container font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-outline')} />
              {label}
              {href === '/alertas' && <AlertasBadge />}
              {href === '/propuestas-mejora' && <PropuestasBadge />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-outline-variant">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container w-full transition-colors"
        >
          <LogOut className="h-4 w-4 text-outline" />
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
        <div className="flex min-h-screen bg-surface">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  )
}
