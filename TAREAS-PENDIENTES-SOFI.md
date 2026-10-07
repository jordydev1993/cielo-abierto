# Tareas pendientes — Sofi (base de datos + análisis funcional)

**Fecha:** 2026-10-05
**Fuentes:** `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`, `PLAN-INTEGRACION-INNOVACIONES.md` § 2, `DECISIONES-PENDIENTES-INNOVACIONES.md` y el tablero de mobile (issues abiertos al 2026-10-05).

> Como siempre: cada tarea que toque el schema necesita su PLAN en `prompts/` y la aprobación de Jordy antes de escribir una migración. Las que son de documentación pueden tener un plan corto.

---

## Por qué tu parte es la prioridad

Meli y Cami ya avanzaron con todo lo que podían hacer sin el modelo de datos (tests de seguridad del webhook y maquetas con datos ficticios). **No tocaron nada tuyo.** Lo que sigue de Didit, tanto el retiro como la Innovación 1 (RENAPER automático para referentes), espera tu modelo:

```
Jordy (D-1 a D-5)  →  Sofi (modelo)  →  Meli (lógica del webhook + endpoints)  →  Cami (pantallas)
```

---

## 1. Modelo de datos de Didit — PRIORIDAD ALTA

### Podés arrancar ya (ya está decidido)

Jordy decidió el 2026-09-15: **tabla propia `retiros`** (no un `tipo` de `actividades`), tope de **3 intentos** y **fallback manual** con autorización.

- [ ] **Tabla `retiros`**, como mínimo con: `nnya_id`, `tutor_id`, `usuario_id` (quién lo registró), `resultado_validacion_identidad`, `resultado_autorizacion`, `cantidad_intentos`, `motivo_rechazo` y `autorizado_por` (nullable, solo para el fallback manual). También hace falta lo que pide el flujo de Cami: hora de inicio, hora de finalización, descripción, observaciones y estado ("En curso" → "Realizada").
- [ ] **"Autorizado a retirar"** (RN-01). Hoy `nnya_tutores.es_principal` **no** sirve para esto: un tutor puede ser principal y no estar autorizado, o al revés. Hay que decidir si alcanza con un campo en `nnya_tutores` o si hace falta una tabla aparte (por ejemplo, para vigencias).
- [ ] **"Restricciones vigentes"** sobre el vínculo tutor↔NNyA (RF-06). Hoy no existe nada parecido.
- [ ] **Política de minimización de datos** (RNF-06/07): qué se guarda y qué no. Regla fija: **nunca** guardar selfies, videos, plantillas biométricas ni copias de DNI. Solo el resultado de la operación.
- [ ] Mismo criterio que el resto del schema: `nnya_id` con `ON DELETE RESTRICT`, RLS por rol, trigger `trg_audit_*` (audit log) y restricciones `CHECK` en la base, no solo en el formulario.

### Decisiones de Jordy — ✅ resueltas el 2026-10-06 (`DECISIONES-PENDIENTES-INNOVACIONES.md`)

| Decisión | Qué define en tu modelo | Resuelto |
|---|---|---|
| **D-1** Mapeo de los 10 `status` de Didit a los 5 estados de RNF-12 | Los valores del `CHECK` de estado de la sesión | 5 estados de RNF-12; vencida/abandonada = "Identidad no verificada" |
| **D-2** Quién autoriza el fallback manual | Restricción sobre `autorizado_por` (RLS/trigger) | Solo `Admin` |
| **D-3** Qué cuenta como "intento" | Cómo se calcula `cantidad_intentos` | 1 intento = 1 sesión Didit terminada |
| **D-4** Webhook con `session_id` desconocido | Si hace falta una tabla de eventos "huérfanos" | No hace falta (`200` + log) |
| **D-5** Sesión Didit: una tabla compartida o dos | La forma de la tabla de sesiones | Una tabla `sesiones_didit` con campo `proposito` (`'retiro'`, `'validacion_referente'`) |
| **D-10** ¿Quién puede retirar? | Si `retiros.tutor_id` es obligatorio | Solo tutores autorizados (Práctica 3, RN-01): `tutor_id` obligatorio |

- [ ] **Tabla de sesiones de verificación Didit**, cuando estén D-1 y D-5. Con los 5 estados de RNF-12: `Pendiente de verificación`, `Identidad verificada`, `Identidad no verificada`, `Requiere revisión`, `Error del proveedor`.
  - Dato útil: el webhook solo recibe el `session_id` de Didit. Conviene guardar también nuestro id interno y mandarlo a Didit en `vendor_data` (el webhook ya lo acepta, `lib/validations/didit-webhook.schema.ts:10`), así la correlación no depende de un solo campo.
