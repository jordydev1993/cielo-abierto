# 007 — Migrar primitivas de UI a los tokens `@theme`

## Objetivo

Cerrar el gap 1 de `AGENTS-WEB.md` § Deuda conocida: migrar `select`, `dialog`, `tabs`, `textarea`, `toaster` y `form.tsx` (`components/ui/`) de la paleta neutra genérica de shadcn (`slate-*`, `white`, `red-*`, `green-*`, `black/50`) a los tokens `@theme` del proyecto, igual que ya hacen `button`, `badge`, `card`, `input` y `table`.

## Contexto

La auditoría de `docs/design-system.md` (sección 2, "Hallazgo central") ya identificó estos 6 archivos como los únicos que no migraron. No es un rediseño: cada clase `slate-*`/`white` se reemplaza por el token `@theme` semánticamente equivalente, siguiendo la convención ya establecida en `input.tsx`, `card.tsx`, `button.tsx` y `badge.tsx` (leídos como referencia). Ningún componente cambia de estructura, tamaño ni comportamiento — solo color.

## Archivos inspeccionados

- `docs/design-system.md` (auditoría de 001)
- `app/globals.css` (tokens `@theme` reales, confirmados vía `grep`: `primary`, `primary-container`, `primary-fixed`(-dim), `secondary`(-container), `tertiary`(-fixed), `error`(-container), `surface`, `surface-container-lowest/low/(default)/high`, `on-surface`(-variant), `outline`(-variant) — no existen tokens `background` ni `ring`, así que `ring-offset-background`/`ring-ring` en `tabs.tsx` son clases sin efecto real, restos de shadcn sin migrar)
- `components/ui/{input,card,button,badge,table}.tsx` (referencia de la convención ya usada)
- `components/ui/{select,dialog,tabs,textarea,toaster,form}.tsx` (a modificar)

## Skills utilizadas

Ninguna aplica directamente; se sigue la convención de mapeo ya visible en el código (no una skill de design system).

## Mapeo de clases (aplicado consistentemente en los 6 archivos)

| Antes (shadcn genérico) | Después (`@theme`) | Igual que en |
|---|---|---|
| `border-slate-200` | `border-outline-variant` | `input.tsx`, `card.tsx` |
| `bg-white` (superficie de card/popover/modal) | `bg-surface-container-lowest` | `card.tsx` |
| `bg-white` (fondo de input/tabs activo) | `bg-surface-container-low` | `input.tsx` |
| `text-slate-900` | `text-on-surface` | `input.tsx` |
| `text-slate-500` / `text-slate-600` / `text-slate-700` | `text-on-surface-variant` | `card.tsx` (`CardDescription`) |
| `text-slate-400` (placeholder) | `text-outline` | `input.tsx` |
| `bg-slate-100` / `hover:bg-slate-100` | `bg-surface-container` / `hover:bg-surface-container` | `button.tsx` (variant `ghost`/`outline`) |
| `focus:ring-slate-900` / `focus-visible:ring-slate-900` | `focus:ring-primary` | — (coherente con `input.tsx`, que usa `ring-primary-container` + `border-primary`) |
| `ring-offset-white` | *(se quita — `input.tsx` tampoco usa `ring-offset-*`)* | `input.tsx` |
| `ring-offset-background` / `focus-visible:ring-ring` (`tabs.tsx`) | *(se quita — tokens inexistentes, sin efecto)* | — |
| `text-red-600` / `text-red-500` (mensajes de error) | `text-error` | equivalente semántico de `--color-error` |
| `border-red-200 bg-red-50` / `text-red-800` (toast destructive) | `border-error-container bg-error-container` / `text-on-error-container` | `badge.tsx` (variant `destructive`) |
| `border-green-200 bg-green-50` / `text-green-800` (toast success) | `border-primary-fixed bg-primary-container` / `text-on-primary-container` | `badge.tsx` (variant `success`, adaptado a fondo claro) |

## Archivos a modificar

- `components/ui/select.tsx`: `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectSeparator`.
- `components/ui/dialog.tsx`: `DialogContent` (borde/fondo/foco del botón cerrar), `DialogDescription`. El overlay (`bg-black/50`) **no se toca** — es un scrim, no una superficie con token, y no está señalado en el hallazgo de `design-system.md`.
- `components/ui/tabs.tsx`: `TabsList`, `TabsTrigger`.
- `components/ui/textarea.tsx`.
- `components/ui/toaster.tsx`: fondo/borde/texto base y las 2 variantes (`destructive`, `success`), texto de descripción y botón cerrar.
- `components/ui/form.tsx`: `FormField` (label, error, asterisco), `FormSection` (título y borde).

No se modifica ningún componente de `components/entities/` ni `components/shared/` en este plan (el hallazgo 5 de `docs/design-system.md`, `NnyaTable.tsx` con `text-slate-500` hardcodeado, queda fuera de alcance — es un hallazgo de pantalla, no de primitiva, y no fue parte de la decisión aprobada).

## Supuestos

- El overlay de `Dialog` (`bg-black/50`) se mantiene igual — es un scrim genérico, no forma parte del hallazgo de tokens.
- El toast `variant="default"` (sin color especial) mantiene `bg-surface-container-lowest`/`border-outline-variant` (equivalente neutro a lo que hoy es `bg-white`).
- Los toasts `success`/`destructive` usan `-container` (fondo claro) + `on-*-container` (texto), igual que `Badge`, en vez de los tokens "sólidos" (`bg-error`/`bg-primary`) que son para fondos oscuros con texto blanco — mantiene la legibilidad actual (fondo claro, texto oscuro) sin inventar una combinación nueva.
- No se toca el radio de esquina, el espaciado ni la tipografía de ningún componente — solo color.

## Criterios de aceptación

- Ningún archivo de `components/ui/` usa clases `slate-*`, `red-*`, `green-*` ni `white` como color de superficie/texto/borde (excepto el overlay `bg-black/50` de `Dialog`, fuera de alcance).
- Visualmente, un `Select`/`Dialog`/`Tabs`/`Textarea`/`Toaster`/formulario (`FormField`) se ve consistente con `Card`/`Input`/`Button` en la misma pantalla (mismo tono de borde y superficie).
- Ninguna pantalla existente cambia de layout, tamaño o comportamiento — solo color.

## Chequeos

- `npm run lint`
- `tsc --noEmit`
- `npm run build`

## Verificación manual

En `next build && next start` (`next dev` no hidrata en este entorno — ver gap 2 de `AGENTS-WEB.md`):
1. Abrir cualquier formulario con `Select` (ej. `legajos/nuevo`) → confirmar borde/fondo consistente con los `Input` de al lado.
2. Abrir el diálogo "Cerrar legajo" (`legajos/[id]`) → confirmar que el modal se ve igual de superficie que una `Card`.
3. Abrir el detalle de un legajo (`Tabs`) → confirmar que el tab activo y la lista de tabs usan tokens, no gris genérico.
4. Disparar un toast de éxito y uno de error (ej. guardar un legajo, o forzar un error) → confirmar colores `primary-container`/`error-container` en vez de verde/rojo genérico de Tailwind.
5. Ver un error de validación en cualquier formulario → confirmar que el texto de error usa el rojo del tema (`error`), no `red-600`.

---

**Estado**: pendiente de aprobación. No implementar hasta recibir "Aprobado" o "Ejecuta".
