# 004 — Vista de detalle de NNyA (solo lectura)

## Objetivo

Agregar `app/(dashboard)/nnya/[id]/page.tsx` como vista de solo-lectura, cerrando el gap 1 de `AGENTS.md` § Deuda conocida (hoy solo existe `nnya/[id]/editar`).

## Contexto

`app/(dashboard)/nnya/page.tsx` ya pasa un prop `onView={(n) => router.push(\`/nnya/${n.id}\`)}` a `NnyaTable`, y `NnyaTable.tsx` ya recibe `onView` como prop — pero nunca lo conecta a ningún elemento visual (`DataTable` solo recibe `onEdit`). Confirmé esto también en el lint del proyecto: `'onView' is defined but never used`. Es decir, la ruta de destino (`/nnya/[id]`) nunca se creó y el prop quedó sin usar — no hay ningún botón "Ver" hoy en la tabla, así que no hay ningún link roto visible para el usuario actual, pero la intención ya estaba parcialmente cableada.

Ya existen los hooks necesarios para armar la vista sin crear nada nuevo del lado de datos:
- `hooks/nnya/useNnya(id)` — trae el NNyA por id (ya usado en `nnya/[id]/editar`).
- `hooks/nnya_tutores/useNnyaTutores(id)` — tutores asociados (ya usado en `nnya/[id]/editar`).
- `hooks/legajos/useLegajosByNnya(id)` — legajo(s) del NNyA (ya existe, no se usa hoy en ninguna pantalla de NNyA).

## Archivos inspeccionados

- `app/(dashboard)/nnya/page.tsx`
- `app/(dashboard)/nnya/[id]/editar/page.tsx`
- `app/(dashboard)/legajos/[id]/page.tsx` (referencia de layout de página de detalle)
- `components/entities/nnya/NnyaTable.tsx`
- `components/shared/DataTable.tsx` (prop `extraActions`)
- `hooks/nnya/useNnya.ts`, `hooks/legajos/useLegajosByNnya.ts`
- `types/database.types.ts` (forma de `Nnya` y `Legajo`)

## Skills utilizadas

Ninguna aplica directamente (no hay skill de "detail views"); se sigue el patrón ya visible en `legajos/[id]/page.tsx` adaptado a algo más simple (NNyA no tiene tabs propios — sus transacciones viven en el legajo).

## Supuestos

- La vista es de **solo lectura**: no incluye edición inline ni gestión de tutores (eso se mantiene exclusivamente en `nnya/[id]/editar`, que no se toca).
- Si el NNyA tiene un legajo, se muestra un resumen con link a `/legajos/[id]` (reutilizando la página de detalle de legajo ya existente) — no se duplica información del legajo acá.
- Si el NNyA no tiene legajo, se muestra un estado vacío simple, sin acciones (crear legajo desde acá queda fuera de este plan).
- El botón "Ver" en la tabla usa un ícono `Eye` de `lucide-react` (mismo paquete de íconos ya usado en `DataTable` para editar/eliminar), pasado vía la prop `extraActions` que `DataTable` ya soporta — sin modificar `DataTable.tsx`.

## Archivos a crear

- `cielo-abierto/app/(dashboard)/nnya/[id]/page.tsx`

## Archivos a modificar

- `cielo-abierto/components/entities/nnya/NnyaTable.tsx`: agregar un botón "Ver" (ícono `Eye`) vía `extraActions` de `DataTable`, que llama a `onView(row)` — esto también resuelve el warning de lint `'onView' is defined but never used`.

## Requisitos de implementación

`nnya/[id]/page.tsx`:
1. Botón "Volver" a `/nnya` (mismo patrón que `legajos/[id]`: `ChevronLeft` + `router.push('/nnya')`).
2. Encabezado: nombre completo, DNI, badge de `estado_actual` (reutilizar el mapeo de colores ya definido en `NnyaTable.tsx`'s `estadoBadge`).
3. Sección "Datos personales": fecha de nacimiento (formateada con `date-fns`, mismo patrón que el resto de la app), lugar de nacimiento, nacionalidad, género, domicilio, teléfono, email, escolaridad, obra social, n° de expediente — mostrar "—" para los campos `null`.
4. Sección "Legajo": si `useLegajosByNnya` devuelve al menos un registro, mostrar el más reciente (número de legajo, estado, fecha de apertura) con un link a `/legajos/[id]`; si no hay legajo, mensaje de estado vacío.
5. Sección "Tutores asociados": lista de solo lectura (nombre, parentesco, badge "Principal" si corresponde) — igual que la lista ya existente en `nnya/[id]/editar`, pero sin los controles de agregar/quitar.
6. Botón "Editar" en el encabezado que navega a `/nnya/[id]/editar` (dentro de `AccessGuard roles={['Admin', 'Equipo Tecnico']}`, mismo criterio que el resto de acciones de escritura).

## Seguridad

Página de solo lectura sobre datos ya accesibles a cualquier usuario autenticado con rol Admin o Equipo Tecnico (mismo nivel de acceso que `/nnya` y `/nnya/[id]/editar` hoy — no se cambia el modelo de permisos, RLS ya cubre el acceso a nivel de fila).

## Criterios de aceptación

- Click en el ícono "Ver" de la tabla de NNyA navega a `/nnya/[id]` y muestra los datos correctos.
- La página no permite editar ningún campo (no hay formulario, solo texto y el botón "Editar" que navega a la ruta existente).
- Si el NNyA tiene legajo, el link a `/legajos/[id]` funciona.
- Si no tiene legajo, no se rompe la página (estado vacío controlado).

## Chequeos

- `npm run lint`
- `tsc --noEmit`

## Verificación manual

1. Ir a `/nnya`, click en el ícono "Ver" de un registro con legajo (ej. el NNyA sembrado con legajo activo) → confirmar que se ven sus datos y el link al legajo funciona.
2. Repetir con un NNyA sin legajo (si existe alguno en los datos semilla) o crear uno de prueba → confirmar el estado vacío.
3. Click en "Editar" desde la vista de detalle → confirmar que lleva a `/nnya/[id]/editar` y que ese formulario sigue funcionando igual que antes.

---

**Estado**: pendiente de aprobación. No implementar hasta recibir "Aprobado" o "Ejecuta".
