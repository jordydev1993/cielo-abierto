'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useInformes } from '@/hooks/informes/useInformes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Search, Download, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Informe } from '@/types/database.types'

type FiltroEstado = 'todos' | Informe['estado']
type FiltroTipo = 'todos' | string

const TIPOS = ['Psicosocial', 'Médico', 'Educativo', 'Judicial', 'Egreso', 'Seguimiento', 'Otro']

function EstadoBadge({ estado }: { estado: Informe['estado'] }) {
  if (estado === 'finalizado') return <Badge variant="success">Enviado</Badge>
  if (estado === 'revisado') return <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Revisado</Badge>
  return <Badge variant="outline">Borrador</Badge>
}

function exportCSV(data: any[]) {
  const headers = ['Fecha', 'Título', 'Tipo', 'NNyA', 'Legajo', 'Estado']
  const rows = data.map((i) => [
    format(new Date(i.fecha_informe + 'T00:00:00'), 'dd/MM/yyyy'),
    i.titulo,
    i.tipo,
    i.nnya ? `${i.nnya.apellido} ${i.nnya.nombre}` : '',
    i.legajo?.numero_legajo ?? '',
    i.estado === 'finalizado' ? 'Enviado' : i.estado,
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `informes_${format(new Date(), 'yyyyMMdd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function InformesPage() {
  const router = useRouter()
  const { data: informes = [], isLoading } = useInformes()
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    return informes.filter((i) => {
      if (filtroEstado !== 'todos' && i.estado !== filtroEstado) return false
      if (filtroTipo !== 'todos' && i.tipo !== filtroTipo) return false
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase()
        const enNnya = i.nnya ? `${i.nnya.nombre} ${i.nnya.apellido}`.toLowerCase().includes(q) : false
        const enTitulo = i.titulo.toLowerCase().includes(q)
        const enLegajo = i.legajo?.numero_legajo?.toLowerCase().includes(q) ?? false
        if (!enNnya && !enTitulo && !enLegajo) return false
      }
      return true
    })
  }, [informes, filtroEstado, filtroTipo, busqueda])

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Informes</h1>
          <p className="text-sm text-slate-500">Vista global de todos los informes institucionales generados.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportCSV(filtrados)}>
          <Download className="h-4 w-4 mr-1.5" />Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: informes.length },
          { label: 'Enviados', value: informes.filter((i) => i.estado === 'finalizado').length },
          { label: 'Borradores', value: informes.filter((i) => i.estado === 'borrador').length },
        ].map(({ label, value }) => (
          <div key={label} className="border border-slate-100 rounded-lg p-3 bg-white">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as FiltroEstado)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="finalizado">Enviados</SelectItem>
            <SelectItem value="revisado">Revisados</SelectItem>
            <SelectItem value="borrador">Borradores</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por NNyA, título o legajo..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <p className="text-sm text-slate-400 py-8 text-center">Cargando informes...</p>
      ) : filtrados.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No hay informes que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="border border-slate-100 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Título</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">NNyA</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtrados.map((inf) => (
                <tr key={inf.id} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {format(new Date(inf.fecha_informe + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 max-w-[200px] truncate">{inf.titulo}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{inf.tipo}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {inf.nnya ? `${inf.nnya.apellido}, ${inf.nnya.nombre}` : '—'}
                    {inf.legajo && <span className="ml-1.5 text-xs text-slate-400">{inf.legajo.numero_legajo}</span>}
                  </td>
                  <td className="px-4 py-3"><EstadoBadge estado={inf.estado} /></td>
                  <td className="px-4 py-3 text-right">
                    {inf.legajo?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => router.push(`/legajos/${inf.legajo!.id}?tab=documentos`)}
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
            {filtrados.length} informe{filtrados.length !== 1 ? 's' : ''} mostrado{filtrados.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
