# Auditoría de Base de Datos — Argüello Infancias
**Versión:** Sprint 1 · Fecha: 24/05/2026  
**Objetivo:** Verificar que las políticas RLS funcionan correctamente y que no hay recursiones circulares activas.

---

## Cómo acceder

1. Abrí https://supabase.com → iniciá sesión → entrá al proyecto **cielo-abierto** (nombre real del proyecto en Supabase; no se renombró junto con el resto)
2. En el menú lateral hacé click en **SQL Editor**
3. Cada sección tiene queries listas para copiar y pegar

> **Importante:** Las queries de las secciones 1, 2 y 3 usan impersonación de usuario.
> Necesitás el UUID de cada tester. Obtené los UUIDs con esta query primero:

```sql
-- Paso previo: obtener UUIDs de los usuarios de prueba
SELECT id, email
FROM auth.users
WHERE email IN (
  'meli@cielo-abierto.test',
  'cami@cielo-abierto.test',
  'sofi@cielo-abierto.test'
);
```
[
  {
    "id": "f58ad2d2-5a4b-40d1-a3f6-fdc4dcd0f974",
    "email": "meli@cielo-abierto.test"
  },
  {
    "id": "931ffdb8-e4ae-4c6e-978e-3db67b62ddb3",
    "email": "sofi@cielo-abierto.test"
  },
  {
    "id": "0b99b0b0-0519-4692-a061-4ddec112fbde",
    "email": "cami@cielo-abierto.test"
  }
]

Anotá los tres UUIDs — los vas a necesitar en las secciones siguientes.

---

## Sección 0 — Verificación sin impersonación (como Admin de DB)

Estas queries corren como superusuario (postgres). No prueban RLS pero verifican que la función y los datos existen.

```sql
-- 0.1 Verificar que get_my_role() tiene SET row_security = off
-- Nota: information_schema solo muestra el cuerpo, no los atributos.
-- Usar pg_proc para ver proconfig que incluye row_security=off
SELECT proname, proconfig, prosecdef
FROM pg_proc
WHERE proname = 'get_my_role'
  AND pronamespace = 'public'::regnamespace;
-- Esperado: proconfig = '{row_security=off}' y prosecdef = true (SECURITY DEFINER)
```
[
  {
    "routine_name": "get_my_role",
    "routine_definition": "\nDECLARE\n  result TEXT;\nBEGIN\n  SELECT CASE r.nombre WHEN 'Direccion' THEN 'Admin' ELSE r.nombre END\n  INTO result\n  FROM usuarios u\n  JOIN roles r ON r.id = u.rol_id\n  WHERE u.auth_user_id = auth.uid()\n    AND u.activo = TRUE\n  LIMIT 1;\n  RETURN result;\nEND;\n"
  }
]

```sql
-- 0.2 Verificar que las tablas críticas tienen RLS habilitado
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('roles', 'usuarios', 'nnya', 'tutores', 'legajos', 'alertas', 'audit_log')
  AND relnamespace = 'public'::regnamespace
ORDER BY relname;
-- Esperado: relrowsecurity = true en todas
```
[
  {
    "relname": "alertas",
    "relrowsecurity": true
  },
  {
    "relname": "audit_log",
    "relrowsecurity": true
  },
  {
    "relname": "legajos",
    "relrowsecurity": true
  },
  {
    "relname": "nnya",
    "relrowsecurity": true
  },
  {
    "relname": "roles",
    "relrowsecurity": true
  },
  {
    "relname": "tutores",
    "relrowsecurity": true
  },
  {
    "relname": "usuarios",
    "relrowsecurity": true
  }
]

