'use client'

import { AlertaList } from '@/components/entities/alertas/AlertaList'
import { useAlertasByNnya } from '@/hooks/alertas/useAlertasByNnya'

interface AlertasTabProps { nnyaId: string }

export function AlertasTab({ nnyaId }: AlertasTabProps) {
  const { data: alertas = [], isLoading } = useAlertasByNnya(nnyaId)
  if (isLoading) return <p className="text-sm text-slate-400 py-4 text-center">Cargando...</p>
  return <AlertaList alertas={alertas} />
}
