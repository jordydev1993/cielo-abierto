# 030 — QA, testing e integraciones backend (Meli)

**Estado:** Una etapa cerrada (E-2), dos bloqueadas. E-3 quedó **sin objeto** al migrar al master.
**Fecha del relevamiento:** 2026-09-29 · rama `master` · HEAD `b4ab8e3`
**Migrado a:** 2026-10-05 · rama `master` · HEAD **`84c4d23`**
**Alcance:** QA/testing de los flujos del sistema y preparación/verificación de la integración backend de Didit, sin modificar datos reales ni avanzar sobre funcionalidades bloqueadas por dependencias externas.

> Regla de honestidad de este documento (misma que `AGENTS-WEB.md:3`): lo que está implementado se verificó leyendo el código; lo que no existe se declara inexistente. Por esa regla, este documento **declara explícitamente que Playwright no es parte de la infraestructura actual del proyecto** — ver el aviso de vigencia más abajo. La capa de seguridad del webhook de Didit (`app/api/didit/webhook/route.ts`, `lib/didit/verify-signature.ts`, `lib/validations/didit-webhook.schema.ts`, la excepción en `proxy.ts:35`) y el audit log (`prompts/018`) son **preexistentes y ajenos a esta parte**: acá se los verifica, no se los implementa.

Documentos relacionados: `prompts/030-qa-didit-retiro.md` (plan de QA) y `docs/testingManual/QA-DIDIT-RETIRO.md` (matriz de 17 casos).

---

> ## ⚠️ Vigencia de este documento tras la migración al `master` `84c4d23` (2026-10-05)
>
> **Este documento se relevó sobre `b4ab8e3`. Su base actual es `84c4d23`.** El master **no adoptó** la infraestructura de Playwright que el relevamiento asumía. Antes de leer cualquier sección, tener en cuenta:
>
> | Relevado sobre `b4ab8e3` | Realidad en `master` `84c4d23` |
> |---|---|
> | `playwright.config.ts` (17 líneas), sin `webServer` | **No existe.** |
> | `tests/01`–`04` (4 specs, 10 tests, 2 skippeados) | **No existen.** Los specs E2E no se trasladaron. |
> | `tests/05-didit-signature.test.ts`, runner Playwright | **`tests/unit/didit-signature.test.ts`**, runner `node:test` |
> | `@playwright/test` en `dependencies` | **No está en ninguna sección.** No se agregó `@playwright/test`. |
> | Scripts `test` / `test:e2e` / `test:ui` | **No existen.** El único script de test del master es `test:unit`. |
> | `.gitignore` con 5 reglas de testing agregadas | **No se trasladaron.** El bloque `# testing` del master tiene solo `/coverage`. |
> | E-3 "parcial, `.gitignore` hecho" | **Sin objeto**: reparaba archivos que no existen en el master. |
> | R-1, R-2, R-5, R-13 (sobre asserts, `webServer`, ignores) | **Caducan** como acciones: los archivos ya no están. Se conservan como registro. |
>
> **✅ Playwright NO es infraestructura implementada por esta parte.** Nunca se commiteó, y el master actual no lo usa. Todo lo que este documento dice sobre Playwright describe un estado que **fue dejado atrás**.
>
> **Lo que sí sobrevive y sigue vigente** (no depende de los archivos):
> - **R-3 / el bloqueante raíz de `proxy.ts`.** Sin `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `proxy.ts:7` lanza y **toda ruta devuelve 500**. Bloqueante de cualquier E2E futuro. No es un problema del webhook: afecta a toda la app.
> - **R-a — el falso positivo de `tests/04:32`.** Ese test pasaba porque `"Argüello Infancias"` existe en la página de login, no porque existiera el layout del dashboard que su nombre declara. **Un test verde que valida lo contrario de lo que dice es peor que un test rojo honesto.** Lección general, aplicable a cualquier suite futura.
> - **R-b — `tests/02:7` atribuía el redirect a `AccessGuard`.** Incorrecto: el redirect anónimo lo produce `proxy.ts:37-40`; `AccessGuard` es un componente client de render por rol. Conocimiento sobre la app, no sobre el spec.
> - **R-12 — la decisión autenticado vs anónimo sigue sin tomar.** Es la primera decisión a tomar si algún día se retoma el E2E.
> - **R-11 — el baseline de lint.** El repo ya traía **85 errores** (81 `no-explicit-any`, 2 `react/no-unescaped-entities`, 1 `@typescript-eslint/no-empty-object-type`, 1 `useForm`, 1 `render`), todos en código de la app. **Deuda preexistente, ajena a esta parte, no se corrige** (`AGENTS-WEB.md:86` prohíbe refactors no relacionados). Los tests de firma aportan 0.
>
> **🔶 Deuda preexistente del proyecto, NO trabajo pendiente de esta parte.** `TAREAS-WEB.md:48` dice que `playwright.config.ts` "ya debería estar, confirmar". En el master actual **ese archivo no existe**. Es una inconsistencia de documentación del proyecto, anterior a este trabajo y ajena a él: **no se modificó `TAREAS-WEB.md`**. Se señala acá para que el equipo la resuelva si quiere.

---

## Objetivo

Validar mediante QA/testing los flujos del sistema y preparar/verificar la integración backend de Didit, sin modificar datos reales ni avanzar sobre funcionalidades bloqueadas por otras dependencias.

En concreto, esta parte cubre tres cosas y ninguna más:

1. **Definir la estrategia de QA** del flujo de retiro de NNyA con validación de identidad vía Didit, separando explícitamente lo que es ejecutable hoy de lo que está bloqueado por el modelo de datos de Sofi o por decisiones funcionales de Jordy.
2. **Ejecutar la verificación automatizada de la capa de seguridad** que sí es testeable en las condiciones actuales del repo: la función de verificación de firma y la ventana anti-replay.
3. **Analizar la infraestructura de testing existente** (`tests/01`–`04`, `playwright.config.ts`) para determinar qué se puede verificar sin entorno y qué está genuinamente bloqueado.

Lo que **no** cubre: escribir la lógica de negocio del webhook, definir el modelo de datos, modificar Supabase, resolver decisiones funcionales pendientes ni construir la UI de retiro.

---

## Contexto y arquitectura confirmada

Toda la información de esta sección está confirmada por lectura directa del código en este checkout.

### Stack relevante

- **Next.js 16 App Router**, route groups `(auth)` y `(dashboard)`. `proxy.ts` (56 líneas) es el middleware — Next 16 renombró `middleware.ts` a `proxy.ts`.
- **Supabase** vía `@supabase/ssr` / `@supabase/supabase-js`, con RLS activo en las 28 tablas de `public`.
- **Playwright** como runner de tests. `playwright.config.ts` (17 líneas) y `tests/01`–`05`.
- **zod 4** para los schemas de validación.

### La función testeable: `verifyDiditSignature`

`lib/didit/verify-signature.ts` (52 líneas) es una **función pura**. Verificado línea por línea: no lee `process.env` (el secreto entra como parámetro), no importa Supabase, no hace red y no toca base de datos.

Por eso es el único activo del feature testeable sin servidor, sin `.env` y sin conexión a Supabase. Su cadena de guards es: headers ausentes → `false`; `Number.isFinite` sobre el timestamp → `false`; `Math.abs(now - ts) > 300` → `false`; `JSON.parse` del body → `false` en catch; canonicalización recursiva; HMAC-SHA256 en hex; pre-check de longitud de buffer; `timingSafeEqual`.

### El endpoint: `/api/didit/webhook`

`app/api/didit/webhook/route.ts` (51 líneas) orquesta: guard de secreto → `500`; lectura del body crudo; verificación de firma → `401`; parseo JSON → `400`; validación contra `diditWebhookSchema` → `400`; `webhook_type !== 'status.updated'` → `200` sin procesar; log de `session_id` + `status` solamente; y después, `route.ts:41-48`, un bloque `// TODO(Meli):` con tres pasos de lógica de negocio que **no están escritos**.