```sql
-- 0.3 Listar todas las políticas activas
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- Esperado: ver todas las políticas sin errores
```
[
  {
    "tablename": "actividades",
    "policyname": "actividades_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "alertas",
    "policyname": "alertas_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "audiencias_judiciales",
    "policyname": "audiencias_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "audit_log",
    "policyname": "audit_log_admin_read",
    "cmd": "SELECT",
    "qual": "(get_my_role() = 'Admin'::text)"
  },
  {
    "tablename": "audit_log",
    "policyname": "audit_log_system_insert",
    "cmd": "INSERT",
    "qual": null
  },
  {
    "tablename": "diagnosticos",
    "policyname": "diagnosticos_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "documentos",
    "policyname": "documentos_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "incidentes",
    "policyname": "incidentes_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "informes",
    "policyname": "informes_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "intervenciones",
    "policyname": "intervenciones_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "legajos",
    "policyname": "legajos_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "medicamentos",
    "policyname": "medicamentos_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "nnya",
    "policyname": "nnya_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "nnya_tutores",
    "policyname": "nnya_tutores_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "roles",
    "policyname": "roles_admin_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = 'Admin'::text)"
  },
  {
    "tablename": "roles",
    "policyname": "roles_select_all",
    "cmd": "SELECT",
    "qual": "true"
  },
  {
    "tablename": "turnos",
    "policyname": "turnos_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "tutores",
    "policyname": "tutores_admin_tecnico_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = ANY (ARRAY['Admin'::text, 'Equipo Tecnico'::text]))"
  },
  {
    "tablename": "usuarios",
    "policyname": "usuarios_admin_all",
    "cmd": "ALL",
    "qual": "(get_my_role() = 'Admin'::text)"
  },
  {
    "tablename": "usuarios",
    "policyname": "usuarios_self_read",
    "cmd": "SELECT",
    "qual": "(auth_user_id = auth.uid())"
  }
]

```sql
-- 0.4 Verificar que los usuarios de prueba existen en la tabla usuarios
SELECT u.id, u.nombre, u.apellido, r.nombre AS rol, u.activo
FROM usuarios u
JOIN roles r ON r.id = u.rol_id
WHERE u.activo = TRUE
ORDER BY r.nombre;
-- Esperado: Meli (Admin), Cami y Sofi (Equipo Tecnico)
-- Nota: pueden aparecer usuarios con rol 'Direccion' (se mapean a 'Admin' en get_my_role())
```
[
  {
    "id": "f58ad2d2-5a4b-40d1-a3f6-fdc4dcd0f974",
    "nombre": "Meli",
    "apellido": "Tester",
    "rol": "Admin",
    "activo": true
  },
  {
    "id": "0b599c14-b8d9-4ac5-a480-f9c32918b11c",
    "nombre": "Carlos",
    "apellido": "Garcia",
    "rol": "Direccion",
    "activo": true
  },
  {
    "id": "848fc0a5-3643-41dc-828e-ee85bab0154d",
    "nombre": "Roberto",
    "apellido": "Perez",
    "rol": "Direccion",
    "activo": true
  },
  {
    "id": "184060d8-8794-46a2-b552-53be5f3be1ed",
    "nombre": "Juan",
    "apellido": "Martinez",
    "rol": "Equipo Tecnico",
    "activo": true
  },
  {
    "id": "b9663d62-4576-4ed6-9f01-19400e355355",
    "nombre": "Lucas",
    "apellido": "Prueba",
    "rol": "Equipo Tecnico",
    "activo": true
  },
  {
    "id": "8d417511-b93d-4479-8947-1e0993a42d59",
    "nombre": "Maria",
    "apellido": "Lopez",
    "rol": "Equipo Tecnico",
    "activo": true
  },
  {
    "id": "931ffdb8-e4ae-4c6e-978e-3db67b62ddb3",
    "nombre": "Sofi",
    "apellido": "Tester",
    "rol": "Equipo Tecnico",
    "activo": true
  },
  {
    "id": "0b99b0b0-0519-4692-a061-4ddec112fbde",
    "nombre": "Cami",
    "apellido": "Tester",
    "rol": "Equipo Tecnico",
    "activo": true
  }
]

---

## Sección 1 — MELI (Admin)

