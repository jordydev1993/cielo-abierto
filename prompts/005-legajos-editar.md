# 005 — Ruta de edición de Legajo

## Objetivo

Agregar `app/(dashboard)/legajos/[id]/editar/page.tsx`, cerrando el gap 1 de `AGENTS.md` § Deuda conocida: hoy el botón "Editar legajo" de la lista no lleva a ningún formulario de edición.

## Contexto

En `components/entities/legajos/LegajoTable.tsx` el ícono de acción ya distingue dos casos según `row.estado`:
- `activo` → ícono `Pencil`, `title="Editar legajo"`.
- `cerrado`/`archivado` → ícono `Eye`, `title="Ver legajo (solo lectura)"`.

Pero ambos casos llaman al mismo `onEdit(row)`, que en `app/(dashboard)/legajos/page.tsx` está cableado como `router.push(\`/legajos/${row.id}\`)` — es decir, **"Editar legajo" navega a la misma página que "Ver legajo"**: la ruta de detalle con tabs (`legajos/[id]/page.tsx`), que no tiene ningún campo editable, solo un diálogo de "Cerrar legajo" (`useCerrarLegajo`). No existe ningún formulario para modificar `numero_legajo`, `fecha_apertura` u `observaciones` después de creado el legajo. El ícono `Pencil` ya insinúa una acción de edición que hoy no existe — no es una funcionalidad nueva sino cerrar una ruta que el código ya da por hecha.

`hooks/legajos/useUpdateLegajo.ts` hoy solo exporta `useCerrarLegajo` (cierre/archivo, con las validaciones L-EX-13 y L-EX-10). No hay ningún hook de actualización de los datos básicos del legajo.

`components/entities/legajos/LegajoForm.tsx` ya soporta ocultar el selector de NNyA vía la prop `nnyaId` (usado hoy al crear un legajo desde el perfil de un NNyA) — el mismo mecanismo sirve para el modo edición, donde el NNyA no debe poder reasignarse.

## Archivos inspeccionados

- `app/(dashboard)/legajos/page.tsx`, `app/(dashboard)/legajos/[id]/page.tsx`, `app/(dashboard)/legajos/nuevo/page.tsx`
- `app/(dashboard)/nnya/[id]/editar/page.tsx` (patrón de referencia de página de edición)
- `components/entities/legajos/LegajoTable.tsx`, `components/entities/legajos/LegajoForm.tsx`
- `components/entities/nnya/NnyaForm.tsx` (patrón de referencia `initialData` + `isEditing`)
- `hooks/legajos/useUpdateLegajo.ts`, `hooks/legajos/useLegajo.ts`, `hooks/nnya/useUpdateNnya.ts` (patrón de mutación con allow-list explícito de campos)
- `lib/validations/legajos.schema.ts`
- `lib/constants/queryKeys.ts` (factories de `legajos`)
- `types/database.types.ts` (forma de `Legajo`)

## Skills utilizadas

Ninguna aplica directamente; se sigue el patrón de `crud-generator` ya materializado en el código (Form con `initialData` + hook de update con allow-list de campos), no la tabla de estado de la skill.

## Supuestos

- Solo se editan los datos "de cabecera" del legajo: `numero_legajo`, `fecha_apertura`, `observaciones`. El NNyA asociado (`nnya_id`) no es reasignable desde acá (identidad del legajo) — se oculta el selector reutilizando la prop `nnyaId` que `LegajoForm` ya soporta.
- El cierre/archivo (`estado`, `motivo_cierre`, `fecha_cierre`) sigue siendo exclusivo del diálogo "Cerrar legajo" en `legajos/[id]/page.tsx` (`useCerrarLegajo`) — este plan no lo toca.
- Edición permitida **solo si `legajo.estado === 'activo'`**, siguiendo el criterio que `LegajoTable.tsx` ya expresa visualmente (Pencil vs Eye "solo lectura"). Si se navega manualmente a `/legajos/[id]/editar` con un legajo no activo, se muestra un estado bloqueado (mismo mensaje que ya usa `legajos/[id]/page.tsx` para legajos no activos) en vez del formulario.
- El botón "Editar legajo" de la lista (`legajos/page.tsx`) pasa a navegar condicionalmente: `activo` → `/legajos/${id}/editar`; `cerrado`/`archivado` → `/legajos/${id}` (comportamiento actual, sin cambios para esos casos).
- Se agrega también un botón "Editar" en el header de `legajos/[id]/page.tsx` (visible solo si `estado === 'activo'`, dentro de `AccessGuard`), simétrico al que ya existe en `nnya/[id]/page.tsx`.

