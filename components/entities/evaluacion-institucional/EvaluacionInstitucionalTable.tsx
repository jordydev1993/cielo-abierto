'use client'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { EvaluacionInstitucional } from '@/types/database.types'

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const ESTADO_VARIANT: Record<EvaluacionInstitucional['estado'], 'success' | 'secondary' | 'destructive'> = {
  convocada: 'secondary',
  realizada: 'success',
  cancelada: 'destructive',
}

const columns: Column<EvaluacionInstitucional>[] = [
  {
    key: 'periodo',
    header: 'Período',
    className: 'w-40',
    render: (r) => `${MESES[r.periodo_mes]} ${r.periodo_anio}`,
  },
  {
    key: 'fecha_reunion',
    header: 'Fecha de reunión',
    className: 'w-44',
    render: (r) => format(new Date(r.fecha_reunion), 'dd/MM/yyyy HH:mm', { locale: es }),
  },
  {
    key: 'estado',
    header: 'Estado',
    className: 'w-32',
    render: (r) => <Badge variant={ESTADO_VARIANT[r.estado]}>{r.estado}</Badge>,
  },
]

interface EvaluacionInstitucionalTableProps {
  data: EvaluacionInstitucional[]
  loading?: boolean
  onView?: (row: EvaluacionInstitucional) => void
}

export function EvaluacionInstitucionalTable({ data, loading, onView }: EvaluacionInstitucionalTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      extraActions={(row) =>
        onView ? (
          <Button variant="ghost" size="icon" onClick={() => onView(row)} title="Ver">
            <Eye className="h-4 w-4" />
          </Button>
        ) : null
      }
      emptyMessage="No hay evaluaciones institucionales registradas"
    />
  )
}
