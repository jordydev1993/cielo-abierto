# 043 — Análisis funcional del timeline cronológico por NNyA (Innovación 2)

**Tarjeta:** `jordydev1993/cielo-abierto#20` — *Innovación 2: análisis funcional del timeline por NNyA* (labels `area:modelo-datos`, `tipo:doc`; asignada a Meli el 15/10).
**Implementación posterior:** `jordydev1993/cielo-abierto#45` — *Innovación 2: implementar el timeline visual en la ficha del NNyA* (a cargo de Jordy).
**QA:** Meli, contra los criterios de aceptación de § 11, cuando #45 esté implementado.
**Tipo de plan:** análisis funcional + datos. **No** implementa código, **no** crea schema, **no** toca migraciones ni cambia RLS.
**Responsable del análisis:** Meli.
**Estado:** borrador — pendiente de aprobación de Jordy (`✓ Aprobado` / `✕ Cambiar X`).
**Fecha:** 16/10/2026.

---

## Archivos y fuentes inspeccionadas

- `types/database.generated.ts` — fuente de verdad del schema actual (generado con `supabase gen types`, ver `prompts/020`). Bloques leídos: `audiencias_judiciales` L154, `diagnosticos` L271, `incidentes` L529, `intervenciones` L666, `legajos` L733, `medicamentos` L780, `nnya` L856, `seguimiento_post_egreso` L1236, `vinculos_tutela` L1677.
- `supabase/migrations/20260620000031_clean_schema.sql` — esquema base de 8 de los 9 dominios.
- `supabase/migrations/20260826000032_add_fecha_egreso_nnya.sql` — columna `nnya.fecha_egreso` + `CHECK chk_nnya_fecha_egreso_coherente`.
- `supabase/migrations/20260827000033_create_tutela_evaluacion_turnos_seguimiento.sql` — `vinculos_tutela` y `seguimiento_post_egreso`.
- `supabase/migrations/20260827000034_rls_tutela_evaluacion_turnos_seguimiento.sql` — RLS de esas dos tablas.
- `supabase/migrations/20260915193141_legajo_id_not_null.sql` — `legajo_id` pasa a `NOT NULL` en 7 tablas.
- `supabase/migrations/20260916012756_seguimiento_post_egreso_trigger.sql` — `fn_crear_seguimiento_post_egreso` (crea los hitos de 30/60 días al egresar).
- `supabase/migrations/20261010230000_legajo_reglas_estado.sql` — reglas de estado/cierre de legajo.
- `supabase/migrations/20260514000017_rls_policies.sql` — políticas de lectura de los 7 dominios base.
- `supabase/migrations/20260522000027_remove_educador_role.sql` — eliminación del rol `Educador`.
- Issue #20 (cuerpo + comentario de Jordy del 15/10), issue #45, `TAREAS-PENDIENTES-SOFI.md` § 2, `PLAN-INTEGRACION-INNOVACIONES.md` (Innovación 2), `DECISIONES-PENDIENTES-INNOVACIONES.md`.
- Destino del timeline: `app/(dashboard)/nnya/[id]/page.tsx` (hoy solo datos personales + legajo + tutores).
- Hooks patrón de consulta por NNyA (solo como referencia de estilo, no se modifican): `hooks/intervenciones/useIntervencionesByNnya.ts`, `hooks/vinculos-tutela/useVinculosTutelaByNnya.ts`, `hooks/incidentes/useIncidentesByLegajo.ts`, `hooks/diagnosticos/useDiagnosticosByLegajo.ts`, `hooks/audiencias/useAudienciasByLegajo.ts`, `hooks/seguimiento-post-egreso/useSeguimientosPostEgreso.ts`.
- `docs/design-system.md` — badges/colores a reusar en la implementación.
- Referencia de estilo de plan: `origin/master:prompts/042-alineacion-procesos-pendientes.md`.

**Origen de los candidatos:** el listado de columnas del issue #20 (comentario de Jordy del 15/10) amplía la lista original de `TAREAS-PENDIENTES-SOFI.md` § 2 (que no incluía `medicamentos`, `audiencias_judiciales` ni `legajos.fecha_cierre`). Este análisis parte del listado ampliado de #20 y señala explícitamente qué agrega por su cuenta (§ 3).