Reemplazá `UUID_DE_MELI` con el UUID obtenido en el paso previo.

```sql
-- 1.1 Verificar que get_my_role() retorna 'Admin' para Meli
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "f58ad2d2-5a4b-40d1-a3f6-fdc4dcd0f974", "role": "authenticated"}';

SELECT get_my_role() AS mi_rol;
-- Esperado: 'Admin'
-- Si retorna NULL → la función no encontró al usuario o la migración 026 no se aplicó

ROLLBACK;
```
[
  {
    "mi_rol": null
  }
]

```sql
-- 1.2 Meli puede leer roles
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "f58ad2d2-5a4b-40d1-a3f6-fdc4dcd0f974", "role": "authenticated"}';

SELECT id, nombre, activo FROM roles ORDER BY nombre;
-- Esperado: ver todos los roles

ROLLBACK;
```
[
  {
    "id": "78cd4d97-da97-4ee8-8d43-cc4bea999dba",
    "nombre": "Admin",
    "activo": true
  },
  {
    "id": "575a5397-a74a-4447-bd5a-a6a40ecefb33",
    "nombre": "Coordinador",
    "activo": true
  },
  {
    "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "nombre": "Direccion",
    "activo": true
  },
  {
    "id": "eba12820-fd34-42d4-a58d-9e609739e36c",
    "nombre": "Equipo Tecnico",
    "activo": true
  }
]

```sql
-- 1.3 Meli puede leer usuarios
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "f58ad2d2-5a4b-40d1-a3f6-fdc4dcd0f974", "role": "authenticated"}';

SELECT id, nombre, apellido, activo FROM usuarios ORDER BY apellido;
-- Esperado: ver todos los usuarios (incluidos Cami y Sofi)

ROLLBACK;
```
Success. No rows returned

```sql
-- 1.4 Meli puede leer NNyA (activos e inactivos)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "f58ad2d2-5a4b-40d1-a3f6-fdc4dcd0f974", "role": "authenticated"}';

SELECT id, nombre, apellido, activo FROM nnya ORDER BY apellido;
-- Esperado: ver todos los NNyA, activos e inactivos

ROLLBACK;
```
Success. No rows returned

```sql
-- 1.5 Meli puede INSERT en nnya
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "f58ad2d2-5a4b-40d1-a3f6-fdc4dcd0f974", "role": "authenticated"}';

INSERT INTO nnya (nombre, apellido, dni, fecha_nacimiento)
VALUES ('Test', 'AuditMeli', '99999001', '2010-01-01')
RETURNING id, nombre, apellido;
-- Esperado: fila insertada correctamente

ROLLBACK; -- El ROLLBACK borra el dato de prueba
```
Error: Failed to run sql query: ERROR: 42501: new row violates row-level security policy for table "nnya"

```sql
-- 1.6 Meli puede leer audit_log
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "f58ad2d2-5a4b-40d1-a3f6-fdc4dcd0f974", "role": "authenticated"}';

SELECT id, tabla, operacion, fecha
FROM audit_log
ORDER BY fecha DESC
LIMIT 10;
-- Esperado: ver los últimos registros de auditoría

ROLLBACK;
```
Failed to run sql query: ERROR:  42703: column "table_name" does not exist
LINE 6: SELECT id, table_name, action, created_at
                   ^

---

## Sección 2 — CAMI (Equipo Técnico)

Reemplazá `UUID_DE_CAMI` con el UUID obtenido en el paso previo.

```sql
-- 2.1 Verificar que get_my_role() retorna 'Equipo Tecnico' para Cami
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "0b99b0b0-0519-4692-a061-4ddec112fbde", "role": "authenticated"}';

SELECT get_my_role() AS mi_rol;
-- Esperado: 'Equipo Tecnico'

ROLLBACK;
```
[
  {
    "mi_rol": null
  }
]

