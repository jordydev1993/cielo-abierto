# 051 — Sistema de diseño "Señalética" (tokens, marco y pantalla Inicio)

> **Estado: IMPLEMENTADO (22/10/2026), aprobado por Jordy: un solo PR y merge a `master`.** Rediseño visual pedido por Jordy con la skill `impeccable` (instalada local en `.claude/`, no versionada). Cubre el issue #31.
>
> **Solo diseño (decisión de Jordy, 22/10):** el contenido nuevo de Inicio usa **datos de ejemplo (mock)**.
> - No hay lecturas nuevas de la base, ni cambios de comportamiento, ni spec.
> - Conectar Inicio a datos reales queda para un plan aparte.

## Objetivo

Reemplazar el sistema visual actual ("Serene Teal") por la dirección **Señalética de hospital público**, elegida en la ronda de decisión de `impeccable` (22/10):

1. Tokens nuevos (color, tipografía, escala, filetes) en `app/globals.css`.
2. Primitivas de `components/ui/` migradas a esos tokens, incluidas las que hoy usan `slate-*` (`select`, `dialog`, `tabs`, `textarea`, `toaster`, `form`).
3. Marco de la app: barra lateral como directorio por áreas y un **cartel de área** al tope de cada pantalla.
4. Pantalla **Inicio** (`/dashboard`) rediseñada con **datos de ejemplo**: paneles de área, agenda del día y alertas.

## Contexto

- **Contrato de dirección:** `.impeccable/surfaces/app-dashboard-dashboard-page-tsx.md` (tesis, paleta, primer viewport, semilla `seed:e102a49f66699151`). Producto: `PRODUCT.md`.
- **Boceto aprobado:** `.impeccable/mocks/decision/assigned.html`. Es la referencia de composición; no se copia tal cual.
- **Decisiones de Jordy:**
  - es un rediseño, no una consolidación;
  - se usa en PC de oficina;
  - no tiene que verse infantil;
  - nada de la interfaz actual es obligatorio conservar;
  - las funciones y los textos siguen iguales;
  - Inicio va con datos de ejemplo.
- **Hoy:** `docs/design-system.md` cataloga el sistema actual y sus huecos. El Inicio actual (`app/(dashboard)/dashboard/page.tsx`) muestra 3 KPIs con `KPICard`.

## Archivos inspeccionados

`app/globals.css`, `app/layout.tsx` (fuentes), `app/(dashboard)/layout.tsx` (barra lateral), `app/(dashboard)/dashboard/page.tsx`, `components/shared/KPICard.tsx`, `components/ui/*`, `docs/design-system.md`.

## Skills utilizadas

`impeccable` (init, new-work y, al terminar, revisión final y documentador), `dataviz` (forma, color y marcas de cada gráfico), `role-permission` (qué grupos de la navegación ve cada rol).

## El sistema

| Pieza | Valor |
|---|---|
| Fondo / superficie / tinta | `#F4F6F5` / `#FFFFFF` / `#14201E`; texto secundario `#56625F`; filete `#D3D9D7` |
| Áreas (un uso por color) | Núcleo `#1F4E8C` · Tutela y retiros `#5B4B9A` · Seguimiento `#B7791F` · Salud `#2E7D5B` · Institucional `#24646B` · Administración `#3D4448` |
| Estados | Crítico `#C62828` (solo crítico/error). Un tratamiento por estado (vigente, pendiente, en revisión, rechazado) en `Badge` |
| Tipografía | Overpass (carteles, títulos, cifras tabulares) + Atkinson Hyperlegible Next (texto y datos). Salen Manrope e Inter |
| Escala | `display` 44, `title` 28, `heading` 13 en mayúsculas espaciadas, `body` 15, `small` 13, como utilidades `@theme` |
| Forma | Esquinas rectas o radio 2 px; separación por filetes de 1 px, sin sombras de tarjeta |
| Grilla | 12 columnas, gutter 24 px en el contenido |

Las áreas se asignan a los grupos de la navegación actual. Los módulos y su orden no cambian; solo se agrupan.

