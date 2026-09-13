# Tareas pendientes por integrante — Validación de identidad para retiro de NNyA (Didit)

**Fecha:** 2026-09-15
**Fuente:** `practicas 3 - 02_09.pdf` + `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md` (auditoría de avance, 0% implementado)
**Reparto:** el mismo que ya definió el propio documento fuente ("Resumen de Responsables"), llevado de la fase de análisis a la fase de implementación.

> Esto es una lista de tareas, no un plan aprobado. Cada tarea que implique código todavía necesita su propio PLAN en `prompts/` (ciclo Vibe Engineering) antes de tocar nada — ver `GUIA-PROCESO-COMPLETO.md` e `INFORME-FALTANTES-Y-GUIA-PROMPTS.md` para cómo pedirlo.

---

## Orden de dependencias

```
Jordy (decisiones) ✅  →  Sofi (modelo de datos) ⬅ YA PUEDE ARRANCAR  →  Meli (backend + Didit)  →  Cami (frontend)
```

Las decisiones de Jordy y el alta de la cuenta sandbox de Didit (app "arguelloinfancias (Sandbox)", workflow + webhook configurados) ya están resueltas (2026-09-13/15). **Sofi ya puede arrancar.**

---

## Jordy — Coordinación general y decisiones

**Resuelto (2026-09-15):**

- [x] **RF18 — Intentos de validación: 3.** Al tercer fallo, el proceso deriva a revisión manual/supervisor (no se sigue reintentando indefinidamente).
- [x] **`[CG1]` — Fallback manual: sí, pero solo lo autoriza un Admin/coordinador.** Si Didit no está disponible, se permite una validación manual comparando documentación ya registrada — pero no cualquier educador puede aprobarla, solo un rol con más responsabilidad (mismo criterio de roles que ya usa el resto del sistema: `Admin`/`Equipo Tecnico` vía `get_my_role()`).
- [x] **Modelo de datos: tabla propia `retiros`, no un `tipo` dentro de `actividades`.** El retiro necesita campos que `actividades` no tiene y no debería tener (`tutor_id`, resultado de validación de identidad, resultado de autorización, cantidad de intentos, motivo de rechazo) — meterlos ahí como columnas nullable ensuciaría esa tabla para el resto de sus filas. Mismo criterio ya aplicado al crear `novedades` en vez de reusar `intervenciones`. **Esto ya destraba el trabajo de Sofi.**
- [x] **Los 8 "Requisitos previos para producción"** (autorización institucional, evaluación legal de datos biométricos, transferencia internacional, consentimiento, contrato/DPA, política de retención, config. productiva, credenciales de producción): **confirmado que ninguno bloquea el prototipo de tesis** — la propia Práctica 3 ya lo dice ("durante la etapa de tesis/prototipo se utilizará el entorno de pruebas y datos ficticios"). Queda registrado acá para no perderlo de vista antes de un eventual uso real con NNA verdaderos.

**Resuelto (2026-09-13):**

- [x] **Alta de cuenta sandbox de Didit + configuración inicial.** App elegida: "arguelloinfancias (Sandbox)". Conectado vía MCP (`https://mcp.didit.me/mcp`) para terminar de configurarla:
  - Workflow publicado `71a46d11-07f9-480c-89f3-3bb86cee7175`, versión `390d69a8-46a2-4fdf-9ffe-337ead253203` ("Retiro NNyA - Validación de identidad"): método `id_lookup` (RENAPER, Argentina) — DNI + selfie contra el padrón, **reemplaza** la captura de documento (frente/dorso) que preveía la Práctica 3 original. 3 intentos máx. (RF18). Detalle y por qué en `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md` § 8 — incluye 2 implicancias sin resolver (liveness explícito y base legal del consentimiento).
  - Webhook creado `d8699159-5933-4cb8-92b5-f75a59e7b493` → `https://cielo-abierto-two.vercel.app/api/didit/webhook`, evento `status.updated`, versión `v3`.

**Pendiente, requiere una acción tuya fuera de este repo (el MCP nunca expone secretos en texto plano):**

