# 046 — D-14 en la base (`dni_coincide`), `error_proveedor` cerrado y pruebas de seguridad en SQL

> **Estado: PLAN, pendiente de aprobación (21/10).** Paso 2 de lo que queda de la innovación 1 (`TAREAS-INNOVACION-1-POR-INTEGRANTE.md`, "Implementación"). Sale de la revisión del PR #29 (comentario en el #23).

## Objetivo

Que la base no permita autorizar ni realizar un retiro cuando Didit aprueba la sesión pero el DNI verificado no es el del tutor (D-14). Además: cerrar los valores de `error_proveedor`, para que un rechazo común nunca se tome como error del proveedor (D-12), y dejar en el repo pruebas de seguridad que se puedan repetir. Cubre **REQ-EGR-04** (`specs/10-egreso-y-tutela.md`).

## Contexto

- **D-14:** `expected_details.identification_number` no rechaza la sesión, Didit solo genera una advertencia (confirmado en sandbox el 07/10). El webhook compara `personal_number` con el DNI esperado y, si no coincide, lo trata como rechazo.
- **El problema hoy** (migración `20261021180000_didit_retiros.sql`, PR #29):
  - `fn_validar_identidad_para_retiro` (Seguridad 2) mira solo `estado_didit = 'Approved'`.
  - `fn_estado_rnf12_didit` traduce `Approved` a "Identidad verificada" sin mirar el DNI.
  - `fn_marcar_retiro_revision_didit` y `fn_validar_fallback_retiro` cuentan los intentos fallidos con `estado_didit`, y un `Approved` con otro DNI no cuenta como fallido.
  - Por eso, en cuanto el webhook (#23) guarde un `Approved` con otro DNI, el retiro se podría autorizar.
- **`error_proveedor`** es `TEXT` libre. Cualquier valor no nulo significa "Error del proveedor", no cuenta como intento y habilita el fallback.
- **Pruebas de seguridad:** Sofi las corrió en Supabase local el 21/10 (`QA-DIDIT-RETIRO.md`, "Pruebas de seguridad — PR #29"), pero el script no está en el repo. El `.gitignore` ignora todos los `*.sql` salvo `supabase/migrations/`.
- **Hallazgo:** el PR #29 también trajo el trigger de D-16 (`fn_validar_renaper_vinculo`). Desde el 21/10 la base rechaza pasar a `vigente` un vínculo con referente que no tenga una validación RENAPER aprobada. Ver "Fuera de alcance".

## Archivos inspeccionados

`supabase/migrations/20261021180000_didit_retiros.sql` (funciones `fn_validar_max_intentos_didit`, `fn_marcar_retiro_revision_didit`, `fn_validar_fallback_retiro`, `fn_validar_identidad_para_retiro`, `fn_estado_rnf12_didit`, `fn_normalizar_estado_sesion_didit`, `fn_validar_renaper_vinculo`, y las políticas de `sesiones_didit` y `retiros`), `DECISIONES-PENDIENTES-INNOVACIONES.md` (D-1, D-11, D-12, D-14), `prompts/035` §7.4, `prompts/045`, `docs/testingManual/QA-DIDIT-RETIRO.md`, `.gitignore`, `specs/10-egreso-y-tutela.md`.

## Skills utilizadas

`database-design`, `role-permission`.

## Decisiones a aprobar

1. **`dni_coincide` es obligatorio cuando la sesión está `Approved`**, mediante un `CHECK`. Otra opción era tomar `NULL` como "Pendiente", pero así el webhook no se puede olvidar de comparar el DNI.
2. **Los conteos se pasan a `estado_rnf12`.** Fallido = "Identidad no verificada" y aprobado = "Identidad verificada". Así hay una sola fuente de verdad: la regla de qué es "verificado" vive solo en `fn_estado_rnf12_didit`.
3. **Valores de `error_proveedor`:**
   - `provider_error`: Didit creó la sesión, pero RENAPER no respondió (`fallback_from.reason = 'provider_error'`). Exige `session_id`.
   - `didit_no_disponible`: no se pudo crear la sesión, por timeout, 5xx, red o respuesta inválida. Exige `session_id` en `NULL`.
   - Los dos se muestran igual en la pantalla (mensaje C de D-33). El detalle técnico no se guarda, porque podría filtrar datos internos (RNF-13).

## Archivos a crear o modificar

| Archivo | Cambio |
|---|---|
| `supabase/migrations/2026102XHHMMSS_didit_dni_coincide.sql` | Migración nueva (detalle abajo) |
| `tests/sql/didit-seguridad.sql` | Pruebas de seguridad, en una transacción con `ROLLBACK` |
| `package.json` | Script `test:sql` que corre el archivo en el Supabase local |
| `.gitignore` | Excepción `!tests/sql/*.sql` |
| `types/database.generated.ts` | Regenerado con `npx supabase gen types typescript --local` |
| `types/database.types.ts` | Solo si hace falta angostar `error_proveedor` a su unión literal |
| `docs/testingManual/QA-DIDIT-RETIRO.md` | Cómo correr `test:sql` y los resultados |
| `specs/10-egreso-y-tutela.md` | Estado y evidencia de REQ-EGR-04 |
| `TAREAS-INNOVACION-1-POR-INTEGRANTE.md` | Marcar el paso 2 |

## Requisitos de la migración

1. **Columna** `sesiones_didit.dni_coincide BOOLEAN NULL`, con comentario: la completa el webhook comparando `personal_number` con `tutores.dni` (retiro) o `referentes.dni` (validación de referente).
2. **`CHECK`** `estado_didit IS DISTINCT FROM 'Approved' OR dni_coincide IS NOT NULL`.
3. **`CHECK` de `error_proveedor`:**
   - `error_proveedor IS NULL OR error_proveedor IN ('provider_error', 'didit_no_disponible')`;
   - reemplaza `sesiones_didit_session_error_check`: si `session_id IS NULL`, `error_proveedor = 'didit_no_disponible'`; si es `provider_error`, `session_id` no es nulo.
   - Antes de aplicarla, verificar que no haya filas que la rompan (la tabla debería estar vacía).
4. **`fn_estado_rnf12_didit(p_estado_didit, p_error_proveedor, p_dni_coincide)`** (con tres parámetros; se borra la versión de dos):
   - `Approved` y `dni_coincide = TRUE` → "Identidad verificada";
   - `Approved` y `dni_coincide = FALSE` → "Identidad no verificada";
   - el resto, igual que hoy.
5. **`fn_normalizar_estado_sesion_didit`** pasa `NEW.dni_coincide`, y su trigger también se dispara con `UPDATE OF dni_coincide`.
6. **`fn_marcar_retiro_revision_didit`:**
   - fallidos = `estado_rnf12 = 'Identidad no verificada'`;
   - aprobación = `BOOL_OR(estado_rnf12 = 'Identidad verificada')`;
   - el trigger también se dispara con `dni_coincide`.
7. **`fn_validar_fallback_retiro`:** los intentos fallidos se cuentan con `estado_rnf12 = 'Identidad no verificada'`.
8. **`fn_validar_identidad_para_retiro`:** exige que la última sesión del retiro tenga `estado_rnf12 = 'Identidad verificada'`. El camino manual queda igual.
9. **`fn_validar_max_intentos_didit` no cambia.** Ya cuenta todas las sesiones terminadas, incluido un `Approved` con otro DNI, y excluye los errores del proveedor.
10. **Política `sesiones_didit_insert`:** suma `AND dni_coincide IS NULL`.
11. **Para referentes no cambia nada en la base.** El webhook crea la fila de `validaciones_renaper` con `resultado = 'rechazado'` si el DNI no coincide (D-11 + D-14). Eso es del #23.

## Pruebas (`tests/sql/didit-seguridad.sql`)

Todo dentro de `BEGIN … ROLLBACK`, con datos ficticios: DNI `99…`, y usuarios de `auth.users` creados en la misma transacción. Para simular cada rol se usa `SET LOCAL ROLE authenticated` con `request.jwt.claims`. Cada caso imprime `OK` o corta con un error que dice qué falló.

| # | Caso | Esperado |
|---|---|---|
| S1 | Equipo Tecnico inserta una sesión con `estado_didit = 'Approved'` | Bloqueado por RLS (Seguridad 1) |
| S2 | Equipo Tecnico inserta una sesión con `dni_coincide = true` | Bloqueado por RLS |
| S3 | Equipo Tecnico hace UPDATE de una sesión | 0 filas (no hay política de UPDATE) |
| S4 | Retiro a `autorizada` / `realizada` sin sesión verificada | Bloqueado (Seguridad 2) |
| S5 | Sesión `Approved` con `dni_coincide = false` → retiro a `autorizada` | **Bloqueado (D-14)** |
| S6 | Sesión `Approved` con `dni_coincide = true` → retiro a `autorizada` | Permitido |
| S7 | `Approved` sin `dni_coincide` | Rechazado por el `CHECK` |
| S8 | `error_proveedor = 'no_match'` | Rechazado por el `CHECK` |
| S9 | `session_id` nulo con `provider_error` | Rechazado por el `CHECK` |
| S10 | 3 sesiones `Approved` con otro DNI | Retiro en `requiere_revision`; la 4.ª sesión se rechaza |
| S11 | 2 sesiones con `provider_error` y 1 `no_match` | No pasa a revisión (D-12) |
| S12 | Fallback por un Equipo Tecnico | Bloqueado (D-2) |

Las sesiones en estado terminado se cargan como `postgres`, simulando al webhook que escribe del lado del servidor. Las pruebas de rol se hacen como `authenticated`.

## Seguridad

- Es una regla de la base, no de la UI. La garantía sigue siendo RLS más triggers (`AGENTS.md`, "La base autoriza").
- No se guarda el DNI que devuelve Didit (`personal_number`): solo el resultado de la comparación (minimización, D-28).
- `tests/sql/` solo admite scripts de prueba con datos ficticios. La excepción del `.gitignore` es solo para esa carpeta: los backups (`*.sql` en el resto) siguen ignorados.
- Las pruebas corren solo contra Supabase local. El script corta al empezar si encuentra el usuario real `admin@arguelloinfancias.com`, porque eso indica que no es la base local. El script `test:sql` solo apunta al puerto local 54322.

## Supuestos a verificar

1. `sesiones_didit` está vacía en producción. Si la migración del PR #29 ya está aplicada en producción, verificarlo antes de aplicar esta.
2. **¿La migración del PR #29 ya se aplicó en producción?** Si no, se aplican las dos juntas y en orden. Cómo y cuándo se aplica en producción lo decide Jordy, y queda fuera de este plan.

## Fuera de alcance

- La lógica del webhook y los endpoints (#23, pasos 3 y 4).
- **D-16 en la UI:** como la base ya rechaza el paso a `vigente` sin validación, el formulario de vínculos de la pantalla real va a mostrar un error crudo de la base si alguien elige "Vigente". Se resuelve en el #26: deshabilitar la opción o mostrar un mensaje claro. Hasta entonces, el texto "Pendiente de validación de identidad" de `VinculoTutelaList` es correcto.

## Criterios de aceptación

- `npx supabase db reset` aplica todas las migraciones sin errores.
- `npm run test:sql` pasa los 12 casos.
- `npm run test:unit`, `npm run lint` (sin errores nuevos), `npx tsc --noEmit` y `npm run build` en verde.
- Los tipos están regenerados, con `dni_coincide` en `sesiones_didit`.
- REQ-EGR-04 actualizado en la spec, con la evidencia.

## Chequeos

`npx supabase db reset`, `npm run test:sql`, `npm run test:unit`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Verificación manual

En el Studio local (http://127.0.0.1:54323), insertar como `postgres` una sesión `Approved` con `dni_coincide = false` para un retiro, y comprobar que:
- `estado_rnf12` queda en "Identidad no verificada";
- el UPDATE del retiro a `autorizada` falla con "No se puede autorizar o realizar el retiro sin identidad verificada".
