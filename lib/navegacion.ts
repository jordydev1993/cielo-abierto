import {
  Users, User, FileText, LayoutGrid, BookOpen, Shield, UserCheck,
  AlertTriangle, CalendarClock, Siren, PartyPopper, Contact2,
  ClipboardCheck, KanbanSquare, UserCog, HeartHandshake, ScrollText, DoorOpen,
  FolderOpen, HandHeart, Activity, Stethoscope, Building2, Settings,
  type LucideIcon,
} from 'lucide-react'
import type { AppRole } from '@/context/AuthContext'

// Navegación agrupada (prompts/051 y 052). Los módulos, su orden y quién los ve son los
// mismos de siempre; solo se agrupan en secciones plegables.

export type GrupoId = 'nucleo' | 'tutela' | 'seguimiento' | 'salud' | 'institucional' | 'administracion'

// Quién ve el ítem: todos los usuarios con sesión, Admin o Equipo Tecnico, o solo Admin.
type Acceso = 'todos' | 'tecnico' | 'admin'

export interface ItemNav {
  href: string
  label: string
  icon: LucideIcon
  acceso: Acceso
}

export interface Grupo {
  id: GrupoId
  nombre: string
  icon: LucideIcon
  items: ItemNav[]
}

// Inicio va suelto, fuera de los grupos.
export const INICIO: ItemNav = { href: '/dashboard', label: 'Inicio', icon: LayoutGrid, acceso: 'todos' }

export const GRUPOS: Grupo[] = [
  {
    id: 'nucleo',
    nombre: 'Legajos y NNyA',
    icon: FolderOpen,
    items: [
      { href: '/nnya', label: 'NNyA', icon: Users, acceso: 'todos' },
      { href: '/legajos', label: 'Legajos', icon: BookOpen, acceso: 'todos' },
      { href: '/tutores', label: 'Tutores', icon: UserCheck, acceso: 'todos' },
    ],
  },
  {
    id: 'tutela',
    nombre: 'Tutela y retiros',
    icon: HandHeart,
    items: [
      { href: '/referentes', label: 'Referentes', icon: Contact2, acceso: 'todos' },
      { href: '/retiros', label: 'Retiros', icon: DoorOpen, acceso: 'todos' },
    ],
  },
  {
    id: 'seguimiento',
    nombre: 'Seguimiento',
    icon: Activity,
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
    icon: Stethoscope,
    items: [
      { href: '/informes', label: 'Informes', icon: FileText, acceso: 'tecnico' },
    ],
  },
  {
    id: 'institucional',
    nombre: 'Institucional',
    icon: Building2,
    items: [
      { href: '/evaluacion-institucional', label: 'Evaluación Institucional', icon: ClipboardCheck, acceso: 'tecnico' },
      { href: '/propuestas-mejora', label: 'Propuestas de Mejora', icon: KanbanSquare, acceso: 'tecnico' },
      { href: '/seguimiento-post-egreso', label: 'Seguimiento Post-Egreso', icon: HeartHandshake, acceso: 'tecnico' },
    ],
  },
  {
    id: 'administracion',
    nombre: 'Administración',
    icon: Settings,
    items: [
      { href: '/reportes-senaf', label: 'Informe SENAF', icon: ScrollText, acceso: 'admin' },
      { href: '/usuarios', label: 'Usuarios', icon: User, acceso: 'admin' },
      { href: '/roles', label: 'Roles', icon: Shield, acceso: 'admin' },
    ],
  },
]

// Favoritos (prompts/052, solo diseño): accesos fijos a rutas existentes; no se editan.
export const FAVORITOS: { href: string; label: string }[] = [
  { href: '/legajos', label: 'Legajos activos' },
  { href: '/retiros', label: 'Retiros en curso' },
  { href: '/alertas', label: 'Alertas pendientes' },
]

function puedeVer(acceso: Acceso, role: AppRole | null, loading: boolean): boolean {
  if (acceso === 'todos') return true
  if (loading) return false
  if (acceso === 'tecnico') return role === 'Admin' || role === 'Equipo Tecnico'
  return role === 'Admin'
}

// Grupos con los ítems que el rol puede ver; los grupos vacíos no se muestran.
export function gruposVisibles(role: AppRole | null, loading: boolean): Grupo[] {
  return GRUPOS
    .map((g) => ({ ...g, items: g.items.filter((i) => puedeVer(i.acceso, role, loading)) }))
    .filter((g) => g.items.length > 0)
}

// Favoritos que el rol puede abrir.
export function favoritosVisibles(role: AppRole | null, loading: boolean) {
  const todos = [INICIO, ...GRUPOS.flatMap((g) => g.items)]
  return FAVORITOS.filter((f) => {
    const item = todos.find((i) => i.href === f.href)
    return item ? puedeVer(item.acceso, role, loading) : false
  })
}

export function esRutaActiva(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))
}

// Grupo y módulo de la ruta actual, para la ruta de la barra superior.
export function ubicacion(pathname: string): { grupo: Grupo | null; item: ItemNav } {
  if (esRutaActiva(pathname, INICIO.href)) return { grupo: null, item: INICIO }
  for (const grupo of GRUPOS) {
    const item = grupo.items.find((i) => esRutaActiva(pathname, i.href))
    if (item) return { grupo, item }
  }
  return { grupo: null, item: INICIO }
}
