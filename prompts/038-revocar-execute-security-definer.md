# 038 — Funciones `SECURITY DEFINER` expuestas por la API: quitar `EXECUTE`

**Tarjeta:** sin tarjeta (pendiente del panel: "Seguridad (linter de Supabase, 10/10)") — Jordy — Alta
**Estado:** borrador, esperando aprobación de Jordy.

## Objetivo

Que ninguna función `SECURITY DEFINER` se pueda llamar por `/rest/v1/rpc` sin iniciar sesión, y que las funciones de trigger no se puedan llamar por RPC en absoluto. De paso, fijar el `search_path` de las 2 funciones que no lo tienen.

## Contexto

Verificado en producción el 10/10/2026 (solo lectura: `get_advisors`, `pg_proc`, `aclexplode`, `pg_policies`):

| Función | Tipo | `EXECUTE` hoy | Uso |
|---------|------|---------------|-----|
| `fn_audit_trigger()` | trigger | PUBLIC, anon, authenticated, postgres, service_role | Trigger de auditoría |
| `fn_crear_alerta_incidente_grave()` | trigger, **sin `search_path`** | ídem | `trg_alerta_incidente_grave` |
| `fn_crear_seguimiento_post_egreso()` | trigger | ídem | Seguimientos a 30 y 60 días |
| `fn_reportes_senaf_bloquear_aprobado()` | trigger | ídem | Informe SENAF aprobado es inmutable |
| `get_my_role()` | `text` | ídem | 56 políticas RLS (todas `TO authenticated`), `fn_proteger_dni_referente`, `app/api/usuarios` y `app/api/reportes/senaf` |

Además, `fn_proteger_dni_referente()` (`SECURITY INVOKER`) no tiene `search_path` fijo (advisor 0011).

Riesgo actual: bajo pero real. Las funciones de trigger fallan si se llaman por RPC ("trigger functions can only be called as triggers"), pero exponerlas no tiene ningún uso. `get_my_role` sin sesión devuelve `NULL`; no filtra datos, pero no tiene por qué estar abierta a `anon`.

## Cambio propuesto

Migración `20261010235900_revocar_execute_security_definer.sql`:

1. `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` en las 4 funciones de trigger. Postgres solo exige `EXECUTE` para **crear** un trigger, no para dispararlo: los triggers siguen funcionando para cualquier rol que haga el INSERT/UPDATE.
2. `REVOKE EXECUTE ON get_my_role() FROM PUBLIC, anon` y `GRANT ... TO authenticated` (explícito, para que no dependa de `PUBLIC`).
3. `ALTER FUNCTION ... SET search_path = public` en `fn_crear_alerta_incidente_grave` y `fn_proteger_dni_referente`.

`postgres` y `service_role` conservan sus permisos explícitos. No cambia ninguna política ni el código de la app.

## Supuestos

1. Nadie usa la API sin sesión para algo que dependa de `get_my_role` (verificado: las 56 políticas que la usan son `TO authenticated`; la única política `TO public` es una de `audit_log` y no la usa).
2. La app mobile no llama a `get_my_role` (búsqueda en `arguello-infancias-mobile/src`: sin usos).

## Fuera de alcance

- `get_my_role` seguirá apareciendo en el advisor 0029 (authenticated): es intencional, las políticas la necesitan.
- Los privilegios por defecto de Supabase dan `EXECUTE` a `anon` en cada función nueva de `public`. Cambiarlos (`ALTER DEFAULT PRIVILEGES`) es una decisión aparte; por ahora, cada migración que cree una función `SECURITY DEFINER` debe hacer su `REVOKE`.

## Criterios de aceptación

1. `has_function_privilege('anon', f, 'EXECUTE')` es `false` para las 5 funciones.
2. `has_function_privilege('authenticated', f, 'EXECUTE')` es `false` para las 4 de trigger y `true` para `get_my_role`.
3. `service_role` conserva `EXECUTE` en las 5.
4. Los triggers siguen funcionando: crear un incidente grave como usuario `Equipo Tecnico` genera su alerta y su fila en `audit_log`.
5. Login, listado de usuarios (Admin) e informe SENAF siguen andando.
6. `get_advisors` de seguridad: desaparecen los avisos 0028 (5) y 0011 (2); en 0029 queda solo `get_my_role`.

## Verificación

- Criterios 1 a 3 y 6: consultas de solo lectura después de aplicar.
- Criterios 4 y 5: en la app desplegada, con un usuario de cada rol.
- No hay cambios de código: no aplica lint ni build.
