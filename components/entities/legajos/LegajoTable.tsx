'use client'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Legajo } from '@/types/database.types'

interface LegajoTableProps {
  data: Legajo[]
  loading?: boolean
  onEdit?: (row: Legajo) => void
  onCerrar?: (row: Legajo) => void
}

function estadoBadge(estado: Legajo['estado']) {
  const map = { activo: 'success', cerrado: 'secondary', archivado: 'outline' } as const
  return <Badge variant={map[estado]}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Badge>
}

const columns: Column<Legajo>[] = [
  { key: 'numero_legajo', header: 'N° Legajo', className: 'w-40 font-mono', render: (r) => r.numero_legajo },
  {
    key: 'nnya',
    header: 'NNyA',
    render: (r) => r.nnya
      ? <span>{(r.nnya as any).apellido}, {(r.nnya as any).nombre}</span>
      : <span className="text-slate-400">—</span>,
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
  { key: 'estado', header: 'Estado', className: 'w-28', render: (r) => estadoBadge(r.estado) },
]

export function LegajoTable({ data, loading, onEdit, onCerrar }: LegajoTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      onEdit={onEdit}
      emptyMessage="No hay legajos registrados"
    />
  )
}
