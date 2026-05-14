'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import {
  Users, User, FileText, Home, BookOpen, Shield, UserCheck,
  LogOut, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ALL = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/nnya', label: 'NNyA', icon: Users },
  { href: '/legajos', label: 'Legajos', icon: BookOpen },
  { href: '/tutores', label: 'Tutores', icon: UserCheck },
]

const NAV_ADMIN_TECNICO = [
  { href: '/alertas', label: 'Alertas', icon: AlertTriangle },
]

const NAV_ADMIN_ONLY = [
  { href: '/usuarios', label: 'Usuarios', icon: User },
  { href: '/roles', label: 'Roles', icon: Shield },
]

function Sidebar() {
  const pathname = usePathname()
  const { role, signOut } = useAuth()

  const navItems = [
    ...NAV_ALL,
    ...(role === 'Admin' || role === 'Equipo Tecnico' ? NAV_ADMIN_TECNICO : []),
    ...(role === 'Admin' ? NAV_ADMIN_ONLY : []),
  ]

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-slate-100">
        <h1 className="font-semibold text-slate-900 text-sm">Cielo Abierto</h1>
        <p className="text-xs text-slate-400 mt-0.5">Residencia NNyA</p>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-slate-100 text-slate-900 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-slate-900' : 'text-slate-400')} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-100">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 w-full transition-colors"
        >
          <LogOut className="h-4 w-4 text-slate-400" />
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
        <div className="flex min-h-screen bg-slate-50">
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
