'use client'

import { StatRow } from '@/components/shared/KPICard'
import { Panel } from '@/components/shared/Panel'
import { GraficoBarras } from '@/components/charts/GraficoBarras'
import { BarrasProgreso } from '@/components/charts/BarrasProgreso'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useIncidentes } from '@/hooks/incidentes/useIncidentes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Search, Download, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Incidente } from '@/types/database.types'

type FiltroGravedad = 'todos' | Incidente['gravedad']
type FiltroEstado = 'todos' | Incidente['estado']

function GravedadBadge({ gravedad }: { gravedad: Incidente['gravedad'] }) {
  if (gravedad === 'critico') return <Badge variant="destructive">Crítico</Badge>
  if (gravedad === 'grave') return <Badge className="bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/30">Grave</Badge>
  if (gravedad === 'media') return <Badge variant="outline">Media</Badge>
  return <Badge variant="secondary">Leve</Badge>
}

function exportCSV(data: any[]) {
  const headers = ['Fecha', 'NNyA', 'Tipo', 'Gravedad', 'Estado', 'Legajo']
  const rows = data.map((i) => [
    format(new Date(i.fecha_hora), 'dd/MM/yyyy HH:mm'),
    i.nnya ? `${i.nnya.apellido} ${i.nnya.nombre}` : '',
    i.tipo,
    i.gravedad,
    i.estado,
    i.legajo?.numero_legajo ?? '',
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `incidentes_${format(new Date(), 'yyyyMMdd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function IncidentesPage() {
  const router = useRouter()
  const { data: incidentes = [], isLoading } = useIncidentes()
  const [filtroGravedad, setFiltroGravedad] = useState<FiltroGravedad>('todos')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    return incidentes.filter((i) => {
      if (filtroGravedad !== 'todos' && i.gravedad !== filtroGravedad) return false
      if (filtroEstado !== 'todos' && i.estado !== filtroEstado) return false
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase()
        const enNnya = i.nnya ? `${i.nnya.nombre} ${i.nnya.apellido}`.toLowerCase().includes(q) : false
        const enTipo = i.tipo.toLowerCase().includes(q)
        const enDesc = i.descripcion.toLowerCase().includes(q)
        if (!enNnya && !enTipo && !enDesc) return false
      }
      return true
    })
  }, [incidentes, filtroGravedad, filtroEstado, busqueda])

  // Data para gráficos
  const porTipo = useMemo(() => {
    const counts: Record<string, number> = {}
    incidentes.forEach((i) => { counts[i.tipo] = (counts[i.tipo] ?? 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(' / ', '/'), value })).sort((a, b) => b.value - a.value)
  }, [incidentes])

  const porGravedad = useMemo(() => {
    const counts: Record<string, number> = { leve: 0, media: 0, grave: 0, critico: 0 }
    incidentes.forEach((i) => { counts[i.gravedad] = (counts[i.gravedad] ?? 0) + 1 })
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
  }, [incidentes])

  return (
    <div className="px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title font-semibold text-on-surface">Incidentes</h1>
          <p className="text-sm text-on-surface-variant">Vista global de todos los incidentes registrados en el sistema.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportCSV(filtrados)}>
          <Download className="h-4 w-4 mr-1.5" />Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="border-b border-filete pb-6">
        <StatRow
          stats={[
            { id: 'total', label: 'Total', valor: incidentes.length },
            { id: 'criticos', label: 'Críticos', valor: incidentes.filter((i) => i.gravedad === 'critico').length },
            { id: 'graves', label: 'Graves', valor: incidentes.filter((i) => i.gravedad === 'grave').length },
            { id: 'abiertos', label: 'Abiertos', valor: incidentes.filter((i) => i.estado === 'abierto').length },
          ]}
        />
      </div>

      {/* Gráficos (prompts/052): barras por tipo y parte de cada gravedad sobre el total. */}
      {incidentes.length > 0 && (
        <div className="grid grid-cols-1 divide-y divide-filete border-b border-filete md:grid-cols-2 md:divide-x md:divide-y-0">
          <Panel title="Por tipo" className="pb-6 md:pr-6">
            <GraficoBarras
              datos={porTipo.map((t) => ({ etiqueta: t.name, valor: t.value }))}
              color="var(--color-serie-1)"
              unidad="incidentes"
              descripcion="Incidentes por tipo"
            />
          </Panel>
          <Panel title="Por gravedad" className="py-6 md:py-0 md:pb-6 md:pl-6">
            <BarrasProgreso
              datos={porGravedad.map((g) => ({ etiqueta: g.name, valor: g.value }))}
              relleno="bg-serie-1"
              descripcion="Parte de cada gravedad sobre el total de incidentes"
            />
          </Panel>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filtroGravedad} onValueChange={(v) => setFiltroGravedad(v as FiltroGravedad)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Gravedad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las gravedades</SelectItem>
            <SelectItem value="critico">Crítico</SelectItem>
            <SelectItem value="grave">Grave</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="leve">Leve</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as FiltroEstado)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="abierto">Abierto</SelectItem>
            <SelectItem value="en_seguimiento">En seguimiento</SelectItem>
            <SelectItem value="cerrado">Cerrado</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por NNyA, tipo o descripción..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-outline-variant rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <p className="text-sm text-outline py-8 text-center">Cargando incidentes...</p>
      ) : filtrados.length === 0 ? (
        <div className="py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-outline mx-auto mb-2" />
          <p className="text-sm text-outline">No hay incidentes que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="border border-outline-variant rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-on-surface-variant">Fecha</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-on-surface-variant">NNyA</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-on-surface-variant">Tipo</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-on-surface-variant">Gravedad</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-on-surface-variant">Estado</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-on-surface-variant">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtrados.map((inc) => (
                <tr key={inc.id} className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                    {format(new Date(inc.fecha_hora), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-on-surface">
                    {inc.nnya ? `${inc.nnya.apellido}, ${inc.nnya.nombre}` : '—'}
                    {inc.legajo && <span className="ml-1.5 text-xs text-outline">{inc.legajo.numero_legajo}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{inc.tipo}</td>
                  <td className="px-4 py-3"><GravedadBadge gravedad={inc.gravedad} /></td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-on-surface-variant">{inc.estado.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inc.legajo_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => router.push(`/legajos/${inc.legajo_id}?tab=incidentes`)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />Ver legajo
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 bg-surface-container-low border-t border-outline-variant text-xs text-outline">
            {filtrados.length} incidente{filtrados.length !== 1 ? 's' : ''} mostrado{filtrados.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
