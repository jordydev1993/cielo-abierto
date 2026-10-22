---
name: Argüello Infancias
description: Sistema de gestión de una residencia de NNyA bajo protección judicial. Señalética de hospital público.
colors:
  tinta: "#14201e"
  fondo: "#f4f6f5"
  superficie: "#ffffff"
  superficie-baja: "#eef1f0"
  superficie-media: "#e6eae9"
  texto-secundario: "#56625f"
  contorno: "#5f6a67"
  filete: "#d3d9d7"
  primary: "#1f4e8c"
  primary-container: "#dce6f3"
  secondary: "#3d4448"
  secondary-container: "#e3e8e7"
  tertiary: "#9a6212"
  tertiary-fixed: "#f6e7cc"
  error: "#c62828"
  error-container: "#fbe3e1"
  exito-container: "#e2f0e9"
  area-nucleo: "#1f4e8c"
  area-tutela: "#5b4b9a"
  area-seguimiento: "#9a6212"
  area-salud: "#2e7d5b"
  area-institucional: "#24646b"
  area-administracion: "#3d4448"
  prioridad-baja: "#d19a55"
  prioridad-media: "#a15f1c"
  prioridad-alta: "#874a13"
  prioridad-critica: "#5c2c06"
typography:
  display:
    fontFamily: "Overpass, ui-sans-serif, system-ui"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1
  title:
    fontFamily: "Overpass, ui-sans-serif, system-ui"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.1
  heading:
    fontFamily: "Overpass, ui-sans-serif, system-ui"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.12em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "2px"
  md: "2px"
  lg: "3px"
  xl: "4px"
spacing:
  gutter: "24px"
  page-x: "32px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    height: "36px"
  badge-vigente:
    backgroundColor: "{colors.exito-container}"
    textColor: "#1b4d37"
    typography: "{typography.heading}"
    rounded: "{rounded.sm}"
  badge-pendiente:
    backgroundColor: "{colors.tertiary-fixed}"
    textColor: "#5f3c0b"
    typography: "{typography.heading}"
    rounded: "{rounded.sm}"
  input:
    backgroundColor: "{colors.superficie-baja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    height: "36px"
  sidebar:
    backgroundColor: "{colors.tinta}"
    textColor: "#e9eeec"
    width: "248px"
  cartel-area:
    backgroundColor: "{colors.area-nucleo}"
    textColor: "{colors.superficie}"
    padding: "12px 32px"
---

# Design System: Argüello Infancias

> **En transición (22/10/2026):** este documento describe el sistema "Señalética" (prompts/051), que se está reemplazando por el sistema SaaS claro de prompts/052. Se reescribe al terminar la última tanda; mientras tanto, los tokens vigentes están en `app/globals.css`.

## Overview

**Creative North Star: "La señalética del hospital público"**

El sistema se apoya en la señalética de un hospital pediátrico público. Cada área de la residencia tiene un color de señal, y cada pantalla empieza diciendo dónde estás, como el cartel sobre una puerta. Es una herramienta de trabajo: se usa ocho horas en una PC de oficina, así que la expresión vive en tres detalles precisos (el color de área, la tipografía de ruta y los filetes) y nunca en adorno.

Rechaza el panel SaaS de tarjetas blancas con sombra y un acento azul, y todo lo que se vea infantil: es una institución bajo control judicial, no una app para chicos.

**Key Characteristics:**
- Barra lateral oscura como directorio del hall, agrupada por área.
- Cartel de área a todo el ancho al tope de cada pantalla.
- Superficies blancas separadas por filetes de 1 px, sin sombras de tarjeta.
- Overpass para carteles, títulos y cifras; Atkinson Hyperlegible Next para leer.

## Colors

Estrategia **restringida con color de área**: fondo y tinta neutros levemente verdes, más seis colores de área que hacen un solo trabajo cada uno.

### Primary
- **Azul de Núcleo** (`#1f4e8c`): acción principal (botones, enlaces) y color del área Núcleo.

### Neutral
- **Tinta** (`#14201e`): texto principal, barra lateral y filete grueso bajo las cabeceras de tabla.
- **Fondo** (`#f4f6f5`) y **Superficie** (`#ffffff`): el plano de la página y las superficies de contenido.
- **Filete** (`#d3d9d7`): toda separación.
- **Texto secundario** (`#56625f`) y **Contorno** (`#5f6a67`): texto de apoyo, íconos y placeholders.

### Áreas
Núcleo `#1f4e8c` · Tutela y retiros `#5b4b9a` · Seguimiento `#9a6212` · Salud `#2e7d5b` · Institucional `#24646b` · Administración `#3d4448`. El texto blanco pasa AA sobre los seis (el más justo es Salud, 5.0:1).

