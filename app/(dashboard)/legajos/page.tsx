'use client'

import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useLegajos } from '@/hooks/legajos/useLegajos'
import { useAlertas } from '@/hooks/alertas/useAlertas'
import { LegajoTable } from '@/components/entities/legajos/LegajoTable'

export default function LegajosPage() {
  const router = useRouter()
  const { data: legajos = [], isLoading } = useLegajos()
  const { data: alertas = [] } = useAlertas()
  const nnyaConIncidentePendiente = new Set(
    alertas
      .filter((a) => a.tipo === 'incidente' && (a.estado === 'pendiente' || a.estado === 'en_proceso'))
      .map((a) => a.nnya_id),
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-on-surface">Legajos</h1>
          <p className="text-sm text-on-surface-variant">{legajos.length} legajos</p>
        </div>
        <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
          <Button onClick={() => router.push('/legajos/nuevo')}>
            <Plus className="h-4 w-4 mr-2" />
            Abrir legajo
          </Button>
        </AccessGuard>
      </div>

      <LegajoTable
        data={legajos}
        loading={isLoading}
        onView={(row) => router.push(`/legajos/${row.id}`)}
        nnyaConIncidentePendiente={nnyaConIncidentePendiente}
      />
    </div>
  )
}
