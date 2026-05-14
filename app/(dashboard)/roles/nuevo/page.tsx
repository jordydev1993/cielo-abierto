'use client'

import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useCreateRol } from '@/hooks/roles/useCreateRol'
import { RolForm } from '@/components/entities/roles/RolForm'
import { toast } from '@/components/ui/toaster'
import type { RolFormValues } from '@/lib/validations/roles.schema'

export default function NuevoRolPage() {
  const router = useRouter()
  const mutation = useCreateRol()

  const handleSubmit = async (values: RolFormValues) => {
    try {
      await mutation.mutateAsync(values)
      toast({ title: 'Rol creado', variant: 'success' })
      router.push('/roles')
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <AccessGuard roles={['Admin']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 max-w-lg">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 -ml-2">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Nuevo rol</h1>
        <RolForm onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
