# 048 — Lógica del webhook de Didit: guardar el resultado (#23)

> **Estado: PLAN, pendiente de aprobación (21/10).** Paso 4 de lo que queda de la innovación 1. Completa el `TODO(Meli)` de `app/api/didit/webhook/route.ts`. Con esto, el #23 queda terminado.

## Objetivo

Que cuando Didit avise el resultado de una sesión, el sistema haga esto:
- busque la sesión;
- guarde el estado de Didit, el motivo del rechazo y si el DNI coincide;
- para un referente, cree la validación RENAPER;
- borre la sesión en Didit.

Todo sin guardar ni loguear datos personales que Didit devuelve (D-28). Cubre **REQ-EGR-04** (`specs/10-egreso-y-tutela.md`).

## Contexto

- **Webhook de Didit** ([docs](https://docs.didit.me/integration/webhooks)):
  - `status.updated` trae `event_id`, `session_id`, `status`, `vendor_data` y `metadata`. Trae `decision` solo con `Approved`, `Declined`, `In Review` y `Abandoned`.
  - El resultado de la identidad está en `decision.id_verifications[]`, con `status`, `verification_method`, `fallback_from` y `id_lookup`. `personal_number` llega en `Approved` (sandbox, 07/10, D-11).
  - **Didit espera 5 s** y reintenta hasta 2 veces ante `5xx`, `404`, timeout o error de conexión.
  - **No garantiza el orden de los eventos.** La clave de idempotencia es `event_id`.
- **Borrado** ([docs](https://docs.didit.me/sessions-api/delete-session)): `DELETE /v3/session/{session_id}/delete/` borra las imágenes, la selfie y el embedding facial. Responde `200`, `404` si la sesión ya no existe y `503` si hay que reintentar. Lo exige RF-10: borrar apenas se guarda el resultado.
- **Lo que ya existe:**
  - el webhook valida la firma, la ventana anti-replay y el envelope (`prompts/016`, `032`);
  - `sesiones_didit` tiene `estado_didit`, `error_proveedor`, `dni_coincide` y `finalizada_at`;
  - `fn_estado_rnf12_didit` deriva el estado, y los triggers hacen el resto: revisión, tope de intentos y Seguridad 2;
  - `validaciones_renaper` tiene `sesion_didit_id` (único) y `consultado_por NOT NULL`.
- **Decisiones que aplica:** D-1 (mapeo), D-4 (sesión desconocida), D-11 (mapeo a `validaciones_renaper`), D-12 (`provider_error`), D-14 (DNI), D-16 (vínculo `vigente`), D-28 (lista cerrada), M-01 (idempotencia), y la decisión 1 del Plan 047 (el webhook escribe con la service role).

## Archivos inspeccionados

`app/api/didit/webhook/route.ts`, `lib/validations/didit-webhook.schema.ts`, `lib/didit/client.ts`, `tests/integration/didit-webhook-http.test.ts`, `tests/support/next-server.ts`, `prompts/028` §11 a §14, `DECISIONES-PENDIENTES-INNOVACIONES.md` (D-1, D-4, D-11 a D-14, D-28), las migraciones `20261021180000` y `20261021230000`, y la documentación de Didit (webhooks y borrado de sesión).

## Skills utilizadas

`database-design`, `role-permission`, `testing-nnya`.

## Decisiones a aprobar

1. **Para un referente, `momento` de `validaciones_renaper`:** si el referente no tiene validaciones previas, `alta_referente`; si ya tiene, `reintento`. `egreso` queda para la carga manual.
2. **DNI distinto en un referente:** **no se crea** la validación RENAPER. No sabemos el estado del DNI esperado, y cualquier valor de `estado_dni` sería inventado. La sesión queda como "Identidad no verificada" (consume intento) y el vínculo sigue `propuesto` (D-16). Para un retiro no cambia nada: lo decide `estado_rnf12`.
3. **`Declined` sin `fallback_from.reason`:** cuenta como intento ("Identidad no verificada"), pero no crea validación RENAPER, porque no se puede elegir `estado_dni`. Se loguea un aviso sin datos. Con D-28 el motivo debería llegar siempre.
4. **El borrado en Didit va después de responder**, con `after()` de Next. Así no se pasa de los 5 s de Didit. Si falla, se loguea sin datos, y la retención de 30 días queda de respaldo (D-23).
5. **Idempotencia por estado** (no hay tabla de eventos):
   - si la sesión ya tiene un estado terminado, cualquier evento posterior es un no-op que responde `200`, sea el mismo estado o uno atrasado;
   - un estado no terminado nunca pisa uno terminado;
   - `event_id` solo va al log.

## Archivos a crear o modificar

| Archivo | Qué |
|---|---|
| `lib/didit/webhook.ts` | Funciones puras: `extraerResultadoDidit(payload)` lee **solo** `status`, `fallback_from.reason` y `personal_number`, validados con zod (D-28); `resolverActualizacion(sesion, resultado, dniEsperado)` devuelve la actualización o `ignorar`; `mapearValidacionRenaper(resultado, dniCoincide)` devuelve `{ resultado, estado_dni }` o `null` (D-11) |
| `lib/didit/client.ts` | `borrarSesionDidit()` con timeout y un reintento ante `503` |
| `lib/supabase/admin.ts` | Cliente con la service role, solo del servidor. Lo usan el webhook y, a futuro, `app/api/usuarios` (ese archivo no se toca en este plan) |
| `app/api/didit/webhook/route.ts` | Reemplaza el `TODO(Meli)` por la lógica de abajo |
| `tests/unit/didit-webhook-logica.test.ts` | Mapeo de D-1 / D-11 / D-12 / D-14, idempotencia y **minimización**: un payload completo, con nombre, fecha de nacimiento, link a la selfie y foto de RENAPER, solo deja pasar las 3 claves permitidas |
| `tests/support/next-server.ts` | **Nunca contra producción:** pasa `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` como cadena vacía, o los de Supabase local si se piden. Hoy los borra, y entonces Next toma los de `.env.local` |
| `tests/integration/didit-webhook-http.test.ts` | El contrato sin base (401/400/200) sigue igual. E4H-9 (evento válido) pasa al test nuevo |
| `tests/integration/didit-webhook-db.test.ts` | Contra Supabase local (se salta si no está levantado): sesión desconocida, `vendor_data` distinto, `Approved` con y sin DNI coincidente, `provider_error`, `no_match`, evento repetido y atrasado, referente aprobado, y que no queden nombre ni URL de selfie en la base ni en el log |
| `docs/testingManual/QA-DIDIT-RETIRO.md`, `TAREAS-…`, `AGENTS-WEB.md`, `README.md` | Estado del paso 4. `SUPABASE_SERVICE_ROLE_KEY` también la usa el webhook |

## Requisitos del webhook

Después de la firma, el envelope y `webhook_type` (sin cambios):

1. **Configuración:** si falta `NEXT_PUBLIC_SUPABASE_URL` o `SUPABASE_SERVICE_ROLE_KEY`, responde `500` (Didit reintenta). Log: `session_id` y `status`, como hoy.
2. **Sin `session_id`, o sesión desconocida** (D-4): `200` y un log con el `session_id`, sin escribir.
3. **`vendor_data` distinto de `sesiones_didit.id`:** `200`, un aviso en el log y sin escribir. Protege contra una fila insertada a mano con un `session_id` ajeno (Plan 047, riesgo aceptado).
4. **`extraerResultadoDidit`:** valida con zod y se queda solo con `status`, `fallback_from.reason` de la verificación `id_lookup` y su `personal_number`. El resto del payload no se lee ni se guarda.
5. **`resolverActualizacion`:**
   - **Estado no reconocido** (no es ninguno de los 10 de D-1): `200` sin escribir, y un aviso en el log.
   - **Sesión ya terminada** (decisión 5): no-op.
   - **`Approved`:** `estado_didit = 'Approved'`, `dni_coincide` = comparación de `personal_number` con el DNI esperado (`tutores.dni` o `referentes.dni`, solo dígitos), y `finalizada_at = now()`. Sin `personal_number`, `dni_coincide = false`.
   - **`Declined` con `provider_error`:** además, `error_proveedor = 'provider_error'` (D-12).
   - **`Declined` con otro motivo, o `Abandoned` / `Expired` / `Kyc Expired`:** `estado_didit` y `finalizada_at`.
   - **Estados no terminados** (`Not Started`, `In Progress`, `Awaiting User`, `Resubmitted`, `In Review`): solo `estado_didit`.
6. **Escritura:** un `UPDATE` de `sesiones_didit` con la service role. Los triggers derivan `estado_rnf12` y marcan la revisión. Si falla, responde `500`, para que Didit reintente.
7. **Referente** (`proposito = 'validacion_referente'`), con la sesión terminada:
   - con `mapearValidacionRenaper` (D-11), inserta en `validaciones_renaper` con `referente_id`, `sesion_didit_id`, `consultado_por` = `creada_por`, `dni_consultado` = `referentes.dni`, `momento` (decisión 1), `tiene_antecedentes = NULL` y **sin `respuesta_cruda`**;
   - si ya existe la fila para esa sesión (índice único), es un no-op;
   - `Expired` / `Abandoned` / `Kyc Expired`, el DNI distinto (decisión 2) y un `Declined` sin motivo (decisión 3) no crean validación.
8. **Retiro:** el webhook no toca `retiros`, para no duplicar el resultado (Plan 028 §14). Lo autoriza la pantalla, y Seguridad 2 lo controla.
9. **Respuesta:** `200` en cuanto se guarda. Después, con `after()`, se borra la sesión en Didit, solo si quedó terminada (decisión 4).
10. **Log:** solo `session_id`, `status` y, en los avisos, `event_id`. Nunca `decision`, `personal_number`, nombres ni URLs.

## Seguridad

- La service role se usa solo en el webhook, que ya se autentica con la firma HMAC y la ventana de 300 s. Nunca llega al cliente.
- **Minimización (D-28):** lista cerrada de 3 campos. `personal_number` solo se usa para comparar y no se guarda. No se guarda `decision` ni el cuerpo crudo. La sesión se borra en Didit (RF-10).
- **Los tests nunca apuntan a producción:** el helper fija las variables de Supabase, vacías o locales.
- **Sigue lo de siempre:** la base autoriza. Aunque el webhook se equivoque, Seguridad 2 y D-16 impiden autorizar un retiro o activar un vínculo sin identidad verificada.

## Supuestos a verificar

1. ✅ **Confirmado el 21/10 con una sesión real:** `personal_number` llega en `decision.id_verifications[i]` para `verification_method = 'id_lookup'` en un `Approved`. Así se vio en el sandbox el 07/10 (D-11), pero la documentación de webhooks no lo nombra. Se confirma con una sesión real del sandbox, que necesita `DIDIT_WORKFLOW_ID`.
2. En sandbox, `approve` devuelve como `personal_number` el DNI enviado en `expected_details` (Etapa 0 del plan 045). Si devuelve uno fijo, todos los `approve` de prueba van a dar `DNI_MISMATCH`, y para la QA se usan los fixtures firmados.
3. La API key de sandbox tiene el privilegio `delete:sessions`. Si no, el borrado da `403` y se loguea.

## Fuera de alcance

- Las pantallas (#26).
- Aplicar las migraciones en producción.
- Cargar el webhook de producción y las variables en Vercel.
- La QA de punta a punta con la cámara (#33).

## Criterios de aceptación

- Un webhook firmado con `Approved` y el DNI correcto deja la sesión en "Identidad verificada". Con otro DNI, en "Identidad no verificada", y el retiro no se puede autorizar.
- `provider_error` deja "Error del proveedor" sin consumir intento. Tres `no_match` dejan el retiro en `requiere_revision`.
- El mismo evento dos veces, o un `In Progress` después de un `Approved`, no cambia nada.
- Un referente aprobado crea su validación RENAPER (`aprobado` / `vigente`, sin `respuesta_cruda`), y el vínculo ya puede pasar a `vigente`.
- Una sesión desconocida, o con `vendor_data` distinto, responde `200` sin escribir.
- **Minimización:** el test controla que ni el nombre ni la URL de la selfie del payload de prueba aparezcan en `sesiones_didit`, `validaciones_renaper`, `audit_log` ni en el log del servidor.
- `npm run test:unit`, `npm run test:integration` (el contrato, más la parte con base si Supabase local está levantado), `npm run test:sql`, `npm run lint` (sin errores nuevos), `npx tsc --noEmit` y `npm run build` en verde.

## Chequeos

`npm run test:unit`, `npm run test:integration`, `npm run test:sql`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Verificación manual

1. Con `supabase start` y `next dev` apuntando a la base local, crear una sesión con `POST /api/didit/sesiones` (`sandbox_scenario: 'approve'`). Necesita `DIDIT_WORKFLOW_ID`.
2. Para que Didit llegue al webhook local hace falta un túnel, por ejemplo con `cloudflared` (no se instala en este plan). Si no hay túnel, mandar el webhook firmado a mano con el script del test.
3. Comprobar en Studio:
   - el estado de la sesión;
   - la validación del referente;
   - que la sesión ya no esté en el panel de Didit;
   - que el log solo muestre `session_id` y `status`.