El envelope se valida con `lib/validations/didit-webhook.schema.ts` (16 líneas), donde `environment` es `z.enum(['live', 'sandbox'])`.

El webhook está exento del redirect de middleware en `proxy.ts:35` (`isDiditWebhook`). Sin esa excepción, el middleware lo mandaría a `/login`.

### `proxy.ts` y el bloqueo de entorno

`proxy.ts:7` llama `createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, ...)`. Ese constructor **lanza sincrónicamente** si falta la URL o la key, y el matcher de `proxy.ts:52-55` cubre toda ruta salvo assets estáticos.

Consecuencia verificada: sin esas dos variables, `next dev` **arranca** pero **toda** request que matchea el matcher —incluida `/api/didit/webhook`— devuelve `500` antes de llegar a la ruta. Este checkout **no tiene ningún archivo `.env*`**.

La segunda mitad de `proxy.ts` (`proxy.ts:37-40`) redirige a `/login` cualquier ruta distinta de `/login` cuando no hay usuario. Sin sesión, `/dashboard` nunca renderiza.

### Infraestructura de testing — ⚠️ estado verificado sobre `b4ab8e3` (ya NO vigente)

> **⚠️ La tabla siguiente describe `b4ab8e3`. En el `master` `84c4d23` no hay `playwright.config.ts` ni `tests/01`–`04`.** Se conserva como registro del relevamiento.

| Pieza | Estado verificado en `b4ab8e3` |
|---|---|
| `playwright.config.ts` | 17 líneas. `testDir: './tests'`, `baseURL: http://localhost:3000`, `timeout: 30000`, `expect.timeout: 5000`, `fullyParallel: true`, reporter `list` + `html` a `playwright-report/`. **No tiene `webServer`.** No define `projects`. **No se trasladó al master.** |
| `tests/01`–`04` | 4 specs, 10 tests en total, **2 skippeados**. 8 no-skippeados. **No se trasladaron al master.** |
| `tests/05-didit-signature.test.ts` | 14 tests de función pura, sin fixtures de navegador. **Migrado a `tests/unit/didit-signature.test.ts` con `node:test` (2026-10-05).** |
| Resultado registrado de `01`–`04` | `test-results-summary.txt`: los 8 tests no-skippeados fallaban con `net::ERR_CONNECTION_REFUSED` |
| `AGENTS-WEB.md:77` | Afirma "`playwright` está en devDependencies pero sin tests escritos" — **desactualizado**: hay tests. Registrado como hallazgo, no corregido |
| `tsconfig.json` | **CÁMBIÓ en el master:** ya **no** excluye `tests` del type-check. El master activó `allowImportingTsExtensions`, y `tests/unit/` **sí se typechequea** con `npx tsc --noEmit` |
| **Vigente en `84c4d23`** | `tests/unit/senaf.test.ts` (7 tests, `node:test`) y `tests/unit/didit-signature.test.ts` (14 tests). Script único: `npm run test:unit`. Sin framework de E2E. |

---

## Archivos y documentación inspeccionados

### Documentos

| Archivo | Líneas | Qué se tomó de ahí |
|---|---|---|
| `prompts/030-qa-didit-retiro.md` | 425 | Plan de QA, decisiones D-1..D-5, hallazgos R-1..R-13, análisis de viabilidad de E-3 |
| `docs/testingManual/QA-DIDIT-RETIRO.md` | 703 | Matriz de 17 casos con sus 10 campos, leyenda de clasificación, análisis §12 de la infraestructura |
| `PLAN-INTEGRACION-INNOVACIONES.md` | 159 | §3 — asignación de "QA/testing + integraciones backend" dentro de las 8 innovaciones; confirma el rol y las dependencias |
| `AGENTS-WEB.md` | 215 | Arquitectura, stack, prohibiciones (`:79` sin dependencias nuevas, `:86` sin refactors no relacionados), Deuda conocida, § Seguridad |
| `test-results-summary.txt` | — | Salida real de la corrida de `tests/01`–`04` (`net::ERR_CONNECTION_REFUSED`, 2 skippeados) |

### Código

