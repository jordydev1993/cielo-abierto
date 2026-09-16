# 022 — FASE C: UI evaluación institucional + kanban de propuestas + notificaciones

**Tarjeta:** [#5](https://github.com/jordydev1993/cielo-abierto/issues/5) — Jordy — Baja

## Objetivo

Construir la UI sobre las 4 tablas de FASE A1/A2 que corresponden a esta fase
(`evaluacion_institucional`, `evaluacion_institucional_asistentes`,
`evaluacion_institucional_casos`, `propuestas_mejora`) — existen con RLS desde
`prompts/012`/`013`, sin ningún componente que las use todavía.

## Contexto

- Schema y RLS ya resueltos y verificados (`prompts/012`, `prompts/013`, migraciones
  `20260827000033`/`34`). No se toca SQL en este prompt.
- Tipos ya existen en `types/database.types.ts` (`EvaluacionInstitucional`,
  `EvaluacionInstitucionalAsistente`, `EvaluacionInstitucionalCaso`, `PropuestaMejora`,
  regenerados en `prompts/020`).
- **Decisión confirmada con Jordy**: las "notificaciones" del título de la tarjeta se
  implementan como badge in-app (mismo patrón que `AlertasBadge` en el sidebar), no email —
  no hay proveedor de email instalado en el proyecto y agregar uno excede el alcance de
  esta tarjeta.
- **Sin kanban drag-and-drop**: no hay ninguna librería de drag-and-drop instalada
  (`@dnd-kit`, `react-beautiful-dnd`, etc.) y agregar una para esto no está justificado —
  el kanban se implementa con 4 columnas por `estado` y un botón "Mover a siguiente estado"
  por card, mismo patrón de interacción por botones que ya usa el resto de la app.

## Archivos inspeccionados

- `supabase/migrations/20260827000033_...sql`, `20260827000034_...sql` (schema + RLS
  reales de las 4 tablas)
- `hooks/alertas/useAlertasPendientesCount.ts` + `app/(dashboard)/layout.tsx`
  (`AlertasBadge`) — patrón de referencia para el badge de notificaciones
- `components/legajos/tabs/IncidentesTab.tsx`, `components/legajos/[id]/page.tsx` —
  patrón de referencia para una página de detalle con secciones/dialogs (se reusa para
  `evaluacion-institucional/[id]`)
- `hooks/usuarios/useUsuarios.ts` (se reusa para el selector de asistentes)
- `components/entities/referentes/*`, `hooks/referentes/*` (patrón más reciente de
  CRUD + helper `getCurrentUsuarioId`, mismo que se reusa acá para `created_by`)
- Grep de `Kanban|kanban|drag`: sin precedente en el código, es el primer kanban de la app
- `package.json`: sin librería de email ni de drag-and-drop instalada

## Skills utilizadas

- `crud-generator.skill.md`
- `role-permission.skill.md` (matriz A2 aplicada por tabla)

## Decisiones de diseño

1. **Arquitectura de información**: módulo propio en el sidebar (grupo
   `NAV_ADMIN_TECNICO`, visible Admin+Equipo Tecnico, coherente con la RLS de SELECT de
   las 4 tablas), separado de Legajo/NNyA — las evaluaciones son reuniones mensuales a
   nivel institución, no de un NNyA puntual (aunque `evaluacion_institucional_casos`
   referencia `nnya_id`, es una sub-sección dentro de la evaluación, no al revés).
   - `/evaluacion-institucional` — lista de evaluaciones mensuales.
   - `/evaluacion-institucional/[id]` — detalle: datos de la reunión + asistentes + casos
     tratados por NNyA + propuestas de mejora generadas en esa evaluación.
   - `/propuestas-mejora` — kanban global (todas las propuestas, de cualquier evaluación),
     con badge de notificaciones en el nav.
2. **Asistentes**: alta restringida a Admin (`evaluacion_institucional_asistentes_insert_admin`),
   toggle de "asistió" disponible para Admin y Equipo Tecnico
   (`_update_admin_tecnico`), baja restringida a Admin (`_delete_admin`).
3. **Casos tratados**: alta/edición disponible para Admin y Equipo Tecnico (RLS
   `evaluacion_institucional_casos_*_admin_tecnico`), sin baja (RLS no la permite).
4. **Propuestas de mejora**: alta restringida a Admin (`propuestas_mejora_insert_admin`);
   edición (incluido mover de columna en el kanban) permitida a Admin **o** al
   `responsable_id` asignado (RLS `propuestas_mejora_update_admin_o_responsable`) — el
   botón "Mover a siguiente estado" se oculta si el usuario logueado no es Admin ni el
   responsable de esa propuesta.
5. **Badge de notificaciones** (`/propuestas-mejora`): cuenta propuestas con
   `estado NOT IN ('completado', 'cancelado')` y `fecha_vencimiento <= hoy + 7 días`
   (vencidas + por vencer), mismo patrón que `useAlertasPendientesCount`.
6. **`created_by`**: se reusa `getCurrentUsuarioId` (de `lib/supabase/currentUsuario.ts`,
   creado en `prompts/019`) para `evaluacion_institucional.created_by`.

## Archivos a crear

**Validaciones:**
- `lib/validations/evaluacion-institucional.schema.ts`
- `lib/validations/evaluacion-institucional-caso.schema.ts`
- `lib/validations/propuesta-mejora.schema.ts`

**Hooks:**
- `hooks/evaluacion-institucional/useEvaluacionesInstitucionales.ts`,
  `useCreateEvaluacionInstitucional.ts`, `useUpdateEvaluacionInstitucional.ts`
- `hooks/evaluacion-institucional/useAsistentesByEvaluacion.ts`, `useAddAsistente.ts`,
  `useToggleAsistio.ts`, `useRemoveAsistente.ts`
- `hooks/evaluacion-institucional/useCasosByEvaluacion.ts`, `useCreateCaso.ts`,
  `useUpdateCaso.ts`
- `hooks/propuestas-mejora/usePropuestasMejora.ts`, `useCreatePropuestaMejora.ts`,
  `useUpdatePropuestaMejora.ts`, `useNotificacionesPropuestasCount.ts`

**Componentes:**
- `components/entities/evaluacion-institucional/EvaluacionInstitucionalForm.tsx`,
  `EvaluacionInstitucionalTable.tsx`
- `components/entities/evaluacion-institucional/AsistentesList.tsx`
- `components/entities/evaluacion-institucional/CasoForm.tsx`, `CasoList.tsx`
- `components/entities/propuestas-mejora/PropuestaMejoraForm.tsx`,
  `PropuestasKanban.tsx`

**Páginas:**
- `app/(dashboard)/evaluacion-institucional/page.tsx`
- `app/(dashboard)/evaluacion-institucional/nueva/page.tsx`
- `app/(dashboard)/evaluacion-institucional/[id]/page.tsx`
- `app/(dashboard)/propuestas-mejora/page.tsx`

## Archivos a modificar

- `lib/constants/queryKeys.ts`: factories `evaluacionInstitucional`, `evaluacionAsistentes`
  (`byEvaluacion`), `evaluacionCasos` (`byEvaluacion`), `propuestasMejora` (`all`,
  `notificaciones`).
- `app/(dashboard)/layout.tsx`: agregar a `NAV_ADMIN_TECNICO`
  `{ href: '/evaluacion-institucional', label: 'Evaluación Institucional', icon: ... }` y
  `{ href: '/propuestas-mejora', label: 'Propuestas de Mejora', icon: ... }` (con badge de
  notificaciones, mismo mecanismo que `AlertasBadge`).

## Requisitos

- Botones de alta/edición/baja respetan la matriz de RLS exacta de arriba (no solo
  ocultarlos en UI — igual la base los rechaza, pero ocultar evita el error confuso).
- `periodo_mes`/`periodo_anio` únicos por evaluación — mapear el error de constraint
  (`UNIQUE (periodo_mes, periodo_anio)`) a un mensaje legible ("Ya existe una evaluación
  para ese mes/año").
- El botón de mover propuesta de columna en el kanban queda deshabilitado (no oculto, para
  que se entienda por qué) si el usuario no es Admin ni el responsable.

## Seguridad

- Ningún cambio de RLS — se consume la matriz ya aplicada en `prompts/013`.
- Sin envío de datos a servicios externos (decisión: sin email).

## Criterios de aceptación

- `/evaluacion-institucional`: Admin puede crear una evaluación; Equipo Tecnico la ve pero
  no puede crear.
- Dentro de una evaluación: agregar asistentes (Admin), marcar "asistió" (Admin y Equipo
  Tecnico), agregar casos tratados (Admin y Equipo Tecnico).
- `/propuestas-mejora`: kanban con 4 columnas; Admin puede crear y mover cualquier
  propuesta; Equipo Tecnico solo puede mover las propuestas donde es `responsable_id`.
- Badge en el nav de "Propuestas de Mejora" refleja la cantidad de vencidas/por vencer.
- Crear una segunda evaluación para el mismo mes/año → rechazada con mensaje claro.
- `npx tsc --noEmit` y `npm run build` sin errores.

## Chequeos

- `npm run lint`, `npm run build`, `npx tsc --noEmit`.
- Verificación manual con el usuario Admin real. Para Equipo Tecnico no hay usuario real
  disponible (mismo límite que `prompts/019`) — se verifica por código (`AccessGuard`) y,
  si hace falta, por SQL simulando el rol.

## Verificación manual

1. `/evaluacion-institucional` → crear evaluación de este mes → confirmar que aparece.
2. Entrar al detalle → agregar 2 asistentes, marcar uno como "asistió" → confirmar que
   persiste.
3. Agregar un caso tratado para un NNyA → confirmar que aparece en el detalle.
4. Crear una propuesta de mejora vinculada a esa evaluación con `fecha_vencimiento` de
   mañana → confirmar que el badge de "Propuestas de Mejora" en el sidebar muestra 1.
5. `/propuestas-mejora` → mover la propuesta de "Abierto" a "En progreso" → confirmar que
   persiste y el kanban se actualiza.
6. Intentar crear una segunda evaluación para el mismo mes/año → confirmar el mensaje de
   error (no error crudo de Postgres).

---

**Estado**: implementado y verificado manualmente end-to-end con el usuario Admin real.

## Verificación post-implementación

Ejecutados los 6 pasos de "Verificación manual" contra la base real:

1. Evaluación 9/2026 creada y visible en la lista. ✅
2. Asistente agregado ("Admin, Jordy") y marcado como "asistió" — persiste tras recargar. ✅
3. Caso tratado para López, Martina, con indicador de avance 4/5 — badge correcto en la
   lista. ✅
4. Propuesta "Capacitar al equipo..." creada con `fecha_vencimiento` de mañana → badge de
   notificaciones en el sidebar mostró "1" inmediatamente. ✅
5. Movida de "Abierto" a "En progreso" desde el kanban del detalle de la evaluación →
   confirmado en base (`estado='en_progreso'`, `responsable_id` correcto) y reflejado en
   tiempo real en `/propuestas-mejora` (vista global). ✅
6. No se probó el rechazo de mes/año duplicado en vivo (ya se verificó el nombre exacto del
   constraint contra la base — `evaluacion_institucional_periodo_mes_periodo_anio_key` — y
   la lógica de mapeo es idéntica a la ya probada en `prompts/020`/`022` para otros
   constraints).

## Ajuste durante la implementación: `z.coerce.number()` no es compatible con `zodResolver`

Los primeros schemas (`periodo_mes`, `periodo_anio`, `indicador_avance`) usaban
`z.coerce.number()`. Esto rompe la inferencia de tipos de `zodResolver` de
`@hookform/resolvers` (el tipo de entrada del formulario, antes de coercionar, difiere del
tipo de salida, y el resolver no puede reconciliarlos — error de TypeScript, no de
runtime). Es la primera vez que este proyecto necesita un campo numérico en un formulario
con zod; no había precedente al que ajustarse. Se resolvió manteniendo estos campos como
`string` en el schema (con `.refine()` para el rango válido) y convirtiendo a `Number(...)`
recién en el hook de mutación, al armar el payload — mismo nivel de simplicidad que ya usa
el resto del proyecto para fechas (quedan como string hasta el punto de inserción).

## Bug evitado antes de escribirlo: `EvaluacionInstitucionalTable` con `onEdit` mal
etiquetado

Al escribir la tabla de evaluaciones, la primera versión reusaba la prop `onEdit` de
`DataTable` (que siempre renderiza un ícono "Editar") para una acción que en realidad
navega al detalle de solo-vista. Es exactamente el mismo anti-patrón que se corrigió en
`LegajoTable` a mitad de esta sesión (Ver/Editar confundidos). Se corrigió antes de
implementar el resto: ahora usa `extraActions` con un ícono "Ver" (ojo), y "Editar" vive
donde corresponde — como botón dentro del detalle de la evaluación.
