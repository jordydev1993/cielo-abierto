# Decisiones de Jordy — Didit (retiro + Innovación 1) e innovaciones 3 y 7

**Fecha:** 2026-10-05
**Por qué existe:** el trabajo de Meli (`028`/`029`, QA de Didit) y el plan de Cami (`018-frontend-innovaciones-cami`) dejaron identificadas varias decisiones que **solo puede tomar Jordy** y que hoy bloquean a Meli, Sofi y Cami. Este documento las junta en un solo lugar, con opciones y una recomendación por cada una.

> **✅ Resueltas el 2026-10-06:** Jordy aceptó las 9 recomendaciones tal como están escritas abajo (cada sección indica cuál es la opción *Recomendada*) y se agregó D-10. Los hechos citados están verificados contra el código de `master` (`84c4d23`).

---

## Resumen

| # | Decisión | Destraba a | Decisión (2026-10-06) |
|---|---|---|---|
| D-1 | Mapeo de los 10 `status` de Didit a los 5 estados de RNF-12 | Sofi (enum), Meli (webhook), Cami (badges) | Tabla de § D-1; vencidas/abandonadas = "no verificada" |
| D-2 | Quién puede autorizar el fallback manual | Sofi (`autorizado_por`), Meli (RLS/validación) | Solo `Admin` |
| D-3 | Qué cuenta como "intento" (tope de 3) | Sofi (`cantidad_intentos`), Meli | 1 intento = 1 sesión Didit terminada |
| D-4 | Qué responde el webhook ante un `session_id` desconocido | Meli (`route.ts` TODO) | `200` + log del `session_id`, sin escribir nada |
| D-5 | Sesión Didit: tabla compartida retiro + referentes, o dos tablas | Sofi, y con eso toda la Innovación 1 | Una tabla compartida con campo `proposito` |
| D-6 | Tests E2E `02`/`03`: autenticados o anónimos | Meli (6 asserts) | Separar: anónimos ya, autenticados después |
| D-7 | Entorno de testing para Meli | Meli (E-3, E-4) | Supabase local con las migraciones |
| D-8 | Hito de 90 días en seguimiento post-egreso | Sofi (`CHECK` + trigger), Cami | Aprobar |
| D-9 | Qué significa "Verificado" en propuestas de mejora | Sofi (`CHECK` + columnas), Cami | Lo marca un `Admin`, solo desde "Completado", con registro de quién/cuándo |
| D-10 | ¿Un referente puede retirar al NNyA, o solo tutores? | Sofi (`retiros.tutor_id`), Meli, Cami | Solo tutores autorizados: `tutor_id` obligatorio |
| D-11 | Mapeo de `id_lookup` a `validaciones_renaper` (`resultado`, `estado_dni`) | Meli (#23) | Tabla de § D-11, confirmada en sandbox el 07/10 |
| D-12 | Corrección de D-3 y del workflow de Didit | Meli (#23), Sofi | La falla de RENAPER no cuenta como intento; `max_attempts` de Didit a 1 |
| D-13 | Minimización en Didit: datos devueltos y retención | Jordy (consola de Didit) | Restringir datos devueltos; retención acotada |
| D-14 | Cómo se garantiza que el DNI verificado es el del tutor | Meli (#23) | El webhook compara `personal_number` con el DNI esperado |

D-1 a D-5 y D-10 destraban el modelo de Sofi (`prompts/028`). D-11 a D-14 son para la lógica del webhook (Meli, #23).

---

## D-1 — Mapeo de `status` de Didit → estados de RNF-12

**Hecho:** Didit manda 10 valores de `status` (case-sensitive, `INFORME-WEBHOOK-DIDIT-PARA-MELI.md`): `Not Started`, `In Progress`, `Awaiting User`, `Resubmitted`, `In Review`, `Approved`, `Declined`, `Abandoned`, `Expired`, `Kyc Expired`. RNF-12 pide 5 estados: `Pendiente de verificación`, `Identidad verificada`, `Identidad no verificada`, `Requiere revisión`, `Error del proveedor`. Ningún documento del repo define la correspondencia.

**Propuesta de mapeo:**

| `status` Didit | Estado RNF-12 | ¿Cuenta como intento? (D-3) |
|---|---|---|
| `Not Started`, `In Progress`, `Awaiting User`, `Resubmitted` | Pendiente de verificación | No (no terminó) |
| `Approved` | Identidad verificada | Sí |
| `Declined` | Identidad no verificada | Sí |
| `In Review` | Requiere revisión | No (todavía no hay resultado) |
| `Abandoned`, `Expired`, `Kyc Expired` | **Ver opciones** | **Ver opciones** |

**Dato que importa:** `Error del proveedor` **no sale de ningún `status` del webhook**. Sale de nuestro lado, cuando la llamada a Didit para crear la sesión da timeout o error (RNF-13). Si Didit está caído, no hay sesión ni webhook.

**Opciones para vencidas/abandonadas:**

- **A — "Identidad no verificada" y cuenta como intento.** No agrega estados. Abandonar no puede usarse para reintentar sin límite. *Recomendada.*
- **B — Sexto estado "Sesión vencida", sin contar como intento.** Más preciso, pero cambia RNF-12 (que viene de la Práctica 3) y permite reintentos indefinidos abandonando la sesión.
- **C — "Error del proveedor".** No recomendada: habilitaría el fallback manual (D-2) ante una sesión que la persona simplemente no terminó. Meli ya lo marcó como posible bypass.

**Regla asociada, a confirmar:** el fallback manual se habilita solo con `Error del proveedor` (Didit no disponible) o al agotar los 3 intentos. Nunca por una sesión vencida o abandonada.

---

## D-2 — Quién autoriza el fallback manual

**Hecho:** la decisión del 2026-09-15 se contradice en el mismo renglón (`TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`): dice "solo lo autoriza un Admin/coordinador" y en la tarea de Sofi, "debe ser un `Admin`/`Equipo Tecnico`". El rol coordinador **no existe** (se removió en `20260522000027_remove_educador_role.sql`). Con dos roles, "Admin o Equipo Tecnico" significa "cualquier usuario", y entonces la restricción no restringe nada.

**Opciones:**

- **A — Solo `Admin`.** Respeta la intención original ("no cualquier educador puede aprobarla"). Se garantiza en RLS/trigger con `get_my_role() = 'Admin'`. *Recomendada.*
- **B — `Admin` o `Equipo Tecnico`.** Equivale a cualquier usuario autenticado. Solo tiene sentido si se acepta que el fallback no es un control de acceso y queda únicamente registrado.

---

## D-3 — Qué cuenta como "intento"

**Hecho:** hay dos topes de 3 que pueden multiplicarse. El workflow de Didit ya tiene "3 intentos máx." **dentro** de una sesión (nodo `id_lookup`, `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md` § 8), y la decisión de negocio (RF18) dice "al tercer fallo, revisión manual". Sin definir la unidad, una persona podría tener hasta 3 × 3 = 9 oportunidades.

**Opciones:**

- **A — 1 intento = 1 sesión Didit terminada** (`Approved`, `Declined`, o vencida/abandonada según D-1) **para el mismo retiro.** Los reintentos internos de Didit son detalle del proveedor. *Recomendada*, eventualmente bajando el tope interno de Didit a 1 si se quiere que "3" signifique exactamente 3.
- **B — Contar los reintentos internos de Didit.** Requiere leerlos del objeto `decision`, que hoy deliberadamente no se procesa (RNF-04).

---

## D-4 — Webhook con un `session_id` que no existe en la base

**Hecho:** Didit reintenta las entregas que no reciben `2xx`. Un `404` provocaría reintentos sin fin para eventos que nunca vamos a poder procesar: sesiones de prueba del sandbox, sesiones creadas a mano en el panel o, si D-5 elige dos tablas, sesiones de la otra tabla.

**Opciones:**

- **A — `200` + `console.warn` con el `session_id` solamente, sin escribir nada.** La firma ya garantiza que el evento viene de Didit. *Recomendada.*
- **B — `404`.** Correcto en teoría, pero genera reintentos y ruido en el panel de Didit.
- **C — `200` + guardar el evento en una tabla de "huérfanos".** Más trazable, pero es una tabla más para Sofi sin un uso claro hoy.

**Sugerencia técnica para Sofi:** al crear la sesión, mandar nuestro id interno en `vendor_data` (el schema ya lo acepta: `lib/validations/didit-webhook.schema.ts:10`). Así la correlación no depende solo del `session_id`.

---

## D-5 — Sesión de verificación: una tabla o dos (Innovación 1)

**Hecho:** la Innovación 1 consiste en conectar `validaciones_renaper` (hoy de carga manual, `hooks/referentes/useCreateValidacionRenaper.ts`) con Didit. El webhook es uno solo y recibe solo el `session_id`.

**Opciones:**

- **A — Una tabla `sesiones_didit` con un campo `proposito`** (`'retiro'`, `'validacion_referente'`) y una FK opcional hacia el registro de cada flujo. El webhook busca en un único lugar y el mapeo de estados (D-1) se define una sola vez. *Recomendada.*
- **B — Dos tablas.** El webhook tiene que buscar en ambas, y D-4 se vuelve más delicado.

Atada a esto, del § 1 de `PLAN-INTEGRACION-INNOVACIONES.md`: **¿el alta de referentes reusa el workflow `id_lookup` ya publicado o necesita uno propio?** Recomendación: reusar el mismo workflow y webhook. El método (DNI + selfie contra RENAPER) es el mismo, y el propósito ya queda en la tabla.

---

## D-6 — Tests `tests/02` y `tests/03`: ¿autenticados o anónimos?

**Hecho (análisis de Meli, verificado contra `proxy.ts:37-40`):** sin sesión, `/dashboard` redirige a `/login`. Los 6 asserts que fallan esperan el sidebar, que solo existe con sesión. Además, `tests/04:32` pasa por el motivo equivocado.

**Opciones:**

- **A — Separar en dos.** Tests **anónimos** ahora, que verifiquen el redirect y la página de login (se reescriben con nombres que digan lo que prueban). Tests **autenticados** después, con un usuario de prueba en el entorno de D-7. *Recomendada.*
- **B — Solo autenticados.** Quedan bloqueados hasta tener D-7 y el usuario de prueba.
- **C — Solo anónimos.** Se pierde la verificación de navegación por rol, que es lo que `02-nav-roles` dice probar.

---

## D-7 — Entorno de testing para Meli

**Hecho:** sin `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `proxy.ts:7` lanza y toda página da 500. Meli no tiene `.env` y decidió no usar producción. (El webhook deja de depender de esto si se aprueba `prompts/032`.)

**Opciones:**

- **A — Supabase local** (`supabase start` + las migraciones de `supabase/migrations/`). Sin costo, sin datos reales, y le permite crear el usuario de prueba de D-6 libremente. *Recomendada.* Requiere Docker en su máquina.
- **B — Rama de Supabase.** Aislada y en la nube, pero tiene costo por hora.
- **C — Pasarle la URL y la anon key del proyecto actual.** La anon key es pública por diseño y RLS protege los datos, pero estaría testeando contra la base con datos reales. No recomendada.

---

## D-8 — Hito de 90 días en seguimiento post-egreso (Innovación 3)

**Hecho:** `CHECK (dias_post_egreso IN (30, 60))` en `20260827000033_…sql:236`. El trigger `fn_crear_seguimiento_post_egreso` y su backfill crean exactamente esos dos hitos (`prompts/026`). El tipo de dominio también es `30 | 60`.

**Recomendación:** aprobar. Es bajo riesgo: se amplía el `CHECK`, el trigger inserta una tercera fila y se hace backfill del hito 90 para los NNyA ya egresados. Falta decidir si el backfill incluye egresos de hace más de 90 días (recomendado: sí, quedan como "vencidos sin contacto", igual que pasa hoy con 30/60).

---

## D-9 — Estado "Verificado" en propuestas de mejora (Innovación 7)

**Hecho:** `CHECK (estado IN ('abierto','en_progreso','completado','cancelado'))` en `20260827000033_…sql:184`. El kanban usa esos 4 estados.

**Preguntas:** ¿en qué se diferencia de "Completado"? ¿Quién verifica? ¿Queda registrado?

**Recomendación:** "Completado" lo marca el responsable de la propuesta, que dice "lo hice". "Verificado" lo marca un `Admin` (Dirección), que confirma "comprobé que se implementó". Solo se puede pasar a "Verificado" desde "Completado". Se registran `verificado_por` y `verificado_at`, con el valor puesto por la base (no por el cliente), igual que la firma de aprobación de `reportes_senaf`.

---

## D-10 — ¿Quién puede retirar al NNyA? (resuelta el 2026-10-06)

**Fuente:** `practicas 3 - 02_09.pdf`, documento 1 (Retiro de NNyA).

- **RN-01:** "Solo podrá realizar un retiro la persona que se encuentre previamente registrada en Cielo Abierto como tutor autorizado para el NNyA correspondiente. La autorización del tutor es previa al proceso de retiro y surge de la aprobación correspondiente."
- **§ 4, Actores:** el tutor obtiene la autorización tras "el proceso de evaluación e investigación establecido por la autoridad judicial"; recién entonces la residencia "lo registra en Cielo Abierto y lo asocia con el/los NNyA".
- **RF02 y CU "Registrar retiro":** el sistema muestra "las personas registradas como tutores autorizados".

**Decisión:** solo tutores autorizados. `retiros.tutor_id` es **obligatorio** y no se modela un retiro hecho por un referente.

Los referentes (`vinculos_tutela`, afectivos o de revinculación) pasan por el proceso de **re-vinculación** (documento 2 de la misma práctica, RF-05/RF-06), que usa Didit para verificar identidad pero no es un retiro. Si un referente tiene que poder retirar, primero se lo registra como tutor autorizado tras la aprobación judicial, igual que cualquier otro.

---

## D-11 a D-14 — Resultado real de Didit `id_lookup` (resueltas el 2026-10-07)

**Cómo se obtuvo:** 3 sesiones de prueba en la app "arguelloinfancias (Sandbox)" (modo de prueba, sin costo), con los escenarios `approve`, `lookup_provider_error` y `lookup_no_match`. Didit entregó las 9 notificaciones al webhook de producción y todas respondieron `200` (cierra el paso 6 de `prompts/032`). Las sesiones se borraron después, sin plantilla biométrica conservada.

**Qué devuelve Didit** (`decision.id_verifications[0]`):
- `status`: `Approved` / `Declined`.
- `fallback_from.reason`: `no_match`, `partial_match` o `provider_error` cuando hay rechazo. **Viene en el webhook.**
- `id_lookup`: `outcome`, `comparison` (DNI, nombre y fecha de nacimiento, campo por campo), `source_errors`, `attempts`/`max_attempts`. **En el webhook llega `null` en los rechazos**; completo solo por la API de decisión. Usar `fallback_from.reason`.
- `personal_number`: el DNI consultado (presente en `Approved`).
- No viene `record_status` en sandbox: el estado "vencido" solo se va a ver con RENAPER real.
- ⚠️ Viene la URL de la selfie (firmada, 4 h). No se guarda ni se loguea.

### D-11 — Mapeo hacia `validaciones_renaper`

| Didit | `resultado` | `estado_dni` |
|---|---|---|
| `Approved` | `aprobado` | `vigente` |
| `Declined` · `no_match` | `rechazado` | `inexistente` |
| `Declined` · `partial_match` | `rechazado` | `vigente` (el DNI existe; falla la selfie o los datos) |
| `Declined` · `provider_error` | `no_concluyente` | `error_servicio` |
| `Expired`, `Abandoned`, `Kyc Expired` | no se crea la validación | — |

`vencido` queda sin mapear hasta ver la respuesta de RENAPER real: ningún caso se traduce a `vencido` por ahora.

### D-12 — Corrección de D-3 e intentos de Didit

- Un `Declined` con `fallback_from.reason = 'provider_error'` es **"Error del proveedor"**, **no cuenta como intento** y habilita el fallback manual (D-1, D-2). Una caída de RENAPER no le gasta intentos a la persona.
- En sandbox, una sola sesión con `no_match` consumió **3 intentos internos** de Didit. Para que "3 intentos" (RF18) signifique 3, `max_attempts` del método `id_lookup` baja de 3 a **1**.
  - **Estado (07/10):** borrador v3 del workflow con `max_attempts: 1`, **sin publicar**. Al guardar, Didit cambia solo `skip_liveness_and_face_match` de `true` a `false`; hay que confirmar en la consola que eso no agrega prueba de vida ni comparación facial antes de publicar. La v2 sigue activa.
  - Revisar también `max_retry_attempts: 3` a nivel workflow (reintento de la sesión completa en 7 días), que es otra capa de reintentos.

### D-13 — Minimización en Didit (RNF-06, RNF-07)

- **Datos devueltos:** `returned_data` está sin restringir, así que el webhook recibe nombre, fecha de nacimiento, domicilio y la URL de la selfie. Restringirlo en el panel "Returned data" del workflow a lo que usa el webhook (estado, `fallback_from`, `personal_number`), verificando con una sesión de prueba que esos campos sigan llegando.
- **Retención:** la app tiene retención **ilimitada**. Acotarla en Ajustes → General → Retención de datos.

### D-14 — DNI del tutor

`expected_details.identification_number` existe y se envía con `tutores.dni` (o `referentes.dni`), pero Didit **no bloquea** que la persona tipee otro DNI: una diferencia aparece como advertencia, no como rechazo. Por eso el webhook, antes de aceptar un `Approved`, **compara `personal_number` con el DNI esperado** de la sesión, y si no coincide lo trata como rechazo.

---

## Después de decidir

- D-1 a D-5 → pasárselas a **Sofi** junto con su lista de `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`. Con eso puede cerrar el modelo.
- D-4 y D-6 → a **Meli**.
- D-8 y D-9 → a **Sofi** (schema) y **Cami** (UI).
- Registrar cada decisión tomada en el documento de origen que corresponda, como se hizo con las decisiones del 2026-09-15.
