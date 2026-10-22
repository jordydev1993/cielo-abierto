'use client'
import { CalendarX, Clock, CheckCircle2 } from 'lucide-react'
import type { TurnoPersonal } from '@/types/database.types'

interface CoberturaResumenProps {
  turnos: TurnoPersonal[]
}

function Tile({ icon: Icon, label, count, color }: { icon: React.ElementType; label: string; count: number; color: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-container"><Icon className={`h-4 w-4 ${color}`} aria-hidden="true" /></span>
      <div>
        <p className="text-display font-semibold text-on-surface">{count}</p>
        <p className="text-small text-on-surface-variant">{label}</p>
      </div>
    </div>
  )
}

export function CoberturaResumen({ turnos }: CoberturaResumenProps) {
  const hoy = new Date().toISOString().split('T')[0]
  const en7dias = new Date()
  en7dias.setDate(en7dias.getDate() + 7)
  const limite = en7dias.toISOString().split('T')[0]

  const noCubiertosProximos = turnos.filter(
    (t) => t.estado === 'no_cubierto' && t.fecha >= hoy && t.fecha <= limite
  ).length
  const pendientesHoy = turnos.filter(
    (t) => t.fecha === hoy && (t.estado === 'planificado' || t.estado === 'en_curso')
  ).length
  const cerradosHoy = turnos.filter((t) => t.fecha === hoy && t.estado === 'cerrado').length

  return (
    <div className="grid grid-cols-1 gap-6 border-b border-filete pb-6 sm:grid-cols-3">
      <Tile icon={CalendarX} label="No cubiertos (próx. 7 días)" count={noCubiertosProximos} color="text-error" />
      <Tile icon={Clock} label="Pendientes hoy" count={pendientesHoy} color="text-tertiary" />
      <Tile icon={CheckCircle2} label="Cerrados hoy" count={cerradosHoy} color="text-exito" />
    </div>
  )
}
