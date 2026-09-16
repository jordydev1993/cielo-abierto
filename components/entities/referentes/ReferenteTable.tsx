'use client'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useUltimaValidacionRenaper } from '@/hooks/referentes/useUltimaValidacionRenaper'
import type { Referente } from '@/types/database.types'

const TIPO_LABEL: Record<Referente['tipo'], string> = {
  familiar: 'Familiar', educador: 'Educador', vecino: 'Vecino', otro: 'Otro',
}

function UltimaValidacionCell({ referenteId }: { referenteId: string }) {
  const { data } = useUltimaValidacionRenaper(referenteId)
  if (!data) return <span className="text-slate-400">Sin validar</span>
  const label = format(new Date(data.consultado_at), 'dd/MM/yyyy', { locale: es })
  const variant = data.resultado === 'aprobado' ? 'success' : data.resultado === 'rechazado' ? 'destructive' : 'secondary'
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-600">{label}</span>
      <Badge variant={variant}>{data.resultado.replace('_', ' ')}</Badge>
    </div>
  )
}

const columns: Column<Referente>[] = [
  {
    key: 'nombre',
    header: 'Nombre',
    render: (r) => <span>{r.apellido}, {r.nombre}</span>,
  },
  { key: 'dni', header: 'DNI', className: 'w-32 font-mono', render: (r) => r.dni },
  { key: 'tipo', header: 'Tipo', className: 'w-28', render: (r) => TIPO_LABEL[r.tipo] },
  { key: 'telefono', header: 'Teléfono', className: 'w-32', render: (r) => r.telefono || <span className="text-slate-400">—</span> },
  {
    key: 'activo',
    header: 'Estado',
    className: 'w-24',
    render: (r) => <Badge variant={r.activo ? 'success' : 'secondary'}>{r.activo ? 'Activo' : 'Inactivo'}</Badge>,
  },
  {
    key: 'renaper',
    header: 'Última validación RENAPER',
    className: 'w-56',
    render: (r) => <UltimaValidacionCell referenteId={r.id} />,
  },
]

interface ReferenteTableProps {
  data: Referente[]
  loading?: boolean
  onEdit?: (row: Referente) => void
  onValidarRenaper?: (row: Referente) => void
}

export function ReferenteTable({ data, loading, onEdit, onValidarRenaper }: ReferenteTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      onEdit={onEdit}
      extraActions={(row) =>
        onValidarRenaper ? (
          <Button variant="ghost" size="icon" onClick={() => onValidarRenaper(row)} title="Validar RENAPER">
            <ShieldCheck className="h-4 w-4" />
          </Button>
        ) : null
      }
      emptyMessage="No hay referentes registrados"
    />
  )
}
