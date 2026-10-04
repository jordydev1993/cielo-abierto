import { createClient } from '@/lib/supabase/server'
import { periodoSenafSchema } from '@/lib/validations/reporte-senaf.schema'
import { agregadosSenafSchema, redactarConPlantilla, verificarCifras, type Advertencia, type Seccion } from '@/lib/reportes/senaf'
import { iaDisponible, redactarConIA } from '@/lib/ia/redactarInformeSenaf'

// La redacción con IA puede tardar; el resto es una consulta y un insert.
export const maxDuration = 120

// Genera una versión nueva del informe SENAF del período (prompts/027).
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const { data: role } = await supabase.rpc('get_my_role')
  if (role !== 'Admin') {
    return Response.json(
      { error: 'Acceso denegado: solo Dirección (Admin) puede generar el informe SENAF.' },
      { status: 403 },
    )
  }

  const parsedPeriodo = periodoSenafSchema.safeParse(await request.json().catch(() => null))
  if (!parsedPeriodo.success) {
    return Response.json({ error: 'Período inválido.' }, { status: 400 })
  }
  const { mes, anio } = parsedPeriodo.data

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()
  if (!usuario) {
    return Response.json({ error: 'Tu usuario no está vinculado a la tabla de usuarios.' }, { status: 403 })
  }

  const { data: agregadosRaw, error: errorAgregados } = await supabase.rpc('fn_agregados_senaf', {
    p_mes: mes,
    p_anio: anio,
  })
  if (errorAgregados) {
    return Response.json({ error: 'No se pudieron calcular los datos del período.' }, { status: 500 })
  }

  // R3: solo lo que está en la lista blanca puede seguir (y viajar a la IA).
  const agregados = agregadosSenafSchema.safeParse(agregadosRaw)
  if (!agregados.success) {
    return Response.json(
      { error: 'Los datos del período tienen un formato inesperado. No se generó el informe.' },
      { status: 500 },
    )
  }
  const datos = agregados.data

  let secciones: Seccion[]
  let origen: 'ia' | 'plantilla' = 'plantilla'
  let modelo: string | null = null
  const advertencias: Advertencia[] = []

  if (iaDisponible()) {
    try {
      const borrador = await redactarConIA(datos)
      secciones = borrador.secciones
      origen = 'ia'
      modelo = borrador.modelo
      advertencias.push(...borrador.advertencias.map((mensaje) => ({ clave: null, mensaje })))
      const vacias = secciones.filter((s) => !s.texto)
      if (vacias.length > 0) {
        // Completar con la plantilla las secciones que el modelo dejó vacías.
        const plantilla = new Map(redactarConPlantilla(datos).map((s) => [s.clave, s.texto]))
        secciones = secciones.map((s) => (s.texto ? s : { ...s, texto: plantilla.get(s.clave) ?? '' }))
        advertencias.push({ clave: null, mensaje: `${vacias.length} secciones se completaron con la plantilla porque la IA no las redactó.` })
      }
    } catch (e) {
      // R5: si la IA falla, el informe se arma igual con la plantilla.
      secciones = redactarConPlantilla(datos)
      advertencias.push({
        clave: null,
        mensaje: `No se pudo redactar con IA (${e instanceof Error ? e.message : 'error desconocido'}). Se usó la plantilla.`,
      })
    }
  } else {
    secciones = redactarConPlantilla(datos)
  }

  // R4: control de cifras inventadas.
  advertencias.push(...verificarCifras(secciones, datos))

  const { data: ultima } = await supabase
    .from('reportes_senaf')
    .select('version')
    .eq('periodo_mes', mes)
    .eq('periodo_anio', anio)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: reporte, error: errorInsert } = await supabase
    .from('reportes_senaf')
    .insert({
      periodo_mes: mes,
      periodo_anio: anio,
      version: (ultima?.version ?? 0) + 1,
      datos,
      borrador: secciones,
      texto_final: secciones,
      origen_borrador: origen,
      modelo,
      advertencias,
      generado_por: usuario.id,
    })
    .select('id')
    .single()

  if (errorInsert || !reporte) {
    return Response.json({ error: 'No se pudo guardar el informe. Intentá nuevamente.' }, { status: 500 })
  }

  return Response.json({ id: reporte.id, origen }, { status: 201 })
}
