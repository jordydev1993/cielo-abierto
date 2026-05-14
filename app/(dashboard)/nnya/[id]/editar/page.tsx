'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useNnya } from '@/hooks/nnya/useNnya'
import { useUpdateNnya } from '@/hooks/nnya/useUpdateNnya'
import { NnyaForm } from '@/components/entities/nnya/NnyaForm'
import { toast } from '@/components/ui/toaster'
import type { NnyaFormValues } from '@/lib/validations/nnya.schema'

export default function EditarNnyaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: nnya, isLoading } = useNnya(id)
  const mutation = useUpdateNnya()

  const handleSubmit = async (values: NnyaFormValues) => {
    try {
      await mutation.mutateAsync({ id, values })
      toast({ title: 'NNyA actualizado', variant: 'success' })
      router.push('/nnya')
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  if (isLoading) return <div className="p-8 text-slate-500">Cargando...</div>
  if (!nnya) return <div className="p-8 text-slate-500">NNyA no encontrado</div>

  return (
    <AccessGuard roles={['Admin', 'Equipo Tecnico']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 mb-6">
          Editar — {nnya.apellido}, {nnya.nombre}
        </h1>
        <NnyaForm initialData={nnya} onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
