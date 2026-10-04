'use client'

import { useRouter } from 'next/navigation'
import { AccessGuard } from '@/components/shared/AccessGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useReportesSenaf } from '@/hooks/reportes-senaf/useReportesSenaf'
import { useGenerarReporteSenaf } from '@/hooks/reportes-senaf/useGenerarReporteSenaf'
import { GenerarReporteForm } from '@/components/entities/reportes-senaf/GenerarReporteForm'
import { ReportesSenafTable } from '@/components/entities/reportes-senaf/ReportesSenafTable'
import { toast } from '@/components/ui/toaster'
import type { PeriodoSenafValues } from '@/lib/validations/reporte-senaf.schema'

export default function ReportesSenafPage() {
  const router = useRouter()
  const { data: reportes = [], isLoading } = useReportesSenaf()
  const generar = useGenerarReporteSenaf()

  const onGenerar = async (periodo: PeriodoSenafValues) => {
    try {
      const { id, origen } = await generar.mutateAsync(periodo)
      toast({
        title: 'Borrador generado',
        description: origen === 'ia' ? 'Redactado con IA. Revisalo antes de aprobar.' : 'Generado con la plantilla. Revisalo antes de aprobar.',
        variant: 'success',
      })
      router.push(`/reportes-senaf/${id}`)
    } catch (e: unknown) {
      toast({ title: 'No se pudo generar', description: e instanceof Error ? e.message : undefined, variant: 'destructive' })
    }
  }

  return (
    <AccessGuard roles={['Admin']} fallback={<div className="p-8 text-slate-500">Sin acceso</div>}>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Informe SENAF</h1>
          <p className="text-sm text-slate-500">
            Informe institucional mensual. El sistema calcula los números del mes y arma un borrador; Dirección lo revisa y lo aprueba.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuevo borrador</CardTitle>
          </CardHeader>
          <CardContent>
            <GenerarReporteForm onSubmit={onGenerar} loading={generar.isPending} />
          </CardContent>
        </Card>

        <ReportesSenafTable
          data={reportes}
          loading={isLoading}
          onView={(r) => router.push(`/reportes-senaf/${r.id}`)}
        />
      </div>
    </AccessGuard>
  )
}
