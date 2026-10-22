import {
  Users, User, FileText, Home, BookOpen, Shield, UserCheck,
  AlertTriangle, CalendarClock, Siren, PartyPopper, Contact2,
  ClipboardCheck, KanbanSquare, UserCog, HeartHandshake, ScrollText, DoorOpen,
  type LucideIcon,
} from 'lucide-react'
import type { AppRole } from '@/context/AuthContext'

// Navegación agrupada por área de la residencia (prompts/051). Los módulos, su orden y
// quién los ve son los mismos que antes; solo se agrupan y cada área tiene su color.

export type AreaId = 'nucleo' | 'tutela' | 'seguimiento' | 'salud' | 'institucional' | 'administracion'

// Quién ve el ítem: todos los usuarios con sesión, Admin o Equipo Tecnico, o solo Admin.
type Acceso = 'todos' | 'tecnico' | 'admin'

export interface ItemNav {
  href: string
  label: string
  icon: LucideIcon
  acceso: Acceso
}

export interface Area {
  id: AreaId
  nombre: string
  // Clases estáticas para que Tailwind las genere.
  fondo: string
  items: ItemNav[]
}

export const AREAS: Area[] = [
  {
    id: 'nucleo',
    nombre: 'Núcleo',
    fondo: 'bg-area-nucleo',
    items: [
      { href: '/dashboard', label: 'Inicio', icon: Home, acceso: 'todos' },
      { href: '/nnya', label: 'NNyA', icon: Users, acceso: 'todos' },
      { href: '/legajos', label: 'Legajos', icon: BookOpen, acceso: 'todos' },
      { href: '/tutores', label: 'Tutores', icon: UserCheck, acceso: 'todos' },
    ],
  },
  {
    id: 'tutela',
    nombre: 'Tutela y retiros',
    fondo: 'bg-area-tutela',
    items: [
      { href: '/referentes', label: 'Referentes', icon: Contact2, acceso: 'todos' },
      { href: '/retiros', label: 'Retiros', icon: DoorOpen, acceso: 'todos' },
    ],
  },
  {
    id: 'seguimiento',
    nombre: 'Seguimiento',
    fondo: 'bg-area-seguimiento',
    items: [
      { href: '/incidentes', label: 'Incidentes', icon: Siren, acceso: 'tecnico' },
      { href: '/alertas', label: 'Alertas', icon: AlertTriangle, acceso: 'tecnico' },
      { href: '/turnos', label: 'Turnos', icon: CalendarClock, acceso: 'tecnico' },
      { href: '/turnos-personal', label: 'Turnos de Personal', icon: UserCog, acceso: 'tecnico' },
      { href: '/actividades', label: 'Actividades', icon: PartyPopper, acceso: 'tecnico' },
    ],
  },
  {
    id: 'salud',
    nombre: 'Salud',
    fondo: 'bg-area-salud',
    items: [
      { href: '/informes', label: 'Informes', icon: FileText, acceso: 'tecnico' },
    ],
  },
  {
    id: 'institucional',
    nombre: 'Institucional',
    fondo: 'bg-area-institucional',
    items: [
      { href: '/evaluacion-institucional', label: 'Evaluación Institucional', icon: ClipboardCheck, acceso: 'tecnico' },
      { href: '/propuestas-mejora', label: 'Propuestas de Mejora', icon: KanbanSquare, acceso: 'tecnico' },
      { href: '/seguimiento-post-egreso', label: 'Seguimiento Post-Egreso', icon: HeartHandshake, acceso: 'tecnico' },
    ],
  },
  {
    id: 'administracion',
    nombre: 'Administración',
    fondo: 'bg-area-administracion',
    items: [
      { href: '/reportes-senaf', label: 'Informe SENAF', icon: ScrollText, acceso: 'admin' },
      { href: '/usuarios', label: 'Usuarios', icon: User, acceso: 'admin' },
      { href: '/roles', label: 'Roles', icon: Shield, acceso: 'admin' },
    ],
  },
]

function puedeVer(acceso: Acceso, role: AppRole | null, loading: boolean): boolean {
  if (acceso === 'todos') return true
  if (loading) return false
  if (acceso === 'tecnico') return role === 'Admin' || role === 'Equipo Tecnico'
  return role === 'Admin'
}

// Áreas con los ítems que el rol puede ver; las áreas que quedan vacías no se muestran.
export function areasVisibles(role: AppRole | null, loading: boolean): Area[] {
  return AREAS
    .map((area) => ({ ...area, items: area.items.filter((i) => puedeVer(i.acceso, role, loading)) }))
    .filter((area) => area.items.length > 0)
}

export function esRutaActiva(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))
}

// Área y módulo de la ruta actual, para el cartel. Las rutas fuera del menú caen en Núcleo.
export function ubicacion(pathname: string): { area: Area; item: ItemNav } {
  for (const area of AREAS) {
    const item = area.items.find((i) => esRutaActiva(pathname, i.href))
    if (item) return { area, item }
  }
  return { area: AREAS[0], item: AREAS[0].items[0] }
}
