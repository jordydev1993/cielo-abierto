'use client'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Nnya } from '@/types/database.types'

interface NnyaTableProps {
  data: Nnya[]
  loading?: boolean
  onEdit: (row: Nnya) => void
  onView: (row: Nnya) => void
}

function estadoBadge(estado: Nnya['estado_actual']) {
  const map = {
    'En residencia': 'success',
    'En proceso de egreso': 'warning',
    'Egresado': 'secondary',
    'Fallecido': 'destructive',
  } as const
  return <Badge variant={map[estado]}>{estado}</Badge>
}

const columns: Column<Nnya>[] = [
  {
    key: 'nombre',
    header: 'NNyA',
    render: (r) => (
      <div>
        <p className="font-medium">{r.apellido}, {r.nombre}</p>
        <p className="text-xs text-slate-500">DNI: {r.dni}</p>
      </div>
    ),
  },
  {
    key: 'fecha_nacimiento',
    header: 'Fecha nac.',
    className: 'w-32',
    render: (r) => {
      try {
        return format(new Date(r.fecha_nacimiento + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })
      } catch {
        return r.fecha_nacimiento
      }
    },
  },
  {
    key: 'estado_actual',
    header: 'Estado',
    className: 'w-44',
    render: (r) => estadoBadge(r.estado_actual),
  },
  {
    key: 'activo',
    header: 'Activo',
    className: 'w-20',
    render: (r) => (
      <Badge variant={r.activo ? 'success' : 'secondary'}>{r.activo ? 'Sí' : 'No'}</Badge>
    ),
  },
]

export function NnyaTable({ data, loading, onEdit, onView }: NnyaTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      onEdit={onEdit}
      emptyMessage="No hay NNyA registrados"
    />
  )
}