### Estados y prioridad
- **Crítico** (`#c62828`): solo errores y lo crítico.
- **Prioridad de alertas**: rampa ordinal de un solo tono, de baja (`#d19a55`) a crítica (`#5c2c06`), validada con la skill dataviz (tono único, luminosidad monótona y saltos visibles).

### Named Rules
**The One Job Rule.** Cada color de área marca solo su área (cartel, ítem activo, cuadrado de identidad). Nunca se reutiliza como "serie 4" ni como decoración.

**The Ink Text Rule.** El texto va en tinta o texto secundario; el color de la serie o del área va en la marca de al lado, nunca en las letras (salvo texto blanco sobre un bloque de color).

## Typography

**Display:** Overpass, la tipografía de ruta derivada de Highway Gothic, para carteles, títulos de sección y cifras.
**Body:** Atkinson Hyperlegible Next, elegida por legibilidad para nombres, DNI y texto legal.

### Hierarchy
- **Display** (800, 44 px, 1): la cifra de cada panel de área. Cifras proporcionales.
- **Title** (800, 28 px): títulos de página grandes.
- **Heading** (700, 13 px, mayúsculas, 0.12em): rótulos de sección, cabeceras de tabla, insignias de estado.
- **Body** (400, 15 px, 1.5): texto de trabajo.
- **Small** (400, 13 px): datos de apoyo y fechas.

### Named Rules
**The Sign Voice Rule.** Lo que orienta (cartel, rótulo, estado) habla en Overpass mayúsculas espaciadas; lo que se lee, en Atkinson. Nunca un rótulo encima de un título (kicker).

## Layout

Grilla de 12 columnas con gutter de 24 px y margen lateral de 32 px. En Inicio, la agenda ocupa 7 columnas y las alertas 5. La barra lateral mide 248 px y es fija. El diseño está pensado para PC de oficina (1280 px o más); en anchos de celular la barra lateral no se colapsa todavía.

## Elevation & Depth

Plano por defecto: la profundidad la dan los filetes y el contraste de superficie, no las sombras. Solo los elementos flotantes (diálogos, menús de select, toasts) llevan una sombra suave con desplazamiento; el overlay de los diálogos es tinta al 45 %.

### Named Rules
**The Rule Line Rule.** Se separa con filetes de 1 px. Una tarjeta con sombra para agrupar contenido es un error.

## Shapes

Esquinas casi rectas, como una chapa de señalética: 2 px en controles e insignias, 3 a 4 px como máximo. Los cuadrados de identidad de área son cuadrados exactos.

## Components

### Buttons
Rectos (2 px), 36 px de alto, peso semibold. Primario en azul de Núcleo; contorno con borde y superficie blanca; destructivo en crítico. Foco con anillo del color primario.

### Chips (insignias de estado)
Rótulo recto en Overpass mayúsculas 11 px: vigente en verde claro, pendiente en ocre claro, en revisión en azul claro, rechazado en rojo claro. Un tratamiento por estado en todo el sistema.

### Cards / Containers
Superficie blanca con filete. Los paneles de área van en fila, divididos por filetes verticales, con cuadrado de color, rótulo, cifra y, si responde una pregunta, un gráfico.

### Inputs / Fields
Fondo de superficie baja, filete y 2 px de radio. Foco con borde primario.

### Navigation
Barra lateral en tinta: grupos por área con su cuadrado de color y rótulo en Overpass; ítems de 40 px de alto. El ítem activo se rellena con el color de su área. Las pestañas son subrayadas (3 px en tinta en la activa).

### Cartel de área
Franja a todo el ancho en el color del área: pictograma en cuadrado blanco, nombre del módulo, filete y nombre del área en la misma línea; a la derecha, usuario, rol y fecha.

### Gráficos
Solo cuando responden una pregunta (ver `prompts/051`): tendencia como línea de 2 px con el último punto marcado; partes de un total ordenado como barra única apilada con 2 px de separación y leyenda. Nunca tortas, 3D ni degradés.

## Do's and Don'ts

### Do:
- **Do** abrir cada pantalla con el cartel de su área.
- **Do** separar con filetes de 1 px.
- **Do** usar cada color de área solo para su área.
- **Do** validar con dataviz cualquier paleta nueva de gráficos.
- **Do** marcar como "(DEMO)" y con la franja de aviso todo dato de ejemplo.

### Don't:
- **Don't** usar tarjetas con sombra para agrupar contenido.
- **Don't** poner un rótulo encima de un título (kicker).
- **Don't** usar colores de jardín, ilustraciones tiernas ni nada que se vea infantil.
- **Don't** pintar texto con el color de un área o de una serie.
- **Don't** agregar un gráfico que no responda una pregunta.
