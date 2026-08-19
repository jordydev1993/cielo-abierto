# Sistema de diseño — Cielo Abierto

> Catálogo del sistema de diseño **tal como está implementado hoy**, auditado según `prompts/001-design-system.md`. No es una propuesta de rediseño: documenta lo que ya renderiza en producción, para que las próximas pantallas lo reutilicen en vez de crear estilos ad hoc.

## 1. Tokens

Definidos en `app/globals.css` vía `@theme` (Tailwind 4, config CSS-first — no existe `tailwind.config.*`).

### Color

| Token | Valor | Uso |
|---|---|---|
| `primary` / `on-primary` | `#005768` / `#ffffff` | Acciones principales (`Button` variant `default`, links) |
| `primary-container` / `on-primary-container` | `#aeecff` / `#001f26` | Fondos destacados de baja saturación |
| `primary-fixed` / `primary-fixed-dim` | `#aeecff` / `#7cd0eb` | Iconos de `KPICard` variant `primary`, `Badge` variant `success` |
| `secondary` / `on-secondary` | `#505f76` / `#ffffff` | Acciones secundarias |
| `secondary-container` / `on-secondary-container` | `#d0e1fb` / `#0d1d2f` | `Button` variant `secondary`, `Badge` variant `secondary`/`info` |
| `tertiary` / `on-tertiary` | `#724515` / `#ffffff` | Acento cálido (uso puntual) |
| `tertiary-fixed` | `#ffdcc0` | `Badge` variant `warning` |
| `error` / `on-error` | `#ba1a1a` / `#ffffff` | `Button` variant `destructive` |
| `error-container` / `on-error-container` | `#ffdad6` / `#410002` | `Badge` variant `destructive`, `KPICard` variant `error` |
| `surface` | `#f7f9fb` | Fondo de `body` |
| `surface-container-lowest` a `-high` | `#ffffff` → `#e6e8ea` | Escala de superficies elevadas (cards, inputs, tablas) |
| `on-surface` / `on-surface-variant` | `#191c1e` / `#3f484b` | Texto principal / secundario |
| `outline` / `outline-variant` | `#70797c` / `#bfc8cb` | Bordes, placeholders, texto deshabilitado |

Paleta Material-You-like (pares `color`/`on-color`, `-container`, `-fixed`). Coincide casi exactamente con la paleta propuesta en `docs/pantallas stitch/the_design_system/DESIGN.md` ("Serene Teal") — ver sección 6.

### Tipografía

| Token | Fuente | Uso previsto |
|---|---|---|
| `font-sans` | Atkinson Hyperlegible Next | Texto de cuerpo y datos (legibilidad — nombres, DNI, texto legal) |
| `font-heading` | Manrope | Títulos y encabezados de sección |
| `font-label` | Inter | Etiquetas/microcopy |

No hay una escala tipográfica con nombre (`text-heading-lg`, `text-body-md`, etc.) — cada componente usa clases de tamaño de Tailwind sueltas (`text-3xl`, `text-sm`, `text-xs`). Ver hueco en sección 5.

### Forma y espaciado

No hay tokens `@theme` para radios o espaciado — se usan las utilidades por defecto de Tailwind (`rounded-md`, `rounded-xl`, `rounded-full`, `p-6`, `gap-4`, etc.) directamente en cada componente, sin una escala documentada propia.

## 2. Catálogo de primitivas (`components/ui/`)

Todas construidas con `class-variance-authority` (cva) sobre Radix UI donde aplica, usando el helper `cn()` de `lib/utils.ts`.

| Componente | Variantes reales | Usa tokens `@theme` |
|---|---|---|
| `Button` | `variant`: default, destructive, outline, secondary, ghost, link · `size`: default, sm, lg, icon | Sí |
| `Badge` | `variant`: default, secondary, destructive, outline, success, warning, info | Sí |
| `Card` | Card / CardHeader / CardTitle / CardDescription / CardContent / CardFooter (sin variantes, un solo estilo) | Sí |
| `Input` | Sin variantes (un solo estilo, soporta cualquier `type`) | Sí |
| `Textarea` | Sin variantes | **No** — colores hardcodeados (`slate-*`, `white`) |
| `Label` | Sin variantes (envoltorio de `@radix-ui/react-label`) | Parcial (usa clases neutras de Tailwind, no tokens de color) |
| `Select` (Trigger/Content/Item/Label/Separator) | Sin variantes | **No** — colores hardcodeados (`slate-*`, `white`) |
| `Dialog` (Overlay/Content/Header/Footer/Title/Description) | Sin variantes | **No** — colores hardcodeados (`slate-*`, `white`, `black/50`) |
| `Table` (Header/Body/Row/Head/Cell) | Sin variantes | Sí |
| `Tabs` (List/Trigger/Content) | Sin variantes | **No** — colores hardcodeados (`slate-*`, `white`) |
| `Toaster` / `toast()` | `variant`: default, success, destructive (implementación propia, no Radix) | **No** — colores hardcodeados (`slate-*`, `red-*`, `green-*`, `white`) |
| `form.tsx` (`FormField`, `FormSection`, `FormGrid`) | `FormGrid` acepta `cols`: 1, 2, 3 | **No** — `FormField`/`FormSection` usan `slate-*`/`red-*` en vez de `on-surface`/`error` |

**Hallazgo central**: los componentes más antiguos/genéricos del set (`select`, `dialog`, `tabs`, `textarea`, `toaster`, `form`) fueron escritos con la paleta neutra por defecto de shadcn (`slate-*`, blanco/negro) y **no migraron** a los tokens `@theme` del proyecto (`surface-*`, `on-surface`, `outline-variant`). En cambio `button`, `badge`, `card`, `input` y `table` sí usan los tokens. Esto es visible en la UI: por ejemplo, un modal (`Dialog`) tiene fondo blanco puro y borde `slate-200` mientras la tarjeta que lo abre usa `surface-container-lowest`/`outline-variant` — sutil pero perceptible.

