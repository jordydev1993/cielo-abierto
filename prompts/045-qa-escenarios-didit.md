# 045 — QA de la innovación 1: escenarios A a E en sandbox y test de minimización (#33)

> **Estado: PROVISORIO (21/10).** Escrito mientras siguen abiertos la migración (PR #29, Sofi), el #23 (webhook y endpoints, Sofi) y la integración de las pantallas (#26, Cami). Las rutas, los nombres de tabla y los códigos salen del Plan 028 y del contrato propuesto del Plan 035 §7; se confirman contra el código cuando se mergee cada PR (ver §Supuestos). La QA pasó de Meli a Jordy el 21/10.

## Objetivo

Comprobar de punta a punta, con sesiones del sandbox de Didit, que el retiro de un NNyA solo se habilita con identidad verificada **y** autorización vigente, que cada falla muestra el mensaje de D-33 y que ni la selfie ni el nombre del adulto quedan guardados (D-28). Cubre **REQ-EGR-04** (`specs/10-egreso-y-tutela.md`) y, para la validación de referentes, **REQ-EGR-02** y **REQ-EGR-03**.

## Contexto

- Matriz de casos: `docs/testingManual/QA-DIDIT-RETIRO.md` (A-01 a M-02). Ya ejecutados: K-01a, K-02 (unit), K-01b y J-01 (HTTP, `tests/integration/didit-webhook-http.test.ts`).
- Contrato: `prompts/035-requisitos-contrato-didit.md` §7 (crear sesión, consultar estado, fallback) y §7.4 (códigos y mensajes de D-33).
- Modelo de datos: `prompts/028-modelo-datos-didit-retiros.md` (`retiros`, `sesiones_didit`).
- Decisiones: D-1 (mapeo de estados), D-2 (fallback solo `Admin`), D-3 y D-12 (intentos), D-4 (sesión desconocida), D-14 (DNI esperado), D-19 y D-20 (revisión), D-26 (consentimiento), D-28 (minimización), D-33 (mensajes).

## Dependencias (qué tiene que estar mergeado)

| Pieza | PR / issue | Necesaria para |
|---|---|---|
| Migración: `retiros`, `sesiones_didit`, triggers | PR #29 (#18) | Todo lo que escribe en la base |
| Crear sesión, consultar estado, fallback y la lógica del webhook | #23 | Etapas 2 a 4 |
| Pantallas integradas con los endpoints | #26 | Etapa 3 (punta a punta) |

## Archivos inspeccionados

`docs/testingManual/QA-DIDIT-RETIRO.md`, `prompts/035-requisitos-contrato-didit.md` §7, `TAREAS-INNOVACION-1-POR-INTEGRANTE.md` (sección de Meli), `DECISIONES-PENDIENTES-INNOVACIONES.md` (D-33), `specs/10-egreso-y-tutela.md`, issue #33.

## Skills utilizadas

`testing-nnya` (checklist manual), `role-permission` (casos de 403).

## Supuestos (a confirmar al mergear)

1. Las rutas son las propuestas del Plan 035: `POST /api/didit/sesiones`, `GET /api/didit/sesiones/{id}` y `POST /api/didit/sesiones/{id}/fallback`.
2. Los códigos de §7.4 (`IDENTITY_NOT_VERIFIED`, `PROVIDER_ERROR`, `DNI_MISMATCH`, etc.) se implementan tal cual. El envelope de §7.5 todavía es una propuesta.
3. Las sesiones de sandbox se fuerzan con los resultados `approve`, `lookup_no_match`, `lookup_partial_match` y `lookup_provider_error`.
4. `fn_audit_trigger` cubre `retiros` y `sesiones_didit`.
5. **Escenario de sandbox (decisión de Jordy, 21/10).** `POST /api/didit/sesiones` acepta un `sandbox_scenario` opcional, con estas condiciones:
   - Solo se usa si la variable de servidor `DIDIT_SANDBOX_SCENARIOS=true` está activa, y esa variable solo se activa con la app de Didit en sandbox (local y preview).
   - Solo acepta la lista cerrada `approve`, `lookup_no_match`, `lookup_partial_match` y `lookup_provider_error`. Cualquier otro valor da `400`.
   - Sin la variable, el campo se ignora siempre. En producción nunca se usa.
   - La pantalla muestra un selector de escenario solo en ese modo.
   - Se le pidió a Sofi en el #23.

Si alguno no se cumple, se ajusta este plan antes de ejecutar; no se adapta el test para que pase.

## Usuarios y datos de prueba

Todo vive **solo en Supabase local** y se borra con `supabase db reset`. Las personas son inventadas y los DNI empiezan con `99`, para que no se confundan con datos reales. No se usa la cuenta real (`admin@arguelloinfancias.com`) ni la base de producción.

### Usuarios del sistema (quién registra)

Después del reset, la base local tiene los dos roles (`clean_schema.sql`) pero ningún usuario. Hacen falta **dos usuarios nuevos**:

| Usuario | Rol | Email | Para qué |
|---|---|---|---|
| **U1** — "Dirección QA" | `Admin` | `qa.direccion@arguelloinfancias.test` | Carga las autorizaciones de retiro y los referentes, aplica el fallback (G-02), atiende "Casos en revisión" y verifica en forma manual cuando no hay consentimiento (D-26) |
| **U2** — "Educador QA" | `Equipo Tecnico` | `qa.educador@arguelloinfancias.test` | **Registra los retiros** (es quien está de guardia cuando llega el adulto). Recibe 403 al intentar el fallback (G-01) y no ve la acción en la pantalla |

Cómo se crean:

1. **U1:** el primer `Admin` no se puede crear desde la app, porque `POST /api/usuarios` exige un `Admin`. Se crea en el Studio local (Authentication → Add user, con el email confirmado). Después se inserta su fila en `usuarios`, con `rol_id` de `Admin` y `auth_user_id` del usuario de Auth.
2. **U2:** se crea desde la app, con U1, en `/usuarios` → "Nuevo usuario" y rol `Equipo Tecnico`. De paso queda probado el alta por `app/api/usuarios`.
3. Las contraseñas se generan al crearlos y se guardan solo en `.env.local` (`QA_ADMIN_PASSWORD`, `QA_EDUCADOR_PASSWORD`). No van en el plan, en el chat ni en el repo.

### NNyA y legajo

| Dato | Valor |
|---|---|
| NNyA **N1** | Lucía Prueba · DNI `99000001` · nacida el 10/03/2015 · `estado_actual = 'En residencia'` · `activo = true` |
| Legajo | `QA-0001` · `estado = 'activo'` · `motivo_ingreso = 'Dato de prueba QA'` |

### Tutores (retiro)

`autorizaciones_retiro` cuelga de `nnya_tutores` (Plan 028 §6, migración del PR #29). Todas las filas las carga U1 (`created_by`).

| Tutor | DNI | Parentesco | Vínculo con N1 | Autorización de retiro | Caso |
|---|---|---|---|---|---|
| **T1** Ana Prueba | `99000011` | Madre | sí (`es_principal = true`) | `vigente` | A-01, B-01, D-01, consentimiento rechazado |
| **T2** Bruno Prueba | `99000012` | Padre | sí | `revocada` | C-01 / H-01 |
| **T3** Carla Prueba | `99000013` | Tía | sí | `vigente` con `vigente_hasta` = ayer | C-01, variante "vencida" |
| **T4** Diego Prueba | `99000014` | Vecino | **no** | — | H-02 |
| **T5** Elena Prueba | `99000015` | Abuela | sí | `vigente` | F-01, sesión vencida o abandonada (gasta los 3 intentos) |
| **T6** Federico Prueba | `99000016` | Tío | sí | `vigente` con `restricciones = 'Solo fines de semana'` | `DNI_MISMATCH`: en Didit se presenta otro DNI. La restricción también sirve para ver si la pantalla la muestra |

T2 es el que más importa: es justo el caso que un `Approved` mal interpretado dejaría pasar. Si la pantalla filtra la lista y solo muestra autorizados, C-01 se prueba por la Etapa 2 (backend), como pide la QA C-01.

### Referentes (validación de identidad, REQ-EGR-02/03)

| Referente | DNI | Tipo | Vínculo de tutela con N1 | Caso |
|---|---|---|---|---|
| **R1** Gabriela Referente | `99000021` | `familiar` | `revinculacion_familiar`, `estado = 'propuesto'` (D-16) | `approve` → crea la fila de `validaciones_renaper` sin `respuesta_cruda` |
| **R2** Hernán Referente | `99000022` | `otro` | `referente_afectivo`, `propuesto` | Tope de 3 intentos para referentes (pendiente en el PR #29) |

### Sesiones de Didit (sandbox)

| Resultado forzado | Con | Caso |
|---|---|---|
| `approve` | T1, T2, T3, R1 | A-01, C-01, R1 |
| `lookup_no_match` y `lookup_partial_match` | T1 | B-01 |
| `lookup_provider_error` | T1 | D-01 |
| `approve` presentando un DNI distinto del esperado | T6 | `DNI_MISMATCH` |
| 3 × `lookup_no_match`, y después un 4.º pedido | T5, R2 | F-01 |
| Dejarla vencer o abandonarla | T5 | D-1 / D-20 |

**Decidido (Jordy, 21/10):** por ahora solo el **modo de prueba de Didit (sandbox, sin costo)**; nada en modo `live`. Por defecto se usan los DNI de prueba (`99…`). **Si un escenario lo necesita** (por ejemplo, si el sandbox no acepta DNI inventados o para que `DNI_MISMATCH` salga de una persona real), se usan DNI de integrantes del equipo, con estas reglas:

- Solo integrantes adultos que acepten, después de leer el texto de consentimiento (`docs/consentimiento-verificacion-identidad.md`, D-25). Nunca DNI de terceros.
- Los DNI reales no se versionan: el script de datos queda con los `99…` y los reales se cargan a mano en Supabase local el día de la prueba.
- Ninguna evidencia (capturas, logs, resultados en `QA-DIDIT-RETIRO.md`) muestra un DNI real ni una selfie.
- Cada sesión se borra en Didit al terminar y la base local con `supabase db reset`.

**Cómo se elige el escenario:** al crear la sesión, con `sandbox_scenario` (así se crearon las sesiones del 07/10; detalle en `QA-DIDIT-RETIRO.md` §9, Etapa E-5). Desde la pantalla, a través de nuestro endpoint (Supuesto 5).

**A confirmar en la Etapa 0:**
- Qué `personal_number` devuelve `approve`: el DNI enviado en `expected_details` o uno fijo. Si es uno fijo, todos los `approve` darían `DNI_MISMATCH` (D-14).
- Si existe `lookup_partial_match`.
- Que cada `no_match` consuma un solo intento (`max_attempts: 1`, D-12).
- Qué hace el sandbox con un DNI real: si devuelve igual el escenario simulado.

## Etapas

### Etapa 0 — Lo que se puede hacer ya (sin los PR)

- [ ] Esqueleto de `tests/integration/didit-escenarios.test.ts` con `node:test`: un `test.todo` por caso de la tabla de la Etapa 2, con el ID de QA y la decisión en el nombre.
- [ ] Esqueleto de `tests/integration/didit-minimizacion.test.ts` (D-28) con la lista de columnas y logs a revisar.
- [ ] Script de datos de prueba `tests/fixtures/qa-didit-seed.sql`, con los datos de §Usuarios y datos de prueba. Solo para Supabase local: el encabezado del archivo lo aclara y el script corta si encuentra el usuario real `admin@arguelloinfancias.com`.
- [ ] Plantilla de registro de ejecución en `QA-DIDIT-RETIRO.md` §11: fecha, commit, caso, resultado, evidencia.
- [ ] Resolver los puntos de "A confirmar en la Etapa 0" (§Sesiones de Didit) con una o dos sesiones de sandbox creadas con el conector de Didit, y anotar el resultado en `QA-DIDIT-RETIRO.md`.
- [x] Escribir cómo se elige el escenario en el sandbox (`QA-DIDIT-RETIRO.md`, 21/10).

### Etapa 1 — Entorno (cuando estén el PR #29 y el #23)

- [ ] `git pull` de `master` y `supabase db reset`. El repo no tiene `supabase/config.toml`: si no existe en tu copia, correr `npx supabase init` antes (Docker + Supabase CLI, como lo levantó Sofi el 21/10). Si para entonces el `config.toml` ya está versionado, usar ese.
- [ ] Crear U1 y U2 (§Usuarios del sistema) y correr `tests/fixtures/qa-didit-seed.sql`.
- [ ] `.env.local` con `DIDIT_API_KEY` y `DIDIT_WEBHOOK_SECRET` del sandbox. Nunca versionados.
- [ ] Revisar los Supuestos 1 a 4 contra el código mergeado.

### Etapa 2 — Backend (después del #23; no necesita las pantallas)

| Caso QA | Entrada | Esperado | Decisión |
|---|---|---|---|
| A-01 | T1 + `approve` | `Identidad verificada` + `autorizada`; intentos = 1; fila en `audit_log` | D-1 |
| B-01 | T1 + `lookup_no_match` y `lookup_partial_match` | `IDENTITY_NOT_VERIFIED`; suma un intento; no hay retiro habilitado | D-1, D-3 |
| C-01 / H-01 | T2 (revocada) y T3 (vencida) + `approve` | `IDENTITY_VERIFIED_NOT_AUTHORIZED`; el motivo es la autorización | RF-05/06 |
| H-02 | T4 | Rechazo; anotar si gasta un intento | pendiente de diseño (QA H-02) |
| D-01 / I-01 | `lookup_provider_error` y timeout | `PROVIDER_ERROR`; **no** consume intento; fallback disponible | D-12, RNF-13 |
| DNI distinto | T6, presentando otro DNI en Didit | `DNI_MISMATCH` | D-14 |
| F-01 | T5, 4.º intento (y R2 para referentes) | Se rechaza **antes** de llamar a Didit; `REQUIRES_REVIEW` | D-3, D-19 |
| Vencida / abandonada | `Expired` / `Abandoned` | Cuentan como intento | D-1, D-20 |
| G-01 | Fallback con U2 (`Equipo Tecnico`) | 403 | D-2 |
| G-02 | Fallback con U1 (`Admin`) | Pide motivo; `autorizado_por` no nulo; queda en el audit | D-2 |
| G-02 (bis) | Fallback después de un `Declined` | No se puede aplicar | QA G-02 |
| L-01 | Webhook firmado con un `session_id` desconocido | 200 + log, sin escribir; completa E-4 | D-4 |
| M-01 | El mismo evento dos veces / `Approved` y después `In Progress` | No hay efecto duplicado; el estado no retrocede | — |
| Falla al guardar | Error de la base al escribir el resultado | Error controlado, sin estado a medias | RNF-13 |
| Consentimiento | El adulto no acepta | Deriva a la verificación manual por `Admin` | D-26 |

### Etapa 3 — De punta a punta (después del #26)

- [ ] Repetir A-01, B-01, C-01 y D-01 desde la pantalla "Registrar retiro", eligiendo el escenario con el selector de sandbox: QR, espera, resultado. Comparar cada mensaje **letra por letra** con D-33.
- [ ] Mensajes D y E del formulario: campos obligatorios y cierre sin hora de fin.
- [ ] Polling: tope de 60 a 90 s, después "Seguimos esperando" y "Actualizar" (Plan 035 §7.2).
- [ ] Validación de referente: crea la fila de `validaciones_renaper` sin `respuesta_cruda`.

### Etapa 4 — Minimización (D-28, M-02)

- [ ] El test revisa que `sesiones_didit`, `retiros`, `validaciones_renaper` y `audit_log` (`datos_antes` / `datos_despues`) no tengan la URL de la selfie, el nombre ni el objeto `decision`.
- [ ] Revisar la salida de `next dev` durante la Etapa 2: solo `session_id` y `status`.

### Etapa 5 — Cierre

- [ ] Borrar las sesiones del sandbox en Didit.
- [ ] Registrar los resultados en `QA-DIDIT-RETIRO.md` (matriz y §11) y marcar REQ-EGR-04 con la evidencia en la spec.
- [ ] Lo que falle va como comentario concreto en el PR que corresponde, citando la decisión o el contrato.
- [ ] Cerrar el #33.

## Seguridad

- Solo el sandbox de Didit (sin costo) y Supabase local. Nunca la base de producción. Personas reales solo según las reglas de §Sesiones de Didit (integrantes que aceptan, con consentimiento, sin versionar sus DNI).
- Los secretos solo en `.env.local`. Ningún test los imprime.
- Los datos de prueba se borran al terminar: las sesiones en Didit y la base local con `db reset`.

## Criterios de aceptación

- Los casos de las Etapas 2 a 4 están ejecutados con su evidencia, o marcados como bloqueados con su motivo.
- Los mensajes coinciden con D-33.
- El test de minimización está en verde.

## Chequeos

`npm run test:unit`, `npm run test:integration`, `npm run lint`, `npm run build`.

## Verificación manual

Seguir la Etapa 3 con los dos roles. Con `Equipo Tecnico`, la acción de fallback no tiene que aparecer en la pantalla.
