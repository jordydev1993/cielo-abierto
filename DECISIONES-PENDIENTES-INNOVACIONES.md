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
| D-15 | Innovación 1: ¿valida antecedentes? | Todos (alcance), exposición | No: Didit valida identidad; los antecedentes siguen por vía judicial |
| D-16 | Innovación 1: qué pasa si se rechaza la validación de un referente | Sofi (trigger), Meli, Cami | El vínculo queda en `propuesto` hasta una validación `aprobado` |
| D-17 | Referentes que retiran al NNyA en los encuentros progresivos | Proceso, Sofi | Se dan de alta como tutor autorizado tras la aprobación judicial (no cambia D-10) |
| D-18 | Innovación 3: ¿seguimiento post-egreso siempre u opcional por orden judicial? | Sofi (#19), Cami (#25) | Siempre, pero diferenciado: tipo de egreso, orden judicial y remisión al Juzgado |
| D-19 | Qué significa "Requiere revisión" (RNF-12) | Meli (#23), Sofi, Cami (#26) | Estado del trámite al agotar los 3 intentos: espera la decisión de un `Admin` |
| D-20 | ¿3 sesiones vencidas o abandonadas habilitan el fallback? | Meli (#23), Sofi | Sí: 3 intentos agotados habilitan el fallback, sea cual sea el motivo |
| D-21 | `max_retry_attempts` del workflow de Didit | Jordy (consola) | Al mínimo que acepte Didit, junto con el workflow v3 |
| D-22 | ¿Prueba de vida en la verificación? | Jordy (consola), Meli (#23) | Sí, pasiva |
| D-23 | Configuración de la consola de Didit | Jordy | Workflow v3, datos devueltos mínimos y retención de 30 días |
| D-24 | Dispositivo de verificación | Cami (#26), Meli | Celular del adulto por QR; tablet de la residencia como respaldo |
| D-25 | Texto de consentimiento (Ley 25.326) | Meli, Cami | Borrador ahora, revisión legal antes de usar datos reales |
| D-26 | ¿Qué pasa si el adulto no acepta el consentimiento? | Sofi (#18), Meli (#23), Cami (#26) | Verificación manual por un `Admin`, auditada y con motivo |
| D-27 | Validez de la sesión de Didit | Jordy (consola), Cami | 1 hora (antes 7 días) |
| D-28 | Datos devueltos de la verificación de ID (corrige D-13) | Meli (#23) | Didit manda todo; el webhook filtra con lista cerrada |

D-1 a D-5 y D-10 destraban el modelo de Sofi (`prompts/028`). D-11 a D-14 son para la lógica del webhook (Meli, #23). D-15 a D-17 alinean la innovación 1 con el proceso 1.5, y D-18 la innovación 3.

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

## D-15 a D-17 — Innovación 1 contra los procesos 1.1 y 1.5 (resueltas el 2026-10-07)

**Contexto:** la definición original de la innovación (`docs/evolucion/00-RESUMEN-EJECUTIVO-FINAL.md`) dice: *"Cuándo: Ingreso (1.1) + Egreso (1.5). Qué valida: antecedentes + vigencia de DNI. Si rechaza: bloquea el proceso."* Ninguno de los dos procesos menciona validar identidad: es una actividad que agrega la innovación. Encaja en el **proceso 1.5**: entrevistas con los referentes familiares (plan de transición), entrega del NNyA en el egreso y encuentros progresivos (visitas, fines de semana). En el 1.1 el anclaje es débil: el ingreso es del NNyA y no incluye el registro de tutores.

### D-15 — Antecedentes fuera del alcance

RENAPER no informa antecedentes penales (son del Registro Nacional de Reincidencia), y la prueba en sandbox lo confirmó: `tiene_antecedentes` queda `NULL` (D-11). **La innovación valida identidad (y vigencia del DNI cuando RENAPER real la informe), no antecedentes.** Los antecedentes se siguen obteniendo por la vía judicial, dentro de la evaluación que hace el Juzgado. Se dice así en la exposición y en la documentación.

### D-16 — Rechazo en el alta de un referente

Resuelve el punto abierto 2 de `docs/evolucion/03-PROMPTS-A0-A1-A2-DEFINITIVO-v2.md`. Un vínculo de tutela con un referente (`revinculacion_familiar` o `referente_afectivo`) **queda en estado `propuesto` y no puede pasar a `vigente`** hasta que el referente tenga una validación con `resultado = 'aprobado'`. Se implementa con un trigger sobre `vinculos_tutela`: el estado ya existe, no hace falta schema nuevo.

- `no_concluyente` (RENAPER caído) no aprueba: se reintenta, o se aplica el fallback manual de un `Admin` (D-2), que queda auditado.
- `rechazado` no aprueba.

### D-17 — Referentes que retiran al NNyA

El proceso 1.5 prevé encuentros progresivos (la familia se lleva al NNyA los fines de semana), y eso es un retiro. D-10 (solo tutores autorizados, RN-01) **no cambia**: un referente familiar que va a retirar al NNyA **se da de alta como tutor autorizado** cuando el Juzgado aprueba la revinculación, y desde ahí pasa por el flujo de retiro con validación Didit. Es un paso del proceso, no un cambio de modelo.

---

## D-18 — Seguimiento post-egreso contra el proceso 1.5 (resuelta el 2026-10-07)

**Contexto:** el proceso 1.5 dice *"Seguimiento post-egreso (opcional): en casos determinados por el Juzgado, el Equipo Técnico realiza un seguimiento de 30 a 60 días. Se documentan observaciones y se remiten a la autoridad judicial"*, y distingue tres tipos de egreso: reintegración familiar, traslado a otro dispositivo y cumplimiento del plazo institucional. Hoy el trigger `fn_crear_seguimiento_post_egreso` crea los hitos en **todo** egreso, no hay tipo de egreso y no se registra la remisión al Juzgado. Además, un seguimiento que nunca correspondía aparece como "pendiente vencido" y distorsiona los indicadores.

**Decisión: seguimiento siempre, pero diferenciado.** Se mantiene la creación automática (es el valor de la innovación: métricas de reinserción de todos los casos) y se agrega:

1. **Tipo de egreso** en `nnya`: `reintegracion_familiar`, `traslado` o `cumplimiento_plazo`, obligatorio al registrar el egreso (mismo patrón que `chk_nnya_fecha_egreso_coherente`).
2. **Sin seguimiento en los traslados:** el trigger no crea hitos cuando el tipo es `traslado`, porque el seguimiento lo hace el otro dispositivo.
3. **Orden judicial:** un campo que indica si el Juzgado ordenó el seguimiento. Los indicadores pueden separar los ordenados de los institucionales.
4. **Remisión al Juzgado:** fecha y usuario de cuándo se remitieron las observaciones, solo para los seguimientos ordenados por el Juzgado. Lo completa la base al registrar la remisión, no el formulario.

Se suma al hito de 90 días (D-8) en la misma migración de Sofi (#19). En la exposición, los 90 días y el seguimiento de los casos sin orden judicial se presentan como **extensión** del proceso, no como algo que el proceso exija.

**A resolver en el plan de Sofi:**
- Dónde vive el campo de orden judicial: en `nnya` (una vez por egreso) o en cada fila de `seguimiento_post_egreso`.
- Qué hacer con los egresos que ya existen, que no tienen tipo: el `CHECK` no puede romper esas filas. Opciones: permitir `NULL` solo para egresos anteriores a la migración, o que un `Admin` los complete antes de aplicarla.

---

## D-19 a D-21 — Revisión de Meli del relevamiento de la innovación 1 (resueltas el 2026-10-09)

**Contexto:** Meli revisó el relevamiento de la innovación 1 (documento compartido del 08/10) y pidió 6 ajustes. Jordy los aceptó todos. Tres solo precisan decisiones anteriores:

- **RF20 a RF22:** `retiros` no guarda el resultado de identidad ni la cantidad de intentos, porque salen de `sesiones_didit` (Plan 028). El retiro pasa de `en_curso` a `realizada` o `rechazada`, con `motivo_rechazo` cuando corresponde. `resultado_autorizacion` usa los valores del Plan 028: `pendiente`, `autorizada` y `rechazada`.
- **Comparar el DNI (D-14):** el DNI esperado sale de `tutores.dni` en el retiro y de `referentes.dni` en el alta de un referente.
- **RNF-13 (D-1, D-12):** un error del proveedor o un timeout al crear la sesión no gasta intento. Meli corrige los casos D-01 e I-01 de `docs/testingManual/QA-DIDIT-RETIRO.md`.

Los otros tres cambian o completan D-1:

### D-19 — "Requiere revisión"

Meli comprobó que Didit no emite `In Review` con `id_lookup`, así que con D-1 ese estado no aparecería nunca. Desde ahora, **"Requiere revisión" es el estado del trámite al agotar los 3 intentos** y significa que espera la decisión de un `Admin`.

- No es un resultado de Didit: la última sesión sigue siendo "Identidad no verificada" y el mapeo de D-11 no cambia.
- El fallback manual (D-2) se habilita desde "Requiere revisión" o desde "Error del proveedor".
- "Error del proveedor" no pasa solo a "Requiere revisión": no gasta intento y se puede reintentar.

### D-20 — Sesiones vencidas y fallback

D-1 decía que el fallback "nunca" se habilita por una sesión vencida o abandonada, pero esas sesiones cuentan como intento. **3 intentos agotados habilitan el fallback aunque sean sesiones vencidas o abandonadas.** Una sola sesión vencida no lo habilita. El riesgo de abuso es bajo: el fallback lo hace solo un `Admin`, con motivo obligatorio y auditado.

### D-21 — Reintentos del workflow de Didit

`max_retry_attempts: 3` (reintento de la sesión completa dentro de los 7 días) agrega intentos que nuestro backend no ve. Baja **al mínimo que acepte Didit (0 si se puede)**, junto con la publicación del workflow v3 (`max_attempts: 1`, D-12). Cada intento es una sesión nueva que cuenta nuestro backend.

### Respuestas de Meli aprobadas (2026-10-09)

Jordy aprobó las respuestas de Meli a las preguntas abiertas del relevamiento. Quedan como requisitos de la innovación 1:

- **Quién inicia la revinculación:** el `Equipo Tecnico` crea la sesión de Didit, solo un `Admin` pasa el vínculo a `vigente` y el educador solo ve el estado. En el sistema el educador también tiene el rol `Equipo Tecnico`, así que esto último es una regla del proceso, no un permiso.
- **Consulta del estado:** manda el webhook. La pantalla consulta cada 3 a 5 segundos como respaldo, con un tope de 60 a 90 segundos; después muestra "Seguimos esperando" y un botón "Actualizar". La consulta nunca contradice un webhook ya recibido.
- **Timeout al crear la sesión:** 15 segundos. Un solo reintento automático, solo ante fallas de red o errores 5xx de Didit; si vuelve a fallar, "Error del proveedor" (D-12). Sin reintentos ante 4xx.
- **"Requiere revisión":** lo atiende solo un `Admin`, desde una lista de sesiones en revisión con el tutor o referente, el DNI, la fecha y el motivo. Desde ahí aprueba, rechaza o aplica el fallback (D-19).
- **Borrado en Didit:** la sesión se borra apenas se guarda el resultado (RF-10, RNF-06/07). Los 30 días de retención (D-13) quedan como respaldo si el borrado falla.
- **RNF del retiro:** RNF-01 a RNF-13 se aplican también al retiro, porque los dos flujos comparten `sesiones_didit` (D-5).
- **Escenarios de error:** además de A a E y "el DNI no coincide": firma inválida (`401`); sesión desconocida o webhook duplicado (`200` sin escribir, D-4); timeout o error del proveedor al crear la sesión (D-12); DNI con formato inválido (`400`); sesión que vence sin resultado; falla al guardar en la base; DNI verificado distinto del esperado (D-14); revisión o coincidencia ambigua; varios intentos para la misma persona (D-3).

---

## D-22 a D-25 — Definiciones de Jordy para la innovación 1 (resueltas el 2026-10-09)

Destraban RF05, RF08 y RF09 de la Práctica 3 y el diseño de Cami (#26).

### D-22 — Prueba de vida

Se agrega al workflow, **en su versión pasiva** (sin gestos). Cumple RF09 y RN-02 de la Práctica 3 y cierra el riesgo principal: hoy la selfie se compara con la foto de RENAPER, pero nada controla que sea una persona real frente a la cámara. El cambio que Didit hace solo en el borrador v3 (`skip_liveness_and_face_match` a `false`) pasa a ser el buscado. Hay que probar en sandbox cómo llega un rechazo por prueba de vida: si trae un motivo nuevo en `fallback_from.reason`, se suma al mapeo de D-11.

### D-23 — Consola de Didit

En una sola sesión: publicar el workflow v3 (`max_attempts: 1`, D-12, con la prueba de vida de D-22), bajar `max_retry_attempts` al mínimo (D-21), restringir los datos devueltos a `status`, `fallback_from` y `personal_number`, y bajar la retención a 30 días (D-13). Después, una sesión de prueba para confirmar que esos campos siguen llegando al webhook.

### D-24 — Dispositivo

El adulto verifica **con su propio celular, escaneando un QR**. Si no tiene celular o datos, usa **una tablet de la residencia**. La PC con webcam queda descartada: peor calidad de selfie, y Didit igual suele ofrecer pasar al celular. Para Cami: la pantalla muestra el QR y "esperando resultado"; en la tablet es el mismo flujo en otra pestaña.

### D-25 — Consentimiento

Se escribe un borrador ahora y lo revisa alguien con formación legal antes de usarlo con datos reales (requisito previo 2 de la Práctica 3: los datos biométricos y los de RENAPER son sensibles). El texto dice quién trata los datos (la residencia), para qué (verificar la identidad en el retiro o la revinculación), qué datos se usan (DNI, selfie y consulta a RENAPER a través de Didit, un proveedor del exterior), qué se guarda (solo el resultado; la sesión en Didit se borra apenas se registra) y los derechos de acceso, rectificación y supresión ante la Agencia de Acceso a la Información Pública.

**Estado (09/10): cerrado.** Versión activa: v9 del workflow. Consulta a RENAPER (`max_attempts: 1`), prueba de vida pasiva (1 intento), `max_retry_attempts: 0`, búsqueda de rostros apagada, validez de la sesión de 1 hora (D-27), retención de 1 mes con la plantilla biométrica borrada junto con la sesión, USD 0,25 por sesión. Datos devueltos: ninguno de la prueba de vida y todos los de la verificación de ID (D-28). Probado con 4 sesiones de sandbox, borradas después.

### D-26 — Si el adulto no acepta el consentimiento

Para que el consentimiento sea libre, negarse no puede impedir el retiro ni la revinculación. Si el adulto no acepta, **la identidad se verifica a mano**:

- Lo hace solo un `Admin`: compara el DNI físico con el registrado (`tutores.dni` o `referentes.dni`) y la foto del documento con la persona.
- Queda auditado, con motivo obligatorio ("no aceptó el consentimiento") y método `manual`, para distinguirlo de una verificación con Didit.
- No gasta intento, porque no hubo verificación.
- Reusa el camino del fallback (D-2): no suma pantallas ni roles, solo un motivo nuevo.

El riesgo es que se use para esquivar la biometría; lo acotan el rol `Admin` y la auditoría. Se suma al texto del consentimiento (D-25), a la migración de Sofi (motivo y método) y al contrato para Cami.

### D-27 — Validez de la sesión

Baja de 7 días a **1 hora**. La verificación se hace en el momento, con el adulto en la residencia; un link válido una semana es una ventana innecesaria.

### D-28 — Datos devueltos de la verificación de ID (corrige D-13)

**Hecho (pruebas en sandbox del 09/10):** con los datos de la verificación de ID restringidos, `fallback_from` llega `null` en los rechazos, aunque se tilden "Coincidencias" o "Campos adicionales"; ninguna casilla lo controla. Sin restricción vuelve completo (`{"reason":"no_match","method":"id_lookup","action":"decline"}`). Sin ese motivo no se puede cumplir D-12.

**Decisión:** Didit manda **todos los datos de la verificación de ID** y la minimización se hace en nuestro webhook. La prueba de vida sigue sin devolver nada. Llegan también nombre, fecha de nacimiento, foto de RENAPER y, dentro de `id_lookup`, un link a la selfie (firmado, 4 horas). Condiciones para Meli (#23):

1. El webhook valida con una lista cerrada (`zod`) y solo lee `status`, `fallback_from.reason` y `personal_number`.
2. Nunca guarda el cuerpo crudo ni el objeto `decision`, y no loguea más que `session_id` y `status`.
3. Se borra la sesión en Didit apenas se guarda el resultado (RF-10).
4. Un test controla que ni la selfie ni el nombre lleguen a la base ni a los logs.

Si Didit ofrece una forma de devolver solo `fallback_from`, se vuelve a restringir.

---

## Después de decidir

- D-1 a D-5 → pasárselas a **Sofi** junto con su lista de `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`. Con eso puede cerrar el modelo.
- D-4 y D-6 → a **Meli**.
- D-8 y D-9 → a **Sofi** (schema) y **Cami** (UI).
- Registrar cada decisión tomada en el documento de origen que corresponda, como se hizo con las decisiones del 2026-09-15.
