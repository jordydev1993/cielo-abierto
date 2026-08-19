'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Archive } from 'lucide-react'
import { useLegajo } from '@/hooks/legajos/useLegajo'
import { useUpdateLegajoDatos } from '@/hooks/legajos/useUpdateLegajo'
import { LegajoForm } from '@/components/entities/legajos/LegajoForm'
import { toast } from '@/components/ui/toaster'
import type { LegajoFormValues } from '@/lib/validations/legajos.schema'

export default function EditarLegajoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: legajo, isLoading } = useLegajo(id)
  const mutation = useUpdateLegajoDatos()

  const handleSubmit = async (values: LegajoFormValues) => {
    try {
      await mutation.mutateAsync({ id, values })
      toast({ title: 'Legajo actualizado', variant: 'success' })
      router.push(`/legajos/${id}`)
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' })
    }
  }

  if (isLoading) return <div className="p-8 text-slate-500">Cargando...</div>
  if (!legajo) return <div className="p-8 text-slate-500">Legajo no encontrado</div>

  return (
    <AccessGuard roles={['Admin', 'Equipo Tecnico']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>

        {legajo.estado !== 'activo' ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Archive className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
            <span>
              Este legajo se encuentra <strong>{legajo.estado}</strong> y no puede editarse.{' '}
              <button
                onClick={() => router.push(`/legajos/${id}`)}
                className="underline underline-offset-2 hover:text-slate-800"
              >
                Ver detalle
              </button>
            </span>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-slate-900 mb-6">
              Editar — Legajo {legajo.numero_legajo}
            </h1>
            <LegajoForm initialData={legajo} onSubmit={handleSubmit} loading={mutation.isPending} />
          </>
        )}
      </div>
    </AccessGuard>
  )
}
