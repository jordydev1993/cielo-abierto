'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Search } from 'lucide-react'
import { useReferentes } from '@/hooks/referentes/useReferentes'
import { useCreateValidacionRenaper } from '@/hooks/referentes/useCreateValidacionRenaper'
import { ReferenteTable } from '@/components/entities/referentes/ReferenteTable'
import { ValidarRenaperForm } from '@/components/entities/referentes/ValidarRenaperForm'
import { toast } from '@/components/ui/toaster'
import type { Referente } from '@/types/database.types'
import type { ValidacionRenaperFormValues } from '@/lib/validations/validaciones-renaper.schema'

export default function ReferentesPage() {
  const router = useRouter()
  const { data: referentes = [], isLoading } = useReferentes()
  const crearValidacion = useCreateValidacionRenaper()
  const [search, setSearch] = useState('')
  const [aValidar, setAValidar] = useState<Referente | null>(null)

  const filtered = search.trim()
    ? referentes.filter((r) => {
        const q = search.toLowerCase()
        return (
          r.nombre.toLowerCase().includes(q) ||
          r.apellido.toLowerCase().includes(q) ||
          r.dni.includes(q)
        )
      })
    : referentes

  const handleValidar = async (values: ValidacionRenaperFormValues) => {
    if (!aValidar) return
    try {
      await crearValidacion.mutateAsync({ referenteId: aValidar.id, values })
      toast({ title: 'Validación registrada', variant: 'success' })
      setAValidar(null)
    } catch (e: any) {
      toast({ title: 'Error al registrar la validación', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <AccessGuard
      roles={['Admin', 'Equipo Tecnico']}
      fallback={<div className="p-8 text-slate-500">Sin acceso</div>}
    >
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Referentes</h1>
            <p className="text-sm text-slate-500">{referentes.length} registros</p>
          </div>
          <Button onClick={() => router.push('/referentes/nuevo')}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar referente
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o DNI..."
            className="pl-9"
          />
        </div>

        <ReferenteTable
          data={filtered}
          loading={isLoading}
          onEdit={(r) => router.push(`/referentes/${r.id}/editar`)}
          onValidarRenaper={(r) => setAValidar(r)}
        />

        <Dialog open={!!aValidar} onOpenChange={(o) => !o && setAValidar(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Validar RENAPER — {aValidar?.apellido}, {aValidar?.nombre}</DialogTitle>
            </DialogHeader>
            {aValidar && (
              <ValidarRenaperForm
                referente={aValidar}
                onSubmit={handleValidar}
                onCancel={() => setAValidar(null)}
                loading={crearValidacion.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AccessGuard>
  )
}
