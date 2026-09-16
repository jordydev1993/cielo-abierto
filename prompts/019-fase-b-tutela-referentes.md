# 019 — FASE B: UI de tutela/referentes + validación RENAPER + transferencia AUH

**Tarjeta:** [#4](https://github.com/jordydev1993/cielo-abierto/issues/4) — Jordy — Media

## Objetivo

Construir la UI sobre las 4 tablas de FASE A1/A2 que corresponden a esta fase (`referentes`,
`vinculos_tutela`, `validaciones_renaper`, `transferencia_auh`) — hoy existen con RLS y
tipos TypeScript, pero sin ningún componente que las use. Las otras 6 tablas de A1
(evaluación institucional, turnos de personal, seguimiento post-egreso) son FASES C/D/E,
fuera de este alcance.

## Contexto

- Schema y RLS ya resueltos y verificados en `prompts/012` y `prompts/013` (migraciones
  `20260827000033`/`20260827000034`). No se toca SQL en este prompt, salvo que la
  implementación revele un gap (no esperado).
- Tipos ya existen en `types/database.types.ts` (`Referente`, `VinculoTutela`,
  `ValidacionRenaper`, `TransferenciaAuh`) — no hace falta tocarlos.
- **Decisión de arquitectura de información (confirmada con Jordy):**
  - `referentes` → módulo propio en el sidebar (`/referentes`), lista + form, mismo patrón
    que `/tutores` (entidad independiente, reutilizable entre NNyA).
  - `vinculos_tutela` + `transferencia_auh` → tab nuevo **"Tutela"** dentro de
    `legajos/[id]/page.tsx`, junto a Incidentes/Intervenciones/Alertas/etc. Igual que
    Intervenciones/Alertas, se indexa por `nnyaId` (no por `legajoId`), porque
    `vinculos_tutela.nnya_id` es la FK real.
  - `validaciones_renaper` → acción "Validar RENAPER" por fila en `/referentes` (dialog que
    registra un resultado a mano). No hay integración real con RENAPER — `respuesta_cruda`
    (JSONB, pensado para la respuesta cruda de una API) queda sin exponer en el form, se
    inserta `null`. Coherente con "Fuera de alcance: integraciones externas no justificadas".

## Archivos inspeccionados

- `supabase/migrations/20260827000033_...sql`, `20260827000034_...sql` (schema + RLS reales
  de las 4 tablas, CHECKs de `vinculos_tutela`, trigger de protección de `dni`)
- `types/database.types.ts` (formas ya escritas de las 4 entidades)
- `components/entities/tutores/{TutorForm,TutorTable}.tsx`, `app/(dashboard)/tutores/*`
  (patrón de referencia: entidad independiente, lista + alta/edición en páginas separadas)
- `components/legajos/tabs/IncidentesTab.tsx` (patrón de referencia: tab con Dialog+Form
  para alta, lista de solo lectura debajo)
- `hooks/tutores/*.ts` (patrón de mutación: `useMutation` + `createClient()` +
  `queryKeys.*` + `invalidateQueries`)
- `hooks/usuarios/useUsuarios.ts` (existe, se reusa para el selector de "usuario" en
  `vinculos_tutela` cuando `tipo = 'tutela_residencia'`)
- `lib/validations/turnos.schema.ts` (patrón de `.refine` para validación cruzada/de fecha)
- `context/AuthContext.tsx` (expone `role`, pero **no** `usuarios.id` — hace falta
  resolverlo aparte para `created_by`/`consultado_por`, ver Requisitos)
- `app/(dashboard)/layout.tsx` (`NAV_ALL`, ícono de sidebar)
- `app/(dashboard)/legajos/[id]/page.tsx` (array `TABS`, patrón de `TabsTrigger` +
  `TabBadge`, ya usa `nnyaId` para Intervenciones/Alertas)
- `lib/constants/queryKeys.ts` (sin entradas para estas 4 tablas todavía)
- Grep de `created_by`/`reportado_por` en `hooks/`: ningún hook existente los setea hoy
  (siempre son nullable en las 17 tablas viejas) — es la primera vez que un `created_by`
  `NOT NULL` necesita resolverse desde la app.

## Skills utilizadas

- `crud-generator.skill.md` (patrón Form/List por entidad)
- `role-permission.skill.md` (matriz Admin/Equipo Tecnico, aplicada por tabla según A2)
- `domain-validation.skill.md`

## Decisiones de diseño

1. **Resolver `created_by`/`consultado_por`**: ningún hook existente lo hace porque en las
   17 tablas viejas esas columnas son nullable. Acá son `NOT NULL`. Se agrega un helper
   chico y reusado en los 4 puntos de alta:
   `lib/supabase/currentUsuario.ts` → `getCurrentUsuarioId(supabase): Promise<string>`,
   que hace `auth.getUser()` + `SELECT id FROM usuarios WHERE auth_user_id = ...`. Se
   reusa en las 4 mutaciones de alta (no se duplica el query 4 veces).
2. **`ReferenteForm`**: campo `dni` deshabilitado en modo edición salvo `role === 'Admin'`
   (refleja el trigger `fn_proteger_dni_referente` — si Equipo Tecnico lo edita igual, el
   `UPDATE` es rechazado por la base; deshabilitarlo en UI evita ese error confuso). Campo
   `activo` como checkbox (hoy no hay ningún toggle de baja para `referentes` porque RLS no
   permite `DELETE` — `activo=false` es la única forma de dar de baja).
3. **`VinculoTutelaForm`**: campo condicional según `tipo` —
   `tipo='tutela_residencia'` → selector de `usuario_id` (`useUsuarios()`);
   `tipo IN ('revinculacion_familiar','referente_afectivo')` → selector de `referente_id`
   (`useReferentes()`, filtrado a `activo=true`). Válida en el cliente con `.refine` los
   mismos 3 `CHECK` que ya impone la base (exclusividad, requerido según tipo, fechas) —
   la base sigue siendo la fuente de verdad, esto es solo para no depender de un error SQL
   crudo en la UI. Solo visible/editable para `Admin` (`AccessGuard roles={['Admin']}`),
   igual que dice la política RLS `vinculos_tutela_insert_admin`/`_update_admin` — Equipo
   Tecnico ve la tab (SELECT permitido) pero no ve el botón de alta/edición.
4. **Error de "vínculo vigente duplicado"**: si el `INSERT`/`UPDATE` viola
   `uq_vinculo_vigente_por_nnya`, se mapea a un mensaje explícito ("Ya hay un vínculo
   vigente para este NNyA — finalizá o revocá el actual antes de crear uno nuevo"), mismo
   patrón que `mapCierreError` en `hooks/legajos/useUpdateLegajo.ts`.
5. **`TransferenciaAuhForm`**: no es una lista — `UNIQUE(nnya_id, vinculo_id)` implica como
   mucho una fila por vínculo. Se muestra como una card dentro del vínculo `vigente` en la
   `TutelaTab` (si no existe, botón "Iniciar transferencia AUH"; si existe, form de edición
   inline). Solo Admin puede crear/editar (RLS).
6. **`ValidarRenaperForm`**: dialog abierto desde una acción por fila en `ReferenteTable`.
   Campos: `momento` (select), `dni_consultado` (prellenado con `referente.dni`, editable),
   `estado_dni` (select), `tiene_antecedentes` (checkbox opcional), `resultado` (select).
   Visible para Admin y Equipo Tecnico (RLS `validaciones_renaper_insert_admin_tecnico`).
   Se agrega un badge/columna en `ReferenteTable` con la fecha de la última validación (si
   existe), vía un hook `useUltimaValidacionRenaper(referenteId)` — no se construye una
   vista de historial completo en este prompt (no lo pidió el alcance de FASE B; se puede
   agregar después si hace falta).

## Archivos a crear

**Validaciones:**
- `lib/validations/referentes.schema.ts`
- `lib/validations/vinculos-tutela.schema.ts`
- `lib/validations/validaciones-renaper.schema.ts`
- `lib/validations/transferencia-auh.schema.ts`

**Helper:**
- `lib/supabase/currentUsuario.ts`

**Hooks:**
- `hooks/referentes/useReferentes.ts`, `useCreateReferente.ts`, `useUpdateReferente.ts`,
  `useUltimaValidacionRenaper.ts`, `useCreateValidacionRenaper.ts`
- `hooks/vinculos-tutela/useVinculosTutelaByNnya.ts`, `useCreateVinculoTutela.ts`,
  `useUpdateVinculoTutela.ts`
- `hooks/transferencia-auh/useTransferenciaAuhByVinculo.ts`, `useCreateTransferenciaAuh.ts`,
  `useUpdateTransferenciaAuh.ts`

**Componentes:**
- `components/entities/referentes/ReferenteForm.tsx`, `ReferenteTable.tsx`,
  `ValidarRenaperForm.tsx`
- `components/entities/vinculos-tutela/VinculoTutelaForm.tsx`, `VinculoTutelaList.tsx`
- `components/entities/transferencia-auh/TransferenciaAuhForm.tsx`
- `components/legajos/tabs/TutelaTab.tsx`

**Páginas:**
- `app/(dashboard)/referentes/page.tsx`
- `app/(dashboard)/referentes/nuevo/page.tsx`
- `app/(dashboard)/referentes/[id]/editar/page.tsx`

## Archivos a modificar

- `lib/constants/queryKeys.ts`: agregar factories `referentes`, `vinculosTutela`
  (`byNnya`), `validacionesRenaper` (`ultimaByReferente`), `transferenciaAuh`
  (`byVinculo`).
- `app/(dashboard)/layout.tsx`: agregar `{ href: '/referentes', label: 'Referentes', icon:
  Contact2 }` a `NAV_ALL` (visible para ambos roles, como Tutores).
- `app/(dashboard)/legajos/[id]/page.tsx`: agregar `'tutela'` a `TABS`, trigger con ícono
  (`Shield` o similar) entre "Resumen" e "Incidentes", `<TabsContent value="tutela">` con
  `<TutelaTab nnyaId={nnyaId} legajoActivo={legajoActivo} />`.

## Requisitos

- Todas las mutaciones de alta (`referentes`, `vinculos_tutela`, `validaciones_renaper`,
  `transferencia_auh`) resuelven `created_by`/`consultado_por` vía
  `getCurrentUsuarioId()` — nunca se deja que la base falle por `NOT NULL` sin valor.
- `VinculoTutelaForm` y `TransferenciaAuhForm` quedan detrás de
  `AccessGuard roles={['Admin']}` para alta/edición (coincide con RLS); `ReferenteForm` y
  `ValidarRenaperForm` quedan detrás de `AccessGuard roles={['Admin', 'Equipo Tecnico']}`.
- `ReferenteTable` no tiene acción de eliminar (no hay política `DELETE` en RLS) — solo
  Ver/Editar, y el checkbox `activo` en el form es la única baja posible.
- Todos los errores de constraint (unique de vínculo vigente, trigger de `dni`, CHECKs de
  `vinculos_tutela`) se mapean a mensajes en español legibles, no se muestra el error crudo
  de Postgres.

## Seguridad

- Ningún cambio de RLS — se consume la matriz ya aplicada en `prompts/013`.
- `validaciones_renaper.dni_consultado` y `referentes.dni` son texto plano (deuda
  documentada, issue #11/#dni) — no se agrega cifrado nuevo acá, fuera de alcance.
- `respuesta_cruda` (JSONB) no se expone en ningún form ni listado — coherente con la nota
  de seguridad de `prompts/012`.

## Criterios de aceptación

- `/referentes`: listar, crear, editar (Admin y Equipo Tecnico); `dni` no editable si el
  usuario logueado no es Admin; sin acción de eliminar.
- Desde `/referentes`, "Validar RENAPER" crea una fila en `validaciones_renaper` con
  `consultado_por` correcto; la tabla muestra la fecha de la última validación.
- `legajos/[id]` → tab "Tutela": Equipo Tecnico ve el historial de vínculos pero no el
  botón de alta; Admin puede crear un vínculo nuevo.
- Crear un segundo vínculo `vigente` para el mismo NNyA mientras ya hay uno →
  rechazado con mensaje claro (no error crudo de Postgres).
- Dentro del vínculo vigente, Admin puede iniciar/editar la transferencia AUH asociada.
- `npx tsc --noEmit` sin errores nuevos.

## Chequeos

- `npm run lint`
- `npm run build`
- `npx tsc --noEmit`
- Verificación manual (abajo) con el usuario Admin real (`admin@arguelloinfancias.com`) —
  no hay ningún usuario Equipo Tecnico real todavía (ver issue #3 ya resuelto: los 6 legacy
  se borraron). Para probar el camino Equipo Tecnico va a hacer falta crear un usuario real
  con ese rol primero (fuera de este prompt) o simular el flip de rol como hizo
  `prompts/013`.

## Verificación manual

1. `/referentes` → crear un referente, confirmar que aparece en la lista.
2. Editar ese referente como Admin → cambiar `dni` → confirmar que persiste.
3. "Validar RENAPER" sobre ese referente → confirmar que la fecha de última validación se
   actualiza en la tabla.
4. `/legajos/[id]` de un NNyA sin vínculo → tab "Tutela" → crear un vínculo
   `revinculacion_familiar` apuntando al referente creado → confirmar que queda `vigente`.
5. Intentar crear un segundo vínculo `vigente` para el mismo NNyA → confirmar el mensaje de
   error (no un error crudo).
6. Dentro del vínculo vigente → "Iniciar transferencia AUH" → completar y guardar →
   confirmar que persiste y se puede reabrir para editar.

---

**Estado**: implementado y verificado manualmente end-to-end (Admin real,
`admin@arguelloinfancias.com`), siguiendo los 6 pasos de "Verificación manual" arriba.

## Verificación post-implementación — 2 bugs reales encontrados y corregidos

1. **`DialogContent` (`components/ui/dialog.tsx`) sin límite de altura ni scroll interno.**
   El formulario de `VinculoTutelaForm` (8 campos + 3 textareas) es más alto que el
   viewport; sin `max-h`/`overflow-y-auto`, el contenido se cortaba y el botón "Crear
   vínculo" quedaba inalcanzable (Radix bloquea el scroll del `body` mientras el diálogo
   está abierto). Se agregó `max-h-[90vh] overflow-y-auto` al `DialogContent` compartido —
   arregla este formulario y de paso cualquier otro diálogo largo en el resto de la app
   (nadie lo había notado porque ningún formulario existente era tan largo).
2. **Embed ambiguo en `useVinculosTutelaByNnya`**: el `select('*, usuario:usuarios(...)')`
   devolvía `300 Multiple Choices` de PostgREST, porque `vinculos_tutela` tiene dos FKs
   hacia `usuarios` (`usuario_id` y `created_by`) y PostgREST no puede elegir cuál usar sin
   que se lo indiquemos. Se corrigió especificando el FK exacto:
   `usuario:usuarios!vinculos_tutela_usuario_id_fkey(id, nombre, apellido)`. Sin este fix,
   la lista de vínculos quedaba siempre vacía en la UI aunque el `INSERT` funcionara bien
   (el error quedaba silencioso, solo visible en Network — se encontró al probar en
   navegador, no por revisión de código).

Probado con datos reales: referente creado, DNI editado como Admin, validación RENAPER
registrada (badge + fecha actualizados), vínculo `referente_afectivo` creado como
`vigente`, segundo vínculo vigente rechazado con el mensaje mapeado (no error crudo),
transferencia AUH iniciada y persistida con `created_by` correcto, edición de vínculo
existente precarga todos los campos.

**No probado en vivo** (sin usuario Equipo Tecnico real disponible, ver nota en
"Chequeos"): que el botón "Nuevo vínculo" y el form de AUH queden ocultos para ese rol.
Verificado por código (`AccessGuard roles={['Admin']}`), no por sesión real.
