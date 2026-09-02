# 001 — Auditoría y formalización del sistema de diseño

## Objetivo

Documentar en un único lugar el sistema de diseño que ya existe y funciona en producción (tokens Tailwind + primitivas de componentes), para que las próximas funcionalidades lo reutilicen en vez de crear estilos ad hoc por pantalla.

## Contexto

El proyecto ya tiene 12 módulos de negocio implementados y funcionando (NNyA, Legajos, Tutores, Turnos, Alertas, Actividades, Incidentes, Diagnósticos, Medicamentos, Informes, Documentos, Audiencias Judiciales, más Usuarios/Roles). No se está diseñando un sistema desde cero: se está auditando y formalizando el que ya está construido, para tener una referencia escrita antes de seguir agregando pantallas.

Existen además mockups generados con Stitch en `docs/pantallas stitch/` (una pantalla por carpeta, con `code.html` + `screen.png`, y una carpeta `the_design_system/DESIGN.md` con tokens propuestos). **Decisión ya tomada con el usuario**: Stitch es solo referencia visual opcional, no un objetivo obligatorio a implementar. La fuente de verdad de este plan es el código real.

## Archivos inspeccionados

- `app/globals.css` (tokens `@theme`: paleta de color, tipografías, no hay `tailwind.config.*` porque Tailwind 4 usa config CSS-first)
- `components/ui/` — 12 primitivas: `badge.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`, `form.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `toaster.tsx`
- `components/shared/` — `AccessGuard.tsx`, `ConfirmDialog.tsx`, `DataTable.tsx`, `KPICard.tsx`
- `components/entities/*/Form.tsx` + `List.tsx` (o `Table.tsx`) — patrón repetido en las 12 entidades de negocio
- `docs/pantallas stitch/the_design_system/DESIGN.md` (referencia opcional, no vinculante)

## Skills utilizadas

- Ninguna directamente aplicable de `.claude/skills/` (no hay una skill de "design system" hoy). Si el patrón de trabajo se repite en el futuro, evaluar crear una skill `design-system.skill.md` — no se crea en este plan porque todavía no hay uso repetido que la justifique.

## Supuestos

- El sistema de diseño a documentar es el que ya renderiza en producción, no uno nuevo.
- Stitch (`docs/pantallas stitch/`) se usa únicamente para señalar inconsistencias visuales notables a decidir después — no dispara cambios de código en este plan.
- No se tocan componentes de `components/ui/` ni `components/entities/` en este plan: es un plan de documentación pura.

## Archivos a crear

- `docs/design-system.md` — catálogo del sistema de diseño real.

## Archivos a modificar

Ninguno (no se toca código de producción en este plan).

## Requisitos de implementación

Cuando se apruebe este plan, `docs/design-system.md` debe incluir:

1. **Tokens**: la paleta completa definida en `@theme` de `app/globals.css` (colores primary/secondary/tertiary/error/surface/on-*, tipografías Atkinson Hyperlegible Next / Manrope / Inter), documentados con su uso real (dónde se aplica cada uno).
2. **Catálogo de primitivas**: cada componente de `components/ui/` con sus variantes reales tal como están implementadas (no las que "deberían" existir) — ej. variantes de `button`, `badge`, estados de `input`/`select`.
3. **Componentes compartidos**: `AccessGuard`, `ConfirmDialog`, `DataTable`, `KPICard` — qué resuelven y cuándo usarlos en vez de reimplementar algo similar.
4. **Patrón de entidad**: cómo se estructura `Form.tsx` + `List.tsx` en `components/entities/<entidad>/`, para que sea la referencia al crear una entidad nueva.
5. **Huecos detectados**: por ejemplo, variantes de `badge` limitadas, ausencia de un wrapper reutilizable de toast/alert-dialog más allá de la primitiva — se documentan como huecos, no se resuelven en este plan.
6. **Comparación con Stitch**: una sección breve señalando inconsistencias visuales notables entre `docs/pantallas stitch/` y lo implementado, sin proponer un rediseño forzado.

## Seguridad

No aplica — este plan no toca datos, autenticación ni información sensible de NNyA. Es documentación de UI.

## Criterios de aceptación

- `docs/design-system.md` existe y describe fielmente lo que ya renderiza la app (verificable abriendo cada pantalla real).
- No hay cambios en `components/`, `app/globals.css` ni ningún otro archivo de producción.
- Los huecos identificados quedan registrados para decidir después, no resueltos de forma implícita.

## Chequeos

No aplican chequeos de build/lint/test — este plan es exclusivamente documental, no modifica código ejecutable.

## Verificación manual

1. Levantar la app (`npm run dev` en `arguello-infancias/`).
2. Abrir al menos una pantalla que use cada primitiva catalogada (ej. `/nnya` para tabla y badges, `/nnya/nuevo` para formulario e inputs, cualquier modal de confirmación para `dialog`/`ConfirmDialog`).
3. Confirmar que lo que se ve en pantalla coincide con lo documentado en `docs/design-system.md` (mismos colores, mismas variantes).

---

**Estado**: pendiente de aprobación. No implementar hasta recibir "Aprobado" o "Ejecuta".
