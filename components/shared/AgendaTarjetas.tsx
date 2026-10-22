'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export type EstadoEvento = 'pendiente' | 'cumplido' | 'cancelado'

export interface EventoAgenda {
  id: string
  fecha: string
  esHoy: boolean
  desde: string
  hasta: string
  que: string
  nnya: string
  tipo: string
  estado: EstadoEvento
  href: string
}

const PESTANAS: { id: EstadoEvento; label: string; vacio: string }[] = [
  { id: 'pendiente', label: 'Pendientes', vacio: 'No hay eventos pendientes.' },
  { id: 'cumplido', label: 'Cumplidos', vacio: 'Todavía no hay eventos cumplidos.' },
  { id: 'cancelado', label: 'Cancelados', vacio: 'No hay eventos cancelados.' },
]

const INSIGNIA: Record<EstadoEvento, { variant: 'secondary' | 'success' | 'destructive'; texto: string }> = {
  pendiente: { variant: 'secondary', texto: 'Pendiente' },
  cumplido: { variant: 'success', texto: 'Cumplido' },
  cancelado: { variant: 'destructive', texto: 'Cancelado' },
}

// Fecha fija a mediodía UTC: el día de la semana no depende de la zona horaria (evita
// diferencias entre el servidor y el navegador).
function partes(fecha: string) {
  const d = new Date(`${fecha}T12:00:00Z`)
  return {
    dia: new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: 'UTC' }).format(d).replace('.', ''),
    numero: d.getUTCDate(),
    completo: new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(d),
  }
}

function Tarjeta({ e }: { e: EventoAgenda }) {
  const f = partes(e.fecha)
  const insignia = INSIGNIA[e.estado]
  return (
    <li>
      <Link
        href={e.href}
        className={cn(
          'flex items-stretch gap-4 rounded-lg border bg-surface-container-lowest p-3 transition-colors hover:bg-surface-container-low focus-visible:outline-2',
          e.esHoy ? 'border-on-surface-variant' : 'border-outline-variant'
        )}
      >
        <div className="flex w-12 shrink-0 flex-col items-center justify-center text-center">
          <span className="text-caption capitalize text-on-surface-variant">{f.dia}</span>
          <span className="text-title font-semibold leading-tight text-on-surface">{f.numero}</span>
          <span className="sr-only">{f.completo}{e.esHoy ? ' (hoy)' : ''}</span>
        </div>
        <div className="w-px shrink-0 bg-filete" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium text-on-surface">{e.que}</p>
          <p className="mt-0.5 text-small tabular-nums text-on-surface-variant">
            {e.desde} – {e.hasta} · {e.tipo}
            {e.nnya !== '—' && <> · {e.nnya}</>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {e.esHoy && <span className="text-caption font-medium text-on-surface">Hoy</span>}
          <Badge variant={insignia.variant}>{insignia.texto}</Badge>
        </div>
      </Link>
    </li>
  )
}

// Agenda en tarjetas con la fecha grande (prompts/054): pestañas por estado, eventos
// ordenados por fecha y hora, cada uno enlaza al módulo donde se gestiona.
export function AgendaTarjetas({ eventos }: { eventos: EventoAgenda[] }) {
  const ordenados = [...eventos].sort((a, b) => `${a.fecha} ${a.desde}`.localeCompare(`${b.fecha} ${b.desde}`))
  return (
    <Tabs defaultValue="pendiente">
      <TabsList aria-label="Estado de los eventos">
        {PESTANAS.map((p) => (
          <TabsTrigger key={p.id} value={p.id}>
            {p.label}
            <span className="ml-1.5 text-caption text-outline">{ordenados.filter((e) => e.estado === p.id).length}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {PESTANAS.map((p) => {
        const lista = ordenados.filter((e) => e.estado === p.id)
        return (
          <TabsContent key={p.id} value={p.id}>
            {lista.length === 0 ? (
              <p className="py-8 text-center text-body text-outline">{p.vacio}</p>
            ) : (
              <ul className="space-y-2">
                {lista.map((e) => <Tarjeta key={e.id} e={e} />)}
              </ul>
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
