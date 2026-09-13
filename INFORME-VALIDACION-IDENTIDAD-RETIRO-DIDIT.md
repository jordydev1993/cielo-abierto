# Informe de avance y faltantes — Validación de identidad para retiro de NNyA (Didit)

**Fecha:** 2026-09-15
**Fuente:** `practicas 3 - 02_09.pdf` (análisis funcional de Cami + arquitectura/seguridad de Meli, entrega del 02/09)
**Contra:** el código real del repo web (`arguello-infancias`, commit `e7564c5`) — verificado con `grep` y lectura directa de `supabase/migrations/`, no por memoria.

> Nota de nomenclatura: la fuente llama al sistema "Cielo Abierto" y al backend "Residencia 360" — el proyecto real se renombró a **Argüello Infancias** después de esa entrega (commit `fcf0791`). No cambia el análisis, solo lo señalo para que no genere confusión al leer ambos documentos juntos.

---

## Resumen ejecutivo

**Avance: 0% implementado.** No hay ningún archivo, tabla, dependencia ni variable de entorno relacionada con Didit o con un flujo de "retiro de NNyA" en el repo — confirmado por búsqueda exhaustiva. Esto es consistente con lo esperado: la Práctica 3 es un documento de **análisis** (funcional + arquitectura), todavía no una tarjeta de implementación.

La buena noticia: la arquitectura y las convenciones que el proyecto ya tiene son **compatibles** con lo que pide el documento y reducen bastante el trabajo de construirlo — no hay que empezar de cero ni pelear contra el resto del sistema. El detalle está en las secciones siguientes.

Son en realidad **dos features relacionadas** que comparten la misma integración con Didit:
- **A — Retiro de NNyA** (documento 1: RF01–RF22, RN-01 a RN-05, caso de uso completo).
- **B — Re-vinculación de tutor** (documento 2: arquitectura + RF-01 a RF-10 + RNF-01 a RNF-13).

---

## 1. Modelo de datos

### Ya existe y es reutilizable

