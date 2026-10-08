# QA — Validación de identidad para retiro de NNyA (Didit)

**Fecha:** 2026-09-29
**Autora del análisis:** Meli (QA / Testing, integraciones backend, integración Didit)
**Plan asociado:** `prompts/030-qa-didit-retiro.md`
**Fuentes:** `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`, `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md`, `INFORME-WEBHOOK-DIDIT-PARA-MELI.md`, `AGENTS-WEB.md`, `prompts/016-webhook-didit.md`, `prompts/029-playwright-testing-setup.md`

> Alcance de este documento: **análisis y planificación de casos de prueba.** No implementa código, no define campos, no resuelve decisiones funcionales. Los 4 escenarios A–D del PDF fuente §6 **no son ejecutables hoy** y aquí se documentan como especificación.
>
> **Actualizado 2026-09-29 (post E-2).** La etapa E-2 del plan asociado **fue ejecutada**: los casos **K-01a** y **K-02** quedaron **EJECUTADOS Y APROBADOS** a nivel de función, con 14/14 tests en verde. Los 15 casos restantes no se ejecutaron. Ver [§11](#11-registro-de-ejecución-e-2--2026-09-29).
>
> **Actualizado 2026-09-29 (post análisis E-3).** Se corrigió el conteo de asserts fallidos de `tests/01`–`04`: **no son 3, son 6**, y ninguno de ellos es el de `tests/04:32`. Queda además una **decisión funcional pendiente** sobre si `tests/02` y `tests/03` deben probar comportamiento autenticado o anónimo. Ver [§12](#12-análisis-de-la-infraestructura-de-playwright--2026-09-29).
>
> **Actualizado 2026-10-05 — migración a `master` `84c4d23` (RUTA DE EJECUCIÓN CAMBIADA).**
> Los 14 tests de firma **ya no están en Playwright**. El proyecto no usa `@playwright/test`: no está en `dependencies` ni en `devDependencies`, no existe `playwright.config.ts`, y no existen los specs `tests/01`–`04`. La cobertura se migró a **`tests/unit/didit-signature.test.ts`** con `node:test` + `node:assert/strict`, y se corre con **`npm run test:unit`** (no `npx playwright test`).
>
> Todos los comandos de este documento que digan `npx playwright test …` son **históricos**: usaban la ruta anterior. La sección [§12](#12-análisis-de-la-infraestructura-de-playwright--2026-09-29) y las referencias a `tests/01`–`04` y `playwright.config.ts` **se conservan como registro de un relevamiento hecho sobre `b4ab8e3`**, no como estado actual: esos archivos ya no forman parte del repositorio.
>
> **Corrección documental aplicada (2026-10-05):** la explicación de `X-Timestamp: ""` en K-02 estaba mal. Ver K-02 y la fila 14 de la matriz. El valor esperado `false` nunca estuvo en discusión; el motivo, sí.

---

## 1. Estado de la integración (verificado por inspección, no por documentación)

### 1.1 Lo que ya está y no se toca

| Pieza | Ubicación | Estado |
|---|---|---|
| Endpoint del webhook | `app/api/didit/webhook/route.ts` (51 líneas) | **Completo en la parte de seguridad.** Guard de secreto → `500`; body crudo; firma → `401`; JSON inválido → `400`; fuera de esquema → `400`; `webhook_type ≠ status.updated` → `200` sin procesar; loguea **solo** `session_id` + `status` (RNF-04 ✓) |
| Verificación de firma | `lib/didit/verify-signature.ts` (52 líneas) | **Función pura.** Canonicalización recursiva → HMAC-SHA256 → `timingSafeEqual` con pre-check de longitud. Ventana de 300s anti-replay. **No lee `process.env`, no importa Supabase, no hace red** |
| Schema del envelope | `lib/validations/didit-webhook.schema.ts` (16 líneas) | Completo |
| Excepción de middleware | `proxy.ts:35` | Presente (sin ella, el middleware redirigía el webhook a `/login`) |
| Cuenta Didit | Panel | App "arguelloinfancias (Sandbox)"; workflow `71a46d11-…` v`390d69a8-…` (`id_lookup`/`arg_renaper`, DNI + selfie, 3 intentos); webhook `d8699159-…` en producción, evento `status.updated`, v3 |

### 1.2 Lo que no existe en ningún lado

- Tabla `retiros`.
- Tabla de sesiones de verificación Didit (los 5 estados de RNF-12).
- Campo o tabla de "autorización para retirar" (`nnya_tutores` solo tiene `es_principal` — `clean_schema.sql:78-85`).
- Campo de "restricciones vigentes" sobre el vínculo tutor↔NNyA.
- Route handler para **crear** una sesión de verificación.
- Endpoint para **consultar** el estado de una verificación.
- Cliente HTTP hacia Didit (ni wrapper de timeout/retry — sería el primero del proyecto).
- Cualquier UI, hook o componente de retiro.
- Política de minimización de datos.

**Verificación:** 38 migraciones en `supabase/migrations/`, 28 tablas. `grep` de `retiro|didit|sesiones` sobre `supabase/` → **0 resultados**.

### 1.3 El punto exacto donde arranca mi parte

`app/api/didit/webhook/route.ts:41-48`, comentario `// TODO(Meli):`
1. Buscar la sesión de verificación por `session_id`.
2. Actualizar su estado según `status`.
3. Si `status === 'Approved'`, validar la autorización de retiro vigente.

Los 3 pasos dependen de tablas que no existen. **No se implementan todavía.**

### 1.4 Estado del setup de Playwright (preexistente, sin commitear) — ⚠️ HISTÓRICO

> **⚠️ Esta subsección describe el estado del repositorio en `b4ab8e3` (2026-09-29) y ya NO describe el estado actual.** En el `master` `84c4d23` **no existe `playwright.config.ts`**, **no existen `tests/01`–`04`**, y **no hay reglas de testing agregadas a `.gitignore`** (el bloque `# testing` sigue con solo `/coverage`). Ninguna de estas afirmaciones debe leerse como presente. Se conserva como registro del relevamiento.

Rama `master`, HEAD `b4ab8e3`. Untracked: `playwright.config.ts`, `tests/`, `prompts/027-…`. (`playwright-report/`, `test-results/`, `dev.log`, `test-output.txt` y `test-results-summary.txt` también estaban untracked, pero **ya no aparecen**: se agregaron a `.gitignore` el 2026-09-29.)

**Está incompleto, no "listo":**
- `playwright.config.ts` **no tiene `webServer`**.
- Resultado real de `test-results-summary.txt`: **8 tests fallan** con `net::ERR_CONNECTION_REFUSED`, 2 skippeados.
- **6 asserts fallan** incluso con servidor levantado: 4 en `tests/02:17,19,20,21` y 2 en `tests/03:19,20` (ver §12.3). El de `tests/04:32` **no falla**: pasa por el motivo equivocado.

---

## 2. Entorno: qué se puede ejecutar y qué no

### 2.1 Restricción vigente (decisión de Meli 2026-09-29)

Sin producción, sin `.env.local` con credenciales reales, sin Vitest, sin dependencias nuevas. Se permite un **secreto Didit ficticio** solo dentro del entorno de testing. Nunca una credencial real, nunca versionada.

### 2.2 Verificación empírica (2026-09-29)

`next dev` **arranca** sin variables de Supabase (`Ready in 1001ms`). Pero toda request que matchea el `matcher` de `proxy.ts:52-55` — **incluido `/api/didit/webhook`** — falla antes de llegar a la ruta:

```
Error: Your project's URL and Key are required to create a Supabase client!
    at proxy (proxy.ts:7:38)
```

HTTP recibido: **500**.

**Consecuencia:** los tests de contrato del webhook necesitan el servidor de Next, y el servidor necesita `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, que no están disponibles. Esos tests quedan **pendientes de entorno**. No se lo rodea con hacks: se documenta.

### 2.3 Consecuencia sobre el criterio CA-5 de `prompts/016`

`prompts/016` define CA-5: *"Sin `DIDIT_WEBHOOK_SECRET` en el entorno → 500"*. Ese camino **es inalcanzable si tampoco faltan las vars de Supabase**: el middleware devuelve 500 primero. El código de salida coincide (500), el camino no. Queda registrado como R-4 en §7.

### 2.4 Lo único ejecutable hoy

`lib/didit/verify-signature.ts` es una **función pura**: el secreto entra como parámetro. No hay servidor, ni entorno, ni red, ni base. Es el único activo testeable en las condiciones actuales.

---

## 3. Leyenda de clasificación

| Marca | Categoría | Significado |
|---|---|---|
| 🟢 | **Ejecutable actualmente** | Se puede escribir y correr un test **hoy**: sin servidor, sin `.env.local`, sin Supabase |
| 🟠 | **Bloqueado por Sofi** | Requiere el modelo de datos (tabla `retiros`, tabla de sesiones, enum de estados, campo de autorización). No es testeable por más que se quiera escribir el test |
| 🔴 | **Bloqueado por decisión funcional** | Requiere una decisión de Jordy. No es un problema de código: escribir el test sin la decisión sería inventar comportamiento |
| 🟣 | **Pendiente de entorno** | No necesita el modelo de Sofi ni una decisión, pero necesita que el servidor de Next levante → necesita `NEXT_PUBLIC_SUPABASE_*` (§2.2) |

Un caso puede tener un bloqueante primario y otro secundario; se marca el primario y se anota el otro.

**Notación de estado de ejecución** (usada en el campo *Estado actual* de §5 a partir del 2026-09-29):

| Marca | Significado |
|---|---|
| ✅ **EJECUTADO Y APROBADO** | El caso tiene tests automatizados en verde que lo cubren. La cobertura es **a nivel de función** salvo que se indique lo contrario |
| ⏳ Pendiente de ejecución | El caso está especificado pero no se ha corrido |
| 🚫 Bloqueado | Bloqueado por Sofi, por decisión de Jordy o por entorno |

---

## 4. Resumen de los 17 casos

| ID | Caso | Clasificación | Bloqueante primario | Automatizable |
|---|---|---|---|---|
| **A-01** | Identidad válida + autorizado → retiro permitido | 🟠 | Modelo de datos | Solo E2E, y con cámara → semi-manual |
| **B-01** | Identidad inválida → retiro rechazado | 🟠 | Modelo de datos | Solo E2E; backend sí, vía `session_id` inyectado |
| **C-01** | Identidad válida + NO autorizado → retiro rechazado | 🟠 | Modelo de datos | Solo E2E; backend sí |
| **D-01** | Didit caído / timeout / error → error controlado | 🟠 | Modelo de datos + cliente HTTP | Sí, vía `page.route()` mock |
| **F-01** | Tope de 3 intentos: el 4º se rechaza | 🟠 | `cantidad_intentos` | Backend sí, UI no |
| **F-02** | Alcance del contador de 3 intentos | 🔴 | **Decisión de Jordy** (P-04) | — |
| **G-01** | Quién puede hacer el fallback manual | 🔴 | **Decisión de Jordy** (P-02) | Sí (espera 403) |
| **G-02** | El fallback manual deja rastro (`autorizado_por` + audit) | 🟠 | Modelo de datos (secundario: P-02) | Sí |
| **H-01** | Autorización independiente de la identidad | 🟠 | Modelo de datos | Backend sí |
| **H-02** | Tutor no vinculado al NNyA | 🟠 | Modelo de datos | Backend sí |
| **I-01** | Timeout hacia Didit | 🟠 | Enum de estados (el cliente HTTP es tarea propia M-6) | **Unit 100%** del wrapper + mock |
| **J-01** | Payload con firma válida pero inválido | 🟣 | Entorno | Sí, cuando haya servidor |
| **K-01** | Firma ausente / inválida / de otro secreto / truncada | 🟢 unit + 🟣 contrato | — (dividido en K-01a / K-01b) | **Sí — es lo ejecutable hoy** |
| **K-02** | Replay: `X-Timestamp` vencido | 🟢 | — | **Sí — es lo ejecutable hoy** |
| **L-01** | `session_id` inexistente | 🔴 | **Decisión de Jordy** (P-03); secundario: modelo de datos | Sí |
| **M-01** | Idempotencia ante reentrega de Didit | 🟠 | Modelo de datos | Backend sí |
| **M-02** | Logs sin biometría (RNF-04) | 🟢 | — | Manual (logs de servidor) |

**Totales:** 🟢 3 (K-01a, K-02, M-02) · 🟣 2 (J-01, K-01b) · 🔴 3 (F-02, G-01, L-01) · 🟠 9.

**Estado de ejecución tras E-2 (2026-09-29):** ✅ **K-01a** y ✅ **K-02** están **EJECUTADOS Y APROBADOS** a nivel de función (14/14 tests en verde, ver §11). Los otros **15 casos siguen pendientes**, incluido **K-01b**, que es la mitad de endpoint de K-01 y continúa bloqueado por entorno.

**Los 4 escenarios A, B, C y D están todos bloqueados por Sofi.** No hay forma de ejecutarlos antes.

---

## 5. Matriz de casos de prueba

### A-01 — Identidad válida + persona autorizada → retiro permitido

- **Objetivo:** validar el camino feliz completo. Probar que la doble validación (identidad **y** autorización de retiro) deja pasar el retiro, y que ambos resultados quedan persistidos de forma independiente.
- **Precondiciones:** sesión de usuario (`Admin` o `Equipo Tecnico`) · `nnya` activa con legajo activo · `tutor` vinculado vía `nnya_tutores` **con autorización de retiro vigente** · `DIDIT_API_KEY` y `DIDIT_WEBHOOK_SECRET` en el entorno · workflow de Didit sandbox operativo.
- **Datos necesarios:** `<nnya_id>` activo · `<tutor_id>` autorizado a retirar · DNI + toma selfie válidos en el padrón RENAPER sandbox · `session_id` devuelto por Didit.
- **Pasos:** 1) Iniciar sesión. 2) Abrir "Registrar retiro". 3) Seleccionar el NNyA. 4) Seleccionar el tutor autorizado. 5) Lanzar la verificación de identidad. 6) Completar DNI + selfie hasta que Didit emita `Approved`. 7) Confirmar que el retiro queda habilitado. 8) Registrar hora de inicio y descripción. 9) Cerrar el retiro con hora de finalización.
- **Resultado esperado:** la sesión pasa a `Identidad verificada`; la autorización se resuelve como `Autorizado`; el retiro se habilita y se persiste con `resultado_validacion_identidad = Identidad verificada`, `resultado_autorizacion = Autorizado`, `cantidad_intentos = 1`; queda traza en `audit_log` (RF-09/RF-19); el cierre con hora de finalización queda registrado.
- **Prioridad:** 🔴 Crítica
- **Estado actual:** No implementado. La UI de registro de retiro no existe.
- **Clasificación:** 🟠 **Bloqueado por Sofi** — necesita `retiros`, tabla de sesiones, campo de autorización, cliente Didit.
- **Dependencia:** Sofi (modelo de datos) → Meli (cliente Didit + webhook) → Cami (UI).
- **Automatización:** **No hoy.** El widget de Didit usa cámara y no tiene modo headless documentado. El E2E real es **semi-manual** (grabación + screenshots + aserciones parciales). Lo automatizable a futuro es el **nivel backend**: dar de alta un `session_id` ya en `Approved` y verificar la máquina de estados sin tocar la cámara.

### B-01 — Identidad inválida → retiro rechazado

- **Objetivo:** comprobar que un resultado no aprobado de Didit **nunca** habilita el retiro, incluso cuando la autorización de retiro **sí** está vigente. Es el caso que evita el falso positivo de seguridad.
- **Precondiciones:** igual que A-01, con autorización de retiro **deliberadamente vigente** para aislar la variable.
- **Datos necesarios:** `<tutor_id>` autorizado · DNI + toma que RENAPER sandbox rechace.
- **Pasos:** 1) Iniciar sesión. 2) Seleccionar NNyA y tutor autorizado. 3) Lanzar la verificación. 4) Forzar un resultado no aprobado. 5) Intentar continuar con el retiro de todas formas.
- **Resultado esperado:** estado `Identidad no verificada`; retiro **no** habilitado; el mensaje de error ya redactado en el PDF §6-B se muestra **tal cual está escrito** (no inventar copy nuevo); `motivo_rechazo` persistido; entrada en `audit_log` del rechazo; **no** se crea un registro de retiro completo. El contador de intentos se incrementa.
- **Prioridad:** 🔴 Crítica
- **Estado actual:** No implementado.
- **Clasificación:** 🟠 **Bloqueado por Sofi.**
- **Dependencia:** las de A-01.
- **Automatización:** **No hoy** (mismo bloqueo de cámara). A futuro es automatizable al 100% en backend: `Approved` y `Declined` deben mapear a estados distintos — es una aserción de máquina de estados, sin cámara.

> **Nota de diseño heredada de `INFORME-VALIDACION…:118-122`:** con `id_lookup` sin fallback a documento, si RENAPER no encuentra match, da error, o el match es parcial, la sesión se **declina directamente**. No hay ruta automática de "fallback manual" del lado de Didit. El fallback manual (decisión `[CG1]`) se resuelve en el backend propio, no en el workflow. Esto condiciona qué significa "identidad inválida" en B-01: puede ser un `Declined` por DNI inexistente, por selfie que no pasa, o por no-match parcial — **los tres colapsan al mismo estado** y no hay forma de distinguirlos desde el estado. Ver P-01.

### C-01 — Identidad válida + persona NO autorizada → retiro rechazado

- **Objetivo:** probar la **independencia** de las dos validaciones (RF-05/RF-06). Es el caso de mayor valor de seguridad: es exactamente el que un `Approved` mal interpretado dejaría pasar. Un resultado de identidad válido **no autoriza** nada por sí solo.
- **Precondiciones:** sesión de usuario · `nnya` activa · `tutor` **vinculado** a ese NNyA pero **sin autorización de retiro vigente** (o con autorización vencida, o con restricción vigente) · datos de identidad **válidos**.
- **Datos necesarios:** `<tutor_id>` vinculado sin autorización vigente · DNI + selfie válidos.
- **Pasos:** 1) Iniciar sesión. 2) Seleccionar el NNyA y el tutor **no autorizado**. 3) Verificar identidad → `Approved`. 4) Intentar continuar con el retiro.
- **Resultado esperado:** identidad = `Identidad verificada` **pero** autorización = `No autorizado`; retiro **rechazado**; el mensaje distingue explícitamente "identidad OK / autorización denegada" — un error genérico dejaría al operador sin saber la causa; `motivo_rechazo` registra el motivo de **autorización**, no de identidad; queda traza en `audit_log`.
- **Prioridad:** 🔴 Crítica
- **Estado actual:** No implementado. El concepto "autorizado a retirar" no existe (`nnya_tutores.es_principal` no lo representa — RN-01: un tutor puede ser principal y no estar autorizado a retirar, o viceversa).
- **Clasificación:** 🟠 **Bloqueado por Sofi** (campo/tabla de autorización + restricciones vigentes).
- **Dependencia:** Sofi — es la parte más delicada de su modelo.
- **Automatización:** **No hoy**, y además tiene un **punto ciego de diseño**: si la UI ofrece el tutor desde una lista ya filtrada por "autorizados", la combinación no-autorizado puede ser **imposible de disparar desde la interfaz**, y el caso quedaría sin cobertura real. Hay que garantizar un camino para forzar la combinación. **Se plantea como requisito de diseño para Cami y Sofi; no se decide acá.**

### D-01 — Didit no disponible / timeout / error del proveedor → error controlado

- **Objetivo:** comprobar que una falla del proveedor **nunca** produce retiro permitido, pantalla en blanco, ni error 500 sin manejar. Validar RNF-13.
- **Precondiciones:** sesión de usuario · NNyA y tutor listos · Didit **inalcanzable** (URL base inválida, red bloqueada, o `page.route()` interceptando con `abort`).
- **Datos necesarios:** ninguno de Didit — el punto es que no responda.
- **Pasos:** 1) Seleccionar NNyA y tutor. 2) Intentar crear la sesión de verificación con Didit caído. 3) Ejecutar las 5 variantes: (a) timeout, (b) HTTP 5xx, (c) HTTP 4xx, (d) red caída, (e) respuesta malformada.
- **Resultado esperado:** error controlado, **nunca** un 500 sin manejar; estado `Error del proveedor`; el retiro **no** se habilita en ninguna variante; el reintento está disponible; el mensaje al usuario es accionable ("reintentá en unos minutos") y **no filtra internals** (RNF-04/RNF-13); el intento **sí** se cuenta; `audit_log` registra la falla técnica; no queda estado parcial a medias.
- **Prioridad:** 🔴 Crítica
- **Estado actual:** No implementado. No existe cliente HTTP a Didit; ningún servicio externo del proyecto tiene hoy este patrón (RNF-13 = 0% en `INFORME-VALIDACION…:77`).
- **Clasificación:** 🟠 **Bloqueado por Sofi** (el enum de 5 estados tiene que incluir `Error del proveedor`; el cliente HTTP con `AbortSignal` es tarea propia M-6 de Meli y se puede escribir sin Sofi, pero el caso no se puede cerrar sin el estado).
- **Dependencia:** Sofi (enum de estados) + Meli (M-6) + Cami (UI del mensaje).
- **Automatización:** **Parcial, y es la variante más valuable de automatizar.** Una vez exista el endpoint de creación, `page.route('**/api/didit/**', r => r.abort())` simula la caída completa desde Playwright, sin tocar Didit ni la base. Las variantes (a)–(e) del lado del cliente HTTP son **unit tests** del wrapper: automatizables al 100% sin Didit y sin DB.

### F-01 — Tope de 3 intentos: el 4º intento se rechaza

- **Objetivo:** garantizar que el límite de 3 intentos (RF18, decidido por Jordy 2026-09-15) se cumpla y que no se pueda eludir.
- **Precondiciones:** existe un retiro con `cantidad_intentos = 3` consumidos.
- **Datos necesarios:** `<retiro_id>` con 3 intentos ya registrados.
- **Pasos:** 1) Abrir el retiro. 2) Pedir una nueva sesión de verificación. 3) Intentar 2 veces más, si la UI lo permite.
- **Resultado esperado:** la 4ª solicitud se rechaza **antes de llamar a Didit** (no se crea sesión en el proveedor, no se consume un intento del workflow); el contador permanece en 3; el proceso deriva a revisión manual / supervisor; el mensaje explica que se agotaron los intentos.
- **Prioridad:** 🔴 Alta
- **Estado actual:** No implementado. El workflow de Didit tiene 3 intentos configurados, pero el tope de negocio (que nadie pueda pedir un 4º) vive en nuestra base y no existe.
- **Clasificación:** 🟠 **Bloqueado por Sofi** (`cantidad_intentos` + la decisión de dónde se cuenta → P-04).
- **Dependencia:** Sofi + P-04.
- **Automatización:** Backend sí (el rechazo debe ocurrir antes de la llamada saliente — se verifica con un mock que cuente invocaciones). UI no.

### F-02 — Alcance del contador de 3 intentos

- **Objetivo:** definir **sobre qué** cuentan los 3 intentos, porque el enunciado "3 intentos" no lo especifica.
- **Precondiciones:** — (es una decisión, no un caso de ejecución)
- **Datos necesarios:** —
- **Pasos:** — (a definir tras la decisión)
- **Resultado esperado:** regla explícita y testeable. Opciones observadas, **ninguna elegida**: por retiro · por tutor + retiro · por día (ventana de reintentos) · por sesión de verificación.
- **Prioridad:** 🔴 Alta (bloquea F-01 y parte de D-01)
- **Estado actual:** Sin definir.
- **Clasificación:** 🔴 **Bloqueado por decisión funcional** → P-04.
- **Dependencia:** Jordy (con Sofi, por el modelo del campo).
- **Automatización:** No aplica hasta definirse.

> La ambigüedad tiene consecuencias observables: con "por día", un usuario que falla 3 veces debe esperar al día siguiente; con "por retiro", queda bloqueado para siempre. El comportamiento de la UI y del endpoint cambia según la opción.

### G-01 — Quién puede realizar el fallback manual

- **Objetivo:** verificar que el fallback manual por indisponibilidad de Didit (**solo** `Admin`/coordinador, decisión `[CG1]`) está efectivamente restringido.
- **Precondiciones:** retiro en estado `Error del proveedor` (o `Requiere revisión`) · sesión de un usuario **no** autorizado para el fallback.
- **Datos necesarios:** usuario de rol `Equipo Tecnico` (Cami) y usuario de rol `Admin` (Meli), ambos con la misma situación de partida.
- **Pasos:** 1) Con sesión de `Equipo Tecnico`, intentar aplicar el fallback manual. 2) Repetir con sesión de `Admin`. 3) Comparar.
- **Resultado esperado:** el usuario no autorizado recibe **403** y la acción no aparece en la UI; el autorizado puede aplicarla; la decisión queda registrada con identidad de quién la tomó.
- **Prioridad:** 🔴 Crítica
- **Estado actual:** Sin definir. **La documentación se contradice** (ver P-02).
- **Clasificación:** 🔴 **Bloqueado por decisión funcional** → P-02.
- **Dependencia:** Jordy.
- **Automatización:** Sí, una vez definido — el caso de negocio es un `403` y un `403` se automatiza fácil. Es el caso 🔴 con mejor relación valor/esfuerzo.

### G-02 — El fallback manual deja rastro

- **Objetivo:** comprobar que el fallback manual no es un bypass sin trazabilidad (RF19/RF-09, RNF-04).
- **Precondiciones:** retiro en `Error del proveedor` · sesión con rol habilitado para el fallback.
- **Datos necesarios:** `<retiro_id>` en error.
- **Pasos:** 1) Aplicar el fallback manual. 2) Verificar el registro del retiro. 3) Verificar `audit_log`.
- **Resultado esperado:** `autorizado_por` queda **no nulo** y apunta al `Admin`/`Equipo Tecnico` que lo autorizó; `audit_log` registra tabla, operación, `registro_id` y `usuario_id` (el trigger `fn_audit_trigger` de la migración `20260915182618` lo cubre automáticamente si la tabla `retiros` entra en su lista); **no** puede aplicarse el fallback si la identidad quedó en `Identidad no verificada` — un `Declined` es un rechazo, no una indisponibilidad del proveedor, y no habilita el fallback.
- **Prioridad:** 🔴 Alta
- **Estado actual:** No implementado. El campo `autorizado_por` no existe.
- **Clasificación:** 🟠 **Bloqueado por Sofi** (campo `autorizado_por` + tabla `retiros` que entre en los triggers de `audit_log`); secundario: depende de P-02.
- **Dependencia:** Sofi + P-02.
- **Automatización:** Sí, a nivel backend y de audit log.

### H-01 — Autorización de retiro independiente de la validación de identidad

- **Objetivo:** cubrir lo mismo que C-01 pero desde el backend, sin depender de la UI. Separar los dos ejes para que la cobertura no dependa de cómo Cami construya la pantalla.
- **Precondiciones:** retiro creado; sesión de identidad en `Identidad verificada`; autorización de retiro ausente.
- **Datos necesarios:** `session_id` en estado verificado + `<tutor_id>` sin autorización.
- **Pasos:** 1) Forzar el estado de la sesión a verificado vía el webhook (firma válida, `status: Approved`). 2) Intentar habilitar el retiro. 3) Verificar qué se persiste.
- **Resultado esperado:** la habilitación se rechaza; ambos resultados se registran por separado (`resultado_validacion_identidad` y `resultado_autorizacion` son campos distintos, no uno derivado del otro); el rechazo apunta a la autorización.
- **Prioridad:** 🔴 Crítica
- **Estado actual:** No implementado.
- **Clasificación:** 🟠 **Bloqueado por Sofi.**
- **Dependencia:** Sofi.
- **Automatización:** **Sí a nivel backend**, sin cámara y sin widget. Es la forma de cubrir C-01 sin depender de la UI.

### H-02 — Tutor no vinculado al NNyA

- **Objetivo:** comprobar que el vínculo tutor↔NNyA es un filtro previo, y que un DNI válido de una persona sin vínculo no alcanza para habilitar nada.
- **Precondiciones:** `nnya` activa · tutor que **no** tiene fila en `nnya_tutores` para ese NNyA · identidad del tutor válida.
- **Datos necesarios:** `<tutor_id>` sin vínculo.
- **Pasos:** 1) Intentar registrar un retiro para el NNyA con ese tutor. 2) Verificar en qué orden se rechaza (antes o después de validar identidad).
- **Resultado esperado:** rechazo. **El orden (antes o después de gastar un intento de identidad) es una decisión de diseño** que hay que tomar explícitamente, porque tiene costo: validar después es más seguro pero gasta un intento del workflow de Didit. Queda registrado como pendiente de diseño, no decidido acá.
- **Prioridad:** 🟠 Media
- **Estado actual:** No implementado.
- **Clasificación:** 🟠 **Bloqueado por Sofi.**
- **Dependencia:** Sofi.
- **Automatización:** Backend sí.

### I-01 — Timeout hacia Didit

- **Objetivo:** verificar el manejo de timeout en la comunicación con Didit (RNF-13), hoy inexistente en todo el proyecto.
- **Precondiciones:** endpoint de creación de sesión implementado; se controla la latencia de la respuesta.
- **Datos necesarios:** un umbral de timeout definido (**no definido todavía** — el proyecto no tiene ningún precedente; hay que elegirlo: 5s, 8s, 10s).
- **Pasos:** 1) Hacer que la respuesta de Didit tarde más que el umbral. 2) Verificar el resultado. 3) Verificar que se puede reintentar. 4) Verificar que no queda estado parcial.
- **Resultado esperado:** `AbortSignal` corta la petición; se devuelve un error tipado y controlado, no una excepción sin manejar; el estado pasa a `Error del proveedor`; el reintento queda disponible; el intento **sí** se cuenta; no queda una sesión "colgada" en un estado intermedio.
- **Prioridad:** 🔴 Crítica
- **Estado actual:** No implementado. El cliente HTTP a Didit no existe.
- **Clasificación:** 🟠 **Bloqueado por Sofi** (el enum de estados tiene que existir para poder afirmar el estado resultante). El wrapper con `AbortSignal` es trabajo propio de Meli (M-6) y se puede escribir **antes** de que Sofi termine.
- **Dependencia:** Sofi (enum) + decisión sobre el valor del umbral.
- **Automatización:** **La mejor candidata a automatización total.** El wrapper HTTP con `AbortSignal` es una función testeable sin red (se le pasa un `fetch` inyectado o un servidor local que no responde). 100% automatizable, sin Didit y sin Supabase. Solo la aserción del estado final necesita a Sofi.

### J-01 — Payload con firma válida pero inválido

- **Objetivo:** comprobar que un webhook autenticado pero inesperado no rompe la entrega ni el sistema.
- **Precondiciones:** servidor de Next levantado con un `DIDIT_WEBHOOK_SECRET` **ficticio** en el entorno de testing.
- **Datos necesarios:** cuerpos construidos en el test y firmados con el secreto ficticio.
- **Pasos:** 4 variantes, cada una un POST firmado correctamente: (a) body no parseable como JSON; (b) body parseable pero fuera del schema zod; (c) `webhook_type` distinto de `status.updated`; (d) `environment: 'prod'`.
- **Resultado esperado:** (a) → **400** `Body inválido`; (b) → **400** `Payload inesperado`; (c) → **200** sin procesar, para no romper la entrega; (d) → **400**, porque `environment` solo admite `live`/`sandbox` — **un evento de producción sería rechazado**, lo cual es correcto para una app que solo usa sandbox, pero no está testeado ni documentado en ningún lado.
- **Prioridad:** 🟠 Media
- **Estado actual:** El comportamiento está implementado y es correcto; **no está testeado**.
- **Clasificación:** 🟣 **Pendiente de entorno** (§2.2) — no necesita el modelo de Sofi, pero necesita que el servidor levante.
- **Dependencia:** `NEXT_PUBLIC_SUPABASE_*` disponibles. **No** depende de Sofi.
- **Automatización:** Sí, una vez haya servidor. **No escribe en Supabase**: el route handler no importa cliente de Supabase en absoluto.

### K-01 — Firma ausente / inválida / de otro secreto / truncada

- **Objetivo:** validar RNF-05 — *"no debe modificarse el estado de un retiro simplemente porque se recibió una petición HTTP"*. Es la primera línea de defensa de todo el feature.
- **Precondiciones:** ninguna. La función es pura.
- **Datos necesarios:** cuerpo JSON de ejemplo + secreto ficticio de testing.
- **Pasos:** 5 variantes de `verifyDiditSignature()`: (a) `timestampHeader` ausente; (b) `signatureHeader` ausente; (c) 1 carácter de la firma alterado; (d) firma calculada con otro secreto; (e) firma truncada (longitud distinta).
- **Resultado esperado:** las 5 devuelven `false`. Ninguna acepta el webhook. El truncado cubre el pre-check de longitud de `verify-signature.ts:49` (evita que `timingSafeEqual` lance por buffers de distinto tamaño). A nivel de endpoint: **401** en las 5, **cero** escrituras y **cero** log como evento válido.
- **Prioridad:** 🔴 Crítica
- **Estado actual:** ✅ **EJECUTADO Y APROBADO** (nivel función, K-01a) el 2026-09-29. La mitad de endpoint (K-01b) sigue ⏳ pendiente de entorno. Ver §11.
- **Clasificación:** 🟢 **Ejecutable actualmente** (nivel función, K-01a — **ya ejecutado**) + 🟣 **Pendiente de entorno** (nivel endpoint, K-01b — **no ejecutado**).
- **Dependencia:** ninguna para K-01a. No toca Supabase, no lee `process.env`. K-01b sí necesita `NEXT_PUBLIC_SUPABASE_*`.
- **Automatización:** **Total en nivel función — HECHO.** 9 tests en `tests/unit/didit-signature.test.ts` (`K-01a.1`–`K-01a.9`), con `node:test`, que cubren los 5 items de *Pasos* más 4 casos adicionales de canonicalización y body no-JSON. Los 5 items de *Pasos* están cubiertos: `.2` (timestamp ausente), `.3` (firma ausente), `.4` (truncada), `.5` (carácter alterado), `.6` (otro secreto). A nivel de endpoint sigue **pendiente**: los **401**, las cero escrituras y el cero log como evento válido **no están verificados**.

### K-02 — Replay: `X-Timestamp` vencido

- **Objetivo:** comprobar la ventana de frescura de 300s (`verify-signature.ts:34`) que impide capturar un webhook y reenviarlo después.
- **Precondiciones:** ninguna. Función pura.
- **Datos necesarios:** `X-Timestamp` con valores a una distancia conocida del reloj del servidor.
- **Pasos:** 5 variantes: (a) timestamp de hace 10 minutos; (b) de hace 301s exactos; (c) de hace 299s exactos (borde válido); (d) `X-Timestamp` no numérico (`"abc"`); (e) `X-Timestamp` vacío.
- **Resultado esperado:** (a) y (b) → `false`; (c) → `true` (la ventana es inclusiva en el borde, conviene fijarlo con un test para que nadie lo cambie sin querer); (d) → `false` (frena en `verify-signature.ts:31` por `NaN`); (e) → `false` (frena en `verify-signature.ts:28`, en el guard `!timestampHeader`, porque `""` es *falsy* — **no** llega al chequeo del reloj).
- **Corrección 2026-10-05 (documental):** este documento decía antes que el caso (e) pasaba el chequeo de finitud (`Number("")` es `0`, que es finito) y se frenaba por la ventana de 300s. **Era incorrecto.** `Number("")` nunca se evalúa: `""` es falsy y el guard de headers corta antes. El valor esperado `false` no cambia; cambia el motivo. El caso (e) se clasifica como **validación del guard de header**, no de la ventana anti-replay.
- **Prioridad:** 🔴 Crítica
- **Estado actual:** ✅ **EJECUTADO Y APROBADO** el 2026-09-29. La ventana de 300s está verificada en el borde, en ambos sentidos. Ver §11.
- **Clasificación:** 🟢 **Ejecutable actualmente — ya ejecutado.**
- **Dependencia:** ninguna.
- **Automatización:** Total — HECHA. 5 tests en `tests/unit/didit-signature.test.ts` (`K-02.1`–`K-02.5`), con `node:test`, uno por cada variante de *Pasos*. El borde (c) queda fijado con un test, de modo que un cambio futuro en la ventana de 300s rompe la suite en lugar de pasar inadvertido. El caso (e) fija el guard de header, no la ventana.

> **⚠️ Observación conservada sobre K-02.3 (sensibilidad temporal).** El caso (c) usa `now - 299`, contra un límite de 300s. Es sensible a **±1s**: si el event loop se demorara 2s entre que el test calcula el timestamp y que `verifyDiditSignature` lee `Date.now()`, la diferencia pasa a 301s y el test falla. En 3 corridas consecutivas no ocurrió —el intervalo real es de microsegundos—, y el motivo está documentado dentro del propio archivo de test. **Si llegara a fallar, el arreglo es subir el número a 290 (sigue dentro de la ventana), nunca tocar la implementación.** El caso (b) con 301s sí es determinista en la dirección segura, porque el reloj solo puede hacer crecer la diferencia.

### L-01 — `session_id` inexistente

- **Objetivo:** definir y verificar el comportamiento ante un webhook válido cujo `session_id` no corresponde a ninguna sesión conocida.
- **Precondiciones:** servidor de Next levantado; webhook correctamente firmado con un `session_id` UUID que no existe.
- **Datos necesarios:** UUID aleatorio.
- **Pasos:** 1) Enviar un webhook firmado con `session_id` inexistente y `webhook_type: status.updated`. 2) Verificar código de respuesta y efecto.
- **Resultado esperado:** **sin definir.** Ver P-03. Criterio a tener en cuenta al decidir: Didit **reintenta** las entregas, así que devolver `404` genera reintentos indefinidos y ensucia el panel de Didit. Opciones: `200` + log de "no encontrada" (idempotente, sin reintentos, pero oculta el problema); `200` ignorado en silencio; `202` accepted-para-procesar.
- **Prioridad:** 🟠 Media
- **Estado actual:** **Hoy devuelve `200` no-op** — el handler loguea y no busca nada (`route.ts:39-50`). El caso es trivial hasta que exista la tabla.
- **Clasificación:** 🔴 **Bloqueado por decisión funcional** → P-03. Secundario: modelo de datos de Sofi.
- **Dependencia:** Jordy (P-03) + Sofi.
- **Automatización:** Sí a nivel endpoint. Es además el caso que más fácilmente detecta una regresión cuando se escriba la lógica de búsqueda.

### M-01 — Idempotencia ante reentrega

- **Objetivo:** comprobar que la reentrega del mismo evento (mismo `event_id`) no produce efectos duplicados, y que un estado tardío no pisa un estado ya avanzado.
- **Precondiciones:** sesión existente; se reenvía el mismo evento.
- **Datos necesarios:** un `event_id` y un `session_id` repetidos; y el par (`Approved` → `In Progress`) para verificar que un estado no retrocede.
- **Pasos:** 1) Enviar el mismo webhook 2 veces. 2) Enviar `Approved` y después `In Progress` sobre la misma sesión.
- **Resultado esperado:** la segunda entrega es un no-op; no hay filas duplicadas; un estado terminal no es degradado por un evento atrasado; el registro de auditoría no se duplica.
- **Prioridad:** 🟠 Media
- **Estado actual:** No implementado (no hay tabla donde el efecto duplicado pueda ocurrir).
- **Clasificación:** 🟠 **Bloqueado por Sofi.**
- **Dependencia:** Sofi.
- **Automatización:** Backend sí. **Importante:** la idempotencia se puede y debe diseñar **antes** de escribir la lógica de negocio, no después. Si no se piensa ahora, se descubre cuando Didit ya reenvió 300 veces.

### M-02 — Logs sin biometría ni credenciales (RNF-04)

- **Objetivo:** confirmar que la información sensible de la sesión de Didit no llega a los logs.
- **Precondiciones:** servidor con un webhook firmado que trae `decision` poblado.
- **Datos necesarios:** payload con `decision` conteniendo datos del feature `id_lookup`.
- **Pasos:** 1) Enviar el webhook. 2) Inspeccionar la salida del servidor.
- **Resultado esperado:** los logs contienen **solo** `session_id` + `status`. **Nunca** el objeto `decision` completo (puede contener resultados de OCR, selfie o datos del padrón), ni credenciales, ni datos del tutor. Consistente con la política de minimización de RNF-06/07 (no guardar selfies, videos, plantillas biométricas ni copias de DNI — solo el resultado de la operación).
- **Prioridad:** 🟠 Media
- **Estado actual:** **Ya se cumple.** `route.ts:39` loguea únicamente `session_id` y `status`. Este caso existe para **proteger** ese comportamiento cuando se agregue la lógica de negocio, que es cuando sería fácil filtrar algo por loguear el `session` completo para debug.
- **Clasificación:** 🟢 **Ejecutable actualmente** (verificación manual).
- **Dependencia:** ninguna.
- **Automatización:** **Manual.** Los logs del servidor Next no se exponen al navegador; capturar stdout desde Playwright no es confiable. Se verifica leyendo la salida de `next dev` o los logs de Vercel. **Candidato natural a un chequeo en la revisión de código**, no a un test.

---

## 6. Estados de verificación: RNF-12 vs los `status` de Didit

RNF-12 pide **5 estados**. Didit emite **10 valores exactos, case-sensitive** (`INFORME-WEBHOOK:38`). **La tabla de mapeo no existe en ningún documento del repo.**

| Estado RNF-12 | `status` de Didit que lo producirían | Problema |
|---|---|---|
| **Pendiente de verificación** | `Not Started`, `In Progress`, `Awaiting User`, `Resubmitted` | No terminal. `Resubmitted` es un reintento → ¿reinicia el contador? (P-04) |
| **Identidad verificada** | `Approved` | Único estado que habilita, y **solo si además** hay autorización (RF-05/06) |
| **Identidad no verificada** | `Declined` | Terminal. Habilita reintento hasta el 3º |
| **Requiere revisión** | `In Review` | ⚠️ **Didit nunca lo emite con `id_lookup`.** Según `INFORME-VALIDACION…:118`, el grafo quedó en un solo nodo OCR. Solo se alcanza por el fallback manual propio |
| **Error del proveedor** | `Abandoned` ⚠️ · `Expired` ⚠️ · `Kyc Expired` ⚠️ | **Ninguno de los tres es un error del proveedor** |

### El problema, en concreto

Los 5 estados de RNF-12 **no cubren limpiamente** el ciclo de vida que emite Didit:

- `Expired` y `Kyc Expired` significan **que la sesión expiró**, no que el proveedor falló.
- `Abandoned` significa **que el usuario abandonó el flujo**, no hubo error técnico.
- No hay estado para "expirada", ni para distinguir "rechazada por DNI inexistente en RENAPER" de "rechazada por selfie que no pasa" — ambos son `Declined`.
- Sin esa distinción, el mensaje al usuario y la regla del fallback manual (que solo corresponde a indisponibilidad) **no se pueden escribir bien**: aplicar fallback sobre un "expiró" sería permitir un bypass que la decisión `[CG1]` no contemplation.

### Opciones (ninguna elegida — ver P-01)

| Opción | Qué implica |
|---|---|
| (i) Mapear los 3 a `Error del proveedor` | Simple, pero pierde el matiz y habilita fallback manual donde no corresponde |
| (ii) Agregar estados a RNF-12 | Es la solución más fiel, pero **modifica un requerimiento funcional de la Práctica 3** → decisión de Jordy |
| (iii) Guardar el `status` crudo de Didit y derivar el estado de negocio | La más flexible; suma un campo, que es territorio de Sofi |

### Minimización (RNF-06/07) — verificado

Los 5 estados de negocio solo necesitan `status` + timestamps. **No requieren guardar selfie, video de prueba de vida, plantilla biométrica ni copia de DNI.** El diseño es compatible con la política de minimización que Sofi debe definir. Confirmado además que el código actual **no persiste nada** del objeto `decision` y **no lo loguea** (RNF-04 ✓).

### Casos derivados, pendientes

Cuando P-01 esté resuelta, este análisis se convierte en **5 casos (E-01 a E-05)**, uno por estado, cada uno con su matriz de `status` de Didit de entrada. **No se los pre-crean ahora** porque su resultado esperado depende de una decisión que no es mía.

---

## 7. Decisiones funcionales PENDIENTES (Jordy)

> Conforme a la decisión D-5, estas 4 cuestiones **no se resuelven en este documento**. Se registran con su contradicción textual cuando existe.

### P-01 — Mapeo de los `status` de Didit a los 5 estados RNF-12

**Bloquea:** E-01 a E-05, parte de B-01, la regla del fallback manual.
**Por qué:** los 5 estados de RNF-12 no cubren `Expired`, `Kyc Expired` ni `Abandoned` (ver §6).
**Qué hace falta decidir:** qué pasa con la sesión expirada, con la abandonada, y si se preserva el `status` crudo.
**Quién además:** Sofi (si la opción (iii) implica un campo nuevo).

### P-02 — Quién puede realizar el fallback manual

**Bloquea:** G-01, G-02.
**Contradicción textual, verbatim:**
- `TAREAS-PENDIENTES:26` — *"se permite una validación manual comparando documentación ya registrada — pero no cualquier educador puede aprobarla, **solo un rol con más responsabilidad** (mismo criterio de roles que ya usa el resto del sistema: `Admin`/`Equipo Tecnico` vía `get_my_role()`)"*.
- `TAREAS-PENDIENTES:56` — *"`autorizado_por` … **debe ser un `Admin`/`Equipo Tecnico`**"*.
- `INFORME-VALIDACION:26` (resumen de la decisión de Jordy) — *"**solo un Admin/coordinador**"* — y lo que coordina la existencia de ese rol.

**El conflicto:** "solo Admin/coordinador" vs "`Admin`/`Equipo Tecnico`". Si `Equipo Tecnico` incluye educadores de guardia (y los incluye — ver `docs/evolucion` y el cambio del rol Educador absorbido en Equipo Técnico, commit `20260522000027`), entonces "cualquier educador no puede" y "`Equipo Tecnico` puede" **se contradicen directamente**. Hace falta una definición inequívoca de la lista de roles habilitada.
**Pregunta concreta para Jordy:** ¿el fallback manual lo habilita **solo `Admin`**, o **`Admin` + un subconjunto explícito de `Equipo Tecnico`**? Si es un subconjunto, hoy **el modelo de roles no tiene forma de expresarlo** (solo hay 2 roles) → sería un cambio de modelo, no de código.

### P-03 — Comportamiento ante `session_id` inexistente

**Bloquea:** L-01, y el diseño de la búsqueda en el webhook.
**Contexto:** hoy devuelve `200` no-op porque no hay búsqueda. Cuando exista, hay que decidir el código de respuesta. Restricción a considerar: Didit **reintenta** las entregas, así que un `404` genera reintentos indefinidos.
**Opciones:** `200` + log · `200` ignorado · `202` accepted-para-procesar · `404` (con el costo de reintentos).

### P-04 — Alcance exacto del contador de 3 intentos

**Bloquea:** F-01, parte de D-01, la semántica de `Resubmitted` en P-01.
**Contexto:** RF18 y la decisión de Jordy fijan **3 intentos**, pero no dicen **sobre qué** cuentan. La configuración de 3 intentos está en el **workflow de Didit**; el tope de negocio (que nadie pueda pedir un 4º) tiene que vivir en nuestra base, y ahí es donde falta la definición.
**Opciones:** por retiro · por tutor + retiro · por día con ventana de reintentos · por sesión de verificación.
**Impacto observable:** con "por día" el usuario espera; con "por retiro" queda bloqueado indefinidamente. Cambia la UI y el endpoint.

---

## 8. Hallazgos de documentación desactualizada

> Conforme a la decisión D-4, **no se corrigen**. Se registran acá, y en `AGENTS-WEB.md:32` corresponde incorporarlos a "Deuda conocida" cuando alguien tenga un plan aprobado.

| # | Documento y línea | Afirmación | Realidad |
|---|---|---|---|
| H-1 | `AGENTS-WEB.md:77` | "`playwright` … sin tests escritos" | Hay 4 specs (2 skippeados) y 4 más planificados |
| H-2 | `AGENTS-WEB.md:172` vs `INFORME-FALTANTES:74` | Deuda "tests" → issue **#30** | El issue de tests web es el **#9** |
| H-3 | `INFORME-VALIDACION:32` y `:76` | "audit_log no cableada, 0 triggers activos (issue #23)" | **Resuelto** por la migración `20260915182618_audit_log_real.sql`: `fn_audit_trigger()` + 27 triggers `trg_audit_*` |
| H-4 | `TAREAS-PENDIENTES:74` | Tarea de Meli: "resolver o coordinar el audit log real (issue #2, 0 triggers hoy)" | **Resuelto.** Una de las 8 tareas de Meli ya no está pendiente |
| H-5 | `INFORME-VALIDACION:50-51` y `:73` (RNF-05) | "Ninguna variable de entorno de credenciales Didit"; "RNF-05 ❌ No implementado" | Ambas existen; el webhook está implementado y deployado |
| H-6 | `TAREAS-PENDIENTES:98` | "Meli — Espera el modelo de Sofi — 8 tareas" | Sigue en pie, pero **1 de las 8** (audit log) ya no depende de Sofi |

**Consecuencia práctica:** el informe de avance dice "0% implementado" y la tabla de RNF-05 dice "no implementado". Quien lea esos documentos para planificar va a subestimar lo hecho. La realidad es: **capa de seguridad completa y deployada; capa de negocio 0%.**

---

## 9. Qué se automatiza en las siguientes etapas

### Etapa E-2 ✅ EJECUTADA (2026-09-29) — sin servidor, sin `.env.local`, sin Supabase

Un solo archivo: **`tests/unit/didit-signature.test.ts`**. Runner `node:test` (`npm run test:unit`), sin fixtures de navegador. Antes de la migración al `master` `84c4d23` este archivo se llamaba `tests/05-didit-signature.test.ts` y corría con Playwright. Cubre **K-01a** y **K-02** (y es la base de M-02 como verificación manual). Los 14 tests se implementaron según la tabla siguiente, que queda como registro de la cobertura real:

| # | Test | Caso | Estado |
|---|---|---|---|
| 1 | firma válida calculada con el mismo secreto → `true` | K-01a | ✅ |
| 2 | `timestampHeader` ausente → `false` | K-01a | ✅ |
| 3 | `signatureHeader` ausente → `false` | K-01a | ✅ |
| 4 | firma truncada (longitud distinta) → `false` | K-01a | ✅ |
| 5 | 1 carácter de la firma alterado → `true` de longitud, `false` de firma | K-01a | ✅ |
| 6 | firma calculada con otro secreto → `false` | K-01a | ✅ |
| 7 | body no parseable como JSON → `false` | K-01a | ✅ |
| 8 | claves del body en orden distinto, mismo contenido → `true` (canonicalización) | K-01a | ✅ |
| 9 | body con arrays y objetos anidados → `true` (canonicalización recursiva) | K-01a | ✅ |
| 10 | `X-Timestamp` de hace 10 minutos → `false` | K-02 | ✅ |
| 11 | `X-Timestamp` de hace 301s → `false` (borde del replay) | K-02 | ✅ |
| 12 | `X-Timestamp` de hace 299s → `true` (borde válido, lo fija) | K-02 | ✅ |
| 13 | `X-Timestamp` no numérico (`"abc"`) → `false` | K-02 | ✅ |
| 14 | `X-Timestamp` vacío (`""`) → `false` (corta en el guard `!timestampHeader` de `verify-signature.ts:28`, porque `""` es falsy; **no** llega al reloj) | K-02 | ✅ |

**Resultado:** **14 passed / 0 failed / 0 skipped.** Ver §11 para la salida exacta y los chequeos de calidad.

**Restricciones respetadas:** el secreto es una constante ficticia escrita en el archivo (`'test-secret-not-a-real-credential'`). No se lee `process.env`. No se versiona ninguna credencial. No se crea `.env`. Ningún test escribe en Supabase.

### Etapa E-3 — 🚧 parcial, BLOQUEADA por entorno — reparación de la infraestructura — ⚠️ HISTÓRICO / CANCELADA

> **⚠️ Esta etapa quedó sin objeto.** Reparaba archivos (`playwright.config.ts`, `tests/01`–`04`, reglas de `.gitignore`) que **el `master` `84c4d23` no adoptó y que ya no existen en el repositorio**. Se conserva el análisis de [§12](#12-análisis-de-la-infraestructura-de-playwright--2026-09-29) porque el conocimiento sigue vigente —el bloqueante de `proxy.ts` sin variables de Supabase, y la decisión pendiente autenticado vs anónimo—, pero **ningún ítem de esta lista es trabajo pendiente**: no hay archivos sobre los que aplicar nada. El ítem 2 (`.gitignore`) nunca llegó a commitearse y **no se traslada** al master actual.

1. ⏳ **Diferido.** Agregar `webServer` a `playwright.config.ts`. Implementable hoy, pero **no recomendable sin env**: `next dev` levantaría y cada request daría 500, convirtiendo el fallo rápido actual en timeouts de assert de 30s × 8 tests.
2. ✅ **HECHO.** Agregar `playwright-report/`, `test-results/`, `dev.log`, `test-output.txt`, `test-results-summary.txt` a `.gitignore`. Verificado con `git check-ignore -v` sobre las 5 rutas (exit 0).
3. 🚧 **BLOQUEADO por la decisión de auth** (§12.4). Son **6 asserts que fallan** — 4 en `tests/02:17,19,20,21`, 2 en `tests/03:19,20` — y su corrección depende de definir si los tests deben probar comportamiento **autenticado** o **anónimo**. El assert de `tests/04:32` **no falla** y no debe tocarse. El `const url = page.url()` muerto queda diferido.
4. ✅ **No aplica.** Import relativo en vez de alias `@/`: verificado por grep que `tests/01`–`04` **no usan `@/`**.

### Etapa E-4 — ⏳ pendiente de entorno — contrato del webhook (🟣, bloqueado por entorno)

`tests/06-didit-webhook-contract.test.ts`. Cubre **J-01**, **K-01b** y **L-01**. Requiere `NEXT_PUBLIC_SUPABASE_*` disponibles. El secreto de `DIDIT_WEBHOOK_SECRET` **siempre ficticio**. El caso del `500` (sin secreto) necesita un **proyecto de Playwright adicional** con `webServer.env` sin esa variable.

### Etapa E-5 — ⏳ pendiente del modelo de Sofi — los 4 escenarios (🟠, bloqueado por Sofi)

A-01, B-01, C-01, D-01 + D-01/F-01/G-01/G-02/H-01/H-02/L-01/M-01 + E-01 a E-05 una vez resuelto P-01. Requiere el modelo de datos cerrado y, para Cami, la UI.

**Antes de ejecutar A-01 en manual:** conseguir en el panel de Didit los **DNI de prueba válidos en RENAPER sandbox**. No están documentados en el repo y no se inventan. Sin eso, el camino feliz no se puede probar a mano.

---

## 10. Trazabilidad con `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md` § Meli

| Tarea (línea del doc) | Estado real | Qué cambió respecto del documento |
|---|---|---|
| PLAN formal (`:68`) | En curso | Este es `prompts/028` (parcial: solo la parte de QA, que es la que no depende de Sofi) |
| Route handler para crear sesión (`:69`) | ⬜ Bloqueado por Sofi | Sin dónde persistir el `session_id` |
| Webhook con lógica de negocio (`:70`) | ⬜ Bloqueado por Sofi | `TODO(Meli)` en `route.ts:41-48` |
| Endpoint de consulta de estado (`:71`) | ⬜ Bloqueado por Sofi | — |
| Verificar vínculo + autorización (`:72`) | ⬜ Bloqueado por Sofi | El concepto no existe |
| Timeout y errores (`:73`) | ⬜ **No bloqueado por Sofi para el cliente HTTP** | El wrapper con `AbortSignal` se puede escribir ya; el caso I-01 no se cierra sin el enum |
| Audit log real (`:74`) | ✅ **Resuelto** | Ver H-3/H-4. Verificado en la migración `20260915182618` |
| Tests de los 4 flujos (`:75`) | ⏳ **En curso — este documento** | 17 casos analizados; **0 ejecutables de A–D**; 3 casos ejecutables hoy en la capa de seguridad, de los cuales **2 ya se ejecutaron** en E-2 (K-01a, K-02) |

**Balance:** de 8 tareas, **1 resuelta** (audit log), **1 en curso sin bloqueos** (timeout: el cliente), **1 en curso parcialmente bloqueada** (tests), **5 bloqueadas por Sofi**.

---

## 11. Registro de ejecución (E-2 · 2026-09-29)

### Resultado

| Ítem | Valor |
|---|---|
| Etapa | **E-2 — COMPLETADA** |
| Artefacto | `tests/unit/didit-signature.test.ts` — **creado** (migrado el 2026-10-05 desde `tests/05-didit-signature.test.ts`, que ya no existe) |
| Tests implementados | **14** (9 de K-01a + 5 de K-02) |
| Resultado | **14 passed / 0 failed / 0 skipped** |
| Casos que cierra | ✅ **K-01a** (nivel función) · ✅ **K-02** |

### Ejecución repetida 3 veces

Estabilidad confirmada para descartar flakiness, especialmente en el caso sensible al reloj (K-02.3):

```
corrida 1:  14 passed (1.4s)
corrida 2:  14 passed (1.1s)
corrida 3:  14 passed (1.0s)
```

### Chequeos de calidad

| Chequeo | Resultado |
|---|---|
| `npm run test:unit` | ✅ **21/21** (14 de Didit + 7 de SENAF), ruta vigente tras la migración |
| `npx eslint tests/unit/didit-signature.test.ts` | ✅ **pasa** — **0 errores** |
| `npx tsc --noEmit` | ✅ **pasa** (exit 0) |
| `npm run build` | ✅ **pasa** (exit 0) |
| `npm run lint` (global) | ❌ **NO pasa** |

### ⚠️ Lint global: falla por errores preexistentes, no por E-2

El criterio de aceptación del plan (`prompts/028`, CA-2) decía que `npm run lint` debía "seguir en verde". **Ese criterio era insatisfacible desde el inicio**: el baseline del repositorio ya tenía **85 errores** antes de que E-2 empezara, todos en código de la app.

Desglose de los 85:

| Regla | Cantidad |
|---|---|
| `@typescript-eslint/no-explicit-any` | 81 |
| `react/no-unescaped-entities` | 2 |
| `@typescript-eslint/no-empty-object-type` | 1 |
| `useForm<AudienciaFormValues>` | 1 |
| `render` | 1 |

- **`tests/unit/didit-signature.test.ts` introduce 0 errores.** Verificado corriendo ESLint sobre el archivo aislado: exit 0.
- **No se corrigieron.** Quedan fuera del alcance de Meli/E-2, y `AGENTS-WEB.md:86` prohíbe refactors no relacionados que no fueron solicitados. Se registran como **deuda preexistente** (R-11 en el plan) para que se decida por separado.

### Cobertura alcanzada

- **K-01a ✅** — los 5 items de *Pasos* están cubiertos, más 4 casos extra que cierran bordes reales: body no-JSON (`verify-signature.ts:40-42`), canonicalización con orden de claves distinto, canonicalización recursiva con arrays/objetos anidados, y el caso de la firma válida (que impide que la suite pase en vacío).
- **K-02 ✅** — las 5 variantes de *Pasos* están cubiertas, incluido el borde de 299s que fija la ventana de 300s.

**Verificación anti-vacío:** la suite es bidireccional — 4 tests esperan `true` y 10 esperan `false`. Una implementación que devolviera siempre `false` rompería 4 tests; una que devolviera siempre `true` rompería 10. Solo pasa si `verifyDiditSignature` discrimina de verdad. Además, si el import estuviera roto, los tests que esperan `false` lanzarían una excepción en lugar de devolver `false`.

### Modificaciones NO realizadas (fuera de alcance)

No se tocó `lib/didit/verify-signature.ts`, `app/api/didit/webhook/route.ts`, `playwright.config.ts` ni los tests `01`–`04`. Sin migraciones, sin schema, sin RLS, sin `SUPABASE_SERVICE_ROLE_KEY`, sin dependencias nuevas, sin `.env`, **sin commit y sin push**.

### Qué sigue pendiente

| Etapa | Estado | Motivo |
|---|---|---|
| E-3 | 🚧 **Parcial — bloqueada por entorno** | Ver §12. Solo `.gitignore` quedó hecho |
| E-4 | ⏳ Pendiente de entorno | Requiere `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ver §2.2) |
| E-5 | ⏳ Pendiente del modelo de Sofi | Requiere tabla `retiros` y tabla de sesiones de verificación, que no existen |

**M-02** (logs sin biometría) sigue siendo 🟢 pero **manual**, y **no se ejecutó** en E-2: es la base para una verificación manual de logs de servidor, no un test automatizado.

---

## 12. Análisis de la infraestructura de Playwright (2026-09-29) — ⚠️ HISTÓRICO

> **⚠️ Sección histórica. Analiza `playwright.config.ts` y `tests/01`–`04`, que ya no existen en el `master` `84c4d23`.** Se conserva porque **sus hallazgos son conocimiento vigente sobre el comportamiento de la aplicación** y no dependen de esos archivos:
>
> - **§12.1 — el bloqueante raíz.** Sin `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `proxy.ts:7` lanza y **toda ruta del matcher devuelve 500**: no hay ninguna página alcanzable. Esto **sigue siendo cierto hoy** y es el bloqueante de cualquier E2E futuro. No es un problema del webhook de Didit: afecta a toda la aplicación.
> - **La decisión funcional pendiente** sobre si los E2E deben probar comportamiento autenticado o anónimo (§12.4) **sigue sin tomar**. Si algún día se retoma el E2E, esta es la primera decisión a tomar.
> - **La lección metodológica** —un test que pasa por el motivo equivocado es peor que un test rojo honesto— es general y trasciende a estos archivos.
>
> Lo que **caduca** es la parte que identifica archivos, líneas y asserts concretos (`tests/02:17,19,20,21`, `tests/03:19,20`, `tests/04:32`, el conteo de 8 tests con `ERR_CONNECTION_REFUSED`). Esos números no son accionables porque los specs no se trasladaron al master.

Pregunta que origina esta sección: **¿se puede avanzar con E-3 sin `NEXT_PUBLIC_SUPABASE_URL` ni `NEXT_PUBLIC_SUPABASE_ANON_KEY`?**

Método: análisis estático del código (no ejecución de la app) más dos verificaciones read-only (`git check-ignore -v`, grep sobre `tests/`). No se modificó nada salvo `.gitignore`.

### 12.1 El hecho bloqueante

`proxy.ts:7` llama `createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, ...)`. Ese constructor **lanza sincrónicamente** si falta la URL o la key, y el matcher de `proxy.ts:52-55` cubre toda ruta salvo assets estáticos.

→ Sin las dos variables, **`/`, `/login` y `/dashboard` devuelven HTTP 500**. No hay ninguna página alcanzable. Por eso los **8 tests no-skippeados de `tests/01`–`04` son todos verificables únicamente con esas variables**.

Esto amplía lo que decía el hallazgo R-3 del plan, que lo describía como un problema exclusivo del webhook. **No lo es: afecta a toda la aplicación.**

### 12.2 Qué ven realmente los asserts

Sin sesión, `proxy.ts:37-40` redirige **cualquier** ruta que no sea `/login` hacia `/login`. Es decir: **`/dashboard` nunca renderiza**, y los tests de `03` (y parte de `04`) están midiendo la página de login.

Texto realmente presente en `/login`: `app/(auth)/layout.tsx` y `app/layout.tsx` no agregan texto visible; `app/(auth)/login/page.tsx:8,10` aportan `"Argüello Infancias"` y `"Sistema de Gestión Residencia NNyA"`, más el `LoginForm` (Email / Contraseña / Ingresar). **El sidebar no existe ahí**: los labels `"Inicio"`, `"NNyA"`, `"Legajos"`, `"Tutores"`, `"Referentes"` viven en `app/(dashboard)/layout.tsx:17-23` (`NAV_ALL`) y solo se renderizan con sesión y rol.

| Assert | Espera | ¿Está? | Veredicto |
|---|---|---|---|
| `01:9` | `/` → `/login` | ✅ `app/page.tsx:4` + `proxy.ts:40` | pasa |
| `01:17,19` | `/login`, `form` visible | ✅ | pasa |
| `02:8` | `/dashboard` → `/login` | ✅ `proxy.ts:40` | pasa |
| `02:15` | `form` visible | ✅ | pasa |
| `02:17` | `Inicio` | ❌ | **FALLA** |
| `02:18` | `NNyA` | ✅ (de `"Residencia NNyA"`) | pasa |
| `02:19` | `Legajos` | ❌ | **FALLA** |
| `02:20` | `Tutores` | ❌ | **FALLA** |
| `02:21` | `Referentes` | ❌ | **FALLA** |
| `03:10` | `/dashboard` ≠ `/not-found` | ✅ (es `/login`) | pasa, pero **vacuo** |
| `03:17` | `Residencia` | ✅ | pasa |
| `03:18` | `NNyA` | ✅ | pasa |
| `03:19` | `Legajos` | ❌ | **FALLA** |
| `03:20` | `Alertas` | ❌ | **FALLA** |
| `04:22,24` | `/login`, `form` visible | ✅ | pasa |
| `04:32` | `Argüello Infancias` en `/dashboard` | ✅ **está en `login/page.tsx:8`** | **pasa — por el motivo equivocado** |

### 12.3 Corrección del conteo de asserts

Este documento y el plan informaban **"3 asserts incorrectos"**. **Es incorrecto.** El número real es **6 asserts que fallan**:

- **4 en `tests/02-nav-roles.test.ts`**: líneas **17** (`Inicio`), **19** (`Legajos`), **20** (`Tutores`), **21** (`Referentes`).
- **2 en `tests/03-dashboard-kpis.test.ts`**: líneas **19** (`Legajos`), **20** (`Alertas`).

**`tests/04-auth-flow.test.ts:32` NO falla**, y esta es la corrección más importante:

- `/dashboard` redirige a `/login` (sin sesión, vía `proxy.ts:37-40`).
- `"Argüello Infancias"` **existe** en la página de login: `app/(auth)/login/page.tsx:8` (`<CardTitle>`).
- Por lo tanto el assert **pasa hoy**, pero valida el título de la página de login, no el layout del dashboard que el nombre del test (`layout del dashboard contiene elementos de auth`) dice verificar.

**No se lo corrige:** hacerlo lo empeoraría, cementando un test engañoso que "pasa" por un motivo que no es el que declara.

**Nota adicional:** el comentario de `tests/02-nav-roles.test.ts:7` atribuye el redirect a `AccessGuard`. Es incorrecto — el redirect anónimo lo produce `proxy.ts:37-40`. `components/shared/AccessGuard.tsx` es un componente client de render por rol y no participa del redirect. Comentario registrado como hallazgo (R-13 en el plan); no corregido porque tocar `tests/` excede el alcance de esta sesión.

### 12.4 🔴 DECISIÓN PENDIENTE — ¿autenticado o anónimo?

**No corresponde modificar los asserts de `tests/02` ni de `tests/03` hasta que se defina esto.**

| Opción | Qué implica |
|---|---|
| **Autenticado** | Los tests necesitan un usuario de Supabase con rol → requiere **entorno** (vars de Supabase) **y Sofi** (crear el usuario). Es la opción que realmente valida el sidebar y los KPIs |
| **Anónimo** | Los tests deben dejar de esperar contenido del dashboard y verificar el redirect. `tests/03` deja de ser un test de dashboard: es una **reescritura**, no una corrección |

**Por qué no se aplica el arreglo "obvío":** apuntar los asserts al texto real de la página de login los haría pasar, pero fijaría comportamiento que no es el que declaran probar, y dejaría `tests/03` con un nombre que miente. Un test verde que valida lo contrario de lo que dice es peor que un test rojo honesto.

### 12.5 Estado de los 4 ítems de E-3

| Clasificación | Ítem | Detalle |
|---|---|---|
| ✅ **IMPLEMENTABLE Y VERIFICABLE AHORA** | 2. `.gitignore` | **HECHO 2026-09-29.** Verificable al 100% sin env ni navegador, con `git check-ignore -v`. Riesgo cero: `.gitignore:39` ya cubre `.env*` y `:56-57` ya tiene `*.sql` con su excepción. Único ítem cerrable por completo hoy |
| ⚠️ **IMPLEMENTABLE, VERIFICABLE PARCIALMENTE** | 1. `webServer` | Se puede escribir (es config, no app). Verificable parcialmente: se comprueba que Playwright levanta el server en vez de dar `ERR_CONNECTION_REFUSED`. **No** es verificable que algún test pase. **Efecto adverso:** con `webServer` pero sin env, `next dev` arranca, cada request da 500 y los 8 tests mueren por timeout de assert (30s c/u con `fullyParallel: true`) → varios minutos de ruido inútil. Es un modo de fallo **peor**, no mejor. **No recomendado hasta tener env** |
| 🚧 **BLOQUEADO POR DECISIÓN** | 3. Los 6 asserts de 02/03 | Ver §12.4. **No se tocan** |
| 🔹 **NO-OP** | 4. Import relativo en vez de `@/` | Verificado por grep: `tests/01`–`04` **no tienen ningún import de `@/`**, solo importan de `@playwright/test`. La precaución ya quedó aplicada en E-2 con el archivo de firma, que importa `../../lib/didit/verify-signature.ts`. Con la migración a `node:test` esto pasó a ser **obligatorio**, no opcional: el type-stripping nativo no resuelve el alias `@/`, y por eso el import lleva extensión `.ts` (`allowImportingTsExtensions`) |
| 🔹 **DIFERIDO** | 3b. Los 3 `const url = page.url()` muertos | Sin riesgo, pero su único efecto observable son *warnings* de `@typescript-eslint/no-unused-vars`, y el lint global ya está rojo con 85 errores preexistentes, así que no es demostrable |

### 12.6 Atajo evaluado y descartado

Se evaluó **fabricar variables de Supabase falsas** vía `webServer.env` (sin `.env`) para destrabar los tests sin proyecto real. **Descartado:**

1. Implica escribir una URL y una key ficticias en un archivo versionado, lo que choca con la regla de no versionar credenciales y crea un precedente que después hay que distinguir de las reales.
2. Aun si funcionara, solo destrabaría los tests de redirect: los 6 asserts de contenido de sidebar seguirían fallando porque necesitan una sesión real con rol.

No es un atajo, es una vía muerta parcial. **No verificado empíricamente**, así que no se afirma que sea imposible: se afirma que **no se recomienda**.

### 12.7 Conclusión

**E-3 no puede completarse ni verificarse** sin las variables de Supabase. Lo único cerrable hoy era `.gitignore`, y quedó hecho y verificado. El resto requiere entorno y, en el caso de los asserts, una decisión funcional previa.

---

## Anexo — Trazabilidad de los 5 estados contra este documento

| Estado RNF-12 | Caso que lo cubrirá | Estado |
|---|---|---|
| Pendiente de verificación | E-01 | ⏳ No creado — depende de P-01 |
| Identidad verificada | E-02 + A-01 | ⏳ No creado — depende de P-01 |
| Identidad no verificada | E-03 + B-01 | ⏳ No creado — depende de P-01 |
| Requiere revisión | E-04 + G-01/G-02 | ⏳ No creado — depende de P-01 y P-02 |
| Error del proveedor | E-05 + D-01 | ⏳ No creado — depende de P-01 |
