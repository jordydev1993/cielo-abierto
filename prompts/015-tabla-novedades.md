# PLAN 015 — Crear tabla `novedades` (F2/F3 mobile)

**Fecha:** 2026-09-12
**Autor:** Claude (ingeniero principal)
**Estado:** ✅ Implementado y verificado 2026-09-13
**Origen:** tarjeta del tablero (`arguello-infancias-mobile#10`). Consecuencia de `CORRECCIONES-Y-DUDAS-PARA-MELI-SOFI.md` §2: `novedades` es la única tabla genuinamente nueva del modelo mobile — `intervenciones`/`informes` son registros formales de legajo, `novedades` es un diario liviano en tiempo real, caso de uso distinto.

Sigue al plan 014 (`prompts/014-nnya-columnas-mobile.md`, ya mergeado) — vive en este repo por la misma razón: mismo Supabase compartido (decisión #3), `supabase/migrations/` es la fuente de verdad del schema.

---

## 1. Qué hace F2/F3 con esta tabla

- **F2** (mobile): un educador registra una novedad de un NNA — tipo + descripción. `skills/testing.md` CA-08 a CA-17: selector de tipo con opciones fijas, textarea de descripción, fecha/hora y usuario automáticos, sin campos de edición/eliminación en el alcance de F2.
- **F3** (mobile): timeline de esas novedades por NNA, ordenado por fecha descendente (CA-18).

---

## 2. Diseño de la tabla

Tomé como plantilla `incidentes` (mismo shape: `nnya_id` + tipo + descripción + `fecha_hora` + quién lo reportó), no el diseño original del docx, por 2 correcciones:

| Campo del docx | Cambio | Por qué |
|---|---|---|
| `residente_id` | → `nnya_id` | Ya decidido (§2 de la corrección) — no existe `residentes`. |
| `tipo_novedad` | → `tipo` | Cada tabla de este schema (`intervenciones.tipo`, `actividades.tipo`, `incidentes.tipo`) usa el nombre de columna corto `tipo`, no `tipo_<entidad>` — el nombre de la tabla ya dice de qué es. Sigo esa convención en vez de reintroducir un nombre distinto. |
| `usuario_id ... NOT NULL ... ON DELETE RESTRICT` | → `usuario_id ... NULL ... ON DELETE SET NULL` | El campo "quién lo hizo" en **todas** las tablas reales de este schema (`incidentes.reportado_por`, `intervenciones.profesional_id`/`created_by`, `actividades.responsable_id`/`created_by`, `alertas.completada_por`) es nullable con `ON DELETE SET NULL` — nunca `NOT NULL`/`RESTRICT`. La app siempre lo completa al crear (CA-12), pero a nivel de base sigo el patrón real: si el usuario se desactiva/elimina más adelante, la novedad no debe bloquear esa operación. |
| `deleted_at` (soft delete) | Se descarta | Ninguna tabla del schema actual tiene `deleted_at` — no es un patrón real de este proyecto (era aspiracional en la doc vieja). No lo introduzco solo para esta tabla. |

```sql
CREATE TABLE IF NOT EXISTS novedades (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id      UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  usuario_id   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo         VARCHAR(50) NOT NULL
               CHECK (tipo IN ('Salud', 'Educación', 'Comportamiento', 'Alimentación', 'Visita Familiar', 'Otro')),
  descripcion  TEXT NOT NULL,
  fecha_hora   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novedades_nnya_fecha ON novedades(nnya_id, fecha_hora DESC);

ALTER TABLE novedades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "novedades_admin_tecnico_all" ON novedades
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));
```

El índice compuesto `(nnya_id, fecha_hora DESC)` es la única adición sobre el patrón base (`idx_incidentes_nnya` solo indexa `nnya_id`) — se justifica porque F3 es explícitamente un timeline ordenado por fecha por NNA (CA-18), la consulta que este índice acelera.

La política RLS replica exactamente `incidentes_admin_tecnico_all` — con la decisión #1 ya tomada (`Equipo Tecnico` ≈ educador, `Admin`/`Administrador` ≈ coordinador vía `get_my_role()`), no hace falta distinguir roles dentro de esta política: cualquiera de los dos puede crear y leer novedades. F2 no tiene criterios de edición/eliminación (CA-08 a CA-17 son solo alta), así que no se agrega una política más granular que eso.

---

## 3. Qué NO incluye este plan

- No agrega edición ni eliminación de novedades — fuera del alcance de F2/F3 (`skills/testing.md`).
- No toca la UI de la web (ninguna pantalla web necesita `novedades` hoy).
- No es la conexión de mobile a Supabase — issue #16, sigue después de este plan.

---

## 4. Archivos

### Crear
```
arguello-infancias/supabase/migrations/20260912000036_create_novedades.sql
```

### Modificar
```
arguello-infancias/types/database.types.ts   (+ interfaz Novedad)
arguello-infancias/AGENTS-WEB.md             (Modelo de datos: 27 → 28 tablas)
```

---

## 5. `types/database.types.ts`

Sigo el patrón de `Intervencion` (línea 87):

```ts
export interface Novedad {
  id: string
  nnya_id: string
  usuario_id: string | null
  tipo: 'Salud' | 'Educación' | 'Comportamiento' | 'Alimentación' | 'Visita Familiar' | 'Otro'
  descripcion: string
  fecha_hora: string
  created_at: string
  updated_at: string
  usuarios?: Pick<Usuario, 'id' | 'nombre' | 'apellido'>
}
```

---

## 6. Validaciones

Aplicar la migración directo contra el proyecto Supabase real (como el plan 014) y verificar:

```sql
-- tabla + columnas
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'novedades';

-- el CHECK de tipo rechaza un valor inválido
INSERT INTO novedades (nnya_id, tipo, descripcion) VALUES ((SELECT id FROM nnya LIMIT 1), 'Recreo', 'x');  -- debe fallar

-- RLS activo
SELECT relrowsecurity FROM pg_class WHERE relname = 'novedades';  -- debe ser true

-- insert real válido, para confirmar que el resto de la tabla funciona
INSERT INTO novedades (nnya_id, usuario_id, tipo, descripcion)
VALUES ((SELECT id FROM nnya LIMIT 1), (SELECT id FROM usuarios LIMIT 1), 'Salud', 'Prueba de verificación del plan 015')
RETURNING id, fecha_hora;
-- y despues borrar esa fila de prueba
```

```bash
npm run lint
npm run build
```

---

## 7. Criterios de aceptación

| # | Criterio |
|---|---|
| D-01 | Tabla `novedades` existe con las columnas del diseño de §2 |
| D-02 | El `CHECK` de `tipo` rechaza valores fuera de las 6 opciones |
| D-03 | RLS habilitado, política `novedades_admin_tecnico_all` activa |
| D-04 | Un insert real con datos válidos funciona y devuelve `fecha_hora` con `DEFAULT NOW()` |
| D-05 | `types/database.types.ts` tiene la interfaz `Novedad` |
| D-06 | `AGENTS-WEB.md` refleja 28 tablas, con `novedades` listada |
| D-07 | `npm run lint`/`npm run build` sin errores nuevos (mismo criterio que el plan 014: comparar contra el estado preexistente) |

---

## 8. Tiempo estimado
~25 min (migración + verificación: 15 min · types + AGENTS-WEB.md: 10 min).

---

**Aprobación:** ✓ Aprobado (2026-09-13)

## 9. Resultado

Implementado tal como diseñado en §2. Migración aplicada directo contra el proyecto Supabase real.

Validaciones corridas:
- D-01: tabla + columnas confirmadas vía `information_schema.columns`.
- D-02: `INSERT` real con `tipo = 'Recreo'` rechazado con `23514 violates check constraint "novedades_tipo_check"`.
- D-03: `relrowsecurity = true`; política `novedades_admin_tecnico_all` confirmada (`get_my_role() = ANY (ARRAY['Admin','Equipo Tecnico'])` en `USING`/`WITH CHECK`).
- D-04: `INSERT` real válido devolvió `fecha_hora` con `DEFAULT NOW()`; fila de prueba borrada después (`count(*) = 0`).
- D-05: interfaz `Novedad` agregada a `types/database.types.ts`, siguiendo el patrón de `Intervencion`.
- D-06: `AGENTS-WEB.md` actualizado — 27 → 28 tablas, `novedades` listada, y las 2 menciones restantes de "27 tablas" (Seguridad, Deuda conocida #rol-rot) corregidas a 28 para no dejar el documento inconsistente.
- D-07: `npm run lint` → 63 problemas, idéntico al baseline confirmado en el plan 014 (sin errores nuevos). `npm run build` → limpio, 27 rutas compiladas.
