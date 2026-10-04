// Redacción del informe SENAF con Claude (prompts/027). Solo del lado del servidor:
// usa ANTHROPIC_API_KEY y nunca se importa desde componentes cliente.
// Recibe únicamente los agregados ya validados por `agregadosSenafSchema` (R3).
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { CLAVES_SECCION, SECCIONES, nombrePeriodo, type AgregadosSenaf, type Seccion } from '@/lib/reportes/senaf'

export const MODELO_INFORME = 'claude-opus-5-5'

const BorradorSchema = z.object({
  secciones: z.array(z.object({ clave: z.enum(CLAVES_SECCION), texto: z.string() })),
  advertencias: z.array(z.string()),
})

const SYSTEM = `Redactás el informe mensual institucional que una residencia de niñas, niños y adolescentes bajo protección judicial (Córdoba, Argentina) presenta ante la SENAF.

Vas a recibir solo datos agregados del mes en JSON. Escribí un párrafo breve (dos a cuatro oraciones) por cada sección, en castellano rioplatense formal e institucional, en tercera persona.

Secciones, con su clave:
${SECCIONES.map((s) => `- ${s.clave}: ${s.titulo}`).join('\n')}

Reglas sobre los números, porque el informe es un documento oficial y cada cifra se controla contra los datos:
- Usá solo cifras que estén en el JSON. No calcules porcentajes, sumas, promedios ni diferencias.
- Si un valor es 0 o una categoría no aparece, decilo en palabras ("no se registraron incidentes").
- No supongas causas, no evalúes casos y no menciones a personas.

En "advertencias" anotá lo que Dirección debería mirar antes de aprobar: por ejemplo, que la evaluación institucional del mes no figura como realizada, o que hubo seguimientos programados que no se realizaron. Si no hay nada para señalar, devolvé una lista vacía.`

export function iaDisponible() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export async function redactarConIA(datos: AgregadosSenaf): Promise<{
  secciones: Seccion[]
  advertencias: string[]
  modelo: string
}> {
  const client = new Anthropic({ timeout: 90_000, maxRetries: 1 })

  const response = await client.beta.messages.parse({
    model: MODELO_INFORME,
    max_tokens: 16000,
    // Si el modelo declina el pedido, la API reintenta en otro modelo dentro de la misma llamada.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: betaZodOutputFormat(BorradorSchema) },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Período: ${nombrePeriodo(datos.periodo.mes, datos.periodo.anio)}\n\nDatos agregados:\n${JSON.stringify(datos, null, 2)}`,
      },
    ],
  })

  if (response.stop_reason === 'refusal') {
    throw new Error('El modelo no generó el borrador (pedido rechazado).')
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('El borrador quedó incompleto (límite de longitud).')
  }
  const borrador = response.parsed_output
  if (!borrador) throw new Error('La respuesta del modelo no tiene el formato esperado.')

  const porClave = new Map(borrador.secciones.map((s) => [s.clave, s.texto.trim()]))
  return {
    secciones: SECCIONES.map(({ clave, titulo }) => ({ clave, titulo, texto: porClave.get(clave) ?? '' })),
    advertencias: borrador.advertencias,
    modelo: response.model,
  }
}
