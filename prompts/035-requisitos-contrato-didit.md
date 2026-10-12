# Plan 035 â€” Requisitos y contrato de integraciÃ³n Didit (retiro + alta de referentes)

**Tarjeta:** #23 (requisitos + contrato; la implementaciÃ³n del webhook y los endpoints es la misma tarjeta) â€” Meli â€” Alta
**Estado:** Borrador. **Solo documentaciÃ³n y planificaciÃ³n.** No implementa endpoints, no toca migraciones, no modifica Supabase, no modifica `app/api/didit/webhook/route.ts`, no modifica tests. No se commitea ni se pushea desde este paso.

> **Fuentes.** Todo lo de este plan se reconstruye desde `TAREAS-INNOVACION-1-POR-INTEGRANTE.md`, `DECISIONES-PENDIENTES-INNOVACIONES.md`, `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md`, `INFORME-WEBHOOK-DIDIT-PARA-MELI.md`, `docs/testingManual/QA-DIDIT-RETIRO.md`, `prompts/028-modelo-datos-didit-retiros.md`, `prompts/030`, `prompts/031` y `prompts/032`, mÃ¡s el relevamiento de Jordy del 08/10. **El PDF fuente `practicas 3 - 02_09.pdf` no estÃ¡ en el repo**, asÃ­ que el texto literal de la mayorÃ­a de los RF/RNF no es reconstruible: donde no hay fuente, se dice explÃ­citamente. No se inventan requisitos ni decisiones.

---

## 1. Objetivo y alcance

### 1.1 Objetivo

Dejar por escrito, en un solo lugar y antes de que Cami diseÃ±e y de que se escriba el `TODO(Meli)` del webhook:

1. el estado actualizado de los **requisitos funcionales (RF) y no funcionales (RNF)** de la PrÃ¡ctica 3 para las dos features que comparten Didit â€” **retiro de NNyA** y **alta de referentes** en la revinculaciÃ³n (proceso 1.5) â€” distinguiendo lo confirmado de lo pendiente;
2. las **decisiones D-1 a D-7** ya resueltas y su efecto sobre el diseÃ±o;
3. el **contrato frontend/backend** que necesita Cami para maquetar y, despuÃ©s, conectar las pantallas.

### 1.2 Alcance

