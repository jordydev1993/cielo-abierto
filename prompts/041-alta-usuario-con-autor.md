# 041 — Alta de usuarios con autor en el audit log

**Tarjeta:** sin tarjeta (hallazgo del 12/10 al verificar prompts/040) — Jordy — Media
**Estado:** aprobado por Jordy el 12/10.

## Objetivo

Que el alta de un usuario quede en `audit_log` con el `usuario_id` del Admin que la hizo, como cualquier otro cambio hecho desde la web.

## Contexto

Verificado el 12/10/2026 (código de `master` y producción, solo lectura):

- `fn_audit_trigger()` busca el autor con `auth.uid()`: `SELECT id FROM usuarios WHERE auth_user_id = auth.uid()`.
- `app/api/usuarios/route.ts` comprueba que quien llama es Admin con la sesión, pero después inserta la fila en `usuarios` con el cliente de `SUPABASE_SERVICE_ROLE_KEY`. Esa conexión no tiene usuario, así que `auth.uid()` es `NULL` y la fila del log queda sin autor.
- En producción hay 2 altas así: el 07/10 y el 12/10.
- La política `usuarios_admin_all` (`FOR ALL TO authenticated`, `get_my_role() = 'Admin'`) ya permite que un Admin inserte en `usuarios` con su propia sesión. La clave de servicio no hace falta para ese INSERT.
- La clave de servicio sí hace falta para `auth.admin.createUser` y `auth.admin.deleteUser`, que no se pueden llamar con la sesión.
- Es la única ruta de la app que escribe en una tabla auditada con la clave de servicio. `app/api/reportes/senaf/route.ts` usa la sesión. Las otras filas sin autor del log (5, del 15/09, 16/09 y 04/10) tienen un mismo instante por grupo: son cambios de migraciones o del SQL Editor, no de la app.

## Cambio propuesto

En `app/api/usuarios/route.ts`, hacer el `insert` en `usuarios` con `supabaseServer` (la sesión del Admin) en lugar de `supabaseAdmin`. Nada más cambia:

- `auth.admin.createUser` y, si el insert falla, `auth.admin.deleteUser` siguen con `supabaseAdmin`.
- Las validaciones, los mensajes y las respuestas quedan iguales.

Sin migraciones. RLS no cambia: el insert ya lo permite `usuarios_admin_all`, y si alguien llegara sin ser Admin lo frena tanto la ruta (403) como la política.

## Fuera de alcance

- Completar el autor de las 2 altas viejas: `audit_log` no se puede editar (prompts/040) y no corresponde reescribir el log.
- Auditar las cuentas de `auth.users` (están fuera de `public`). La fila de `usuarios` alcanza para saber quién dio el alta.
- Las filas sin autor que generan las migraciones y el SQL Editor: es esperable, no hay sesión.

## Criterios de aceptación

1. Un Admin crea un usuario desde la web: la fila nueva de `audit_log` (`tabla = 'usuarios'`, `operacion = 'INSERT'`) tiene `usuario_id` igual al `id` de ese Admin.
2. Crear un usuario con un email repetido sigue mostrando el mensaje de U-EX-01 y no deja una cuenta suelta en `auth.users`.
3. Un usuario de Equipo Técnico que llama a `POST /api/usuarios` sigue recibiendo 403.
4. `npm run lint` y `npm run build` sin errores nuevos.

## Verificación

- Criterios 1 a 3: en la web desplegada (vista previa del PR) con un Admin y un usuario de Equipo Técnico. El 1, además, por SQL de solo lectura.
- Criterio 4: local.
