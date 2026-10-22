'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EstadoVerificacionBadge } from '@/components/entities/retiros/EstadoVerificacionBadge'
import { RetiroDemo } from '@/components/entities/retiros/RetiroDemo'
import { DiditReviewQueue } from '@/components/entities/retiros/DiditReviewQueue'
import { DiditIdentityFlow } from '@/components/entities/retiros/DiditIdentityFlow'
import { InnovacionDemoNavigation } from '@/components/entities/retiros/InnovacionDemoNavigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ESTADOS_VERIFICACION_DEMO,
  ESTADO_VERIFICACION_PRESENTACION,
} from '@/components/entities/retiros/demo-data'

export default function RetirosDemoPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-title font-semibold text-on-surface">
            Demostración visual de retiro
          </h1>
          <Badge variant="info">Datos de demostración</Badge>
        </div>
        <p className="max-w-2xl text-sm text-on-surface-variant">
          Prototipo con información completamente ficticia. No realiza verificaciones de identidad,
          no consulta datos reales y no registra retiros.
        </p>
      </header>

      <InnovacionDemoNavigation />

      <Tabs defaultValue="retiro">
        <TabsList aria-label="Demostraciones de retiro y referente">
          <TabsTrigger value="retiro">Retiro</TabsTrigger>
          <TabsTrigger value="referente">Referente</TabsTrigger>
        </TabsList>

        <TabsContent value="retiro" className="space-y-6">
          <RetiroDemo />
          <DiditReviewQueue />

          <section aria-labelledby="estados-verificacion-demo-title">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle id="estados-verificacion-demo-title" className="text-base">
                    Estados de verificación (presentación demo)
                  </CardTitle>
                  <Badge variant="info">Datos de demostración</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {ESTADOS_VERIFICACION_DEMO.map((estado) => (
                    <li key={estado} className="rounded-lg border border-outline-variant p-4">
                      <EstadoVerificacionBadge estado={estado} />
                      <p className="mt-2 text-sm text-on-surface-variant">
                        {ESTADO_VERIFICACION_PRESENTACION[estado].descripcion}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-on-surface-variant">
                  Los mensajes literales A–D de la Práctica 3 no están incluidos en las fuentes disponibles del repo.
                  Esta demo no los inventa; deben incorporarse desde el documento fuente antes de conectar resultados reales.
                </p>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="referente">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">Verificación de identidad de referente</CardTitle>
                <Badge variant="info">Demostración con datos ficticios</Badge>
              </div>
              <p className="text-sm text-on-surface-variant">
                Este recorrido es únicamente visual: no usa referentes reales, no verifica identidades y no guarda datos.
              </p>
            </CardHeader>
            <CardContent>
              <DiditIdentityFlow proposito="referente" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
