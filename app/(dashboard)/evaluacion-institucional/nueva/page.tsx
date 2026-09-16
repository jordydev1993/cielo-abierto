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
    <AccessGuard roles={['Admin']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Convocar evaluación institucional</h1>
        <EvaluacionInstitucionalForm onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