```sql
-- 2.2 Cami NO puede leer roles (RLS debe bloquear)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "0b99b0b0-0519-4692-a061-4ddec112fbde", "role": "authenticated"}';

SELECT id, nombre FROM roles;
-- Esperado: TODAS las filas (la policy roles_select_all tiene USING(true) — todos los
-- autenticados pueden SELECT en roles, necesario para que AuthContext resuelva el nombre
-- del rol al hacer .select('*, roles(nombre)'). Admin es el único que puede INSERT/UPDATE/DELETE.)

ROLLBACK;
```
[
  {
    "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "nombre": "Direccion"
  },
  {
    "id": "78cd4d97-da97-4ee8-8d43-cc4bea999dba",
    "nombre": "Admin"
  },
  {
    "id": "eba12820-fd34-42d4-a58d-9e609739e36c",
    "nombre": "Equipo Tecnico"
  },
  {
    "id": "575a5397-a74a-4447-bd5a-a6a40ecefb33",
    "nombre": "Coordinador"
  }
]

```sql
-- 2.3 Cami NO puede leer otros usuarios (RLS debe bloquear la lista completa)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "0b99b0b0-0519-4692-a061-4ddec112fbde", "role": "authenticated"}';

SELECT id, nombre, apellido FROM usuarios ORDER BY apellido;
-- Esperado: solo su propia fila (usuarios_self_read permite leer la propia)
-- NO debe ver a Meli ni a Sofi

ROLLBACK;
```
Success. No rows returned




```sql
-- 2.4 Cami puede leer NNyA
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "0b99b0b0-0519-4692-a061-4ddec112fbde", "role": "authenticated"}';

SELECT id, nombre, apellido, activo FROM nnya ORDER BY apellido;
-- Esperado: ver todos (activos e inactivos) — Equipo Tecnico tiene acceso completo

ROLLBACK;
```
Success. No rows returned




```sql
-- 2.5 Cami puede INSERT en nnya
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "0b99b0b0-0519-4692-a061-4ddec112fbde", "role": "authenticated"}';

INSERT INTO nnya (nombre, apellido, dni, fecha_nacimiento)
VALUES ('Test', 'AuditCami', '99999002', '2010-01-01')
RETURNING id, nombre, apellido;
-- Esperado: INSERT exitoso

ROLLBACK;
```
Error: Failed to run sql query: ERROR: 42501: new row violates row-level security policy for table "nnya"

```sql
-- 2.6 Cami NO puede INSERT en roles (RLS debe bloquear)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "0b99b0b0-0519-4692-a061-4ddec112fbde", "role": "authenticated"}';

INSERT INTO roles (nombre, descripcion, activo)
VALUES ('RolPrueba', 'No debería insertarse', TRUE);
-- Esperado: ERROR de RLS ("new row violates row-level security policy")

ROLLBACK;
```
Error: Failed to run sql query: ERROR: 42501: new row violates row-level security policy for table "roles"




---

## Sección 3 — SOFI (Equipo Tecnico)

> Sofi fue migrada de Educador a Equipo Tecnico (migración 027). Sus permisos son idénticos a los de Cami.

Reemplazá `UUID_DE_SOFI` con el UUID obtenido en el paso previo.

```sql
-- 3.1 Verificar que get_my_role() retorna 'Equipo Tecnico' para Sofi
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "931ffdb8-e4ae-4c6e-978e-3db67b62ddb3", "role": "authenticated"}';

SELECT get_my_role() AS mi_rol;
-- Esperado: 'Equipo Tecnico'

ROLLBACK;
```
[
  {
    "mi_rol": null
  }
]

```sql
-- 3.2 Sofi puede leer roles (roles_select_all), solo su fila en usuarios
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "931ffdb8-e4ae-4c6e-978e-3db67b62ddb3", "role": "authenticated"}';

SELECT 'roles' AS tabla, COUNT(*) FROM roles
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios;
-- Esperado: roles = todas las filas (roles_select_all permite SELECT a todos)
--           usuarios = 1 (solo su propia fila via usuarios_self_read)

ROLLBACK;
```
[
  {
    "tabla": "roles",
    "count": 4
  },
  {
    "tabla": "usuarios",
    "count": 0
  }
]

