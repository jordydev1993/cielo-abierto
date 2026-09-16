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
      fallback={<div className="p-8 text-slate-500">Sin acceso</div>}
    >
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Evaluación Institucional</h1>
            <p className="text-sm text-slate-500">{evaluaciones.length} evaluaciones</p>
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
