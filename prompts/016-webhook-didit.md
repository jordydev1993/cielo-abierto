# Plan 016 — Webhook receptor de Didit (`/api/didit/webhook`)

## Objetivo

Crear el endpoint que recibe las notificaciones de Didit sobre el resultado de una sesión de verificación de identidad, validando su autenticidad (RNF-05: "no debe modificarse el estado de un retiro simplemente porque se recibió una petición HTTP"). El webhook ya está registrado en Didit apuntando a `https://cielo-abierto-two.vercel.app/api/didit/webhook` (destino `d8699159-5933-4cb8-92b5-f75a59e7b493`) — hoy responde 404 porque la ruta no existe.

**Alcance de este plan**: solo la validación de firma + parseo del evento + respuesta 2xx. **No** incluye escribir en tablas de negocio (`retiros`, sesiones de verificación) porque esas tablas todavía no existen — es el trabajo pendiente de Sofi (modelo de datos) y luego de Meli (lógica de negocio del endpoint). Este plan deja el endpoint listo, seguro, y con un TODO explícito marcando dónde Meli conecta la parte de negocio.

## Contexto

- `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md` — asigna este endpoint a Meli, pero Jordy decidió adelantar el scaffold de seguridad para no dejarla bloqueada por completo mientras Sofi termina el modelo.
- `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md` § 2 y § 4 — RNF-05 (validar autenticidad del webhook) y RNF-13 (timeouts/errores) listados como 0% implementado.
- Documentación oficial de Didit (`docs.didit.me/integration/webhooks`, consultada 2026-09-13): 3 headers de firma disponibles (`X-Signature-V2` recomendado, `X-Signature` legacy, `X-Signature-Simple` deprecado) + `X-Timestamp`. Se usa `X-Signature-V2`: HMAC-SHA256 sobre el JSON canónico (claves ordenadas recursivamente, `separators=(",", ":")`, sin escapar Unicode) del body, con el secreto compartido del destino del webhook.

## Archivos inspeccionados

- `app/api/usuarios/route.ts` — único route handler existente, patrón de referencia (aunque este caso no tiene sesión de usuario: el caller es Didit, no un usuario logueado).
- `lib/validations/*.schema.ts` — convención de un schema zod por dominio.
- `.env.local` — confirmado `DIDIT_API_KEY` y `DIDIT_WEBHOOK_SECRET` ya cargados (2026-09-13), gitignorados.
- `AGENTS-WEB.md` § Seguridad, § Prohibiciones.

## Skills utilizadas

Ninguna skill específica de webhooks existe todavía en `.claude/skills/`; se sigue el patrón general de `crud-generator`/`auth-implementation` en lo que aplica (validación server-side, secretos solo server-side).

## Supuestos

- El webhook `webhook_type` relevante para esta feature es `status.updated` (es el único evento suscripto en el destino creado). Otros `webhook_type` (ej. `data.updated`) se ignoran por ahora (se responde 200 sin procesar, para no romper la entrega si Didit los envía).
- No se persiste nada en Supabase todavía — se registra el evento validado en el log del servidor (`console.log`/`console.error`, visible en Vercel), suficiente para que Meli confirme que la firma y el payload llegan bien mientras construye la parte de datos.
- El endpoint no requiere sesión de usuario (`supabaseServer.auth.getUser()`) porque el caller es el servidor de Didit, no un usuario de la app — la autenticidad se garantiza con la firma HMAC, no con un JWT de Supabase.
- Formato de fecha para comparar `X-Timestamp`: segundos Unix, ventana de 300s (recomendación oficial).

## Archivos a crear/modificar

- **Crear** `app/api/didit/webhook/route.ts` — el endpoint.
- **Crear** `lib/validations/didit-webhook.schema.ts` — schema zod del payload (envelope: `event_id`, `webhook_type`, `timestamp`, `application_id`, `environment`, `status`, `session_id`, `vendor_data`, `metadata`, `decision` opcional).
- **Crear** `lib/didit/verify-signature.ts` — función pura `verifyDiditSignature(rawBody: string, timestampHeader: string, signatureHeader: string, secret: string): boolean`, reutilizable y testeable en aislamiento (canonicaliza el JSON, calcula HMAC-SHA256 con `crypto` de Node, compara con `crypto.timingSafeEqual`).

