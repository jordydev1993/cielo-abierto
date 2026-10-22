# 047 — Endpoints de sesiones Didit: crear, consultar y fallback (#23)

> **Estado: PLAN, pendiente de aprobación (21/10).** Paso 3 de lo que queda de la innovación 1. La lógica del webhook es el paso 4 (plan aparte). Implementa el contrato del Plan 035 §7.1 a §7.5.

## Objetivo

Que la pantalla de retiro y la de referentes puedan:
- crear una sesión de verificación en Didit con el DNI que está en la base;
- consultar su estado y los intentos;
- que un Admin aplique el fallback manual.

Cada respuesta trae un código estable y el mensaje de D-33. Cubre **REQ-EGR-04** (`specs/10-egreso-y-tutela.md`).

## Contexto

- **API de Didit** ([docs](https://docs.didit.me/sessions-api/create-session)): `POST https://verification.didit.me/v3/session/` con el header `x-api-key`, solo desde el servidor.
  - Cuerpo: `workflow_id` (obligatorio), `vendor_data`, `expected_details.identification_number`, `language`, `metadata` y `sandbox_scenario`. Este último solo lo aceptan las apps de sandbox; las apps en `live` responden `400`.
  - Respuesta `201`: `session_id`, `session_token`, `url` y `status: "Not Started"`.
  - Errores posibles: `400`, `401`/`403` y `429` (600 llamadas por minuto).
- **Base** (PR #29 y #51):
  - `sesiones_didit` admite insertar desde el cliente solo una sesión sin resultado (`estado_didit`, `finalizada_at` y `dni_coincide` en `NULL`), y no tiene política de UPDATE.
  - `sesiones_didit_session_error_check` exige una de dos: `session_id`, o `error_proveedor = 'didit_no_disponible'`.
  - Los triggers aplican el tope de 3 intentos, "Requiere revisión", el fallback solo de Admin (D-2, D-20, D-26) y Seguridad 2.
- **Decisiones:** D-2, D-3, D-12, D-14, D-19, D-20, D-24 (QR o tablet), D-26 (consentimiento), D-27 (sesión de 1 hora), D-28, D-33, y `sandbox_scenario` (`prompts/045`, Supuesto 5). RNF-13: timeout de 15 s y un reintento en errores de red o 5xx (Plan 035 §7.1).
- **Patrón existente:** `app/api/usuarios/route.ts`. Verifica la sesión, después el rol con `get_my_role`, y escribe con el cliente de la sesión para que `fn_audit_trigger` registre al autor (`prompts/041`).

## Archivos inspeccionados

`app/api/usuarios/route.ts`, `app/api/didit/webhook/route.ts`, `lib/didit/verify-signature.ts`, `lib/supabase/server.ts`, `lib/supabase/currentUsuario.ts`, `proxy.ts`, `supabase/migrations/20261021180000_didit_retiros.sql`, `supabase/migrations/20261021230000_didit_dni_coincide.sql`, `prompts/035` §7, `.env.local` (solo los nombres de las variables), documentación oficial de Didit (crear sesión).

## Skills utilizadas

`auth-implementation`, `role-permission`, `database-design`.

## Decisiones a aprobar

1. **Cómo escribe el servidor en la base (pendiente desde el Plan 028).**
   - **(Recomendado)** Los endpoints de este plan usan **el cliente con la sesión del usuario**. RLS y los triggers deciden, y el audit log registra quién creó la sesión o aplicó el fallback. El **webhook (paso 4)**, que no tiene usuario, usa la **service role** solo del lado del servidor, igual que `app/api/usuarios`.
   - La alternativa son funciones `SECURITY DEFINER` para todo. Suman superficie expuesta por `/rest/v1/rpc` y, como ya pasó en `prompts/038`, obligan a revisar los permisos de `EXECUTE` en cada una.
2. **Orden al crear la sesión.** Primero se controla en el servidor que queden intentos (F-01: el 4.º se rechaza **antes** de llamar a Didit). Después se llama a Didit con `vendor_data` = el `id` que generamos para la fila. Por último se inserta la fila con ese `id` y el `session_id`. El trigger del tope sigue siendo la garantía final.
   - Si Didit falla, se inserta la fila con `error_proveedor = 'didit_no_disponible'`, sin `session_id`. No consume intento (D-12) y habilita el fallback.
3. **Una sola sesión abierta por retiro o referente.** Si ya hay una sesión sin resultado y con menos de 1 hora (D-27), se devuelve esa en vez de crear otra. Así se evitan sesiones duplicadas por un doble clic o una recarga.
4. **Consentimiento (D-26):**
   - Para un **retiro**, se exige `retiros.consentimiento_didit = 'aceptado'`. Lo guarda la pantalla de consentimiento (#26). Si no está, el endpoint responde `409 CONSENT_REQUIRED`.
   - Para un **referente** no hay columna, así que el cuerpo trae `consentimiento: true`.

## Archivos a crear o modificar

| Archivo | Qué |
|---|---|
| `lib/didit/client.ts` | `crearSesionDidit()`, solo del servidor. Hace `fetch` con `AbortSignal.timeout(15000)` y un reintento en errores de red o 5xx. Devuelve un resultado tipado (`ok` con `session_id` y `url`, o `didit_no_disponible`), sin excepciones. Recibe `fetch` inyectable para los tests |
| `lib/didit/mensajes.ts` | Los códigos estables del Plan 035 §7.4 y sus textos de D-33, en un solo lugar |
| `lib/didit/estado.ts` | Funciones puras: intentos usados, intentos restantes, `fallback_habilitado` y código de resultado, a partir de las filas de `sesiones_didit` |
| `lib/validations/didit-sesion.schema.ts` | Zod del cuerpo: `proposito`, uno de `retiro_id` o `referente_id`, `sandbox_scenario` opcional con lista cerrada, `consentimiento` (referente). Para el fallback: `motivo` obligatorio y sin espacios sobrantes |
| `app/api/didit/sesiones/route.ts` | `POST`: crear sesión (§7.1) |
| `app/api/didit/sesiones/[id]/route.ts` | `GET`: consultar el estado (§7.2) |
| `app/api/didit/sesiones/[id]/fallback/route.ts` | `POST`: fallback manual del Admin para el retiro de esa sesión (§7.3) |
| `tests/unit/didit-client.test.ts` | Timeout, 5xx con reintento, 4xx sin reintento, error de red, respuesta malformada, `sandbox_scenario` solo con la variable activa |
| `tests/unit/didit-estado.test.ts` | Intentos (D-3, D-12, D-14), `fallback_habilitado` (D-2, D-20, D-26) y códigos (§7.4) |
| `README.md`, `AGENTS-WEB.md` | Variables nuevas y los 3 endpoints en "Contratos de API" |
| `docs/testingManual/QA-DIDIT-RETIRO.md`, `TAREAS-…` | Estado del paso 3 |

**Variables de entorno nuevas (solo del servidor):**
- `DIDIT_WORKFLOW_ID`: el workflow v9 de la consola, según D-23.
- `DIDIT_SANDBOX_SCENARIOS`: `true` solo en local y preview con la app de sandbox.

`DIDIT_API_KEY` ya existe.

## Requisitos

### `POST /api/didit/sesiones` (§7.1)

1. Sin sesión responde `401`. Con un rol que no sea `Admin` ni `Equipo Tecnico` responde `403`. Si el cuerpo no es válido responde `400` (`INVALID_REQUEST`).
2. Lee el retiro o el referente con el cliente de la sesión, y con eso el **DNI esperado**: `tutores.dni` del retiro o `referentes.dni`. El DNI **nunca** viene del cliente (D-14).
   - El retiro tiene que estar `en_curso`. Si no, `409`.
   - El consentimiento, según la decisión 4.
3. Si hay una sesión abierta, la devuelve (decisión 3). Si no, cuenta los intentos terminados que consumen (D-3, D-12, D-14). Con 3, responde `409 MAX_ATTEMPTS_REACHED` sin llamar a Didit.
4. Llama a Didit con:
   - `workflow_id`;
   - `vendor_data` = el `id` de la fila;
   - `expected_details.identification_number` = el DNI;
   - `language: 'es'`;
   - `sandbox_scenario`, solo si `DIDIT_SANDBOX_SCENARIOS=true` y el valor está en la lista. Si no, se ignora.
5. Inserta la fila en `sesiones_didit` con el cliente de la sesión. Datos: `id`, `session_id`, `proposito`, `retiro_id` o `referente_id`, y `creada_por` = el usuario actual. Si el trigger rechaza por intentos, responde `409 MAX_ATTEMPTS_REACHED`.
6. Si Didit no responde, o responde un error (5xx, timeout, red, respuesta inválida, `400`/`401`/`403`/`429`), inserta la fila con `error_proveedor = 'didit_no_disponible'` y responde `502 PROVIDER_ERROR` con el mensaje C de D-33.
   - El detalle técnico se loguea sin datos personales: solo el código HTTP o el tipo de error, nunca el DNI ni la API key.
   - Nunca responde un 500 sin manejar.
7. Si todo sale bien, responde `201` con `{ sesion_id, url_didit, intentos_usados, intentos_restantes }`. `url_didit` es la `url` de Didit, que la pantalla muestra como QR o abre en la tablet (D-24). El `session_token` no se guarda ni se devuelve aparte.

### `GET /api/didit/sesiones/[id]` (§7.2)

1. Exige sesión y rol, igual que el anterior. Lee la sesión y las demás sesiones del mismo retiro o referente, con RLS.
2. Responde `{ estado_rnf12, code, message, intentos_usados, intentos_restantes, fallback_habilitado }`:
   - `code` y `message` salen de §7.4 / D-33;
   - `fallback_habilitado` es `true` solo si el rol es `Admin` y además hay error del proveedor, o 3 intentos fallidos, o consentimiento rechazado.
3. No llama a Didit: el estado lo actualiza el webhook. La pantalla consulta cada 3 a 5 s, hasta un tope de 60 a 90 s (N-6).

### `POST /api/didit/sesiones/[id]/fallback` (§7.3)

1. Exige sesión. Si el rol no es `Admin` responde `403`. El `motivo` es obligatorio (`400`).
2. Sobre el retiro de esa sesión, con el cliente de la sesión, actualiza `metodo_verificacion = 'manual'`, `autorizado_por` (el Admin actual), `autorizado_at = now()`, `motivo_fallback` y `resultado_autorizacion = 'autorizada'`.
3. Los triggers son la garantía (D-2, D-20, D-26, y que `autorizado_por` sea el usuario autenticado). Si rechazan, responde `409` con el mensaje.
4. Para referentes no hay fallback acá. La validación manual del Admin en `/referentes` sigue como está.

### Respuestas (§7.5)

Envelope común: `{ ok: boolean, code, message, data? }`. Los códigos y textos se toman de `lib/didit/mensajes.ts`. Ninguna respuesta incluye el DNI, la API key, ni la respuesta cruda de Didit.

## Seguridad

- La API key de Didit y `DIDIT_WORKFLOW_ID` se usan solo del lado del servidor. Las rutas están detrás de `proxy.ts`, que exige sesión; el único exceptuado sigue siendo el webhook.
- **La base autoriza:** el rol se chequea en el endpoint, pero los triggers y RLS son la garantía final.
- **El DNI esperado sale de la base**, nunca del cliente.
- `sandbox_scenario` sigue una lista cerrada y necesita la variable activa. En producción la variable no existe. Aunque se colara, la app `live` de Didit lo rechaza con `400`.
- **Riesgo conocido, aceptado:** la política de insert permite que un usuario autenticado inserte una fila `didit_no_disponible` sin pasar por el endpoint. No le da nada: no aprueba ni consume intento, y el fallback que habilita lo tiene que aplicar igual un Admin. El webhook (paso 4) va a ignorar `session_id` que no tengan `vendor_data` igual a nuestro `id`.

## Supuestos a verificar

1. El workflow v9 de la app de sandbox es el que va en `DIDIT_WORKFLOW_ID`. Se confirma en la consola o con el conector de Didit.
2. Los 4 valores de `sandbox_scenario` existen en el catálogo (`GET /v1/sandbox/scenarios/`), en especial `lookup_partial_match`. Se confirma en la Etapa 0 de la QA.
3. `retiros.consentimiento_didit` lo completa la pantalla de consentimiento (#26). Mientras tanto, para probar, se carga a mano en Supabase local.

## Fuera de alcance

- La lógica del webhook (paso 4): buscar la sesión, D-1, D-11, D-14, D-4 y crear la fila de `validaciones_renaper`.
- Las pantallas (#26).
- Borrar la sesión en Didit (RF-10).
- Aplicar en producción.

## Criterios de aceptación

- Con Supabase local y la app de sandbox, `POST` con `sandbox_scenario: 'approve'` devuelve `201` con la `url` de Didit, y la fila queda en `sesiones_didit` con `creada_por` y su entrada en el audit log.
- Un 4.º pedido responde `409 MAX_ATTEMPTS_REACHED` sin llamar a Didit (se verifica en el test con el `fetch` inyectado).
- Con Didit inaccesible (URL inválida o timeout), responde `502 PROVIDER_ERROR` con el mensaje C, la fila queda `didit_no_disponible` y no consume intento.
- `GET` devuelve el código y el mensaje de D-33 que corresponden al estado.
- El fallback con Equipo Tecnico da `403`. Con Admin y un motivo, deja el retiro en `autorizada` / `manual`.
- `npm run test:unit` (con los tests nuevos), `npm run test:sql`, `npm run lint` (sin errores nuevos), `npx tsc --noEmit` y `npm run build` en verde.

## Chequeos

`npm run test:unit`, `npm run test:sql`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Verificación manual

Con `npx supabase start`, `npm run dev`, `.env.local` apuntando a Supabase local y a la app de sandbox de Didit:

1. Iniciar sesión como Equipo Tecnico (usuarios del plan 045).
2. Cargar un retiro con consentimiento `aceptado` (por SQL en Studio, hasta el #26).
3. Desde la consola del navegador: `fetch('/api/didit/sesiones', { method: 'POST', body: JSON.stringify({ proposito: 'retiro', retiro_id, sandbox_scenario: 'lookup_no_match' }) })`. Abrir la `url` y completar el flujo.
4. Consultar `GET /api/didit/sesiones/{id}`. Sin el webhook del paso 4, el estado sigue "Pendiente": es lo esperado.
5. Probar el fallback con los dos roles.

Las sesiones de Didit se borran al terminar.