| Archivo | Estado |
|---|---|
| `tests/unit/didit-signature.test.ts` | **Vigente.** Creado en E-2 y migrado a `node:test` el 2026-10-05. 14 tests de función pura |
| `tests/unit/senaf.test.ts` | **Vigente en el master** (`84c4d23`). Ajeno a esta parte |
| `tests/04-auth-flow.test.ts` | ⚠️ Ya no existe. Relevado en E-2: 1 `describe.skip` + 2 describes con asserts. La línea 32 es el **falso positivo R-a** |
| `tests/03-dashboard-kpis.test.ts` | ⚠️ Ya no existe. Relevado en E-2: 2 tests, 5 asserts (2 fallaban de verdad) |
| `tests/02-nav-roles.test.ts` | ⚠️ Ya no existe. Relevado en E-2: 2 tests, 6 asserts (4 fallaban de verdad) |
| `tests/01-home-login.test.ts` | ⚠️ Ya no existe. Relevado en E-2: 2 tests, 3 asserts |
| `playwright.config.ts` | ⚠️ Ya no existe. Relevado en E-2: 17 líneas, sin `webServer`. No se trasladó |
| `.gitignore` | ⚠️ Las 5 reglas de testing de E-3 **no se trasladaron**. El master conserva solo `/coverage` |
| `app/api/didit/webhook/route.ts` | 51 | Leído completo |
| `lib/didit/verify-signature.ts` | 52 | Leído completo, línea por línea |
| `lib/validations/didit-webhook.schema.ts` | 16 | Leído completo |
| `proxy.ts` | 56 | Leído completo |

No se leyeron ni modificaron: `supabase/`, migraciones, `package.json`, `tsconfig.json`, `app/`, `components/`, `hooks/`, `context/`, `types/`.

---

## Estado actual por funcionalidad

| Funcionalidad | Estado confirmado en código | Brecha frente al pedido |
|---|---|---|
| **1. Infraestructura Playwright** | `playwright.config.ts` existe y es coherente (`testDir`, `baseURL`, `timeout`, reporter), pero **no define `webServer`**. Sin él, los 8 tests no-skippeados de `01`–`04` fallan con `net::ERR_CONNECTION_REFUSED` (verificado en `test-results-summary.txt`) | Falta `webServer` y faltan `projects`. Agregar `webServer` **sin** `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` empeora el modo de fallo: `next dev` levanta, cada request da 500 en `proxy.ts:7` y los 8 tests mueren por timeout de assert (30s c/u con `fullyParallel: true`). Hoy el fallo es rápido y legible; con `webServer` serían minutos de ruido |
| **2. Tests E2E existentes** | 4 specs, 10 tests, 2 skippeados. Leídos completos. Con servidor levantado fallan **6 asserts de verdad**: 4 en `tests/02-nav-roles.test.ts:17,19,20,21` (`Inicio`, `Legajos`, `Tutores`, `Referentes`) y 2 en `tests/03-dashboard-kpis.test.ts:19,20` (`Legajos`, `Alertas`). Esos labels viven en `app/(dashboard)/layout.tsx` y solo se renderizan **con sesión y rol** | Los asserts esperan contenido del sidebar sin tener sesión. Falta definir si `tests/02` y `tests/03` deben probar comportamiento **autenticado** o **anónimo**. Con la decisión tomada, `tests/03` deja de ser un test de dashboard y pasa a ser una reescritura, no una corrección |
| **3. Seguridad de firma del webhook Didit** | `lib/didit/verify-signature.ts` completa: guards de headers, `Number.isFinite` del timestamp, canonicalización recursiva, HMAC-SHA256 hex, pre-check de longitud, `timingSafeEqual`. `route.ts:6-9,15-18` la orquesta. **Capa preexistente y deployada** (`prompts/016`, commit `ed6de39`) — no es trabajo de esta parte | El nivel **función** está verificado con 14 tests. El nivel **endpoint** no: los `401`, las cero escrituras y el cero log como evento válido siguen sin comprobar (caso K-01b) |
| **4. Prevención de replay** | Ventana de 300s en `verify-signature.ts:34` (`Math.abs(nowSeconds - timestamp) > 300`). Verificada en el borde en ambos sentidos: 301s → `false` (K-02.2), 299s → `true` (K-02.3) | El borde de 299s es sensible a **±1s**: si el event loop se demorara 2s entre que el test calcula el timestamp y que la función lee `Date.now()`, el caso falla. Observación documentada dentro del propio test. Si llegara a fallar, el arreglo es subir el número a 290, **nunca** tocar la implementación |
| **5. Contrato del webhook Didit** | El comportamiento está implementado y es correcto: sin secreto → `500`; firma inválida → `401`; body no-JSON → `400`; fuera de schema → `400`; `webhook_type ≠ status.updated` → `200` sin procesar. Loguea solo `session_id` + `status` (RNF-04) | **0 tests.** J-01, K-01b y L-01 sin cubrir. Bloqueado por entorno: los tests necesitan el servidor de Next, y el servidor necesita las variables de Supabase. Además, el caso del `500` sin secreto requiere un proyecto de Playwright adicional con `webServer.env` sin esa variable |
| **6. Flujo funcional de retiro / autorización** | **No existe.** `route.ts:41-48` es un `// TODO(Meli):` con tres pasos. No hay tabla `retiros`, ni tabla de sesiones de verificación Didit, ni campo "autorizado a retirar" (`nnya_tutores` solo tiene `es_principal`, `clean_schema.sql:78-85`). Verificado sobre las 38 migraciones: `grep` de `retiro\|didit\|sesiones` sobre `supabase/` → 0 resultados | Brecha total. Depende del modelo de datos de Sofi y de las decisiones funcionales P-01 a P-04 de Jordy. No es un problema de código: escribir la lógica sin modelo sería inventar comportamiento |
| **7. Escenarios funcionales A–D** | Especificados con precondiciones, pasos y resultado esperado en `QA-DIDIT-RETIRO.md`. **0 de 4 son ejecutables hoy** (A-01, B-01, C-01, D-01) | Bloqueados por el modelo de datos. Aparte: el widget de Didit usa cámara y no tiene modo headless documentado → el E2E real es semi-manual. Y los **DNI de prueba válidos en RENAPER sandbox no están documentados en el repo**: sin eso, ni siquiera el camino feliz se puede probar a mano |

---

## Trabajo realizado

### 1. Planificación de QA para Didit

**Qué se entregó:** `docs/testingManual/QA-DIDIT-RETIRO.md` con una **matriz de 17 casos**, cada uno con los 10 campos pedidos: ID, objetivo, precondiciones, datos necesarios, pasos, resultado esperado, prioridad, estado, dependencia y automatización.

**Por qué una matriz y no una lista de tests:** con A–D bloqueados por el modelo de datos, el aporte de QA no puede ser "tests escritos", sino dejar escrito *qué tiene que ser cierto* para que la funcionalidad se pueda considerar verificada. La matriz separa explícitamente la especificación de la ejecución, y permite auditar contra ella más adelante.

