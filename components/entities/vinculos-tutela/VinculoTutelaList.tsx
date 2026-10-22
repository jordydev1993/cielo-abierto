'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Referente, Usuario, VinculoTutela } from '@/types/database.types'

type VinculoTutelaConPersona = VinculoTutela & {
  referente?: Pick<Referente, 'apellido' | 'nombre'> | null
  usuario?: Pick<Usuario, 'apellido' | 'nombre'> | null
}

const TIPO_LABEL: Record<VinculoTutela['tipo'], string> = {
  tutela_residencia: 'Tutela de residencia',
  revinculacion_familiar: 'Revinculación familiar',
  referente_afectivo: 'Referente afectivo',
}

const ESTADO_VARIANT: Record<VinculoTutela['estado'], 'success' | 'secondary' | 'outline' | 'destructive'> = {
  propuesto: 'outline',
  vigente: 'success',
  finalizado: 'secondary',
  revocado: 'destructive',
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  try { return format(new Date(fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es }) }
  catch { return fecha }
}

interface VinculoTutelaListProps {
  vinculos: VinculoTutelaConPersona[]
  onEdit?: (row: VinculoTutela) => void
}

export function VinculoTutelaList({ vinculos, onEdit }: VinculoTutelaListProps) {
  if (vinculos.length === 0) {
    return <p className="text-sm text-outline py-4 text-center">No hay vínculos de tutela registrados</p>
  }

  return (
    <div className="divide-y divide-outline-variant">
      {vinculos.map((v) => {
        const persona = v.referente
          ? `${v.referente.apellido}, ${v.referente.nombre} (referente)`
          : v.usuario
            ? `${v.usuario.apellido}, ${v.usuario.nombre} (usuario responsable)`
            : '—'
        return (
          <div key={v.id} className="py-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-on-surface">{TIPO_LABEL[v.tipo]}</span>
                <Badge variant={ESTADO_VARIANT[v.estado]}>{v.estado}</Badge>
              </div>
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={() => onEdit(v)} title="Editar vínculo">
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-on-surface-variant">{persona}</p>
            {v.estado === 'propuesto' && (
              <p className="text-xs text-on-surface-variant">
                Pendiente de validación de identidad
              </p>
            )}
            <p className="text-xs text-outline">
              Vigente {formatFecha(v.vigente_desde)} — {formatFecha(v.vigente_hasta)}
            </p>
            {v.motivo_finalizacion && (
              <p className="text-xs text-on-surface-variant italic">Motivo: {v.motivo_finalizacion}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
