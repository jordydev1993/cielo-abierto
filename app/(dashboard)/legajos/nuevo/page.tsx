'use client'

import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useCreateLegajo } from '@/hooks/legajos/useCreateLegajo'
import { LegajoForm } from '@/components/entities/legajos/LegajoForm'
import { toast } from '@/components/ui/toaster'
import type { LegajoFormValues } from '@/lib/validations/legajos.schema'

export default function NuevoLegajoPage() {
  const router = useRouter()
  const mutation = useCreateLegajo()

  const handleSubmit = async (values: LegajoFormValues) => {
    try {
      await mutation.mutateAsync(values)
      toast({ title: 'Legajo abierto', variant: 'success' })
      router.push('/legajos')
    } catch (e: any) {
      const msg = e.message?.includes('uq_legajo_activo_por_nnya')
        ? 'Este NNyA ya tiene un legajo activo'
        : e.message
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  return (
    <AccessGuard roles={['Admin', 'Equipo Tecnico']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Abrir legajo</h1>
        <LegajoForm onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
