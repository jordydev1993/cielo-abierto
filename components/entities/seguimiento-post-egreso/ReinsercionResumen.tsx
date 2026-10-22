'use client'
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { SeguimientoPostEgreso } from '@/types/database.types'

interface ReinsercionResumenProps {
  seguimientos: SeguimientoPostEgreso[]
}

function Tile({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-container"><Icon className={`h-4 w-4 ${color}`} aria-hidden="true" /></span>
      <div>
        <p className="text-display font-semibold text-on-surface">{value}</p>
        <p className="text-small text-on-surface-variant">{label}</p>
      </div>
    </div>
  )
}

export function ReinsercionResumen({ seguimientos }: ReinsercionResumenProps) {
  const hoy = new Date().toISOString().split('T')[0]
  const pendientesVencidos = seguimientos.filter((s) => !s.contacto_realizado && s.fecha_programada <= hoy).length
  const requierenIntervencion = seguimientos.filter((s) => s.requiere_intervencion).length
  const contactados = seguimientos.filter((s) => s.contacto_realizado)
  const efectivos = contactados.filter((s) => s.contacto_efectivo).length
  const pctEfectivo = contactados.length > 0 ? Math.round((efectivos / contactados.length) * 100) : null

  return (
    <div className="grid grid-cols-1 gap-6 border-b border-filete pb-6 sm:grid-cols-3">
      <Tile icon={Clock} label="Pendientes vencidos" value={String(pendientesVencidos)} color="text-error" />
      <Tile icon={AlertTriangle} label="Requieren intervención" value={String(requierenIntervencion)} color="text-tertiary" />
      <Tile icon={CheckCircle2} label="Contacto efectivo" value={pctEfectivo === null ? '—' : `${pctEfectivo}%`} color="text-exito" />
    </div>
  )
}
