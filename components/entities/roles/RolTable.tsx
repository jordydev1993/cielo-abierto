'use client'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import type { Rol } from '@/types/database.types'

interface RolTableProps {
  data: Rol[]
  loading?: boolean
  onEdit: (row: Rol) => void
  onDelete: (row: Rol) => void
}

const columns: Column<Rol>[] = [
  { key: 'nombre', header: 'Nombre', render: (r) => <span className="font-medium">{r.nombre}</span> },
  { key: 'descripcion', header: 'Descripción', render: (r) => r.descripcion ?? <span className="text-slate-400">—</span> },
  { key: 'activo', header: 'Estado', className: 'w-24', render: (r) => (
    <Badge variant={r.activo ? 'success' : 'secondary'}>{r.activo ? 'Activo' : 'Inactivo'}</Badge>
  )},
]

export function RolTable({ data, loading, onEdit, onDelete }: RolTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      onEdit={onEdit}
      onDelete={onDelete}
      emptyMessage="No hay roles registrados"
    />
  )
}
