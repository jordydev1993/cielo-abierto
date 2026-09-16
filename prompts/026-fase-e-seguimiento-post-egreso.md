# 026 — FASE E: UI de seguimiento post-egreso + generación automática 30/60 días + dashboard de reinserción

**Tarjeta:** [#7](https://github.com/jordydev1993/cielo-abierto/issues/7) — Jordy — Baja

## Objetivo

Construir la UI sobre `seguimiento_post_egreso` (existe con RLS desde `prompts/012`/`013`,
sin componentes que la usen todavía), con generación automática de las 2 filas de
seguimiento (30 y 60 días) al momento del egreso, y un dashboard simple de reinserción.

## Hallazgo bloqueante (fuera del alcance literal de la tarjeta, pero necesario para que
funcione): hoy no se puede marcar a un NNyA como "Egresado" desde la UI

- `nnya` tiene `CHECK chk_nnya_fecha_egreso_coherente`:
  `(estado_actual = 'Egresado') = (fecha_egreso IS NOT NULL)` (de `prompts/011`, FASE A0).
- `NnyaForm.tsx` deja elegir `estado_actual = 'Egresado'` en un `<Select>` **sin ningún
  campo `fecha_egreso`** — ni el form, ni `lib/validations/nnya.schema.ts`, ni
  `useCreateNnya`/`useUpdateNnya` lo mencionan (confirmado por grep).
- Consecuencia real: hoy, si alguien intenta guardar un NNyA con estado "Egresado" desde
  la UI, el `UPDATE` es rechazado por el `CHECK` de la base (`fecha_egreso` queda `NULL`).
  El único NNyA "Egresado" que existe (`Bautista Díaz`, seed data) tiene `fecha_egreso`
  seteado porque vino del backfill de `prompts/011`, no porque alguien lo haya guardado
  por la app.

Sin esto, FASE E no tiene ningún disparador real (el egreso, la razón de ser del
seguimiento post-egreso, no se puede registrar). Se corrige como parte de este prompt.

## Decisión confirmada con Jordy: generación automática por trigger, no por cron

No hay infraestructura de cron en el proyecto (ni Vercel Cron ni `pg_cron` de Supabase
habilitado). En vez de agregar esa infraestructura, se usa un trigger `AFTER UPDATE ON
nnya`: cuando `fecha_egreso` pasa de `NULL` a tener valor (el momento exacto del egreso),
se crean automáticamente las 2 filas de `seguimiento_post_egreso` (`fecha_programada =
fecha_egreso + 30/60 días`). Es disparado por evento, no por tiempo — no hace falta ningún
job programado. Mismo patrón que `fn_crear_alerta_incidente_grave` (`clean_schema.sql`,
`SECURITY DEFINER`, `AFTER INSERT`/`UPDATE`).

## Contexto

- Schema y RLS ya resueltos (`prompts/012`, `prompts/013`). RLS de `seguimiento_post_egreso`:
  SELECT/INSERT admin+tecnico, UPDATE admin **o** `contactado_por` (self o `NULL`), DELETE
  nadie.
- `UNIQUE(nnya_id, dias_post_egreso)` ya impide duplicar las filas 30/60 para el mismo NNyA
  — el trigger usa `ON CONFLICT DO NOTHING` por las dudas.
- Verificado en vivo: 1 NNyA (`Bautista Díaz`) ya está "Egresado" con `fecha_egreso`
  `2025-01-10`, sin filas de seguimiento (el trigger no es retroactivo). Se backfillea en
  la misma migración — mismo criterio que `prompts/011`.
- Tipo ya existe en `types/database.types.ts` (`SeguimientoPostEgreso`).

## Archivos inspeccionados

- `components/entities/nnya/NnyaForm.tsx`, `lib/validations/nnya.schema.ts`,
  `hooks/nnya/{useCreateNnya,useUpdateNnya}.ts` — confirmado el gap de `fecha_egreso`
- `pg_constraint` en vivo sobre `nnya` (`chk_nnya_fecha_egreso_coherente`)
- `supabase/migrations/20260620000031_clean_schema.sql` — `fn_crear_alerta_incidente_grave`
  (patrón de trigger a copiar), schema de `seguimiento_post_egreso`
