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
      toast({ title: 'Error al abrir legajo', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <AccessGuard roles={['Admin', 'Equipo Tecnico']} fallback={<div className="p-8 text-on-surface-variant">Sin acceso</div>}>
      <div className="max-w-3xl px-8 py-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2.5 mb-3 text-on-surface-variant">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-title font-semibold text-on-surface mb-6">Abrir legajo</h1>
        <LegajoForm onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
