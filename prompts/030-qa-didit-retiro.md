# PLAN: QA / Testing del flujo de retiro con validación de identidad (Didit)

## Objetivo

Definir y dejar planificada la estrategia de QA del flujo de retiro de NNyA con validación de identidad mediante Didit, separando de forma explícita **qué se puede probar hoy** de **qué está bloqueado por el modelo de datos de Sofi** o por decisiones funcionales de Jordy.

Alcance de la **etapa de documentación**: dos documentos (este plan + `docs/testingManual/QA-DIDIT-RETIRO.md`). La **etapa E-2** (implementación de los tests de firma) se ejecutó posteriormente y está registrada en [§ Estado de ejecución](#estado-de-ejecución).

---

> ## ⚠️ Estado tras la migración al `master` `84c4d23` (2026-10-05)
>
> Este plan se escribió sobre `b4ab8e3`. Al migrar al `master` `84c4d23` el proyecto **no adoptó la infraestructura de Playwright** que este documento asumía. Lo que cambió:
>
> | Antes (supuesto en este plan) | Ahora (master `84c4d23`) |
> |---|---|
> | Tests de firma en `tests/05-didit-signature.test.ts`, runner Playwright | **`tests/unit/didit-signature.test.ts`**, runner `node:test` |
> | `npm run test` / `test:e2e` / `test:ui` (Playwright) | **`npm run test:unit`** (el único script de test del proyecto) |
> | `@playwright/test` en `dependencies` | **No está en ninguna sección** de `package.json` |
> | `playwright.config.ts`, `tests/01`–`04` | **No existen en el repositorio** |
> | `.gitignore` con 5 reglas de testing agregadas | `.gitignore` **sin esas reglas** (el bloque `# testing` tiene solo `/coverage`) |
>
> **Qué sobrevive de este plan:** los 14 casos K-01a y K-02 (migrados 1:1, con sus IDs), la matriz de `QA-DIDIT-RETIRO.md`, y los hallazgos que no dependen de los archivos — el bloqueante de `proxy.ts` sin variables de Supabase, el falso positivo de `tests/04:32`, la decisión pendiente autenticado vs anónimo, y el baseline de lint.
>
> **Qué queda como registro histórico:** E-3 y §12, que analizaban archivos que no se trasladaron. Se conservan rotulados como históricos, no como plan de trabajo.

---

## Estado de ejecución

Actualizado el **2026-09-29**, al cerrar E-2 y tras el análisis de E-3. **E-3 quedó parcial** (solo `.gitignore`, ver §12). E-4 y E-5 siguen sin ejecutar. **Actualizado el 2026-10-05** por la migración a `master` `84c4d23`: la ruta de ejecución pasó a `npm run test:unit` y E-3 quedó sin objeto (ver el aviso de arriba).

### ✅ E-2 — COMPLETADA

| Ítem | Resultado |
|---|---|
| `tests/unit/didit-signature.test.ts` | **Creado** (migrado el 2026-10-05 desde `tests/05-didit-signature.test.ts`, que ya no existe) |
| Tests implementados | **14** |
| Resultado | **14 passed / 0 failed / 0 skipped** |
| Casos cubiertos | K-01a (9) + K-02 (5) |
| Runner | `node:test` + `node:assert/strict`, vía `npm run test:unit`. Tests de función pura. Sin fixtures de navegador, sin servidor, sin `.env.local`, sin conexión a Supabase |

**Ejecución repetida 3 veces, estable:**

```
corrida 1:  14 passed (1.4s)
corrida 2:  14 passed (1.1s)
corrida 3:  14 passed (1.0s)
```

**Verificaciones** *(comandos actualizados al `master` `84c4d23`)*:

| Chequeo | Resultado |
|---|---|
| `npm run test:unit` | ✅ **21/21** (14 de Didit + 7 de SENAF) |
| `npx eslint tests/unit/didit-signature.test.ts` | ✅ pasa — **0 errores** |
| `npx tsc --noEmit` | ✅ pasa (exit 0) — R-6 **quedó obsoleto**: el master ya **no** excluye `tests/` del typechecking; `tests/unit/` se typechequea, y el import lleva extensión `.ts` porque el master activó `allowImportingTsExtensions` |
| `npm run build` | ✅ pasa (exit 0) |
| `npm run lint` (global) | ❌ **NO pasa** — ver R-11 y CA-2 |

**Estado por caso:**

- **K-01a — EJECUTADO Y APROBADO** a nivel de función (`verifyDiditSignature`).
- **K-02 — EJECUTADO Y APROBADO**. Ventana anti-replay de 300s parcial/capa pura verificada en el borde.

**Observación conservada de K-02.3 (sin tocar la implementación):** el caso `X-Timestamp` de hace 299s es sensible a ±1s. Si el event loop se demorara 2s entre que el test calcula el timestamp y que `verifyDiditSignature` lee `Date.now()`, la diferencia pasa a 301s y el caso falla. En 3 corridas consecutivas no ocurrió (el intervalo real es de microsegundos). Queda documentado **en el propio test**: si fallara, el arreglo es subir el número a 290 (sigue dentro de la ventana), **nunca** tocar la implementación. K-02.2 (301s) es determinista en la dirección segura, porque el reloj solo puede hacer crecer la diferencia.

**No se hizo:** no se tocó `lib/didit/verify-signature.ts` ni `app/api/didit/webhook/route.ts`. Sin migraciones, sin schema, sin RLS, sin `SERVICE_ROLE_KEY`, sin dependencias nuevas, sin `.env`, sin commit, sin push.

> **Nota de la migración del 2026-10-05.** En su momento E-2 tampoco tocó `playwright.config.ts` ni los tests `01`–`04`, porque eran infraestructura previa sin commitear. Al migrar al `master` `84c4d23` esa infraestructura **no se trasladó**: el proyecto no usa Playwright. Los tests de firma se escribieron directamente en `tests/unit/didit-signature.test.ts` con `node:test`, sin pasar por un archivo `tests/05`.

### Pendientes

| Etapa | Estado | Motivo del bloqueo |
|---|---|---|
| E-3 | ❌ **SIN OBJETO (cancelada el 2026-10-05)** | Reparaba `playwright.config.ts` y `tests/01`–`04`, que el `master` `84c4d23` no adoptó. El completito parcial de `.gitignore` (R-5) nunca se commiteó y **no se traslada**. El análisis de §12 se conserva por sus hallazgos vigentes, no como plan |
| E-4 | ⏳ **Pendiente de entorno** | Requiere `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (R-3, R-4) |
| E-5 | ⏳ **Pendiente del modelo de Sofi** | Requiere tabla `retiros` y tabla de sesiones de verificación, que no existen |

---

## Contexto

- **Rol:** Meli — QA/Testing, integraciones backend, integración Didit.
- **Estado real parcial/capa pura verificada de la integración Didit** (inspección de código, 2026-09-29):
  - **Capa de seguridad 100% completa y deployada:** `app/api/didit/webhook/route.ts` (51 líneas), `lib/didit/verify-signature.ts` (función pura), `lib/validations/didit-webhook.schema.ts`, excepción en `proxy.ts:35`.
  - **Capa de negocio 0%:** no existe tabla `retiros`, ni tabla de sesiones de verificación Didit, ni campo "autorizado a retirar". La lógica de negocio es el comentario `// TODO(Meli):` en `route.ts:41-48`.
  - **0 de 4 escenarios del PDF §6 (A–D) son ejecutables hoy.**
- **Playwright:** instalado y configurado a medias (plan `prompts/027`, sin commitear). `playwright.config.ts` **no tiene `webServer`** y los 4 specs existentes fallan con `net::ERR_CONNECTION_REFUSED` (parcial/capa pura verificada en `test-results-summary.txt`). Además, **con servidor levantado hay 6 asserts que fallan de verdad** (4 en `tests/02`, 2 en `tests/03`), y su corrección requiere una decisión funcional previa (R-12). Ver [§12](#12-análisis-de-viabilidad-de-e-3--2026-09-29).
- **Entorno:** este checkout **no tiene ningún archivo `.env*`**. No hay `NEXT_PUBLIC_SUPABASE_*` ni `DIDIT_*`. parcial/capa pura verificada empíricamente (ver "Supuesto 3").
- **Dependencia externa:** Sofi no cerró el modelo de datos. `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md:47` lo confirma a 2026-09-13 y las 38 migraciones lo corroboran (no existe `retiros`).

### Decisiones tomadas por Meli (2026-09-29) que este plan respeta

| # | Decisión |
|---|---|
| D-1 | **No** usar producción. **No** crear `.env.local` con credenciales reales. Trabajar solo con tests que corran sin conexión al Supabase real. |
| D-2 | **Playwright como único runner.** Sin Vitest ni dependencias nuevas (`AGENTS-WEB.md:79`). |
| D-3 | Se permite un **secreto Didit ficticio** exclusivamente dentro del entorno de testing. Nunca inventar ni usar una credencial real. Nunca versionar secretos. |
| D-4 | **No** modificar los documentos existentes desactualizados. Solo registrar los hallazgos en el documento nuevo de QA. |
| D-5 | Las 4 decisiones funcionales pendientes de Jordy quedan **documentadas como PENDIENTES**. No resolver por cuenta propia. |

---

## Archivos inspeccionados

- `AGENTS-WEB.md` (215 líneas) · `CLAUDE.md` (solo `@AGENTS-WEB.md`)
- `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md` (101 líneas) — § Meli, 8 tareas
- `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md` (123 líneas) — §1 modelo de datos, §2 backend, §4 RNF-01..13, §6 preguntas abiertas, §8 método RENAPER
- `INFORME-WEBHOOK-DIDIT-PARA-MELI.md` (42 líneas)
- `INFORME-FALTANTES-Y-GUIA-PROMPTS.md` (158 líneas)
- `prompts/016-webhook-didit.md` (82 líneas) — plan del webhook, ✓ Aprobado
- `prompts/029-playwright-testing-setup.md` (89 líneas) — setup de Playwright
- `app/api/didit/webhook/route.ts` (51 líneas) — leído completo
- `lib/didit/verify-signature.ts` (52 líneas) — leído completo
- `lib/validations/didit-webhook.schema.ts` (16 líneas) — leído completo
- `proxy.ts` (56 líneas) — leído completo
- `app/api/usuarios/route.ts` (68 líneas) — patrón de referencia server-side
- `playwright.config.ts` (17 líneas) · `package.json` · `tsconfig.json` · `.gitignore`
- `tests/01-home-login.test.ts` · `02-nav-roles.test.ts` · `03-dashboard-kpis.test.ts` · `04-auth-flow.test.ts` · `test-results-summary.txt`
- `supabase/migrations/` — 38 migraciones listadas; `20260620000031_clean_schema.sql:78-85` (`nnya_tutores`); `20260915182618_audit_log_real.sql` (61 líneas)
- `docs/testingManual/MANUAL_TESTING.md` (239 líneas)
- `git log` / `git status` — rama `master`, HEAD `b4ab8e3`, setup de Playwright sin commitear

## Skills utilizadas

- `testing-nnya` — **no disponible**: `.claude/` está gitignorieado (`.gitignore:44`) y no existe en este checkout. Se aplicó el criterio de la skill de todas formas (checklist manual de QA por módulo) leyendo `docs/testingManual/MANUAL_TESTING.md` como equivalente.
- `database-design` — **no disponible** por la misma razón. Se evitó deliberadamente toda definición de campo: es territorio de Sofi.
- `playwright` — aplicada la práctica de aislar la lógica testeable (función pura) del I/O.

## Supuestos

1. `lib/didit/verify-signature.ts` es **función pura**: recibe el secreto como parámetro, no lee `process.env`, no importa Supabase, no toca red. Por eso es testeable en aislamiento sin servidor ni entorno. **parcial/capa pura verificada por lectura línea por línea.**
2. La lógica de negocio que se agregará al webhook **no está escrita** y no se puede escribir sin el modelo de datos. Este plan no la anticipa.
3. **parcial/capa pura verificada empíricamente (2026-09-29):** `next dev` arranca sin variables de Supabase ("Ready in 1001ms"), pero **toda** request que matchea el `matcher` de `proxy.ts:52-55` —incluido `/api/didit/webhook`— falla con `500` en `proxy.ts:7`:
   ```
   Error: Your project's URL and Key are required to create a Supabase client!
       at proxy (proxy.ts:7:38)
   ```
   **Consecuencia:** los tests de contrato del webhook requieren que el servidor de Next levante, y eso a su vez requiere `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Sin ellas quedan **pendientes de entorno**, no ejecutables. Esto contradice la premisa de D-1 y se reporta como bloqueante en vez de rodearse con un hack.
4. `tsconfig.json:33` excluye `tests` del type-check. Consecuencia: los tests **no** los valida `npx tsc --noEmit` ni `npm run build`; los compila Playwright en runtime. Import relativo (`../../lib/didit/verify-signature`) en vez del alias `@/` evita depender de la resolución de `paths` sobre un directorio excluido. A confirmar empíricamente en la etapa de implementación.
5. `package.json` tiene `@playwright/test` en `dependencies` y `playwright` en `devDependencies`, con versiones divergentes (`^1.63.0` vs `^1.60.0`). No se toca: `AGENTS-WEB.md:86` prohíbe refactors no relacionados. Se reporta como deuda.
6. Los DNI de prueba válidos en el padrón de RENAPER **sandbox** de Didit no están documentados en el repo. No se inventan. Queda como requisito a resolver con el panel de Didit antes de la ejecución manual de los escenarios A–D.

---

## Alcance

### Dentro de alcance (esta etapa — solo documentación)

1. `prompts/030-qa-didit-retiro.md` (este archivo)
2. `docs/testingManual/QA-DIDIT-RETIRO.md`

### Dentro de alcance (etapas futuras, requieren aprobación aparte)

| Etapa | Qué | Condición para empezar |
|---|---|---|
| E-2 | Tests unitarios de `verifyDiditSignature` | Aprobación de este plan + `tests/` sin `webServer` |
| E-3 | Reparar la infraestructura de Playwright (`webServer`, ignores, asserts) | Aprobación + variables de entorno disponibles. **`.gitignore` ya está hecho (R-5); el resto bloqueado.** Ver §12 |
| E-4 | Tests de contrato del route handler del webhook | E-3 + `NEXT_PUBLIC_SUPABASE_*` disponibles |
| E-5 | Tests de los escenarios A–D y derivados | **Modelo de datos de Sofi cerrado** |

### Fuera de alcance (explícito)

- **No** implementar la lógica de negocio de Didit (depende de Sofi).
- **No** modificar `app/api/didit/webhook/route.ts` ni nada bajo `lib/didit/`.
- **No** tocar Supabase: sin migraciones, sin schema, sin RLS, sin `SERVICE_ROLE_KEY`.
- **No** definir ningún campo de `retiros` ni de la tabla de sesiones de verificación.
- **No** resolver las 4 decisiones funcionales pendientes de Jordy.
- **No** modificar los documentos existentes (D-4).
- **No** agregar dependencias. **No** agregar credenciales. **No** hacer commit ni push.

---

## Archivos a crear/modificar

### Esta etapa

| Archivo | Acción |
|---|---|
| `prompts/030-qa-didit-retiro.md` | Crear |
| `docs/testingManual/QA-DIDIT-RETIRO.md` | Crear |

Ningún otro archivo se toca en esta etapa.

### Etapas futuras (a detallar en su propio plan)

| Archivo | Acción | Etapa | Estado |
|---|---|---|---|
| `tests/unit/didit-signature.test.ts` | Crear | E-2 | ✅ **Creado** (migrado desde Playwright el 2026-10-05) |
| `tests/06-didit-webhook-contract.test.ts` | Crear | E-4 | ⏳ Pendiente de entorno |
| `playwright.config.ts` | Modificar (agregar `webServer`, `projects`) | E-3 | ⏳ Pendiente de entorno (ver §12) |
| `.gitignore` | Modificar (agregar `playwright-report/`, `test-results/`, `dev.log`, `test-output.txt`, `test-results-summary.txt`) | E-3 | ✅ **Hecho y parcial/capa pura verificada** |
| `tests/01`–`04` | Modificar (asserts de contenido de `02`/`03`) | E-3 | 🚧 **Bloqueado por R-12** |

---

## Requisitos

### Para la etapa E-2 ✅ IMPLEMENTADA (era lo único ejecutable hoy)

> **Estado:** los 12 items de esta lista están implementados y parcial/capa pura verificadas en `tests/unit/didit-signature.test.ts` (14 tests: 9 de K-01a + 5 de K-02). Ver [§ Estado de ejecución](#estado-de-ejecución).

1. Tests con el runner de Playwright **sin** fixtures de navegador ni de página (tests de función pura). Sin `webServer` en la config.
2. El secreto de prueba se define como **constante ficticia dentro del archivo de test** (ej. `'test-secret-not-a-real-credential'`). No se lee de `process.env`, no se versiona ninguna credencial real, no se agrega al `.env*`.
3. Helper de firma en el test que replica la canonicalización (`lib/didit/verify-signature.ts:3-15`) para construir cuerpos válidos — el objetivo es probar la función, no reimplementarla.
4. Casos mínimos para `verifyDiditSignature`:
   - firma válida calculada sobre el mismo secreto → `true`
   - `timestampHeader` ausente → `false`
   - `signatureHeader` ausente → `false`
   - firma de longitud distinta (hex truncado) → `false` (cubre el pre-check de `verify-signature.ts:49`)
   - 1 caracter alterado de la firma → `false`
   - firma calculada con otro secreto → `false`
   - `X-Timestamp` de hace más de 300s (replay) → `false`
   - `X-Timestamp` no numérico (`"abc"`, `""`) → `false`
   - body no-JSON → `false` (cubre `verify-signature.ts:40-42`)
   - body con claves en orden distinto pero mismo contenido → `true` (cubre la canonicalización recursiva)
   - body con arrays y objetos anidados → `true`
   - `X-Timestamp` en el borde exacto de 300s → `true`

### Para la etapa E-4 (requiere entorno)

6. Signing de los requests con el secreto ficticio, contra `baseURL` del servidor local.
7. El test del caso `500` (sin `DIDIT_WEBHOOK_SECRET`) requiere un **proyecto de Playwright adicional** con `webServer.env` sin esa variable. No se puede resolver en un proyecto único.
8. `DIDIT_WEBHOOK_SECRET` en el entorno de testing debe ser **siempre ficticio**. El `.env.local` real no se crea (D-1).

### Trazabilidad

9. Cada test debe referenciar el ID de caso de `docs/testingManual/QA-DIDIT-RETIRO.md` en su `test()` (`test('K-01a ...')`) para que la cobertura sea auditable contra la matriz.
10. Ningún test escribe en Supabase. Los tests de contrato del webhook no importan cliente de Supabase en absoluto (`app/api/didit/webhook/route.ts` no lo importa).

---

## Seguridad

- **Ningún secreto real.** El secreto de los tests es una constante ficticia escrita en el archivo de test. No es una credencial: no autentica contra Didit ni contra nada.
- **No versionar secretos**: `.gitignore:34` ya ignora `.env*`. No se agrega ningún `.env` en esta etapa. La regla se mantiene en las etapas futuras.
- **No usar `SUPABASE_SERVICE_ROLE_KEY`**: no se usa en ningún test. Los tests de contrato no tocan Supabase.
- **RNF-04 (logs sin biometría)**: hoy el webhook loguea solo `session_id` + `status` (`route.ts:39`) y nunca el objeto `decision`. El caso M-02 verifica que **no se rompa** ese comportamiento al agregar la lógica de negocio. No se registra en este plan ningún cambio de logging.
- **RNF-05 (firma)**: los tests K-01 y K-02 no modifican la función; verifican que no se pueda acepta un webhook sin firma válida ni reenviar uno vencido. `timingSafeEqual` (`verify-signature.ts:51`) queda intacto.
- **No exponer `DIDIT_API_KEY`**: los tests de la etapa E-2 no usan `DIDIT_API_KEY` en absoluto (la función pura no lo necesita).

---

## Criterios de aceptación

### CA-1 — Documentación
- [x] `prompts/030-qa-didit-retiro.md` existe y sigue el formato de `AGENTS-WEB.md:24`.
- [x] `docs/testingManual/QA-DIDIT-RETIRO.md` existe y contiene los **17 casos** con los 10 campos pedidos (ID, objetivo, precondiciones, datos, pasos, resultado esperado, prioridad, estado, dependencia, automatización).
- [x] Cada caso está clasificado en exactamente una de las 4 categorías: **ejecutable actualmente / bloqueado por Sofi / bloqueado por decisión funcional / pendiente de entorno**.
- [x] Los 5 estados de RNF-12 están analizados contra los 10 `status` de Didit, con el problema de mapeo explícito.
- [x] Las 4 decisiones de Jordy están listadas como **PENDIENTES**, con la contradicción textual citada cuando existe.
- [x] Los documentos desactualizados están **registrados como hallazgo**, sin corregirlos (D-4).

### CA-2 — Etapa E-2 ✅ COMPLETADA

- [x] `npm run test:unit` corre **sin servidor, sin `.env.local` y sin conexión a Supabase**.
- [x] Los 12 casos de la sección Requisitos §1 pasan. **Nota:** la lista de §1 enumera 12 items, pero K-01a (9 casos) + K-02 (5 casos) = **14 tests**. La cobertura exigida está completa; la diferencia es de granularidad entre la lista del plan y la matriz de la QA, no un caso faltante.
- [x] El archivo de test no contiene ninguna credencial real ni lee `process.env`.
- [x] `npm run build` sigue en verde (exit 0) — los tests están fuera de `tsconfig.json:33` (R-6) y no lo afectan.
- [x] `npx tsc --noEmit` pasa (exit 0).
- [x] `npx eslint tests/unit/didit-signature.test.ts` pasa con **0 errores**.
- [ ] ⚠️ `npm run lint` **global NO pasa**. El criterio estaba redactado como "sigue en verde", pero el baseline del repositorio ya tenía **85 errores** antes de E-2 (81 `@typescript-eslint/no-explicit-any`, 2 `react/no-unescaped-entities`, 1 `@typescript-eslint/no-empty-object-type`, 1 `useForm`, 1 `render`), todos en código de la app. **`tests/05-didit-signature.test.ts` introduce 0 errores.** El criterio es literalmente insatisfacible y queda registrado como R-11.

### CA-3 — No regresión
- [x] `git status` no muestra cambios en `app/`, `lib/`, `components/`, `hooks/`, `supabase/`, `types/`, `context/`, `proxy.ts`.
- [x] Ninguna migración nueva en `supabase/migrations/`.
- [x] Ningún commit, ningún push.

---

## Chequeos

```bash
# Etapa de documentación
git status --short
# esperado: solo los 2 archivos nuevos sin trackear

# Etapa E-2 ✅ ejecutada (2026-09-29) — todos en verde
npm run test:unit
# -> 14 passed (1.4s / 1.1s / 1.0s) en 3 corridas consecutivas

npx eslint tests/unit/didit-signature.test.ts
# -> exit 0, 0 errores

npx tsc --noEmit
# -> exit 0

npm run build
# -> exit 0

npm run lint
# -> exit 1: 85 errores PREEXISTENTES en código de la app (R-11).
#    tests/unit/didit-signature.test.ts aporta 0. NO se corrigen (fuera de alcance de Meli/E-2).
```

---

## Verificación manual

### Etapa de documentación

1. Abrir `docs/testingManual/QA-DIDIT-RETIRO.md` y confirmar que los 17 casos tienen los 10 campos y una clasificación.
2. Confirmar que ninguna de las 4 decisiones de Jordy quedó resuelta en el documento.
3. Confirmar que el documento no afirma que algún caso A–D sea ejecutable hoy.

### Etapa E-2 ✅ ejecutada

Los 14 tests de `tests/unit/didit-signature.test.ts` son **automatizados** (campo `automatización` de la matriz = "Sí"), por lo que no requieren verificación manual en la app. Para re-verificar:

1. `npm run test:unit` → debe dar **14 passed / 0 failed / 0 skipped**.
2. Confirmar que los 14 nombres de test empiezan por `K-01a.` o `K-02.` (trazabilidad contra la matriz).
3. Confirmar que el archivo **no** contiene llamadas a `page.`, `request`, `process.env` ni `webServer`.
4. Confirmar que K-02.3 sigue teniendo el comentario sobre la sensibilidad de ±1s.

---

## Riesgos y deuda detectada (se documentan, no se corrigen)

| # | Hallazgo | Ubicación |
|---|---|---|
| R-1 | `playwright.config.ts` sin `webServer` → los 8 tests no-skippeados fallan con `ERR_CONNECTION_REFUSED` | `playwright.config.ts` |
| R-2 | **Corregido el 2026-09-29.** No hay "3 asserts incorrectos": hay **6 asserts que fallan de verdad** — 4 en `tests/02-nav-roles.test.ts:17,19,20,21` y 2 en `tests/03-dashboard-kpis.test.ts:19,20`. El tercero que el plan señalaba (`tests/04-auth-flow.test.ts:32`) **NO falla**. Detalle y decisión pendiente en [§12](#12-análisis-de-viabilidad-de-e-3--2026-09-29) | `tests/02`, `tests/03`, `tests/04` |
| R-3 | **Ampliado el 2026-09-29.** No es solo el webhook: `proxy.ts:7` ejecuta `createServerClient` para **toda** request que matchea `proxy.ts:52-55`, y el constructor lanza sincrónicamente si falta URL o key. Sin `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, **`/`, `/login` y `/dashboard` devuelven 500**. No hay ninguna página alcanzable → los 8 tests no-skippeados de 01–04 son **todos** verificables solo con esas variables. Para el webhook, el 500 ocurre antes de validar la firma | `proxy.ts:7` |
| R-4 | El criterio CA-5 de `prompts/016` ("sin `DIDIT_WEBHOOK_SECRET` → 500") **es inalcanzable** si tampoco faltan las vars de Supabase: el middleware falla antes. Mismo código de salida, distinto camino | `app/api/didit/webhook/route.ts:6-9` |
| R-5 | ✅ **RESUELTO el 2026-09-29.** `.gitignore` ahora ignora `playwright-report/`, `test-results/`, `dev.log`, `test-output.txt` y `test-results-summary.txt`. parcial/capa pura verificada con `git check-ignore -v` sobre las 5 rutas (exit 0). Ninguna regla previa modificada | `.gitignore:15,16,34,35,36` |
| R-6 | `tsconfig.json:33` excluye `tests` del type-check → los tests no los valida `tsc --noEmit` | `tsconfig.json:33` |
| R-7 | `@playwright/test ^1.63.0` en `dependencies` y `playwright ^1.60.0` en `devDependencies`, versiones divergentes | `package.json` |
| R-8 | `next dev` advierte que infiere mal el workspace root por múltiples `package-lock.json` (`C:\Users\melan\package-lock.json`) | consola de Next |
| R-9 | `diditWebhookSchema.environment` solo admite `live`/`sandbox`; un evento de producción sería rechazado con `400`. Comportamiento probablemente correcto, pero no está testeado ni documentado | `lib/validations/didit-webhook.schema.ts:8` |
| R-10 | Documentación desactualizada sobre audit log, variables de entorno de Didit y RNF-05 (ver §Hallazgos del documento de QA). No se corrige (D-4) | múltiples |
| R-11 | **Hallazgo de E-2.** El criterio CA-2 "npm run lint sigue en verde" es insatisfacible: el baseline del repo tiene **85 errores** (81 `no-explicit-any`, 2 `react/no-unescaped-entities`, 1 `no-empty-object-type`, 1 `useForm`, 1 `render`) en código de la app. `tests/05-didit-signature.test.ts` introduce **0**. Deuda preexistente, **no se corrige** (fuera del alcance de Meli/E-2 y de `AGENTS-WEB.md:86`, que prohíbe refactors no relacionados) | `npm run lint` |
| R-12 | **Decisión funcional PENDIENTE.** Hay que definir si `tests/02` y `tests/03` deben probar comportamiento **autenticado** o **anónimo**. Define si hace falta un usuario de Supabase con rol (entorno + Sofi) o si los tests se reconvierten a assert sobre la página de login. **Hasta que se decida, los asserts de 02 y 03 no se tocan** (ver §12) | `tests/02`, `tests/03` |
| R-13 | El comentario de `tests/02-nav-roles.test.ts:7` atribuye el redirect a `AccessGuard`. Es incorrecto: el redirect anónimo lo produce `proxy.ts:37-40`. `components/shared/AccessGuard.tsx` es un componente client de render por rol y no participa del redirect. Comentario no corregido porque tocar `tests/` excede el alcance de esta sesión | `tests/02-nav-roles.test.ts:7` |

---

## 12. Análisis de viabilidad de E-3 (2026-09-29) — ⚠️ HISTÓRICO

> **⚠️ Esta sección se escribió sobre `b4ab8e3` y analiza archivos que el `master` `84c4d23` no adoptó** (`playwright.config.ts`, `tests/01`–`04`, reglas de `.gitignore`). **Ninguno de sus ítems es trabajo pendiente**: no hay archivos sobre los que aplicar nada.
>
> **Lo que sigue vigente y así debe leerse:**
> - **§12.1 — el bloqueante raíz (sigue siendo cierto hoy).** Sin `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `proxy.ts:7` lanza y **toda ruta del matcher devuelve 500**: no hay ninguna página alcanzable. Afecta a toda la aplicación, no solo al webhook de Didit.
> - **§12.4 — la decisión funcional sigue sin tomar.** Si algún día se retoma el E2E, hay que decidir primero si prueba comportamiento **autenticado** o **anónimo**.
> - **La lección de R-a** —un test verde que pasa por el motivo equivocado es peor que un test rojo honesto— es general y no depende de estos archivos.
>
> **Lo que caduca:** el conteo de 8 tests con `ERR_CONNECTION_REFUSED` y la localización de asserts por archivo y línea (`tests/02:17,19,20,21`, `tests/03:19,20`, `tests/04:32`). Esos specs no se trasladaron, así que esos números no son accionables.

Objetivo: determinar qué de E-3 se puede hacer **sin** `NEXT_PUBLIC_SUPABASE_URL` ni `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Análisis estático (lectura de código) más dos verificaciones read-only (`git check-ignore`, grep). **No se implementó nada de E-3 en esta sesión salvo `.gitignore`.**

### 12.1 El hecho bloqueante

`proxy.ts:7` llama `createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, ...)`. Ese constructor **lanza sincrónicamente** si falta la URL o la key, y el matcher de `proxy.ts:52-55` cubre toda ruta salvo assets estáticos.

→ Sin las dos variables, **`/`, `/login` y `/dashboard` devuelven HTTP 500**. No hay ninguna página alcanzable. Por lo tanto los **8 tests no-skippeados de `tests/01`–`04` son todos verificables únicamente con esas variables** (R-3).

### 12.2 Qué ven realmente los asserts

Sin sesión, `proxy.ts:37-40` redirige **cualquier** ruta que no sea `/login` hacia `/login`. Es decir: **`/dashboard` nunca renderiza**, y los tests de `03` (y parte de `04`) están midiendo la página de login.

Texto realmente presente en `/login` — `app/(auth)/layout.tsx` y `app/layout.tsx` no agregan texto visible; `app/(auth)/login/page.tsx:8,10` aportan `"Argüello Infancias"` y `"Sistema de Gestión Residencia NNyA"`, más el `LoginForm`. **El sidebar no existe ahí**: los labels `"Inicio"`, `"NNyA"`, `"Legajos"`, `"Tutores"`, `"Referentes"` viven en `app/(dashboard)/layout.tsx:17-23` (`NAV_ALL`) y solo se renderizan con sesión y rol.

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

**Son 6 asserts que realmente fallan: 4 en `tests/02-nav-roles.test.ts:17,19,20,21` y 2 en `tests/03-dashboard-kpis.test.ts:19,20`.**

**⚠️ `tests/04-auth-flow.test.ts:32` NO falla.** El plan lo listaba como incorrecto y no lo es: `/dashboard` redirige a `/login`, y `"Argüello Infancias"` **existe** en la página de login (`app/(auth)/login/page.tsx:8`). El assert pasa hoy, pero valida el título de la página de login, no el layout del dashboard que dice verificar. **Corregirlo sería empeorarlo**, porque cementaría un test engañoso.

**Nota adicional (R-13):** el redirect anónimo lo produce `proxy.ts:37-40`, **no** `AccessGuard`. `components/shared/AccessGuard.tsx` es un componente client de render por rol y no participa del redirect.

### 12.3 Clasificación de los 4 ítems de E-3

| Clasificación | Ítem | Detalle |
|---|---|---|
| ✅ **IMPLEMENTABLE Y VERIFICABLE AHORA** | **2. `.gitignore`** | Agregar las 5 rutas. Verificable al 100% hoy con `git check-ignore -v`, sin env y sin navegador. Riesgo cero: `.gitignore:39` ya cubre `.env*` y `:56-57` ya tiene `*.sql` con su excepción, así que no hay conflicto. **Es el único ítem de E-3 cerrable por completo hoy.** → **HECHO 2026-09-29** |
| ⚠️ **IMPLEMENTABLE, VERIFICABLE PARCIALMENTE** | **1. `webServer` en `playwright.config.ts`** | Se puede escribir (es config, no app). Verificable parcialmente: se comprueba que Playwright levanta el server en vez de dar `ERR_CONNECTION_REFUSED`. **No** es verificable que algún test pase. **Efecto adverso:** hoy los tests fallan rápido y con error legible; con `webServer` pero sin env, `next dev` arranca, cada request da 500 y los 8 tests mueren por timeout de assert (30s c/u con `fullyParallel: true`) → varios minutos de ruido inútil. Es un modo de fallo **peor**, no mejor |
| 🚧 **BLOQUEADO POR DECISIÓN** | **3b. Los 6 asserts de 02/03** | Ver R-12 y §12.4. **No se tocan** |
| 🔹 **NO-OP (cerrado)** | **4. Import relativo en vez de alias `@/`** | parcial/capa pura verificada por grep: `tests/01`–`04` **no tienen ningún import de `@/`**, solo importan de `@playwright/test`. Con la migración a `node:test` esto dejó de ser opcional: el type-stripping nativo de Node **no resuelve el alias `@/`**, así que el import debe ser relativo y **con extensión `.ts`** (`../../lib/didit/verify-signature.ts`), que es lo que habilita el `allowImportingTsExtensions` que el master agregó a `tsconfig.json` |
| 🔹 **MENOR PRIORIDAD** | **3a. Borrar los 3 `const url = page.url()` muertos** | Implementable y sin riesgo, pero su único efecto observable son *warnings* de `@typescript-eslint/no-unused-vars`, y el lint global ya está rojo con 85 errores (R-11), así que no es demostrable. Diferido |

### 12.4 R-12 — Decisión funcional pendiente (bloquea los asserts de 02/03)

Antes de tocar los 6 asserts hay que definir una sola cosa: **¿`tests/02` y `tests/03` deben probar comportamiento autenticado o anónimo?**

| Opción | Implicación |
|---|---|
| **Autenticado** | Necesita un usuario de Supabase con rol → requiere **entorno** (vars) **y Sofi** (crear el usuario). Es la opción que realmente valida el sidebar y los KPIs |
| **Anónimo** | Los tests deben dejar de esperar contenido del dashboard y verificar el redirect. `tests/03` deja de ser un test de dashboard → es una **reescritura**, no una corrección |

**El arreglo "obvio" —apuntar los asserts al texto real de la página de login— es técnicamente incorrecto**: haría pasar los tests fijando comportamiento que no es el que declaran probar. Por eso **no se modifica ningún assert de 02/03 hasta que la decisión esté tomada**.

### 12.5 Atajo evaluado y descartado

Se evaluó **fabricar variables de Supabase falsas** vía `webServer.env` (sin `.env`) para destrabar los tests sin proyecto real. **Descartado** por dos razones:

1. Implica escribir una URL y una key ficticias en un archivo versionado, lo que choca con la regla de no versionar credenciales y crea un precedente que después hay que distinguir de las reales.
2. Aun si funcionara, solo destrabaría los tests de redirect: los 6 asserts de contenido de sidebar seguirían fallando porque necesitan una sesión real con rol.

No es un atajo, es una vía muerta parcial. **No parcial/capa pura verificada empíricamente**, así que no se afirma que sea imposible: se afirma que no se recomienda.

### 12.6 Estado de E-3 tras esta sesión

| Ítem | Estado |
|---|---|
| 2. `.gitignore` | ✅ **COMPLETADO y parcial/capa pura verificada** |
| 1. `webServer` | ⏳ Pendiente — se recomienda **no** hacerlo hasta tener env |
| 3b. Asserts de 02/03 | 🚧 **Bloqueado** por R-12 |
| 3a. `const url` muertos | 🔹 Diferido, sin valor demostrable |
| 4. Import relativo | ✅ **No aplica** (no-op) |

**Conclusión:** E-3 **no puede completarse ni verificarse** sin las variables de Supabase. Lo único cerrable hoy era `.gitignore`, y quedó hecho. El resto requiere entorno y, en el caso de los asserts, una decisión funcional previa.

---

## Checklist

- [x] Leer `AGENTS-WEB.md`, `CLAUDE.md` y los 3 informes del feature
- [x] Inspeccionar `app/api/didit/webhook/route.ts`, `lib/didit/verify-signature.ts`, `lib/validations/didit-webhook.schema.ts`, `proxy.ts`
- [x] Inspeccionar los tests de Playwright existentes y su resultado
- [x] Verificar empíricamente si el servidor de Next levanta sin vars de Supabase
- [x] Confirmar que no existe modelo de datos de Didit en las 38 migraciones
- [x] Escribir `prompts/030-qa-didit-retiro.md`
- [x] Escribir `docs/testingManual/QA-DIDIT-RETIRO.md` con los 17 casos
- [x] **Esperar "✓ Aprobado"**
- [x] Etapa E-2: implementar los tests de firma en `tests/unit/didit-signature.test.ts` — ✅ **14/14 passed** vía `npm run test:unit`, `eslint` y `tsc` del archivo limpios, `npm run build` verde. Lint global con 85 errores preexistentes (R-11), no corregidos.
  - [x] K-01a completado y aprobado a nivel de función
  - [x] K-02 completado y aprobado (ventana anti-replay 300s parcial/capa pura verificada en el borde)
  - [x] Observación de K-02.3 (±1s) documentada en el test, sin tocar la implementación
- [ ] Etapa E-3: reparar `playwright.config.ts` + `.gitignore` + asserts — 🚧 **parcial, BLOQUEADA por entorno**
  - [x] `.gitignore`: 5 rutas agregadas y parcial/capa pura verificadas con `git check-ignore -v` (R-5 cerrado)
  - [x] Análisis de viabilidad documentado sin env → §12
  - [x] Ítem 4 (import relativo) confirmado **no-op**: `tests/01`–`04` no usan `@/`
  - [ ] Ítem 1 (`webServer`): ⏳ diferido — empeora el modo de fallo mientras no haya env
  - [ ] Ítem 3b (6 asserts de 02/03): 🚧 bloqueado por R-12 (decisión autenticado vs anónimo)
  - [ ] Ítem 3a (3 `const url` muertos): 🔹 diferido, sin valor demostrable
- [ ] Etapa E-4: `tests/06-didit-webhook-contract.test.ts` — ⏳ **pendiente de entorno** (vars de Supabase, R-3/R-4)
- [ ] Etapa E-5: escenarios A–D — ⏳ **pendiente del modelo de Sofi**