```sql
-- 3.3 Sofi puede ver todos los NNyA (activos e inactivos)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "931ffdb8-e4ae-4c6e-978e-3db67b62ddb3", "role": "authenticated"}';

SELECT id, nombre, apellido, activo FROM nnya ORDER BY apellido;
-- Esperado: TODOS los NNyA (activos e inactivos) — Equipo Tecnico tiene acceso completo

ROLLBACK;
```
Success. No rows returned




```sql
-- 3.4 Sofi puede INSERT en nnya
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "931ffdb8-e4ae-4c6e-978e-3db67b62ddb3", "role": "authenticated"}';

INSERT INTO nnya (nombre, apellido, dni, fecha_nacimiento)
VALUES ('Test', 'AuditSofi', '99999003', '2010-01-01')
RETURNING id, nombre, apellido;
-- Esperado: INSERT exitoso — Equipo Tecnico tiene CRUD completo en nnya

ROLLBACK;
```
Error: Failed to run sql query: ERROR: 42501: new row violates row-level security policy for table "nnya"

```sql
-- 3.5 Sofi puede leer alertas
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "931ffdb8-e4ae-4c6e-978e-3db67b62ddb3", "role": "authenticated"}';

SELECT id, titulo, estado FROM alertas ORDER BY created_at DESC LIMIT 5;
-- Esperado: ver alertas (sin importar su estado)

ROLLBACK;
```
Success. No rows returned




---

## Sección 4 — Verificación de rendimiento (sin cuelgues)

Estas queries miden si `get_my_role()` responde rápido. Si tarda más de 2 segundos,
hay una recursión activa que cuelga la conexión.

```sql
-- 4.1 Medir tiempo de get_my_role() para cada usuario de prueba
-- Corré esto como superusuario (sin impersonación)
-- Luego repetí con cada UUID

-- Con Meli:
DO $$
DECLARE
  inicio TIMESTAMPTZ := clock_timestamp();
  rol TEXT;
BEGIN
  -- Simular contexto de Meli
  PERFORM set_config('request.jwt.claims',
    '{"sub": "f58ad2d2-5a4b-40d1-a3f6-fdc4dcd0f974", "role": "authenticated"}', true);
  SELECT get_my_role() INTO rol;
  RAISE NOTICE 'Rol: %, Tiempo: %ms', rol,
    EXTRACT(milliseconds FROM clock_timestamp() - inicio);
END $$;
-- Esperado: responde en < 50ms
-- Si tarda más de 2000ms → hay recursión sin resolver
```
Success. No rows returned




```sql
-- 4.2 Test de carga mínima: 10 llamadas consecutivas
DO $$
DECLARE i INT;
BEGIN
  FOR i IN 1..10 LOOP
    PERFORM get_my_role();
  END LOOP;
  RAISE NOTICE '10 llamadas completadas sin error';
END $$;
-- Esperado: mensaje de éxito sin errores
```
Success. No rows returned




---

## Sección 5 — Audit log

```sql
-- 5.1 Ver los últimos 20 registros de auditoría
SELECT
  id,
  tabla,
  operacion,
  datos_antes,
  datos_despues,
  auth_uid,
  fecha
FROM audit_log
ORDER BY fecha DESC
LIMIT 20;
-- Esperado: ver operaciones INSERT/UPDATE/DELETE de las tablas principales
```
Failed to run sql query: ERROR:  42703: column "table_name" does not exist
LINE 4:   table_name,
          ^

