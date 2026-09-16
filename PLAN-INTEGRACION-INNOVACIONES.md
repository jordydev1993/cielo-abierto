# Plan de integración de innovaciones — App Web

**Fecha:** 2026-09-16
**Repo:** `cielo-abierto`
**Roles** (fuente: `GESTION-AVANCE-EQUIPO.md`): Jordy = producto/arquitectura/seguridad,
Sofi = base de datos + análisis funcional, Meli = QA/testing + integraciones backend,
Cami = UI/UX + frontend.

> Nota de honestidad, misma regla que `AGENTS-WEB.md`: este documento distingue
> explícitamente lo que **ya está implementado** de lo que es **innovación nueva**. No se
> repite nada como "hecho" si no se verificó contra el código real.

---

## 0. Antes de repartir tareas: 2 de las 8 ya existen, y una tercera está en marcha por otro lado

| # | Innovación | Estado real |
|---|---|---|
| 1 | Validación RENAPER Automática | 🟡 Parcial — ver § 0.1 |
| 2 | Timeline Visual por NNyA | 🔴 No existe |
| 3 | Seguimiento Post-Egreso Estructurado | 🟢 Implementado, con un gap (falta el hito de 90 días) — ver § 0.2 |
| 4 | Workflow de Aprobaciones | 🔴 No existe |
| 5 | Reportería Automática SENAF | 🔴 No existe |
| 6 | Alertas Educativas | 🟡 Parcial — tabla genérica `alertas` existe, sin ausencias estructuradas |
| 7 | Dashboard de Propuestas (Kanban) | 🟢 Implementado, con un gap (falta el estado "Verificado") — ver § 0.3 |
| 8 | Integración de Calendarios | 🔴 No existe |

### 0.1 — Innovación 1 se cruza con un proyecto ya en marcha: no duplicar

`TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md` ya tiene a **Sofi, Meli y Cami con tareas
asignadas** para un flujo de validación de identidad vía Didit (método RENAPER real:
DNI + selfie contra el padrón) — pero para el **retiro de un NNyA** (quién lo retira de la
residencia), no para el alta de un tutor/referente. Ya existe:
- Cuenta Didit sandbox configurada, workflow publicado, webhook `app/api/didit/webhook`
  deployado en producción (`prompts/016`).
- Decisión de Jordy: tabla propia `retiros`, 3 intentos máx., fallback manual solo
  Admin/coordinador.

Lo que esta sesión ya construyó (`prompts/019`, FASE B) es un flujo **distinto y manual**:
`validaciones_renaper` + `ValidarRenaperForm`, donde un usuario carga a mano el resultado
de una consulta RENAPER que hizo por fuera del sistema, para `referentes` (personas
externas vinculadas a un NNyA por tutela/revinculación), no para el retiro puntual.

**La Innovación 1 real es: conectar `validaciones_renaper` a Didit de la misma forma que
ya se está haciendo para `retiros`, en vez de construir una segunda integración
paralela.** Se detalla en la sección de cada persona más abajo.

### 0.2 — Innovación 3: falta el hito de 90 días

El `CHECK` real de `seguimiento_post_egreso.dias_post_egreso` solo permite `30` y `60`
(`prompts/012`). El pedido dice "30-60-90 días". Es un cambio chico pero real: hay que
ampliar el `CHECK`, el trigger que genera las filas automáticamente (`prompts/026`) y el
formulario. El resto de la innovación (contacto estructurado + indicador de reinserción +
"obligatorio pero flexible" porque el trigger ya lo crea solo) **ya está resuelto**.

### 0.3 — Innovación 7: falta el estado "Verificado"

El kanban de `/propuestas-mejora` (`prompts/022`) usa `abierto → en_progreso → completado
→ cancelado`. El pedido agrega un quinto estado, "Verificado" (¿quién verifica que una
propuesta completada realmente se implementó, y cuándo?) — es una decisión de producto
antes de tocar el `CHECK`, no solo un cambio técnico.

