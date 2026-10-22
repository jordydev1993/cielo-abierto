import { connection } from 'next/server'
import { ReferentesPanel } from '@/components/entities/referentes/ReferentesPanel'

// Componente de servidor: el selector de escenario de sandbox lo habilita el servidor
// (DIDIT_SANDBOX_SCENARIOS), leído en cada pedido (prompts/049, decisión 6).
export default async function ReferentesPage() {
  await connection()
  return <ReferentesPanel sandbox={process.env.DIDIT_SANDBOX_SCENARIOS === 'true'} />
}
