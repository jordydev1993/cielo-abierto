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

Las decisiones de Jordy ya están resueltas (2026-09-15) — solo queda pendiente el alta de la cuenta sandbox de Didit, que no bloquea a Sofi. **Sofi ya puede arrancar.**

---

## Jordy — Coordinación general y decisiones

**Resuelto (2026-09-15):**

- [x] **RF18 — Intentos de validación: 3.** Al tercer fallo, el proceso deriva a revisión manual/supervisor (no se sigue reintentando indefinidamente).
- [x] **`[CG1]` — Fallback manual: sí, pero solo lo autoriza un Admin/coordinador.** Si Didit no está disponible, se permite una validación manual comparando documentación ya registrada — pero no cualquier educador puede aprobarla, solo un rol con más responsabilidad (mismo criterio de roles que ya usa el resto del sistema: `Admin`/`Equipo Tecnico` vía `get_my_role()`).
- [x] **Modelo de datos: tabla propia `retiros`, no un `tipo` dentro de `actividades`.** El retiro necesita campos que `actividades` no tiene y no debería tener (`tutor_id`, resultado de validación de identidad, resultado de autorización, cantidad de intentos, motivo de rechazo) — meterlos ahí como columnas nullable ensuciaría esa tabla para el resto de sus filas. Mismo criterio ya aplicado al crear `novedades` en vez de reusar `intervenciones`. **Esto ya destraba el trabajo de Sofi.**
- [x] **Los 8 "Requisitos previos para producción"** (autorización institucional, evaluación legal de datos biométricos, transferencia internacional, consentimiento, contrato/DPA, política de retención, config. productiva, credenciales de producción): **confirmado que ninguno bloquea el prototipo de tesis** — la propia Práctica 3 ya lo dice ("durante la etapa de tesis/prototipo se utilizará el entorno de pruebas y datos ficticios"). Queda registrado acá para no perderlo de vista antes de un eventual uso real con NNA verdaderos.

**Pendiente, requiere una acción tuya fuera de este repo:**

- [ ] **Alta de cuenta sandbox de Didit.** Es un servicio externo (probablemente con su propio proceso de alta/verificación) — nadie más que vos puede crearla. Una vez que tengas las credenciales de prueba, van como variables de entorno **solo del lado servidor**, mismo patrón que `SUPABASE_SERVICE_ROLE_KEY` hoy (nunca en el cliente, nunca en el repo). Nombres sugeridos para cuando las tengas: `DIDIT_API_KEY`, `DIDIT_WEBHOOK_SECRET` (o los que documente Didit — ajustar al nombre real que te den).

**Siguiente paso, ya destrabado:**

- [ ] Con el modelo de datos decidido, **Sofi ya puede arrancar** su parte (tabla `retiros`, autorización de retiro, sesiones de verificación, política de minimización de datos).
- [ ] Una vez que Sofi tenga el modelo, coordiná con **Meli** para que escriba el primer PLAN formal en `prompts/` (le toca a ella por ser quien lidera la arquitectura/integración Didit) y aprobalo antes de que se escriba una línea de código.

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

| Quién | Estado | Cantidad de tareas |
|---|---|---|
| Jordy | ✅ Decisiones resueltas (2026-09-15) — falta solo el alta de la cuenta Didit | 6 |
| Sofi | ✅ Ya puede arrancar | 6 |
| Meli | Espera el modelo de Sofi | 8 |
| Cami | Espera a Meli (parcial) | 6 |

Ninguna de estas tareas tiene tarjeta en el tablero todavía — es análisis convertido en lista de trabajo, no compromiso de sprint. Avisame cuando Sofi tenga el modelo listo y armamos las tarjetas para trackearlo en el tablero.
