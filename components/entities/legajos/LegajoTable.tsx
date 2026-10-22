'use client'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Legajo } from '@/types/database.types'

interface LegajoTableProps {
  data: Legajo[]
  loading?: boolean
  onView?: (row: Legajo) => void
  // NNyA con una alerta de incidente sin resolver: se marca "Incidente pendiente" (prompts/037)
  nnyaConIncidentePendiente?: Set<string>
}

function estadoBadge(estado: Legajo['estado']) {
  const map = { activo: 'success', cerrado: 'secondary', archivado: 'outline' } as const
  return <Badge variant={map[estado]}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Badge>
}

const buildColumns = (nnyaConIncidentePendiente?: Set<string>): Column<Legajo>[] => [
  { key: 'numero_legajo', header: 'N° Legajo', className: 'w-40 font-mono', render: (r) => r.numero_legajo },
  {
    key: 'nnya',
    header: 'NNyA',
    render: (r) => r.nnya
      ? <span>{(r.nnya as any).apellido}, {(r.nnya as any).nombre}</span>
      : <span className="text-outline">—</span>,
  },
  {
    key: 'fecha_apertura',
    header: 'Apertura',
    className: 'w-32',
    render: (r) => {
      try {
        return format(new Date(r.fecha_apertura + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })
      } catch {
        return r.fecha_apertura
      }
    },
  },
  {
    key: 'estado',
    header: 'Estado',
    className: 'w-48',
    render: (r) => (
      <div className="flex items-center gap-1.5 flex-wrap">
        {estadoBadge(r.estado)}
        {nnyaConIncidentePendiente?.has(r.nnya_id) && (
          <Badge className="bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/30">Incidente pendiente</Badge>
        )}
      </div>
    ),
  },
]

export function LegajoTable({ data, loading, onView, nnyaConIncidentePendiente }: LegajoTableProps) {
  return (
    <DataTable
      columns={buildColumns(nnyaConIncidentePendiente)}
      data={data}
      loading={loading}
      extraActions={(row) =>
        onView ? (
          <Button variant="ghost" size="icon" onClick={() => onView(row)} title="Ver">
            <Eye className="h-4 w-4" />
          </Button>
        ) : null
      }
      emptyMessage="No hay legajos registrados"
    />
  )
}