- `supabase/migrations/20260827000034_...sql` (RLS de `seguimiento_post_egreso`)
- Datos reales de `nnya` (`estado_actual`/`fecha_egreso` de los 5 seed)
- `components/entities/turnos-personal/*`, `hooks/turnos-personal/*` (patrón más reciente
  de lista + acción de "registrar" ligada a `useCurrentUsuario`)

## Skills utilizadas

- `crud-generator.skill.md`
- `domain-validation.skill.md`

## Decisiones de diseño

1. **Fix de `NnyaForm`**: agregar campo `fecha_egreso` (date), visible solo cuando
   `estado_actual === 'Egresado'` (patrón `useWatch`, igual que el selector condicional de
   `VinculoTutelaForm`). `lib/validations/nnya.schema.ts` agrega un `.refine()` que
   replica el `CHECK` de la base — mensaje legible en vez de un error crudo de Postgres. Al
   cambiar `estado_actual` a otro valor, se limpia `fecha_egreso` (evita el estado
   inconsistente `estado ≠ 'Egresado'` con `fecha_egreso` seteada).
2. **Trigger `fn_crear_seguimiento_post_egreso`**: `AFTER UPDATE ON nnya`, condición
   `NEW.fecha_egreso IS NOT NULL AND OLD.fecha_egreso IS NULL`. Inserta 2 filas
   (`dias_post_egreso = 30` y `60`) con `fecha_programada = NEW.fecha_egreso + interval`,
   `vinculo_id = NULL` (no se intenta inferir un vínculo de tutela automáticamente — se
   puede asociar después a mano si hace falta, fuera de alcance de este prompt).
3. **Backfill en la misma migración**: por cada NNyA con `estado_actual = 'Egresado'` que
   todavía no tenga sus 2 filas de seguimiento, se generan igual que el trigger.
4. **Sin alta manual desde la UI**: las filas siempre existen antes de que alguien necesite
   verlas (las crea el trigger o el backfill) — la UI solo **edita** (registra el
   contacto). No se construye un formulario de creación, para no duplicar lo que ya
   garantiza la base.
5. **"Registrar contacto"**: form con `fecha_contacto`, `contacto_realizado`,
   `contacto_efectivo`, `escolaridad`/`salud`/`terapias`
   (`cumple`/`parcial`/`no_cumple`/`no_corresponde`), `percibe_auh`,
   `detalle_incumplimiento`, `observaciones`, `indicador_reinsercion` (1-5),
   `requiere_intervencion`. Al guardar, si `contactado_por` está `NULL` se setea a
   `miUsuario.id` (primer contacto "reclama" el seguimiento, coherente con la RLS).
6. **Dashboard de reinserción**: 3 tarjetas simples (mismo estilo que
   `CoberturaResumen` de `prompts/023`) — pendientes de contactar (fecha vencida, sin
   contacto), requieren intervención, % de contacto efectivo. Sin gráficos nuevos.

## Archivos a crear

**Validaciones:**
- `lib/validations/seguimiento-post-egreso.schema.ts`

**Hooks:**
- `hooks/seguimiento-post-egreso/useSeguimientosPostEgreso.ts`
- `hooks/seguimiento-post-egreso/useUpdateSeguimiento.ts`

**Componentes:**
- `components/entities/seguimiento-post-egreso/SeguimientoForm.tsx`
- `components/entities/seguimiento-post-egreso/SeguimientoList.tsx`
- `components/entities/seguimiento-post-egreso/ReinsercionResumen.tsx`

**Páginas:**
- `app/(dashboard)/seguimiento-post-egreso/page.tsx`

## Archivos a modificar

- `lib/validations/nnya.schema.ts`: agregar `fecha_egreso` + `.refine()` de coherencia.
- `components/entities/nnya/NnyaForm.tsx`: campo condicional `fecha_egreso`.
- `hooks/nnya/useCreateNnya.ts`, `hooks/nnya/useUpdateNnya.ts`: normalizar
  `fecha_egreso: values.fecha_egreso || null`.
- `lib/constants/queryKeys.ts`: factory `seguimientoPostEgreso`.
- `app/(dashboard)/layout.tsx`: agregar `{ href: '/seguimiento-post-egreso', label:
  'Seguimiento Post-Egreso', icon: ... }` a `NAV_ADMIN_TECNICO`.

