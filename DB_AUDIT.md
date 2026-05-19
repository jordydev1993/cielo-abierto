# Auditoría de Base de Datos — Cielo Abierto
**Versión:** Sprint 1 · Fecha: 19/05/2026  
**Objetivo:** Verificar que las políticas RLS funcionan correctamente y que no hay recursiones circulares activas.

---

## Cómo acceder

1. Abrí https://supabase.com → iniciá sesión → entrá al proyecto **cielo-abierto**
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

Anotá los tres UUIDs — los vas a necesitar en las secciones siguientes.

---

## Sección 0 — Verificación sin impersonación (como Admin de DB)

Estas queries corren como superusuario (postgres). No prueban RLS pero verifican que la función y los datos existen.

```sql
-- 0.1 Verificar que get_my_role() tiene SET row_security = off
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'get_my_role'
  AND routine_schema = 'public';
-- Esperado: que en la definición aparezca SET row_security = off
```

```sql
-- 0.2 Verificar que las tablas críticas tienen RLS habilitado
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('roles', 'usuarios', 'nnya', 'tutores', 'legajos', 'alertas', 'audit_log')
  AND relnamespace = 'public'::regnamespace
ORDER BY relname;
-- Esperado: relrowsecurity = true en todas
```

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

```sql
-- 0.4 Verificar que los usuarios de prueba existen en la tabla usuarios
SELECT u.id, u.nombre, u.apellido, r.nombre AS rol, u.activo
FROM usuarios u
JOIN roles r ON r.id = u.rol_id
WHERE u.activo = TRUE
ORDER BY r.nombre;
-- Esperado: Meli (Admin), Cami (Equipo Tecnico), Sofi (Educador)
```

---

## Sección 1 — MELI (Admin)

Reemplazá `UUID_DE_MELI` con el UUID obtenido en el paso previo.

```sql
-- 1.1 Verificar que get_my_role() retorna 'Admin' para Meli
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_MELI", "role": "authenticated"}';

SELECT get_my_role() AS mi_rol;
-- Esperado: 'Admin'
-- Si retorna NULL → la función no encontró al usuario o la migración 026 no se aplicó

ROLLBACK;
```

```sql
-- 1.2 Meli puede leer roles
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_MELI", "role": "authenticated"}';

SELECT id, nombre, activo FROM roles ORDER BY nombre;
-- Esperado: ver todos los roles

ROLLBACK;
```

```sql
-- 1.3 Meli puede leer usuarios
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_MELI", "role": "authenticated"}';

SELECT id, nombre, apellido, activo FROM usuarios ORDER BY apellido;
-- Esperado: ver todos los usuarios (incluidos Cami y Sofi)

ROLLBACK;
```

```sql
-- 1.4 Meli puede leer NNyA (activos e inactivos)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_MELI", "role": "authenticated"}';

SELECT id, nombre, apellido, activo FROM nnya ORDER BY apellido;
-- Esperado: ver todos los NNyA, activos e inactivos

ROLLBACK;
```

```sql
-- 1.5 Meli puede INSERT en nnya
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_MELI", "role": "authenticated"}';

INSERT INTO nnya (nombre, apellido, dni, fecha_nacimiento)
VALUES ('Test', 'AuditMeli', '99999001', '2010-01-01')
RETURNING id, nombre, apellido;
-- Esperado: fila insertada correctamente

ROLLBACK; -- El ROLLBACK borra el dato de prueba
```

```sql
-- 1.6 Meli puede leer audit_log
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_MELI", "role": "authenticated"}';

SELECT id, table_name, action, created_at
FROM audit_log
ORDER BY created_at DESC
LIMIT 10;
-- Esperado: ver los últimos registros de auditoría

ROLLBACK;
```

---

## Sección 2 — CAMI (Equipo Técnico)

Reemplazá `UUID_DE_CAMI` con el UUID obtenido en el paso previo.

```sql
-- 2.1 Verificar que get_my_role() retorna 'Equipo Tecnico' para Cami
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_CAMI", "role": "authenticated"}';

SELECT get_my_role() AS mi_rol;
-- Esperado: 'Equipo Tecnico'

ROLLBACK;
```

```sql
-- 2.2 Cami NO puede leer roles (RLS debe bloquear)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_CAMI", "role": "authenticated"}';

SELECT id, nombre FROM roles;
-- Esperado: 0 filas (RLS bloquea — solo Admin puede leer roles)

ROLLBACK;
```

```sql
-- 2.3 Cami NO puede leer otros usuarios (RLS debe bloquear la lista completa)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_CAMI", "role": "authenticated"}';

SELECT id, nombre, apellido FROM usuarios ORDER BY apellido;
-- Esperado: solo su propia fila (usuarios_self_read permite leer la propia)
-- NO debe ver a Meli ni a Sofi

ROLLBACK;
```