**Los 17 casos:** A-01, B-01, C-01, D-01 (los 4 escenarios funcionales) · F-01, F-02 (intentos) · G-01, G-02 (fallback manual) · H-01, H-02 (autorización) · I-01 (timeout) · J-01 (payload firmado inválido) · K-01 (firma, dividido en K-01a función / K-01b endpoint) · K-02 (replay) · L-01 (`session_id` inexistente) · M-01 (idempotencia) · M-02 (logs sin biometría).

**Clasificación por bloqueante** — cada caso está en exactamente una categoría:

| Categoría | Casos | Qué implica |
|---|---|---|
| 🟢 Ejecutable actualmente | K-01a, K-02, M-02 | Se puede escribir y correr hoy sin servidor, sin `.env.local`, sin Supabase |
| 🟣 Pendiente de entorno | J-01, K-01b | No necesitan el modelo ni una decisión, pero necesitan que el servidor de Next levante → variables de Supabase |
| 🔴 Bloqueado por decisión funcional (Jordy) | F-02, G-01, L-01 | Escribir el test sin la decisión sería inventar comportamiento |
| 🟠 Bloqueado por Sofi (modelo de datos) | A-01, B-01, C-01, D-01, F-01, G-02, H-01, H-02, I-01, M-01 | No es testeable por más que se quiera escribir el test |

**Lo que el análisis dejó escrito y sigue abierto:** el mapeo de los 10 valores `status` de Didit contra los 5 estados de RNF-12 no existe en ningún documento del repo, y no cubre limpiamente `Expired`, `Kyc Expired` ni `Abandoned`. Se documentaron tres opciones sin elegir ninguna, porque elegirla es decisión de producto (P-01), y de ella dependen los 5 casos derivados E-01 a E-05.

**Decisiones de trabajo tomadas y respetadas:** sin producción · sin `.env.local` con credenciales reales · Playwright como único runner, sin dependencias nuevas · se permite un secreto Didit **ficticio** solo dentro del entorno de testing · no se corrigen los documentos desactualizados, se registran como hallazgo · las decisiones funcionales de Jordy quedan documentadas como pendientes, no resueltas.

### 2. Testing automatizado de firma Didit — etapa E-2

**Qué se implementó:** 14 tests de **función pura** en `tests/unit/didit-signature.test.ts`: sin fixtures de navegador, sin servidor, sin `.env.local`, sin conexión a Supabase. (Creado originalmente como `tests/05-didit-signature.test.ts` bajo Playwright; migrado a `node:test` el 2026-10-05 al Adoptar el master `84c4d23`.)

| Métrica | Valor |
|---|---|
| Tests implementados | **14** |
| Distribución | **9 casos K-01a** + **5 casos K-02** |
| Resultado | **14 passed / 0 failed / 0 skipped** |
| Casos cerrados | K-01a (firma) · K-02 (anti-replay) |

**Estabilidad — tres ejecuciones consecutivas registradas:**

```
corrida 1:  14 passed (1.4s)
corrida 2:  14 passed (1.1s)
corrida 3:  14 passed (1.0s)
```

Re-verificado al armar este documento: `14 passed (1.3s)`. La variación de duración es esperable; el resultado no.

**Qué se verificó, y por qué no es un log.** Los 14 tests no son 14 repeticiones: cada uno aísla una variable distinta de la cadena de guards.

*Firma (K-01a) — que no se acepte un webhook sin firma auténtica:*

- **Firma válida** calculada con el mismo secreto → `true`. Existe para que la suite no pueda pasar en vacío: sin un caso que espera aceptación, una implementación que devolviera siempre `false` rompería la mitad de la suite.
- **`X-Timestamp` ausente** → `false`.
- **`X-Signature-V2` ausente** → `false`.
- **Firma truncada** (62 caracteres hex en lugar de 64) → `false`. Cubre el pre-check de longitud de `verify-signature.ts:49`, que evita que `timingSafeEqual` lance sobre buffers de tamaños distintos.
- **Firma con 1 carácter alterado**, de longitud correcta → `false`. El pre-check pasa y el fallo ocurre donde tiene que ocurrir, en la comparación.
- **Firma calculada con otro secreto** → `false`.
- **Body no parseable como JSON** → `false`. La firma se calcula sobre el JSON canónico equivalente, para aislar la variable: lo que falla es el parseo, no la comparación.

*Canonicalización — que el orden de las claves no rompa la verificación:*

- **Mismo contenido, orden de claves invertido y espaciado distinto** → `true`.
- **Arrays y objetos anidados** (estructura `decision` con `id_verifications` y `metadata` anidados) → `true`. Cubre la recursión de `canonicalize`.

*Anti-replay (K-02) — que un webhook capturado no se pueda reenviar:*

- **`X-Timestamp` de hace 10 minutos** → `false`.
- **301s exactos** → `false`. Determinista en la dirección segura: el reloj solo puede hacer crecer la diferencia.
- **299s exactos** → `true`. Fija el borde de la ventana para que un cambio futuro en el límite de 300s rompa la suite en vez de pasar inadvertido.
- **`X-Timestamp` no numérico** (`"abc"`) → `false`. `Number("abc")` es `NaN`, frena en `verify-signature.ts:31`.
- **`X-Timestamp` vacío** (`""`) → `false`. ⚠️ **CORREGIDO el 2026-10-05.** Este documento decía antes que `Number("")` es `0`, que es finito, y que el caso solo se frenaba después por la diferencia contra el reloj. **Era incorrecto.** `""` es *falsy*, así que `verifyDiditSignature` corta en el guard `!timestampHeader` de `verify-signature.ts:28` — igual que un header ausente (K-01a.2) —. **`Number("")` nunca se evalúa.** El valor esperado `false` nunca estuvo en discusión; el motivo sí. El caso se conserva porque fija comportamiento real, pero se clasifica como **validación del guard de header**, no de la ventana anti-replay.

**Verificación anti-vacío de la suite:** es bidireccional — 4 tests esperan `true` y 10 esperan `false`. Una implementación que devolviera siempre `false` rompería 4; una que devolviera siempre `true` rompería 10. Además, si el import estuviera roto, los tests que esperan `false` lanzarían una excepción en lugar de devolver `false`, así que la suite no puede "pasar" por un import caído.

