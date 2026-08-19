'use client'

import { AlertTriangle, FileText, CalendarClock, Activity, Pill, Gavel } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Incidente, Alerta, Turno, Informe, Diagnostico, Medicamento, AudienciaJudicial } from '@/types/database.types'

interface ResumenTabProps {
  incidentes: Incidente[]
  alertas: Alerta[]
  turnos: Turno[]
  informes: Informe[]
  diagnosticos: Diagnostico[]
  medicamentos: Medicamento[]
  audiencias: AudienciaJudicial[]
  onChangeTab: (tab: string) => void
}

function SectionCard({
  icon: Icon,
  title,
  count,
  tab,
  onChangeTab,
  children,
  color = 'slate',
}: {
  icon: React.ElementType
  title: string
  count: number
  tab: string
  onChangeTab: (tab: string) => void
  children: React.ReactNode
  color?: string
}) {
  const colorMap: Record<string, string> = {
    red: 'text-red-500',
    amber: 'text-amber-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    violet: 'text-violet-500',
    slate: 'text-slate-400',
  }
  return (
    <div className="border border-slate-100 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${colorMap[color]}`} />
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{count}</span>
        </div>
        <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => onChangeTab(tab)}>
          Ver todos →
        </Button>
      </div>
      {children}
    </div>
  )
}

export function ResumenTab({ incidentes, alertas, turnos, informes, diagnosticos, medicamentos, audiencias, onChangeTab }: ResumenTabProps) {
  const alertasPendientes = alertas.filter((a) => a.estado === 'pendiente' || a.estado === 'en_proceso')
  const turnosProximos = turnos.filter((t) => t.estado === 'programado' && new Date(t.fecha_hora) > new Date())
  const diagnosticosActivos = diagnosticos.filter((d) => d.estado !== 'resuelto')
  const medicamentosEnCurso = medicamentos.filter((m) => m.estado === 'en_curso')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Incidentes recientes */}
      <SectionCard icon={AlertTriangle} title="Incidentes" count={incidentes.length} tab="incidentes" onChangeTab={onChangeTab} color="red">
        {incidentes.length === 0 ? (
          <p className="text-xs text-slate-400">Sin incidentes registrados</p>
        ) : (
          <div className="space-y-1.5">
            {incidentes.slice(0, 3).map((inc) => (
              <div key={inc.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-700 truncate max-w-[160px]">{inc.tipo}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={inc.gravedad === 'critico' ? 'destructive' : inc.gravedad === 'grave' ? 'outline' : 'secondary'} className="text-[10px] py-0">
                    {inc.gravedad}
                  </Badge>
                  <span className="text-slate-400">{format(new Date(inc.fecha_hora), 'dd/MM', { locale: es })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Alertas activas */}
      <SectionCard icon={AlertTriangle} title="Alertas activas" count={alertasPendientes.length} tab="alertas" onChangeTab={onChangeTab} color="amber">
        {alertasPendientes.length === 0 ? (
          <p className="text-xs text-slate-400">Sin alertas pendientes</p>
        ) : (
          <div className="space-y-1.5">
            {alertasPendientes.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-700 truncate max-w-[160px]">{a.titulo}</span>
                <Badge variant={a.prioridad === 'critica' ? 'destructive' : 'outline'} className="text-[10px] py-0 shrink-0">
                  {a.prioridad}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Próximos turnos */}
      <SectionCard icon={CalendarClock} title="Turnos" count={turnos.length} tab="turnos" onChangeTab={onChangeTab} color="blue">
        {turnosProximos.length === 0 ? (
          <p className="text-xs text-slate-400">Sin turnos próximos</p>
        ) : (
          <div className="space-y-1.5">
            {turnosProximos.slice(0, 3).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-700 truncate max-w-[160px]">{t.tipo}</span>
                <span className="text-slate-400 shrink-0">{format(new Date(t.fecha_hora), 'dd/MM HH:mm', { locale: es })}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Salud */}
      <SectionCard icon={Activity} title="Salud" count={diagnosticosActivos.length + medicamentosEnCurso.length} tab="salud" onChangeTab={onChangeTab} color="green">
        {diagnosticosActivos.length === 0 && medicamentosEnCurso.length === 0 ? (
          <p className="text-xs text-slate-400">Sin registros de salud activos</p>
        ) : (
          <div className="space-y-1.5">
            {diagnosticosActivos.slice(0, 2).map((d) => (
              <div key={d.id} className="flex items-center gap-1.5 text-xs">
                <Activity className="h-3 w-3 text-green-400 shrink-0" />
                <span className="text-slate-700 truncate">{d.tipo}</span>
                <Badge className="text-[10px] py-0 bg-green-50 text-green-700 border-green-200 shrink-0">{d.estado.replace('_', ' ')}</Badge>
              </div>
            ))}
            {medicamentosEnCurso.slice(0, 2).map((m) => (
              <div key={m.id} className="flex items-center gap-1.5 text-xs">
                <Pill className="h-3 w-3 text-blue-400 shrink-0" />
                <span className="text-slate-700 truncate">{m.nombre}</span>
                <span className="text-slate-400 shrink-0">{m.dosis}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Documentos */}
      <SectionCard icon={FileText} title="Documentos" count={informes.length + audiencias.length} tab="documentos" onChangeTab={onChangeTab} color="violet">
        {informes.length === 0 && audiencias.length === 0 ? (
          <p className="text-xs text-slate-400">Sin documentos registrados</p>
        ) : (
          <div className="space-y-1.5">
            {informes.slice(0, 2).map((i) => (
              <div key={i.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-700 truncate max-w-[160px]">{i.titulo}</span>
                <Badge variant={i.estado === 'finalizado' ? 'success' : 'outline'} className="text-[10px] py-0 shrink-0">
                  {i.estado === 'finalizado' ? 'Enviado' : 'Borrador'}
                </Badge>
              </div>
            ))}
            {audiencias.slice(0, 2).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 truncate max-w-[160px]">
                  <Gavel className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="text-slate-700 truncate">{a.tipo}</span>
                </div>
                <span className="text-slate-400 shrink-0">{format(new Date(a.fecha_hora), 'dd/MM', { locale: es })}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
