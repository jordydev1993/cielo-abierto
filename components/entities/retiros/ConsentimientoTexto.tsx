'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Texto de consentimiento provisorio para el prototipo (D-25,
// docs/consentimiento-verificacion-identidad.md). Diseño de Cami (PR #42); lo usan la
// demo y las pantallas reales para que el texto exista en un solo lugar.
export function ConsentimientoTexto({ proposito }: { proposito: 'retiro' | 'referente' }) {
  const [verDetalle, setVerDetalle] = useState(false)
  const sujeto = proposito === 'retiro' ? 'retirar a' : 'registrarte como referente de'

  return (
    <div className="space-y-4">
      <p className="text-sm text-on-surface">
        Para {sujeto} un niño, niña o adolescente de la residencia, necesitamos confirmar que sos quien decís ser.
      </p>
      <p className="text-sm text-on-surface-variant">
        Vas a ingresar tu número de DNI y tu sexo, y sacarte una selfie. Un servicio externo (Didit)
        compara esos datos con el Registro Nacional de las Personas (RENAPER) y controla que la selfie
        sea de una persona real.
      </p>
      <p className="text-sm text-on-surface-variant">
        La residencia solo guarda el resultado: si tu identidad se verificó o no. No guardamos tu selfie
        ni tus datos personales de RENAPER.
      </p>
      <p className="text-sm text-on-surface-variant">
        Es voluntario. Si no aceptás, un responsable de la residencia puede verificar tu identidad a mano
        con tu DNI.
      </p>

      <Button
        type="button"
        variant="link"
        className="h-auto p-0"
        aria-expanded={verDetalle}
        onClick={() => setVerDetalle((visible) => !visible)}
      >
        {verDetalle ? 'Ver menos' : 'Ver más'}
      </Button>

      {verDetalle && (
        <div className="space-y-3 rounded-lg border border-outline-variant p-4 text-sm text-on-surface-variant">
          <p>
            <strong className="text-on-surface">Quién es responsable de tus datos:</strong> la residencia.
          </p>
          <p>
            <strong className="text-on-surface">Para qué los usamos:</strong> solo para verificar tu
            identidad en este retiro o alta como referente. No los usamos para otra cosa ni los compartimos
            con terceros, salvo con el servicio de verificación.
          </p>
          <div>
            <p className="font-medium text-on-surface">Qué datos se usan</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Número de DNI y sexo, para consultar el RENAPER.</li>
              <li>Una selfie y una prueba de que sos una persona real (sin gestos).</li>
            </ul>
          </div>
          <p>
            <strong className="text-on-surface">Quién los procesa:</strong> Didit, un servicio de
            verificación de identidad. Didit consulta el RENAPER y nos devuelve el resultado. Tus datos
            se procesan y guardan en la Unión Europea.
          </p>
          <p>
            <strong className="text-on-surface">Qué se guarda y cuánto tiempo:</strong> la residencia
            guarda solo el resultado de la verificación, la fecha y quién la inició. Pedimos a Didit que
            borre la verificación apenas registramos el resultado. Si el borrado falla, Didit la elimina
            sola en un plazo máximo de un mes.
          </p>
          <p>
            <strong className="text-on-surface">Tus derechos (Ley 25.326):</strong> podés pedir en la
            residencia acceder a tus datos, corregirlos o que se eliminen. La Agencia de Acceso a la
            Información Pública es la autoridad de control y recibe denuncias si creés que no se respetan
            tus derechos.
          </p>
          <p>
            <strong className="text-on-surface">Si no aceptás:</strong> no se hace la verificación con
            Didit. Un responsable de la residencia compara tu DNI físico con los datos registrados, y
            queda constancia de que se hizo a mano.
          </p>
        </div>
      )}
    </div>
  )
}
