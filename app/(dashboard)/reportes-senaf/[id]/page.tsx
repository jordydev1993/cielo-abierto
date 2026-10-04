'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Download, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { useReporteSenaf } from '@/hooks/reportes-senaf/useReporteSenaf'
import { useActualizarReporteSenaf } from '@/hooks/reportes-senaf/useActualizarReporteSenaf'
import { useAprobarReporteSenaf } from '@/hooks/reportes-senaf/useAprobarReporteSenaf'
import { ReporteSenafForm } from '@/components/entities/reportes-senaf/ReporteSenafForm'
import { DatosReferencia } from '@/components/entities/reportes-senaf/DatosReferencia'
import { agregadosSenafSchema, tituloPeriodo } from '@/lib/reportes/senaf'
import type { EdicionReporteSenafValues } from '@/lib/validations/reporte-senaf.schema'

export default function ReporteSenafDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: reporte, isLoading } = useReporteSenaf(id)
  const actualizar = useActualizarReporteSenaf()
  const aprobar = useAprobarReporteSenaf()
  const [confirmar, setConfirmar] = useState(false)

  if (isLoading) return <p className="p-6 text-sm text-slate-400">Cargando...</p>
  if (!reporte) return <p className="p-6 text-sm text-slate-500">Informe no encontrado.</p>

  const aprobado = reporte.estado === 'aprobado'
  const datos = agregadosSenafSchema.safeParse(reporte.datos)
  const periodo = tituloPeriodo(reporte.periodo_mes, reporte.periodo_anio)

  const onGuardar = async (values: EdicionReporteSenafValues) => {
    try {
      await actualizar.mutateAsync({ id, values })
      toast({ title: 'Cambios guardados', variant: 'success' })
    } catch (e: unknown) {
      toast({ title: 'Error al guardar', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
    }
  }

  const onAprobar = async () => {
    try {
      await aprobar.mutateAsync(id)
      toast({ title: 'Informe aprobado', variant: 'success' })
      setConfirmar(false)
    } catch (e: unknown) {
      toast({ title: 'No se pudo aprobar', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
    }
  }

  return (
    <AccessGuard roles={['Admin']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 space-y-5">
        <Button variant="ghost" size="sm" onClick={() => router.push('/reportes-senaf')}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Informe SENAF · {periodo}
            </h1>
            <p className="text-sm text-slate-500">
              Versión {reporte.version} · {reporte.origen_borrador === 'ia' ? `Borrador con IA (${reporte.modelo})` : 'Borrador con plantilla'}
              {reporte.generador && ` · Generado por ${reporte.generador.nombre} ${reporte.generador.apellido}`}
            </p>
            {aprobado && reporte.aprobado_at && (
              <p className="text-sm text-slate-500">
                Aprobado por {reporte.aprobador ? `${reporte.aprobador.nombre} ${reporte.aprobador.apellido}` : 'Dirección'} el{' '}
                {format(new Date(reporte.aprobado_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={aprobado ? 'success' : 'secondary'}>{aprobado ? 'Aprobado' : 'Borrador'}</Badge>
            {aprobado ? (
              <Button asChild>
                <a href={`/api/reportes/senaf/${id}/pdf`}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </a>
              </Button>
            ) : (
              <Button onClick={() => setConfirmar(true)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Aprobar
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Card>
            <CardContent className="pt-6">
              <ReporteSenafForm
                key={reporte.updated_at}
                reporte={reporte}
                onSubmit={onGuardar}
                loading={actualizar.isPending}
                readOnly={aprobado}
              />
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Datos del período</CardTitle>
              <p className="text-xs text-slate-500">Calculados por el sistema. Cada cifra del texto tiene que coincidir con estos números.</p>
            </CardHeader>
            <CardContent>
              {datos.success ? (
                <DatosReferencia datos={datos.data} />
              ) : (
                <p className="text-sm text-slate-500">No se pudieron leer los datos guardados.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <ConfirmDialog
          open={confirmar}
          onOpenChange={setConfirmar}
          title="¿Aprobar el informe?"
          description="Quedás registrado como responsable del contenido. Un informe aprobado ya no se puede editar: para corregirlo hay que generar una versión nueva. Si hay cambios sin guardar, guardalos antes de aprobar."
          confirmLabel="Aprobar"
          variant="default"
          loading={aprobar.isPending}
          onConfirm={onAprobar}
        />
      </div>
    </AccessGuard>
  )
}
