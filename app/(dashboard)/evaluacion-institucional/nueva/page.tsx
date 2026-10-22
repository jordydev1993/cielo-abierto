'use client'

import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useCreateEvaluacionInstitucional } from '@/hooks/evaluacion-institucional/useCreateEvaluacionInstitucional'
import { EvaluacionInstitucionalForm } from '@/components/entities/evaluacion-institucional/EvaluacionInstitucionalForm'
import { toast } from '@/components/ui/toaster'
import type { EvaluacionInstitucionalFormValues } from '@/lib/validations/evaluacion-institucional.schema'

export default function NuevaEvaluacionInstitucionalPage() {
  const router = useRouter()
  const mutation = useCreateEvaluacionInstitucional()

  const handleSubmit = async (values: EvaluacionInstitucionalFormValues) => {
    try {
      const data = await mutation.mutateAsync(values)
      toast({ title: 'Evaluación convocada', variant: 'success' })
      router.push(`/evaluacion-institucional/${data.id}`)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <AccessGuard roles={['Admin']} fallback={<div className="p-8 text-on-surface-variant">Sin acceso</div>}>
      <div className="max-w-3xl px-8 py-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2.5 mb-3 text-on-surface-variant">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-title font-semibold text-on-surface mb-6">Convocar evaluación institucional</h1>
        <EvaluacionInstitucionalForm onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
