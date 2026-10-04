'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MESES } from '@/lib/reportes/senaf'
import type { PeriodoSenafValues } from '@/lib/validations/reporte-senaf.schema'

interface GenerarReporteFormProps {
  onSubmit: (values: PeriodoSenafValues) => void
  loading?: boolean
}

// Por defecto propone el mes anterior, que es el que normalmente se informa.
function mesAnterior() {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return { mes: d.getMonth() + 1, anio: d.getFullYear() }
}

export function GenerarReporteForm({ onSubmit, loading }: GenerarReporteFormProps) {
  const inicial = mesAnterior()
  const [mes, setMes] = useState(String(inicial.mes))
  const [anio, setAnio] = useState(String(inicial.anio))
  const anioActual = new Date().getFullYear()
  const anios = [anioActual, anioActual - 1, anioActual - 2]

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ mes: Number(mes), anio: Number(anio) })
      }}
    >
      <FormField label="Mes" className="w-44">
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {MESES.map((m, i) => (
              <SelectItem key={m} value={String(i + 1)}>
                <span className="capitalize">{m}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Año" className="w-28">
        <Select value={anio} onValueChange={setAnio}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {anios.map((a) => (
              <SelectItem key={a} value={String(a)}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <Button type="submit" disabled={loading}>
        {loading ? 'Generando borrador…' : 'Generar borrador'}
      </Button>
    </form>
  )
}
