# Innovación 1 — Lo que falta por integrante

**Fecha:** 2026-10-07 · **Actualizado:** 2026-10-19
**Innovación:** validación de identidad con RENAPER vía Didit, para dos usos: el **retiro** de un NNyA por su tutor autorizado y el **alta de referentes** en la revinculación familiar (proceso 1.5).
**Decisiones vigentes:** D-1 a D-28 y D-33 en `DECISIONES-PENDIENTES-INNOVACIONES.md`. **Contrato:** `prompts/035-requisitos-contrato-didit.md`.

> **Estado al 22/10: terminada.** Código en `master` (planes 046 a 050), migraciones aplicadas en producción, `DIDIT_WORKFLOW_ID` cargada en Vercel y QA cerrada (#33). **Decisiones del 22/10:** se usa solo la app **gratuita de sandbox** de Didit, para mostrar que la innovación funciona, sin consultar a RENAPER de verdad; y el entorno de preview de Vercel no se configura (no hay una segunda base de Supabase). **Modelo de datos:** `prompts/028-modelo-datos-didit-retiros.md`.

> Cada tarea que toque código o schema sigue el ciclo de `AGENTS-WEB.md`: plan en `prompts/`, aprobación de Jordy, implementación y PR desde una rama propia.

---

## Orden de dependencias

```
Jordy (consola Didit + 3 definiciones)
        │
Sofi ── migración #18 ──────────────┐
        │                           │
Meli ── requisitos + contrato ──► webhook y endpoints #23 ──► tests
        │                                                      │
Cami ── diseño con datos de ejemplo ──────────────► pantallas #26 conectadas
```

- **Arrancan ya:** Jordy, Sofi (#18), Meli (requisitos y contrato) y Cami (solo diseño, cuando Meli tenga el contrato).
- **Bloqueado:** la lógica del webhook espera la migración. Las pantallas conectadas esperan los endpoints.

---

## Lo que ya está hecho

| Qué | Dónde |
|---|---|
| Cuenta de Didit en modo de prueba, workflow `id_lookup` (DNI + selfie contra RENAPER) | App "arguelloinfancias (Sandbox)", workflow v2 |
| Webhook en producción que verifica la firma HMAC y la ventana anti-replay | `app/api/didit/webhook/route.ts` (`prompts/016`) |
| Webhook fuera del proxy: se testea sin variables de Supabase | `proxy.ts` (`prompts/032`) |
| Webhook probado con Didit real: 9 notificaciones, todas `200` | Sandbox, 07/10 |
| Estructura real de la respuesta de Didit y mapeo de resultados | D-11 a D-14 |
| Modelo de datos aprobado: `retiros`, `sesiones_didit`, `autorizaciones_retiro` | `prompts/028` (PR #17) |
| Decisiones de negocio: intentos, fallback, quién retira, antecedentes, vínculo `propuesto` | D-1 a D-17 |
| Validación RENAPER **manual** de referentes (la que se reemplaza) | `ValidarRenaperForm`, `prompts/019` |

---

## Jordy — producto, decisiones y consola de Didit

**Consola de Didit** ✅ 09/10 (D-23)
- [x] **Publicar el workflow:** activa la v9, con consulta a RENAPER (`max_attempts: 1`), prueba de vida pasiva (D-22), `max_retry_attempts: 0` (D-21) y sesión válida por 1 hora (D-27).
- [x] **Retención de datos:** 1 mes, con la plantilla biométrica borrada junto con la sesión.
- [x] **Datos devueltos:** según D-28 (corrige D-13), Didit manda todos los datos de la verificación de ID y el webhook filtra con una lista cerrada; restringirlos dejaba `fallback_from` en `null`. Probado con 4 sesiones de sandbox, borradas después.

**Definiciones que bloquean a Meli y Cami** ✅ 09/10
- [x] **Dispositivo:** celular del adulto por QR; tablet de la residencia como respaldo (D-24).
- [x] **Prueba de vida:** sí, pasiva (D-22).
- [x] **Texto de consentimiento:** provisorio para el prototipo en `docs/consentimiento-verificacion-identidad.md`; la revisión legal pasa a ser requisito de producción (D-25). Si el adulto no acepta, verificación manual por un `Admin` (D-26).
- [x] **Mensajes de la pantalla de retiro:** los 5 literales de la Práctica 3 §6 (A a E) y 5 nuevos, en D-33 (21/10). Cierra la pregunta abierta A.1 del Plan 035 (PR #47).

**Revisión**
- [x] Planes de Meli 029 a 031 (PR #28) y Plan 035 (PR #43): mergeados.
- [x] Migración de Sofi (#18, PR #29): aprobada y mergeada el 21/10 (`bb68185`).
- [x] Pantallas de Cami (PR #42): aprobadas y mergeadas el 21/10 (`42d85a8`).

**Implementación (pasó a Jordy el 21/10)**
- [x] **Supabase local:** `supabase/config.toml` versionado y `supabase db reset` funcionando desde una base vacía. ✅ PR #50, 21/10
- [x] **Migración de D-14 y `error_proveedor`** (`prompts/046`): columna `dni_coincide`, estado RNF-12 y trigger de Seguridad 2 sobre `estado_rnf12`, `CHECK` cerrado de `error_proveedor`, pruebas en `tests/sql/didit-seguridad.sql` (`npm run test:sql`, 12/12) y tipos regenerados. ✅ 21/10
- [x] **#23, endpoints** (`prompts/047`): crear sesión con `sandbox_scenario`, consultar estado y fallback, en `app/api/didit/sesiones`. ✅ 21/10. Falta probar el `201` con el workflow real (`DIDIT_WORKFLOW_ID`).
- [x] **#23, webhook** (`prompts/048`): busca la sesión, guarda el resultado (D-1, D-12, D-14), crea la validación RENAPER del referente (D-11), es idempotente y borra la sesión en Didit (RF-10). ✅ 21/10. Falta probarlo con una sesión real del sandbox (`DIDIT_WORKFLOW_ID` y un túnel hacia el webhook local).
- [x] **#26** (`prompts/049`): `/retiros` (registro, en curso, casos en revisión y autorizaciones), validación de referentes con Didit y "Vigente" bloqueado sin validación (D-16). ✅ 21/10 (PR #54 y la parte 2). Falta probar el QR y el polling con una sesión real (`DIDIT_WORKFLOW_ID`).
- [x] **#33:** QA según `prompts/045`. ✅ 22/10: tests automáticos, recorrido en el navegador y 5 escenarios con sesiones reales del sandbox (PR #56 y #57).
- [x] Invitaciones al repo: Meli y Cami ya trabajan en `cielo-abierto`.

---

## Sofi — modelo de datos

> **21/10:** la migración quedó mergeada (PR #29, `bb68185`), con seguridad 1 y 2, D-12, D-19, D-26, tope de intentos de referentes y `In Review` → `Pendiente`, probada en Supabase local. El #23 pasó a Jordy.

- [x] **Migración #18** según el Plan 028, en una rama nueva y probada en Supabase local. ✅ PR #29, 21/10. Resolvió los 4 puntos de la aprobación:
  1. El retiro rechaza una autorización revocada o vencida (RN-01).
  2. `resultado_autorizacion` con valor `pendiente` mientras el retiro está `en_curso`.
  3. El mapeo `id_lookup` → `estado_dni` ya está definido en **D-11**: usarlo.
  4. Detalles del SQL: "Error del proveedor" / "Pendiente" en `estado_rnf12`, `restricciones` como `TEXT`, `CHECK (vigente_hasta >= vigente_desde)` y `RESTRICT` explícito.
- [ ] **Trigger de D-16** (comentario en el #18): un vínculo con referente no pasa a `vigente` sin una validación aprobada. Puede ir en la misma migración o aparte.
- [ ] **D-12** en el modelo: un `Declined` por `provider_error` no cuenta como intento. Ajustar la función que cuenta intentos.
- [ ] **RLS del webhook:** definir si escribe con service role (solo del lado servidor) o con una función `SECURITY DEFINER`, junto con Meli.
- [ ] Regenerar los tipos (`types/database.generated.ts`) después de aplicar la migración.

---

## Meli — requisitos, integración backend y QA

**Para empezar**
- [x] **Aceptar la invitación al repo** `cielo-abierto`. ✅ 08/10
- [x] **Subir lo que ya tiene:** planes 029 a 031, matriz de QA y 14 tests de firma en `tests/unit/` con `node:test`. ✅ PR #28, 08/10 (`npm run test:unit`: 26/26)

**Requisitos (antes de que Cami diseñe)** ✅ PR #43, 13/10 (Plan 035, §2 a §5)
- [x] Actualizar los RF y RNF de la Práctica 3 (documento de re-vinculación). Queda abierto el valor de algunos RNF; el copy se cerró con D-33 (§5.2 y §9 del Plan 035):
  - **Desactualizados:** método (es `id_lookup`, no documento + liveness), RF-10 sin regla de borrado, URL de la selfie que llega al webhook.
  - **RF que faltan:** intentos (D-3, D-12), fallback (D-2), comparar el DNI (D-14), vínculo `propuesto` (D-16), cuándo se valida (D-15, D-17), consultar el estado, dispositivo, consentimiento, quién atiende "Requiere revisión".
  - **RNF a precisar:** valores de timeout y reintentos (RNF-13), tiempo hasta el resultado, vencimiento de la sesión (Didit: 7 días), plazo de retención, usabilidad en celular, antecedentes fuera de alcance (D-15).

**Contrato para Cami** ✅ PR #43 (Plan 035, §7 y §8). El envelope y los códigos de error (§7.5) son una propuesta todavía no implementada.
- [x] **Crear sesión:** ruta, qué recibe (`retiro_id` o `referente_id`), qué devuelve (URL o token de Didit, nuestro `id`), qué responde si Didit falla, qué roles.
- [x] **Consultar estado:** estado RNF-12, intentos usados, motivo, si el fallback está habilitado. Definir polling o alternativa.
- [x] **Fallback manual:** acción del Admin, con motivo obligatorio.
- [x] **Errores:** qué recibe la pantalla para los 4 mensajes de la Práctica 3 (§ 6, A-D) y para "el DNI no coincide".

**Implementación (#23, después de la migración)**: delegada a Sofi el 10/10; pasó a Jordy el 21/10, igual que la QA (#33).
- [ ] **Endpoint para crear la sesión:** DNI desde la base en `expected_details.identification_number` (D-14), `vendor_data` con nuestro `id`, timeout y manejo de errores (RNF-13). Si Didit no crea la sesión, registrar "Error del proveedor" sin `session_id`.
- [ ] **Lógica del webhook** (el `TODO(Meli)` de `route.ts`):
  - buscar la sesión;
  - leer `fallback_from.reason` (en los rechazos, `id_lookup` llega `null`);
  - aplicar D-1, D-11 y D-12;
  - comparar `personal_number` con el DNI esperado (D-14);
  - en referentes, crear la fila de `validaciones_renaper` sin `respuesta_cruda` de Didit;
  - `session_id` desconocido → `200` + log, sin escribir (D-4);
  - nunca loguear la selfie ni el `decision`.
- [ ] **Endpoint para consultar el estado.**
- [ ] **Reemplazar la carga manual** de `useCreateValidacionRenaper` por la sesión de Didit.
- [ ] **Borrar la sesión en Didit** una vez registrado el resultado (RF-10), si se decide así.

**Tests**
- [x] **E-4:** contrato del webhook sin Supabase. 5 tests de la capa pura (PR #28) y el handler `POST` por HTTP en `tests/integration/didit-webhook-http.test.ts` (PR #43).
- [ ] **Escenarios A-D** (#33) de la Práctica 3 y los derivados, con sesiones de sandbox (`approve`, `lookup_no_match`, `lookup_partial_match`, `lookup_provider_error`). Borrarlas al terminar. Pasó a Jordy el 21/10: plan en `prompts/045`.

---

## Cami — UI/UX y frontend

**Para empezar**
- [ ] **Aceptar la invitación al repo** `cielo-abierto`.

**Diseño (cuando Meli tenga el contrato; se puede maquetar con datos de ejemplo)**
- [x] **Registrar retiro:** pantalla demo navegable para seleccionar NNyA ficticio y tutor de ejemplo; restricciones visibles. No consulta autorizaciones reales.
- [x] **Verificación:** consentimiento, QR en celular/tablet de respaldo y estado de espera maquetados en `/retiros-demo`; sin sesión Didit ni polling real.
- [x] **Resultado:** los cinco estados RNF-12 se pueden inspeccionar como mocks identificados; error del proveedor se distingue y no consume intentos. Los mensajes aprobados de D-33 están pendientes de incorporarse a la UI.
- [x] **Fallback manual:** UI de revisión/fallback restringida a Admin en frontend demo; motivo requerido; acciones solo locales, sin auditoría real.
- [x] **Registro y cierre del retiro:** campos de demostración para hora de inicio, descripción y observaciones, más acción local «Editar» con hora de regreso y estado «Realizada».
- [x] **Referentes:** acción «Validar identidad» abre la maqueta Didit. La demostración no simula ni la pantalla real aplica el bloqueo de `propuesto` a `vigente`; implementar la regla D-16 queda pendiente para la integración Didit de los Issues #23 y #26.

**Integración (#26, después de los endpoints del #23)**: pasó a Jordy el 21/10.
- [ ] Conectar las pantallas a los endpoints reales y probarlas con sesiones de sandbox, con los mensajes de D-33 y el selector de escenario de sandbox (`prompts/045`, Supuesto 5).

**Actualización frontend (16/10/2026):** los seis puntos de diseño anteriores están completados como demos navegables con datos ficticios; no constituyen un retiro/validación real. Siguen pendientes los endpoints de Sofi/Meli y la incorporación en la UI de los mensajes aprobados en D-33 y §7.4.

---

## Cómo saber que la innovación 1 está terminada

- [x] Un retiro completo funciona de punta a punta en sandbox: aprobado, rechazado, error del proveedor y fallback del Admin.
- [x] Una validación de referente con Didit habilita el vínculo `vigente`; sin validación, la base lo rechaza.
- [x] No se guardan selfies, fotos de RENAPER, nombre ni domicilio de Didit, ni en la base ni en los logs.
- [x] Todo queda en el audit log.
- [x] Hay tests verdes del webhook y de los escenarios A-D.
- [ ] Los RF y RNF de la Práctica 3 coinciden con lo implementado. Pendiente de revisar contra el PDF; la consulta real a RENAPER queda fuera por la decisión del 22/10 (sandbox gratuito).

---

## Avance

| Fecha | Quién | Qué |
|---|---|---|
| 08/10 | Meli | PR #28: planes 029 a 031, matriz de QA de Didit, 14 tests de firma y 5 de E-4 (capa pura) en `node:test`. Cierra el #21. Aceptó la invitación al repo |
| 08/10 | Sofi | PR #29: migración #18 (`retiros`, `sesiones_didit`, `autorizaciones_retiro`), con D-12 y el trigger de D-16, probada en Supabase local |
| 09/10 | Jordy | D-19 a D-28 resueltas. Consola de Didit cerrada (workflow v9, prueba de vida pasiva, sesión de 1 hora, retención de 1 mes) |
| 10/10 | Jordy | Revisión del PR #29: cambios pedidos (2 de seguridad, 4 de reglas y menores). El #23 pasa a Sofi |
| 13/10 | Meli | PR #43: requisitos, contrato para Cami (Plan 035) y tests HTTP del webhook (E-4). Cierra el #30 |
| 14/10 | Jordy | Consentimiento provisorio para el prototipo (D-25). Revisión del PR #42: mover las demos de timeline y alertas a rutas propias |
| 16/10 | Cami | PR #42: las 6 pantallas de diseño completas como demo (`/retiros-demo`), y las demos de timeline y alertas en rutas propias |
| 18/10 | Jordy | Segunda revisión del PR #42: faltan 2 cambios en pantallas reales (restaurar la validación manual en `/referentes` y no bloquear "Vigente" en el formulario de vínculos) |
| 21/10 | Jordy | D-33 (PR #47). Mergeados el PR #42 de Cami y el PR #29 de Sofi. Plan de la QA (PR #48 y #49). El #23, el #26 y el #33 pasan a Jordy |
| 21/10 | Cami | PR #42: correcciones de la revisión, rama al día con `master` y texto de vínculos propuestos ajustado |
| 21/10 | Sofi | PR #29: seguridad 1 y 2 con pruebas, D-12, D-19, D-26, tope de referentes y migración renombrada a `20261021180000` |
| 21/10 | Jordy | Supabase local (PR #50), D-14 en la base (PR #51), endpoints (PR #52), webhook (PR #53), pantallas de retiros y referentes (PR #54 y #55). Primera sesión real del sandbox (PR #56) |
| 22/10 | Jordy | Cuatro escenarios con sesiones reales (PR #57), último resultado al abrir un retiro (PR #58). Migraciones aplicadas en producción, `DIDIT_WORKFLOW_ID` en Vercel y QA cerrada (#33) |
