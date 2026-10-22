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
    <AccessGuard roles={['Admin']} fallback={<div className="p-8 text-on-surface-variant">Sin acceso</div>}>
      <div className="max-w-3xl px-8 py-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 -ml-2">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <h1 className="text-title font-semibold text-on-surface mb-6">Nuevo rol</h1>
        <RolForm onSubmit={handleSubmit} loading={mutation.isPending} />
      </div>
    </AccessGuard>
  )
}
