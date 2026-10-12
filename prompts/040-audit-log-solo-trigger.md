# 040 — `audit_log`: que solo escriba el trigger

**Tarjeta:** sin tarjeta (hallazgo del 11/10 al probar prompts/037 a 039) — Jordy — Alta
**Estado:** aprobado por Jordy el 12/10. Probado en la réplica local (PGlite, schema de producción): 56/56 casos, los 45 de prompts/037 a 039 y 11 de este plan. Aplicado en producción el 12/10 y verificado por SQL de solo lectura (criterio 5 y privilegios). Pendiente: criterio 4 en la app desplegada.

## Objetivo

Que nadie pueda insertar, modificar ni borrar filas de `audit_log` por la API. La única vía de escritura queda en `fn_audit_trigger()`, así el log refleja solo lo que pasó de verdad en las tablas de negocio.

## Contexto

Verificado en producción el 12/10/2026 (solo lectura: `pg_class`, `pg_proc`, `information_schema.role_table_grants`, `pg_policies`):

| Qué | Hoy |
|-----|-----|
| Dueño de `audit_log` y de `fn_audit_trigger()` | `postgres` |
| RLS | activo, **sin** `FORCE ROW LEVEL SECURITY` |
| Política `audit_log_system_insert` | `FOR INSERT TO public WITH CHECK (true)` |
| Política `audit_log_admin_read` | `FOR SELECT TO authenticated USING (get_my_role() = 'Admin')` |
| Privilegios de `anon` y `authenticated` | `SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` (los de Supabase por defecto) |
| Filas | 60, del 15/09 al 07/10 |

Es la única política de todo `public` y `storage` abierta a `public` o `anon`.

**El problema.** La política `TO public WITH CHECK (true)` más el `INSERT` de `anon` permiten insertar cualquier fila con la clave `anon`, que es pública: alcanza con un `POST /rest/v1/audit_log`. Se puede inventar un `DELETE` en `legajos` atribuido al Admin (`usuario_id` lo elige quien inserta). Reproducido el 11/10 en la réplica local (PGlite, schema extraído de producción): `anon` y un usuario de Equipo Técnico insertaron filas falsas sin error. Contradice `AGENTS.md` ("Solo Admin puede leerlo y nadie puede editarlo ni borrarlo") y la regla de oro 3 (auditoría de todo).

UPDATE y DELETE hoy los frena RLS (no hay política que los permita), y TRUNCATE no está expuesto por PostgREST; quitarlos es defensa en profundidad.

**Por qué la política no hace falta.** `fn_audit_trigger()` es `SECURITY DEFINER` y corre como `postgres`, que es dueño de la tabla. Sin `FORCE ROW LEVEL SECURITY`, el dueño no pasa por RLS ni necesita `GRANT`. La migración `20260518000024` creó la política "por si Supabase aplica FORCE RLS"; ese caso se cubre con una política limitada a `postgres`, no a `public`.

Nadie más escribe en `audit_log`: sin usos en `app/`, `hooks/`, `components/` ni `lib/` de la web, ni en la app mobile.

## Cambio propuesto

Migración `20261012000000_audit_log_solo_trigger.sql`:

```sql
-- La política vieja dejaba insertar a cualquiera (TO public, WITH CHECK true).
DROP POLICY IF EXISTS audit_log_system_insert ON public.audit_log;

-- Solo el dueño (postgres, el rol de fn_audit_trigger) inserta. Sin FORCE RLS no
-- hace falta; queda para que el trigger siga andando si algún día se activa.
CREATE POLICY audit_log_trigger_insert ON public.audit_log
  FOR INSERT TO postgres
  WITH CHECK (true);

-- anon no tiene nada que hacer con el log; authenticated solo lee (y RLS limita a Admin).
REVOKE ALL ON public.audit_log FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.audit_log FROM authenticated;
```

`service_role` conserva sus privilegios (lo usa solo el servidor). No cambia el código de la app ni `fn_audit_trigger()`.

## Supuestos

1. Ninguna ruta de la app escribe en `audit_log` con la sesión del usuario (verificado por búsqueda).
2. `audit_log` sigue siendo de `postgres` y sin FORCE RLS (verificado el 12/10).

## Fuera de alcance

- Los privilegios por defecto de Supabase (`ALTER DEFAULT PRIVILEGES`), que dan todo a `anon` en cada tabla nueva. Ya está anotado en prompts/038 como decisión aparte.
- La IP del cliente en el audit log (objetivo de `AGENTS.md`, sigue pendiente).
- Revisar las 60 filas existentes: el trigger las generó, y no hay forma de distinguir una fila falsa insertada antes del arreglo. Si hace falta, se puede cruzar cada fila con el estado actual de su tabla.

## Criterios de aceptación

1. `anon`: `INSERT` en `audit_log` falla con `permission denied`; `SELECT` también.
2. Equipo Técnico: `INSERT`, `UPDATE` y `DELETE` en `audit_log` fallan con `permission denied`; `SELECT` devuelve 0 filas.
3. Admin: `SELECT` devuelve el log; `INSERT` directo falla.
4. Los triggers siguen escribiendo: crear o editar un registro de negocio como Equipo Técnico genera su fila en `audit_log` con el `usuario_id` correcto.
5. En `pg_policies`, `audit_log` queda con `audit_log_admin_read` y `audit_log_trigger_insert` (`TO postgres`), y ninguna política `TO public`.

## Verificación

- Criterios 1 a 5: réplica local con PGlite (schema extraído de producción, mismo método que para 037 a 039), antes de tocar producción.
- Después de aplicar en producción (lo corre Jordy en el SQL Editor): criterio 5 y privilegios por consulta de solo lectura; criterio 4 en la app desplegada.
- No hay cambios de código: no aplica lint ni build.
