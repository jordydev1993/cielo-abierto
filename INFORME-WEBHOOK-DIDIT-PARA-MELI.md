# Informe: webhook de Didit — qué quedó armado y qué falta (para Meli)

**Fecha:** 2026-09-13
**Plan:** `prompts/016-webhook-didit.md` (✓ Aprobado por Jordy)

---

## Qué se construyó

El endpoint `POST /api/didit/webhook` ya existe y funciona en `app/api/didit/webhook/route.ts`. Hace **solo** la parte de seguridad — autenticar que el request realmente viene de Didit — no toca ninguna tabla de negocio todavía, porque el modelo de datos de Sofi (tabla `retiros` + sesiones de verificación) no está cerrado aún.

Concretamente valida:

1. **Firma `X-Signature-V2`**: HMAC-SHA256 sobre el JSON canónico del body (claves ordenadas, sin espacios), usando `DIDIT_WEBHOOK_SECRET` (ya cargada en `.env.local`, gitignoreada). Implementado en `lib/didit/verify-signature.ts` — función pura, se puede testear en aislamiento sin levantar el servidor.
2. **Frescura del timestamp** (`X-Timestamp`): rechaza si difiere más de 5 minutos del reloj del servidor — evita que alguien capture y reenvíe un webhook viejo.
3. **Forma del payload**: `lib/validations/didit-webhook.schema.ts` (zod) valida el envelope que Didit manda siempre (`event_id`, `webhook_type`, `timestamp`, `application_id`, `environment`, `status`, `session_id`, `vendor_data`, `metadata`, `decision`).

Si la firma o el timestamp fallan → `401`. Si el payload no matchea el schema (pero la firma sí es válida) → `400`. Si falta `DIDIT_WEBHOOK_SECRET` en el entorno → `500` (nunca acepta "abierto"). Si todo es válido pero `webhook_type` no es `status.updated` → `200` sin procesar (por ahora es el único evento que nos importa).

También tuve que corregir `proxy.ts`: el middleware de protección de rutas redirigía **cualquier** request sin sesión de Supabase a `/login`, incluidos los `/api/*` — así que Didit nunca hubiera llegado al endpoint. Se agregó una excepción puntual para `/api/didit/webhook` (se autentica con la firma HMAC, no con sesión de usuario).

Probado localmente (`next dev` + requests firmados a mano con el secreto real): firma ausente → 401, timestamp vencido → 401, firma alterada → 401, evento válido → 200 + logueado (`session_id` + `status`, sin datos biométricos), otro `webhook_type` → 200 sin procesar. `npx tsc --noEmit`, lint (de los archivos nuevos) y `npm run build` en verde.

## Qué NO se construyó (a propósito)

Nada de lógica de negocio. El endpoint hoy solo loguea `session_id` y `status` en la consola del servidor — no busca ni actualiza ningún registro en Supabase.

## Lo que necesitás de Sofi antes de continuar

Del modelo de datos que ella está diseñando, específicamente necesitás:
- La tabla de **sesiones de verificación Didit** (los 5 estados de RNF-12) — para poder buscar la sesión por `session_id` y actualizar su estado.
- La tabla **`retiros`** — para, una vez que el estado sea `Approved`, verificar la autorización de retiro vigente (RF-05/RF-06 — son dos validaciones independientes, un `Approved` de Didit **no autoriza** el retiro por sí solo).

## Dónde seguís vos

En `app/api/didit/webhook/route.ts` hay un comentario `// TODO(Meli):` justo después de donde se loguea el evento válido — ahí va:
1. Buscar la sesión de verificación por `session_id`.
2. Actualizar su estado según `status` (`Approved` / `Declined` / `In Review` / `In Progress` / `Not Started` / `Abandoned` / `Expired` / `Kyc Expired` / `Resubmitted` / `Awaiting User` — son los valores exactos que manda Didit, case-sensitive).
3. Si `status === 'Approved'`, validar la autorización de retiro vigente antes de habilitar el retiro.
4. El campo `decision` del payload (cuando `status` es `Approved`/`Declined`/`In Review`/`Abandoned`) trae el detalle por feature (`id_verifications[]`, etc., con `node_id` para correlacionar con el workflow) — no lo logueamos completo porque puede traer datos sensibles del feature `id_lookup`, pero si necesitás inspeccionar su forma exacta para tu propio desarrollo, te paso el output de `didit_workflow_get_graph` o hago una prueba puntual.

Referencia completa del payload y de la verificación de firma: `docs.didit.me/integration/webhooks` (consultada 2026-09-13).
