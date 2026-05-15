-- ============================================================
-- Fix: roles RLS + limpieza de nombres de roles duplicados
-- ============================================================

-- 1. Permitir SELECT en roles a todos los usuarios autenticados.
--    Necesario para que el AuthContext pueda resolver el nombre del rol
--    al hacer .select('roles(nombre)') desde la tabla usuarios.
--    Sin esta política, solo Admin puede leer roles → role queda null
--    para todos los demás → AccessGuard falla en toda la app.
CREATE POLICY "roles_select_all" ON roles
  FOR SELECT TO authenticated
  USING (true);

-- 2. Reasignar usuarios que tienen el rol 'Equipo_Tecnico' (guión bajo)
--    al rol correcto 'Equipo Tecnico' (con espacio).
UPDATE usuarios
  SET rol_id = (SELECT id FROM roles WHERE nombre = 'Equipo Tecnico')
  WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'Equipo_Tecnico');

-- 3. Eliminar el rol duplicado con guión bajo (ya sin usuarios asignados).
DELETE FROM roles WHERE nombre = 'Equipo_Tecnico';
