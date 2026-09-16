'use client'

import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useCreateReferente } from '@/hooks/referentes/useCreateReferente'
import { ReferenteForm } from '@/components/entities/referentes/ReferenteForm'
import { toast } from '@/components/ui/toaster'
import type { ReferenteFormValues } from '@/lib/validations/referentes.schema'

export default function NuevoReferentePage() {
  const router = useRouter()
  const mutation = useCreateReferente()

  const handleSubmit = async (values: ReferenteFormValues) => {
    try {
      await mutation.mutateAsync(values)
      toast({ title: 'Referente registrado', variant: 'success' })
      router.push('/referentes')
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
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Registrar referente</h1>
        <ReferenteForm onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
