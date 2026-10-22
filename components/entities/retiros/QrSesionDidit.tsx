'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'

// QR de la sesión de Didit para el celular del adulto (D-24). Se genera en el navegador:
// la URL lleva el token de la sesión y no se manda a ningún servicio externo.
export function QrSesionDidit({ url }: { url: string }) {
  const [imagen, setImagen] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    QRCode.toDataURL(url, { margin: 1, width: 240, errorCorrectionLevel: 'M' })
      .then((dataUrl) => vigente && setImagen(dataUrl))
      .catch(() => vigente && setImagen(null))
    return () => {
      vigente = false
    }
  }, [url])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copiado', variant: 'success' })
    } catch {
      toast({ title: 'No se pudo copiar el link', variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {imagen ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL generada en el navegador
        <img
          src={imagen}
          width={240}
          height={240}
          alt="Código QR para abrir la verificación de identidad de Didit en el celular del adulto"
          className="rounded-md border border-outline-variant bg-white p-2"
        />
      ) : (
        <div className="h-60 w-60 animate-pulse rounded-md bg-surface-container-low" aria-hidden="true" />
      )}
      <Button type="button" variant="outline" size="sm" onClick={copiar}>
        Copiar link
      </Button>
    </div>
  )
}
