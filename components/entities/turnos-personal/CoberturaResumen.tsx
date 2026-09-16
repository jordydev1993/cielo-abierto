'use client'
import { CalendarX, Clock, CheckCircle2 } from 'lucide-react'
import type { TurnoPersonal } from '@/types/database.types'

interface CoberturaResumenProps {
  turnos: TurnoPersonal[]
}

function Tile({ icon: Icon, label, count, color }: { icon: React.ElementType; label: string; count: number; color: string }) {
  return (
    <div className="border border-slate-100 rounded-lg p-4 flex items-center gap-3">
      <Icon className={`h-5 w-5 ${color}`} />
      <div>
        <p className="text-xl font-semibold text-slate-900">{count}</p>
        <p className="text-xs text-slate-500">{label}</p>
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Tile icon={CalendarX} label="No cubiertos (próx. 7 días)" count={noCubiertosProximos} color="text-red-500" />
      <Tile icon={Clock} label="Pendientes hoy" count={pendientesHoy} color="text-amber-500" />
      <Tile icon={CheckCircle2} label="Cerrados hoy" count={cerradosHoy} color="text-green-500" />
    </div>
  )
}
