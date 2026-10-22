# 053 — Toaster: variantes de advertencia e información, y duración configurable

> **Estado: IMPLEMENTADO (22/10/2026), aprobado por Jordy.** Cierra uno de los pendientes del issue #31 (`AGENTS-WEB.md`, deuda "design").

## Objetivo

Completar el sistema de avisos emergentes (`components/ui/toaster.tsx`):

1. Dos variantes nuevas: **`warning`** (advertencia) e **`info`** (información).
2. **Duración configurable**, incluida la opción de que el aviso quede fijo hasta que lo cierren.
3. **Ícono por variante y accesibilidad:** el estado no puede depender solo del color, y los lectores de pantalla tienen que anunciar el aviso.

## Contexto

- Hoy `toast()` acepta `default`, `success` y `destructive`, con un temporizador fijo de 4 segundos (`setTimeout(..., 4000)`).
- No tiene íconos ni `aria-live`: un lector de pantalla no anuncia el aviso.
- La botonera de cierre no tiene nombre accesible (solo el ícono `X`).
- Los tokens ya existen en `app/globals.css` (`prompts/052`):

| Variante | Tokens |
|---|---|
| Advertencia | `tertiary`, `tertiary-fixed`, `on-tertiary-fixed` |
| Información | `primary-container`, `on-primary-container`, `serie-1` |
| Éxito | `exito`, `exito-container`, `on-exito-container` |
| Crítico | `error`, `error-container`, `on-error-container` |

- El sistema de diseño vigente es `DESIGN.md`: pastillas de estado con texto y un refuerzo de color, sombra solo en flotantes, radio 12 en contenedores.

## Archivos inspeccionados

`components/ui/toaster.tsx`, `app/globals.css`, `DESIGN.md`. Además, por búsqueda, las llamadas a `toast(`, que hoy usan solo `success`, `destructive` y sin variante.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `components/ui/toaster.tsx` | Variantes `warning` e `info`. Opción `duracion` en milisegundos (por defecto 4000; `null` = fijo hasta cerrarlo). Ícono por variante (lucide: `Info`, `CircleCheck`, `TriangleAlert`, `CircleAlert`). Contenedor con `aria-live`. Botón de cierre con `aria-label="Cerrar aviso"`. Estilo según `DESIGN.md`: fondo blanco, borde gris, ícono y franja de color solo en el ícono |
| `DESIGN.md` y `.impeccable/design.json` | Documentar el componente Aviso con sus 5 variantes |
| `AGENTS-WEB.md` | Sacar el Toaster de la deuda del issue #31 |

## Requisitos

1. **Compatibilidad total:** las llamadas actuales (`toast({ title, description, variant })`) siguen funcionando igual, con 4 segundos por defecto. No se cambia ninguna llamada existente.
2. **Variantes:**

   | Variante | Ícono | Uso |
   |---|---|---|
   | `default` | ninguno | Aviso neutro |
   | `success` | círculo con tilde, verde | Acción completada |
   | `info` | "i", azul | Dato neutro con más peso (por ejemplo, una verificación en curso) |
   | `warning` | triángulo, ámbar | Algo que pide atención pero no es un error |
   | `destructive` | círculo con signo de exclamación, rojo | Error |

3. **Duración:** `duracion` opcional. `null` deja el aviso fijo; se cierra con el botón o con Escape cuando tiene foco.
4. **Accesibilidad:**
   - `role="status"` (`aria-live="polite"`) para `default`, `success` e `info`;
   - `role="alert"` (`aria-live="assertive"`) para `warning` y `destructive`;
   - el color nunca es el único canal, siempre hay ícono y texto;
   - contraste AA del título y la descripción.
5. **Sin dependencias nuevas** (lucide ya está en el proyecto).

## Fuera de alcance

- Usar las variantes nuevas en pantallas concretas: cada uso va con su propio plan, para no inventar mensajes.
- El diálogo de aviso no destructivo, el otro pendiente del #31.

## Seguridad

No cambia nada en la base, en los permisos ni en los datos. Es un componente de interfaz.

## Criterios de aceptación

- `toast({ title: 'x', variant: 'warning' })` e `info` se ven con su ícono y color, y el lector de pantalla los anuncia.
- `toast({ title: 'x', duracion: null })` queda fijo hasta tocar "Cerrar aviso".
- Las llamadas existentes se ven igual y duran 4 segundos.
- El detector de `impeccable` no da hallazgos en `toaster.tsx`.
- `npx tsc --noEmit`, `npm run build` y `npm run test:unit` en verde; `npm run lint` sin errores nuevos.

## Verificación manual

En local, desde la consola del navegador no se puede llamar a `toast()`. Se prueba con una página temporal de prueba que no se commitea (`app/(dashboard)/toaster-prueba/page.tsx`): un botón por variante, y uno fijo. Se borra antes del PR.
