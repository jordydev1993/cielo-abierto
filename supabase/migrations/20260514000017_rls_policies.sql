-- ============================================================
-- Habilitar RLS en todas las tablas
-- ============================================================
ALTER TABLE roles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE nnya                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutores              ENABLE ROW LEVEL SECURITY;
ALTER TABLE nnya_tutores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE legajos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervenciones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades          ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidentes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosticos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicamentos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE informes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiencias_judiciales ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ROLES — solo Admin
-- ============================================================
CREATE POLICY "roles_admin_all" ON roles
  FOR ALL TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- ============================================================
-- USUARIOS — solo Admin
-- ============================================================
CREATE POLICY "usuarios_admin_all" ON usuarios
  FOR ALL TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- El usuario autenticado puede ver su propio perfil
CREATE POLICY "usuarios_self_read" ON usuarios
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- ============================================================
-- NNyA — Admin y Equipo Tecnico: CRUD completo
-- ============================================================
CREATE POLICY "nnya_admin_tecnico_all" ON nnya
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- TUTORES — Admin y Equipo Tecnico: CRUD completo
-- ============================================================
CREATE POLICY "tutores_admin_tecnico_all" ON tutores
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

CREATE POLICY "nnya_tutores_admin_tecnico_all" ON nnya_tutores
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- LEGAJOS — Admin y Equipo Tecnico: CRUD completo
-- ============================================================
CREATE POLICY "legajos_admin_tecnico_all" ON legajos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- INTERVENCIONES — Admin y Equipo Tecnico: CRUD completo
-- ============================================================
CREATE POLICY "intervenciones_admin_tecnico_all" ON intervenciones
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- TURNOS — Admin y Equipo Tecnico: CRUD completo
-- ============================================================
CREATE POLICY "turnos_admin_tecnico_all" ON turnos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- ALERTAS — Admin y Equipo Tecnico: CRUD completo
-- ============================================================
CREATE POLICY "alertas_admin_tecnico_all" ON alertas
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- ACTIVIDADES — Admin y Equipo Tecnico: CRUD completo
-- ============================================================
CREATE POLICY "actividades_admin_tecnico_all" ON actividades
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- INCIDENTES — Admin y Equipo Tecnico: CRUD completo
-- ============================================================
CREATE POLICY "incidentes_admin_tecnico_all" ON incidentes
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- DIAGNÓSTICOS — Admin y Equipo Tecnico: CRUD completo
-- ============================================================
CREATE POLICY "diagnosticos_admin_tecnico_all" ON diagnosticos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- MEDICAMENTOS — Admin y Equipo Tecnico: CRUD completo
-- ============================================================
CREATE POLICY "medicamentos_admin_tecnico_all" ON medicamentos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- INFORMES — Admin y Equipo Tecnico: CRUD completo
-- ============================================================
CREATE POLICY "informes_admin_tecnico_all" ON informes
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- DOCUMENTOS — Admin y Equipo Tecnico: CRUD completo
-- ============================================================
CREATE POLICY "documentos_admin_tecnico_all" ON documentos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- AUDIENCIAS JUDICIALES — Admin y Equipo Tecnico: CRUD completo
-- ============================================================
CREATE POLICY "audiencias_admin_tecnico_all" ON audiencias_judiciales
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));
