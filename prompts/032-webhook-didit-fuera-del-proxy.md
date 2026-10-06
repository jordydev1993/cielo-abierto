# 032 — Sacar `/api/didit/webhook` del alcance de `proxy.ts`

**Tarjeta:** sin tarjeta — Jordy — Baja
**Estado:** ✓ Aprobado el 2026-10-06. Implementado (ver § Implementación). Desvío respecto del plan: `return` temprano en vez de exclusión en el `matcher`.

> Numeración: `028`–`030` quedan reservados para los planes de Meli (setup de Playwright y QA de Didit, hoy sin commitear) y `031` para el de Cami.

## Objetivo

Que el middleware (`proxy.ts`) no se ejecute para el webhook de Didit. Hoy corre en cada notificación aunque no aporte nada: el webhook se autentica con firma HMAC (`prompts/016`), no con sesión de Supabase.

Efectos buscados:

1. El webhook deja de depender de `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Destraba la etapa E-4 de Meli (tests de contrato del webhook) sin entorno de Supabase.
2. El criterio CA-5 de `prompts/016` ("sin `DIDIT_WEBHOOK_SECRET` → 500") pasa a ser verificable por el camino correcto. Hoy, sin variables de Supabase, el 500 sale de `proxy.ts:7` antes de llegar a la ruta (hallazgo R-4 de Meli).
3. Una llamada menos a Supabase Auth (`auth.getUser()`) por cada notificación de Didit.

## Contexto

- `proxy.ts:7` crea un cliente de Supabase para **toda** request que matchea el `matcher` (`proxy.ts:52-55`) y lanza sincrónicamente si faltan la URL o la key.
- `proxy.ts:35,37` ya exceptúa el webhook del redirect a `/login` (`isDiditWebhook`). Esa excepción se agregó en `prompts/016`. Pero la excepción vive **después** de crear el cliente y llamar a `getUser()`, así que no evita ninguna de las dos cosas.
- `app/api/didit/webhook/route.ts` no importa Supabase ni usa cookies ni sesión. No necesita nada del middleware.
- El análisis viene del trabajo de QA de Meli (R-3, R-4) y está verificado por lectura de código en `master` (`84c4d23`).

## Archivos inspeccionados

- `proxy.ts` (56 líneas, completo).
- `app/api/didit/webhook/route.ts` (51 líneas, completo).
- `lib/didit/verify-signature.ts` (52 líneas, completo).
- `next.config.ts`: sin rewrites ni headers que interactúen con el matcher.
- `prompts/016-webhook-didit.md` (criterios CA-1 a CA-5).

## Skills utilizadas

- `vercel:nextjs` (criterio): en Next 16 el `matcher` de `proxy.ts` es la forma prevista de excluir rutas del middleware. El patrón actual ya usa un lookahead negativo con `$` para los assets estáticos.

## Supuestos

1. Ninguna otra parte del sistema depende de que el middleware corra sobre `/api/didit/webhook`. Verificado: lo único que hace `proxy.ts` es refrescar la sesión y redirigir, y el webhook no usa sesión.
2. La exclusión se escribe con `$` para que matchee **solo** la ruta exacta. `/api/didit/webhook-otra` o `/api/didit/webhook/x` siguen pasando por el middleware.

## Archivos a crear/modificar

- **Modificar** `proxy.ts`:
  - En el `matcher`, agregar `api/didit/webhook$` al lookahead negativo:
    ```ts
    '/((?!_next/static|_next/image|favicon.ico|api/didit/webhook$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ```
  - Eliminar la constante `isDiditWebhook` y su uso en la condición del redirect (`proxy.ts:34-35,37`). Con el matcher, ese código no se ejecuta nunca para esa ruta; dejarlo sería código muerto que sugiere un mecanismo que ya no es el real. En su lugar va un comentario junto al `matcher` que explica la exclusión y referencia `prompts/016` y este plan.

Ningún otro archivo cambia. No toca `route.ts`, `lib/didit/`, Supabase, migraciones ni dependencias.

## Requisitos

1. `/api/didit/webhook` no ejecuta `proxy()`.
2. Cualquier otra ruta, incluidas `/api/usuarios`, `/api/incidentes/prediccion`, `/api/reportes/senaf` y las páginas, mantiene exactamente el comportamiento actual (refresh de sesión + redirect a `/login` sin usuario).
3. El webhook conserva intactas sus respuestas actuales: `500` sin secreto, `401` con firma inválida o timestamp vencido, `400` con body o schema inválido, `200` en los demás casos.

## Seguridad

- **No se reduce ninguna protección real.** El middleware nunca protegió el webhook: ya estaba exceptuado del redirect. Lo único que hacía era crear un cliente y consultar una sesión que no existe (Didit no manda cookies).
- La autenticación del webhook sigue siendo la firma HMAC `X-Signature-V2` + ventana de 300s (`verify-signature.ts`). Sin `DIDIT_WEBHOOK_SECRET` sigue fallando cerrado (`500`).
- Riesgo a controlar: un matcher mal escrito podría excluir más rutas de las debidas. Se mitiga con el `$` (ruta exacta) y con la verificación manual de los pasos 3 y 4.

