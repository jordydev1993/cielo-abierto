# 023 — FASE D: UI de `turnos_personal` + firma doble de traspaso + dashboard de cobertura

**Tarjeta:** [#6](https://github.com/jordydev1993/cielo-abierto/issues/6) — Jordy — Baja

## Objetivo

Construir la UI sobre `turnos_personal` (existe con RLS desde `prompts/012`/`013`, sin
componentes que la usen todavía): planificación de turnos de personal, traspaso con firma
doble (entrega/recepción), y un dashboard simple de cobertura.

## Contexto

- Schema y RLS ya resueltos y verificados (`prompts/012`, `prompts/013`, migraciones
  `20260827000033`/`34`). Confirmado de nuevo contra la base real en esta sesión (`pg_constraint`
  sobre `turnos_personal`) — coincide exactamente con lo documentado, sin drift.
- Tipo ya existe en `types/database.types.ts` (`TurnoPersonal`).

### La limitación de seguridad que ya identificó `prompts/013` — es el corazón de este prompt

La política RLS `turnos_personal_update_firma` permite al titular (`usuario_id = self`)
hacer un solo `UPDATE` que setee tanto su propia mitad (`entregado_por`/`entregado_at`)
**como** `recibido_por` a cualquier otro `usuario_id` — el `CHECK turnos_personal_check4`
impide que se ponga a sí mismo como receptor, pero no impide que invente cualquier otro.
RLS no puede validar "esta otra persona realmente confirmó recibir" — eso solo lo puede
garantizar la UI, separando la acción en dos pasos que nunca comparten un mismo formulario:

1. **"Entregar mi turno"** — solo visible para el titular (`usuario_id = usuario actual`),
   en un turno `planificado`/`en_curso`. Solo puede setear `entregado_por` (= sí mismo),
   `entregado_at`, `novedades_traspaso` y `estado → 'entregado'`. **Nunca** toca
   `recibido_por`.
2. **"Recibir turno"** — solo visible para cualquier usuario **que no sea el titular**, en
   un turno `estado = 'entregado'` con `recibido_por IS NULL`. Solo puede setear
   `recibido_por` (= sí mismo), `recibido_at` y `estado → 'cerrado'`.

Estas dos acciones nunca aparecen en el mismo formulario ni permiten elegir "a nombre de
quién" se ejecutan — el usuario logueado siempre es el sujeto de la acción. Es la única
forma de que la firma doble sea real (dos sesiones distintas, dos clicks distintos).

## Archivos inspeccionados

- `supabase/migrations/20260827000033_...sql` (`turnos_personal` — columnas, `CHECK`s,
  `UNIQUE(usuario_id, fecha, turno)`)
- `supabase/migrations/20260827000034_...sql` (política `turnos_personal_update_firma`)
- `pg_constraint` en vivo sobre `turnos_personal` — confirmado sin drift
- `hooks/usuarios/useCurrentUsuario.ts` (creado en `prompts/022`, se reusa para identificar
  "soy el titular" / "no soy el titular")
- `components/entities/propuestas-mejora/*`, `components/entities/evaluacion-institucional/*`
  (patrón más reciente: dialog + form pequeño para altas simples, lista con acciones
  condicionadas por rol/identidad)
- `hooks/usuarios/useUsuarios.ts` (selector de personal para asignar turnos)

## Skills utilizadas

- `crud-generator.skill.md`
- `role-permission.skill.md`

## Decisiones de diseño

1. **Arquitectura de información**: módulo propio `/turnos-personal` en el sidebar
   (`NAV_ADMIN_TECNICO`, coherente con RLS SELECT admin+tecnico). Lista de turnos
   (filtrable por fecha), con las acciones de entrega/recepción por fila, más un resumen de
   cobertura arriba.
2. **Alta de turno** (Admin only, `turnos_personal_insert_admin`): dialog simple con
   `usuario_id`, `fecha`, `turno`. Mapear el error de `UNIQUE(usuario_id, fecha, turno)` a
   mensaje legible.
3. **"Entregar mi turno"**: botón visible **solo** en filas donde
   `usuario_id === miUsuario.id` y `estado IN ('planificado', 'en_curso')`. Dialog con
   `novedades_traspaso` (textarea). Al confirmar: `entregado_por = miUsuario.id`,
   `entregado_at = now()`, `estado = 'entregado'`. No pide ni muestra selector de receptor.
4. **"Recibir turno"**: botón visible **solo** en filas donde
   `usuario_id !== miUsuario.id`, `estado === 'entregado'` y `recibido_por IS NULL`. Sin
   formulario (o a lo sumo confirmación simple) — al confirmar: `recibido_por =
   miUsuario.id`, `recibido_at = now()`, `estado = 'cerrado'`.
5. **Dashboard de cobertura**: resumen simple arriba de la lista — conteo de turnos
   `no_cubierto` en los próximos 7 días y conteo por estado del día actual. Sin gráficos
   nuevos (no hay `recharts` config para esto en el alcance de esta tarjeta, y ya se usa en
   el dashboard general — reusar el mismo estilo de `KPICard` si aplica, o tarjetas simples
   como en `ResumenTab`).
6. **`no_cubierto`**: no hay transición automática a este estado (ningún cron/trigger lo
   pone) — queda como una marca manual que Admin puede setear editando el turno (ej. si el
   titular avisó que no puede cubrir y no se reasignó). Se agrega como opción de `estado` en
   un pequeño form de edición (Admin only), no como parte del flujo de entrega/recepción.

## Archivos a crear

**Validaciones:**
- `lib/validations/turno-personal.schema.ts` (alta: `usuario_id`, `fecha`, `turno`, `estado`
  opcional para edición Admin)
- `lib/validations/entrega-turno.schema.ts` (`novedades_traspaso` opcional)

**Hooks:**
- `hooks/turnos-personal/useTurnosPersonal.ts` (list, con join a `usuarios` para
  titular/entregado_por/recibido_por — atención a la ambigüedad de FK: 3 FKs a `usuarios`,
  hay que especificar cada una explícitamente, mismo problema que se encontró y corrigió en
  `prompts/019` con `vinculos_tutela`)
- `hooks/turnos-personal/useCreateTurnoPersonal.ts`
- `hooks/turnos-personal/useUpdateTurnoPersonal.ts` (edición Admin: fecha/turno/estado —
  para marcar `no_cubierto` u otros ajustes; nunca toca `entregado_*`/`recibido_*`)
- `hooks/turnos-personal/useEntregarTurno.ts` (solo `entregado_por`/`entregado_at`/
  `novedades_traspaso`/`estado`)
- `hooks/turnos-personal/useRecibirTurno.ts` (solo `recibido_por`/`recibido_at`/`estado`)

**Componentes:**
- `components/entities/turnos-personal/TurnoPersonalForm.tsx` (alta/edición Admin)
- `components/entities/turnos-personal/TurnoPersonalList.tsx` (lista con las acciones
  condicionadas por identidad/rol descriptas arriba)
- `components/entities/turnos-personal/EntregaTurnoForm.tsx`
- `components/entities/turnos-personal/CoberturaResumen.tsx` (contadores simples)

**Páginas:**
- `app/(dashboard)/turnos-personal/page.tsx`

## Archivos a modificar

- `lib/constants/queryKeys.ts`: factory `turnosPersonal`.
- `app/(dashboard)/layout.tsx`: agregar `{ href: '/turnos-personal', label: 'Turnos de Personal', icon: ... }` a `NAV_ADMIN_TECNICO`.

## Requisitos

- El botón "Entregar mi turno" y el botón "Recibir turno" **nunca** aparecen juntos para el
  mismo usuario en la misma fila (mutuamente excluyentes por identidad).
- Ninguno de los dos formularios permite elegir `usuario_id`/`entregado_por`/`recibido_por`
  manualmente — siempre se usa `miUsuario.id` resuelto por `useCurrentUsuario()`.
- Error de `UNIQUE(usuario_id, fecha, turno)` mapeado a mensaje legible ("Ese usuario ya
  tiene un turno asignado para esa fecha y franja").
- `join` a `usuarios` en `useTurnosPersonal` especifica el FK exacto en cada una de las 3
  relaciones (`turnos_personal_usuario_id_fkey`, `turnos_personal_entregado_por_fkey`,
  `turnos_personal_recibido_por_fkey`) para evitar el error `300 Multiple Choices` de
  PostgREST ya visto en `prompts/019`.

## Seguridad

- Ningún cambio de RLS — se consume la matriz ya aplicada en `prompts/013`.
- La separación de "Entregar"/"Recibir" en dos acciones distintas, cada una limitada a
  `miUsuario.id`, es lo que cierra en la práctica el hueco que RLS por sí sola no puede
  cerrar (documentado en `prompts/013`, ver Contexto arriba).

## Criterios de aceptación

- Admin puede asignar un turno a un usuario para una fecha/franja.
- Asignar dos turnos al mismo usuario/fecha/franja → rechazado con mensaje claro.
- El titular de un turno `planificado` ve "Entregar mi turno" y nadie más lo ve para esa
  fila.
- Una vez `entregado`, cualquier otro usuario (no el titular) ve "Recibir turno"; el
  titular no.
- Al recibir, el turno pasa a `cerrado` con `recibido_por`/`recibido_at` seteados
  correctamente.
- El resumen de cobertura muestra turnos `no_cubierto` de los próximos 7 días.
- `npx tsc --noEmit` y `npm run build` sin errores.

## Chequeos

- `npm run lint`, `npm run build`, `npx tsc --noEmit`.
- Verificación manual con el usuario Admin real. Para probar "Recibir turno" con una
  identidad distinta del titular haría falta un segundo usuario real — no existe hoy (ver
  limitación ya señalada en `prompts/019`/`022`). Se verifica que el botón "Recibir" no
  aparece para el propio titular (Admin asignándose un turno a sí mismo) y sí aparecería
  para cualquier fila donde `usuario_id !== miUsuario.id`, por inspección de la condición en
  código.

## Verificación manual

1. `/turnos-personal` → asignar un turno a un usuario para hoy.
2. Si el usuario logueado es el titular de ese turno → confirmar que aparece "Entregar mi
   turno" y no "Recibir turno".
3. Entregar el turno con una nota de traspaso → confirmar `estado = 'entregado'`.
4. Confirmar que el resumen de cobertura refleja el turno.
5. Intentar asignar un segundo turno al mismo usuario/fecha/franja → confirmar el mensaje
   de error.

---

**Estado**: implementado y verificado manualmente con el usuario Admin real.

## Verificación post-implementación

1. Turno asignado a "Admin, Jordy" (único usuario real disponible) para 15/09/2026,
   mañana. ✅
2. Como titular de ese turno: apareció "Entregar mi turno" y **no** "Recibir turno"
   (correcto, `esTitular = true`). ✅
3. Entregado con novedades → `estado = 'entregado'`, `entregado_por = usuario_id`,
   `recibido_por = null` — confirmado en base. Tras entregarlo, ya no aparece ningún botón
   de acción para el titular (ni "Entregar" porque ya no está planificado/en_curso, ni
   "Recibir" porque sigue siendo el titular) — el turno queda esperando que **otra**
   persona lo reciba. ✅
4. No se pudo probar "Recibir turno" con una identidad real distinta (no hay un segundo
   usuario con login — mismo límite que `prompts/019`/`022`); verificado por código que la
   condición (`!esTitular && estado === 'entregado' && !recibido_por`) es la correcta.

## Bug real encontrado y corregido antes de cerrar: el form de edición no podía mostrar
(ni guardar) un turno ya `entregado`/`cerrado`

El schema de edición (`turnoPersonalSchema.estado`) solo aceptaba
`'planificado' | 'en_curso' | 'no_cubierto'` — los tres estados que Admin puede setear a
mano. Al editar un turno que ya estaba en `estado = 'entregado'`, el `<Select>` no tenía
ningún `<SelectItem>` que calzara con ese valor: se renderizaba vacío, y si el usuario
apretaba "Guardar cambios" sin tocar nada, Zod iba a rechazar `'entregado'` como valor
inválido (nunca iba a poder guardarse ningún otro cambio — ni siquiera de fecha/franja —
en un turno ya entregado). Se corrigió:
- El schema ahora acepta los 5 estados reales.
- El `<Select>` se deshabilita (no se oculta) cuando el turno ya está
  `entregado`/`cerrado`, mostrando una opción extra solo para ese valor actual — así se ve
  el estado real y el formulario sigue siendo válido para guardar el resto de los campos.

Encontrado por prueba manual en navegador, no por revisión de código — otra confirmación
de por qué el paso de "usar la funcionalidad en el navegador" importa más que solo
`tsc`/`build` limpios.