| Área | Módulos |
|---|---|
| Núcleo | Inicio, NNyA, Legajos, Tutores |
| Tutela y retiros | Referentes, Retiros |
| Seguimiento | Incidentes, Alertas, Turnos, Turnos de personal, Actividades |
| Salud | Informes |
| Institucional | Evaluación, Propuestas, Post-egreso |
| Administración (solo Admin) | Informe SENAF, Usuarios, Roles |

## Gráficos

**Regla: cada gráfico responde una pregunta concreta, con la forma que corresponde a esos datos. No se agrega un gráfico por adorno.** Si una cifra o una tabla responde mejor, va la cifra o la tabla.

- **Herramienta:** `recharts`, que ya está en el proyecto. No se suma ninguna librería.
- **Criterio:** antes del primer gráfico se carga la skill `dataviz`, disponible en esta sesión sin instalar nada. Fija tres cosas:
  - qué forma elegir según la pregunta;
  - los colores de series y estados, validados contra la paleta de áreas;
  - las marcas, ejes, leyendas y tooltips.

| Pregunta en Inicio | Dato (de ejemplo) | Forma | Por qué |
|---|---|---|---|
| ¿Cuántos NNyA hay hoy y cómo viene? | NNyA activos por mes, últimos 6 meses | Cifra grande + línea mínima (sparkline) en el panel, con el último punto marcado | Es una cantidad en el tiempo: importa la tendencia, no cada valor |
| ¿Qué tan urgente es lo pendiente? | Alertas pendientes por prioridad (crítica, alta, media, baja) | Barra horizontal única apilada en el panel de alertas, rotulada con el número de cada tramo | Son partes de un total con orden de gravedad; cuatro categorías se leen mejor en una barra que en una torta |
| ¿Qué pasa hoy? | Agenda del día | Tabla ordenada por hora, **sin gráfico** | Son eventos con hora y persona; un gráfico escondería el detalle |
| ¿Hay retiros en curso? / ¿Seguimientos por vencer? | Conteos chicos (0 a 5) | Solo la cifra, **sin gráfico** | Un número chico sin serie temporal no necesita forma |

**Reglas comunes:**
- Cada gráfico lleva título con la pregunta, unidad y fuente "Datos de ejemplo".
- El color sale del área del dato y el rojo se reserva para lo crítico.
- Nada de 3D, degradés ni tortas.
- Se lee sin el tooltip, y la cifra exacta queda disponible en texto para lectores de pantalla.

## Archivos a crear o modificar

| Archivo | Cambio |
|---|---|
| `app/globals.css` | Tokens nuevos. Se mantienen los nombres en uso (`primary`, `surface`, `on-surface`, `outline-variant`, …) apuntando a los valores nuevos, para no tocar 100+ archivos. Se suman `area-*`, la escala y `font-display` |
| `app/layout.tsx` | Overpass con `next/font`. Se quitan Manrope e Inter |
| `components/ui/{select,dialog,tabs,textarea,toaster,form,badge,card,button}.tsx` | Tokens en lugar de `slate-*`; `Badge` con el vocabulario de estado; `Card` con filete y sin sombra |
| `lib/navegacion.ts` (nuevo) | Ítems de navegación agrupados por área, con su color e ícono. Sale de `layout.tsx` |
| `app/(dashboard)/layout.tsx` | Barra lateral "directorio" por áreas, con los mismos filtros por rol |
| `components/shared/CartelArea.tsx` (nuevo) | Cartel de área: color del área, pictograma, "Área · Usted está en", título, usuario y fecha. Lo agrega el layout según la ruta |
| `lib/mocks/inicio.ts` (nuevo) | Datos de ejemplo tipados: 4 paneles, NNyA activos de los últimos 6 meses, alertas pendientes por prioridad, 5 eventos de agenda, 4 alertas (una "nueva"). Nombres ficticios con "(DEMO)" |
| `components/charts/Tendencia.tsx`, `components/charts/BarraPorPartes.tsx` (nuevos) | Los dos gráficos de Inicio con `recharts` y los tokens del sistema, reutilizables en otros módulos |
| `components/shared/AvisoDatosEjemplo.tsx` (nuevo) | Franja visible en Inicio: "Vista de diseño con datos de ejemplo" |
| `app/(dashboard)/dashboard/page.tsx` | Paneles de área, agenda de hoy y alertas, armados con `lib/mocks/inicio.ts`. Se quita la consulta actual de KPIs |
| `components/shared/KPICard.tsx` | Pasa a "panel de área" (filete, cuadrado de color, cifra en Overpass) |
| `components/entities/**`, `components/legajos/tabs/**` | Solo reemplazo de `slate-*`/`gray-*`/`bg-white` sueltos (~30 archivos) por tokens. Sin cambios de estructura |
| `docs/design-system.md` | Pasa a apuntar a `DESIGN.md`, que se escribe al final |
| `DESIGN.md`, `.impeccable/design.json` | Los genera el documentador de `impeccable` a partir de lo construido |
| `.gitignore` | Ignorar `.impeccable/mocks/` y `.impeccable/review/`. Se versionan el brief y `design.json` |