---

## 1. Jordy — Producto, arquitectura, decisiones y seguridad

Igual que en la integración Didit, a Jordy le toca **decidir antes de que el resto
arranque**. Sin estas decisiones, Sofi no puede modelar y Meli/Cami quedan bloqueadas.

| Innovación | Decisión que falta |
|---|---|
| 1 · RENAPER | Confirmar que la validación automática de referentes/tutores se construye **reusando** la cuenta Didit y el webhook ya existentes (no una cuenta ni workflow nuevos) — y si el flujo "alta de tutor" necesita su propio workflow en Didit o alcanza con el mismo método `id_lookup` ya publicado. |
| 3 · Seguimiento 90 días | Aprobar el cambio de `CHECK (dias_post_egreso IN (30,60))` a `IN (30,60,90)` — bajo riesgo, pero es un cambio de schema. |
| 4 · Workflow de aprobaciones | **La más grande a decidir.** ¿Quién firma un egreso (roles reales del sistema son solo `Admin`/`Equipo Tecnico` hoy — "Director" y "Abogado" no existen como roles distinguibles)? ¿Se modela como 3 roles nuevos, o como 3 campos de aprobación dentro de `legajos`/`nnya` que cualquier `Admin` puede completar en nombre del área que corresponda? Sin esta decisión, Sofi no puede modelar nada. |
| 5 · Reportería SENAF | ¿Qué campos exactos pide SENAF en el informe mensual? (no hay una fuente confirmada en el repo — falta el documento de requisitos, como pasó con "procesos-del-negocio.md" para el resto del sistema). Sin esto, es imposible construir el reporte sin inventar contenido. |
| 6 · Alertas educativas | Confirmar que **no** hay integración real con ninguna escuela (el pedido ya lo hedgea con "si tienen API") — para no perder tiempo evaluando una integración que no va a pasar, y enfocar directamente en carga manual + alerta. |
| 7 · Propuestas "Verificado" | Definir qué significa "Verificado" a diferencia de "Completado" — ¿quién verifica (Admin, el mismo responsable, alguien de dirección)? Mismo tipo de decisión que ya tomaste para el kanban original. |
| 8 · Calendarios | ¿Se prioriza Google Calendar, Outlook, o ambos? Cada uno es una integración OAuth separada — mejor no arrancar las dos en paralelo. |

**Tareas propias (no delegables):**
- Coordinar con Meli/Sofi el estado real de la integración Didit para "retiros" (evitar que
  esta sesión y esa avancen en paralelo sin enterarse).
- Revisar y aprobar los planes en `prompts/` que salgan de cada innovación antes de que se
  toque código (mismo ciclo que ya se usó en `prompts/017`–`026`).

---

## 2. Sofi — Modelo de datos y análisis funcional

Depende de las decisiones de Jordy de la sección anterior. Mismo criterio que ya aplicó
para `retiros`: tabla propia si los campos no encajan en una tabla existente, nunca
columnas nullable "por si acaso" en una tabla que no las necesita para el resto de sus
filas.