**Migración SQL nueva:**
- `fn_crear_seguimiento_post_egreso()` + `trg_crear_seguimiento_post_egreso` (`AFTER
  UPDATE ON nnya`)
- Backfill de las filas faltantes para NNyA ya egresados.

## Requisitos

- El trigger no debe duplicar filas si `fecha_egreso` se vuelve a guardar sin cambiar
  (condición estricta `OLD.fecha_egreso IS NULL`, más `ON CONFLICT DO NOTHING` como
  cinturón de seguridad).
- El formulario de "Registrar contacto" nunca permite elegir a nombre de quién se
  registra — siempre `miUsuario.id` (mismo criterio que `prompts/023`).

## Seguridad

- Ningún cambio de RLS — se consume la matriz ya aplicada en `prompts/013`.
- El trigger es `SECURITY DEFINER` (igual que `fn_crear_alerta_incidente_grave`) para
  poder insertar en `seguimiento_post_egreso` sin depender del rol de quien edita el NNyA
  — aunque en la práctica Admin/Equipo Tecnico ya tienen INSERT permitido por RLS en esa
  tabla, se mantiene el patrón ya establecido para consistencia.

## Criterios de aceptación

- Marcar un NNyA como "Egresado" sin fecha → rechazado con mensaje claro (no error crudo).
- Marcar un NNyA como "Egresado" con fecha → se guarda, y aparecen automáticamente 2 filas
  en `seguimiento_post_egreso` (30 y 60 días desde esa fecha).
- `Bautista Díaz` (ya egresado en el seed) tiene sus 2 filas de seguimiento tras aplicar la
  migración (backfill).
- Registrar un contacto actualiza `contactado_por` a quien lo hizo, si estaba vacío.
- El dashboard de reinserción refleja los pendientes/requieren intervención correctamente.
- `npx tsc --noEmit` y `npm run build` sin errores.

## Chequeos

- `npm run lint`, `npm run build`, `npx tsc --noEmit`.
- Verificación manual con el usuario Admin real.

## Verificación manual

1. Editar un NNyA "En residencia" → cambiar a "Egresado" sin fecha → confirmar el error
   legible.
2. Completar la fecha de egreso → guardar → confirmar que se creó (2 filas nuevas en
   `seguimiento_post_egreso` para ese NNyA, con `fecha_programada` correcta).
3. `/seguimiento-post-egreso` → confirmar que aparecen las filas de `Bautista Díaz`
   (backfill) y las del NNyA recién egresado.
4. Registrar un contacto en una fila pendiente → confirmar que persiste y que
   `contactado_por` queda seteado.
5. Confirmar que el resumen de reinserción refleja los cambios.

---

**Estado**: implementado y verificado manualmente end-to-end con el usuario Admin real.

## Verificación post-implementación

1. Edité "Sosa, Tomás" (seed, "En proceso de egreso") → cambié `estado_actual` a
   "Egresado" sin fecha → el campo "Fecha de egreso" apareció automáticamente, marcado
   requerido. ✅
2. Completé la fecha (16/09/2026) → guardé sin error. ✅
3. Confirmado en base: el trigger creó automáticamente las 2 filas
   (`dias_post_egreso=30` → `fecha_programada=2026-10-16`; `=60` →
   `2026-11-15`) — exactamente `fecha_egreso + 30/60`. ✅
4. `/seguimiento-post-egreso` mostró las 4 filas totales: 2 de `Bautista Díaz` (backfill,
   ambas ya vencidas por ser de 2025) + las 2 nuevas de `Sosa, Tomás`. Resumen mostró "2
   pendientes vencidos". ✅
5. Registré un contacto en una fila vencida (contacto realizado + efectivo, indicador 4)
   → la fila pasó a "Contactado", el resumen bajó a "1 pendiente vencido" y subió a "100%
   contacto efectivo". Confirmado en base: `contactado_por` quedó en el usuario real
   (Jordy Admin), no en `NULL`. ✅

Un incidente aparte durante la prueba: el dev server tenía la misma corrupción de caché de
Turbopack ya vista antes en la sesión (proceso `node.exe` huérfano en el puerto 3000,
error `Jest worker encountered 2 child process exceptions`) — se resolvió matando el
proceso y borrando `.next/`, no relacionado con el código de este prompt.
