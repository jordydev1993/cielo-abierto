'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import { useNnyas } from '@/hooks/nnya/useNnyas'
import { NnyaTable } from '@/components/entities/nnya/NnyaTable'
import type { Nnya } from '@/types/database.types'

export default function NnyaPage() {
  const router = useRouter()
  const { data: nnyas = [], isLoading } = useNnyas()
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? nnyas.filter((n) => {
        const q = search.toLowerCase()
        return (
          n.nombre.toLowerCase().includes(q) ||
          n.apellido.toLowerCase().includes(q) ||
          n.dni.includes(q)
        )
      })
    : nnyas

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">NNyA</h1>
          <p className="text-sm text-slate-500">{nnyas.length} registros</p>
        </div>
        <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
          <Button onClick={() => router.push('/nnya/nuevo')}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar NNyA
          </Button>
        </AccessGuard>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, apellido o DNI..."
          className="pl-9"
        />
      </div>

      <NnyaTable
        data={filtered}
        loading={isLoading}
        onEdit={(n) => router.push(`/nnya/${n.id}/editar`)}
        onView={(n) => router.push(`/nnya/${n.id}`)}
      />
    </div>
  )
}
