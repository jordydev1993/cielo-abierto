import { createElement, type ReactElement } from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { InformeSenafPdf } from '@/lib/reportes/InformeSenafPdf'
import { MESES } from '@/lib/reportes/senaf'
import type { ReporteSenaf } from '@/types/database.types'

// Descarga del informe SENAF en PDF. Solo Admin y solo informes aprobados (prompts/027).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const { data: role } = await supabase.rpc('get_my_role')
  if (role !== 'Admin') {
    return Response.json({ error: 'Acceso denegado.' }, { status: 403 })
  }

  const { data } = await supabase
    .from('reportes_senaf')
    .select('*, aprobador:usuarios!reportes_senaf_aprobado_por_fkey(nombre, apellido)')
    .eq('id', id)
    .maybeSingle()

  const reporte = data as ReporteSenaf | null
  if (!reporte) {
    return Response.json({ error: 'Informe no encontrado.' }, { status: 404 })
  }
  if (reporte.estado !== 'aprobado') {
    return Response.json({ error: 'El informe todavía no está aprobado.' }, { status: 409 })
  }

  const aprobadoPor = reporte.aprobador ? `${reporte.aprobador.nombre} ${reporte.aprobador.apellido}` : 'Dirección'
  // InformeSenafPdf devuelve un <Document>; el tipo de renderToBuffer pide el elemento Document.
  const documento = createElement(InformeSenafPdf, { reporte, aprobadoPor }) as unknown as ReactElement<DocumentProps>
  const buffer = await renderToBuffer(documento)
  const nombre = `informe-senaf-${reporte.periodo_anio}-${String(reporte.periodo_mes).padStart(2, '0')}-${MESES[reporte.periodo_mes - 1]}-v${reporte.version}.pdf`

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombre}"`,
      'Cache-Control': 'no-store',
    },
  })
}