---

## 1. Alcance

**Qué entra (define este plan):**

- La lista cerrada de **eventos** que muestra el timeline, sobre **9 dominios** de datos (ver § 3).
- La **fuente** de cada evento: tabla y columna de fecha exactas (§ 2), y si aporta hora real.
- El **texto corto** que muestra cada evento, con la regla de no filtrar contenido sensible (§ 4).
- La **sensibilidad** de cada evento (salud / judicial / administrativa) y qué NO debe mostrarse aunque el rol pueda leer la tabla (§ 5).
- **Permisos/RLS** vigentes y la regla de no crear permisos nuevos ni saltar RLS (§ 6).
- El **orden** cronológico, incluido el desempate de los eventos sin hora y de fechas iguales (§ 7).
- Qué pasa con las **fechas faltantes / NULL** (§ 8).
- Los **filtros** propuestos (§ 9).
- La **ubicación** del timeline en la app (§ 10).
- Los **criterios de aceptación** para la QA de Meli (§ 11) y la **tabla funcional final** (§ 12).

**Qué NO entra:**

- La implementación (consulta/vista, hook, componente, badges). Va en #45, a cargo de Jordy, e incluye reusar el diseño de la demo `TimelineNnyaDemo` (PR #42 de Cami) — demo **no presente** en esta rama, se cita tal como la referencia #45.
- **Resumen en lenguaje natural / IA.** Queda **fuera de alcance** de forma explícita: implicaría mandar datos de salud y judiciales de menores a un proveedor externo. (Coherente con #45 y con la única excepción de IA ya decidida para el informe SENAF con datos agregados, `prompts/027`.)
- **Schema nuevo**, migraciones, columnas, tablas o vistas materializadas.
- **Cambios de RLS o de roles.**
- **Dominios fuera de los 9 de #20**, aunque tengan fecha funcional: turnos, actividades, novedades, alertas, informes, documentos y transferencia AUH quedan afuera.
- **Tipo de egreso**: no existe como campo en el modelo (ver `DECISIONES-PENDIENTES-INNOVACIONES.md` D-18). No se inventa.
- El timeline en la app **mobile** (esta tarjeta es del web).

---

## 2. Fuente de cada evento

Tabla real y columna de fecha de cada evento. **Fecha funcional ≠ fecha de carga:** el orden del timeline usa siempre la fecha del **evento**; `created_at` / `updated_at` (existentes en las 9 tablas) **nunca** determinan el orden ni generan un evento.

| # | Evento | Tabla | Columna de fecha | Tipo de dato | ¿Tiene hora? | Nulabilidad de la columna |
|---|---|---|---|---|---|---|
| 1 | Legajo abierto | `legajos` | `fecha_apertura` | DATE | No | `NOT NULL` |
| 2 | Legajo cerrado | `legajos` | `fecha_cierre` | DATE | No | `NULL` |
| 3 | Intervención registrada | `intervenciones` | `fecha` | DATE | No | `NOT NULL` |
| 4 | Incidente registrado | `incidentes` | `fecha_hora` | TIMESTAMPTZ | **Sí** | `NOT NULL` |
| 5 | Diagnóstico registrado | `diagnosticos` | `fecha_diagnostico` | DATE | No | `NOT NULL` |
| 6 | Medicación iniciada | `medicamentos` | `fecha_inicio` | DATE | No | `NOT NULL` |
| 7 | Medicación finalizada | `medicamentos` | `fecha_fin` | DATE | No | `NULL` |
| 8 | Audiencia judicial | `audiencias_judiciales` | `fecha_hora` | TIMESTAMPTZ | **Sí** | `NOT NULL` |
| 9 | Vínculo de tutela iniciado | `vinculos_tutela` | `vigente_desde` | DATE | No | `NOT NULL` |
| 10 | Vínculo de tutela finalizado | `vinculos_tutela` | `vigente_hasta` | DATE | No | `NULL` |
| 11 | Egreso | `nnya` *(columna, no tabla)* | `fecha_egreso` | DATE | No | `NULL` |
| 12 | Seguimiento post-egreso programado | `seguimiento_post_egreso` | `fecha_programada` | DATE | No | `NOT NULL` |
| 13 | Contacto de seguimiento realizado | `seguimiento_post_egreso` | `fecha_contacto` | TIMESTAMPTZ | **Sí** | `NULL` |

**Notas de fuente:**

- **Todos los orígenes son alcanzables por `nnya_id`.** Las 9 tablas tienen `nnya_id NOT NULL` (`nnya` por `id`). El timeline es **por NNyA**, así que filtra por `nnya_id` y **no** por `legajo_id`: filtrar por legajo perdería el historial de otros legajos del mismo NNyA. `intervenciones` es el único de los dominios sin `legajo_id` (solo `nnya_id`).
- **DATE sin hora**: `postgres`/Supabase devuelve la fecha sin hora real. No se debe fabricar una hora (ni `00:00`) para ordenar (ver § 7).
- **TIMESTAMPTZ con hora real**: solo incidentes, audiencias y contacto de seguimiento. Se ordenan por su hora verdadera.
- En `medicamentos` y `vinculos_tutela`, `diagnostico_id` / `referente_id` son relaciones (no aportan fecha).

---

## 3. Eventos concretos

Detalle de cuándo nace cada evento (13 tipos de evento sobre 9 dominios):

1. **Legajo abierto** — un evento por cada legajo del NNyA (`legajos.nnya_id = <id>`); `fecha_apertura` siempre presente.
2. **Legajo cerrado** — un evento por legajo con `fecha_cierre IS NOT NULL` (legajo cerrado/archivado).
3. **Intervención registrada** — un evento por fila de `intervenciones` del NNyA.
4. **Incidente registrado** — un evento por fila de `incidentes` del NNyA.
5. **Diagnóstico registrado** — un evento por fila de `diagnosticos` del NNyA.
6. **Medicación iniciada** — un evento por fila de `medicamentos` (`fecha_inicio` siempre presente).
7. **Medicación finalizada** — un evento por medicamento con `fecha_fin IS NOT NULL`. Si `fecha_fin` es `NULL`, el tratamiento sigue en curso y **no** genera evento de finalización.
8. **Audiencia judicial** — un evento por fila de `audiencias_judiciales` del NNyA.
9. **Vínculo de tutela iniciado** — un evento por fila de `vinculos_tutela` (`vigente_desde` siempre presente).
10. **Vínculo de tutela finalizado** — un evento por vínculo con `vigente_hasta IS NOT NULL`. Si es `NULL`, el vínculo sigue vigente y **no** genera evento de finalización.
11. **Egreso** — un único evento si `nnya.fecha_egreso IS NOT NULL`. El `CHECK chk_nnya_fecha_egreso_coherente` garantiza que `fecha_egreso` solo existe cuando `estado_actual = 'Egresado'`.
12. **Seguimiento post-egreso programado** — un evento por cada hito de `seguimiento_post_egreso` (`fecha_programada` siempre presente; los hitos los crea el trigger al egresar: 30 y 60 días).
13. **Contacto de seguimiento realizado** — un evento por hito con `fecha_contacto IS NOT NULL`.

**Diferencias a propósito respecto de la enumeración literal de #20/TAREAS-PENDIENTES-SOFI § 2** (a la vista de Jordy en § 14):

- #20 lista `vinculos_tutela.vigente_desde`; este análisis **agrega `vigente_hasta`** como evento separado de finalización (el vínculo puede haber terminado y eso es un hito).
- #20/TAREAS listan `seguimiento_post_egreso.fecha_contacto`; este análisis **agrega `fecha_programada`**, porque sin ese hito un egresado sin contactos registrados no tendría ningún evento de seguimiento, y las filas existen desde el egreso con `fecha_programada NOT NULL`.
- #20 (comentario) incluye `legajos` apertura **y cierre**, `medicamentos` **inicio y fin** y `audiencias_judiciales`; TAREAS-PENDIENTES-SOFI § 2 no. Se siguen los del comentario de #20.

---

## 4. Texto corto

Regla: texto mínimo, sin campos de texto libre. Se muestra **solo** el evento; ningún campo clínico, judicial ni narrativo. Texto propuesto (columna "Texto corto") y campos **opcionales** solo si aportan contexto **sin** revelar contenido sensible.

| Evento | Texto corto (fijo) | Campo opcional | Nota del opcional |
|---|---|---|---|
| Legajo abierto | `Legajo abierto` | `{numero_legajo}` | `numero_legajo` es un identificador administrativo, no contenido libre → seguro |
| Legajo cerrado | `Legajo cerrado` | — | `motivo_cierre` queda excluido |
| Intervención registrada | `Intervención registrada` | `{tipo}` | `tipo` es `VARCHAR(50)` **sin `CHECK`** (texto libre, `prompts/009`): validar antes de mostrarlo |
| Incidente registrado | `Incidente registrado` | `{gravedad}` | `gravedad` tiene `CHECK (leve/media/grave/critico)` → valor de dominio cerrado, seguro |
| Diagnóstico registrado | `Diagnóstico registrado` | — | `tipo` clínico y `descripcion` quedan excluidos |
| Medicación iniciada | `Medicación iniciada` | — | `nombre`/`dosis`/`frecuencia` quedan excluidos |
| Medicación finalizada | `Medicación finalizada` | — | idem |
| Audiencia judicial | `Audiencia judicial` | `{estado}` | `estado` tiene `CHECK (programada/realizada/suspendida/cancelada)` → seguro |
| Vínculo de tutela iniciado | `Vínculo de tutela iniciado` | `{tipo}` | `tipo` tiene `CHECK (tutela_residencia/revinculacion_familiar/referente_afectivo)` → revela contexto familiar/judicial: **a aprobar por Jordy** (§ 14) |
| Vínculo de tutela finalizado | `Vínculo de tutela finalizado` | — | `motivo_finalizacion` queda excluido |
| Egreso registrado | `Egreso registrado` | — | no existe "tipo de egreso" en el modelo (D-18): no inventar |
| Seguimiento post-egreso programado | `Seguimiento post-egreso programado` | `{dias_post_egreso}` | `CHECK (dias_post_egreso IN (30,60))` → seguro (hito, no dato clínico) |
| Contacto de seguimiento realizado | `Contacto de seguimiento realizado` | `{dias_post_egreso}` | idem |

**Campos prohibidos en el texto corto** (nunca se muestran; pertenecen a la vista de detalle de cada entidad, no al timeline):

- `diagnosticos`: `descripcion`, `tipo`, `profesional`, `institucion`.
- `medicamentos`: `nombre`, `dosis`, `frecuencia`, `via_administracion`, `prescriptor`, `observaciones`, `diagnostico_id`.
- `audiencias_judiciales`: `caratula`, `numero_expediente`, `juzgado`, `tribunal`, `resultado`, `observaciones`.
- `vinculos_tutela`: `resolucion_respaldo`, `motivo_finalizacion`, `observaciones`, `referente_id`.
- `incidentes`: `descripcion`, `acciones_tomadas`, `gravedad_sugerida`.
- `intervenciones`: `descripcion`, `resultado`, `observaciones`.
- `legajos`: `motivo_cierre`, `observaciones`.
- `seguimiento_post_egreso`: `detalle_incumplimiento`, `observaciones`, `salud`, `terapias`, `escolaridad`.
- Todo `created_at` / `updated_at` / `created_by` / `profesional_id` / `usuario_id` / `contactado_por`.

El botón "ver más" o el detalle al hacer clic en un evento (si #45 lo incluye) queda **fuera de este análisis**: acá solo se define el texto corto.

---

## 5. Sensibilidad

Clasificación según lo que revela el evento por su mera existencia (sin abrir la entidad):

| Evento | Clasificación | Por qué |
|---|---|---|
| Diagnóstico registrado | **SALUD** | Revela que el NNyA tiene un diagnóstico de salud |
| Medicación iniciada / finalizada | **SALUD** | Revela tratamiento farmacológico |
| Audiencia judicial | **JUDICIAL** | Revela proceso judicial en curso |
| Vínculo de tutela iniciado / finalizado | **JUDICIAL** | Medida de protección/tutela |
| Incidente registrado | Administrativa-conductual (sensible potencial) | El hecho de un incidente es interno; su detalle es sensible |
| Intervención registrada | Administrativa-técnica (sensible potencial) | Intervención de un profesional (puede ser psicosocial) |
| Legajo abierto / cerrado | Administrativa | Trazabilidad interna; `motivo_cierre` puede contener dato judicial |
| Egreso registrado | Administrativa | Fin de la medida de protección |
| Seguimiento programado / contacto realizado | Administrativa (adyacente a salud) | Hito de seguimiento; `salud`/`terapias` son estados de cumplimiento, no dato clínico |

**Reglas de minimización del timeline:**

1. El timeline indica **que el evento ocurrió y cuándo**, nunca el contenido.
2. Salud y judicial se marcan como sensibles en la UI (badge/ícono) pero se **muestran** a quien hoy puede leer la tabla (ver § 6), porque los roles del sistema son de confianza (profesionales de la residencia). Ninguno de los 9 dominios se excluye por completo del timeline.
3. El campo sensible **no viaja** al timeline: solo salen los textos cortos de § 4 y, a lo sumo, los opcionales de dominio cerrado.
4. Concentración de datos: el timeline **reúne** en un solo lugar datos que hoy están repartidos por pestañas. Es una superficie nueva de exposición aunque no agregue datos: refuerza la necesidad de respetar RLS (§ 6) y de no cachear ni loguear el resultado con datos sensibles.

> **Decisión abierta para Jordy (§ 14):** si algún evento sensible (p. ej. medicación o tutela con su `tipo`) debería quedar reducido al mínimo o directamente fuera del timeline.

---

## 6. Permisos

**Roles hoy:** solo **`Admin`** y **`Equipo Tecnico`**. El rol `Educador` fue eliminado (`20260522000027_remove_educador_role.sql`; sus usuarios se reasignaron a `Equipo Tecnico`).

**Lectura (SELECT) por tabla — verificado en las políticas reales:**

| Dominio | Política SELECT | Roles que pueden leer |
|---|---|---|
| `legajos` | `legajos_admin_tecnico_all` | Admin, Equipo Tecnico |
| `intervenciones` | `intervenciones_admin_tecnico_all` | Admin, Equipo Tecnico |
| `incidentes` | `incidentes_admin_tecnico_all` | Admin, Equipo Tecnico |
| `diagnosticos` | `diagnosticos_admin_tecnico_all` | Admin, Equipo Tecnico |
| `medicamentos` | `medicamentos_admin_tecnico_all` | Admin, Equipo Tecnico |
| `audiencias_judiciales` | `audiencias_admin_tecnico_all` | Admin, Equipo Tecnico |
| `nnya` | `nnya_admin_tecnico_all` | Admin, Equipo Tecnico |
| `vinculos_tutela` | `vinculos_tutela_select_admin_tecnico` | Admin, Equipo Tecnico |
| `seguimiento_post_egreso` | `seguimiento_post_egreso_select_admin_tecnico` | Admin, Equipo Tecnico |

Las políticas `*_all` usan `USING (get_my_role() IN ('Admin','Equipo Tecnico'))` sobre `TO authenticated`. Las dos con `_select_` son solo de lectura; la escritura de tutela es `Admin` y la de seguimiento es `Admin`/`contactado` (no afecta al timeline, que es de solo lectura).

**Reglas:**

1. El timeline es de **solo lectura** y **respeta RLS**: usa la sesión del usuario (los hooks patrón ya lo hacen), sin `service_role` ni queries administrativas.
2. **No** se crean permisos ni políticas nuevas y **no** se hace bypass de RLS. Si el timeline "necesita" ver algo que RLS oculta, la respuesta es **no mostrarlo**, no relajar la política.
3. Hoy ambos roles ven el timeline completo (mismo conjunto de filas). No hay asimetría de lectura entre `Admin` y `Equipo Tecnico` para estos 9 dominios.
4. **Nota a futuro:** si aparece un rol más limitado (p. ej. un/a educador/a que no deba ver salud/judicial), habrá que revisar el acceso al timeline. Hoy **no aplica** porque ese rol no existe.

---

## 7. Orden cronológico

**Orden principal:** `fecha_evento` **DESC** (lo más reciente primero).

**Desempate propuesto, en este orden:**

1. Mismo día → primero los eventos **con hora real** (`incidentes`, `audiencias_judiciales`, `fecha_contacto`); los eventos **DATE sin hora** van después.
2. Entre los eventos con hora → por **hora DESC** (consistente con "lo más reciente primero").
3. Entre los eventos DATE sin hora (y ante timestamps idénticos) → **orden fijo de tipo** (abajo).
4. Empate final → `id` **ASC** (determinista).

**Orden fijo de tipo propuesto** (conserva el orden relativo de la enumeración de #20, omitiendo los que siempre traen hora):

1. Legajo abierto
2. Legajo cerrado
3. Intervención registrada
4. Diagnóstico registrado
5. Medicación iniciada
6. Medicación finalizada
7. Vínculo de tutela iniciado
8. Vínculo de tutela finalizado
9. Egreso registrado
10. Seguimiento post-egreso programado

**Prohibiciones explícitas:**

- No inventar horas, no usar `00:00` ficticio para los eventos DATE.
- No ordenar por `created_at` / `updated_at`.
- No usar el orden de llegada de la red como desempate (debe ser determinista).

> **Decisión abierta para Jordy (§ 14):** dirección del desempate dentro del día (hora DESC vs ASC) y el orden fijo de tipos. La alternativa es mostrar el bloque sin hora en orden **inverso** (fase más reciente primero, para mantener "lo último arriba"). Este plan propone el orden de arriba (narrativo ascendente dentro del día).

---

## 8. Fechas faltantes / NULL

Regla madre: **una fecha `NULL` no genera evento.** No se inventa ni se sustituye por otra.

| Columna | Si es `NULL` |
|---|---|
| `legajos.fecha_cierre` | El legajo está abierto/no cerrado → **no** hay evento "Legajo cerrado". |
| `medicamentos.fecha_fin` | Tratamiento en curso → **no** hay "Medicación finalizada". |
| `vinculos_tutela.vigente_hasta` | Vínculo vigente → **no** hay "Vínculo de tutela finalizado". |
| `nnya.fecha_egreso` | El NNyA no egresó → **no** hay "Egreso". |
| `seguimiento_post_egreso.fecha_contacto` | Contacto no registrado → **no** hay "Contacto de seguimiento realizado" (el hito "programado" sí existe). |

**Caso borde detectado (a resolver con Jordy, § 14):** `seguimiento_post_egreso` tiene `contacto_realizado` (boolean NOT NULL) y `fecha_contacto` (nullable) por separado. Puede haber una fila con `contacto_realizado = true` y `fecha_contacto = NULL` (sin fecha funcional). Propuesta: el evento "Contacto realizado" depende **solo** de `fecha_contacto IS NOT NULL`; si `contacto_realizado = true` pero no hay fecha, **no** se muestra el evento (no se inventa fecha) y se documenta como dato incompleto. Ver decisión D-7.

---

## 9. Filtros

Propuesta de filtros (botones/segmentos), agrupando los 13 eventos en 8 vistas:

| Filtro | Eventos que incluye |
|---|---|
| **Todos** (default) | Los 13 |
| Legajo | Legajo abierto + Legajo cerrado |
| Intervenciones | Intervención registrada |
| Incidentes | Incidente registrado |
| Salud | Diagnóstico registrado + Medicación iniciada + Medicación finalizada |
| Judicial | Audiencia judicial + Vínculo de tutela iniciado + Vínculo de tutela finalizado |
| Egreso | Egreso registrado |
| Seguimiento | Seguimiento post-egreso programado + Contacto de seguimiento realizado |

- **"Salud"** y **"Judicial"** son los dos filtros que agrupan dominios sensibles; coinciden con la clasificación de § 5.
- **Período desde/hasta**: **OPCIONAL**, no obligatorio en la primera versión. Si se agrega, filtra por `fecha_evento` (no por fecha de carga) y no altera el orden definido en § 7.
- **No** se agregan filtros por usuario, `estado` ni profesional: exceden el pedido de #20 ("por tipo de evento o por período") y suman superficie.

---

## 10. Ubicación

- El timeline se muestra en la ficha del NNyA: `app/(dashboard)/nnya/[id]/page.tsx`.
- Hoy esa página muestra datos personales + legajo + tutores; no hay timeline.
- La implementación (componente + hook + badges) es de **#45** (Jordy), reusando el diseño de `TimelineNnyaDemo` (PR #42 de Cami) y los badges de `docs/design-system.md`. Este análisis **no** toca la página.

---

## 11. Criterios de aceptación (QA de Meli)

Se verifican cuando #45 esté implementado, contra datos reales de un NNyA con historia:

1. Aparecen exactamente los 13 eventos de § 3, sin duplicados, leyendo de las tablas/columnas de § 2 (ningún evento sale de `created_at`/`updated_at`).
2. Un NNyA **activo sin egreso** no muestra "Egreso" ni eventos de "Seguimiento".
3. Un NNyA **egresado** muestra "Egreso" con la fecha correcta y sus 2 hitos de seguimiento "programados" (30 y 60 días) creados por el trigger.
4. Un legajo **cerrado** muestra "Legajo cerrado"; uno abierto, no.
5. Un medicamento en curso (`fecha_fin NULL`) **no** muestra "Medicación finalizada"; uno con `fecha_fin`, sí.
6. Un vínculo de tutela vigente (`vigente_hasta NULL`) **no** muestra "Vínculo de tutela finalizado"; uno finalizado, sí.
7. El orden es `fecha DESC`; ante el mismo día, los eventos con hora real van antes que los DATE y ordenados por hora DESC (según lo que Jordy apruebe en § 14).
8. El texto corto **no** muestra ningún campo de la lista de prohibidos de § 4 (salud: nombre/dosis del medicamento, descripción/tipo del diagnóstico; judicial: carátula/expediente/resultado/motivo de finalización).
9. Los filtros de § 9 funcionan: cada uno muestra exactamente los eventos que le corresponden; "Todos" muestra los 13.
10. Con un usuario `Admin` y con uno `Equipo Tecnico` se ve el mismo timeline (RLS deja leer las 9 tablas a ambos).
11. El timeline respeta RLS: no hay consultas con `service_role` ni bypass.

---

## 12. Tabla funcional final

| Evento | Tabla | Columna de fecha | ¿Tiene hora? | Texto corto | Sensibilidad | Filtro |
|---|---|---|---|---|---|---|
| Legajo abierto | `legajos` | `fecha_apertura` | No | Legajo abierto | Administrativa | Legajo |
| Legajo cerrado | `legajos` | `fecha_cierre` | No | Legajo cerrado | Administrativa | Legajo |
| Intervención registrada | `intervenciones` | `fecha` | No | Intervención registrada | Administrativa-técnica | Intervenciones |
| Incidente registrado | `incidentes` | `fecha_hora` | **Sí** | Incidente registrado | Administrativa-conductual | Incidentes |
| Diagnóstico registrado | `diagnosticos` | `fecha_diagnostico` | No | Diagnóstico registrado | **Salud** | Salud |
| Medicación iniciada | `medicamentos` | `fecha_inicio` | No | Medicación iniciada | **Salud** | Salud |
| Medicación finalizada | `medicamentos` | `fecha_fin` | No | Medicación finalizada | **Salud** | Salud |
| Audiencia judicial | `audiencias_judiciales` | `fecha_hora` | **Sí** | Audiencia judicial | **Judicial** | Judicial |
| Vínculo de tutela iniciado | `vinculos_tutela` | `vigente_desde` | No | Vínculo de tutela iniciado | **Judicial** | Judicial |
| Vínculo de tutela finalizado | `vinculos_tutela` | `vigente_hasta` | No | Vínculo de tutela finalizado | **Judicial** | Judicial |
| Egreso | `nnya` (columna) | `fecha_egreso` | No | Egreso registrado | Administrativa | Egreso |
| Seguimiento post-egreso programado | `seguimiento_post_egreso` | `fecha_programada` | No | Seguimiento post-egreso programado | Administrativa (adh. salud) | Seguimiento |
| Contacto de seguimiento realizado | `seguimiento_post_egreso` | `fecha_contacto` | **Sí** | Contacto de seguimiento realizado | Administrativa (adh. salud) | Seguimiento |

---

## 13. Fuera de alcance

- **IA / resumen en lenguaje natural** del historial (dato de salud/judicial de menores a un proveedor externo). Explícitamente excluido.
- Implementación del timeline (consulta/vista, hook, componente, badges, tests) → **#45**, Jordy.
- Schema nuevo, migraciones, columnas, vistas.
- Cambios de RLS, roles o permisos.
- Dominios fuera de los 9 de #20: turnos, actividades, novedades, alertas, informes, documentos, transferencia AUH.
- **Tipo de egreso** (no existe; D-18 pendiente).
- Timeline en mobile.
- Detalle/expansión de cada evento al hacer clic (solo se define el texto corto).

---

## 14. Decisiones propuestas para aprobación de Jordy

Ninguna de estas está aprobada; se proponen y esperan su decisión antes de implementar #45.

1. **D-1 — Medicación finalizada**: ¿es un evento separado de "Medicación iniciada"? (Propuesta: sí, con `fecha_fin`.)
2. **D-2 — Vínculo de tutela finalizado**: ¿evento separado de "Vínculo iniciado"? (Propuesta: sí, con `vigente_hasta`; #20 solo listaba `vigente_desde`.)
3. **D-3 — Textos mínimos de salud y judiciales**: ¿se limitan al texto fijo de § 4 sin ningún campo extra? (Propuesta: sí; `{estado}` de audiencia y `{tipo}` de tutela serían los únicos opcionales judiciales, a confirmar.)
4. **D-4 — Orden dentro del mismo día**: ¿eventos con hora primero, hora DESC, y luego los sin hora? (Propuesta: sí, § 7.)
5. **D-5 — Orden fijo de los eventos sin hora**: ¿se usa la lista de § 7 (narrativa ascendente conservando el orden de #20)? Alternativa: orden inverso.
6. **D-6 — Filtros**: ¿los 8 de § 9, con "Salud" y "Judicial" agrupados, y período **opcional**? (Propuesta: sí.)
7. **D-7 (extra, detectada en el modelo) — Contacto de seguimiento**: definir el evento por `fecha_contacto IS NOT NULL` (y no por `contacto_realizado`), dejando sin evento los casos `contacto_realizado = true` con `fecha_contacto NULL`. (Ver § 8.)

---

## Skills utilizadas

`documentation` (mantenimiento/análisis de documentación del proyecto) y `domain-validation` (contraste del modelo con los procesos reales de la residencia).

## Supuestos

- El timeline es **por NNyA** e incluye la historia de **todos** sus legajos (se filtra por `nnya_id`, no por `legajo_id`).
- Los roles actuales (`Admin`, `Equipo Tecnico`) son de confianza y pueden ver los eventos sensibles tal como hoy pueden leer las tablas subyacentes.
- `types/database.generated.ts` refleja el schema real (fuente de verdad; regenerable).
- Los nombres de columna citados son los reales del generador (no los del enunciado informal del pedido).

## Archivos a crear / modificar

- **Crear:** este archivo, `prompts/043-analisis-funcional-timeline-nnya.md`. Único cambio.
- **Modificar:** ninguno. No se toca código, schema, migraciones ni RLS.

## Chequeos

Este plan es de análisis (no de código), así que los chequeos técnicos se limitan a verificar que las referencias de datos sean ciertas:

- Referencias de tablas/columnas contrastadas contra `types/database.generated.ts` (§ 2 y § 12).
- `legajo_id NOT NULL` y `nnya_id NOT NULL` verificados (`20260915193141`, tipos).
- Políticas RLS verificadas contra `20260514000017_rls_policies.sql` y `20260827000034_*.sql`.
- `git diff --check` (sin errores de whitespace).
- `git status --short` (solo el archivo nuevo).

## Verificación manual

1. Abrir `prompts/043-analisis-funcional-timeline-nnya.md` y contrastar la tabla de § 12 contra `types/database.generated.ts`.
2. `git status --short` → debe listar únicamente `prompts/043-analisis-funcional-timeline-nnya.md`.
3. `git diff --check` → sin salida.
4. Confirmar que **no** se tocó ningún archivo de `app/`, `hooks/`, `supabase/`, `lib/` ni `types/`.
