'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { AutorizacionList } from '@/components/entities/autorizaciones-retiro/AutorizacionList'
import { CasosRevisionList } from './CasosRevisionList'
import { RegistrarRetiro } from './RegistrarRetiro'
import { RetiroList } from './RetiroList'

// Pantalla real de retiros (prompts/049). Las pestañas de Admin se ocultan a Equipo
// Tecnico; la garantía es RLS y los triggers de la base.
export function RetirosPanel({ sandbox }: { sandbox: boolean }) {
  const { role } = useAuth()
  const esAdmin = role === 'Admin'

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-semibold text-on-surface">Retiros</h1>
        <p className="text-sm text-on-surface-variant">
          Retiro de un NNyA por un tutor autorizado, con verificación de identidad (Didit y RENAPER).
        </p>
      </header>

      <Tabs defaultValue="registrar">
        <TabsList aria-label="Secciones de retiros">
          <TabsTrigger value="registrar">Registrar retiro</TabsTrigger>
          <TabsTrigger value="en-curso">Retiros en curso</TabsTrigger>
          {esAdmin && <TabsTrigger value="revision">Casos en revisión</TabsTrigger>}
          {esAdmin && <TabsTrigger value="autorizaciones">Autorizaciones</TabsTrigger>}
        </TabsList>

        <TabsContent value="registrar">
          <RegistrarRetiro sandbox={sandbox} />
        </TabsContent>
        <TabsContent value="en-curso">
          <RetiroList sandbox={sandbox} />
        </TabsContent>
        {esAdmin && (
          <TabsContent value="revision">
            <CasosRevisionList />
          </TabsContent>
        )}
        {esAdmin && (
          <TabsContent value="autorizaciones">
            <AutorizacionList />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
