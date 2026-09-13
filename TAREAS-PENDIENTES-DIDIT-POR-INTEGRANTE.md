# Tareas pendientes por integrante — Validación de identidad para retiro de NNyA (Didit)

**Fecha:** 2026-09-15
**Fuente:** `practicas 3 - 02_09.pdf` + `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md` (auditoría de avance, 0% implementado)
**Reparto:** el mismo que ya definió el propio documento fuente ("Resumen de Responsables"), llevado de la fase de análisis a la fase de implementación.

> Esto es una lista de tareas, no un plan aprobado. Cada tarea que implique código todavía necesita su propio PLAN en `prompts/` (ciclo Vibe Engineering) antes de tocar nada — ver `GUIA-PROCESO-COMPLETO.md` e `INFORME-FALTANTES-Y-GUIA-PROMPTS.md` para cómo pedirlo.

---

## Orden de dependencias

```
Jordy (decisiones)  →  Sofi (modelo de datos)  →  Meli (backend + Didit)  →  Cami (frontend)
```

Nadie puede arrancar en serio antes de que Jordy cierre las 2 decisiones de negocio — están primero por algo, no por jerarquía.

---

## Jordy — Coordinación general y decisiones

Es lo primero que tiene que pasar. Sin esto, Sofi/Meli/Cami están diseñando sobre una base que puede cambiar.

- [ ] Resolver **cuántos intentos** de validación se permiten antes de bloquear el proceso (RF18 lo pide, quedó sin definir — es el comentario `[CG2]` del propio PDF).
- [ ] Decidir si, ante la indisponibilidad de Didit, se permite una **validación manual** comparando documentación ya registrada (comentario `[CG1]`, dice "Validar con Meli" — la decisión final es de producto, igual).
- [ ] Decidir si el retiro se modela como un **`tipo` nuevo dentro de `actividades`** o como una **tabla propia** (`retiros`) — afecta directamente el trabajo de Sofi, hay que definirlo antes de que ella diseñe el modelo.
- [ ] Gestionar el alta de una **cuenta sandbox de Didit** y las variables de entorno correspondientes (siguiendo el mismo patrón que `SUPABASE_SERVICE_ROLE_KEY`: solo servidor, nunca en el cliente).
- [ ] De los 8 "Requisitos previos para producción" del documento (autorización institucional, evaluación legal de datos biométricos, transferencia internacional, consentimiento, contrato/DPA, política de retención, config. productiva, credenciales): **ninguno bloquea el prototipo de tesis** (el propio documento dice que se usa entorno de pruebas y datos ficticios) — pero sí hay que dejar por escrito esa decisión para no perderla de vista antes de un eventual uso real.
- [ ] Una vez resuelto lo anterior, coordinar quién escribe el primer PLAN formal en `prompts/` (probablemente Meli, por la arquitectura) y aprobarlo.

---

## Sofi — Modelo de datos

Depende de que Jordy resuelva el punto de "actividad vs tabla propia" de arriba.

- [ ] Diseñar el campo o tabla de **"autorización para retirar"** — hoy `nnya_tutores.es_principal` no representa esto; un tutor puede ser principal y no estar autorizado a retirar, o viceversa (RN-01).
- [ ] Diseñar el modelo del **registro del retiro en sí**, con como mínimo: NNyA, tutor, usuario que lo registró, resultado de validación de identidad, resultado de autorización, cantidad de intentos, motivo de rechazo (RF19-RF20) — como extensión de `actividades` o tabla nueva, según lo que decida Jordy.
- [ ] Diseñar la **tabla de sesiones de verificación Didit**, con los 5 estados que pide RNF-12: `Pendiente de verificación`, `Identidad verificada`, `Identidad no verificada`, `Requiere revisión`, `Error del proveedor`.
- [ ] Diseñar el campo de **"restricciones vigentes"** sobre un vínculo tutor↔NNyA (lo pide RF-06 del documento de re-vinculación) — hoy no existe nada parecido.
- [ ] Definir la **política de minimización de datos** (RNF-06/07): qué se guarda y qué no. El documento es explícito en que **no** se deben guardar selfies, videos de prueba de vida, plantillas biométricas ni copias de DNI — solo el resultado de la operación.
- [ ] Actualizar wireframes de la pantalla de retiro si hace falta, una vez que el modelo esté cerrado.

