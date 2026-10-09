# Plan 033 — Requisitos y contrato de integración Didit (retiro + alta de referentes)

**Tarjeta:** #23 (requisitos + contrato; la implementación del webhook y los endpoints es la misma tarjeta) — Meli — Alta
**Estado:** Borrador. **Solo documentación y planificación.** No implementa endpoints, no toca migraciones, no modifica Supabase, no modifica `app/api/didit/webhook/route.ts`, no modifica tests. No se commitea ni se pushea desde este paso.

> **Fuentes.** Todo lo de este plan se reconstruye desde `TAREAS-INNOVACION-1-POR-INTEGRANTE.md`, `DECISIONES-PENDIENTES-INNOVACIONES.md`, `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md`, `INFORME-WEBHOOK-DIDIT-PARA-MELI.md`, `docs/testingManual/QA-DIDIT-RETIRO.md`, `prompts/028-modelo-datos-didit-retiros.md`, `prompts/030`, `prompts/031` y `prompts/032`, más el relevamiento de Jordy del 08/10. **El PDF fuente `practicas 3 - 02_09.pdf` no está en el repo**, así que el texto literal de la mayoría de los RF/RNF no es reconstruible: donde no hay fuente, se dice explícitamente. No se inventan requisitos ni decisiones.

---

## 1. Objetivo y alcance

### 1.1 Objetivo

Dejar por escrito, en un solo lugar y antes de que Cami diseñe y de que se escriba el `TODO(Meli)` del webhook:

1. el estado actualizado de los **requisitos funcionales (RF) y no funcionales (RNF)** de la Práctica 3 para las dos features que comparten Didit — **retiro de NNyA** y **alta de referentes** en la revinculación (proceso 1.5) — distinguiendo lo confirmado de lo pendiente;
2. las **decisiones D-1 a D-7** ya resueltas y su efecto sobre el diseño;
3. el **contrato frontend/backend** que necesita Cami para maquetar y, después, conectar las pantallas.

### 1.2 Alcance