```sql
-- 2.4 Cami puede leer NNyA
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_CAMI", "role": "authenticated"}';

SELECT id, nombre, apellido, activo FROM nnya ORDER BY apellido;
-- Esperado: ver todos (activos e inactivos) — Equipo Tecnico tiene acceso completo

ROLLBACK;
```

```sql
-- 2.5 Cami puede INSERT en nnya
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_CAMI", "role": "authenticated"}';

INSERT INTO nnya (nombre, apellido, dni, fecha_nacimiento)
VALUES ('Test', 'AuditCami', '99999002', '2010-01-01')
RETURNING id, nombre, apellido;
-- Esperado: INSERT exitoso

ROLLBACK;
```

```sql
-- 2.6 Cami NO puede INSERT en roles (RLS debe bloquear)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_CAMI", "role": "authenticated"}';

INSERT INTO roles (nombre, descripcion, activo)
VALUES ('RolPrueba', 'No debería insertarse', TRUE);
-- Esperado: ERROR de RLS ("new row violates row-level security policy")

ROLLBACK;
```

---

## Sección 3 — SOFI (Educador)

Reemplazá `UUID_DE_SOFI` con el UUID obtenido en el paso previo.

```sql
-- 3.1 Verificar que get_my_role() retorna 'Educador' para Sofi
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_SOFI", "role": "authenticated"}';

SELECT get_my_role() AS mi_rol;
-- Esperado: 'Educador'

ROLLBACK;
```

```sql
-- 3.2 Sofi NO puede leer roles ni usuarios
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_SOFI", "role": "authenticated"}';

SELECT 'roles' AS tabla, COUNT(*) FROM roles
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios;
-- Esperado: roles = 0, usuarios = 1 (solo su propia fila via usuarios_self_read)

ROLLBACK;
```

```sql
-- 3.3 Sofi solo ve NNyA activos
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_SOFI", "role": "authenticated"}';

SELECT id, nombre, apellido, activo FROM nnya ORDER BY apellido;
-- Esperado: SOLO filas con activo = TRUE
-- Los NNyA con activo = FALSE no deben aparecer

ROLLBACK;
```

```sql
-- 3.4 Sofi NO puede INSERT en nnya
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_SOFI", "role": "authenticated"}';

INSERT INTO nnya (nombre, apellido, dni, fecha_nacimiento)
VALUES ('Test', 'AuditSofi', '99999003', '2010-01-01');
-- Esperado: ERROR de RLS

ROLLBACK;
```

```sql
-- 3.5 Sofi puede leer alertas
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "UUID_DE_SOFI", "role": "authenticated"}';

SELECT id, titulo, estado FROM alertas ORDER BY created_at DESC LIMIT 5;
-- Esperado: ver alertas (sin importar su estado)

ROLLBACK;
```

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
    '{"sub": "UUID_DE_MELI", "role": "authenticated"}', true);
  SELECT get_my_role() INTO rol;
  RAISE NOTICE 'Rol: %, Tiempo: %ms', rol,
    EXTRACT(milliseconds FROM clock_timestamp() - inicio);
END $$;
-- Esperado: responde en < 50ms
-- Si tarda más de 2000ms → hay recursión sin resolver
```

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

---

## Sección 5 — Audit log

```sql
-- 5.1 Ver los últimos 20 registros de auditoría
SELECT
  id,
  table_name,
  action,
  old_data,
  new_data,
  user_id,
  created_at
FROM audit_log
ORDER BY created_at DESC
LIMIT 20;
-- Esperado: ver operaciones INSERT/UPDATE/DELETE de las tablas principales
```

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

```sql
-- 5.3 Test en vivo: insertar un NNyA y verificar que queda en audit_log
BEGIN;

INSERT INTO nnya (nombre, apellido, dni, fecha_nacimiento)
VALUES ('TestAudit', 'LogPrueba', '99999999', '2010-01-01');

SELECT table_name, action, new_data->>'dni' AS dni_insertado
FROM audit_log
WHERE table_name = 'nnya'
ORDER BY created_at DESC
LIMIT 1;
-- Esperado: aparece fila con action = 'INSERT' y dni_insertado = '99999999'

ROLLBACK;
```

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

---

## Resultados esperados — resumen rápido

| Verificación | Meli (Admin) | Cami (Equipo Técnico) | Sofi (Educador) |
|---|---|---|---|
| `get_my_role()` | `'Admin'` | `'Equipo Tecnico'` | `'Educador'` |
| SELECT roles | Todas las filas | 0 filas | 0 filas |
| SELECT usuarios | Todos | Solo su fila | Solo su fila |
| SELECT nnya | Todos (activos e inactivos) | Todos | Solo activos |
| INSERT nnya | ✅ | ✅ | ❌ Error RLS |
| INSERT roles | ✅ | ❌ Error RLS | ❌ Error RLS |
| SELECT alertas | ✅ | ✅ | ✅ |
| SELECT audit_log | ✅ | ❌ 0 filas | ❌ 0 filas |
| Tiempo get_my_role() | < 50ms | < 50ms | < 50ms |