| Innovación | Qué modela |
|---|---|
| 1 · RENAPER | Si el alta automática de tutor/referente necesita distinguirse del flujo de "retiro": ¿la sesión de verificación Didit es una tabla compartida entre ambos flujos (`sesiones_didit` genérica con un campo `proposito`) o dos tablas separadas? Coordinar con el modelo que ya está diseñando para `retiros` (`TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`) — es la misma clase de dato, decidir si se reusa. |
| 2 · Timeline | Definir qué tablas/columnas alimentan el timeline (no es una tabla nueva, es una vista/query que junta `legajos.fecha_apertura`, `intervenciones.fecha`, `incidentes.fecha_hora`, `diagnosticos.fecha_diagnostico`, `vinculos_tutela.vigente_desde`, `nnya.fecha_egreso`, `seguimiento_post_egreso.fecha_contacto`, etc.) — el trabajo acá es de análisis funcional (qué eventos importan mostrar), no de schema nuevo. |
| 3 · Seguimiento 90 días | `ALTER TABLE seguimiento_post_egreso ... CHECK (dias_post_egreso IN (30,60,90))` + actualizar el trigger `fn_crear_seguimiento_post_egreso` (`prompts/026`) para insertar la tercera fila. |
| 4 · Workflow de aprobaciones | Según lo que decida Jordy: tabla `aprobaciones_egreso` (o similar) con `legajo_id`/`nnya_id`, `tipo_aprobacion` (dirección/legal/técnico), `usuario_id`, `aprobado`, `fecha`, `observaciones` — y un `CHECK`/trigger que impida cerrar el egreso hasta que las 3 estén completas. Mismo patrón que ya usan `evaluacion_institucional_asistentes` o `turnos_personal` (firma doble) para "N personas confirman algo". |
| 5 · Reportería SENAF | Diseñar qué se persiste (¿el PDF generado se guarda en `documentos`/storage, o se regenera al vuelo cada vez?) y de qué tablas sale cada dato del informe, una vez que Jordy confirme el formato real de SENAF. |
| 6 · Alertas educativas | Evaluar si alcanza con reusar `alertas` (`tipo='educativa'`) o si hace falta una tabla `ausencias_escolares` (fecha, motivo, nnya_id) para poder alertar por acumulación, no por un evento suelto. |
| 7 · Propuestas "Verificado" | `ALTER TABLE propuestas_mejora ... CHECK (estado IN ('abierto','en_progreso','completado','verificado','cancelado'))` + campo `verificado_por`/`verificado_at` si Jordy confirma que necesita quedar registrado quién verificó. |
| 8 · Calendarios | Tabla de tokens OAuth por usuario (`calendario_conexiones`: `usuario_id`, `proveedor`, `access_token`, `refresh_token`, `expires_at`) — **nunca** guardar el token en texto plano sin cifrar (mismo criterio de seguridad que ya se aplicó con `SUPABASE_SERVICE_ROLE_KEY`: secretos solo server-side). |

---

## 3. Meli — QA/testing + integraciones backend

Por el precedente de Didit, a Meli le toca la lógica de negocio de cualquier integración
externa nueva (ya lo está haciendo para "retiros"), además de testing (issue #9, todavía
sin arrancar — 0 tests Playwright).

