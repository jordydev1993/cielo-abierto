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
    <AccessGuard roles={['Admin', 'Equipo Tecnico']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Registrar tutor / familiar</h1>
        <TutorForm onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
