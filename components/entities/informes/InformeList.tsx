'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { useEnviarInforme } from '@/hooks/informes/useEnviarInforme'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, Send } from 'lucide-react'
import type { Informe } from '@/types/database.types'

function EstadoBadge({ estado }: { estado: Informe['estado'] }) {
  if (estado === 'finalizado') return <Badge variant="success">Enviado</Badge>
  if (estado === 'revisado') return <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Revisado</Badge>
  return <Badge variant="outline">Borrador</Badge>
}

interface ConfirmarEnvioModalProps {
  informe: Informe | null
  legajoId: string
  onClose: () => void
}

function ConfirmarEnvioModal({ informe, legajoId, onClose }: ConfirmarEnvioModalProps) {
  const enviar = useEnviarInforme()

  const handleEnviar = async () => {
    if (!informe) return
    try {
      await enviar.mutateAsync({ id: informe.id, legajoId })
      toast({ title: 'Informe marcado como enviado', variant: 'success' })
      onClose()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={!!informe} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Marcar informe como enviado</DialogTitle>
        </DialogHeader>
        {informe && (
          <div className="space-y-3 pt-1">
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium text-slate-900">{informe.titulo}</p>
              <p className="text-slate-500 text-xs">{informe.tipo} · {format(new Date(informe.fecha_informe + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}</p>
            </div>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Una vez enviado, el informe no podrá ser modificado. Esta acción es irreversible. (INF-EX-05)
            </p>
          </div>
        )}
        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleEnviar} disabled={enviar.isPending}>
            <Send className="h-4 w-4 mr-1.5" />
            {enviar.isPending ? 'Enviando...' : 'Confirmar envío'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface InformeListProps {
  informes: Informe[]
  legajoId: string
  legajoActivo: boolean
}

export function InformeList({ informes, legajoId, legajoActivo }: InformeListProps) {
  const [informeAEnviar, setInformeAEnviar] = useState<Informe | null>(null)
  const [informeExpandido, setInformeExpandido] = useState<string | null>(null)

  if (informes.length === 0) {
    return (
      <div className="py-6 text-center">
        <FileText className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
        <p className="text-sm text-slate-400">No hay informes registrados</p>
      </div>
    )
  }

  return (
    <>
      <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
        {informes.map((informe) => {
          const enviado = informe.estado === 'finalizado'
          const expandido = informeExpandido === informe.id

          return (
            <div key={informe.id} className="bg-white">
              <div className="p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">{informe.titulo}</span>
                    <EstadoBadge estado={informe.estado} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {informe.tipo} · {format(new Date(informe.fecha_informe + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })}
                  </p>
                  <button
                    onClick={() => setInformeExpandido(expandido ? null : informe.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    {expandido ? 'Ocultar contenido' : 'Ver contenido'}
                  </button>
                </div>

                {!enviado && legajoActivo && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0"
                    onClick={() => setInformeAEnviar(informe)}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Enviar
                  </Button>
                )}
              </div>

              {expandido && (
                <div className="px-3 pb-3">
                  <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                    {informe.contenido}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmarEnvioModal
        informe={informeAEnviar}
        legajoId={legajoId}
        onClose={() => setInformeAEnviar(null)}
      />
    </>
  )
}
