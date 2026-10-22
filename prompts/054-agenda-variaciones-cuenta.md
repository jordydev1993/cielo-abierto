# 054 — Agenda en tarjetas, variación en las cifras y cuenta en la barra lateral

> **Estado: IMPLEMENTADO (22/10/2026), aprobado por Jordy con la opción A (menú con Radix, que ya era dependencia del proyecto) y la agenda reemplazando a la tabla.** Ajuste al implementar: la variación tiene tres sentidos (subir es bueno, malo o neutral), porque más NNyA activos o más audiencias no es ni bueno ni malo. Toma tres ideas de una segunda imagen de referencia que pasó Jordy (panel "Humanage"). Las ideas se acordaron el 22/10 (puntos 1, 2 y 3 de las sugerencias).

## Objetivo

1. **Agenda en tarjetas con la fecha grande** y pestañas por estado, en Inicio.
2. **Variación junto a cada cifra** de la fila de Inicio (por ejemplo "+1 vs. septiembre"), con flecha y color según si el cambio es bueno o malo.
3. **Cuenta del usuario al pie de la barra lateral**, con un menú que incluye "Cerrar sesión".

## Contexto

- **Inicio** (`app/(dashboard)/dashboard/page.tsx`) usa datos de ejemplo (`lib/mocks/inicio.ts`), con el aviso visible (decisión de `prompts/051` y `052`).
  - Hoy la agenda es una tabla de 5 filas del día.
  - La fila de cifras (`StatRow`) muestra valor, unidad e insignia, sin variación.
- **Barra lateral** (`app/(dashboard)/layout.tsx`): termina en "Cerrar sesión". La barra superior muestra el email, el rol y el avatar.
- **Sistema vigente:** `DESIGN.md` ("El panel claro"). Las reglas que importan acá:
  - cifras sin tarjeta;
  - un solo negro para la acción principal;
  - colores de serie solo en gráficos.

## Qué se toma de la referencia y qué no

| De la imagen | Se toma | No se toma |
|---|---|---|
| Lista de eventos con bloque de fecha ("Mon 24") a la izquierda y título y horario a la derecha, con pestañas On Going / Finished / Cancelled | Sí, con pestañas **Pendientes / Cumplidos / Cancelados** | Avatares de participantes y "On Google Meet": no hay esos datos ni esa integración |
| Variación con flecha y color ("+12,5 %", "−3,8 %") | Sí, como diferencia absoluta contra el mes anterior: con números chicos, un porcentaje exagera (de 1 a 2 es "+100 %") | Tarjeta por cifra: rompe la regla de cifras sin tarjeta |
| Usuario al pie de la barra lateral (avatar, nombre, email y chevron) | Sí, con menú: "Cerrar sesión" (y el rol visible) | — |

## Archivos a crear o modificar

| Archivo | Cambio |
|---|---|
| `lib/mocks/inicio.ts` | `Cifra` suma `variacion?: { valor: number; vs: string; subirEsBueno: boolean }`. La agenda pasa a `eventosProximos` (8 a 10 eventos de los próximos días, con fecha, hora de inicio y fin, tipo, NNyA y estado `pendiente` / `cumplido` / `cancelado`). Todo ficticio con "(DEMO)" |
| `components/shared/KPICard.tsx` (`StatRow`) | Muestra la variación debajo de la cifra: flecha, número con signo y "vs. septiembre". Verde si el cambio es bueno, rojo si es malo, gris si es 0, según `subirEsBueno`. Siempre con texto, no solo color |
| `components/shared/AgendaTarjetas.tsx` (nuevo) | Lista de eventos: bloque de fecha (día de la semana chico y número grande), filete vertical, título, horario y tipo, e insignia de estado. Pestañas con el componente `Tabs` existente. Mensaje vacío por pestaña |
| `app/(dashboard)/dashboard/page.tsx` | La sección "Agenda de hoy" pasa a "Próximos eventos" con `AgendaTarjetas` |
| `app/(dashboard)/layout.tsx` | Pie de la barra lateral: avatar con iniciales, email y rol, con un menú desplegable que tiene "Cerrar sesión". La barra superior deja solo la ruta y Ayuda |
| `components/ui/dropdown-menu.tsx` (nuevo) | Menú desplegable mínimo sobre `@radix-ui/react-dropdown-menu`, **dependencia nueva**: ver la decisión 1 |
| `DESIGN.md`, `.impeccable/design.json` | Documentar la agenda en tarjetas, la variación y la cuenta en la barra lateral |

## Requisitos

1. **Solo diseño en Inicio:** la agenda y las variaciones usan datos de ejemplo, sin consultas nuevas.
2. **Variación honesta:**
   - se calcula contra el valor del mes anterior que ya está en los datos de ejemplo cuando existe (NNyA activos: 17 → 18 = "+1");
   - las demás llevan valores de ejemplo coherentes;
   - nunca un porcentaje sobre bases menores a 10.
3. **Color de la variación:**
   - sube y subir es bueno: verde;
   - sube y subir es malo (alertas pendientes): rojo;
   - sin cambio: gris.
   - Flecha y texto siempre presentes.
4. **Agenda:**
   - eventos ordenados por fecha y hora;
   - las pestañas filtran por estado sin cambiar de página;
   - cada tarjeta enlaza al módulo del evento (Turnos, Retiros, Legajos, Post-egreso);
   - las tarjetas usan borde suave y radio 10, sin sombra; el evento de hoy se marca con un borde más oscuro.
5. **Cuenta:**
   - el menú abre con clic y con teclado, y "Cerrar sesión" hace lo mismo que hoy;
   - no se agregan opciones que no existen (perfil, configuración).
6. **Accesibilidad:** la variación tiene texto completo para lectores de pantalla ("Subió 1 respecto de septiembre"); el menú usa los roles de Radix.

## Decisiones para Jordy

1. **Menú de la cuenta.** Hay dos caminos:
   - **(A, recomendada)** agregar `@radix-ui/react-dropdown-menu`. El proyecto ya usa Radix para diálogo, select y pestañas; es la pieza estándar y accesible.
   - **(B)** sin dependencia nueva: un botón que despliega "Cerrar sesión" en línea dentro de la barra lateral.
2. **¿La agenda reemplaza a la tabla o se suma?** Recomiendo reemplazarla: muestran lo mismo y la tarjeta se lee mejor.

## Seguridad

No cambia nada en la base, en las consultas ni en los permisos. "Cerrar sesión" usa el mismo `signOut()` de hoy.

## Criterios de aceptación

- Cada cifra con variación muestra flecha, número con signo y período, con el color correcto según la regla.
- La agenda muestra las tarjetas con bloque de fecha y las tres pestañas filtran bien; la pestaña vacía muestra su mensaje.
- La cuenta aparece al pie de la barra lateral; el menú se abre con teclado y "Cerrar sesión" funciona.
- Inicio no hace pedidos nuevos a Supabase.
- El detector de `impeccable` no da hallazgos; `npx tsc --noEmit`, `npm run build` y `npm run test:unit` en verde; `npm run lint` sin errores nuevos.

## Verificación manual

En local contra Supabase local, con Dirección QA:

1. Revisar Inicio a 1440 y 1280 de ancho.
2. Recorrer las pestañas de la agenda.
3. Abrir el menú de la cuenta con Tab + Enter y cerrar sesión.
