import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'

export type StartedNextServer = {
  baseUrl: string
  output: () => string
  stop: () => Promise<void>
}

type StartOptions = {
  port: number
  /**
   * Secreto ficticio para el proceso. Si es `undefined`, la variable
   * `DIDIT_WEBHOOK_SECRET` se fuerza a cadena vacía en el entorno del servidor
   * (caso 500). Con cadena vacía el valor ya existe en `process.env`, por lo
   * que `@next/env` no lo sobreescribe con el de `.env.local`: el 500 queda
   * determinista aunque exista un `.env.local` con un secreto.
   */
  secret?: string
  /**
   * Supabase LOCAL para los tests que usan la base (prompts/048). Sin esto, las
   * variables de Supabase se fuerzan a cadena vacía: si solo se borraran, Next
   * tomaría las de `.env.local`, que apuntan a producción.
   */
  supabase?: { url: string; anonKey: string; serviceRoleKey: string }
  readyTimeoutMs?: number
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function killTree(child: ChildProcess): void {
  if (child.pid == null) return
  if (process.platform === 'win32') {
    // En Windows `next dev` deja hijos (workers). /T mata el árbol completo.
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    try {
      process.kill(-child.pid, 'SIGKILL')
    } catch {
      try {
        process.kill(child.pid, 'SIGKILL')
      } catch {
        // El proceso ya no existe.
      }
    }
  }
}

/**
 * Levanta `next dev` en 127.0.0.1 con un entorno controlado y espera hasta que
 * la ruta del webhook responda. El webhook queda exceptuado del middleware
 * (`proxy.ts`, Plan 032). Las variables de Supabase y `DIDIT_API_KEY` siempre se
 * fijan acá (vacías, o las de Supabase local): nunca se usan las de `.env.local`.
 */
export async function startNextServer(options: StartOptions): Promise<StartedNextServer> {
  const { port, secret, supabase, readyTimeoutMs = 120_000 } = options
  const cwd = process.cwd()
  const nextBin = path.join(cwd, 'node_modules', 'next', 'dist', 'bin', 'next')

  const env: NodeJS.ProcessEnv = { ...process.env }
  // Cadena vacía (no delete): así `@next/env` no las completa desde `.env.local`.
  env.NEXT_PUBLIC_SUPABASE_URL = supabase?.url ?? ''
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabase?.anonKey ?? ''
  env.SUPABASE_SERVICE_ROLE_KEY = supabase?.serviceRoleKey ?? ''
  // Sin API key, el webhook no llama a Didit para borrar sesiones de prueba.
  env.DIDIT_API_KEY = ''
  if (secret === undefined) {
    env.DIDIT_WEBHOOK_SECRET = ''
  } else {
    env.DIDIT_WEBHOOK_SECRET = secret
  }

  const child = spawn(
    process.execPath,
    [nextBin, 'dev', '--port', String(port), '--hostname', '127.0.0.1'],
    {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      detached: process.platform !== 'win32',
    }
  )

  let output = ''
  child.stdout?.on('data', (chunk: Buffer) => {
    output += chunk.toString()
  })
  child.stderr?.on('data', (chunk: Buffer) => {
    output += chunk.toString()
  })

  let exited = false
  let exitInfo = ''
  child.on('exit', (code, signal) => {
    exited = true
    exitInfo = `code=${code} signal=${signal}`
  })

  const baseUrl = `http://127.0.0.1:${port}`
  const deadline = Date.now() + readyTimeoutMs
  let ready = false

  while (Date.now() < deadline) {
    if (exited) {
      throw new Error(`Next dev salió antes de estar listo (${exitInfo}).\n${output}`)
    }
    try {
      const res = await fetch(`${baseUrl}/api/didit/webhook`, {
        method: 'POST',
        body: '{}',
        signal: AbortSignal.timeout(30_000),
      })
      // Cualquier respuesta HTTP (500/401/…) confirma que el server responde.
      void res
      ready = true
      break
    } catch {
      await delay(500)
    }
  }

  if (!ready) {
    killTree(child)
    throw new Error(`Timeout esperando a Next dev en ${baseUrl}.\n${output}`)
  }

  const stop = async (): Promise<void> => {
    if (exited) return
    await new Promise<void>((resolve) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        resolve()
      }
      child.once('exit', done)
      killTree(child)
      setTimeout(done, 5_000)
    })
  }

  return { baseUrl, output: () => output, stop }
}
