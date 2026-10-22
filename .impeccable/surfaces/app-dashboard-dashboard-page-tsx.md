---
version: 1
slug: "app-dashboard-dashboard-page-tsx"
primary_target: "app/(dashboard)/dashboard/page.tsx"
related_targets: []
---

# Inicio (/dashboard)

Scope: primera superficie del rediseño del sistema web; fija el mundo que heredan los demás módulos. Modo: operate. Build: code-led.

Audience and job: Dirección y Equipo Técnico en PC de oficina, al empezar el día y entre tareas: ver qué pasa hoy (agenda), qué está pendiente (alertas) y el estado general de la residencia, y saltar al módulo que corresponde.

Constraints: no infantil (decisión del usuario, 22/10/2026). Datos de NNyA nunca reales en maquetas. Mismas funciones y textos; navegación y controles estándar (shadcn/Radix).

## Direction contract

THESIS: Cada área de la residencia tiene su color de señal y cada pantalla empieza diciendo dónde estás, como la señalética de un hospital pediátrico público. Rechaza el panel SaaS de tarjetas blancas con sombra y un acento azul.

OWN-WORLD: Barra lateral en tinta verde oscura (#14201E) como directorio del hall, con grupos por área marcados por un cuadrado de color; fondo #F4F6F5, superficies blancas separadas por filetes de 1 px, sin sombras. Seis colores de área de un solo uso (núcleo azul, tutela violeta, seguimiento ocre, salud verde, institucional petróleo, rojo solo crítico). Overpass para carteles, títulos y cifras; Atkinson Hyperlegible Next para texto y datos. Raises: agenda en columnas fijas ordenada por hora (split-flap); alerta nueva resaltada hasta verla (gate board); filetes en vez de tarjetas (design annual); grilla de 12 columnas estricta (Crouwel); un tratamiento único por estado (acetate manual).

STORY: El usuario entiende en un vistazo dónde está, qué hay hoy y qué quedó pendiente, y entra al módulo correcto sin buscar.

FIRST VIEWPORT: Barra lateral 248 px a la izquierda. Arriba, el cartel del área a todo el ancho en su color, con pictograma en cuadrado blanco, "Núcleo · Usted está en", título "Inicio" y usuario/fecha a la derecha. Debajo, una fila de cuatro paneles de área separados por filetes con cifra grande en Overpass. Debajo, agenda de hoy (7 de 12 columnas) y alertas (5 de 12). Acción principal: tocar una fila para ir al registro.

FORM: Señalética de hospital público, candidato 5 de 7 de la lista propia (asignado por el sorteo). seed:e102a49f66699151

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
