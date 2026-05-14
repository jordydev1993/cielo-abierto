'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useTutores } from '@/hooks/tutores/useTutores'
import { useUpdateTutor } from '@/hooks/tutores/useUpdateTutor'
import { TutorForm } from '@/components/entities/tutores/TutorForm'
import { toast } from '@/components/ui/toaster'
import type { TutorFormValues } from '@/lib/validations/tutores.schema'

export default function EditarTutorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: tutores = [] } = useTutores()
  const mutation = useUpdateTutor()
  const tutor = tutores.find((t) => t.id === id)

  const handleSubmit = async (values: TutorFormValues) => {
    try {
      await mutation.mutateAsync({ id, values })
      toast({ title: 'Tutor actualizado', variant: 'success' })
      router.push('/tutores')
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  if (!tutor) return <div className="p-8 text-slate-500">Cargando...</div>

  return (
    <AccessGuard roles={['Admin', 'Equipo Tecnico']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 mb-6">
          Editar — {tutor.apellido}, {tutor.nombre}
        </h1>
        <TutorForm initialData={tutor} onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
