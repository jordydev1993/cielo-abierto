# 011 — Agregar `fecha_egreso` a `nnya` (FASE A0)

## Objetivo

Cerrar el gap descrito en `AGENTS-WEB.md` sección 11 (FASE A, A0): el proceso 1.5 (Egreso o
Reintegración Familiar) necesita la fecha de egreso como dato de primera clase — de ella
se calculan los seguimientos post-egreso a 30 y 60 días (A0 es prerrequisito de FASE E).

Hoy esa fecha no existe como columna. Se infiere combinando
`nnya.estado_actual = 'Egresado'` con `legajos.fecha_cierre` del legajo correspondiente.
Ese cálculo es frágil: `fecha_cierre` es el cierre *administrativo* del legajo, que puede
no coincidir con el día real de egreso, y el schema permite más de un legajo por NNyA
(`legajos.nnya_id` no es único) aunque hoy no ocurra en los datos.

## Contexto — estado real verificado

Verificado contra la base real (proyecto Supabase conectado, no una copia):

- `nnya.estado_actual` CHECK admite 4 valores: `'En residencia'`, `'En proceso de egreso'`,
  `'Egresado'`, `'Fallecido'` (`supabase/migrations/20260620000031_clean_schema.sql:55-56`).
- `legajos.fecha_cierre` es `DATE NULL` (nullable) — el legajo puede seguir abierto aunque
  el NNyA ya figure egresado, o viceversa.
