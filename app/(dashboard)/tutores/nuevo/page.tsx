'use client'

import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useCreateTutor } from '@/hooks/tutores/useCreateTutor'
import { TutorForm } from '@/components/entities/tutores/TutorForm'
import { toast } from '@/components/ui/toaster'
import type { TutorFormValues } from '@/lib/validations/tutores.schema'

export default function NuevoTutorPage() {
  const router = useRouter()
  const mutation = useCreateTutor()

  const handleSubmit = async (values: TutorFormValues) => {
    try {
      await mutation.mutateAsync(values)
      toast({ title: 'Tutor registrado', variant: 'success' })
      router.push('/tutores')
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <AccessGuard roles={['Admin', 'Equipo Tecnico']} fallback={<div className="p-8 text-on-surface-variant">Sin acceso</div>}>
      <div className="max-w-3xl px-8 py-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2.5 mb-3 text-on-surface-variant">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-title font-semibold text-on-surface mb-6">Registrar tutor / familiar</h1>
        <TutorForm onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