## Archivos a crear

- `arguello-infancias/app/(dashboard)/legajos/[id]/editar/page.tsx`

## Archivos a modificar

- `arguello-infancias/components/entities/legajos/LegajoForm.tsx`: agregar prop `initialData?: Legajo`, calcular `isEditing = !!initialData`, `defaultValues` desde `initialData` cuando exista, texto del botón `"Guardar cambios"` / `"Guardando..."` en modo edición (vs. `"Abrir legajo"` / `"Creando..."` en modo alta).
- `arguello-infancias/hooks/legajos/useUpdateLegajo.ts`: agregar `useUpdateLegajoDatos`, mutación que actualiza únicamente `numero_legajo`, `fecha_apertura`, `observaciones` y `updated_at` (allow-list explícito, igual criterio que `useUpdateNnya` — nunca toca `estado`/`fecha_cierre`/`motivo_cierre` aunque el formulario reciba `nnya_id` en `values`, ese campo se ignora en la mutación). Invalida `queryKeys.legajos.lists()` y `queryKeys.legajos.detail(id)`.
- `arguello-infancias/app/(dashboard)/legajos/page.tsx`: `onEdit` pasa a `router.push(row.estado === 'activo' ? \`/legajos/${row.id}/editar\` : \`/legajos/${row.id}\`)`.
- `arguello-infancias/app/(dashboard)/legajos/[id]/page.tsx`: agregar botón "Editar" (ícono `Pencil`) en el header, junto al de "Cerrar legajo", visible solo si `legajoActivo`, dentro de `AccessGuard roles={['Admin', 'Equipo Tecnico']}`, navega a `/legajos/${id}/editar`.

No se modifica `lib/validations/legajos.schema.ts` — se reutiliza `legajoSchema` tal cual (incluye `nnya_id` en el tipo, pero el campo queda oculto y sin cambios en modo edición, mismo mecanismo que ya usa `LegajoForm` al crear desde un perfil de NNyA).

## Seguridad

- Sin cambios de RLS ni de modelo de permisos: mismo nivel de acceso que crear/cerrar legajo hoy (`Admin`, `Equipo Tecnico`, vía `AccessGuard` + RLS ya existente en la tabla `legajos`).
- La restricción "solo editable si está activo" es una regla de UI/UX (coherente con lo que la propia tabla ya insinúa), no una regla de seguridad nueva — RLS no la impone a nivel de fila.
- La mutación de edición nunca puede modificar `estado`, `fecha_cierre` ni `motivo_cierre`, incluso si el payload llegara con esos campos (allow-list explícito), evitando que este formulario se convierta en una vía indirecta de cierre/archivo.

## Criterios de aceptación

- Click en el ícono "Editar legajo" (Pencil) de un legajo `activo` en `/legajos` navega a `/legajos/[id]/editar` y muestra el formulario precargado con `numero_legajo`, `fecha_apertura`, `observaciones`.
- Guardar cambios actualiza el legajo, invalida la lista y el detalle, y redirige a `/legajos/[id]`.
- Click en el ícono "Ver legajo (solo lectura)" (Eye) de un legajo `cerrado`/`archivado` sigue llevando al detalle de siempre, sin cambios.
- Navegar manualmente a `/legajos/[id]/editar` de un legajo no activo no muestra el formulario, muestra un estado bloqueado.
- El botón "Editar" nuevo en `legajos/[id]/page.tsx` solo aparece si el legajo está activo y el rol es `Admin`/`Equipo Tecnico`.
- El NNyA asociado al legajo no puede modificarse desde este formulario (selector oculto).

## Chequeos

- `npm run lint`
- `tsc --noEmit`

## Verificación manual

1. Ir a `/legajos`, click en "Editar legajo" (Pencil) de un legajo activo → confirmar formulario precargado, modificar `observaciones` y guardar → confirmar que persiste al recargar `/legajos/[id]`.
2. Desde `/legajos/[id]` de ese mismo legajo, confirmar que aparece el botón "Editar" y que lleva al mismo formulario.
3. Click en "Ver legajo" (Eye) de un legajo cerrado o archivado → confirmar que sigue yendo al detalle de siempre, sin formulario.
4. Navegar a mano a `/legajos/[id]/editar` de un legajo no activo → confirmar el estado bloqueado (no formulario editable).
5. Confirmar que "Cerrar legajo" (diálogo existente) sigue funcionando sin cambios.

---

**Estado**: pendiente de aprobación. No implementar hasta recibir "Aprobado" o "Ejecuta".