- [x] **Corregir `DIDIT_API_KEY` en `.env.local`.** Actualizado (2026-09-13) con la key real de "arguelloinfancias (Sandbox)".
- [x] **Guardar `DIDIT_WEBHOOK_SECRET`.** Cargado (2026-09-13) en `.env.local`. Meli lo va a necesitar para validar la firma de cada notificación (RNF-05) cuando construya el endpoint.
- [x] **Endpoint del webhook creado y en producción (2026-09-13).** `app/api/didit/webhook/route.ts` (plan `prompts/016-webhook-didit.md`, ✓ Aprobado): valida `X-Signature-V2` + `X-Timestamp` contra `DIDIT_WEBHOOK_SECRET` antes de aceptar cualquier notificación (RNF-05). Todavía **no** escribe en Supabase — no hay tablas de Sofi para eso — queda un `TODO(Meli)` marcado en el código. `DIDIT_API_KEY` y `DIDIT_WEBHOOK_SECRET` ya están cargadas en Vercel (Production + Development, vía `vercel env add`) y el deploy en producción (`https://cielo-abierto-two.vercel.app/api/didit/webhook`) ya las tiene activas — verificado en vivo (401 sin firma, no 500 por falta de configuración). Detalle completo para Meli en `INFORME-WEBHOOK-DIDIT-PARA-MELI.md`.

**Siguiente paso, ya destrabado:**

- [ ] Con el modelo de datos decidido, **Sofi ya puede arrancar** su parte (tabla `retiros`, autorización de retiro, sesiones de verificación, política de minimización de datos).
- [ ] Una vez que Sofi tenga el modelo, coordiná con **Meli** para que escriba el primer PLAN formal en `prompts/` (le toca a ella por ser quien lidera la arquitectura/integración Didit) y aprobalo antes de que se escriba una línea de código.

**Estado a 2026-09-13**: confirmado con Jordy que Sofi **todavía no arrancó/cerró** su parte del modelo de datos. Hasta que eso pase, este último punto sigue bloqueado — no hay nada de código o de coordinación con Meli para hacer todavía. No es un pendiente de Jordy en sí, es una dependencia externa a su lista.

---

## Sofi — Modelo de datos

**✅ Ya destrabado** (Jordy resolvió el 2026-09-15: tabla propia `retiros`, 3 intentos, fallback manual solo Admin/coordinador).

- [ ] Diseñar el campo o tabla de **"autorización para retirar"** — hoy `nnya_tutores.es_principal` no representa esto; un tutor puede ser principal y no estar autorizado a retirar, o viceversa (RN-01).
- [ ] Diseñar la tabla **`retiros`** (ya definido: tabla propia, no un `tipo` de `actividades`), con como mínimo: `nnya_id`, `tutor_id`, `usuario_id` (quien lo registró), `resultado_validacion_identidad`, `resultado_autorizacion`, `cantidad_intentos` (tope de 3, según la decisión de Jordy), `motivo_rechazo`, `autorizado_por` (nullable — solo se completa si fue una validación manual con fallback, y debe ser un `Admin`/`Equipo Tecnico`) (RF19-RF20).
- [ ] Diseñar la **tabla de sesiones de verificación Didit**, con los 5 estados que pide RNF-12: `Pendiente de verificación`, `Identidad verificada`, `Identidad no verificada`, `Requiere revisión`, `Error del proveedor`.
- [ ] Diseñar el campo de **"restricciones vigentes"** sobre un vínculo tutor↔NNyA (lo pide RF-06 del documento de re-vinculación) — hoy no existe nada parecido.
- [ ] Definir la **política de minimización de datos** (RNF-06/07): qué se guarda y qué no. El documento es explícito en que **no** se deben guardar selfies, videos de prueba de vida, plantillas biométricas ni copias de DNI — solo el resultado de la operación.
- [ ] Actualizar wireframes de la pantalla de retiro si hace falta, una vez que el modelo esté cerrado.

---

## Meli — Backend e integración Didit

Depende del modelo de datos de Sofi. Es el rol que el propio documento ya te asignó ("Análisis técnico... integración Didit").