| Tabla real | Qué cubre | Relevancia para este feature |
|---|---|---|
| `nnya_tutores` | Relación N:M entre `nnya` y `tutores`, con `es_principal BOOLEAN` | Es la base de RF02 ("consulta de tutores autorizados") — hoy identifica al tutor *principal*, no a quién está *autorizado a retirar*, que es un concepto distinto (ver faltantes). |
| `tutores` | `nombre`, `apellido`, `dni`, `telefono`, `email`, `parentesco`, `activo` | Cubre los datos básicos del tutor que RF03 necesita para identificarlo. |
| `actividades` | `estado` (`programada/en_curso/realizada/cancelada`), `nnya_ids[]`, `responsable_id`, `observaciones`, `created_at`/`updated_at` | Es prácticamente el mismo ciclo de vida que pide RF20–RF22 ("En curso" → "Realizada" con hora de inicio/fin) — se podría modelar un retiro como un `tipo` más de actividad, o como tabla propia (ver faltantes, es una decisión de diseño, no solo técnica). |
| `audit_log` | Tabla creada, con columnas para operación/usuario/timestamp | Es la pieza que pide RF19/RNF-09 (trazabilidad) — **pero no está cableada**: 0 triggers activos hoy (deuda ya conocida, tarjeta del tablero, issue #23). Este feature *depende* de que esa deuda se resuelva primero, o de construir su propio logging específico si no se quiere esperar. |
| `app/api/incidentes/prediccion`, `app/api/usuarios` | 2 route handlers reales, server-side, uno de ellos ya usa `SUPABASE_SERVICE_ROLE_KEY` **solo en el servidor** | Es exactamente el patrón que la propia Práctica 3 exige para Didit ("el frontend nunca se comunica directamente con las APIs privadas de Didit"). El proyecto ya sabe hacer esto — no hay que inventar el patrón. |

### Falta

- **No existe el concepto de "autorización para retirar".** `nnya_tutores.es_principal` no es lo mismo que "autorizado a retirar" (RN-01 lo pide explícito) — un tutor puede ser principal y no estar autorizado a retirar, o viceversa según cómo lo defina la residencia. Falta un campo (o tabla aparte, si puede haber restricciones/vigencia) que represente esto.
- **No existe una tabla o extensión que registre el retiro en sí** con lo que pide RF19–RF20: `tutor_id`, `resultado_validacion_identidad`, `resultado_autorizacion`, `cantidad_intentos`, `motivo_rechazo`. `actividades` no tiene ninguno de estos campos hoy.
- **No existe una tabla de sesiones de verificación Didit** — RNF-12 pide explícitamente 5 estados (`Pendiente de verificación`, `Identidad verificada`, `Identidad no verificada`, `Requiere revisión`, `Error del proveedor`); no hay ningún enum ni tabla que los represente.
- **No existe el campo de "restricciones vigentes" sobre un vínculo** que pide RF-06 del documento de re-vinculación.
- **Minimización de datos (RNF-06/07):** ninguna decisión tomada sobre qué campos de `documentos` (que sí existe y podría tentar a guardar la foto del DNI) se usarían o no — el documento pide explícitamente **no** guardar selfies, videos de prueba de vida, plantillas biométricas ni copias de DNI.

---

## 2. Backend / integración con Didit

**Nada implementado.** Específicamente no hay:
- Dependencia de Didit instalada (`package.json` no la tiene).
- Ningún route handler para crear sesión de verificación, recibir webhook, o consultar resultado.
- Ninguna variable de entorno para credenciales de Didit (ni en `.env.example` ni en ningún lado).
- Ninguna validación de firma/autenticidad de webhook (RNF-05) — no hay ningún webhook implementado en todo el proyecto todavía, sería el primero.

Lo que **sí** está resuelto y baja el esfuerzo: el proyecto ya sabe manejar un secreto server-side (`SUPABASE_SERVICE_ROLE_KEY` en `app/api/usuarios/route.ts`) sin exponerlo — la variable de Didit seguiría el mismo patrón.

---

## 3. Frontend / UX

**Nada implementado** — no hay pantalla de "Registrar retiro", ni captura de cámara (DNI frente/dorso, selfie) en ningún lugar del proyecto hoy.

Lo reutilizable: el patrón `components/entities/<entidad>/Form.tsx` + `List.tsx`, ya usado en las 12+ entidades existentes (`NnyaForm`, `LegajoForm`, `IncidenteForm`, etc.) — el formulario de selección de NNyA/tutor puede seguir exactamente esa convención. Lo que **no** tiene precedente en el proyecto es la parte de captura de cámara / integración con el widget o SDK de Didit — sería la primera vez que la web usa la cámara del dispositivo.

---

## 4. Seguridad y privacidad (RNF-01 a RNF-13)

| Requisito | Estado |
|---|---|
| RNF-01 (credenciales solo server-side) | ✅ Patrón ya establecido (`SUPABASE_SERVICE_ROLE_KEY`), se replicaría igual para Didit |
| RNF-02 (HTTPS) | ✅ Cubierto por el hosting (Vercel) |
| RNF-03 (acceso limitado por rol) | ✅ Patrón RLS ya establecido (`Admin`/`Equipo Tecnico`) — aplicaría igual acá |
| RNF-04 (logs sin biometría/credenciales) | ⏳ No hay decisión tomada todavía, pero no hay nada que lo contradiga hoy |
| RNF-05 (validar webhooks) | ❌ No implementado — sería el primer webhook del proyecto |
| RNF-06/07 (minimización de datos) | ❌ No hay política definida ni campos preparados para *no* guardar lo que no corresponde |
| RNF-08 (datos ficticios en desarrollo) | ✅ Ya es la práctica del proyecto (datos semilla ficticios en todas las entidades) |
| RNF-09 (auditoría) | ❌ Bloqueado por el mismo gap que issue #23: `audit_log` sin triggers activos |
| RNF-10 a RNF-13 (estados, timeouts, resiliencia ante fallas de Didit) | ❌ No implementado — no hay ningún manejo de timeout/reintento en el proyecto para servicios externos todavía (el único servicio externo actual, la predicción de incidentes, no tiene ese patrón tampoco) |

---

## 5. Requisitos previos institucionales/legales

La propia Práctica 3 lista 8 puntos como "Requisitos previos para producción" (autorización institucional, evaluación legal de datos biométricos, transferencia internacional de datos, consentimiento, contrato/DPA con Didit, política de retención, configuración de entorno productivo, credenciales). **Ninguno está resuelto** — y **ninguno es una tarea de código**: son decisiones de negocio/legales que le corresponden al equipo (probablemente a Jordy como responsable de producto), no algo que se pueda "implementar". El propio documento ya lo aclara: durante la tesis se usa entorno de pruebas y datos ficticios, así que no bloquean poder construir un prototipo.

---

## 6. Preguntas ya abiertas en el propio documento fuente

El PDF trae 2 comentarios sin resolver que quedaron ahí (marcados `[CG1]` y `[CG2]`, aparentemente de Cami):

1. **"Validar con Meli"** — sobre si, ante la indisponibilidad de Didit, se permite una validación manual comparando documentación/imágenes ya registradas. Es una decisión de negocio (¿se acepta ese riesgo?), no técnica.
2. **"¿Cuántos intentos?"** — RF18 pide permitir reintentar la validación "de acuerdo con las reglas de negocio que se definan para la cantidad máxima de intentos", pero esa cantidad nunca se definió.

No las respondo yo — quedan para que el equipo (Meli específicamente, ya que así lo pide el propio documento) las cierre.

---

## 7. Qué haría falta para pasar de análisis a un primer prototipo

En orden, sin estimar tiempos (eso corresponde a un plan formal cuando se apruebe encarar esto):

1. Resolver las 2 decisiones de negocio del punto 6 + definir el campo de "autorización para retirar" (punto 1).
2. Diseñar el modelo de datos real: extender `nnya_tutores` (o crear una tabla de autorizaciones) + decidir si el retiro es un `tipo` de `actividades` o una tabla propia + tabla de sesiones de verificación Didit.
3. Resolver el audit log real (issue #23) o, si no se quiere esperar, decidir un logging específico solo para este feature.
4. Alta de cuenta de prueba (sandbox) de Didit y de las variables de entorno correspondientes.
5. Backend: route handler para crear sesión + webhook de resultado (con validación de firma) + endpoint de consulta de estado.
6. Frontend: pantalla de registrar retiro (selección NNyA → tutor → captura vía Didit → confirmación) siguiendo el patrón `Form.tsx`/`List.tsx` ya establecido.
7. Definir y aplicar la política de minimización de datos (qué se guarda y qué no) antes de escribir el primer registro real.

Este orden no es una implementación aprobada — es la ruta que muestra el propio análisis; falta el plan formal (`prompts/`) del ciclo de trabajo del proyecto antes de tocar código, una vez que el equipo decida encarar esto.