---

## Meli — Backend e integración Didit

Depende del modelo de datos de Sofi. Es el rol que el propio documento ya te asignó ("Análisis técnico... integración Didit").

- [ ] Escribir el PLAN formal en `prompts/` para esta feature (una vez que Jordy apruebe las decisiones y Sofi tenga el modelo).
- [ ] Route handler server-side para **crear una sesión de verificación** en Didit — seguir el mismo patrón que ya existe en `app/api/usuarios/route.ts` (credenciales solo en servidor, nunca en el cliente).
- [ ] **Webhook** que reciba el resultado de Didit — sería el primer webhook del proyecto, no hay ninguno todavía. Tiene que validar la autenticidad de la notificación (RNF-05) antes de procesarla — "no debe modificarse el estado de una re-vinculación simplemente porque se recibió una petición HTTP", lo dice el propio documento.
- [ ] Endpoint para **consultar el estado** de una verificación en curso.
- [ ] Verificar que la persona validada tenga **vínculo + autorización vigente** consultando Supabase (RF-05/RF-06 del segundo documento) — un resultado de identidad válido **no autoriza automáticamente** nada, son dos validaciones independientes.
- [ ] Manejo de **timeouts y errores** en la comunicación con Didit (RNF-13) — hoy ningún servicio externo del proyecto (ni siquiera la predicción de incidentes) tiene este patrón, sería el primero en tenerlo bien hecho.
- [ ] Resolver o coordinar con Jordy que se resuelva primero el **audit log real** (issue [#2](https://github.com/jordydev1993/cielo-abierto/issues/2), 0 triggers activos hoy) — este feature depende de esa trazabilidad para cumplir RF19/RNF-09; si no se resuelve antes, hay que decidir un logging específico solo para retiro.
- [ ] Tests del flujo completo (identidad válida + autorizado → permite; identidad inválida → rechaza; válido pero no autorizado → rechaza; Didit caído → error controlado) — los 4 casos que ya están documentados en el PDF (§6, Flujos alternativos).

---

## Cami — Frontend / UX del flujo de retiro

Depende de que Meli tenga al menos los endpoints definidos (puede arrancar el maquetado antes, pero la integración real espera).

- [ ] Pantalla de **"Registrar retiro"**, siguiendo el patrón ya establecido `components/entities/<entidad>/Form.tsx` — selección de NNyA → lista de tutores autorizados → identificación del tutor presente.
- [ ] Flujo de **captura**: frente del DNI, dorso del DNI, imagen facial, prueba de vida — es la primera vez que el proyecto web usa la cámara del dispositivo, no hay ningún componente existente para reusar acá.
- [ ] Pantalla/estado de **confirmación** según el resultado: identidad validada + autorizado → continuar; los 4 mensajes de error ya redactados en el documento (§6 A-D) tal cual están escritos ahí, no hace falta inventar copy nuevo.
- [ ] Formulario de **registro del retiro**: hora de inicio, descripción y observaciones opcionales, botón "Registrar retiro".
- [ ] Pantalla de **cierre**: acceder vía "Editar", ingresar hora de finalización, marcar "Realizada".
- [ ] Revisar que los 5 estados de verificación (RNF-12) tengan una representación visual clara y distinta entre sí (mismo criterio que ya aplicás en `skills/design.md` para otros badges de estado).

---

## Resumen

| Quién | Bloqueado por | Cantidad de tareas |
|---|---|---|
| Jordy | — (arranca primero) | 6 |
| Sofi | Jordy | 6 |
| Meli | Sofi (+ Jordy) | 8 |
| Cami | Meli (parcial) | 6 |

Ninguna de estas tareas tiene tarjeta en el tablero todavía — es análisis convertido en lista de trabajo, no compromiso de sprint. Si se decide encarar esta feature, el primer paso real es que Jordy cierre las decisiones de la sección propia y recién ahí se crean las tarjetas.