- **Dentro:** documentaciÃ³n. RF/RNF, decisiones, contrato de endpoints (como *especificaciÃ³n planificada*), flujo de pantallas, preguntas abiertas y dependencias.
- **Fuera:** implementar cualquier endpoint, la lÃ³gica del webhook, la migraciÃ³n de Sofi (#18), cambios de schema/Supabase, tests, `route.ts`, la consola de Didit.

### 1.3 AclaraciÃ³n importante sobre el estado

**NingÃºn endpoint de esta integraciÃ³n existe.** Hoy solo existe la **capa de seguridad** del webhook (`app/api/didit/webhook/route.ts`, HMAC `X-Signature-V2` + ventana anti-replay de 300s) y la excepciÃ³n del webhook fuera de `proxy.ts` (`prompts/032`). La capa de negocio es un `TODO(Meli)` (`route.ts:41-48`) que no se puede escribir sin el modelo de datos. Todo lo que en Â§7 se describa como contrato es **CONTRATO PLANIFICADO: no implementado**.

### 1.4 ConvenciÃ³n de estados usada en este documento

| Marca | Significado |
|---|---|
| âœ… **CONFIRMADO** | Decidido o verificado en las fuentes del repo. |
| ðŸŸ¡ **PENDIENTE** | Reconocido como abierto; requiere una decisiÃ³n de Jordy o un dato que hoy no estÃ¡. |
| â³ **BLOQUEADO** | No puede avanzar hasta que exista el modelo de datos (#18) o la lÃ³gica del webhook (#23). |
| â— **PARCIALMENTE RECONSTRUIBLE** | La fuente permite afirmar el tema pero no el texto; no se le asigna significado propio. |
| âšª **NO RECONSTRUIBLE** | El texto fuente estÃ¡ en el PDF ausente; no se completa por inferencia. |

---

## 2. RF del retiro de NNyA (documento 1)

El documento 1 de la PrÃ¡ctica 3 trae **RF01 a RF22**, **RN-01 a RN-05** y el caso de uso "Registrar retiro" (`INFORME-VALIDACIONâ€¦:18`). Como el PDF `practicas 3 - 02_09.pdf` **no estÃ¡ en el repo**, solo una parte de la numeraciÃ³n se puede confirmar. Se separa lo confirmado de lo que no, sin asignar nÃºmeros por inferencia.

### 2.1 Confirmados por nÃºmero

| RF | Tema | QuÃ© se sabe (fuente) | Estado |
|---|---|---|---|
| RF02 | Consulta de tutores autorizados | El sistema muestra "las personas registradas como tutores autorizados" (`DECISIONESâ€¦:160`). **Hoy no existe**: `nnya_tutores.es_principal` no representa autorizaciÃ³n para retirar (`INFORMEâ€¦:29`, `:37`). | â³ (#18) |
| RF03 | IdentificaciÃ³n del tutor | Datos bÃ¡sicos del tutor salen de `tutores` (`nombre`, `apellido`, `dni`, `telefono`, `email`, `parentesco`) (`INFORMEâ€¦:30`). | âœ… |
| RF18 | Intentos: 3 | "3 intentos mÃ¡x.; al tercer fallo, revisiÃ³n manual/supervisor" (`TAREAS-PENDIENTESâ€¦:25`). | âœ… |
| RF19 | Trazabilidad / auditorÃ­a | El retiro debe quedar auditado (`RF-09/RF-19` en `QA-DIDIT-RETIRO.md:159`). El `audit_log` **ya estÃ¡ cableado** (migraciÃ³n `20260915182618`, H-3) para las tablas con trigger. | âœ… (infra) / â³ (tabla `retiros`) |
| RF20 | Registro del retiro | El retiro se persiste con `tutor_id`, `resultado_validacion_identidad`, `resultado_autorizacion`, `cantidad_intentos`, `motivo_rechazo` (`INFORMEâ€¦:38`). | â³ (#18) |
| RF21 | Ciclo de vida | "En curso" â†’ "Realizada" con hora de inicio/fin; equivalente a `actividades.estado` (`INFORMEâ€¦:31`). | â³ (#18) |
| RF22 | Cierre del retiro | Cierre con hora de finalizaciÃ³n y estado "Realizada" (`QA-DIDIT-RETIRO.md:158-159`). | â³ (#18) |

### 2.2 Temas confirmados, sin nÃºmero de RF confirmado

Estos temas estÃ¡n respaldados por decisiones o por el anÃ¡lisis, pero **ninguna fuente los vincula a un nÃºmero de RF del documento 1**. No se les asigna nÃºmero:

- **ValidaciÃ³n de identidad** del tutor presente contra RENAPER vÃ­a Didit. El mÃ©todo real es `id_lookup` (DNI + selfie), **no** documento + liveness (`INFORMEâ€¦:114-118`).
- **ComparaciÃ³n del DNI** verificado (`personal_number`) contra el esperado: un `Approved` con DNI distinto se trata como rechazo (D-14).
- **Consentimiento** del adulto (Ley 25.326). Texto exacto **sin definir** (`TAREAS-INNOVACION-1â€¦:53`).
- **Acceso al flujo** desde "Registrar retiro".

> **CorrecciÃ³n de atribuciÃ³n (auditorÃ­a).** La **autorizaciÃ³n para retirar** y las **"restricciones vigentes"** corresponden al **documento 2** (RF-05/RF-06 de revinculaciÃ³n â€” `TAREAS-PENDIENTESâ€¦:72`, `:58`), **no** al RF06 del documento 1. No se atribuye ese contenido al documento 1.

### 2.3 No reconstruible (pendiente de la fuente original)

- **RF01, RF04, RF05, RF06 y RF17** del documento 1: el nÃºmero **no estÃ¡ confirmado por ninguna fuente inspeccionada** y no se les asigna significado por inferencia.
- **RF07â€“RF16**: idem. El anÃ¡lisis solo menciona que la PrÃ¡ctica original preveÃ­a captura de documento + prueba de vida, reemplazado por `id_lookup` (`INFORMEâ€¦:114-118`); no permite atribuir cada nÃºmero a un requisito.

**RN relevantes confirmadas:**

- **RN-01 (verbatim, `DECISIONESâ€¦:158`):** *"Solo podrÃ¡ realizar un retiro la persona que se encuentre previamente registrada en Cielo Abierto como tutor autorizado para el NNyA correspondiente. La autorizaciÃ³n del tutor es previa al proceso de retiro y surge de la aprobaciÃ³n correspondiente."* â†’ **D-10: `retiros.tutor_id` obligatorio, solo tutores autorizados.**
- Las 2 validaciones son **independientes**: identidad vÃ¡lida **no** autoriza nada por sÃ­ sola (`TAREAS-PENDIENTESâ€¦:72`).

---

## 3. RF de revinculaciÃ³n / alta de referente (RF-01 a RF-10)

El documento 2 trae **RF-01 a RF-10** y **RNF-01 a RNF-13** (`INFORMEâ€¦:19`). Solo se confirman algunos por referencia:

| RF | Tema | QuÃ© se sabe (fuente) | Estado |
|---|---|---|---|
| RF-01â€“RF-04 | Detalle no reconstruible | â€” | âšª |
| RF-05 | VÃ­nculo tutor/referente â†” NNyA | El vÃ­nculo es el filtro previo; un DNI vÃ¡lido sin vÃ­nculo no habilita nada (`QA-DIDIT-RETIRO.md:274-285`). | âœ… concepto / â³ (#18) |
| RF-06 | Restricciones vigentes sobre el vÃ­nculo | Campo pedido explÃ­citamente; **hoy no existe** (`TAREAS-PENDIENTESâ€¦:58`). | â³ (#18) |
| RF-07â€“RF-09 | Detalle no reconstruible | â€” | âšª |
| RF-10 | Borrado de la sesiÃ³n | "Borrar la sesiÃ³n en Didit una vez registrado el resultado (RF-10), **si se decide asÃ­**" (`TAREAS-INNOVACION-1â€¦:105`). La regla de borrado figura como **desactualizada / sin definir** (`:83`). | ðŸŸ¡ |

**Lo agregado por las decisiones (no eran RF del PDF, son RF nuevos â€” ver Â§4):** vÃ­nculo que queda en `propuesto` hasta validaciÃ³n `aprobado` (D-16), antecedentes **fuera** de alcance (D-15), reuso de `sesiones_didit` con `proposito` (D-5), y referentes que retiran solo tras alta como tutor autorizado (D-17, no cambia D-10).

---

## 4. RF nuevos (no estaban en la PrÃ¡ctica 3)

Estos requisitos surgen de las decisiones y del relevamiento de QA. Se separan porque son **adiciones**, no interpretaciones del PDF.

| # | RF nuevo | Fuente | Estado |
|---|---|---|---|
| N-1 | **Tope de intentos ejecutable en nuestro backend** (que nadie pida un 4Âº aunque Didit permita reintentar). | `TAREAS-INNOVACION-1â€¦:84`, `QAâ€¦:450-455` | âœ… decidido / â³ (#18, #23) |
| N-2 | **Fallback manual** solo `Admin`, con motivo obligatorio, auditable. | D-2, `TAREAS-INNOVACION-1â€¦:90` | âœ… decidido / â³ (#18, #23) |
| N-3 | **Comparar el DNI** verificado (`personal_number`) contra el esperado. | D-14 | âœ… decidido / â³ (#23) |
| N-4 | **VÃ­nculo `propuesto`** hasta validaciÃ³n `aprobado` (referentes). | D-16 | âœ… decidido / â³ (#18) |
| N-5 | **CuÃ¡ndo se valida:** en egreso/encuentros progresivos (proceso 1.5); ingreso (1.1) queda dÃ©bil. | D-15, D-17 | âœ… decidido |
| N-6 | **Consultar el estado** de una verificaciÃ³n (estado RNF-12, intentos usados, motivo, si el fallback estÃ¡ habilitado). | `TAREAS-INNOVACION-1â€¦:89` | ðŸŸ¡ definir polling o alternativa |
| N-7 | **Dispositivo:** propio celular (QR), tablet de la residencia o PC. | `TAREAS-INNOVACION-1â€¦:51` | ðŸŸ¡ PENDIENTE DE JORDY |
| N-8 | **Consentimiento** mostrado antes de verificar. | `TAREAS-INNOVACION-1â€¦:53` | ðŸŸ¡ PENDIENTE DE JORDY |
| N-9 | **SesiÃ³n desconocida â†’ HTTP 200 + log, sin escritura.** | D-4 | âœ… decidido / â³ (#23) |
| N-10 | **"Requiere revisiÃ³n": quiÃ©n lo atiende.** | `TAREAS-INNOVACION-1â€¦:84` | ðŸŸ¡ PENDIENTE DE JORDY |
| N-11 | **No guardar selfie/URL de selfie ni el objeto `decision`** en base ni logs. | D-13, RNF-04, D-11 | âœ… decidido / â³ (#23) |
| N-12 | **Un `Declined` con `fallback_from.reason = provider_error` no cuenta como intento** y habilita fallback. | D-12, D-11 | âœ… decidido / â³ (#23) |

---

## 5. RNF

### 5.1 Lo confirmado

| RNF | Requisito | Estado en el repo |
|---|---|---|
| RNF-01 | Credenciales Didit **solo server-side** | âœ… patrÃ³n existente (`SUPABASE_SERVICE_ROLE_KEY`); `DIDIT_API_KEY`/`DIDIT_WEBHOOK_SECRET` ya cargadas (`TAREAS-PENDIENTESâ€¦:38-39`). |
| RNF-02 | HTTPS | âœ… cubierto por Vercel. |
| RNF-03 | Acceso por rol | âœ… patrÃ³n RLS (`get_my_role()`). |
| RNF-04 | Logs **sin biometrÃ­a ni credenciales** | âœ… hoy `route.ts:39` loguea solo `session_id` + `status`. A **proteger** al agregar la lÃ³gica (caso M-02). |
| RNF-05 | Validar autenticidad del webhook | âœ… implementado (HMAC + anti-replay). |
| RNF-06 / RNF-07 | MinimizaciÃ³n de datos | ðŸŸ¡/â³ polÃ­tica a definir por Sofi; regla fija: **nunca** selfies, videos, plantillas biomÃ©tricas ni copias de DNI. D-13 restringe ademÃ¡s los datos que Didit devuelve. |
| RNF-08 | Datos ficticios en desarrollo | âœ… prÃ¡ctica del proyecto (sandbox). |
| RNF-09 | AuditorÃ­a | âœ… `audit_log` cableado (H-3); falta que `retiros`/`sesiones_didit` entren en los triggers. |
| RNF-10 / RNF-11 | â— **PARCIALMENTE RECONSTRUIBLE** â€” pendiente de fuente original | El `INFORMEâ€¦:77` agrupa **RNF-10 a RNF-13** bajo "estados, timeouts, resiliencia ante fallas de Didit". **No hay texto individual de RNF-10 ni RNF-11** en las fuentes inspeccionadas: no se les asigna un significado propio por inferencia. |
| RNF-12 | 5 estados de verificaciÃ³n | âœ… decididos: `Pendiente de verificaciÃ³n`, `Identidad verificada`, `Identidad no verificada`, `Requiere revisiÃ³n`, `Error del proveedor`. Mapeo desde los 10 `status` de Didit â†’ D-1. |
| RNF-13 | Timeouts, reintentos y resiliencia ante fallas de Didit | ðŸŸ¡ valores (timeout, reintentos) **a precisar** (`TAREAS-INNOVACION-1â€¦:85`); el wrapper HTTP con `AbortSignal` es trabajo de Meli y puede escribirse sin Sofi. |

### 5.2 RNF a precisar (valores abiertos â€” no inventar)

- **RNF-10 y RNF-11**: contenido individual **no disponible**; solo se conoce el rÃ³tulo conjunto de `INFORMEâ€¦:77`. No se completan.
- **timeout** y **reintentos** (RNF-13): sin valor definido; el proyecto no tiene precedente (`QAâ€¦:291`).
- **tiempo hasta el resultado**, **vencimiento de la sesiÃ³n** (Didit: 7 dÃ­as), **plazo de retenciÃ³n** (Didit hoy ilimitado, D-13 recomienda 30 dÃ­as).
- **usabilidad mÃ³vil** (depende de N-7).
- **prueba de vida**: Â¿la exige la entrega acadÃ©mica? Si sÃ­, reincorporarla al workflow (`INFORMEâ€¦:121`).
- **antecedentes**: fuera de alcance (D-15), pero debe quedar explÃ­cito en la letra del RNF correspondiente.

---

## 6. Decisiones D-1 a D-7

| # | DecisiÃ³n (resuelta 2026-10-06, `DECISIONESâ€¦`) | Efecto |
|---|---|---|
| **D-1** | Mapeo de los 10 `status` de Didit â†’ 5 estados de RNF-12; **vencidas/abandonadas = "Identidad no verificada"**. `Error del proveedor` **no** sale del webhook: sale de nuestro lado (timeout/error al crear sesiÃ³n). | Sofi (enum/`CHECK`), Meli (webhook), Cami (badges). |
| **D-2** | El fallback manual **solo `Admin`** (vÃ­a `get_my_role()`). | `autorizado_por` restringido; Meli (RLS/validaciÃ³n); Cami (UI). |
| **D-3** | **1 intento = 1 sesiÃ³n Didit terminada** (del mismo retiro). **D-12 la acota sin cambiar su significado:** `Declined` + `fallback_from.reason = provider_error` **no** consume intento. | `cantidad_intentos`; Meli. |
| **D-4** | `session_id` desconocido en el webhook â†’ **HTTP `200` + log del `session_id`, sin escribir nada**. | `route.ts` TODO; Meli. |
| **D-5** | **Una tabla `sesiones_didit` compartida** con campo `proposito` (`'retiro'`, `'validacion_referente'`). | Sofi; con eso toda la InnovaciÃ³n 1. |
| **D-6** | Tests `02`/`03`: **separar** â€” anÃ³nimos ya (redirect/login), autenticados despuÃ©s con usuario de prueba. | Meli. |
| **D-7** | Entorno de testing de Meli: **Supabase local** con las migraciones. | Meli (E-3, E-4). Requiere Docker. |

### 6.1 Estados del QA que pasan a resueltos con estas decisiones

`docs/testingManual/QA-DIDIT-RETIRO.md` Â§7 dejaba 4 decisiones **PENDIENTES** (P-01 a P-04). Con D-1 a D-4 quedan resueltas:

| Pendiente del QA | Resuelta por | Consecuencia |
|---|---|---|
| **P-01** â€” mapeo de `status` â†’ RNF-12 | **D-1** | Se pueden pre-crear E-01 a E-05; se define la regla del fallback (solo `Error del proveedor` o agotar 3 intentos; **nunca** una sesiÃ³n vencida/abandonada). |
| **P-02** â€” quiÃ©n hace el fallback | **D-2** | G-01 pasa a ser un `403` verificable para todo rol â‰  `Admin`. |
| **P-03** â€” `session_id` inexistente | **D-4** | L-01 con resultado esperado `200` + log, sin escritura. |
| **P-04** â€” alcance del contador de intentos | **D-3** (+D-12) | F-01/F-02 con regla testeable: por retiro, 1 intento = 1 sesiÃ³n terminada. |

AdemÃ¡s, la **decisiÃ³n pendiente de auth** del QA Â§12.4 queda cubierta por **D-6**, y el bloqueante de entorno por **D-7**.

### 6.2 D-12 prevalece sobre el supuesto anterior del Plan 028

`prompts/028` (supuestos 8-9, lÃ­neas 101-107) enumera como intento terminado a `Approved`, `Declined`, `Expired`, `Abandoned` y `Kyc Expired`, y deja `In Review` fuera. Ese plan se aprobÃ³ sobre **D-1 a D-10 (06/10)**, **antes** de que existieran D-11 a D-14.

**D-12 (07/10) prevalece** sobre ese supuesto del Plan 028. Concretamente:

- Un `Declined` con `fallback_from.reason = 'provider_error'` se clasifica como **`Error del proveedor`** (no como "Identidad no verificada").
- **No consume intento.**
- **Puede habilitar el fallback manual** segÃºn D-2.
- La **funciÃ³n de conteo del modelo (#18) deberÃ¡ exceptuar `provider_error`** del resto de los `Declined` (ya bajado a tarea en `TAREAS-INNOVACION-1-POR-INTEGRANTE.md:69`).
- El **Plan 028 quedÃ³ desactualizado Ãºnicamente en ese punto**; el resto de sus supuestos sigue vigente. **No se modifica el Plan 028 en este paso.**

`Expired`, `Abandoned` y `Kyc Expired` siguen contando como intento (D-1/D-3): lo Ãºnico que D-12 exceptÃºa es el `Declined` originado en una falla de RENAPER.

---

## 7. Contrato para Cami â€” PRIORIDAD

> **CONTRATO PLANIFICADO. Nada de esto estÃ¡ implementado.** Se documenta para que Cami pueda maquetar y planificar la conexiÃ³n. Rutas y formatos son propuesta de plan, no cÃ³digo existente. Roles: todos los endpoints requieren sesiÃ³n; el fallback, `Admin`.

### 7.1 Crear una sesiÃ³n de verificaciÃ³n

- **MÃ©todo/ruta (propuesto):** `POST /api/didit/sesiones`
- **Rol:** autenticado (`Admin` / `Equipo Tecnico`).
- **Request (propuesto):** `{ proposito: 'retiro' | 'validacion_referente', retiro_id?: uuid, referente_id?: uuid }` â€” exactamente uno de los dos ids segÃºn `proposito`.
- **QuÃ© hace (planificado):** toma el DNI **desde la base** (`tutores.dni` o `referentes.dni`), lo envÃ­a en `expected_details.identification_number` (D-14), manda nuestro id interno en `vendor_data` (D-4/D-5), aplica timeout/manejo de errores (RNF-13).
- **Response 200 (propuesto):** `{ sesion_id, url_didit | token, intentos_usados, intentos_restantes }`.
- **Si Didit falla:** registrar estado `Error del proveedor` **sin `session_id`** (`TAREAS-INNOVACION-1â€¦:94`); responder error controlado, nunca 500 sin manejar (RNF-13).
- **Si se agotaron los 3 intentos:** rechazar **antes de llamar a Didit** (F-01).
- **Estado:** â³ bloqueado por #18 (tabla `sesiones_didit`).

### 7.2 Consultar el estado

- **MÃ©todo/ruta (propuesto):** `GET /api/didit/sesiones/{sesion_id}`
- **Response (propuesto):** `{ estado_rnf12, intentos_usados, motivo?, fallback_habilitado }` (`TAREAS-INNOVACION-1â€¦:89`).
- **Polling:** `Â¿polling o alternativa?` â†’ **PENDIENTE DE JORDY** (N-6). No se define el intervalo sin esa decisiÃ³n.
- **Estado:** â³ bloqueado por #18 y la decisiÃ³n de polling.

### 7.3 Fallback manual

- **MÃ©todo/ruta (propuesto):** `POST /api/didit/sesiones/{sesion_id}/fallback`
- **Rol:** **solo `Admin`** (D-2). Cualquier otro rol â†’ `403`.
- **Request:** `{ motivo: string }` (**obligatorio**).
- **CuÃ¡ndo estÃ¡ disponible:** solo con `Error del proveedor` o al agotar los 3 intentos. **Nunca** con `Identidad no verificada` (un `Declined` no es indisponibilidad) â€” `QAâ€¦:254`.
- **Efecto:** setea `autorizado_por` (auditado) y habilita el retiro/validaciÃ³n.
- **Estado:** â³ bloqueado por #18.

### 7.4 Errores que recibe la pantalla

Los 4 mensajes Aâ€“D de la PrÃ¡ctica 3 Â§6 se usan **tal cual estÃ¡n escritos** (`TAREAS-PENDIENTESâ€¦:85`), pero **el copy literal no estÃ¡ en el repo inspeccionado**: se lo referencia sin reproducirlo. Se agrega un **cÃ³digo estable** propuesto para que el frontend discrimine sin depender del texto.

| Caso | `code` propuesto | `estado_rnf12` | `resultado_autorizacion` | Copy de UI |
|---|---|---|---|---|
| A â€” identidad vÃ¡lida + autorizado | `IDENTITY_VERIFIED_AUTHORIZED` | `Identidad verificada` | `Autorizado` | literal A de la PrÃ¡ctica 3 (**no disponible en el repo**) |
| B â€” identidad invÃ¡lida | `IDENTITY_NOT_VERIFIED` | `Identidad no verificada` | â€” | literal B (**no disponible**) |
| C â€” identidad vÃ¡lida + no autorizado | `IDENTITY_VERIFIED_NOT_AUTHORIZED` | `Identidad verificada` | `No autorizado` | literal C (**no disponible**) |
| D â€” Didit caÃ­do / timeout | `PROVIDER_ERROR` | `Error del proveedor` | â€” | literal D (**no disponible**) |
| DNI no coincide | `DNI_MISMATCH` | (rechazo, comparaciÃ³n `personal_number`; ver D-14) | â€” | **propuesta / pendiente** (D-14 confirma el comportamiento, **no** el copy) |
| `Requiere revisiÃ³n` | `REQUIRES_REVIEW` | `Requiere revisiÃ³n` | â€” | **propuesta / pendiente** (quiÃ©n lo atiende: N-10) |
| MÃ¡ximo de intentos | `MAX_ATTEMPTS_REACHED` | â€” | â€” | **propuesta / pendiente** |
| Fallback disponible | `FALLBACK_AVAILABLE` | â€” | â€” | â€” |

### 7.5 Envelope y cÃ³digos estables â€” **PROPUESTA DE CONTRATO â€” NO IMPLEMENTADA**

> Los nombres de cÃ³digo de esta secciÃ³n son **propuesta de Meli, sujetos a aprobaciÃ³n**. **No** son una decisiÃ³n previa de Jordy. **No** se afirma que este JSON ya exista ni que estÃ© implementado.

Envelope propuesto (conceptual, a acordar antes de implementar). Separa lo machine-readable del copy de UI, que puede quedar pendiente:

```
{
  code,                      // cÃ³digo estable, machine-readable (tabla Â§7.4)
  estado_rnf12,              // uno de los 5 estados de RNF-12
  resultado_autorizacion,    // 'Autorizado' | 'No autorizado' | null (cuando corresponda)
  message,                   // copy de UI; puede quedar pendiente
  fallback_habilitado,       // boolean
  intentos_usados            // entero
}
```

- **`code`** es lo que el frontend debe usar para ramificar; **`message`** es solo presentaciÃ³n y puede cambiar.
- El envelope aplica tanto a respuestas exitosas de sesiÃ³n como a errores controlados.
- **Pendiente:** copy exacto de `DNI_MISMATCH`, `REQUIRES_REVIEW` y `MAX_ATTEMPTS_REACHED`.

### 7.6 Notas de contrato

- **Idempotencia:** la reentrega del mismo evento por Didit no debe duplicar efectos ni degradar un estado terminal (`QAâ€¦:355-366`). Se diseÃ±a **antes** de escribir la lÃ³gica.
- **`Requiere revisiÃ³n`:** con `id_lookup` Didit **no lo emite**; solo se alcanza por el fallback manual propio (`QAâ€¦:392`). El badge igual debe existir (RNF-12).
- **No exponer internals:** los mensajes de error no filtran detalles del proveedor (RNF-04).

---

## 8. Flujo completo para Cami

### 8.1 Retiro (pantalla "Registrar retiro")

1. SelecciÃ³n de **NNyA** â†’ lista de **tutores con autorizaciÃ³n vigente** (y restricciones visibles) (RF02 / N-4).
2. Personal presente: identificaciÃ³n del tutor.
3. **Consentimiento** (N-8 â€” texto PENDIENTE).
4. **VerificaciÃ³n** segÃºn dispositivo (N-7 â€” PENDIENTE): DNI + selfie vÃ­a Didit; "esperando resultado" con intentos restantes.
5. **Resultado** con uno de los 5 estados RNF-12 y el mensaje Aâ€“D correspondiente.
6. Si aplica: **fallback manual** (solo `Admin`, con motivo).
7. **Registro:** hora de inicio, descripciÃ³n y observaciones â†’ "Registrar retiro" (RF20/21).
8. **Cierre:** hora de finalizaciÃ³n + "Realizada" (RF22).

**Dependencias del flujo:** pasos 1, 7 y 8 dependen de **#18**; pasos 3â€“6 dependen de **#23**. Hasta entonces **solo se maqueta con datos de ejemplo**.

### 8.2 Alta / validaciÃ³n de referente

1. VÃ­nculo de revinculaciÃ³n/referente afectivo â†’ queda en **`propuesto`** (D-16).
2. "Validar identidad" con Didit reemplaza la carga manual `ValidarRenaperForm` (`TAREAS-INNOVACION-1â€¦:124`).
3. Resultado: `aprobado` habilita el paso del vÃ­nculo a `vigente`; `rechazado` o `no_concluyente` no.
4. Se crea la fila de `validaciones_renaper` **sin `respuesta_cruda`** de Didit (D-11, D-13).
5. Mismo webhook y misma tabla `sesiones_didit` (`proposito = 'validacion_referente'`).

**Dependencias:** todo depende de **#18** y **#23** (y del trigger de D-16, que va en la migraciÃ³n de Sofi).

---

## 9. Preguntas abiertas

Ninguna se resuelve en este plan. Se agrupan por quiÃ©n decide:

### A. Decide Jordy / Producto

1. **Dispositivo** (QR / tablet / PC) â€” N-7.
2. **Prueba de vida** Â¿la exige la entrega? â€” Â§5.2.
3. **Texto de consentimiento** â€” N-8.
4. **Polling o alternativa** para consultar estado â€” N-6.
5. **QuiÃ©n atiende "Requiere revisiÃ³n"** â€” N-10.
6. **Borrado inmediato de la sesiÃ³n en Didit vs retenciÃ³n** (RF-10) â€” Â§3.
7. **Â¿Los RNF aplican tambiÃ©n al retiro** o solo a revinculaciÃ³n? â€” a chequear contra el PDF (la numeraciÃ³n del doc 2 es RNF-01..13).
8. **Workflow v3 / returned data / retenciÃ³n en la consola** (D-13): publicar v3 con `max_attempts:1` (D-12) y confirmar que no agrega liveness ni face match.

### B. Propone Meli / contrato tÃ©cnico

1. **`expected_details` / `vendor_data`**: confirmar el campo exacto y que nuestro id interno llega en el webhook (a validar contra Didit).
2. **Timeout y reintentos** (RNF-13): valor tÃ©cnico propuesto, sujeto a aprobaciÃ³n.
3. **Envelope y cÃ³digos estables** de Â§7.4/Â§7.5 (propuesta de Meli, no decisiÃ³n de Jordy).
4. **Idempotencia** de la reentrega del webhook (Â§7.6).
5. **ImplementaciÃ³n concreta del polling**, si Jordy elige polling (N-6).

### C. Depende de Sofi / #18

1. **Modelo** `retiros` / `sesiones_didit` / `autorizaciones_retiro`.
2. **Trigger de D-16** (alta de referente en `propuesto`).
3. **Estrategia RLS / escritura del webhook.**
4. **Conteo de intentos** con la excepciÃ³n `provider_error` (D-12).
5. **IntegraciÃ³n / mapeo hacia `validaciones_renaper`** (D-11, D-13).

---

## 10. Dependencias

```
Jordy (consola Didit + N-7/N-8/N-10 + timeout)
        â”‚
Sofi â”€â”€ migraciÃ³n #18 (retiros, sesiones_didit, autorizaciones_retiro, trigger D-16)
        â”‚                              â”‚
Meli â”€â”€ requisitos + contrato (ESTE PLAN) â”€â”€â–º #23 webhook + endpoints â”€â”€â–º tests
        â”‚                                                      â”‚
Cami â”€â”€ diseÃ±o con datos de ejemplo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º #26 pantallas conectadas
```

- **#18 bloquea #23:** sin tablas no se escribe el `TODO(Meli)` ni los endpoints.
- **#23 no se implementa en este paso.** Este plan solo lo especifica.
- **E-4 (contrato del webhook por HTTP) es independiente** de #18/#23 en su parte de capa pura; falta el `POST` real. No se toca acÃ¡.
- **Cami** puede maquetar con datos de ejemplo **cuando este contrato estÃ© aprobado**, sin esperar #23.
- **Jordy**: publicar v3 del workflow y las definiciones de N-7/N-8/N-10.

---

## VerificaciÃ³n de este plan

- [x] No se implementÃ³ ningÃºn endpoint ni se tocÃ³ `route.ts`, migraciones ni Supabase.
- [x] No se afirma que existan endpoints: todo Â§7 estÃ¡ marcado **CONTRATO PLANIFICADO**.
- [x] Los pendientes estÃ¡n marcados ðŸŸ¡ / â³ / â— / âšª; no se presentan como confirmados.
- [x] Consistente con D-1 a D-7, con el Plan 028 y con el Plan 032.
- [x] **D-12 prevalece** sobre el supuesto 8-9 del Plan 028 (Â§6.2); el Plan 028 no se modifica.
- [x] No hay RF numerados con significado inventado (Â§2.1 confirmados / Â§2.2 sin nÃºmero / Â§2.3 no reconstruible).
- [x] RNF-10 / RNF-11 quedan â— sin texto inventado (Â§5.1, Â§5.2).
- [x] Los cÃ³digos y el envelope de Â§7.4/Â§7.5 estÃ¡n marcados **PROPUESTA DE CONTRATO â€” NO IMPLEMENTADA**.
- [x] No commit, no push.