| Innovación | Tarea de backend/integración |
|---|---|
| 1 · RENAPER | Conectar `useCreateValidacionRenaper`/`useCreateReferente` (`prompts/019`) a una sesión Didit real en vez de carga manual: crear sesión → guardar `session_id` → el webhook ya existente (`app/api/didit/webhook`) actualiza el resultado — mismo patrón que ya está armando para `retiros`, evaluar si se puede compartir código (`lib/didit/verify-signature.ts` ya existe y es reusable tal cual). |
| 4 · Workflow de aprobaciones | Endpoint/hook que valide las 3 aprobaciones antes de permitir `estado_actual = 'Egresado'` (server-side, no solo en el formulario — la validación real tiene que vivir en la mutación, no confiarse del cliente). |
| 5 · Reportería SENAF | Generación del PDF (hoy no hay ninguna librería de PDF instalada en el proyecto — evaluar `@react-pdf/renderer` u otra, justificando la dependencia nueva como pide `AGENTS-WEB.md`) + endpoint que arma el reporte del mes a partir de las tablas que defina Sofi. |
| 6 · Alertas educativas | Hook que dispare una alerta (`alertas`, `tipo='educativa'`) cuando se acumulen N ausencias — mismo patrón que ya usa `fn_crear_alerta_incidente_grave` para incidentes graves (trigger de BD, no lógica en el cliente). |
| 8 · Calendarios | Flujo OAuth completo (Google Calendar API y/o Microsoft Graph, según decida Jordy): consentimiento, intercambio de tokens, refresh, creación de eventos para `turnos`/`evaluacion_institucional`. Es la integración externa más grande de las 8 — mismo nivel de cuidado que ya está aplicando en Didit (RNF-13: timeouts y errores controlados, ninguna otra integración del proyecto lo tiene bien hecho todavía). |
| **Todas** | Una vez que cada innovación tenga su primer PLAN implementado, sumar sus casos a los tests Playwright (issue #9) — es el momento de arrancar esa tarjeta, no siga en 0. |

---

## 4. Cami — UI/UX + frontend

Depende de que Meli tenga al menos los endpoints/hooks definidos (puede maquetar antes,
pero la integración real espera) — mismo orden que ya se usó para "retiros".

| Innovación | Pantalla/componente |
|---|---|
| 1 · RENAPER | Si se conecta a Didit de verdad: reemplazar la carga manual de `ValidarRenaperForm` por el widget de Didit (selfie + DNI), mismo componente de cámara que ya tiene que construir para "retiros" — evaluar si se puede compartir uno solo entre los dos flujos en vez de duplicarlo. |
| 2 · Timeline | Componente de timeline visual en `nnya/[id]/page.tsx` (hoy esa página no tiene nada así) — reusar el estilo de badges/colores por estado que ya define `docs/design-system.md` en vez de inventar una paleta nueva (mismo criterio de la propia tarjeta #10 de design system). |
| 3 · Seguimiento 90 días | Actualizar `SeguimientoForm`/`SeguimientoList` (`prompts/026`) para mostrar el tercer hito una vez que Sofi amplíe el `CHECK`. |
| 4 · Workflow de aprobaciones | Pantalla de las 3 firmas pendientes/completas antes de habilitar el botón de egreso en `NnyaForm` — necesita badges de estado claros (pendiente/aprobado/rechazado por cada uno de los 3 roles). |
| 5 · Reportería SENAF | Botón "Descargar informe del mes" + selector de mes/año, en un lugar nuevo o dentro de `/informes`. |
| 6 · Alertas educativas | Form de carga manual de ausencias (o el campo que decida Sofi) + que la alerta generada se vea en `/alertas` con el mismo estilo que las demás. |
| 7 · Propuestas "Verificado" | Quinta columna en `PropuestasKanban` (`prompts/022`) una vez que Jordy defina qué significa y Sofi amplíe el `CHECK`. |
| 8 · Calendarios | Botón "Conectar Google Calendar"/"Conectar Outlook" en el perfil de usuario + indicador de sincronización en `turnos`/`evaluacion_institucional`. |

---

## Orden sugerido (no todas las innovaciones a la vez)

Por impacto/esfuerzo, sugerido de menor a mayor costo de implementación:

1. **§0.2 y §0.3** (los 2 gaps chicos de lo ya implementado) — Sofi + Cami, una tarde.
2. **Innovación 2 (Timeline)** — solo lectura, sin modelo nuevo, bajo riesgo.
3. **Innovación 6 (Alertas educativas)** — reusa `alertas`, alcance chico si no hay integración de escuelas.
4. **Innovación 1 (RENAPER automático)** — depende de que la integración Didit de "retiros" avance primero; después de eso, esta es apenas una segunda aplicación del mismo patrón.
5. **Innovación 7 mejorado / Innovación 4 (Aprobaciones)** — necesitan decisión de producto de Jordy antes de estimarse en serio.
6. **Innovación 5 (Reportería SENAF)** y **8 (Calendarios)** — las de mayor alcance (falta el documento de requisitos de SENAF para la 5; integración OAuth externa completa para la 8). No arrancar sin las decisiones de Jordy de la sección 1.

---

**Estado de este documento**: plan de trabajo para discutir en equipo, no un compromiso de
sprint. Ninguna de estas tareas tiene tarjeta en el tablero todavía (mismo criterio que
`TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`) — se cargan una vez que Jordy confirme las
decisiones de la sección 1.
