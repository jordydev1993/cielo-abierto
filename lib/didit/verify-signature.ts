import { createHmac, timingSafeEqual } from 'crypto'

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}

/**
 * Verifica la firma X-Signature-V2 de un webhook de Didit: HMAC-SHA256 sobre
 * el JSON canónico del body (claves ordenadas, sin espacios), más una
 * ventana de 5 minutos sobre X-Timestamp para evitar replay.
 */
export function verifyDiditSignature(
  rawBody: string,
  timestampHeader: string | null,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!timestampHeader || !signatureHeader) return false

  const timestamp = Number(timestampHeader)
  if (!Number.isFinite(timestamp)) return false

  const nowSeconds = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSeconds - timestamp) > 300) return false

  let canonicalBody: string
  try {
    const parsed = JSON.parse(rawBody)
    canonicalBody = JSON.stringify(canonicalize(parsed))
  } catch {
    return false
  }

  const expectedSignature = createHmac('sha256', secret).update(canonicalBody).digest('hex')

  const expectedBuffer = Buffer.from(expectedSignature, 'hex')
  const receivedBuffer = Buffer.from(signatureHeader, 'hex')

  if (expectedBuffer.length !== receivedBuffer.length) return false

  return timingSafeEqual(expectedBuffer, receivedBuffer)
}
