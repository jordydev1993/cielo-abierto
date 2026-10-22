'use client'

import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useEvaluacionesInstitucionales } from '@/hooks/evaluacion-institucional/useEvaluacionesInstitucionales'
import { EvaluacionInstitucionalTable } from '@/components/entities/evaluacion-institucional/EvaluacionInstitucionalTable'

export default function EvaluacionInstitucionalPage() {
  const router = useRouter()
  const { data: evaluaciones = [], isLoading } = useEvaluacionesInstitucionales()

  return (
    <AccessGuard
      roles={['Admin', 'Equipo Tecnico']}
      fallback={<div className="p-8 text-on-surface-variant">Sin acceso</div>}
    >
      <div className="px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title font-semibold text-on-surface">Evaluación Institucional</h1>
            <p className="text-sm text-on-surface-variant">{evaluaciones.length} evaluaciones</p>
          </div>
          <AccessGuard roles={['Admin']}>
            <Button onClick={() => router.push('/evaluacion-institucional/nueva')}>
              <Plus className="h-4 w-4 mr-2" />
              Convocar evaluación
            </Button>
          </AccessGuard>
        </div>

        <EvaluacionInstitucionalTable
          data={evaluaciones}
          loading={isLoading}
          onView={(e) => router.push(`/evaluacion-institucional/${e.id}`)}
        />
      </div>
    </AccessGuard>
  )
}
