---
name: Argüello Infancias
description: Sistema de gestión de una residencia de NNyA bajo protección judicial. Panel SaaS claro y minimalista.
colors:
  tinta: "#111318"
  fondo-app: "#f4f5f7"
  superficie: "#ffffff"
  superficie-baja: "#f7f8fa"
  superficie-media: "#f1f2f4"
  superficie-alta: "#e7e8ec"
  texto-secundario: "#5b606b"
  contorno: "#6b717c"
  borde: "#e7e8ec"
  filete: "#eeeff2"
  primary: "#111318"
  info-container: "#eef2fd"
  exito: "#0f7a47"
  exito-container: "#e7f6ee"
  advertencia: "#9a5b00"
  advertencia-container: "#fff4e0"
  error: "#d1293d"
  error-container: "#fdecee"
  serie-1: "#3b6fe0"
  serie-2: "#e65c9f"
  serie-3: "#0f7a47"
  serie-contexto: "#9aa0aa"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.15
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  heading:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.35
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  full: "9999px"
spacing:
  page-x: "32px"
  page-y: "24px"
  gutter: "24px"
  marco: "12px"
components:
  button-primary:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-outline:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    height: "36px"
  badge:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    height: "36px"
  sidebar:
    backgroundColor: "{colors.superficie-baja}"
    textColor: "{colors.texto-secundario}"
    width: "240px"
  nav-item-active:
    backgroundColor: "{colors.superficie-media}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
---

# Design System: Argüello Infancias

## Overview

**Creative North Star: "El panel claro"**

Un panel de gestión SaaS claro y minimalista, tomado de una referencia que eligió Jordy (prompts/052). La app vive en un marco blanco redondeado sobre un fondo gris; el contenido respira, los números y los gráficos son los protagonistas y la interfaz se corre del medio. Es una herramienta de trabajo para la PC de oficina: lo que se ve primero es el dato, no la decoración.

**Key Characteristics:**
- Marco blanco de radio 12 px sobre fondo gris, con barra lateral clara y barra superior con la ruta.
- Cifras sin tarjetas, separadas por aire y filetes muy suaves.
- Gráficos protagonistas en azul, rosa y verde, siempre con una sola medida por eje.
- Un solo negro para la acción principal; todo lo demás en grises neutros.
- Inter en toda la interfaz.

## Colors

Estrategia **restringida**: grises neutros más tres colores de serie que hacen un solo trabajo, identificar series en los gráficos.

### Primary
- **Tinta** (`#111318`): texto principal y botón principal (negro con texto blanco).

### Neutral
- **Fondo de la app** (`#f4f5f7`): fuera del marco.
- **Superficie** (`#ffffff`): el marco y todo el contenido de trabajo.
- **Superficie baja / media / alta** (`#f7f8fa` / `#f1f2f4` / `#e7e8ec`): barra lateral, hover e ítem activo, rieles.
- **Texto secundario** (`#5b606b`) y **contorno** (`#6b717c`): texto de apoyo, ejes, íconos y placeholders (AA sobre blanco).
- **Borde** (`#e7e8ec`) y **filete** (`#eeeff2`): bordes de controles y divisiones de la grilla.

### Series de gráficos
Azul `#3b6fe0`, rosa `#e65c9f` y verde `#0f7a47`, en ese orden fijo, más gris de contexto `#9aa0aa` para una serie de referencia. Validada con el script de la skill dataviz: banda de luminosidad, croma, separación para daltonismo en todos los pares y contraste de 3:1 sobre blanco.

### Estados
Éxito (verde), advertencia (ámbar), crítico (rojo) e info (azul claro), cada uno con su fondo claro. En las insignias el estado lo dice el texto y lo refuerza un punto de color.

### Named Rules
**The Series Rule.** Los colores de serie solo identifican series en un gráfico; no se usan para decorar ni para estados.

**The One Black Rule.** Hay un solo negro con peso: el botón de la acción principal (y el avatar). Ninguna otra superficie es negra.

## Typography

**Inter** para todo, con cifras tabulares en las tablas y proporcionales en las cifras grandes.