```sql
-- 5.2 Verificar que el trigger de auditoría está activo en nnya
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND trigger_name LIKE 'trg_audit_%'
ORDER BY event_object_table;
-- Esperado: ver trg_audit_nnya, trg_audit_tutores, trg_audit_legajos, etc.
```
[
  {
    "trigger_name": "trg_audit_actividades",
    "event_manipulation": "UPDATE",
    "event_object_table": "actividades",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_actividades",
    "event_manipulation": "INSERT",
    "event_object_table": "actividades",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_actividades",
    "event_manipulation": "DELETE",
    "event_object_table": "actividades",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_alertas",
    "event_manipulation": "INSERT",
    "event_object_table": "alertas",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_alertas",
    "event_manipulation": "UPDATE",
    "event_object_table": "alertas",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_alertas",
    "event_manipulation": "DELETE",
    "event_object_table": "alertas",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_audiencias_judiciales",
    "event_manipulation": "UPDATE",
    "event_object_table": "audiencias_judiciales",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_audiencias_judiciales",
    "event_manipulation": "INSERT",
    "event_object_table": "audiencias_judiciales",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_audiencias_judiciales",
    "event_manipulation": "DELETE",
    "event_object_table": "audiencias_judiciales",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_diagnosticos",
    "event_manipulation": "UPDATE",
    "event_object_table": "diagnosticos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_diagnosticos",
    "event_manipulation": "DELETE",
    "event_object_table": "diagnosticos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_diagnosticos",
    "event_manipulation": "INSERT",
    "event_object_table": "diagnosticos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_documentos",
    "event_manipulation": "DELETE",
    "event_object_table": "documentos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_documentos",
    "event_manipulation": "UPDATE",
    "event_object_table": "documentos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_documentos",
    "event_manipulation": "INSERT",
    "event_object_table": "documentos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_incidentes",
    "event_manipulation": "UPDATE",
    "event_object_table": "incidentes",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_incidentes",
    "event_manipulation": "INSERT",
    "event_object_table": "incidentes",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_incidentes",
    "event_manipulation": "DELETE",
    "event_object_table": "incidentes",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_informes",
    "event_manipulation": "UPDATE",
    "event_object_table": "informes",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_informes",
    "event_manipulation": "DELETE",
    "event_object_table": "informes",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_informes",
    "event_manipulation": "INSERT",
    "event_object_table": "informes",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_intervenciones",
    "event_manipulation": "INSERT",
    "event_object_table": "intervenciones",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_intervenciones",
    "event_manipulation": "UPDATE",
    "event_object_table": "intervenciones",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_intervenciones",
    "event_manipulation": "DELETE",
    "event_object_table": "intervenciones",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_legajos",
    "event_manipulation": "INSERT",
    "event_object_table": "legajos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_legajos",
    "event_manipulation": "UPDATE",
    "event_object_table": "legajos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_legajos",
    "event_manipulation": "DELETE",
    "event_object_table": "legajos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_medicamentos",
    "event_manipulation": "INSERT",
    "event_object_table": "medicamentos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_medicamentos",
    "event_manipulation": "UPDATE",
    "event_object_table": "medicamentos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_medicamentos",
    "event_manipulation": "DELETE",
    "event_object_table": "medicamentos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_nnya",
    "event_manipulation": "UPDATE",
    "event_object_table": "nnya",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_nnya",
    "event_manipulation": "INSERT",
    "event_object_table": "nnya",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_nnya",
    "event_manipulation": "DELETE",
    "event_object_table": "nnya",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_nnya_tutores",
    "event_manipulation": "INSERT",
    "event_object_table": "nnya_tutores",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_nnya_tutores",
    "event_manipulation": "DELETE",
    "event_object_table": "nnya_tutores",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_nnya_tutores",
    "event_manipulation": "UPDATE",
    "event_object_table": "nnya_tutores",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_turnos",
    "event_manipulation": "UPDATE",
    "event_object_table": "turnos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_turnos",
    "event_manipulation": "DELETE",
    "event_object_table": "turnos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_turnos",
    "event_manipulation": "INSERT",
    "event_object_table": "turnos",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_tutores",
    "event_manipulation": "INSERT",
    "event_object_table": "tutores",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_tutores",
    "event_manipulation": "UPDATE",
    "event_object_table": "tutores",
    "action_timing": "AFTER"
  },
  {
    "trigger_name": "trg_audit_tutores",
    "event_manipulation": "DELETE",
    "event_object_table": "tutores",
    "action_timing": "AFTER"
  }
]