## Requisitos

1. **No cambia ninguna función ni texto** fuera de Inicio y del marco. Mismos módulos, rutas, roles y filtros de la navegación.
2. **Inicio usa solo datos de ejemplo** de `lib/mocks/inicio.ts`: sin consultas a Supabase, sin hooks nuevos y sin cambios en la base.
3. **Los datos de ejemplo se ven como tales:** la franja "Vista de diseño con datos de ejemplo" va arriba del contenido de Inicio y los nombres llevan "(DEMO)". Nunca datos reales de NNyA.
4. **Contenido de ejemplo de Inicio:**
   - **Paneles:** NNyA activos (con su tendencia), alertas pendientes (con la barra por prioridad), retiros en curso y seguimientos por vencer. Los gráficos siguen la sección Gráficos.
   - **Agenda de hoy:** tabla de columnas fijas ordenada por hora (hora, qué, NNyA, área); los eventos cumplidos se ven atenuados.
   - **Alertas:** con prioridad por color; una de ellas resaltada como "nueva".
   - **Enlaces:** llevan a los módulos existentes.
5. **Accesibilidad mínima:**
   - contraste AA del texto blanco sobre cada color de área (verificar el ocre);
   - foco visible;
   - tamaños táctiles de 40 px en la barra lateral.

## Decisiones para Jordy

1. **Alcance de este PR.** Recomiendo un solo PR con tokens, primitivas, marco e Inicio con datos de ejemplo. Los demás módulos heredan colores y tipografía por los tokens; su revisión pantalla por pantalla queda para PRs siguientes.
2. **Producción.** Con datos de ejemplo, Inicio deja de mostrar las cifras reales de hoy (NNyA activos, legajos activos y alertas pendientes). Recomiendo no mergear a `master` hasta conectar los datos reales en el plan siguiente; mientras tanto, se revisa en local.

## Seguridad

- No cambia nada en la base ni en los permisos.
- Inicio no consulta datos, así que no expone información de NNyA.
- Los datos de ejemplo son ficticios y llevan "(DEMO)". Las maquetas y capturas de revisión usan solo esos datos.

## Criterios de aceptación

- La barra lateral muestra los mismos ítems que hoy para cada rol, agrupados por área. Equipo Técnico no ve el grupo Administración.
- Cada pantalla abre con el cartel de su área.
- Inicio muestra paneles, agenda y alertas con los datos de ejemplo y la franja que lo aclara, sin pedidos a Supabase (verificable en la pestaña Red del navegador).
- Cada gráfico de Inicio responde la pregunta de su fila en la tabla de Gráficos, con la forma indicada. No aparece ningún gráfico que no esté en esa tabla.
- Ningún componente de `components/ui/` usa `slate-*`, `gray-*` ni `bg-white` (`grep` vacío).
- El detector de `impeccable` no informa hallazgos primarios en `app/` y `components/`, y el revisor final de `impeccable` da veredicto `ship`.
- `npm run lint` (sin errores nuevos), `npx tsc --noEmit`, `npm run build` y `npm run test:unit` en verde.

## Verificación manual

En local (`npm run dev`), con Dirección QA y Educador QA para ver la navegación de cada rol:

1. Recorrer Inicio, NNyA, un legajo, Retiros y un formulario con diálogo, a 1440 y a 1280 de ancho.
2. Comparar Inicio con el boceto aprobado.
3. Verificar el contraste con las herramientas del navegador.
