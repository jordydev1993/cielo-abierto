'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import { useTutores } from '@/hooks/tutores/useTutores'
import { useDeleteTutor } from '@/hooks/tutores/useDeleteTutor'
import { TutorTable } from '@/components/entities/tutores/TutorTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from '@/components/ui/toaster'
import type { Tutor } from '@/types/database.types'

export default function TutoresPage() {
  const router = useRouter()
  const { data: tutores = [], isLoading } = useTutores()
  const deleteMutation = useDeleteTutor()
  const [toDelete, setToDelete] = useState<Tutor | null>(null)
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? tutores.filter((t) => {
        const q = search.toLowerCase()
        return (
          t.nombre.toLowerCase().includes(q) ||
          t.apellido.toLowerCase().includes(q) ||
          t.dni.includes(q)
        )
      })
    : tutores

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await deleteMutation.mutateAsync(toDelete.id)
      toast({ title: 'Tutor eliminado', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Error al eliminar', description: e.message, variant: 'destructive' })
    } finally {
      setToDelete(null)
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
            <h1 className="text-xl font-semibold text-slate-900">Tutores / Familiares</h1>
            <p className="text-sm text-slate-500">{tutores.length} registros</p>
          </div>
          <Button onClick={() => router.push('/tutores/nuevo')}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar tutor
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

        <TutorTable
          data={filtered}
          loading={isLoading}
          onEdit={(t) => router.push(`/tutores/${t.id}/editar`)}
          onDelete={(t) => setToDelete(t)}
        />

        <ConfirmDialog
          open={!!toDelete}
          onOpenChange={(o) => !o && setToDelete(null)}
          title="¿Eliminar tutor?"
          description={`Se eliminará a ${toDelete?.nombre} ${toDelete?.apellido}. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
        />
      </div>
    </AccessGuard>
  )
}
