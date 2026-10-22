'use client'

import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useCreateUsuario } from '@/hooks/usuarios/useCreateUsuario'
import { UsuarioForm } from '@/components/entities/usuarios/UsuarioForm'
import { toast } from '@/components/ui/toaster'
import type { UsuarioCreateValues } from '@/lib/validations/usuarios.schema'

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const mutation = useCreateUsuario()

  const handleSubmit = async (values: UsuarioCreateValues) => {
    try {
      await mutation.mutateAsync(values)
      toast({ title: 'Usuario creado', variant: 'success' })
      router.push('/usuarios')
    } catch (e: any) {
      toast({ title: 'Error al crear usuario', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <AccessGuard roles={['Admin']} fallback={<div className="p-8 text-on-surface-variant">Sin acceso</div>}>
      <div className="max-w-3xl px-8 py-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2.5 mb-3 text-on-surface-variant">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-title font-semibold text-on-surface mb-6">Nuevo usuario</h1>
        <UsuarioForm onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
