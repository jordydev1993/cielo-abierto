'use client'
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { SeguimientoPostEgreso } from '@/types/database.types'

interface ReinsercionResumenProps {
  seguimientos: SeguimientoPostEgreso[]
}

function Tile({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="border border-slate-100 rounded-lg p-4 flex items-center gap-3">
      <Icon className={`h-5 w-5 ${color}`} />
      <div>
        <p className="text-xl font-semibold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Tile icon={Clock} label="Pendientes vencidos" value={String(pendientesVencidos)} color="text-red-500" />
      <Tile icon={AlertTriangle} label="Requieren intervención" value={String(requierenIntervencion)} color="text-amber-500" />
      <Tile icon={CheckCircle2} label="Contacto efectivo" value={pctEfectivo === null ? '—' : `${pctEfectivo}%`} color="text-green-500" />
    </div>
  )
}
