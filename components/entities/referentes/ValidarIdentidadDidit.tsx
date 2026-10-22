'use client'

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { queryKeys } from '@/lib/constants/queryKeys'
import { MENSAJES_DIDIT } from '@/lib/didit/mensajes'
import { ConsentimientoTexto } from '@/components/entities/retiros/ConsentimientoTexto'
import { VerificacionDidit } from '@/components/entities/retiros/VerificacionDidit'
import type { Referente } from '@/types/database.types'

// Validación de identidad de un referente con Didit (Plan 035 §8.2, prompts/049).
// El webhook crea la validaciones_renaper (D-11); con 'aprobado', el vínculo puede pasar
// a vigente (D-16). Sin consentimiento, queda la validación manual de siempre.
export function ValidarIdentidadDidit({ referente, sandbox }: { referente: Referente; sandbox: boolean }) {
  const qc = useQueryClient()
  const [consentimiento, setConsentimiento] = useState<'aceptado' | 'rechazado' | null>(null)

  const refrescar = useCallback(() => {
    void qc.invalidateQueries({ queryKey: queryKeys.validacionesRenaper.all })
  }, [qc])

  if (consentimiento === 'rechazado') {
    return <p className="text-sm text-on-surface" role="status">{MENSAJES_DIDIT.CONSENT_REJECTED}</p>
  }

  if (consentimiento === 'aceptado') {
    return (
      <VerificacionDidit
        objetivo={{ proposito: 'validacion_referente', referenteId: referente.id }}
        sandbox={sandbox}
        onResultado={refrescar}
      />
    )
  }

  return (
    <div className="space-y-4">
      <ConsentimientoTexto proposito="referente" />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setConsentimiento('aceptado')}>Acepto</Button>
        <Button type="button" variant="outline" onClick={() => setConsentimiento('rechazado')}>No acepto</Button>
      </div>
    </div>
  )
}