- **Dentro:** documentación. RF/RNF, decisiones, contrato de endpoints (como *especificación planificada*), flujo de pantallas, preguntas abiertas y dependencias.
- **Fuera:** implementar cualquier endpoint, la lógica del webhook, la migración de Sofi (#18), cambios de schema/Supabase, tests, `route.ts`, la consola de Didit.

### 1.3 Aclaración importante sobre el estado

**Ningún endpoint de esta integración existe.** Hoy solo existe la **capa de seguridad** del webhook (`app/api/didit/webhook/route.ts`, HMAC `X-Signature-V2` + ventana anti-replay de 300s) y la excepción del webhook fuera de `proxy.ts` (`prompts/032`). La capa de negocio es un `TODO(Meli)` (`route.ts:41-48`) que no se puede escribir sin el modelo de datos. Todo lo que en §7 se describa como contrato es **CONTRATO PLANIFICADO: no implementado**.

### 1.4 Convención de estados usada en este documento

| Marca | Significado |
|---|---|
| ✅ **CONFIRMADO** | Decidido o verificado en las fuentes del repo. |
| 🟡 **PENDIENTE** | Reconocido como abierto; requiere una decisión de Jordy o un dato que hoy no está. |
| ⏳ **BLOQUEADO** | No puede avanzar hasta que exista el modelo de datos (#18) o la lógica del webhook (#23). |
| ◐ **PARCIALMENTE RECONSTRUIBLE** | La fuente permite afirmar el tema pero no el texto; no se le asigna significado propio. |
| ⚪ **NO RECONSTRUIBLE** | El texto fuente está en el PDF ausente; no se completa por inferencia. |

---

## 2. RF del retiro de NNyA (documento 1)

El documento 1 de la Práctica 3 trae **RF01 a RF22**, **RN-01 a RN-05** y el caso de uso "Registrar retiro" (`INFORME-VALIDACION…:18`). Como el PDF `practicas 3 - 02_09.pdf` **no está en el repo**, solo una parte de la numeración se puede confirmar. Se separa lo confirmado de lo que no, sin asignar números por inferencia.

### 2.1 Confirmados por número

| RF | Tema | Qué se sabe (fuente) | Estado |
|---|---|---|---|
| RF02 | Consulta de tutores autorizados | El sistema muestra "las personas registradas como tutores autorizados" (`DECISIONES…:160`). **Hoy no existe**: `nnya_tutores.es_principal` no representa autorización para retirar (`INFORME…:29`, `:37`). | ⏳ (#18) |
| RF03 | Identificación del tutor | Datos básicos del tutor salen de `tutores` (`nombre`, `apellido`, `dni`, `telefono`, `email`, `parentesco`) (`INFORME…:30`). | ✅ |
| RF18 | Intentos: 3 | "3 intentos máx.; al tercer fallo, revisión manual/supervisor" (`TAREAS-PENDIENTES…:25`). | ✅ |
| RF19 | Trazabilidad / auditoría | El retiro debe quedar auditado (`RF-09/RF-19` en `QA-DIDIT-RETIRO.md:159`). El `audit_log` **ya está cableado** (migración `20260915182618`, H-3) para las tablas con trigger. | ✅ (infra) / ⏳ (tabla `retiros`) |
| RF20 | Registro del retiro | El retiro se persiste con `tutor_id`, `resultado_validacion_identidad`, `resultado_autorizacion`, `cantidad_intentos`, `motivo_rechazo` (`INFORME…:38`). | ⏳ (#18) |
| RF21 | Ciclo de vida | "En curso" → "Realizada" con hora de inicio/fin; equivalente a `actividades.estado` (`INFORME…:31`). | ⏳ (#18) |
| RF22 | Cierre del retiro | Cierre con hora de finalización y estado "Realizada" (`QA-DIDIT-RETIRO.md:158-159`). | ⏳ (#18) |

### 2.2 Temas confirmados, sin número de RF confirmado

Estos temas están respaldados por decisiones o por el análisis, pero **ninguna fuente los vincula a un número de RF del documento 1**. No se les asigna número:

- **Validación de identidad** del tutor presente contra RENAPER vía Didit. El método real es `id_lookup` (DNI + selfie), **no** documento + liveness (`INFORME…:114-118`).
- **Comparación del DNI** verificado (`personal_number`) contra el esperado: un `Approved` con DNI distinto se trata como rechazo (D-14).
- **Consentimiento** del adulto (Ley 25.326). Texto exacto **sin definir** (`TAREAS-INNOVACION-1…:53`).
- **Acceso al flujo** desde "Registrar retiro".

> **Corrección de atribución (auditoría).** La **autorización para retirar** y las **"restricciones vigentes"** corresponden al **documento 2** (RF-05/RF-06 de revinculación — `TAREAS-PENDIENTES…:72`, `:58`), **no** al RF06 del documento 1. No se atribuye ese contenido al documento 1.

### 2.3 No reconstruible (pendiente de la fuente original)

- **RF01, RF04, RF05, RF06 y RF17** del documento 1: el número **no está confirmado por ninguna fuente inspeccionada** y no se les asigna significado por inferencia.
- **RF07–RF16**: idem. El análisis solo menciona que la Práctica original preveía captura de documento + prueba de vida, reemplazado por `id_lookup` (`INFORME…:114-118`); no permite atribuir cada número a un requisito.

**RN relevantes confirmadas:**

- **RN-01 (verbatim, `DECISIONES…:158`):** *"Solo podrá realizar un retiro la persona que se encuentre previamente registrada en Cielo Abierto como tutor autorizado para el NNyA correspondiente. La autorización del tutor es previa al proceso de retiro y surge de la aprobación correspondiente."* → **D-10: `retiros.tutor_id` obligatorio, solo tutores autorizados.**
- Las 2 validaciones son **independientes**: identidad válida **no** autoriza nada por sí sola (`TAREAS-PENDIENTES…:72`).

---

## 3. RF de revinculación / alta de referente (RF-01 a RF-10)

El documento 2 trae **RF-01 a RF-10** y **RNF-01 a RNF-13** (`INFORME…:19`). Solo se confirman algunos por referencia:

| RF | Tema | Qué se sabe (fuente) | Estado |
|---|---|---|---|
| RF-01–RF-04 | Detalle no reconstruible | — | ⚪ |
| RF-05 | Vínculo tutor/referente ↔ NNyA | El vínculo es el filtro previo; un DNI válido sin vínculo no habilita nada (`QA-DIDIT-RETIRO.md:274-285`). | ✅ concepto / ⏳ (#18) |
| RF-06 | Restricciones vigentes sobre el vínculo | Campo pedido explícitamente; **hoy no existe** (`TAREAS-PENDIENTES…:58`). | ⏳ (#18) |
| RF-07–RF-09 | Detalle no reconstruible | — | ⚪ |
| RF-10 | Borrado de la sesión | "Borrar la sesión en Didit una vez registrado el resultado (RF-10), **si se decide así**" (`TAREAS-INNOVACION-1…:105`). La regla de borrado figura como **desactualizada / sin definir** (`:83`). | 🟡 |

**Lo agregado por las decisiones (no eran RF del PDF, son RF nuevos — ver §4):** vínculo que queda en `propuesto` hasta validación `aprobado` (D-16), antecedentes **fuera** de alcance (D-15), reuso de `sesiones_didit` con `proposito` (D-5), y referentes que retiran solo tras alta como tutor autorizado (D-17, no cambia D-10).

---

## 4. RF nuevos (no estaban en la Práctica 3)

Estos requisitos surgen de las decisiones y del relevamiento de QA. Se separan porque son **adiciones**, no interpretaciones del PDF.

| # | RF nuevo | Fuente | Estado |
|---|---|---|---|
| N-1 | **Tope de intentos ejecutable en nuestro backend** (que nadie pida un 4º aunque Didit permita reintentar). | `TAREAS-INNOVACION-1…:84`, `QA…:450-455` | ✅ decidido / ⏳ (#18, #23) |
| N-2 | **Fallback manual** solo `Admin`, con motivo obligatorio, auditable. | D-2, `TAREAS-INNOVACION-1…:90` | ✅ decidido / ⏳ (#18, #23) |
| N-3 | **Comparar el DNI** verificado (`personal_number`) contra el esperado. | D-14 | ✅ decidido / ⏳ (#23) |
| N-4 | **Vínculo `propuesto`** hasta validación `aprobado` (referentes). | D-16 | ✅ decidido / ⏳ (#18) |
| N-5 | **Cuándo se valida:** en egreso/encuentros progresivos (proceso 1.5); ingreso (1.1) queda débil. | D-15, D-17 | ✅ decidido |
| N-6 | **Consultar el estado** de una verificación (estado RNF-12, intentos usados, motivo, si el fallback está habilitado). | `TAREAS-INNOVACION-1…:89` | 🟡 definir polling o alternativa |
| N-7 | **Dispositivo:** propio celular (QR), tablet de la residencia o PC. | `TAREAS-INNOVACION-1…:51` | 🟡 PENDIENTE DE JORDY |
| N-8 | **Consentimiento** mostrado antes de verificar. | `TAREAS-INNOVACION-1…:53` | 🟡 PENDIENTE DE JORDY |
| N-9 | **Sesión desconocida → HTTP 200 + log, sin escritura.** | D-4 | ✅ decidido / ⏳ (#23) |
| N-10 | **"Requiere revisión": quién lo atiende.** | `TAREAS-INNOVACION-1…:84` | 🟡 PENDIENTE DE JORDY |
| N-11 | **No guardar selfie/URL de selfie ni el objeto `decision`** en base ni logs. | D-13, RNF-04, D-11 | ✅ decidido / ⏳ (#23) |
| N-12 | **Un `Declined` con `fallback_from.reason = provider_error` no cuenta como intento** y habilita fallback. | D-12, D-11 | ✅ decidido / ⏳ (#23) |

---

## 5. RNF

### 5.1 Lo confirmado

| RNF | Requisito | Estado en el repo |
|---|---|---|
| RNF-01 | Credenciales Didit **solo server-side** | ✅ patrón existente (`SUPABASE_SERVICE_ROLE_KEY`); `DIDIT_API_KEY`/`DIDIT_WEBHOOK_SECRET` ya cargadas (`TAREAS-PENDIENTES…:38-39`). |
| RNF-02 | HTTPS | ✅ cubierto por Vercel. |
| RNF-03 | Acceso por rol | ✅ patrón RLS (`get_my_role()`). |
| RNF-04 | Logs **sin biometría ni credenciales** | ✅ hoy `route.ts:39` loguea solo `session_id` + `status`. A **proteger** al agregar la lógica (caso M-02). |
| RNF-05 | Validar autenticidad del webhook | ✅ implementado (HMAC + anti-replay). |
| RNF-06 / RNF-07 | Minimización de datos | 🟡/⏳ política a definir por Sofi; regla fija: **nunca** selfies, videos, plantillas biométricas ni copias de DNI. D-13 restringe además los datos que Didit devuelve. |
| RNF-08 | Datos ficticios en desarrollo | ✅ práctica del proyecto (sandbox). |
| RNF-09 | Auditoría | ✅ `audit_log` cableado (H-3); falta que `retiros`/`sesiones_didit` entren en los triggers. |
| RNF-10 / RNF-11 | ◐ **PARCIALMENTE RECONSTRUIBLE** — pendiente de fuente original | El `INFORME…:77` agrupa **RNF-10 a RNF-13** bajo "estados, timeouts, resiliencia ante fallas de Didit". **No hay texto individual de RNF-10 ni RNF-11** en las fuentes inspeccionadas: no se les asigna un significado propio por inferencia. |
| RNF-12 | 5 estados de verificación | ✅ decididos: `Pendiente de verificación`, `Identidad verificada`, `Identidad no verificada`, `Requiere revisión`, `Error del proveedor`. Mapeo desde los 10 `status` de Didit → D-1. |
| RNF-13 | Timeouts, reintentos y resiliencia ante fallas de Didit | 🟡 valores (timeout, reintentos) **a precisar** (`TAREAS-INNOVACION-1…:85`); el wrapper HTTP con `AbortSignal` es trabajo de Meli y puede escribirse sin Sofi. |

### 5.2 RNF a precisar (valores abiertos — no inventar)

- **RNF-10 y RNF-11**: contenido individual **no disponible**; solo se conoce el rótulo conjunto de `INFORME…:77`. No se completan.
- **timeout** y **reintentos** (RNF-13): sin valor definido; el proyecto no tiene precedente (`QA…:291`).
- **tiempo hasta el resultado**, **vencimiento de la sesión** (Didit: 7 días), **plazo de retención** (Didit hoy ilimitado, D-13 recomienda 30 días).
- **usabilidad móvil** (depende de N-7).
- **prueba de vida**: ¿la exige la entrega académica? Si sí, reincorporarla al workflow (`INFORME…:121`).
- **antecedentes**: fuera de alcance (D-15), pero debe quedar explícito en la letra del RNF correspondiente.

---

## 6. Decisiones D-1 a D-7

| # | Decisión (resuelta 2026-10-06, `DECISIONES…`) | Efecto |
|---|---|---|
| **D-1** | Mapeo de los 10 `status` de Didit → 5 estados de RNF-12; **vencidas/abandonadas = "Identidad no verificada"**. `Error del proveedor` **no** sale del webhook: sale de nuestro lado (timeout/error al crear sesión). | Sofi (enum/`CHECK`), Meli (webhook), Cami (badges). |
| **D-2** | El fallback manual **solo `Admin`** (vía `get_my_role()`). | `autorizado_por` restringido; Meli (RLS/validación); Cami (UI). |
| **D-3** | **1 intento = 1 sesión Didit terminada** (del mismo retiro). **D-12 la acota sin cambiar su significado:** `Declined` + `fallback_from.reason = provider_error` **no** consume intento. | `cantidad_intentos`; Meli. |
| **D-4** | `session_id` desconocido en el webhook → **HTTP `200` + log del `session_id`, sin escribir nada**. | `route.ts` TODO; Meli. |
| **D-5** | **Una tabla `sesiones_didit` compartida** con campo `proposito` (`'retiro'`, `'validacion_referente'`). | Sofi; con eso toda la Innovación 1. |
| **D-6** | Tests `02`/`03`: **separar** — anónimos ya (redirect/login), autenticados después con usuario de prueba. | Meli. |
| **D-7** | Entorno de testing de Meli: **Supabase local** con las migraciones. | Meli (E-3, E-4). Requiere Docker. |

### 6.1 Estados del QA que pasan a resueltos con estas decisiones

`docs/testingManual/QA-DIDIT-RETIRO.md` §7 dejaba 4 decisiones **PENDIENTES** (P-01 a P-04). Con D-1 a D-4 quedan resueltas:

| Pendiente del QA | Resuelta por | Consecuencia |
|---|---|---|
| **P-01** — mapeo de `status` → RNF-12 | **D-1** | Se pueden pre-crear E-01 a E-05; se define la regla del fallback (solo `Error del proveedor` o agotar 3 intentos; **nunca** una sesión vencida/abandonada). |
| **P-02** — quién hace el fallback | **D-2** | G-01 pasa a ser un `403` verificable para todo rol ≠ `Admin`. |
| **P-03** — `session_id` inexistente | **D-4** | L-01 con resultado esperado `200` + log, sin escritura. |
| **P-04** — alcance del contador de intentos | **D-3** (+D-12) | F-01/F-02 con regla testeable: por retiro, 1 intento = 1 sesión terminada. |

Además, la **decisión pendiente de auth** del QA §12.4 queda cubierta por **D-6**, y el bloqueante de entorno por **D-7**.

### 6.2 D-12 prevalece sobre el supuesto anterior del Plan 028

`prompts/028` (supuestos 8-9, líneas 101-107) enumera como intento terminado a `Approved`, `Declined`, `Expired`, `Abandoned` y `Kyc Expired`, y deja `In Review` fuera. Ese plan se aprobó sobre **D-1 a D-10 (06/10)**, **antes** de que existieran D-11 a D-14.

**D-12 (07/10) prevalece** sobre ese supuesto del Plan 028. Concretamente:

- Un `Declined` con `fallback_from.reason = 'provider_error'` se clasifica como **`Error del proveedor`** (no como "Identidad no verificada").
- **No consume intento.**
- **Puede habilitar el fallback manual** según D-2.
- La **función de conteo del modelo (#18) deberá exceptuar `provider_error`** del resto de los `Declined` (ya bajado a tarea en `TAREAS-INNOVACION-1-POR-INTEGRANTE.md:69`).
- El **Plan 028 quedó desactualizado únicamente en ese punto**; el resto de sus supuestos sigue vigente. **No se modifica el Plan 028 en este paso.**

`Expired`, `Abandoned` y `Kyc Expired` siguen contando como intento (D-1/D-3): lo único que D-12 exceptúa es el `Declined` originado en una falla de RENAPER.

---

## 7. Contrato para Cami — PRIORIDAD

> **CONTRATO PLANIFICADO. Nada de esto está implementado.** Se documenta para que Cami pueda maquetar y planificar la conexión. Rutas y formatos son propuesta de plan, no código existente. Roles: todos los endpoints requieren sesión; el fallback, `Admin`.

### 7.1 Crear una sesión de verificación

- **Método/ruta (propuesto):** `POST /api/didit/sesiones`
- **Rol:** autenticado (`Admin` / `Equipo Tecnico`).
- **Request (propuesto):** `{ proposito: 'retiro' | 'validacion_referente', retiro_id?: uuid, referente_id?: uuid }` — exactamente uno de los dos ids según `proposito`.
- **Qué hace (planificado):** toma el DNI **desde la base** (`tutores.dni` o `referentes.dni`), lo envía en `expected_details.identification_number` (D-14), manda nuestro id interno en `vendor_data` (D-4/D-5), aplica timeout/manejo de errores (RNF-13).
- **Response 200 (propuesto):** `{ sesion_id, url_didit | token, intentos_usados, intentos_restantes }`.
- **Si Didit falla:** registrar estado `Error del proveedor` **sin `session_id`** (`TAREAS-INNOVACION-1…:94`); responder error controlado, nunca 500 sin manejar (RNF-13).
- **Si se agotaron los 3 intentos:** rechazar **antes de llamar a Didit** (F-01).
- **Estado:** ⏳ bloqueado por #18 (tabla `sesiones_didit`).

### 7.2 Consultar el estado

- **Método/ruta (propuesto):** `GET /api/didit/sesiones/{sesion_id}`
- **Response (propuesto):** `{ estado_rnf12, intentos_usados, motivo?, fallback_habilitado }` (`TAREAS-INNOVACION-1…:89`).
- **Polling:** `¿polling o alternativa?` → **PENDIENTE DE JORDY** (N-6). No se define el intervalo sin esa decisión.
- **Estado:** ⏳ bloqueado por #18 y la decisión de polling.

### 7.3 Fallback manual

- **Método/ruta (propuesto):** `POST /api/didit/sesiones/{sesion_id}/fallback`
- **Rol:** **solo `Admin`** (D-2). Cualquier otro rol → `403`.
- **Request:** `{ motivo: string }` (**obligatorio**).
- **Cuándo está disponible:** solo con `Error del proveedor` o al agotar los 3 intentos. **Nunca** con `Identidad no verificada` (un `Declined` no es indisponibilidad) — `QA…:254`.
- **Efecto:** setea `autorizado_por` (auditado) y habilita el retiro/validación.
- **Estado:** ⏳ bloqueado por #18.

### 7.4 Errores que recibe la pantalla

Los 4 mensajes A–D de la Práctica 3 §6 se usan **tal cual están escritos** (`TAREAS-PENDIENTES…:85`), pero **el copy literal no está en el repo inspeccionado**: se lo referencia sin reproducirlo. Se agrega un **código estable** propuesto para que el frontend discrimine sin depender del texto.

| Caso | `code` propuesto | `estado_rnf12` | `resultado_autorizacion` | Copy de UI |
|---|---|---|---|---|
| A — identidad válida + autorizado | `IDENTITY_VERIFIED_AUTHORIZED` | `Identidad verificada` | `Autorizado` | literal A de la Práctica 3 (**no disponible en el repo**) |
| B — identidad inválida | `IDENTITY_NOT_VERIFIED` | `Identidad no verificada` | — | literal B (**no disponible**) |
| C — identidad válida + no autorizado | `IDENTITY_VERIFIED_NOT_AUTHORIZED` | `Identidad verificada` | `No autorizado` | literal C (**no disponible**) |
| D — Didit caído / timeout | `PROVIDER_ERROR` | `Error del proveedor` | — | literal D (**no disponible**) |
| DNI no coincide | `DNI_MISMATCH` | (rechazo, comparación `personal_number`; ver D-14) | — | **propuesta / pendiente** (D-14 confirma el comportamiento, **no** el copy) |
| `Requiere revisión` | `REQUIRES_REVIEW` | `Requiere revisión` | — | **propuesta / pendiente** (quién lo atiende: N-10) |
| Máximo de intentos | `MAX_ATTEMPTS_REACHED` | — | — | **propuesta / pendiente** |
| Fallback disponible | `FALLBACK_AVAILABLE` | — | — | — |

### 7.5 Envelope y códigos estables — **PROPUESTA DE CONTRATO — NO IMPLEMENTADA**

> Los nombres de código de esta sección son **propuesta de Meli, sujetos a aprobación**. **No** son una decisión previa de Jordy. **No** se afirma que este JSON ya exista ni que esté implementado.

Envelope propuesto (conceptual, a acordar antes de implementar). Separa lo machine-readable del copy de UI, que puede quedar pendiente:

```
{
  code,                      // código estable, machine-readable (tabla §7.4)
  estado_rnf12,              // uno de los 5 estados de RNF-12
  resultado_autorizacion,    // 'Autorizado' | 'No autorizado' | null (cuando corresponda)
  message,                   // copy de UI; puede quedar pendiente
  fallback_habilitado,       // boolean
  intentos_usados            // entero
}
```

- **`code`** es lo que el frontend debe usar para ramificar; **`message`** es solo presentación y puede cambiar.
- El envelope aplica tanto a respuestas exitosas de sesión como a errores controlados.
- **Pendiente:** copy exacto de `DNI_MISMATCH`, `REQUIRES_REVIEW` y `MAX_ATTEMPTS_REACHED`.

### 7.6 Notas de contrato

- **Idempotencia:** la reentrega del mismo evento por Didit no debe duplicar efectos ni degradar un estado terminal (`QA…:355-366`). Se diseña **antes** de escribir la lógica.
- **`Requiere revisión`:** con `id_lookup` Didit **no lo emite**; solo se alcanza por el fallback manual propio (`QA…:392`). El badge igual debe existir (RNF-12).
- **No exponer internals:** los mensajes de error no filtran detalles del proveedor (RNF-04).

---

## 8. Flujo completo para Cami

### 8.1 Retiro (pantalla "Registrar retiro")

1. Selección de **NNyA** → lista de **tutores con autorización vigente** (y restricciones visibles) (RF02 / N-4).
2. Personal presente: identificación del tutor.
3. **Consentimiento** (N-8 — texto PENDIENTE).
4. **Verificación** según dispositivo (N-7 — PENDIENTE): DNI + selfie vía Didit; "esperando resultado" con intentos restantes.
5. **Resultado** con uno de los 5 estados RNF-12 y el mensaje A–D correspondiente.
6. Si aplica: **fallback manual** (solo `Admin`, con motivo).
7. **Registro:** hora de inicio, descripción y observaciones → "Registrar retiro" (RF20/21).
8. **Cierre:** hora de finalización + "Realizada" (RF22).

**Dependencias del flujo:** pasos 1, 7 y 8 dependen de **#18**; pasos 3–6 dependen de **#23**. Hasta entonces **solo se maqueta con datos de ejemplo**.

### 8.2 Alta / validación de referente

1. Vínculo de revinculación/referente afectivo → queda en **`propuesto`** (D-16).
2. "Validar identidad" con Didit reemplaza la carga manual `ValidarRenaperForm` (`TAREAS-INNOVACION-1…:124`).
3. Resultado: `aprobado` habilita el paso del vínculo a `vigente`; `rechazado` o `no_concluyente` no.
4. Se crea la fila de `validaciones_renaper` **sin `respuesta_cruda`** de Didit (D-11, D-13).
5. Mismo webhook y misma tabla `sesiones_didit` (`proposito = 'validacion_referente'`).

**Dependencias:** todo depende de **#18** y **#23** (y del trigger de D-16, que va en la migración de Sofi).

---

## 9. Preguntas abiertas

Ninguna se resuelve en este plan. Se agrupan por quién decide:

### A. Decide Jordy / Producto

1. **Dispositivo** (QR / tablet / PC) — N-7.
2. **Prueba de vida** ¿la exige la entrega? — §5.2.
3. **Texto de consentimiento** — N-8.
4. **Polling o alternativa** para consultar estado — N-6.
5. **Quién atiende "Requiere revisión"** — N-10.
6. **Borrado inmediato de la sesión en Didit vs retención** (RF-10) — §3.
7. **¿Los RNF aplican también al retiro** o solo a revinculación? — a chequear contra el PDF (la numeración del doc 2 es RNF-01..13).
8. **Workflow v3 / returned data / retención en la consola** (D-13): publicar v3 con `max_attempts:1` (D-12) y confirmar que no agrega liveness ni face match.

### B. Propone Meli / contrato técnico

1. **`expected_details` / `vendor_data`**: confirmar el campo exacto y que nuestro id interno llega en el webhook (a validar contra Didit).
2. **Timeout y reintentos** (RNF-13): valor técnico propuesto, sujeto a aprobación.
3. **Envelope y códigos estables** de §7.4/§7.5 (propuesta de Meli, no decisión de Jordy).
4. **Idempotencia** de la reentrega del webhook (§7.6).
5. **Implementación concreta del polling**, si Jordy elige polling (N-6).

### C. Depende de Sofi / #18

1. **Modelo** `retiros` / `sesiones_didit` / `autorizaciones_retiro`.
2. **Trigger de D-16** (alta de referente en `propuesto`).
3. **Estrategia RLS / escritura del webhook.**
4. **Conteo de intentos** con la excepción `provider_error` (D-12).
5. **Integración / mapeo hacia `validaciones_renaper`** (D-11, D-13).

---

## 10. Dependencias

```
Jordy (consola Didit + N-7/N-8/N-10 + timeout)
        │
Sofi ── migración #18 (retiros, sesiones_didit, autorizaciones_retiro, trigger D-16)
        │                              │
Meli ── requisitos + contrato (ESTE PLAN) ──► #23 webhook + endpoints ──► tests
        │                                                      │
Cami ── diseño con datos de ejemplo ──────────────► #26 pantallas conectadas
```

- **#18 bloquea #23:** sin tablas no se escribe el `TODO(Meli)` ni los endpoints.
- **#23 no se implementa en este paso.** Este plan solo lo especifica.
- **E-4 (contrato del webhook por HTTP) es independiente** de #18/#23 en su parte de capa pura; falta el `POST` real. No se toca acá.
- **Cami** puede maquetar con datos de ejemplo **cuando este contrato esté aprobado**, sin esperar #23.
- **Jordy**: publicar v3 del workflow y las definiciones de N-7/N-8/N-10.

---

## Verificación de este plan

- [x] No se implementó ningún endpoint ni se tocó `route.ts`, migraciones ni Supabase.
- [x] No se afirma que existan endpoints: todo §7 está marcado **CONTRATO PLANIFICADO**.
- [x] Los pendientes están marcados 🟡 / ⏳ / ◐ / ⚪; no se presentan como confirmados.
- [x] Consistente con D-1 a D-7, con el Plan 028 y con el Plan 032.
- [x] **D-12 prevalece** sobre el supuesto 8-9 del Plan 028 (§6.2); el Plan 028 no se modifica.
- [x] No hay RF numerados con significado inventado (§2.1 confirmados / §2.2 sin número / §2.3 no reconstruible).
- [x] RNF-10 / RNF-11 quedan ◐ sin texto inventado (§5.1, §5.2).
- [x] Los códigos y el envelope de §7.4/§7.5 están marcados **PROPUESTA DE CONTRATO — NO IMPLEMENTADA**.
- [x] No commit, no push.
