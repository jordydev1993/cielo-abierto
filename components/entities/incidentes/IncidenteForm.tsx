'use client'
import { useRef, useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { incidenteSchema, type IncidenteFormValues } from '@/lib/validations/incidentes.schema'
import { FormField, FormGrid } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const TIPOS_INCIDENTE = [
  'Pelea / violencia',
  'Accidente',
  'Conducta disruptiva',
  'Fuga / escapada',
  'Intervención policial',
  'Crisis emocional',
  'Otro',
]

const GRAVEDAD_LABEL: Record<string, string> = {
  leve: 'Leve',
  media: 'Media',
  grave: 'Grave',
  critico: 'Crítico',
}

interface Prediccion {
  sugerencia: string
  confianza: number
  origen: 'historico' | 'regla'
  muestras: number
}

interface IncidenteFormProps {
  legajoId: string
  nnyaId: string
  onSubmit: (values: IncidenteFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function IncidenteForm({ legajoId, nnyaId, onSubmit, onCancel, loading }: IncidenteFormProps) {
  const { role } = useAuth()
  const [prediccion, setPrediccion] = useState<Prediccion | null>(null)
  const [cargandoPrediccion, setCargandoPrediccion] = useState(false)
  const [sugerenciaAceptada, setSugerenciaAceptada] = useState(false)
  const gravedadAlAceptarRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const now = new Date()
  const localDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<IncidenteFormValues>({
    resolver: zodResolver(incidenteSchema),
    defaultValues: {
      legajo_id: legajoId,
      nnya_id: nnyaId,
      tipo: '',
      descripcion: '',
      fecha_hora: localDatetime,
      gravedad: 'media',
      acciones_tomadas: '',
    },
  })

  const tipoActual = watch('tipo')

  // Dispara la predicción con debounce de 500ms cada vez que cambia el tipo
  useEffect(() => {
    if (!tipoActual) {
      setPrediccion(null)
      setSugerenciaAceptada(false)
      return
    }

    setCargandoPrediccion(true)
    setSugerenciaAceptada(false)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/incidentes/prediccion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: tipoActual, rol: role }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setPrediccion(data)
      } catch {
        setPrediccion(null)
      } finally {
        setCargandoPrediccion(false)
      }
    }, 500)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [tipoActual, role])

  const handleAceptarSugerencia = () => {
    if (!prediccion) return
    gravedadAlAceptarRef.current = prediccion.sugerencia
    setSugerenciaAceptada(true)
    setValue('gravedad', prediccion.sugerencia as IncidenteFormValues['gravedad'])
    setValue('gravedad_sugerida', prediccion.sugerencia as IncidenteFormValues['gravedad'])
    setValue('sugerencia_aceptada', true)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormGrid cols={2}>
        <FormField label="Fecha y hora" error={errors.fecha_hora?.message} required>
          <Input {...register('fecha_hora')} type="datetime-local" />
        </FormField>

        <FormField label="Tipo de incidente" error={errors.tipo?.message} required>
          <Controller name="tipo" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {TIPOS_INCIDENTE.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>

        {/* Banner de predicción */}
        {(cargandoPrediccion || prediccion) && (
          <div className={cn(
            'sm:col-span-2 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3 border transition-colors',
            sugerenciaAceptada ? 'bg-green-50 border-green-200' : 'bg-violet-50 border-violet-200',
          )}>
            {cargandoPrediccion ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Calculando sugerencia de gravedad...
              </div>
            ) : prediccion ? (
              <>
                <div className="flex items-center gap-2 text-sm min-w-0">
                  {sugerenciaAceptada
                    ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    : <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
                  }
                  <span className={sugerenciaAceptada ? 'text-green-700' : 'text-violet-700'}>
                    <span className="font-medium">
                      {sugerenciaAceptada ? 'Sugerencia aceptada: ' : 'Gravedad sugerida: '}
                      {GRAVEDAD_LABEL[prediccion.sugerencia]}
                    </span>
                    <span className={cn('ml-1.5 text-xs', sugerenciaAceptada ? 'text-green-400' : 'text-violet-400')}>
                      ({Math.round(prediccion.confianza * 100)}% confianza
                      {prediccion.origen === 'historico' && ` · basado en ${prediccion.muestras} registros`}
                      {prediccion.origen === 'regla' && ' · regla del dominio'})
                    </span>
                  </span>
                </div>
                {!sugerenciaAceptada && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-violet-300 text-violet-700 hover:bg-violet-100 shrink-0 h-7 text-xs"
                    onClick={handleAceptarSugerencia}
                  >
                    Aceptar sugerencia
                  </Button>
                )}
              </>
            ) : null}
          </div>
        )}

        <FormField label="Gravedad" error={errors.gravedad?.message} required className="sm:col-span-2">
          <Controller name="gravedad" control={control} render={({ field }) => (
            <Select
              onValueChange={(v) => {
                field.onChange(v)
                // Si el usuario cambia manualmente después de aceptar, se pierde la sugerencia
                if (sugerenciaAceptada && v !== gravedadAlAceptarRef.current) {
                  setSugerenciaAceptada(false)
                  setValue('sugerencia_aceptada', false)
                }
              }}
              value={field.value}
            >
              <SelectTrigger className={cn(sugerenciaAceptada && 'border-green-400 ring-1 ring-green-200')}>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leve">Leve</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="grave">Grave — genera alerta automática</SelectItem>
                <SelectItem value="critico">Crítico — genera alerta automática</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </FormField>

        <FormField label="Descripción" error={errors.descripcion?.message} required className="sm:col-span-2">
          <Textarea {...register('descripcion')} rows={3} placeholder="Describí lo que ocurrió..." />
        </FormField>
        <FormField label="Acciones tomadas" error={errors.acciones_tomadas?.message} className="sm:col-span-2">
          <Textarea {...register('acciones_tomadas')} rows={3} placeholder="Describí las acciones tomadas (opcional)..." />
        </FormField>
      </FormGrid>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar incidente'}
        </Button>
      </div>
    </form>
  )
}
