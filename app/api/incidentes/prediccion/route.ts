import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Gravedad = 'leve' | 'media' | 'grave' | 'critico'

// Reglas estáticas definidas por dominio: tipo → gravedad esperada
const REGLAS: Record<string, { gravedad: Gravedad; confianza: number }> = {
  'Pelea / violencia':      { gravedad: 'critico', confianza: 0.95 },
  'Intervención policial':  { gravedad: 'critico', confianza: 0.90 },
  'Fuga / escapada':        { gravedad: 'grave',   confianza: 0.90 },
  'Accidente':              { gravedad: 'grave',   confianza: 0.80 },
  'Crisis emocional':       { gravedad: 'grave',   confianza: 0.75 },
  'Conducta disruptiva':    { gravedad: 'media',   confianza: 0.75 },
  'Otro':                   { gravedad: 'media',   confianza: 0.50 },
}

export async function POST(request: NextRequest) {
  const { tipo, rol } = await request.json()

  if (!tipo) {
    return Response.json({ error: 'tipo requerido' }, { status: 400 })
  }

  // Ajuste de confianza según rol (educadores/técnicos pueden subestimar gravedad)
  const ajusteConfianza = rol === 'Equipo Tecnico' ? 0.9 : 1.0

  // Intentar aprendizaje histórico: si hay >= 5 registros del mismo tipo, usar la moda
  try {
    const supabase = await createClient()
    const { data: historicos } = await supabase
      .from('incidentes')
      .select('gravedad')
      .eq('tipo', tipo)

    if (historicos && historicos.length >= 5) {
      const conteo = historicos.reduce<Record<string, number>>((acc, { gravedad }) => {
        acc[gravedad] = (acc[gravedad] ?? 0) + 1
        return acc
      }, {})

      const [gravedadModa, frecuencia] = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]
      const confianzaHistorica = Math.min(0.97, (frecuencia / historicos.length) + 0.10)

      return Response.json({
        sugerencia: gravedadModa as Gravedad,
        confianza: Math.round(confianzaHistorica * ajusteConfianza * 100) / 100,
        origen: 'historico',
        muestras: historicos.length,
      })
    }
  } catch {
    // Si falla la consulta histórica, usar reglas estáticas
  }

  // Fallback: reglas estáticas
  const regla = REGLAS[tipo] ?? { gravedad: 'media' as Gravedad, confianza: 0.50 }

  return Response.json({
    sugerencia: regla.gravedad,
    confianza: Math.round(regla.confianza * ajusteConfianza * 100) / 100,
    origen: 'regla',
    muestras: 0,
  })
}
