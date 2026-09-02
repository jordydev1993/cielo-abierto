# 003 — Reactivar el grid de KPIs del dashboard

## Objetivo

Que `/dashboard` muestre las tres tarjetas de indicadores (NNyA activos, Legajos activos, Alertas pendientes) que ya están implementadas pero comentadas, cerrando el gap 1 de `AGENTS.md` § Deuda conocida.

## Contexto

`app/(dashboard)/dashboard/page.tsx` tiene el hook `useDashboardStats` completo (cuenta NNyA activos, legajos activos y alertas pendientes vía `count: 'exact', head: true`) y el JSX del grid de `KPICard` ya escrito — pero el bloque entero está envuelto en un comentario `{/* ... */}`, así que hoy `/dashboard` solo muestra el título "Panel principal" sin ningún dato.

Antes de asumir que solo hacía falta descomentar, verifiqué que la lógica de la consulta sea correcta contra el schema real (no fuera por eso que se comentó):

- `legajos.estado` → valores reales en la base: `activo`, `cerrado` (el filtro `.eq('estado', 'activo')` es correcto).
- `alertas.estado` → valores reales: `pendiente`, `en_proceso`, `completada` (el filtro `.eq('estado', 'pendiente')` es correcto).
- `nnya.activo` → columna `boolean` (el filtro `.eq('activo', true)` es correcto).

La consulta es válida contra los datos reales. No encontré ninguna razón técnica para que el bloque haya quedado comentado — parece haber sido un ajuste temporal durante desarrollo que no se revirtió.

## Archivos inspeccionados

- `app/(dashboard)/dashboard/page.tsx`
- `components/shared/KPICard.tsx`
- Schema real de `legajos`, `alertas`, `nnya` (vía consulta directa a Supabase)

## Skills utilizadas

Ninguna aplica directamente; es una corrección puntual de una línea de código ya escrita.

## Supuestos

- El diseño de las 3 tarjetas (orden, íconos, variantes de color) que ya está en el JSX comentado es el que se quiere — no se rediseña nada, solo se reactiva.
- No se agregan más KPIs en este plan (ej. turnos del día, incidentes recientes) — eso sería una funcionalidad nueva, fuera de este alcance puntual.

## Archivos a crear

Ninguno.

## Archivos a modificar

- `arguello-infancias/app/(dashboard)/dashboard/page.tsx`: quitar el comentario `{/* ... */}` que envuelve el `<div className="grid...">` de las 3 `KPICard`.

## Requisitos de implementación

Descomentar el bloque tal cual está escrito. No se toca `useDashboardStats` ni `KPICard`.

## Seguridad

No aplica — son conteos agregados (`head: true`, sin traer filas), no se expone información sensible de NNyA individuales.

## Criterios de aceptación

- `/dashboard` muestra las 3 tarjetas con los conteos reales al cargar.
- Mientras carga, cada tarjeta muestra `—` (comportamiento ya implementado en el hook).
- No hay cambios visuales ni funcionales en el resto de la página.

## Chequeos

- `npm run lint`
- `tsc --noEmit`

## Verificación manual

1. `npm run dev` (o reutilizar el servidor si ya está corriendo).
2. Iniciar sesión y entrar a `/dashboard`.
3. Confirmar que aparecen las 3 tarjetas con números que coincidan con los datos reales (se puede cruzar contra `/nnya`, `/legajos` y `/alertas` filtrados por sus respectivos estados).

---

**Estado**: pendiente de aprobación. No implementar hasta recibir "Aprobado" o "Ejecuta".