- [ ] Escribir el PLAN formal en `prompts/` para esta feature (una vez que Jordy apruebe las decisiones y Sofi tenga el modelo).
- [ ] Route handler server-side para **crear una sesión de verificación** en Didit — seguir el mismo patrón que ya existe en `app/api/usuarios/route.ts` (credenciales solo en servidor, nunca en el cliente).
- [x] **Webhook que reciba el resultado de Didit** — hecho por Jordy como adelanto (2026-09-13), solo la parte de seguridad: `app/api/didit/webhook/route.ts` valida la autenticidad (RNF-05) y ya está deployado en producción. **Te queda a vos** la lógica de negocio (buscar la sesión, actualizar estado, validar autorización de retiro) — está marcada con `TODO(Meli)` en el código y detallada en `INFORME-WEBHOOK-DIDIT-PARA-MELI.md`, a la espera de que Sofi tenga las tablas.
- [ ] Endpoint para **consultar el estado** de una verificación en curso.
- [ ] Verificar que la persona validada tenga **vínculo + autorización vigente** consultando Supabase (RF-05/RF-06 del segundo documento) — un resultado de identidad válido **no autoriza automáticamente** nada, son dos validaciones independientes.
- [ ] Manejo de **timeouts y errores** en la comunicación con Didit (RNF-13) — hoy ningún servicio externo del proyecto (ni siquiera la predicción de incidentes) tiene este patrón, sería el primero en tenerlo bien hecho.
- [ ] Resolver o coordinar con Jordy que se resuelva primero el **audit log real** (issue [#2](https://github.com/jordydev1993/cielo-abierto/issues/2), 0 triggers activos hoy) — este feature depende de esa trazabilidad para cumplir RF19/RNF-09; si no se resuelve antes, hay que decidir un logging específico solo para retiro.
- [ ] Tests del flujo completo (identidad válida + autorizado → permite; identidad inválida → rechaza; válido pero no autorizado → rechaza; Didit caído → error controlado) — los 4 casos que ya están documentados en el PDF (§6, Flujos alternativos).

---

## Cami — Frontend / UX del flujo de retiro

Depende de que Meli tenga al menos los endpoints definidos (puede arrancar el maquetado antes, pero la integración real espera).

- [ ] Pantalla de **"Registrar retiro"**, siguiendo el patrón ya establecido `components/entities/<entidad>/Form.tsx` — selección de NNyA → lista de tutores autorizados → identificación del tutor presente.
- [ ] Flujo de **captura**: número de DNI + selfie (vía el widget/SDK de Didit, método RENAPER — ya **no** se fotografía el documento físico, ver `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md` § 8) — es la primera vez que el proyecto web usa la cámara del dispositivo, no hay ningún componente existente para reusar acá.
- [ ] Pantalla/estado de **confirmación** según el resultado: identidad validada + autorizado → continuar; los 4 mensajes de error ya redactados en el documento (§6 A-D) tal cual están escritos ahí, no hace falta inventar copy nuevo.
- [ ] Formulario de **registro del retiro**: hora de inicio, descripción y observaciones opcionales, botón "Registrar retiro".
- [ ] Pantalla de **cierre**: acceder vía "Editar", ingresar hora de finalización, marcar "Realizada".
- [ ] Revisar que los 5 estados de verificación (RNF-12) tengan una representación visual clara y distinta entre sí (mismo criterio que ya aplicás en `skills/design.md` para otros badges de estado).

---

## Resumen

| Quién | Estado | Cantidad de tareas |
|---|---|---|
| Jordy | ✅ Sus 6 puntos resueltos — solo queda 1 coordinación, bloqueada por Sofi | 6 |
| Sofi | ⏳ Destrabada, todavía no arrancó/cerró (confirmado 2026-09-13) | 6 |
| Meli | Espera el modelo de Sofi | 8 |
| Cami | Espera a Meli (parcial) | 6 |

Ninguna de estas tareas tiene tarjeta en el tablero todavía — es análisis convertido en lista de trabajo, no compromiso de sprint. Avisame cuando Sofi tenga el modelo listo y armamos las tarjetas para trackearlo en el tablero.