**Lo que NO cubre E-2:** el nivel endpoint. Los `401`, las cero escrituras y el cero log como evento válido no están verificados — eso es K-01b y necesita servidor.

**Lo que NO se hizo:** no se tocó `lib/didit/verify-signature.ts`, ni `app/api/didit/webhook/route.ts`, ni `playwright.config.ts`, ni los tests `01`–`04`. Sin migraciones, sin schema, sin RLS, sin `SERVICE_ROLE_KEY`, sin dependencias nuevas, sin `.env`, sin commit, sin push.

### 3. Análisis de infraestructura E2E

**Pregunta que origina el análisis:** ¿se puede avanzar con E-3 sin `NEXT_PUBLIC_SUPABASE_URL` ni `NEXT_PUBLIC_SUPABASE_ANON_KEY`?

**Método:** análisis estático de `tests/01`–`04`, `playwright.config.ts` y `proxy.ts`, contrastado contra el texto realmente renderizado por las rutas involucradas. Más dos verificaciones read-only (`git check-ignore -v` y `grep` sobre `tests/`). **No se modificó ningún test.**

**El hecho bloqueante.** `proxy.ts:7` ejecuta `createServerClient` para **toda** request que matchea el matcher, y el constructor lanza sincrónicamente si falta la URL o la key. Sin esas dos variables, `/`, `/login` y `/dashboard` devuelven **500**. No hay ninguna página alcanzable. Esto amplía el hallazgo R-3 del plan, que lo describía como un problema exclusivo del webhook: no lo es, afecta a toda la aplicación. Por eso los **8 tests no-skippeados de `01`–`04` son verificables únicamente con esas variables**.

**Qué ven realmente los asserts.** Sin sesión, `proxy.ts:37-40` redirige cualquier ruta distinta de `/login` hacia `/login`. Es decir: **`/dashboard` nunca renderiza**, y los tests de `03` —y parte de `04`— están midiendo la página de login. El sidebar no existe ahí: los labels `Inicio`, `NNyA`, `Legajos`, `Tutores`, `Referentes` viven en `app/(dashboard)/layout.tsx` y solo se renderizan con sesión y rol.

| Assert | Espera | Veredicto |
|---|---|---|
| `01:9` | `/` → `/login` | pasa |
| `01:17,19` | `/login`, `form` visible | pasa |
| `02:8` | `/dashboard` → `/login` | pasa |
| `02:15` | `form` visible | pasa |
| `02:17` | `Inicio` | **FALLA** |
| `02:18` | `NNyA` | pasa (de `"Residencia NNyA"`) |
| `02:19` | `Legajos` | **FALLA** |
| `02:20` | `Tutores` | **FALLA** |
| `02:21` | `Referentes` | **FALLA** |
| `03:10` | `/dashboard` ≠ `/not-found` | pasa, pero **vacuo** |
| `03:17` | `Residencia` | pasa |
| `03:18` | `NNyA` | pasa |
| `03:19` | `Legajos` | **FALLA** |
| `03:20` | `Alertas` | **FALLA** |
| `04:22,24` | `/login`, `form` visible | pasa |
| `04:32` | `Argüello Infancias` en `/dashboard` | **pasa — por el motivo equivocado** |

**Son 6 asserts que realmente fallan: 4 en `tests/02-nav-roles.test.ts:17,19,20,21` y 2 en `tests/03-dashboard-kpis.test.ts:19,20`.**

**Sobre `tests/04-auth-flow.test.ts:32` — el hallazgo más importante del análisis.** El assert **no falla**. `/dashboard` redirige a `/login`, y `"Argüello Infancias"` **existe** en la página de login (`app/(auth)/login/page.tsx:8`). El assert pasa hoy, pero valida el título de la página de login, no el layout del dashboard que el nombre del test dice verificar. **No se lo corrige:** hacerlo lo empeoraría, cementando un test engañoso que "pasa" por un motivo que no es el que declara. Un test verde que valida lo contrario de lo que dice es peor que un test rojo honesto.

**Ningún assert se modificó para hacerlo pasar.** La corrección "obvia" —apuntar los asserts al texto real de la página de login— los haría pasar, pero fijaría comportamiento que no es el que declaran probar y dejaría `tests/03` con un nombre que miente. Hasta que se defina si los tests deben probar comportamiento autenticado o anónimo, los 6 asserts **no se tocan**.

**Atajo evaluado y descartado.** Se evaluó fabricar variables de Supabase falsas vía `webServer.env` para destrabar los tests sin proyecto real. Descartado por dos razones: implica escribir una URL y una key ficticias en un archivo versionado, lo que choca con la regla de no versionar credenciales y crea un precedente que después hay que distinguir de las reales; y aun si funcionara, solo destrabaría los tests de redirect — los 6 asserts de contenido del sidebar seguirían fallando porque necesitan una sesión real con rol. No es un atajo, es una vía muerta parcial.

**Conclusión del análisis:** E-3 **no puede completarse ni verificarse** sin las variables de Supabase. Lo único cerrable sin entorno era `.gitignore`, y quedó hecho.

### 4. Limpieza de artefactos de testing

**Qué se agregó a `.gitignore`** — las reglas quedaron bajo el bloque `# testing` y bajo `# debug`, sin modificar ninguna regla previa:

| Línea | Regla | Qué ignora |
|---|---|---|
| 15 | `playwright-report/` | Reporte HTML de Playwright |
| 16 | `test-results/` | Artefactos de corrida (traces, screenshots) |
| 34 | `dev.log` | Log del servidor de desarrollo |
| 35 | `test-output.txt` | Salida cruda de corridas |
| 36 | `test-results-summary.txt` | Resumen de corridas |

**Verificación:** `git check-ignore -v` sobre las 5 rutas → las 5 resuelven contra las líneas indicadas, exit 0. Ninguna regla previa se modificó.

**Riesgo cero de este ítem:** `.gitignore:39` ya cubría `.env*` y `:56-57` ya tenía `*.sql` con su excepción para `supabase/migrations/`, así que no hubo conflicto con ninguna regla previa. Por eso era el **único ítem de E-3 cerrable y demostrable al 100% sin entorno y sin navegador**.

---

## Estado actual de las etapas