### Hierarchy
- **Display** (600, 28 px): la cifra de cada indicador.
- **Title** (600, 20 px): título de página.
- **Heading** (600, 15 px): título de sección o de panel.
- **Body** (400, 14 px): texto de trabajo, tablas y controles.
- **Small** (400, 13 px): etiquetas de campo, datos de apoyo.
- **Caption** (500, 12 px): cabeceras de tabla, ejes, insignias.

Los nombres de la escala están registrados en `cn()` (`lib/utils.ts`) para que `tailwind-merge` no los confunda con colores.

### Named Rules
**The Quiet Label Rule.** Sin mayúsculas forzadas ni espaciado de letras: las etiquetas son texto chico en gris, no rótulos. Nunca un rótulo encima de un título.

## Layout

Marco de 12 px de margen alrededor de la app. Barra lateral de 240 px y contenido con margen de 32 px a los lados y 24 px arriba y abajo, en una grilla de 12 columnas con gutter de 24 px. Los formularios y los detalles se limitan a un ancho de lectura (`max-w-3xl` / `max-w-4xl`); los listados usan todo el ancho. Pensado para PC de oficina; sin versión móvil por ahora.

## Elevation & Depth

Plano: la profundidad la dan el borde del marco y los filetes. Solo los elementos flotantes (tooltip, menú de select, diálogo, toast) llevan sombra suave y amplia. El overlay de los diálogos es tinta al 30 %, sin desenfoque.

### Named Rules
**The No Card Rule.** Las cifras y los gráficos no van en tarjetas: se separan con aire y filetes. Las tarjetas quedan para bloques que se agrupan de verdad (por ejemplo, un formulario dentro de un listado).

## Shapes

Radio de 8 px en controles (botones, campos, menús), 12 px en contenedores (marco, diálogos, toasts) y pastillas completas en insignias y avatares.

## Components

### Buttons
36 px de alto (32 px en `sm`), radio 8, peso medio. Primario negro con texto blanco; contorno con borde gris y fondo blanco; secundario gris claro; destructivo rojo. Foco con anillo azul.

### Chips (insignias de estado)
Pastilla blanca con borde gris, texto de 12 px y un punto de color por estado: éxito, advertencia, crítico, info o neutro.

### Cards / Containers
Marco blanco con borde. Paneles sin tarjeta: título de sección, ayuda opcional con ícono de información y control a la derecha (por ejemplo, el selector de período).

### Inputs / Fields
Campo blanco de 36 px con borde gris y radio 8; foco con borde y anillo azul. El autocompletado del navegador no cambia el fondo.

### Navigation
Barra lateral clara: marca, buscador ⌘K (solo diseño, deshabilitado), Favoritos (accesos fijos), Inicio y grupos plegables con chevron. Ítem activo con fondo gris y texto en negrita. Barra superior con la ruta (grupo / módulo), Ayuda (solo diseño) y la cuenta. Pestañas de texto con subrayado de 2 px en la activa.

### Gráficos
Leyenda arriba (solo con 2 series o más), ejes y grilla recesivos, línea de 2 px en tramos rectos, último punto marcado, tooltip con guía vertical, barras de hasta 24 px con el valor en la punta, barras de progreso con porcentaje y una tabla oculta para lectores de pantalla. Nunca eje doble, tortas, 3D ni degradés.

## Do's and Don'ts

### Do:
- **Do** usar `PageHeader`, `Toolbar`, `StatRow` y `Panel` en cada pantalla nueva.
- **Do** validar con dataviz cualquier paleta nueva de gráficos.
- **Do** usar una sola medida por eje: si dos series tienen escalas distintas, van en gráficos separados.
- **Do** marcar como datos de ejemplo, con el aviso, todo dato ficticio.

### Don't:
- **Don't** usar tarjetas con sombra para cifras o gráficos.
- **Don't** usar los colores de serie para decorar o para estados.
- **Don't** usar ejes dobles, tortas ni degradés.
- **Don't** mostrar funciones que no existen como si funcionaran: lo que es solo diseño va deshabilitado con "Próximamente".
