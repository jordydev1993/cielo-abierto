# 025 — `ON DELETE CASCADE` en `nnya_id`: cambiar a `RESTRICT`

**Tarjeta:** [#16](https://github.com/jordydev1993/cielo-abierto/issues/16) — Jordy — Baja

## Objetivo

La tarjeta (hallazgo del review de mobile#18) señalaba `nnya_id` en `novedades` e
`incidentes` con `ON DELETE CASCADE`: riesgo de pérdida de auditoría si algún día se
borrara físicamente un NNyA. Cambiarlo a `RESTRICT` o `SET NULL`.

## Contexto — el alcance real es mucho mayor al que describía la tarjeta

Consulté `information_schema` por todas las FK que referencian `nnya(id)`: **14 tablas**
tienen `nnya_id` en `CASCADE`, no solo las 2 mencionadas —
`alertas`, `audiencias_judiciales`, `diagnosticos`, `documentos`,
`evaluacion_institucional_casos`, `incidentes`, `informes`, `intervenciones`,
`medicamentos`, `nnya_tutores`, `novedades`, `seguimiento_post_egreso`,
`transferencia_auh`, `turnos`, `vinculos_tutela`. La única tabla que ya tenía el patrón
correcto era `legajos.nnya_id` (`RESTRICT` desde su creación).

También verifiqué nullability: `nnya_id` es `NOT NULL` en las 14 — esto descarta `SET
NULL` como opción real sin antes aflojar esa restricción en las 14 tablas (un cambio de
schema bastante más grande y no pedido), y además `SET NULL` activamente **causaría** la
pérdida de auditoría que la tarjeta quiere evitar: un incidente con `nnya_id = NULL` no
sirve para rastrear de quién era.

**Decisión de Jordy**: aplicar `RESTRICT` a las 14 de una (no limitarse a las 2
originales), dado que es el mismo patrón ya usado en `legajos` y no pierde nada.

## Archivos inspeccionados

- `information_schema.table_constraints` / `referential_constraints` /
  `constraint_column_usage` en vivo — FKs reales hacia `nnya(id)` y su `delete_rule`.
- `information_schema.columns` — nullability de `nnya_id` en las 14 tablas.
- Grep de `useDeleteNnya|from('nnya').delete` en todo `*.{ts,tsx}` → sin resultados:
  ningún hook del código borra un `nnya` en duro hoy.

## Archivos modificados

- Migración nueva `supabase/migrations/20260916011716_nnya_id_restrict_on_delete.sql`:
  `DROP CONSTRAINT` + `ADD CONSTRAINT ... ON DELETE RESTRICT` en las 14 FKs.
- `AGENTS-WEB.md` § Deuda conocida → Resuelto: entrada nueva documentando el hallazgo y la
  decisión.

## Requisitos

- No se toca `legajos.nnya_id` (ya estaba correcto).
- No se afloja `nnya_id` a nullable en ninguna tabla.

## Seguridad

- Sin cambio de comportamiento actual: el proyecto nunca borra un `nnya` en duro (usa
  `activo=false`/`estado_actual`), confirmado por grep. El cambio es puramente preventivo.
- El `RESTRICT` ahora sí impediría, a nivel de base, que alguien borre físicamente un NNyA
  con historial — que es exactamente lo que pedía la tarjeta.

## Criterios de aceptación

- Las 14 FKs (+ `legajos`, ya correcta) muestran `delete_rule = RESTRICT` en
  `information_schema.referential_constraints`. Verificado.
- Ningún archivo de la app necesitó cambios (no había código dependiendo del `CASCADE`).

## Chequeos

- No aplica `lint`/`build`/`tsc` — cambio de constraint SQL puro, sin tocar código de
  aplicación.

---

**Estado**: implementado y verificado contra la base real.
