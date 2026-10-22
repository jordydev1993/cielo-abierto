# 052 — Rediseño completo: SaaS claro y minimalista

> **Estado: EN CURSO (22/10/2026), aprobado por Jordy. Tanda 1 lista.**
>
> Reemplaza el sistema "Señalética" de `prompts/051` por la dirección que fijó Jordy con una imagen de referencia: un panel SaaS claro y minimalista. Como la dirección viene fijada por el usuario, la skill `impeccable` no sortea una nueva: la referencia gana.

## Objetivo

Rehacer el diseño de **todas las pantallas** de la web con un lenguaje SaaS claro y minimalista, sin cambiar funciones, datos ni permisos.

## Decisiones de Jordy (22/10)

1. Se reemplaza todo el diseño actual; nada del sistema Señalética queda.
2. Se rehacen todas las pantallas (37 rutas del panel más el login).
3. Sin modo oscuro por ahora.
4. Favoritos y buscador ⌘K: **solo como diseño** (ver Requisitos 4 y 5).
5. Se mantienen las decisiones de `prompts/051`:
   - Inicio con datos de ejemplo;
   - cada gráfico responde una pregunta.

## Referencia y qué se toma

**Imagen:** panel de gestión inmobiliaria (Dribbble), guardada fuera del repo. Se toma el **estilo**, no la marca ni el contenido.

| De la referencia | Se toma | No se toma |
|---|---|---|
| Barra lateral clara con buscador, favoritos y grupos plegables; ítem activo en gris suave | Sí | La tarjeta "AI Upgrade": el sistema no tiene esa función |
| Barra superior con pestañas, Ayuda y avatar | Sí, con ruta (área / módulo) en lugar de pestañas de "layouts" que no existen | Botón de tema sol/luna (sin modo oscuro) |
| Fila de cifras sin tarjetas, con unidad e insignia chica | Sí | — |
| Gráfico principal ancho con selector de período, leyenda arriba, tooltip con guía vertical y valor final marcado | Sí | **Eje doble** (pesos y porcentajes en dos escalas): la skill `dataviz` lo prohíbe; una medida por gráfico |
| Grilla de gráficos chicos | Sí, con preguntas del dominio | Dispersión y barra con línea acumulada sobre dos ejes |
| Mucho aire, filetes muy suaves, esquinas medianas, tipografía neutra | Sí | — |

## El sistema

| Pieza | Valor (a validar con `dataviz` y contraste AA al implementar) |
|---|---|
| Fondo de la app / marco | `#F4F5F7` fuera del marco; superficie de trabajo `#FFFFFF` con borde `#E7E8EC` y radio 12 px |
| Tinta / secundario / apagado | `#111318` / `#5B606B` / `#8A8F99` |
| Filetes | `#EEEFF2` (grilla de gráficos y divisiones) |
| Acción principal | Botón negro `#111318` con texto blanco (como "Try it now") |
| Ítem activo de navegación | Fondo `#F1F2F4`, texto tinta, semibold |
| Paleta de series (categórica, orden fijo) | Rosa `#E0338A`, verde `#1FAE6A`, azul `#3B6FE0`, gris `#9AA0AA` |
| Estados | Crítico, advertencia, éxito e info con icono y texto (nunca solo color), distintos de la paleta de series |
| Tipografía | Inter (UI y cifras, `tabular-nums` en tablas). Salen Overpass y Atkinson |
| Escala | 28 cifra grande · 20 título de página · 15 título de sección · 14 texto · 12 rótulo y eje |
| Forma | Radio 8 px en controles y 12 px en contenedores; sombras solo en flotantes (tooltip, menú, diálogo) |
| Grilla | Contenido a 12 columnas, margen 32 px, gutter 24 px |

## Piezas compartidas (se rehacen una vez, las usan todas las pantallas)

| Pieza | Archivo | Cambio |
|---|---|---|
| Tokens | `app/globals.css`, `app/layout.tsx` | Valores y fuente nuevos. Se mantienen los nombres de token para no tocar cada archivo |
| Marco | `app/(dashboard)/layout.tsx` | App dentro de un marco blanco redondeado sobre fondo gris. Barra lateral clara (240 px) con buscador, Favoritos y grupos plegables con chevron. Barra superior con ruta, Ayuda y avatar |
| Navegación | `lib/navegacion.ts` | Mismos ítems, roles y orden. Grupos plegables (estado local); sin colores de área |
| Encabezado de página | `components/shared/PageHeader.tsx` (nuevo) | Título, descripción opcional y acciones a la derecha. Reemplaza los encabezados sueltos de cada pantalla |
| Barra de herramientas | `components/shared/Toolbar.tsx` (nuevo) | Búsqueda y filtros en una fila sobre la tabla |
| Fila de cifras | `components/shared/KPICard.tsx` → `StatRow` | Cifras sin tarjeta, con unidad e insignia |
| Tabla | `components/shared/DataTable.tsx`, `components/ui/table.tsx` | Cabecera liviana gris apagado, filas de 48 px, hover suave, paginación minimalista |
| Formularios | `components/ui/form.tsx`, `input`, `select`, `textarea`, `button` | Campos de 36 px con radio 8, secciones con título 15 px y separador suave |
| Pestañas | `components/ui/tabs.tsx` | Pestañas de texto con subrayado fino (como "Default layout") |
| Insignias | `components/ui/badge.tsx` | Pastillas chicas neutras con punto de color de estado |
| Diálogo, toast, select | `components/ui/*` | Radio 12, sombra suave, overlay claro |
| Gráficos | `components/charts/*` | Tooltip con guía vertical, leyenda arriba, ejes y grilla recesivos, valor final marcado; selector de período (solo diseño en Inicio) |
| Sale | `CartelArea.tsx`, colores de área | Se borran |

