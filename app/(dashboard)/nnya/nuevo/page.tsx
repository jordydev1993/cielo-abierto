'use client'

import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useCreateNnya } from '@/hooks/nnya/useCreateNnya'
import { NnyaForm } from '@/components/entities/nnya/NnyaForm'
import { toast } from '@/components/ui/toaster'
import type { NnyaFormValues } from '@/lib/validations/nnya.schema'

export default function NuevoNnyaPage() {
  const router = useRouter()
  const mutation = useCreateNnya()

  const handleSubmit = async (values: NnyaFormValues) => {
    try {
      await mutation.mutateAsync(values)
      toast({ title: 'NNyA registrado', variant: 'success' })
      router.push('/nnya')
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <AccessGuard roles={['Admin', 'Equipo Tecnico']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Registrar NNyA</h1>
        <NnyaForm onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