- [ ] **Innovación 1:** si D-5 sale "tabla compartida", definir cómo se relaciona con `validaciones_renaper` (la tabla de carga manual que ya existe para referentes): ¿se reemplaza, se le agrega una FK a la sesión, o convive?

---

## 2. Innovaciones — análisis y schema

| # | Innovación | Tarea | ¿Bloqueada? |
|---|---|---|---|
| 2 | **Timeline por NNyA** | Análisis funcional, no schema nuevo: qué eventos importa mostrar y de qué columna sale cada uno. Candidatas: `legajos.fecha_apertura`, `intervenciones.fecha`, `incidentes.fecha_hora`, `diagnosticos.fecha_diagnostico`, `vinculos_tutela.vigente_desde`, `nnya.fecha_egreso`, `seguimiento_post_egreso.fecha_contacto`. Definir también qué es sensible y cómo se ordenan los eventos sin hora. | **No, podés arrancar** |
| 3 | **Seguimiento 90 días** | Ampliar `CHECK (dias_post_egreso IN (30, 60))` a `(30, 60, 90)`, actualizar el trigger `fn_crear_seguimiento_post_egreso` (`prompts/026`) para crear la tercera fila y hacer el backfill para los ya egresados. | No: D-8 aprobada |
| 6 | **Alertas educativas** | Evaluar si alcanza con `alertas` (`tipo='educativa'`) o si hace falta una tabla `ausencias_escolares` (`nnya_id`, fecha, motivo) para alertar por acumulación. Definir el catálogo de motivos y quién carga las ausencias. | Parcial: el umbral de N ausencias lo decide Jordy |
| 7 | **Propuestas "Verificado"** | Agregar `'verificado'` al `CHECK` de `propuestas_mejora.estado` y las columnas `verificado_por` / `verificado_at` (completadas por la base, no por el cliente). | No: D-9 resuelta (lo marca un `Admin`, solo desde "Completado") |
| 4 | **Workflow de aprobaciones de egreso** | Tabla de aprobaciones (dirección/legal/técnico) y la restricción que impida egresar sin las 3. | Sí: Jordy tiene que decidir cómo se modelan los 3 "roles" que hoy no existen |
| 8 | **Calendarios** | Tabla de conexiones OAuth por usuario, con tokens **nunca** en texto plano. | Sí: Jordy tiene que elegir Google, Outlook o ambos |

La **Innovación 5 (informe SENAF)** ya no te toca: Jordy la implementó el 2026-10-04 (`prompts/027`, tabla `reportes_senaf`).

---

## 3. Documentación del modelo (mobile) — issues abiertos

Siguen abiertos en `arguello-infancias-mobile`:

- [ ] [#5](https://github.com/jordydev1993/arguello-infancias-mobile/issues/5) Reescribir `RESUMEN-SESION-MODELO-DATOS.md` (con las decisiones 1-4 ya resueltas).
- [ ] [#6](https://github.com/jordydev1993/arguello-infancias-mobile/issues/6) Reescribir `RECOMENDACIONES-MODELO-DATOS.md`.
- [ ] [#7](https://github.com/jordydev1993/arguello-infancias-mobile/issues/7) Reescribir `CORRECCIONES-MODELO-DATOS-ARGUELLO.md`. **Ojo:** la versión vieja tiene un script que duplicaría `audit_log`. No ejecutarlo.
- [ ] [#8](https://github.com/jordydev1993/arguello-infancias-mobile/issues/8) Actualizar `mobile/AGENTS.md` § [5]: sacar las 7 tablas viejas del docx y reflejar el modelo real.
- [ ] [#24](https://github.com/jordydev1993/arguello-infancias-mobile/issues/24) Entregable 3 ISO 12207: incumplimientos y debilidades.

Las bases están en `docs/04-backend/modelo-de-datos/CORRECCIONES-Y-DUDAS-PARA-MELI-SOFI.md` (sección 3) del repo mobile.

---

## Orden sugerido

1. **Didit, lo ya decidido:** `retiros`, "autorizado a retirar", restricciones vigentes y política de minimización. Es lo que más gente destraba.
2. **Tabla de sesiones Didit**, apenas Jordy resuelva D-1 a D-5.
3. **Timeline (análisis):** no depende de nadie.
4. **Issues de documentación mobile** (#5–#8, #24). Se pueden intercalar.
5. **Innovaciones 3, 6 y 7**, a medida que Jordy decida D-8, D-9 y el umbral de ausencias.
6. **Innovaciones 4 y 8**, solo cuando estén sus decisiones.

Cualquier duda sobre una decisión, preguntale a Jordy antes de modelar: mejor una pregunta que una migración que hay que revertir.
