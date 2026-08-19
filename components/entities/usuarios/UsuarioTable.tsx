'use client'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserCheck, UserX } from 'lucide-react'
import type { Usuario } from '@/types/database.types'

interface UsuarioTableProps {
  data: Usuario[]
  loading?: boolean
  onEdit: (row: Usuario) => void
  onToggleActivo: (row: Usuario) => void
}

const columns: Column<Usuario>[] = [
  {
    key: 'nombre',
    header: 'Usuario',
    render: (r) => (
      <div>
        <p className="font-medium">{r.apellido}, {r.nombre}</p>
        <p className="text-xs text-slate-500">{r.email}</p>
      </div>
    ),
  },
  {
    key: 'rol',
    header: 'Rol',
    className: 'w-40',
    render: (r) => (r.roles as any)?.nombre ?? '—',
  },
  {
    key: 'telefono',
    header: 'Teléfono',
    className: 'w-36',
    render: (r) => r.telefono ?? <span className="text-slate-400">—</span>,
  },
  {
    key: 'activo',
    header: 'Estado',
    className: 'w-24',
    render: (r) => (
      <Badge variant={r.activo ? 'success' : 'secondary'}>{r.activo ? 'Activo' : 'Inactivo'}</Badge>
    ),
  },
]

export function UsuarioTable({ data, loading, onEdit, onToggleActivo }: UsuarioTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      onEdit={onEdit}
      extraActions={(row) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleActivo(row)}
          title={row.activo ? 'Desactivar' : 'Activar'}
          className={row.activo
            ? 'text-slate-500 hover:text-red-600 hover:bg-red-50'
            : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
          }
        >
          {row.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
        </Button>
      )}
      emptyMessage="No hay usuarios registrados"
    />
  )
}