| Etapa | Estado confirmado | Pendiente |
|---|---|---|
| **E-4** - tests de contrato del webhook | ? Parcial | Capa pura verificada: 5 tests con node:test, secretos ficticios y sin Supabase. HTTP del route y lógica #23 pendientes. Ver [§11.4](#114-etapa-e-4--contrato-del-webhook-didit). |
| **E-4** - tests de contrato del webhook | ? Parcial | Capa pura verificada: 5 tests con node:test, secretos ficticios y sin Supabase. HTTP del route y lógica #23 pendientes. Ver [§11.4](#114-etapa-e-4--contrato-del-webhook-didit). |
| **E-4** — tests de contrato del webhook | ⏳ **PENDIENTE DE ENTORNO.** No se escribió una línea. Requiere `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `tests/06-didit-webhook-contract.test.ts`: J-01, K-01b, L-01. El caso del `500` sin secreto requiere un proyecto de Playwright adicional con `webServer.env` sin esa variable. `DIDIT_WEBHOOK_SECRET` siempre ficticio |
| **E-5** — escenarios funcionales de retiro/autorización | ⏳ **PENDIENTE DEL MODELO DE SOFI.** 0 de 4 escenarios A–D son ejecutables | Requiere tabla `retiros`, tabla de sesiones de verificación y campo de autorización. Antes de A-01 en manual: conseguir en el panel de Didit los DNI de prueba válidos en RENAPER sandbox, que no están documentados en el repo |

---

## Trabajo independiente de Meli

Lo que se hizo **sin depender de nadie más**, y por qué era ejecutable en las condiciones del checkout:

| Trabajo | Por qué era independiente |
|---|---|
| **Planificación de QA** para el flujo de retiro con Didit | Es documentación y análisis. No requiere modelo de datos ni decisiones funcionales para *describir* qué hay que verificar |
| **Diseño de la matriz de 17 casos** con 10 campos y 4 categorías de bloqueo | Lo que se define es el criterio de verificación, no el comportamiento del sistema. Escribir un caso bloqueado no es inventar: es dejar explícito qué decisión falta |
| **Testing de la función pura de firma** | `verifyDiditSignature` recibe el secreto como parámetro, no lee `process.env`, no importa Supabase, no hace red. Aislar la lógica testeable del I/O es lo que habilita correrla sin servidor |
| **Validación anti-replay** (ventana de 300s) | Misma razón: es lógica determinística sin dependencias. Se verificó en el borde, en ambos sentidos, para que el límite quede fijado por un test y no por un comentario |
| **Análisis estático de la suite E2E** | Es lectura de código contra lo que las rutas realmente renderizan. No necesita servidor ni variables: la conclusión sale de `proxy.ts`, de los layouts y del texto de las páginas |
| **Detección de falsos positivos** (`tests/04:32`) | Se detectó leyendo qué texto hay en `/login` y comparándolo con lo que el test dice verificar. Un test que pasa por el motivo equivocado es un defecto de la suite, y se detecta sin ejecutarla |
| **Limpieza de artefactos de testing** (`.gitignore`) | Verificable al 100% con `git check-ignore -v`, sin entorno, sin navegador y sin riesgo de conflicto con reglas previas |
| **Documentación de riesgos y bloqueos** | Registrar R-1 a R-13 y el análisis de viabilidad es parte del entregable de QA, no una tarea diferenciada |

**Lo que quedó deliberadamente sin hacer, aunque fuera técnicamente posible:** escribir la lógica del webhook sin modelo de datos; corregir los asserts de `02`/`03` para que pasen; agregar `webServer` sin variables; fabricar credenciales ficticias versionadas; corregir los documentos desactualizados que esos análisis dejaron documentados como hallazgo.

---

## Pendientes de equipo/backend o decisión

### Variables de entorno seguras para testing

Sin `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` no hay ninguna página alcanzable y el servidor de Next responde 500 en todo lo que pasa por el middleware. **Es el bloqueante raíz**: frena por igual a E-3, E-4 y cualquier E2E. Se necesita un entorno de testing **no productivo**; el checkout actual no tiene ningún `.env*` y no se creó ninguno.

### Decisión: autenticado vs anónimo para `tests/02` y `tests/03`

| Opción | Implicación |
|---|---|
| **Autenticado** | Necesita un usuario de Supabase con rol → requiere **entorno** (variables) **y Sofi** (crear el usuario). Es la opción que realmente valida el sidebar y los KPIs |
| **Anónimo** | Los tests deben dejar de esperar contenido del dashboard y verificar el redirect. `tests/03` deja de ser un test de dashboard: es una reescritura, no una corrección |

Hasta que se decida, los 6 asserts no se tocan.

### Modelo de datos de Sofi para retiros, sesiones y autorización

Falta: tabla `retiros`, tabla de sesiones de verificación Didit con los estados de RNF-12, campo o tabla de "autorizado a retirar", campo de "restricciones vigentes" sobre el vínculo tutor↔NNyA, y `autorizado_por` para el fallback manual. Sin eso, `route.ts:41-48` no se puede escribir y E-5 no se puede ejecutar.

También falta resolver si la sesión de verificación Didit es una tabla compartida entre el flujo de retiros y el de alta de tutores/referentes, o dos tablas separadas.

### Lógica de negocio del webhook

`route.ts:41-48` es un `TODO`. Los 3 pasos —buscar la sesión por `session_id`, actualizar su estado según `status`, y validar la autorización de retiro vigente si `status === 'Approved'`— no están escritos. Dependen del modelo de datos.

### Endpoints necesarios para E-4 y E-5

| Falta | Para qué |
|---|---|
| Route handler para **crear** una sesión de verificación | Sin él no hay `session_id` que verificar |
| Endpoint para **consultar** el estado de una verificación | Sin él no hay forma de cerrar un escenario funcional |
| Cliente HTTP hacia Didit con `AbortSignal` (timeout/retry) | RNF-13. Es el wrapper: se puede escribir sin Sofi, pero el caso I-01 no se cierra sin el enum de estados |

### Decisiones funcionales todavía abiertas (documentadas en 028)

Se registran acá como pendientes, **sin resolver**:

- **P-01** — mapeo de los `status` de Didit a los 5 estados de RNF-12. Bloquea E-01 a E-05 y parte de B-01. Los 5 estados no cubren `Expired`, `Kyc Expired` ni `Abandoned`.
- **P-02** — quién puede realizar el fallback manual. Bloquea G-01 y G-02. La documentación se contradice textualmente entre "solo Admin/coordinador" y "`Admin`/`Equipo Tecnico`".
- **P-03** — comportamiento ante `session_id` inexistente. Bloquea L-01. Restricción: Didit reintenta las entregas, así que un `404` genera reintentos indefinidos.
- **P-04** — alcance exacto del contador de 3 intentos. Bloquea F-01 y parte de D-01. Configurado en el workflow de Didit, pero el tope de negocio no existe.

---

## Riesgos y contradicciones detectadas

Se documentan, no se corrigen. Todos ya verificados por lectura o por ejecución.

| # | Riesgo / contradicción | Ubicación | Por qué importa |
|---|---|---|---|
| R-a | **Tests E2E que pueden pasar por el motivo equivocado.** `tests/04-auth-flow.test.ts:32` pasa hoy porque `"Argüello Infancias"` está en la página de login, no porque el layout del dashboard exista. El nombre del test dice verificar algo que no verifica | `tests/04-auth-flow.test.ts:32` | Un test verde que valida lo contrario de lo que declara es peor que un test rojo: da confianza falsa |
| R-b | **El comentario de `tests/02:7` atribuye el redirect anónimo a `AccessGuard`.** Es incorrecto: el redirect lo produce `proxy.ts:37-40`. `components/shared/AccessGuard.tsx` es un componente client de render por rol y no participa del redirect | `tests/02-nav-roles.test.ts:7` | Un test que documenta el mecanismo equivocado induce a corregir el lugar equivocado |
| R-c | **Falta de variables de entorno.** Sin `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `proxy.ts:7` lanza y toda ruta del matcher devuelve 500. No hay ninguna página alcanzable | `proxy.ts:7`, `:52-55` | Es el bloqueante raíz de E-3 y E-4. No es un problema del webhook: afecta a toda la aplicación |
| R-d | **`webServer` sin entorno empeora el modo de fallo.** Con `webServer` pero sin variables, `next dev` arranca, cada request da 500 y los 8 tests mueren por timeout de assert (30s c/u con `fullyParallel: true`) | `playwright.config.ts` | El fallo actual (`ERR_CONNECTION_REFUSED`) es rápido y legible. Agregar `webServer` a ciegas cambia ruido útil por minutos de ruido inútil |
| R-e | **Los 6 asserts que fallan no son un error de redacción, son una decisión faltante.** Esperan contenido del sidebar sin tener sesión. El arreglo "obvio" los haría pasar fijando comportamiento que no declaran probar | `tests/02`, `tests/03` | Por eso están bloqueados y no corregidos |
| R-f | **El criterio de `prompts/016` (CA-5: "sin `DIDIT_WEBHOOK_SECRET` → 500") es inalcanzable si también faltan las variables de Supabase:** el middleware devuelve 500 primero. Mismo código de salida, distinto camino | `app/api/didit/webhook/route.ts:6-9` | Un test que solo verifique el código de salida no distinguiría los dos caminos |
| R-g | **Lint global con errores preexistentes.** El baseline del repo ya tenía **85 errores** antes de E-2, todos en código de la app: 81 `@typescript-eslint/no-explicit-any`, 2 `react/no-unescaped-entities`, 1 `@typescript-eslint/no-empty-object-type`, 1 `useForm`, 1 `render` | `npm run lint` | El criterio "el lint global sigue en verde" es insatisfacible desde el inicio. `tests/05` aporta **0**. No se corrigen: `AGENTS-WEB.md:86` prohíbe refactors no relacionados |
| R-h | **`tsconfig.json:33` excluye `tests` del type-check.** `npx tsc --noEmit` y `npm run build` no validan los tests; Playwright los compila en runtime | `tsconfig.json:33` | Un error de tipos en un test no aparece hasta que corre, no en el chequeo de build |
| R-i | **Versiones divergentes de Playwright.** `@playwright/test ^1.63.0` en `dependencies` y `playwright ^1.60.0` en `devDependencies` | `package.json` | No se toca: `AGENTS-WEB.md:86`. Se reporta como deuda |
| R-j | **`AGENTS-WEB.md:77` afirma que no hay tests escritos** | `AGENTS-WEB.md:77` | Quien planifique sobre ese dato va a subestimar lo hecho. No se corrige: los documentos desactualizados se registran, no se editan |
| R-k | **`diditWebhookSchema.environment` solo admite `live`/`sandbox`:** un evento de producción sería rechazado con `400`. Probablemente correcto, pero no está testeado ni documentado | `lib/validations/didit-webhook.schema.ts:8` | Es el caso (d) de J-01. Queda sin cubrir mientras E-4 no exista |
| R-l | **El mapeo de los 10 `status` de Didit a los 5 estados de RNF-12 no existe en ningún documento del repo** y no cubre `Expired`, `Kyc Expired` ni `Abandoned` | Decisión P-01 | Sin esa definición, el mensaje al usuario y la regla del fallback manual no se pueden escribir bien: aplicar fallback sobre un "expiró" sería un bypass no contemplado |

