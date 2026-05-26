-- ============================================================
-- Migración: Eliminar rol Educador
-- El rol Educador queda absorbido por Equipo Tecnico.
-- Los casos de uso del sistema definen "Actor: todos",
-- por lo que Equipo Tecnico tiene acceso completo a todas
-- las entidades de negocio.
-- ============================================================

-- 1. Reasignar usuarios con rol Educador a Equipo Tecnico
UPDATE usuarios
SET rol_id = (SELECT id FROM roles WHERE nombre = 'Equipo Tecnico')
WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'Educador');

-- 2. Eliminar políticas RLS específicas de Educador
DROP POLICY IF EXISTS "nnya_educador_read"         ON nnya;
DROP POLICY IF EXISTS "tutores_educador_read"       ON tutores;
DROP POLICY IF EXISTS "nnya_tutores_educador_read"  ON nnya_tutores;
DROP POLICY IF EXISTS "legajos_educador_read"       ON legajos;
DROP POLICY IF EXISTS "turnos_educador_read"        ON turnos;
DROP POLICY IF EXISTS "alertas_educador_insert"     ON alertas;
DROP POLICY IF EXISTS "alertas_educador_select"     ON alertas;
DROP POLICY IF EXISTS "alertas_educador_update"     ON alertas;
DROP POLICY IF EXISTS "incidentes_educador_insert"  ON incidentes;
DROP POLICY IF EXISTS "incidentes_educador_select"  ON incidentes;
DROP POLICY IF EXISTS "documentos_educador_read"    ON documentos;

-- 3. Actualizar política de actividades (quitaba Educador del IN)
DROP POLICY IF EXISTS "actividades_all_roles" ON actividades;
CREATE POLICY "actividades_admin_tecnico_all" ON actividades
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- 4. Eliminar el rol Educador
DELETE FROM roles WHERE nombre = 'Educador';
