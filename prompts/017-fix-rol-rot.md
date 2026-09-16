# 017 — Fix rol rot: consolidar usuarios semilla a Admin/Equipo Tecnico

**Tarjeta:** [#3](https://github.com/jordydev1993/cielo-abierto/issues/3) — Jordy — Alta

## Objetivo

Eliminar el "rol rot" en `roles`/`usuarios`: hoy la tabla `roles` tiene 7 filas en vez
de las 2 documentadas (`Admin`, `Equipo Tecnico`), y 6 de los 7 usuarios semilla apuntan
a esos roles legacy sin tener `auth_user_id`. Si a cualquiera de esos 6 se le da login,
`get_my_role()` devuelve un nombre de rol (`'Trabajador Social'`, `'Médico/a'`, etc.) que
ninguna política RLS reconoce → esos usuarios quedan bloqueados de las 28 tablas al
primer login.

## Contexto

Confirmado por query directa a la base en vivo (Supabase MCP, `execute_sql`), no solo
por migraciones:

**`roles` (7 filas, todas `activo = true`):**

| nombre | uso |
|---|---|
| `Admin` | válido, `AppRole` |
| `Equipo Tecnico` | válido, `AppRole` |
| `Abogado/a` | legacy |
| `Administrador` | legacy |
| `Médico/a` | legacy |
| `Psicólogo/a` | legacy |
| `Trabajador Social` | legacy |

**`usuarios` (7 filas):**

| usuario | rol actual | `auth_user_id` |
|---|---|---|
| Jordy Admin | `Admin` | ✅ tiene |
| María González | `Administrador` | ❌ NULL |
| Carlos Rodríguez | `Trabajador Social` | ❌ NULL |
| Ana Fernández | `Psicólogo/a` | ❌ NULL |
| Diego Martínez | `Médico/a` | ❌ NULL |
| Lucía Pérez | `Abogado/a` | ❌ NULL |
| Sofía Torres | `Trabajador Social` | ❌ NULL |

Solo Jordy Admin tiene login habilitado hoy; los otros 6 son datos de semilla sin
`auth.users` asociado, por eso el bug no se manifestó todavía.

Hay precedente directo: `supabase/migrations/20260522000027_remove_educador_role.sql`
hizo exactamente esto para el rol `Educador` — reasignó sus usuarios a `Equipo Tecnico`
y borró el rol. Esta tarea es la misma operación para los 5 roles legacy restantes.

## Archivos inspeccionados

- `supabase/migrations/20260620000031_clean_schema.sql` (schema vigente de `roles`/
  `usuarios`, `get_my_role()`, RLS de ambas tablas)
- `supabase/migrations/20260514000001_roles.sql`, `20260518000022_complete_roles_schema.sql`
- `supabase/migrations/20260519000026_fix_get_my_role_rls_bypass.sql` (versión activa de
  `get_my_role()`, mapea solo `'Direccion' → 'Admin'`, todo lo demás pasa literal)
- `supabase/migrations/20260522000027_remove_educador_role.sql` (precedente)
- `context/AuthContext.tsx` (`export type AppRole = 'Admin' | 'Equipo Tecnico'` — el
  código de aplicación solo reconoce estos dos valores)
- `components/entities/usuarios/UsuarioForm.tsx` (el dropdown de rol lista **todas** las
  filas de `roles` sin filtrar — hoy se puede asignar un rol legacy a un usuario nuevo)
- `hooks/roles/useRoles.ts`, `lib/validations/usuarios.schema.ts`
- Query en vivo a `roles` y `usuarios` vía `mcp__supabase__execute_sql`
- Grep de `Abogado|Psicólogo|Médico/a|Trabajador Social|Administrador` en `*.{ts,tsx}` →
  0 resultados: ningún componente depende de estos nombres, es deuda de datos pura.

## Skills utilizadas

- `role-permission.skill.md` (matriz de permisos, confirma que el modelo vigente es
  únicamente `Admin` / `Equipo Tecnico`)

## Decisión (confirmada por Jordy)

Los 6 usuarios legacy son datos de prueba, no personas reales con cargo pendiente de
mapear. Decisión: **borrarlos**, no reasignarlos. El único usuario real que queda es
`admin@arguelloinfancias.com` (Jordy Admin), con rol `Admin`. Los únicos roles que deben
existir en el sistema son `Admin` y `Equipo Tecnico`.

Verificado antes de borrar: ninguna tabla con FK `RESTRICT` hacia `usuarios(id)`
(`evaluacion_institucional.created_by`, `evaluacion_institucional_asistentes.usuario_id`,
`referentes.created_by`, `vinculos_tutela.usuario_id/created_by`,
`validaciones_renaper.consultado_por`, `transferencia_auh.created_by`,
`turnos_personal.usuario_id`) tiene filas que referencien a estos 6 usuarios — el borrado
no puede fallar por constraint (confirmado con query en vivo, todos los conteos en 0).

## Archivos a crear/modificar

1. **Nueva migración** `supabase/migrations/20260915181604_fix_rol_rot.sql`:
   - `DELETE FROM usuarios WHERE auth_user_id IS NULL;` (los 6 usuarios de prueba sin
     login; el único usuario real, Jordy Admin, tiene `auth_user_id` seteado y no se toca).
   - `DELETE FROM roles WHERE nombre NOT IN ('Admin', 'Equipo Tecnico');`
   - Comentario explicando el motivo (mismo patrón que la migración de `Educador`).
2. **`AGENTS-WEB.md`**: mover el ítem `rol-rot` de "Deuda conocida" a "Resuelto", con
   referencia a este prompt y la migración.
3. Sin cambios de código de aplicación necesarios: `UsuarioForm.tsx` ya lista lo que
   haya en `roles`, y una vez limpia la tabla solo mostrará `Admin`/`Equipo Tecnico`.

## Requisitos

- No tocar a Jordy Admin (`auth_user_id` no nulo) ni el rol `Admin`/`Equipo Tecnico`.
- La migración debe ser idempotente (condición por `auth_user_id IS NULL` / nombre de
  rol, no IDs hardcodeados).
- Borrar primero `usuarios`, después `roles` (los usuarios legacy referencian esos roles
  por `rol_id`, así que el orden evita cualquier problema de FK).

## Seguridad

- Se eliminan usuarios de prueba sin `auth_user_id`: no hay cuentas de `auth.users`
  asociadas, por lo que no queda ninguna sesión ni credencial huérfana.
- No se exponen ni loguean datos sensibles de NNyA; esta migración solo toca `roles` y
  `usuarios`.

## Criterios de aceptación

- `SELECT nombre FROM roles` devuelve exactamente `Admin`, `Equipo Tecnico`.
- `SELECT count(*) FROM usuarios` devuelve `1` (solo Jordy Admin).
- `get_my_role()` sigue devolviendo `'Admin'` para Jordy Admin sin cambios.
- El dropdown de rol en `UsuarioForm.tsx` (crear/editar usuario) muestra solo `Admin` y
  `Equipo Tecnico`.
- La tabla de usuarios (`/usuarios`) muestra solo a Jordy Admin.

## Chequeos

- `npm run lint`
- `npm run build`
- (no hay cambios de tipos, no se necesita `tsc --noEmit` aparte del build)

## Verificación manual

1. Como Admin, ir a `/usuarios` → confirmar que la tabla muestra solo a Jordy Admin.
2. Ir a `/usuarios` → crear un usuario nuevo → confirmar que el dropdown de "Rol" solo
   lista `Admin` y `Equipo Tecnico`.
3. Query de control en Supabase: `SELECT nombre FROM roles;` → debe devolver solo 2 filas;
   `SELECT count(*) FROM usuarios;` → debe devolver `1`.