## Requisitos

1. Leer el body **crudo** (`await request.text()`), no `request.json()` directo — la firma se calcula sobre el JSON canónico derivado del body recibido, y necesitamos las claves tal cual llegaron antes de reordenarlas.
2. Verificar `X-Timestamp`: rechazar (401) si `abs(now - timestamp) > 300`.
3. Verificar `X-Signature-V2`: reconstruir el JSON canónico (parsear → ordenar claves recursivamente → `JSON.stringify` sin espacios) → HMAC-SHA256 con `DIDIT_WEBHOOK_SECRET` → comparar con `crypto.timingSafeEqual` contra el header. Si no matchea, 401.
4. Si pasa ambas validaciones: parsear el body con el schema zod. Si no matchea el schema, 400 (pero ya autenticado — no es un ataque, es un evento inesperado; loguear igual).
5. Loguear el evento validado (`webhook_type`, `session_id`, `status`) — sin loguear `decision` completo si trae datos biométricos/documento (RNF-04: logs sin biometría).
6. Responder `200` inmediatamente tras validar+loguear (recomendación oficial: no bloquear la respuesta con trabajo pesado — acá no hay trabajo pesado todavía, así que es directo).
7. Dejar un comentario `// TODO(Meli):` en el punto exacto donde va a ir la lógica de negocio (buscar la sesión en la futura tabla de sesiones Didit, actualizar `retiros`, etc.) una vez que exista el modelo de Sofi.

## Seguridad

- `DIDIT_WEBHOOK_SECRET` se lee solo server-side (`process.env.DIDIT_WEBHOOK_SECRET`), nunca se expone al cliente — mismo patrón que `SUPABASE_SERVICE_ROLE_KEY`.
- Comparación de firma con `crypto.timingSafeEqual` (no `===`), para evitar timing attacks.
- Ventana de timestamp de 300s previene replay de un webhook capturado.
- Si `DIDIT_WEBHOOK_SECRET` no está seteada en el entorno (ej. si Vercel no tiene la env var todavía), el endpoint responde 500 con un mensaje genérico — nunca falla "abierto" (nunca acepta un webhook sin poder verificar su firma).
- No se loguea el `decision` object completo (puede contener resultados de OCR/liveness/face_match) — solo el status agregado, siguiendo RNF-04/06/07 del propio documento fuente.

## Criterios de aceptación

- CA-1: Un POST sin `X-Signature-V2` o con firma inválida → 401, no se loguea como evento válido.
- CA-2: Un POST con firma válida pero `X-Timestamp` de hace más de 5 minutos → 401.
- CA-3: Un POST con firma y timestamp válidos, `webhook_type: "status.updated"` y un `status` válido → 200, se loguea `session_id` + `status`.
- CA-4: Un POST válido pero con `webhook_type` distinto de `status.updated` → 200 sin procesar (no rompe la entrega).
- CA-5: Sin `DIDIT_WEBHOOK_SECRET` en el entorno → 500, no se acepta el request por defecto.

## Chequeos

```bash
npm run lint
npm run build
npx tsc --noEmit
```

## Verificación manual

1. Simular una firma válida con un script local (Node, usando el mismo `DIDIT_WEBHOOK_SECRET` de `.env.local`) contra `http://localhost:3000/api/didit/webhook` con `curl` — confirmar 200 y el log en la consola de `next dev`.
2. Repetir con una firma alterada (1 carácter cambiado) — confirmar 401.
3. Repetir con `X-Timestamp` de hace 10 minutos — confirmar 401.
4. Una vez deployado, confirmar en el dashboard de Didit (`Webhooks` → destino `d8699159-5933-4cb8-92b5-f75a59e7b493` → historial de entregas) que ya no da 404.

## Informe para Meli (una vez aprobado e implementado)

Se genera un documento aparte (`INFORME-WEBHOOK-DIDIT-PARA-MELI.md`) resumiendo: qué quedó armado, dónde está el `TODO` para conectar el modelo de datos, y qué necesita ella de Sofi para completarlo.