```sql
-- 5.3 Test en vivo: insertar un NNyA y verificar que queda en audit_log
BEGIN;

INSERT INTO nnya (nombre, apellido, dni, fecha_nacimiento)
VALUES ('TestAudit', 'LogPrueba', '99999999', '2010-01-01');

SELECT tabla, operacion, datos_despues->>'dni' AS dni_insertado
FROM audit_log
WHERE tabla = 'nnya'
ORDER BY fecha DESC
LIMIT 1;
-- Esperado: aparece fila con operacion = 'INSERT' y dni_insertado = '99999999'

ROLLBACK;
```
Failed to run sql query: ERROR:  42703: column "table_name" does not exist
LINE 7: SELECT table_name, action, new_data->>'dni' AS dni_insertado
               ^

---

## Sección 6 — Reglas para futuras migraciones

> Para el desarrollador: antes de agregar una nueva migración, chequeá estos puntos.

### NO hacer

- [ ] **NO** crear una función SECURITY DEFINER que consulte tablas con RLS habilitado **sin** agregar `SET row_security = off`
- [ ] **NO** crear una política RLS que llame a una función, y dentro de esa función consulte una tabla que a su vez tenga una política que llame a la misma función (ciclo A → f() → B → f() → A)
- [ ] **NO** agregar `get_my_role()` como condición en una política de la tabla `usuarios` o `roles` sin verificar que la función ya tiene `SET row_security = off`
- [ ] **NO** crear triggers BEFORE que llamen a `get_my_role()` en tablas con RLS

### SÍ hacer

- [ ] Si creás una nueva función SECURITY DEFINER que toca tablas con RLS → agregar `SET row_security = off`
- [ ] Si agregás una nueva tabla con RLS → verificar con la query de Sección 0.3 que las políticas no crean nuevos ciclos
- [ ] Si una política necesita verificar el rol, siempre usá `get_my_role()` (ya tiene el fix) — no crear funciones alternativas sin el fix
- [ ] Después de cada migración que modifica policies o funciones, correr la Sección 4 para verificar que no hay cuelgues

### Patrón seguro para nuevas políticas

```sql
-- CORRECTO: usar get_my_role() que ya tiene SET row_security = off
CREATE POLICY "mi_tabla_admin_all" ON mi_tabla
  FOR ALL TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- INCORRECTO: función nueva sin row_security = off
CREATE FUNCTION get_mi_dato() RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT nombre FROM usuarios WHERE ... -- PELIGRO: sin SET row_security = off
$$;
```
Error: Failed to run sql query: ERROR: 42P01: relation "mi_tabla" does not exist




---

## Resultados esperados — resumen rápido

| Verificación | Meli (Admin) | Cami (Equipo Técnico) | Sofi (Equipo Tecnico) |
|---|---|---|---|
| `get_my_role()` | `'Admin'` | `'Equipo Tecnico'` | `'Equipo Tecnico'` |
| SELECT roles | Todas las filas | Todas las filas ¹ | Todas las filas ¹ |
| SELECT usuarios | Todos | Solo su fila | Solo su fila |
| SELECT nnya | Todos (activos e inactivos) | Todos (activos e inactivos) | Todos (activos e inactivos) |
| INSERT nnya | ✅ | ✅ | ✅ |
| INSERT roles | ✅ | ❌ Error RLS | ❌ Error RLS |
| SELECT alertas | ✅ | ✅ | ✅ |
| SELECT audit_log | ✅ | ❌ 0 filas | ❌ 0 filas |
| Tiempo get_my_role() | < 50ms | < 50ms | < 50ms |

> ¹ `roles_select_all` permite SELECT a todos los autenticados. Solo Admin puede modificar roles.