## 3. Componentes compartidos (`components/shared/`)

| Componente | Resuelve | Cuándo usarlo |
|---|---|---|
| `KPICard` | Tarjeta de métrica con ícono, valor grande y label (`variant`: default, primary, error, secondary) | Paneles/dashboards con indicadores numéricos — ya se usa en el dashboard (hoy con el grid comentado, ver `AGENTS.md` § Deuda conocida) |
| `DataTable<T>` | Tabla genérica tipada: columnas configurables, paginación (`pageSize`), acciones editar/eliminar/extra, estado de carga y mensaje vacío | Cualquier listado de entidad — es la base de todas las `<Entidad>Table.tsx` |
| `ConfirmDialog` | Modal de confirmación reutilizable sobre `Dialog` + `Button`, con estado `loading` y variante `destructive`/`default` | Antes de cualquier acción irreversible (eliminar, cerrar legajo, etc.) |
| `AccessGuard` | Oculta/muestra `children` según `role` del usuario autenticado (`context/AuthContext`) | Envolver acciones o secciones restringidas por rol (ej. gestión de Usuarios/Roles solo para Admin) |

No reimplementar paginación, confirmación de borrado o control de acceso por rol ad hoc en una pantalla nueva — usar estos cuatro.

## 4. Patrón de entidad (`components/entities/<entidad>/`)

Confirmado con el ejemplo real `nnya/` (mismo patrón en las 12 entidades de negocio):

- **`<Entidad>Form.tsx`**: `react-hook-form` + `zodResolver(lib/validations/<entidad>.schema.ts)`. Estructura el formulario con `FormSection` (agrupa campos bajo un título) → `FormGrid cols={1|2|3}` → `FormField` (label + error + required) envolviendo `Input`/`Textarea`/`Select` (este último vía `Controller`, no `register`, porque Radix Select no es un input nativo). Un solo botón de submit al final, con label condicional según `initialData` (crear vs. editar).
- **`<Entidad>Table.tsx`**: usa `DataTable` de `components/shared/`, define `columns: Column<T>[]` con `render()` por columna, y funciones auxiliares tipo `estadoBadge()` que mapean un campo de estado a `<Badge variant=.../>`.

Para una entidad nueva, replicar exactamente este par de archivos y el nombre de columnas/estado-a-badge, no un patrón distinto.

## 5. Huecos detectados

1. **Inconsistencia de tokens** (ver tabla en §2): `select`, `dialog`, `tabs`, `textarea`, `toaster` y `form.tsx` no usan los tokens `@theme` — quedaron en la paleta neutra genérica de shadcn. Cualquier pantalla que use estos componentes tendrá una superficie ligeramente distinta a las que solo usan `button`/`badge`/`card`/`input`/`table`.
2. **Sin escala tipográfica nombrada**: no hay clases reutilizables tipo `text-heading-md`; cada componente elige tamaños Tailwind sueltos. Divergente de la propuesta de Stitch, que sí define una escala (`display-lg`, `headline-md`, `title-sm`, `body-lg`, `body-md`, `label-caps`).
3. **`Toaster` es una implementación propia minimalista** (no Radix), sin variante `warning`/`info`, y con temporizador fijo de 4s no configurable.
4. **No hay wrapper de "alert dialog" no destructivo** más allá de `ConfirmDialog` (que asume confirmar/cancelar) — para avisos de solo-lectura se reutiliza `Dialog` directamente sin un componente dedicado.
5. **Colores en componentes de entidad**: `NnyaTable.tsx` usa `text-slate-500` hardcodeado en vez de `text-on-surface-variant` — mismo patrón de inconsistencia que en §2, mostrando que se filtra a nivel de pantalla, no solo en primitivas.

Ninguno de estos huecos se resuelve en este plan — quedan documentados para decidir prioridad más adelante.

## 6. Comparación con los mockups de Stitch

Fuente: `docs/pantallas stitch/the_design_system/DESIGN.md` (y su duplicado dentro de `stitch_secure_child_case_manager/`). Es **referencia opcional**, no vinculante (decisión ya tomada).

- **Coincide casi exactamente**: la paleta de color base (`primary #005768`, `surface #f7f9fb`, familias tipográficas Manrope/Atkinson Hyperlegible Next/Inter) — el sistema implementado claramente partió de esta guía.
- **Diverge**: Stitch define `primary-container` como `#2a7081` (versión más oscura/saturada) mientras `globals.css` usa `#aeecff` (versión clara) para el mismo token — incoherencia a resolver si se decide alinear formalmente con Stitch.
- **No implementado**: la escala tipográfica nombrada de Stitch (`display-lg`, `headline-md`, etc.), el sistema de "Tonal Layers" con sombra difusa específica para hover (`0px 4px 12px rgba(0,0,0,0.03)`), y el componente "Data Privacy Shields" (blur-on-default con toggle de ojo para datos sensibles como DNI/domicilio) — este último es relevante dado que el sistema maneja datos sensibles de NNyA, pero es una funcionalidad nueva, no solo de estilo, y no se agrega en este plan documental.
- **Backdrop de modales**: Stitch propone blur de 8px + overlay al 20% de opacidad; el `Dialog` implementado usa un overlay sólido `bg-black/50` sin blur.

Estas diferencias quedan señaladas para una decisión futura explícita — este documento no dispara ningún cambio de código.