## Criterios de aceptación

- CA-1: Con las variables de Supabase **vacías**, `POST /api/didit/webhook` responde lo que decide la ruta, no un 500 del middleware: `500 {"error":"Webhook no configurado."}` sin secreto, `401 {"error":"Firma inválida."}` con secreto y sin firma.
- CA-2: Con las variables de Supabase vacías, `GET /login` sigue fallando en `proxy.ts` (confirma que solo se excluyó el webhook).
- CA-3: Con entorno completo y sin sesión, `GET /dashboard` y `GET /api/usuarios` siguen redirigiendo a `/login`.
- CA-4: Con entorno completo, una notificación firmada válida sigue dando `200` y logueando `session_id` + `status` (CA-3 de `prompts/016`).

## Chequeos

```bash
npm run lint      # baseline con errores preexistentes en código de la app; proxy.ts debe aportar 0
npx eslint proxy.ts
npx tsc --noEmit
npm run build
```

## Verificación manual

1. **Sin Supabase** (simula el entorno de Meli). Next no pisa variables ya definidas en el proceso, así que vaciarlas al arrancar alcanza:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= DIDIT_WEBHOOK_SECRET= npx next dev
   curl -i -X POST http://localhost:3000/api/didit/webhook -d '{}'
   ```
   Esperado: `500 {"error":"Webhook no configurado."}`, que viene de `route.ts:8`. Antes del cambio: 500 con `Your project's URL and Key are required…` en la consola.
2. Igual que 1, pero con `DIDIT_WEBHOOK_SECRET=test` → esperado `401 {"error":"Firma inválida."}`.
3. Igual que 1: `curl -i http://localhost:3000/login` → sigue en 500 desde `proxy.ts` (CA-2).
4. **Con `.env.local` normal**, sin sesión: `curl -i http://localhost:3000/dashboard` y `curl -i http://localhost:3000/api/usuarios` → `307` a `/login` (CA-3).
5. Con `.env.local` normal: notificación firmada a mano con el secreto real, igual que en la verificación de `prompts/016` → `200` y log `session_id=… status=…` (CA-4).
6. Después del deploy: en el panel de Didit (webhook `d8699159-5933-4cb8-92b5-f75a59e7b493`), confirmar que las entregas siguen llegando con `2xx`.

## Implementación (2026-10-06)

### Desvío respecto del plan: `return` temprano en vez de `matcher`

Se implementó primero tal cual el plan (`api/didit/webhook$` en el lookahead del `matcher`) y **falló la verificación manual**: con ese patrón, `POST /api/didit/webhook` respondía **404** (Next servía la página de not-found). Con la versión original de `proxy.ts`, en el mismo servidor, respondía 500 desde el proxy, así que el 404 lo causaba el cambio. Sin el `$` funcionaba, pero excluía por prefijo (`/api/didit/webhook-x`, `/api/didit/webhook/x`), lo que contradice el supuesto 2 (ruta exacta).

Solución: `proxy.ts` sale con `NextResponse.next()` **antes de crear el cliente de Supabase** cuando `pathname === '/api/didit/webhook'` (comparación exacta). Logra los tres efectos del objetivo sin depender del regex del `matcher`. Se eliminó `isDiditWebhook`, que quedó redundante. El `matcher` no cambió.

### Verificación manual (resultados reales)

| Paso | Entorno | Request | Resultado |
|---|---|---|---|
| 1 | Sin Supabase ni secreto | `POST /api/didit/webhook` | `500 {"error":"Webhook no configurado."}`, desde `route.ts` ✅ |
| 2 | Sin Supabase, secreto ficticio | sin firma | `401 {"error":"Firma inválida."}` ✅ |
| 2b | Sin Supabase, secreto ficticio | firmado con el mismo secreto | `200 {"received":true}` + log `session_id=… status=Approved` ✅ |
| 2c | Sin Supabase, secreto ficticio | firmado con otro secreto | `401` ✅ |
| 3 | Sin Supabase | `GET /login`, `POST /api/didit/webhook-x`, `POST /api/didit/webhook/x` | `500` desde `proxy.ts` (siguen pasando por el proxy) ✅ |
| 4 | `.env.local` real, sin sesión | `GET /dashboard`, `GET /nnya`, `POST /api/usuarios` | `307` → `/login` ✅; `GET /login` → `200` |
| 5 | `.env.local` real | firmado con el secreto real | `200` + log ✅ |
| 6 | Producción | panel de Didit | Pendiente: verificar después del deploy |

### Chequeos

- `npx eslint proxy.ts` → 0 errores.
- `npx tsc --noEmit` → exit 0.
- `npm run build` → exit 0 (`ƒ /api/didit/webhook`, `ƒ Proxy`).
- `npm run lint` global → 85 errores **preexistentes** en código de la app (mismo baseline medido por Meli, R-11). `proxy.ts` aporta 0.
