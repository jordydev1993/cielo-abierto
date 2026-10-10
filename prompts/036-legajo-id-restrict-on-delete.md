# 036 — `ON DELETE CASCADE` en `legajo_id`: cambiar a `RESTRICT`

**Tarjeta:** sin tarjeta (pendiente del panel) — Jordy — Media
**Estado:** ✓ Aprobado el 2026-10-10 con la recomendación de § Decisión: las 6 FKs de `legajo_id` más `validaciones_renaper.referente_id` y `nnya_tutores.tutor_id`. `propuestas_mejora.evaluacion_id` queda en `CASCADE`.

## Objetivo

Que borrar un legajo no borre en cascada sus turnos, diagnósticos, medicamentos, informes, documentos y audiencias judiciales. Es el mismo criterio que `prompts/025` (14 tablas con `nnya_id`) y que la migración `20261003193718` (`incidentes.legajo_id`): la baja de un legajo es lógica (`estado = 'archivado'`), nunca un borrado físico que se lleve la historia del caso.

## Contexto

Verificado en producción el 10/10/2026 (solo lectura, `pg_constraint`):

| Tabla | FK | `ON DELETE` hoy | `legajo_id` | Filas hoy |
|---|---|---|---|---|
| `turnos` | `turnos_legajo_id_fkey` | CASCADE | NOT NULL | 5 |
| `diagnosticos` | `diagnosticos_legajo_id_fkey` | CASCADE | NOT NULL | 4 |
| `medicamentos` | `medicamentos_legajo_id_fkey` | CASCADE | NOT NULL | 3 |
| `informes` | `informes_legajo_id_fkey` | CASCADE | NOT NULL | 4 |
| `documentos` | `documentos_legajo_id_fkey` | CASCADE | NOT NULL | 4 |
| `audiencias_judiciales` | `audiencias_judiciales_legajo_id_fkey` | CASCADE | NOT NULL | 3 |
| `incidentes` | `incidentes_legajo_id_fkey` | RESTRICT (desde 03/10) | NOT NULL | — |

- **El riesgo es real hoy:** la política `legajos_admin_tecnico_all` (`ALL`, `authenticated`) deja que cualquier usuario con sesión borre un legajo por la API. Con `CASCADE`, eso borra las 23 filas que cuelgan de los 5 legajos actuales, y el `audit_log` registra los borrados pero el caso pierde su historia.
- **`documentos`:** el borrado en cascada borra la fila pero no el archivo del bucket privado `documentos`, que queda huérfano.
- **`SET NULL` no es opción:** `legajo_id` es `NOT NULL` en las 6 tablas desde `20260915193141`, y un turno o un informe sin legajo pierde su contexto (mismo razonamiento que `prompts/025`).
- **No cambia el comportamiento de la app:** ningún hook borra legajos (`hooks/legajos/` solo tiene crear, leer y actualizar).

## Archivos inspeccionados

- Producción, solo lectura: `pg_constraint` (FKs hacia `legajos` y todas las `CASCADE` de `public`), conteo de filas de las 6 tablas, `pg_policies` de `legajos`.
- `supabase/migrations/20261003193718_incidentes_legajo_id_restrict_on_delete.sql` (patrón a seguir).
- `supabase/migrations/20260620000031_clean_schema.sql` (definición original de las FKs y políticas del bucket `documentos`).
- `prompts/025-nnya-id-restrict-on-delete.md` (mismo cambio para `nnya_id`).
- `hooks/legajos/*` (sin borrado).

## Cambio propuesto

Migración `supabase/migrations/20261010220118_legajo_id_restrict_on_delete.sql` (aplicada en producción el 10/10, verificada con `pg_constraint`), una sola transacción, mismo patrón que la de incidentes, para las 6 tablas:

```sql
ALTER TABLE public.turnos DROP CONSTRAINT turnos_legajo_id_fkey;
ALTER TABLE public.turnos
  ADD CONSTRAINT turnos_legajo_id_fkey
  FOREIGN KEY (legajo_id) REFERENCES public.legajos(id) ON DELETE RESTRICT;
-- ídem diagnosticos, medicamentos, informes, documentos, audiencias_judiciales
```

Sin cambios de datos ni de RLS. Un cambio de código (ver § Efecto en la app).

## Efecto en la app (encontrado al implementar, decisión de Jordy: opción A)

La pantalla de Tutores tiene "Eliminar" (`useDeleteTutor`) y los 4 tutores de producción tienen NNyA asignados. Con `RESTRICT` en `nnya_tutores.tutor_id`, eliminar un tutor con vínculos falla en lugar de borrarlos en silencio. Para que el usuario entienda qué hacer, `app/(dashboard)/tutores/page.tsx` traduce el error `23503` a "El tutor tiene NNyA asignados. Desasignalo de cada NNyA antes de eliminarlo." Un tutor sin vínculos se sigue eliminando igual.

## Decisión (Jordy, 2026-10-10)

En `public` quedan otras 5 FKs con `CASCADE`, fuera del alcance original. **Decisión: se aplica la recomendación.** Entran `validaciones_renaper.referente_id` y `nnya_tutores.tutor_id`; las 3 de evaluación institucional quedan en `CASCADE`.

| FK | Qué borra en cascada | Recomendación |
|---|---|---|
| `validaciones_renaper.referente_id` → `referentes` | Las validaciones RENAPER de un referente, que son evidencia inmutable (sin UPDATE ni DELETE por RLS) | **Incluir:** contradice que la evidencia no se pueda borrar |
| `nnya_tutores.tutor_id` → `tutores` | El vínculo tutor–NNyA | **Incluir:** la migración de Didit (#18) cuelga `autorizaciones_retiro` de `nnya_tutores` con `RESTRICT`; con esta cascada, borrar un tutor falla de forma confusa |
| `evaluacion_institucional_asistentes.evaluacion_id` | Los asistentes de una evaluación | Dejar: son parte de la evaluación |
| `evaluacion_institucional_casos.evaluacion_id` | Los casos revisados en una evaluación | Dejar: son parte de la evaluación |
| `propuestas_mejora.evaluacion_id` | Las propuestas nacidas de una evaluación | A decidir: tienen ciclo de vida propio (kanban, D-9), pero nacen de la evaluación |

## Supuestos

1. La baja de un legajo sigue siendo lógica (`estado`), como la de un NNyA (`activo`).
2. Nadie necesita hoy borrar físicamente un legajo con historia. Si hiciera falta (por ejemplo, un legajo creado por error), se borran primero sus filas o se archiva.

## Criterios de aceptación

1. Las 6 FKs quedan en `RESTRICT` (y las que Jordy sume en § Decisión pendiente).
2. `DELETE FROM legajos WHERE id = <legajo con un turno>` falla con `violates foreign key constraint`.
3. Un legajo sin filas asociadas se sigue pudiendo borrar.
4. La app no cambia: crear, editar y archivar legajos funciona igual.
5. Eliminar un tutor con NNyA asignados muestra "El tutor tiene NNyA asignados…" y no borra nada; un tutor sin vínculos se elimina.

## Verificación

- Aplicar en Supabase local (D-7) y correr los criterios 2 y 3.
- En producción, después de aplicar: repetir la consulta de `pg_constraint` y confirmar `RESTRICT` en todas.
- `npm run lint` y `npm run build` (no deberían cambiar: no se toca código).
- `get_advisors` de seguridad sin avisos nuevos.
