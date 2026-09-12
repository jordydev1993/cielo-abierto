# PLAN 014 — Columnas nuevas en `nnya` para mobile (`foto_url`, `alertas_importantes`, `turno_escolar`)

**Fecha:** 2026-09-12
**Autor:** Claude (ingeniero principal)
**Estado:** ✅ Implementado y verificado 2026-09-12
**Origen:** tarjeta del tablero (`arguello-infancias-mobile#9`), consecuencia de la decisión #2 de `CORRECCIONES-Y-DUDAS-PARA-MELI-SOFI.md` (mobile reusa `nnya`, no crea `residentes`).

---

## 0. Por qué este plan vive en el repo web

La tarjeta está en el repo mobile, pero `nnya` es una tabla de este repo y — por la decisión #3 ya tomada (un solo proyecto Supabase, compartido) — `supabase/migrations/` acá es la única fuente de verdad del schema. Mobile no tiene carpeta de migraciones propia. Este plan agrega 3 columnas nuevas a `nnya`; no toca ninguna tabla ni política existente del lado web.

---

## 1. Qué agrega y por qué

`modelo-datos.docx` proponía estas 3 columnas dentro de una tabla `residentes` que **no se crea** (decisión ya tomada: se reusa `nnya`). Faltan agregarlas ahí:

| Columna | Tipo | Para qué (mobile) |
|---|---|---|
| `foto_url` | `TEXT NULL` | F1 — foto del NNA en la lista/detalle de residentes |
| `alertas_importantes` | `TEXT NULL` | F1 — alergias, medicación u otra alerta visible al abrir el residente |
| `turno_escolar` | `VARCHAR(50) NULL` + `CHECK IN ('Mañana','Tarde','Noche','Doble Jornada')` | F1/F5 — de qué turno escolar es cada NNA |

Las 3 son opcionales (`NULL` por default) — no rompen ningún dato existente ni ninguna fila actual de `nnya` (18 columnas hoy, ver `supabase/migrations/20260620000031_clean_schema.sql`).

---

## 2. Qué NO incluye este plan (a propósito)

- **No crea un bucket de Storage para las fotos.** `foto_url` queda como `TEXT` (puede guardar una URL pública o un path de Storage el día que exista upload real). Crear el bucket + políticas ahora sería infraestructura especulativa sin ningún flujo que la use todavía (mobile ni siquiera está conectada a Supabase — issue #16, siguiente en la cola). Se crea cuando F1 realmente suba una foto.
- **No toca `NnyaForm.tsx` / `NnyaTable.tsx` del lado web** para mostrar/editar estos 3 campos — son datos que hoy solo va a escribir/leer mobile. Si Meli/Cami quieren que la web también los edite, es una tarjeta aparte.
- **No es la creación de `novedades`** (issue #10, plan separado, siguiente en la cola).

---

## 3. Archivos

### Crear
```
arguello-infancias/supabase/migrations/20260912000035_add_columnas_mobile_nnya.sql
```

### Modificar
```
arguello-infancias/types/database.types.ts   (interfaz Nnya: +3 campos opcionales)
```

---

## 4. Diseño de la migración

```sql
ALTER TABLE nnya
  ADD COLUMN foto_url TEXT NULL,
  ADD COLUMN alertas_importantes TEXT NULL,
  ADD COLUMN turno_escolar VARCHAR(50) NULL;

ALTER TABLE nnya ADD CONSTRAINT nnya_turno_escolar_check
  CHECK (turno_escolar IS NULL OR turno_escolar IN ('Mañana', 'Tarde', 'Noche', 'Doble Jornada'));
```

Sin backfill (las 3 quedan `NULL` en los NNA existentes — correcto, es un dato nuevo, no derivable de nada existente, a diferencia de `fecha_egreso` en el plan 011 que sí tenía de dónde inferirse).

RLS: no hace falta política nueva — las 3 columnas quedan cubiertas por las políticas ya existentes sobre `nnya` (`nnya_admin_tecnico_all`), que son a nivel de fila, no de columna.

### `types/database.types.ts`

```ts
export interface Nnya {
  // ...campos existentes sin cambios...
  fecha_egreso: string | null
  foto_url: string | null
  alertas_importantes: string | null
  turno_escolar: 'Mañana' | 'Tarde' | 'Noche' | 'Doble Jornada' | null
  created_at: string
  updated_at: string
}
```

---

## 5. Validaciones

```bash
npx supabase db push        # aplica la migración contra el proyecto remoto (o `supabase migration up` si trabajás con stack local)
npm run lint
npm run build
```

Verificación manual:
```sql
-- confirmar las columnas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'nnya' AND column_name IN ('foto_url','alertas_importantes','turno_escolar');

-- confirmar que el CHECK rechaza un valor inválido
UPDATE nnya SET turno_escolar = 'Siesta' WHERE id = (SELECT id FROM nnya LIMIT 1);  -- debe fallar
```
Y confirmar que `/nnya`, `/nnya/[id]`, `/nnya/[id]/editar` en la web siguen funcionando igual (no deberían cambiar, ya que no se tocan sus componentes).

---

## 6. Criterios de aceptación

| # | Criterio |
|---|---|
| D-01 | Las 3 columnas existen en `nnya`, nullable, sin afectar filas existentes |
| D-02 | El `CHECK` de `turno_escolar` rechaza valores fuera de las 4 opciones |
| D-03 | `types/database.types.ts` refleja las 3 columnas nuevas |
| D-04 | `npm run lint` y `npm run build` sin errores |
| D-05 | Las pantallas de NNyA de la web (`/nnya`, detalle, editar) siguen funcionando sin cambios de comportamiento |
| D-06 | Ninguna política RLS nueva necesaria (verificado: son a nivel de fila) |

---

## 7. Tiempo estimado
~20 min (migración: 10 min · types: 5 min · validación: 5 min).

---

## 8. Decisión que necesito confirmar antes de implementar

Este plan asume que la migración va en **este repo** (`arguello-infancias`, no `arguello-infancias-mobile`), porque acá vive `supabase/migrations/` y es el mismo proyecto Supabase (decisión #3). Si preferís que viva en otro lugar, avisame antes de "✓ Aprobado".

---

**Aprobación:** ✓ Aprobado (2026-09-12)

## 9. Resultado

Implementado tal como diseñado en §3-4. Migración aplicada directo contra el proyecto Supabase real (`mcp__supabase__apply_migration`).

Validaciones corridas:
- Columnas verificadas con `information_schema.columns`: las 3 existen, nullable, tipos correctos (D-01).
- `CHECK` verificado con un `UPDATE` real: rechaza `'Siesta'` con `23514 violates check constraint "nnya_turno_escolar_check"` (D-02).
- `types/database.types.ts` actualizado (D-03).
- `npm run lint` → 63 problemas (56 errores, 7 warnings), **preexistentes** — confirmado corriendo el mismo lint con `git stash` (idéntico conteo sin este cambio). Ninguno en archivos tocados por este plan (D-04, parcial — ver nota).
- `npm run build` → compila limpio, las 27 rutas incluidas `/nnya`, `/nnya/[id]`, `/nnya/[id]/editar` (D-05, D-04).
- D-06: confirmado, ninguna política RLS nueva necesaria (las columnas quedan cubiertas por `nnya_admin_tecnico_all`, que es por fila).

**Nota sobre D-04**: el lint del repo tiene deuda preexistente ajena a esta tarea (`no-explicit-any` en varios `*Tab.tsx`, `no-empty-object-type` en `ui/input.tsx`) — no se tocó, está fuera de alcance de este plan.
