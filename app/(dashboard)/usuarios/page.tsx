'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useUsuarios } from '@/hooks/usuarios/useUsuarios'
import { useToggleUsuarioActivo } from '@/hooks/usuarios/useToggleUsuarioActivo'
import { UsuarioTable } from '@/components/entities/usuarios/UsuarioTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from '@/components/ui/toaster'
import type { Usuario } from '@/types/database.types'

export default function UsuariosPage() {
  const router = useRouter()
  const { data: usuarios = [], isLoading } = useUsuarios()
  const toggleMutation = useToggleUsuarioActivo()
  const [toToggle, setToToggle] = useState<Usuario | null>(null)

  const handleToggle = async () => {
    if (!toToggle) return
    try {
      await toggleMutation.mutateAsync({ id: toToggle.id, activo: !toToggle.activo })
      toast({ title: toToggle.activo ? 'Usuario desactivado' : 'Usuario activado', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setToToggle(null)
    }
  }

  return (
    <AccessGuard roles={['Admin']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Usuarios</h1>
            <p className="text-sm text-slate-500">{usuarios.length} usuarios registrados</p>
          </div>
          <Button onClick={() => router.push('/usuarios/nuevo')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo usuario
          </Button>
        </div>

        <UsuarioTable
          data={usuarios}
          loading={isLoading}
          onEdit={(u) => router.push(`/usuarios/${u.id}/editar`)}
          onToggleActivo={(u) => setToToggle(u)}
        />

        <ConfirmDialog
          open={!!toToggle}
          onOpenChange={(o) => !o && setToToggle(null)}
          title={toToggle?.activo ? '¿Desactivar usuario?' : '¿Activar usuario?'}
          description={`${toToggle?.nombre} ${toToggle?.apellido} ${toToggle?.activo ? 'ya no podrá ingresar al sistema' : 'podrá volver a ingresar al sistema'}.`}
          confirmLabel={toToggle?.activo ? 'Desactivar' : 'Activar'}
          variant={toToggle?.activo ? 'destructive' : 'default'}
          loading={toggleMutation.isPending}
          onConfirm={handleToggle}
        />
      </div>
    </AccessGuard>
  )
}
