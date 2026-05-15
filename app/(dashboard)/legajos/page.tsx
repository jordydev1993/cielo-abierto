'use client'

import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useLegajos } from '@/hooks/legajos/useLegajos'
import { LegajoTable } from '@/components/entities/legajos/LegajoTable'

export default function LegajosPage() {
  const router = useRouter()
  const { data: legajos = [], isLoading } = useLegajos()

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Legajos</h1>
          <p className="text-sm text-slate-500">{legajos.length} legajos</p>
        </div>
        <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
          <Button onClick={() => router.push('/legajos/nuevo')}>
            <Plus className="h-4 w-4 mr-2" />
            Abrir legajo
          </Button>
        </AccessGuard>
      </div>

      <LegajoTable
        data={legajos}
        loading={isLoading}
        onEdit={(row) => router.push(`/legajos/${row.id}`)}
      />
    </div>
  )
}
