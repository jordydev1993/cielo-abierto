# 006 — Corregir validación `.uuid()` de Zod 4 contra IDs semilla

## Objetivo

Corregir un bug sistémico descubierto durante la verificación end-to-end de `005-legajos-editar.md`: el validador `.uuid()` de Zod 4 exige formato RFC4122 estricto (nibble de versión `1-8`, variante `8/9/a/b`), pero los IDs de los datos semilla del proyecto (`nnya`, `legajos`, probablemente `tutores`) usan el patrón legible `X0000000-0000-0000-0000-00000000000Y`, que **no** cumple esa estructura. Resultado: cualquier formulario que valide un `nnya_id`/`legajo_id`/`diagnostico_id` contra esos datos falla la validación silenciosamente (más silenciosamente aún cuando el campo no se renderiza, como en la edición de legajo de 005).

## Contexto

Verificado con `node` contra el paquete `zod@4.4.3` real instalado:
```
z.string().uuid().safeParse('30000000-0000-0000-0000-000000000003').success // false
z.string().uuid().safeParse('a1b2c3d4-e5f6-4789-8abc-def012345678').success // true
```
`grep` sobre `lib/validations/*.schema.ts` encontró `.uuid()` sobre `nnya_id`/`legajo_id`/`diagnostico_id` en 7 archivos. `usuarios.schema.ts` (`rol_id`) no está afectado porque `roles` usa UUIDs generados reales (`gen_random_uuid()`), no IDs semilla legibles.

## Archivos a modificar

Reemplazar `z.string().uuid({ error: '...' })` por `z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { error: '...' })` (valida forma de UUID sin exigir versión/variante RFC4122 — apropiado para IDs de referencia, no para UUIDs recién generados) en:
- `lib/validations/audiencias.schema.ts` (`legajo_id`, `nnya_id`)
- `lib/validations/diagnosticos.schema.ts` (`legajo_id`, `nnya_id`)
- `lib/validations/incidentes.schema.ts` (`legajo_id`, `nnya_id`)
- `lib/validations/informes.schema.ts` (`legajo_id`, `nnya_id`)
- `lib/validations/legajos.schema.ts` (`nnya_id`)
- `lib/validations/medicamentos.schema.ts` (`legajo_id`, `nnya_id`, `diagnostico_id`)
- `lib/validations/turnos.schema.ts` (`legajo_id`, `nnya_id`)

No se toca `usuarios.schema.ts` (`rol_id`) ni `roles.schema.ts` — esos IDs sí son RFC4122 válidos.

## Supuestos

- Se mantiene el mensaje de error de cada campo (`error: '...'`), solo cambia el validador de formato.
- No se introduce un archivo compartido (`common.ts`) — se mantiene el patrón existente de un schema por entidad sin dependencias cruzadas nuevas.
- No se tocan los datos semilla ni las migraciones — el fix es puramente de validación de formulario.

## Criterios de aceptación

- `legajoSchema.safeParse({ nnya_id: '30000000-0000-0000-0000-000000000003', ... })` pasa.
- Guardar cambios en `/legajos/[id]/editar` con un NNyA semilla persiste correctamente (verificación manual ya en curso).
- `tsc --noEmit` y `npm run build` sin errores.

## Chequeos

- `npm run lint`
- `tsc --noEmit`

---

**Estado**: implementado y verificado end-to-end (guardado real de un legajo en el navegador, con persistencia confirmada tras recargar).
