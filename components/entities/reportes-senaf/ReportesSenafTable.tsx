'use client'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { tituloPeriodo } from '@/lib/reportes/senaf'
import type { ReporteSenaf } from '@/types/database.types'

const columns: Column<ReporteSenaf>[] = [
  {
    key: 'periodo',
    header: 'Período',
    className: 'w-44',
    render: (r) => tituloPeriodo(r.periodo_mes, r.periodo_anio),
  },
  { key: 'version', header: 'Versión', className: 'w-20', render: (r) => r.version },
  {
    key: 'origen',
    header: 'Borrador',
    className: 'w-28',
    render: (r) => (r.origen_borrador === 'ia' ? 'Con IA' : 'Plantilla'),
  },
  {
    key: 'estado',
    header: 'Estado',
    className: 'w-28',
    render: (r) => (
      <Badge variant={r.estado === 'aprobado' ? 'success' : 'secondary'}>
        {r.estado === 'aprobado' ? 'Aprobado' : 'Borrador'}
      </Badge>
    ),
  },
  {
    key: 'generado',
    header: 'Generado',
    render: (r) =>
      `${format(new Date(r.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}${
        r.generador ? ` por ${r.generador.nombre} ${r.generador.apellido}` : ''
      }`,
  },
]

interface ReportesSenafTableProps {
  data: ReporteSenaf[]
  loading?: boolean
  onView: (row: ReporteSenaf) => void
}

export function ReportesSenafTable({ data, loading, onView }: ReportesSenafTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      extraActions={(row) => (
        <Button variant="ghost" size="icon" onClick={() => onView(row)} title="Ver">
          <Eye className="h-4 w-4" />
        </Button>
      )}
      emptyMessage="Todavía no se generó ningún informe"
    />
  )
}
