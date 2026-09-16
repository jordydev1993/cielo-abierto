'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useReferentes } from '@/hooks/referentes/useReferentes'
import { useUpdateReferente } from '@/hooks/referentes/useUpdateReferente'
import { ReferenteForm } from '@/components/entities/referentes/ReferenteForm'
import { toast } from '@/components/ui/toaster'
import type { ReferenteFormValues } from '@/lib/validations/referentes.schema'

export default function EditarReferentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: referentes = [] } = useReferentes()
  const mutation = useUpdateReferente()
  const referente = referentes.find((r) => r.id === id)

  const handleSubmit = async (values: ReferenteFormValues) => {
    try {
      await mutation.mutateAsync({ id, values })
      toast({ title: 'Referente actualizado', variant: 'success' })
      router.push('/referentes')
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  if (!referente) return <div className="p-8 text-slate-500">Cargando...</div>

  return (
    <AccessGuard roles={['Admin', 'Equipo Tecnico']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 mb-6">
          Editar — {referente.apellido}, {referente.nombre}
        </h1>
        <ReferenteForm initialData={referente} onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
