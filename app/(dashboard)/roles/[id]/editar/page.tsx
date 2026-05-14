'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useRoles } from '@/hooks/roles/useRoles'
import { useUpdateRol } from '@/hooks/roles/useUpdateRol'
import { RolForm } from '@/components/entities/roles/RolForm'
import { toast } from '@/components/ui/toaster'
import type { RolFormValues } from '@/lib/validations/roles.schema'

export default function EditarRolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: roles = [] } = useRoles()
  const mutation = useUpdateRol()
  const rol = roles.find((r) => r.id === id)

  const handleSubmit = async (values: RolFormValues) => {
    try {
      await mutation.mutateAsync({ id, values })
      toast({ title: 'Rol actualizado', variant: 'success' })
      router.push('/roles')
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  if (!rol) return <div className="p-8 text-slate-500">Cargando...</div>

  return (
    <AccessGuard roles={['Admin']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 max-w-lg">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Editar rol</h1>
        <RolForm initialData={rol} onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
