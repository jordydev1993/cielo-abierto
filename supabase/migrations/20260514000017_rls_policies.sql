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
-- NNyA — Admin y Técnico: CRUD; Educador: solo lectura activos
-- ============================================================
CREATE POLICY "nnya_admin_tecnico_all" ON nnya
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

CREATE POLICY "nnya_educador_read" ON nnya
  FOR SELECT TO authenticated
  USING (get_my_role() = 'Educador' AND activo = TRUE);

-- ============================================================
-- TUTORES — Admin y Técnico: CRUD; Educador: solo lectura
-- ============================================================
CREATE POLICY "tutores_admin_tecnico_all" ON tutores
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

CREATE POLICY "tutores_educador_read" ON tutores
  FOR SELECT TO authenticated
  USING (get_my_role() = 'Educador');

CREATE POLICY "nnya_tutores_admin_tecnico_all" ON nnya_tutores
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

CREATE POLICY "nnya_tutores_educador_read" ON nnya_tutores
  FOR SELECT TO authenticated
  USING (get_my_role() = 'Educador');

-- ============================================================
-- LEGAJOS — Admin y Técnico: CRUD; Educador: solo lectura
-- ============================================================
CREATE POLICY "legajos_admin_tecnico_all" ON legajos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

CREATE POLICY "legajos_educador_read" ON legajos
  FOR SELECT TO authenticated
  USING (get_my_role() = 'Educador');

-- ============================================================
-- INTERVENCIONES — Admin y Técnico: CRUD; Educador: sin acceso
-- ============================================================
CREATE POLICY "intervenciones_admin_tecnico_all" ON intervenciones
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- TURNOS — Admin y Técnico: CRUD; Educador: solo lectura
-- ============================================================
CREATE POLICY "turnos_admin_tecnico_all" ON turnos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

CREATE POLICY "turnos_educador_read" ON turnos
  FOR SELECT TO authenticated
  USING (get_my_role() = 'Educador');

-- ============================================================
-- ALERTAS — Admin y Técnico: CRUD; Educador: crear, leer y actualizar
-- ============================================================
CREATE POLICY "alertas_admin_tecnico_all" ON alertas
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

CREATE POLICY "alertas_educador_insert" ON alertas
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Educador');

CREATE POLICY "alertas_educador_select" ON alertas
  FOR SELECT TO authenticated
  USING (get_my_role() = 'Educador');

CREATE POLICY "alertas_educador_update" ON alertas
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'Educador')
  WITH CHECK (get_my_role() = 'Educador');

-- ============================================================
-- ACTIVIDADES — todos los roles: CRUD completo
-- ============================================================
CREATE POLICY "actividades_all_roles" ON actividades
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico', 'Educador'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico', 'Educador'));

-- ============================================================
-- INCIDENTES — Admin y Técnico: CRUD; Educador: insertar y leer
-- ============================================================
CREATE POLICY "incidentes_admin_tecnico_all" ON incidentes
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

CREATE POLICY "incidentes_educador_insert" ON incidentes
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Educador');

CREATE POLICY "incidentes_educador_select" ON incidentes
  FOR SELECT TO authenticated
  USING (get_my_role() = 'Educador');

-- ============================================================
-- DIAGNÓSTICOS — Admin y Técnico: CRUD; Educador: sin acceso
-- ============================================================
CREATE POLICY "diagnosticos_admin_tecnico_all" ON diagnosticos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- MEDICAMENTOS — Admin y Técnico: CRUD; Educador: sin acceso
-- ============================================================
CREATE POLICY "medicamentos_admin_tecnico_all" ON medicamentos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- INFORMES — Admin y Técnico: CRUD; Educador: sin acceso
-- ============================================================
CREATE POLICY "informes_admin_tecnico_all" ON informes
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

-- ============================================================
-- DOCUMENTOS — Admin y Técnico: CRUD; Educador: solo lectura
-- ============================================================
CREATE POLICY "documentos_admin_tecnico_all" ON documentos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));

CREATE POLICY "documentos_educador_read" ON documentos
  FOR SELECT TO authenticated
  USING (get_my_role() = 'Educador');

-- ============================================================
-- AUDIENCIAS JUDICIALES — Admin y Técnico: CRUD; Educador: sin acceso
-- ============================================================
CREATE POLICY "audiencias_admin_tecnico_all" ON audiencias_judiciales
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));
