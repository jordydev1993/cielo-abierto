'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Pencil } from 'lucide-react'
import { useNnya } from '@/hooks/nnya/useNnya'
import { useNnyaTutores } from '@/hooks/nnya_tutores/useNnyaTutores'
import { useLegajosByNnya } from '@/hooks/legajos/useLegajosByNnya'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Nnya } from '@/types/database.types'

function estadoBadge(estado: Nnya['estado_actual']) {
  const map = {
    'En residencia': 'success',
    'En proceso de egreso': 'warning',
    'Egresado': 'secondary',
    'Fallecido': 'destructive',
  } as const
  return <Badge variant={map[estado]}>{estado}</Badge>
}

function legajoEstadoBadge(estado: 'activo' | 'cerrado' | 'archivado') {
  const map = { activo: 'success', cerrado: 'secondary', archivado: 'outline' } as const
  return <Badge variant={map[estado]}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Badge>
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  try { return format(new Date(fecha + 'T00:00:00'), 'dd/MM/yyyy', { locale: es }) }
  catch { return fecha }
}

function Campo({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      <p className="text-sm text-on-surface mt-0.5">{value || '—'}</p>
    </div>
  )
}

export default function NnyaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const { data: nnya, isLoading } = useNnya(id)
  const { data: nnyaTutores = [] } = useNnyaTutores(id)
  const { data: legajos = [] } = useLegajosByNnya(id)

  if (isLoading) return <div className="p-8 text-on-surface-variant">Cargando...</div>
  if (!nnya) return <div className="p-8 text-on-surface-variant">NNyA no encontrado</div>

  const legajo = legajos[0]

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/nnya')} className="-ml-2 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />Volver a NNyA
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-title font-semibold text-on-surface">
                {nnya.apellido}, {nnya.nombre}
              </h1>
              {estadoBadge(nnya.estado_actual)}
            </div>
            <p className="text-sm text-on-surface-variant mt-0.5">DNI {nnya.dni}</p>
          </div>

          <AccessGuard roles={['Admin', 'Equipo Tecnico']}>
            <Button variant="outline" size="sm" onClick={() => router.push(`/nnya/${id}/editar`)}>
              <Pencil className="h-4 w-4 mr-1.5" />Editar
            </Button>
          </AccessGuard>
        </div>
      </div>

      <div className="border-t border-outline-variant pt-6">
        <h2 className="text-base font-semibold text-on-surface mb-4">Datos personales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Fecha de nacimiento" value={formatFecha(nnya.fecha_nacimiento)} />
          <Campo label="Lugar de nacimiento" value={nnya.lugar_nacimiento} />
          <Campo label="Nacionalidad" value={nnya.nacionalidad} />
          <Campo label="Género" value={nnya.genero} />
          <Campo label="Teléfono" value={nnya.telefono} />
          <Campo label="Email" value={nnya.email} />
          <Campo label="Escolaridad" value={nnya.escolaridad} />
          <Campo label="Obra social" value={nnya.obra_social} />
          <Campo label="N° Expediente" value={nnya.numero_expediente} />
          <Campo label="Domicilio" value={nnya.domicilio} />
        </div>
      </div>

      <div className="border-t border-outline-variant pt-6">
        <h2 className="text-base font-semibold text-on-surface mb-4">Legajo</h2>
        {legajo ? (
          <button
            onClick={() => router.push(`/legajos/${legajo.id}`)}
            className="w-full text-left flex items-center justify-between bg-surface-container-low hover:bg-surface-container rounded-md px-4 py-3 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-on-surface">Legajo {legajo.numero_legajo}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Apertura: {formatFecha(legajo.fecha_apertura)}</p>
            </div>
            {legajoEstadoBadge(legajo.estado)}
          </button>
        ) : (
          <p className="text-sm text-outline">Sin legajo asociado</p>
        )}
      </div>

      <div className="border-t border-outline-variant pt-6">
        <h2 className="text-base font-semibold text-on-surface mb-4">Tutores asociados</h2>
        {nnyaTutores.length === 0 ? (
          <p className="text-sm text-outline">Sin tutores asignados</p>
        ) : (
          <ul className="space-y-2">
            {nnyaTutores.map((nt) => {
              const tutor = nt.tutores
              return (
                <li key={nt.id} className="flex items-center gap-2 bg-surface-container-low rounded-md px-3 py-2 text-sm">
                  <span className="font-medium text-on-surface">
                    {tutor?.apellido}, {tutor?.nombre}
                  </span>
                  <span className="text-on-surface-variant">— {tutor?.parentesco}</span>
                  {nt.es_principal && <Badge variant="success" className="text-xs">Principal</Badge>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
