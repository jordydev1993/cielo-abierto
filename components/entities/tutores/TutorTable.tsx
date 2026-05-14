'use client'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import type { Tutor } from '@/types/database.types'

interface TutorTableProps {
  data: Tutor[]
  loading?: boolean
  onEdit: (row: Tutor) => void
  onDelete: (row: Tutor) => void
}

const columns: Column<Tutor>[] = [
  {
    key: 'nombre',
    header: 'Tutor/Familiar',
    render: (r) => (
      <div>
        <p className="font-medium">{r.apellido}, {r.nombre}</p>
        <p className="text-xs text-slate-500">DNI: {r.dni}</p>
      </div>
    ),
  },
  { key: 'parentesco', header: 'Parentesco', className: 'w-36', render: (r) => r.parentesco },
  { key: 'telefono', header: 'Teléfono', className: 'w-36', render: (r) => r.telefono ?? <span className="text-slate-400">—</span> },
  { key: 'email', header: 'Email', render: (r) => r.email ?? <span className="text-slate-400">—</span> },
  {
    key: 'activo',
    header: 'Estado',
    className: 'w-24',
    render: (r) => <Badge variant={r.activo ? 'success' : 'secondary'}>{r.activo ? 'Activo' : 'Inactivo'}</Badge>,
  },
]

export function TutorTable({ data, loading, onEdit, onDelete }: TutorTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      onEdit={onEdit}
      onDelete={onDelete}
      emptyMessage="No hay tutores/familiares registrados"
    />
  )
}
