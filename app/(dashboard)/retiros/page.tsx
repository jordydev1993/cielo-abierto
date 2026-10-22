import { connection } from 'next/server'
import { RetirosPanel } from '@/components/entities/retiros/RetirosPanel'

// Componente de servidor: el selector de escenario de sandbox lo habilita el servidor
// (DIDIT_SANDBOX_SCENARIOS), sin variables NEXT_PUBLIC_ (prompts/049, decisión 6).
// connection() hace que se lea en cada pedido y no quede fijo al compilar.
export default async function RetirosPage() {
  await connection()
  return <RetirosPanel sandbox={process.env.DIDIT_SANDBOX_SCENARIOS === 'true'} />
}
