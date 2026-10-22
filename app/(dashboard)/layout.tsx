'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import { ChevronDown, ChevronsUpDown, CircleHelp, LogOut, Search, Star } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  INICIO, esRutaActiva, favoritosVisibles, gruposVisibles, ubicacion, type GrupoId,
} from '@/lib/navegacion'
import { useAlertasPendientesCount } from '@/hooks/alertas/useAlertasPendientesCount'
import { useNotificacionesPropuestasCount } from '@/hooks/propuestas-mejora/useNotificacionesPropuestasCount'

function Contador({ count }: { count: number | undefined }) {
  if (!count) return null
  return (
    <span className="ml-auto min-w-5 rounded-full bg-error px-1.5 text-center text-caption font-semibold leading-5 text-on-error">
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

const enlace = 'flex min-h-9 items-center gap-2.5 rounded-md px-2.5 text-body text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:-outline-offset-2'
const enlaceActivo = 'bg-surface-container font-semibold text-on-surface'

// Barra lateral clara (prompts/052): buscador y favoritos (solo diseño), Inicio y grupos
// plegables con los mismos módulos y filtros por rol de siempre.
function Sidebar() {
  const pathname = usePathname()
  const { role, loading, signOut } = useAuth()
  const grupos = gruposVisibles(role, loading)
  const favoritos = favoritosVisibles(role, loading)
  const actual = ubicacion(pathname).grupo?.id
  const [abiertos, setAbiertos] = useState<Partial<Record<GrupoId | 'favoritos', boolean>>>({ favoritos: true })
  const abierto = (id: GrupoId | 'favoritos') => abiertos[id] ?? id === actual
  const alternar = (id: GrupoId | 'favoritos') => setAbiertos((a) => ({ ...a, [id]: !abierto(id) }))

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-filete bg-surface-container-low">
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-small font-bold text-white" aria-hidden="true">A</span>
        <div className="leading-tight">
          <p className="text-body font-semibold text-on-surface">Argüello Infancias</p>
          <p className="text-caption text-outline">Residencia NNyA</p>
        </div>
      </div>

      <div className="px-3 pb-2">
        {/* Buscador ⌘K: solo diseño (prompts/052). No busca todavía. */}
        <button
          type="button"
          disabled
          title="Próximamente"
          className="flex h-9 w-full cursor-not-allowed items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest px-2.5 text-body text-outline"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Buscar
          <kbd className="ml-auto rounded border border-outline-variant px-1 font-sans text-caption">⌘K</kbd>
          <span className="sr-only">(próximamente)</span>
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3" aria-label="Módulos">
        {favoritos.length > 0 && (
          <div>
            <button type="button" onClick={() => alternar('favoritos')} aria-expanded={abierto('favoritos')} className={cn(enlace, 'w-full')}>
              <Star className="h-4 w-4 shrink-0" aria-hidden="true" />
              Favoritos
              <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', !abierto('favoritos') && '-rotate-90')} aria-hidden="true" />
            </button>
            {abierto('favoritos') && (
              <ul className="mb-2 mt-0.5 space-y-0.5 pl-6">
                {favoritos.map((f) => (
                  <li key={f.href}>
                    <Link href={f.href} className={cn(enlace, 'min-h-8 text-small')}>{f.label}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="my-2 border-t border-filete" />

        <Link
          href={INICIO.href}
          aria-current={esRutaActiva(pathname, INICIO.href) ? 'page' : undefined}
          className={cn(enlace, esRutaActiva(pathname, INICIO.href) && enlaceActivo)}
        >
          <INICIO.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {INICIO.label}
        </Link>

        {grupos.map((grupo) => (
          <div key={grupo.id}>
            <button type="button" onClick={() => alternar(grupo.id)} aria-expanded={abierto(grupo.id)} className={cn(enlace, 'w-full', actual === grupo.id && 'text-on-surface')}>
              <grupo.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {grupo.nombre}
              <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', !abierto(grupo.id) && '-rotate-90')} aria-hidden="true" />
            </button>
            {abierto(grupo.id) && (
              <ul className="mb-1 mt-0.5 space-y-0.5 pl-6">
                {grupo.items.map(({ href, label }) => {
                  const activo = esRutaActiva(pathname, href)
                  return (
                    <li key={href}>
                      <Link href={href} aria-current={activo ? 'page' : undefined} className={cn(enlace, 'min-h-8 text-small', activo && enlaceActivo)}>
                        {label}
                        {href === '/alertas' && <AlertasBadge />}
                        {href === '/propuestas-mejora' && <PropuestasBadge />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-filete p-3">
        <Cuenta onSignOut={signOut} />
      </div>
    </aside>
  )
}

function iniciales(email: string | undefined) {
  if (!email) return '·'
  const [nombre] = email.split('@')
  const partes = nombre.split(/[._-]/).filter(Boolean)
  return (partes.length > 1 ? partes[0][0] + partes[1][0] : nombre.slice(0, 2)).toUpperCase()
}

// Cuenta al pie de la barra lateral (prompts/054): avatar, email y rol, con un menú que
// tiene "Cerrar sesión". No se agregan opciones que el sistema no tiene.
function Cuenta({ onSignOut }: { onSignOut: () => void }) {
  const { user, role } = useAuth()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest p-2 text-left transition-colors hover:bg-surface-container-low focus-visible:outline-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-caption font-semibold text-white" aria-hidden="true">
          {iniciales(user?.email)}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-small font-medium text-on-surface">{user?.email}</span>
          <span className="block text-caption text-outline">{role}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-outline" aria-hidden="true" />
        <span className="sr-only">Abrir el menú de la cuenta</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width)">
        <DropdownMenuLabel>
          <span className="block truncate font-medium text-on-surface">{user?.email}</span>
          {role}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onSignOut()}>
          <LogOut className="h-4 w-4 text-outline" aria-hidden="true" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Barra superior: dónde estás (grupo / módulo) y ayuda (solo diseño). La cuenta está al
// pie de la barra lateral (prompts/054).
function BarraSuperior() {
  const pathname = usePathname()
  const { grupo, item } = ubicacion(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-filete px-8">
      <nav aria-label="Ruta" className="flex items-center gap-2 text-body">
        {grupo && <span className="text-outline">{grupo.nombre}</span>}
        {grupo && <span className="text-outline-variant" aria-hidden="true">/</span>}
        <span className="font-semibold text-on-surface">{item.label}</span>
      </nav>
      <div className="ml-auto flex items-center gap-4">
        <button type="button" disabled title="Próximamente" className="flex cursor-not-allowed items-center gap-1.5 text-body text-outline">
          <CircleHelp className="h-4 w-4" aria-hidden="true" />
          Ayuda
          <span className="sr-only">(próximamente)</span>
        </button>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {/* La app vive en un marco blanco redondeado sobre el fondo gris (prompts/052). */}
        <div className="h-screen overflow-hidden bg-surface p-3">
          <div className="flex h-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <BarraSuperior />
              {/* `relative`: los textos sr-only (posición absoluta) quedan dentro del área con scroll
                  y no estiran la página (corte del marco al bajar, 22/10). */}
              <main className="relative flex-1 overflow-auto">{children}</main>
            </div>
          </div>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  )
}