## Pantallas

Las pantallas se rehacen por tanda, todas con `PageHeader` y el mismo ritmo de espacios. Cada tanda es un PR que se mergea al terminar, para que el equipo vaya viendo el avance.

| Tanda | Pantallas |
|---|---|
| 1 · Base e Inicio | Tokens, marco, navegación, primitivas, gráficos, Inicio (`/dashboard`), login |
| 2 · Listados | NNyA, Legajos, Tutores, Referentes, Incidentes, Alertas, Turnos, Turnos de personal, Actividades, Informes, Propuestas de mejora (kanban), Seguimiento post-egreso, Usuarios, Roles, Informe SENAF |
| 3 · Formularios | Todos los `nuevo` y `[id]/editar` (NNyA, Legajos, Tutores, Referentes, Usuarios, Roles, Evaluación institucional) y los diálogos de alta |
| 4 · Detalles y flujos | Detalle de NNyA, legajo con sus 8 pestañas, Retiros (4 pestañas y verificación Didit), Evaluación institucional, informe SENAF, demos (`alertas-educativas-demo`, `retiros-demo`, `timeline-nnya-demo`) |

## Inicio (tanda 1)

Todo con datos de ejemplo de `lib/mocks/inicio.ts` y la franja que lo aclara:

| Bloque | Pregunta | Forma |
|---|---|---|
| Fila de 6 cifras | ¿Cómo está la residencia hoy? NNyA activos, legajos activos, alertas pendientes, retiros en curso, audiencias de la semana, post-egreso por vencer | Cifras con unidad; insignia solo donde hay un dato relevante (por ejemplo, "2 críticas") |
| Gráfico principal | ¿Cómo se mueve la población? NNyA activos, ingresos y egresos por mes, todo en personas | Líneas en un solo eje, selector 6 meses / 1 año / 2 años, valor final marcado |
| Alertas por tipo | ¿Qué tipo de alerta se repite más? | Barras verticales ordenadas de mayor a menor |
| Post-egreso | ¿Se cumplen los contactos programados? | Dos líneas: programados y realizados por mes |
| Intervenciones por área | ¿Dónde se concentra el trabajo del equipo? | Barras de progreso horizontales con porcentaje (como "Expense Breakdown") |
| Agenda de hoy | ¿Qué pasa hoy? | Tabla compacta (sin gráfico) |

## Requisitos

1. **No cambia ninguna función, campo, texto de negocio, ruta ni permiso.** El rediseño es visual. Los textos de validación y los mensajes de D-33 quedan iguales.
2. **Inicio sigue con datos de ejemplo** y su franja; el resto de las pantallas siguen con sus datos reales.
3. **Gráficos:** una medida por eje, paleta validada con el script de `dataviz`, leyenda siempre que haya 2 o más series, tooltip, y una tabla o texto accesible con los valores.
4. **Favoritos (solo diseño):** tres accesos fijos a rutas que existen (Legajos, Retiros, Alertas). Funcionan como enlaces; no se pueden agregar ni quitar todavía.
5. **Buscador ⌘K (solo diseño):** se ve en la barra lateral, deshabilitado, con la ayuda "Próximamente". No simula resultados.
6. **Accesibilidad:** contraste AA de texto e íconos, foco visible en todo control, navegación por teclado en los grupos plegables.
7. **Sin modo oscuro.**

## Seguridad

- No cambia nada en la base, en las consultas ni en los permisos.
- `AccessGuard` y los filtros por rol de la navegación quedan iguales.
- Las capturas de revisión usan la base local y datos DEMO.

## Skills

- `impeccable`: marco de calidad, detector, revisión final y `DESIGN.md` nuevo. Conviene reabrir la sesión para que sus agentes revisores queden disponibles.
- `dataviz`: forma y paleta de cada gráfico.

No hace falta instalar nada más: `recharts` ya está en el proyecto.

## Criterios de aceptación

- Las 37 pantallas y el login usan el marco, `PageHeader` y los componentes nuevos. No queda ningún uso de `CartelArea`, `font-heading` de Overpass ni de los colores de área.
- La navegación muestra los mismos ítems por rol que hoy.
- Inicio coincide con la estructura de la referencia, sin eje doble, con la franja de datos de ejemplo.
- La paleta de series pasa el script de `dataviz` y el texto pasa AA.
- El detector de `impeccable` no da hallazgos primarios y la revisión final da `ship` en cada tanda.
- `npx tsc --noEmit`, `npm run build` y `npm run test:unit` en verde; `npm run lint` sin errores nuevos.
- `DESIGN.md` y `.impeccable/design.json` describen el sistema nuevo; el brief de Inicio se reescribe con la dirección fijada por la referencia.

## Verificación manual

En local contra Supabase local, con Dirección QA y Educador QA. En cada tanda:

1. Recorrer las pantallas de la tanda a 1440 y 1280 de ancho, comparando con la referencia.
2. Probar un alta, una edición y un diálogo de confirmación sin confirmar.
3. Revisar la consola sin errores.