---

## Orden sugerido de continuación

Ordenado por dependencias reales, no por dificultad.

| # | Paso | Depende de | Por qué en este orden |
|---|---|---|---|
| 1 | **Obtener un entorno seguro / no productivo** con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` disponibles para testing | Del equipo | Es el bloqueante raíz. Sin esto no hay página alcanzable, `webServer` empeora el modo de fallo y E-4 no puede ni escribirse |
| 2 | **Resolver la decisión de autenticación de los tests E2E** (autenticado vs anónimo) | Decisión funcional | Depende solo de una decisión, no de código. Define si los 6 asserts se corrigen, se reescriben o se bloquean. Conviene tomarla antes de tocar `tests/02`/`03` |
| 3 | **Completar E-3** con entorno y decisión tomadas: agregar `webServer` y `projects` a `playwright.config.ts`, corregir o reescribir los 6 asserts, limpiar los `const url` muertos | De 1 y 2 | Con las dos anteriores resueltas, el resto de E-3 es trabajo mecánico y verificable |
| 4 | **Implementar y verificar E-4**: `tests/06-didit-webhook-contract.test.ts` con J-01, K-01b y L-01 | De 1 y 3 | Necesita el servidor levantado. El proyecto adicional de Playwright para el caso del `500` sin secreto se resuelve acá |
| 5 | **Cuando Sofi cierre el modelo de datos, avanzar E-5** con los escenarios A–D y los derivados | De Sofi y de P-01 a P-04 | No es ejecutable antes. Antes de A-01 en manual, conseguir los DNI de prueba válidos en RENAPER sandbox |

**Lo que NO está en este orden porque no es trabajo ejecutable ahora:** nada. No hay ítems independientes de la tabla que se puedan adelantar sin entorno o sin decisión.

---

## Criterios de aceptación del trabajo de QA

Coherentes con `prompts/028` y `docs/testingManual/QA-DIDIT-RETIRO.md`. Verificables, no declarativos.

### Sobre la capa de seguridad (E-2, E-4)

- [x] `npm run test:unit` da **21 passed / 0 failed / 0 skipped** (14 de Didit + 7 de SENAF), y los 14 de Didit siguen dando 14 en cualquier corrida futura.
- [x] La suite es **anti-vacía**: hay casos que esperan `true` y casos que esperan `false`. Una implementación degenerada rompe la suite.
- [x] Ninguna prueba usa credenciales reales. El secreto de testing es una constante ficticia dentro del archivo de test, nunca leída de `process.env`.
- [x] **No se escriben datos reales.** Ningún test de la capa de función importa Supabase ni toca la base.
- [ ] E-4: el contrato del webhook **prueba respuestas esperadas**, no solo que el endpoint responde. Cada caso afirma el código de salida y el efecto (cero escrituras, cero log como evento válido).

### Sobre la honestidad de los tests E2E

- [x] **Un test E2E debe validar la pantalla que dice validar.** Ningún test se considera aprobado si pasa por un redirect o por contenido de otra página. `tests/04:32` está identificado como falso positivo y **no** cuenta como cobertura.
- [x] No se modificó ningún assert para que pase. Los 6 que fallan están bloqueados por una decisión funcional, no escondidos.
- [ ] Con la decisión de autenticación tomada, `tests/02` y `tests/03` se corrigen o se reescriben — nunca se los deja en verde validando algo que no declaran.

### Sobre los escenarios funcionales

- [ ] Los escenarios A–D **solo se consideran aprobados cuando son ejecutables**. Mientras el modelo de datos no exista, están especificados, no aprobados.
- [ ] Cada caso aprobado tiene resultado esperado verificable por un tercero, sin necesidad del contexto de quien lo escribió.
- [ ] Un caso no se cierra por "el código parece hacer eso": se cierra cuando hay un test verde o una verificación manual registrada.

### Sobre el alcance

- [x] No se modificó código de la app, ni tests existentes, ni `playwright.config.ts`, ni Supabase, ni migraciones, ni RLS, ni `package.json`, ni `tsconfig.json`.
- [x] Ningún commit, ningún push.

---

## Chequeos realizados

Todos ejecutados sobre este checkout (rama `master`, HEAD `b4ab8e3`).

| Chequeo | Resultado |
|---|---|
| `npm run test:unit` | ✅ **21 passed / 0 failed / 0 skipped** (14 Didit + 7 SENAF) |
| Corridas de E-2 registradas en 028 | ✅ 14 passed (1.4s) · 14 passed (1.1s) · 14 passed (1.0s) |
| Re-verificación al armar este documento | ✅ 14 passed (1.3s) |
| `npx eslint tests/unit/didit-signature.test.ts` | ✅ **exit 0, 0 errores** |
| `npx tsc --noEmit` | ✅ **exit 0** |
| `npm run build` | ✅ **exit 0** |
| `npm run lint` (global) | ❌ **exit 1 — 85 errores + 15 warnings, todos preexistentes en código de la app** |
| `tests/unit/didit-signature.test.ts` introduce errores de lint | ✅ **0** (verificado con ESLint sobre el archivo aislado) |
| `git check-ignore -v` sobre las 5 rutas de testing | ✅ las 5 resuelven contra `.gitignore:15,16,34,35,36`, exit 0 |

**Desglose de los 85 errores del lint global:** 81 `@typescript-eslint/no-explicit-any`, 2 `react/no-unescaped-entities`, 1 `@typescript-eslint/no-empty-object-type`, 1 `useForm<AudienciaFormValues>`, 1 `render`. **No se corrigen**: son deuda preexistente y `AGENTS-WEB.md:86` prohíbe refactors no relacionados.

---

## Seguridad

- **No se usaron credenciales reales.** Ningún test usa `DIDIT_API_KEY`, `DIDIT_WEBHOOK_SECRET` ni ninguna key de Supabase. La función pura no los necesita: recibe el secreto como parámetro.
- **El secreto usado en los tests es ficticio.** Es una constante escrita en `tests/unit/didit-signature.test.ts` (`'test-secret-not-a-real-credential'`). No autentica contra Didit ni contra nada.
- **No se creó `.env`** ni `.env.local`. `.gitignore:39` sigue ignorando `.env*` y esa regla no se modificó.
- **No se usó `SUPABASE_SERVICE_ROLE_KEY`.** No aparece en ningún test.
- **No se tocó Supabase.** Sin migraciones, sin schema, sin RLS, sin cambios en la base.
- **No se almacenaron datos biométricos.** El test de canonicalización usa un objeto `decision` con valores ficticios; ningún selfie, video, plantilla biométrica ni copia de DNI.
- **No se utilizaron datos reales de NNyA.** Los cuerpos de prueba son envelopes sintéticos con identificadores de prueba.
- **No se probó contra producción.** El endpoint tiene un webhook de producción configurado en el panel de Didit, pero nada se le envió desde este trabajo.
- **Ningún test escribe en la base.** `app/api/didit/webhook/route.ts` no importa cliente de Supabase, así que los tests de contrato no lo necesitarán tampoco.
- **No se versionaron secretos**, reales ni ficticios fuera del archivo de test.
- **RNF-04 (logs sin biometría) verificado por lectura, no por ejecución:** `route.ts:39` loguea solo `session_id` y `status`, nunca el objeto `decision`. El caso M-02 existe para **proteger** ese comportamiento cuando se agregue la lógica de negocio; queda como verificación manual, no como test.
- **RNF-05 (firma) verificada sin tocar la implementación.** Los tests comprueban que no se pueda aceptar un webhook sin firma válida ni reenviar uno vencido. `timingSafeEqual` (`verify-signature.ts:51`) queda intacto.




