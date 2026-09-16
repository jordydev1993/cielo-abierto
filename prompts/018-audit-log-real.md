# 018 — Audit log real: `fn_audit_trigger()` + `trg_audit_*` en las 27 tablas

**Tarjeta:** [#2](https://github.com/jordydev1993/cielo-abierto/issues/2) — Jordy — Alta
(desbloqueada: resuelve la decisión A/B/C pendiente de `prompts/012`)

## Objetivo

Cablear de verdad el audit log que `AGENTS-WEB.md` § Seguridad admite que no existe hoy:
0 triggers `trg_audit_*` en `pg_trigger`, 0 filas en `audit_log`, y ninguna función
`fn_audit_trigger()` en `pg_proc`. Crear la función y aplicarla a las 27 tablas de negocio
(todas menos `audit_log` misma), registrando cada INSERT/UPDATE/DELETE.

## Contexto

`prompts/012` (FASE A1) encontró este gap al crear las 10 tablas nuevas y dejó 3 opciones
sin resolver, documentadas ahí mismo:

- Opción A: no auditar nada (aplicada por defecto en A1/A2 al no haber respuesta).
- Opción B: auditar solo las 10 tablas nuevas.
- Opción C: auditar las 27 tablas (10 nuevas + 16 originales, todo menos `audit_log`).

**Decisión de Jordy: Opción C** — las 27 tablas.

La migración vieja que sí creaba esto (`20260514000018_audit_log.sql`) quedó completamente
superseded por `20260620000031_clean_schema.sql`, que crea la tabla `audit_log` pero nunca
la función ni los triggers. Además el schema de `audit_log` cambió entre ambas
migraciones — no se puede reusar el código viejo tal cual:

| columna | migración vieja (`018`, superseded) | schema real (`clean_schema.sql`) |
|---|---|---|
| PK | `id BIGSERIAL` | `id UUID DEFAULT gen_random_uuid()` |
| id del registro auditado | `id_registro TEXT` | `registro_id UUID` |
| quién | `auth_uid UUID` (= `auth.uid()` directo) | `usuario_id UUID REFERENCES usuarios(id)` |
| cuándo | `fecha` | `created_at` |

El cambio de `auth_uid`→`usuario_id` importa: `usuario_id` referencia `usuarios(id)`, no
`auth.users(id)` — la función tiene que resolver `auth.uid()` a `usuarios.id` vía
`auth_user_id`, no guardarlo directo.

## Archivos inspeccionados

- `supabase/migrations/20260620000031_clean_schema.sql` (schema real de `audit_log`,
  política `audit_log_admin_read`; confirmado que no hay política de INSERT ni de
  UPDATE/DELETE — por eso hoy queda inmutable por diseño, solo falta permitir el INSERT
  del propio trigger)
- `supabase/migrations/20260514000018_audit_log.sql` (versión superseded, referencia de
  qué forma tenía el patrón viejo — no reutilizable tal cual por el cambio de columnas)
- `supabase/migrations/20260518000024_audit_log_policies.sql` (precedente de política
  `audit_log_system_insert ... WITH CHECK (true)`)
- `prompts/012-tutela-evaluacion-turnos-seguimiento.md` sección (b) (decisión A/B/C
  original)
- `mcp__supabase__list_tables` en vivo: confirmadas 28 tablas en `public`, todas con
  columna `id UUID PRIMARY KEY` (verificado puntualmente en `novedades`, y por
  construcción en el resto vía `clean_schema.sql`/`prompts/012`/`prompts/015`) — 27 de
  ellas son el objetivo de auditoría (todas menos `audit_log`).

## Skills utilizadas

- `database-design.skill.md`

## Diseño

`fn_audit_trigger()` — `SECURITY DEFINER`, resuelve `usuario_id` desde `auth.uid()`,
inserta en `audit_log` con las columnas reales:

```sql
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id UUID;
BEGIN
  SELECT id INTO v_usuario_id FROM usuarios WHERE auth_user_id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tabla, operacion, registro_id, usuario_id, datos_despues)
    VALUES (TG_TABLE_NAME, 'INSERT', NEW.id, v_usuario_id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tabla, operacion, registro_id, usuario_id, datos_antes, datos_despues)
    VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id, v_usuario_id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (tabla, operacion, registro_id, usuario_id, datos_antes)
    VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, v_usuario_id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
```

Trigger aplicado por loop `DO $$ ... FOREACH t IN ARRAY [...] ... $$` (mismo patrón que la
migración superseded) a las 27 tablas:

`roles`, `usuarios`, `nnya`, `tutores`, `nnya_tutores`, `legajos`, `intervenciones`,
`turnos`, `alertas`, `actividades`, `incidentes`, `diagnosticos`, `medicamentos`,
`informes`, `documentos`, `audiencias_judiciales`, `referentes`, `vinculos_tutela`,
`validaciones_renaper`, `transferencia_auh`, `evaluacion_institucional`,
`evaluacion_institucional_asistentes`, `evaluacion_institucional_casos`,
`propuestas_mejora`, `turnos_personal`, `seguimiento_post_egreso`, `novedades`.

Se agrega la política que falta para permitir el INSERT del trigger (hoy `audit_log` solo
tiene `audit_log_admin_read`, ninguna de INSERT):

```sql
CREATE POLICY "audit_log_system_insert" ON audit_log
  FOR INSERT
  WITH CHECK (true);
```

No se agregan políticas de UPDATE/DELETE sobre `audit_log` — sin política, RLS las
deniega por defecto a todos los roles. Eso es lo que hace al log inmutable, tal como
`AGENTS-WEB.md` afirma que debería ser.

## Supuestos

- `usuario_id` queda `NULL` si la operación corre sin sesión autenticada resuelta en
  `usuarios` (p. ej. `service_role` desde `app/api/usuarios`) — la columna ya es nullable
  en `clean_schema.sql`, no hace falta cambiarla.
- No se audita `audit_log` a sí misma (evita ruido sin sentido; además rompería la
  inmutabilidad si un trigger pudiera escribir sobre sus propias filas).
- No se toca ninguna política RLS existente de las 27 tablas — el trigger es adicional,
  no reemplaza nada.
- `to_jsonb(NEW)`/`to_jsonb(OLD)` va a incluir campos sensibles (DNI, nombres, datos de
  salud) dentro de `audit_log.datos_antes`/`datos_despues` — es inherente a un audit log
  real y ya está limitado por RLS a solo lectura de `Admin` (`audit_log_admin_read`, sin
  cambios). Ver nota de Seguridad.

## Requisitos

- Todas las 27 tablas deben quedar con exactamente un trigger `trg_audit_<tabla>`.
- La función debe ser `SECURITY DEFINER` para poder insertar en `audit_log` sin depender
  del rol del usuario que dispara la operación.
- Idempotente: `CREATE OR REPLACE FUNCTION` + `CREATE OR REPLACE TRIGGER` (Postgres 14+
  soporta `CREATE OR REPLACE TRIGGER`; si la versión de Supabase no lo soporta, usar
  `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER` dentro del loop).

## Seguridad

- El log queda de solo lectura para `Admin` (política existente, sin cambios) e insertable
  únicamnete por el propio trigger (`SECURITY DEFINER` + política `WITH CHECK (true)`
  acotada a `FOR INSERT`). Ningún rol puede `UPDATE`/`DELETE` filas de `audit_log` (sin
  política = denegado): esto es lo que hace el log inmutable en la práctica.
- `audit_log` va a acumular datos sensibles de NNyA dentro del JSONB de cada fila
  auditada — es el costo inherente de un audit log completo. No cambia el perímetro de
  acceso: sigue siendo Admin-only para lectura, igual que hoy.
- No se toca `SUPABASE_SERVICE_ROLE_KEY` ni ningún endpoint.

## Criterios de aceptación

- `SELECT count(*) FROM pg_proc WHERE proname = 'fn_audit_trigger'` → `1`.
- `SELECT count(*) FROM pg_trigger WHERE tgname LIKE 'trg_audit_%'` → `27`.
- `INSERT`/`UPDATE`/`DELETE` de prueba en `nnya` (o cualquier tabla de negocio) genera una
  fila nueva en `audit_log` con `tabla`, `operacion`, `registro_id`, `usuario_id` y
  `datos_antes`/`datos_despues` correctos.
- `usuario_id` en la fila de auditoría coincide con `usuarios.id` del usuario autenticado
  que hizo la operación (probado como Jordy Admin).
- Un `UPDATE`/`DELETE` directo sobre `audit_log` (como Admin o como `authenticated`) es
  rechazado por RLS.

## Chequeos

- Aplicada como `supabase/migrations/20260915182618_audit_log_real.sql` contra el
  proyecto conectado (`mcp__supabase__apply_migration`).
- Correr las queries de "Criterios de aceptación".
- `npm run lint`, `npm run build` (no se toca código de la app, pero se corren igual por
  el flujo estándar).
- No hace falta tocar `types/database.types.ts`: `audit_log` ya está tipado si existe un
  tipo `AuditLog`; si no existe, queda fuera de alcance de esta tarjeta (es la tarjeta
  #8, tipos generados).

## Verificación manual

1. Como Admin, crear/editar/eliminar un registro cualquiera (ej. un NNyA de prueba) desde
   la UI.
2. Confirmar en Supabase (`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 5;`) que
   aparecieron filas nuevas con `tabla = 'nnya'`, `operacion` correcta y `usuario_id`
   apuntando al usuario Admin logueado.
3. Repetir sobre una tabla de FASE A1 sin UI todavía (ej. insertar directo por SQL en
   `referentes`) y confirmar que también quedó registrada — prueba de que el trigger
   corre incluso sin pasar por la app.
