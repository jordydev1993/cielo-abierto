'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useIncidentes } from '@/hooks/incidentes/useIncidentes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Search, Download, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Incidente } from '@/types/database.types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

type FiltroGravedad = 'todos' | Incidente['gravedad']
type FiltroEstado = 'todos' | Incidente['estado']

const GRAVEDAD_COLORS: Record<string, string> = {
  leve: '#94a3b8',
  media: '#f59e0b',
  grave: '#f97316',
  critico: '#ef4444',
}

function GravedadBadge({ gravedad }: { gravedad: Incidente['gravedad'] }) {
  if (gravedad === 'critico') return <Badge variant="destructive">Crítico</Badge>
  if (gravedad === 'grave') return <Badge className="bg-orange-100 text-orange-700 border border-orange-200">Grave</Badge>
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
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value, color: GRAVEDAD_COLORS[name] }))
  }, [incidentes])

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Incidentes</h1>
          <p className="text-sm text-slate-500">Vista global de todos los incidentes registrados en el sistema.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportCSV(filtrados)}>
          <Download className="h-4 w-4 mr-1.5" />Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: incidentes.length, color: 'slate' },
          { label: 'Críticos', value: incidentes.filter((i) => i.gravedad === 'critico').length, color: 'red' },
          { label: 'Graves', value: incidentes.filter((i) => i.gravedad === 'grave').length, color: 'orange' },
          { label: 'Abiertos', value: incidentes.filter((i) => i.estado === 'abierto').length, color: 'amber' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-slate-100 rounded-lg p-3 bg-white">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={cn('text-2xl font-bold mt-0.5', color === 'red' && 'text-red-600', color === 'orange' && 'text-orange-500', color === 'amber' && 'text-amber-500', color === 'slate' && 'text-slate-900')}>{value}</p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      {incidentes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-100 rounded-lg p-4 bg-white">
            <p className="text-xs font-semibold text-slate-700 mb-3">Por tipo</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={porTipo} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="border border-slate-100 rounded-lg p-4 bg-white">
            <p className="text-xs font-semibold text-slate-700 mb-3">Por gravedad</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={porGravedad} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {porGravedad.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por NNyA, tipo o descripción..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <p className="text-sm text-slate-400 py-8 text-center">Cargando incidentes...</p>
      ) : filtrados.length === 0 ? (
        <div className="py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No hay incidentes que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="border border-slate-100 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">NNyA</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Gravedad</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtrados.map((inc) => (
                <tr key={inc.id} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {format(new Date(inc.fecha_hora), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {inc.nnya ? `${inc.nnya.apellido}, ${inc.nnya.nombre}` : '—'}
                    {inc.legajo && <span className="ml-1.5 text-xs text-slate-400">{inc.legajo.numero_legajo}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{inc.tipo}</td>
                  <td className="px-4 py-3"><GravedadBadge gravedad={inc.gravedad} /></td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500">{inc.estado.replace('_', ' ')}</span>
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
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
            {filtrados.length} incidente{filtrados.length !== 1 ? 's' : ''} mostrado{filtrados.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