- Datos reales hoy: **1 solo NNyA** con `estado_actual = 'Egresado'** (Bautista Díaz,
  `nnya.id = 30000000-0000-0000-0000-000000000005`), con **exactamente 1 legajo**
  (`LEG-2022-008`, `estado = 'cerrado'`, `fecha_cierre = 2025-01-10`).
- Confirmado por query: **ningún NNyA tiene más de un legajo** en los datos actuales
  (`SELECT nnya_id, count(*) FROM legajos GROUP BY nnya_id HAVING count(*) > 1` → 0 filas).
- Conclusión del backfill: **caso limpio, sin ambigüedad** — no hay NNyA `'Egresado'` sin
  legajo cerrado, ni NNyA con múltiples legajos cerrados que obliguen a desambiguar. No
  hay casos raros para reportar antes de aplicar el `CHECK`.

`fn_audit_trigger` (`20260514000018_audit_log.sql`) audita filas (`INSERT`/`UPDATE`/
`DELETE`), no cambios de esquema — un `ALTER TABLE` no genera entrada en `audit_log` por
diseño actual. El backfill de esta migración sí es un `UPDATE` de datos y **va a quedar
auditado automáticamente** por el trigger `trg_audit_nnya` ya existente en la tabla.

## Plan de la migración

Archivo nuevo: `supabase/migrations/20260826000032_add_fecha_egreso_nnya.sql`

1. **Agregar columna**
   ```sql
   ALTER TABLE nnya ADD COLUMN fecha_egreso DATE NULL;
   ```

2. **Backfill** — por cada NNyA `Egresado`, tomar `fecha_cierre` del legajo *más reciente*
   por `fecha_cierre` (desambigua el caso de varios legajos cerrados, aunque hoy no exista):
   ```sql
   UPDATE nnya n
   SET fecha_egreso = l.fecha_cierre
   FROM (
     SELECT DISTINCT ON (nnya_id) nnya_id, fecha_cierre
     FROM legajos
     WHERE fecha_cierre IS NOT NULL
     ORDER BY nnya_id, fecha_cierre DESC
   ) l
   WHERE l.nnya_id = n.id
     AND n.estado_actual = 'Egresado';
   ```

3. **Verificación previa al CHECK** (dentro de la misma migración, antes del paso 4):
   ```sql
   DO $$
   DECLARE
     n_inconsistentes INT;
   BEGIN
     SELECT count(*) INTO n_inconsistentes
     FROM nnya WHERE estado_actual = 'Egresado' AND fecha_egreso IS NULL;

     IF n_inconsistentes > 0 THEN
       RAISE EXCEPTION
         'Backfill incompleto: % NNyA en estado Egresado sin fecha_egreso resuelta. No se aplica el CHECK.',
         n_inconsistentes;
     END IF;
   END $$;
   ```
   Con los datos reales de hoy esto no debería disparar nunca (verificado arriba: 0 casos),
   pero se deja como salvaguarda para no dejar el CHECK aplicado sobre datos inconsistentes
   si el escenario cambia entre que se escribe este plan y se corre la migración.

4. **Constraint de coherencia** (solo si el paso 3 no abortó):
   ```sql
   ALTER TABLE nnya ADD CONSTRAINT chk_nnya_fecha_egreso_coherente
     CHECK ((estado_actual = 'Egresado') = (fecha_egreso IS NOT NULL));
   ```

## Supuestos

- No se toca `legajos.fecha_cierre` ni su semántica — sigue siendo el cierre administrativo
  del legajo, independiente de `nnya.fecha_egreso`.
- No se agrega trigger que sincronice `fecha_egreso` automáticamente al cambiar
  `estado_actual` a `'Egresado'` — queda fuera de alcance de A0; si FASE E lo necesita, se
  evalúa en su propio prompt (evita meter lógica de negocio no pedida en una migración de
  schema).
- El desempate "legajo más reciente por `fecha_cierre`" es una decisión razonable para el
  caso hipotético de múltiples legajos cerrados, pero no hay dato real hoy que la ejercite
  — se documenta acá para que quede registrada, no para resolver un caso que no existe.

## Seguridad

- No cambia RLS: `fecha_egreso` es una columna más de `nnya`, cubierta por las policies
  existentes de esa tabla (no requiere policy nueva).
- No expone datos nuevos al cliente — es la misma tabla que ya se lee/edita hoy en
  `hooks/nnya` y `components/entities/nnya`.

## Criterios de aceptación

- `SELECT count(*) FROM nnya WHERE estado_actual='Egresado' AND fecha_egreso IS NULL` → `0`.
- El `CHECK chk_nnya_fecha_egreso_coherente` queda activo (`\d nnya` lo muestra).
- Las 17 tablas siguen intactas (mismo conteo de tablas y de filas salvo el `UPDATE` del
  backfill, que no cambia cantidad de filas, solo la columna nueva).
- No se rompe ningún hook/formulario existente de `nnya` (la columna es nullable salvo por
  el CHECK, y ningún código actual la referencia todavía).

## Chequeos

- Aplicar la migración contra el proyecto conectado y correr las 2 queries de validación
  del bloque "Contexto" de nuevo, ahora post-migración.
- `tsc --noEmit` (por si `types/database.types.ts`, escrito a mano, necesita la columna
  nueva agregada manualmente — es la misma deuda ya documentada en
  `03-incumplimientos-debilidades-SOFI.md` punto 6).

## Verificación manual

- Confirmar en el editor de tablas de Supabase (o vía SQL) que Bautista Díaz
  (`30000000-...05`) quedó con `fecha_egreso = 2025-01-10`.
- Confirmar que ningún otro NNyA cambió de valor en ninguna otra columna.

---

**Estado**: implementado y verificado contra la base real (`add_fecha_egreso_nnya`
aplicada vía Supabase).

## Verificación post-implementación

- Backfill: `Bautista Díaz` (única fila `Egresado`) quedó con `fecha_egreso = 2025-01-10`;
  las otras 4 filas de `nnya` quedaron con `fecha_egreso = NULL` y ninguna otra columna
  cambió.
- `SELECT count(*) FROM nnya WHERE estado_actual='Egresado' AND fecha_egreso IS NULL` → `0`.
- `chk_nnya_fecha_egreso_coherente` activo (confirmado vía `pg_constraint`).
- 17 tablas en `public` sin cambios (confirmado vía `information_schema.tables`).
- `types/database.types.ts` — se agregó `fecha_egreso: string | null` a la interfaz
  `Nnya` (es la misma deuda de tipos-escritos-a-mano de
  `03-incumplimientos-debilidades-SOFI.md` punto 6: cada columna nueva requiere este paso
  manual). `tsc --noEmit` pasa sin errores.

### Hallazgo no esperado: el trigger de auditoría no existe en la base real

El plan asumía que el `UPDATE` del backfill quedaría auditado por `trg_audit_nnya`
(`20260514000018_audit_log.sql`). Al verificar, la base real no tiene **ningún** trigger
`trg_audit_%` en ninguna tabla (`pg_trigger` → 0 filas) y `audit_log` tiene 0 filas en
total. Además `audit_log` en la base real tiene columnas distintas a las del archivo de
migración (`registro_id`/`usuario_id`/`created_at` en vez de
`id_registro`/`auth_uid`/`fecha`) — otro caso del patrón "Ojo con migraciones superseded"
que ya señala `AGENTS-WEB.md`: la migración de auditoría fue reemplazada o nunca aplicada tal
cual en este proyecto. **No se corrigió acá** (fuera de alcance de A0, y es exactamente
el tipo de hallazgo que `AGENTS-WEB.md` pide detectar y documentar, no arreglar sin
aprobación) — queda para un prompt aparte si se decide restaurar la auditoría.
