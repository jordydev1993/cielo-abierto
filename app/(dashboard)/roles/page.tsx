'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useRoles } from '@/hooks/roles/useRoles'
import { useDeleteRol } from '@/hooks/roles/useDeleteRol'
import { RolTable } from '@/components/entities/roles/RolTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from '@/components/ui/toaster'
import type { Rol } from '@/types/database.types'

export default function RolesPage() {
  const router = useRouter()
  const { data: roles = [], isLoading } = useRoles()
  const deleteMutation = useDeleteRol()
  const [toDelete, setToDelete] = useState<Rol | null>(null)

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await deleteMutation.mutateAsync(toDelete.id)
      toast({ title: 'Rol eliminado', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Error al eliminar', description: e.message, variant: 'destructive' })
    } finally {
      setToDelete(null)
    }
  }

  return (
    <AccessGuard roles={['Admin']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Roles</h1>
            <p className="text-sm text-slate-500">{roles.length} roles registrados</p>
          </div>
          <Button onClick={() => router.push('/roles/nuevo')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo rol
          </Button>
        </div>

        <RolTable
          data={roles}
          loading={isLoading}
          onEdit={(r) => router.push(`/roles/${r.id}/editar`)}
          onDelete={(r) => setToDelete(r)}
        />

        <ConfirmDialog
          open={!!toDelete}
          onOpenChange={(o) => !o && setToDelete(null)}
          title="¿Eliminar rol?"
          description={`Esto eliminará permanentemente el rol "${toDelete?.nombre}". Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
        />
      </div>
    </AccessGuard>
  )
}
