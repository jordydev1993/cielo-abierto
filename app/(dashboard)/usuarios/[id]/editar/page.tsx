'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useUsuarios } from '@/hooks/usuarios/useUsuarios'
import { useUpdateUsuario } from '@/hooks/usuarios/useUpdateUsuario'
import { UsuarioForm } from '@/components/entities/usuarios/UsuarioForm'
import { toast } from '@/components/ui/toaster'
import type { UsuarioUpdateValues } from '@/lib/validations/usuarios.schema'

export default function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: usuarios = [] } = useUsuarios()
  const mutation = useUpdateUsuario()
  const usuario = usuarios.find((u) => u.id === id)

  const handleSubmit = async (values: UsuarioUpdateValues) => {
    try {
      await mutation.mutateAsync({ id, values })
      toast({ title: 'Usuario actualizado', variant: 'success' })
      router.push('/usuarios')
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  if (!usuario) return <div className="p-8 text-slate-500">Cargando...</div>

  return (
    <AccessGuard roles={['Admin']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Editar usuario</h1>
        <UsuarioForm initialData={usuario} onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
