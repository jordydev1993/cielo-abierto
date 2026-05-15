'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { KPICard } from '@/components/shared/KPICard'
import { Users, BookOpen, AlertTriangle } from 'lucide-react'

function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const supabase = createClient()
      const [nnya, legajos, alertas] = await Promise.all([
        supabase.from('nnya').select('id', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('legajos').select('id', { count: 'exact', head: true }).eq('estado', 'activo'),
        supabase.from('alertas').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      ])
      return {
        nnya: nnya.count ?? 0,
        legajos: legajos.count ?? 0,
        alertas: alertas.count ?? 0,
      }
    },
  })
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboardStats()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-on-surface">Panel principal</h2>
        <p className="text-sm text-on-surface-variant mt-1">Resumen del sistema de gestión.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="NNyA activos"
          value={isLoading ? '—' : data?.nnya ?? 0}
          icon={<Users className="h-5 w-5 text-primary" />}
          variant="primary"
        />
        <KPICard
          label="Legajos activos"
          value={isLoading ? '—' : data?.legajos ?? 0}
          icon={<BookOpen className="h-5 w-5 text-on-secondary-container" />}
          variant="secondary"
        />
        <KPICard
          label="Alertas pendientes"
          value={isLoading ? '—' : data?.alertas ?? 0}
          icon={<AlertTriangle className="h-5 w-5 text-on-error-container" />}
          variant="error"
        />
      </div>
    </div>
  )
}
