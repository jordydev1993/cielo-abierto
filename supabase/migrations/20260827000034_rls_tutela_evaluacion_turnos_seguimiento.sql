-- FASE A2 (AGENTS.md sección 11): políticas RLS para las 10 tablas de A1.
-- Ver prompts/013-rls-tutela-evaluacion-turnos-seguimiento.md para el análisis completo.
-- Patrón copiado de "intervenciones_admin_tecnico_all" (clean_schema.sql), abierto en
-- políticas por operación porque la matriz pide reglas distintas por operación.

-- ============================================================
-- referentes — SELECT/INSERT/UPDATE ambos, DELETE nadie
-- dni protegido por trigger (ver más abajo), no por policy (RLS es por fila, no columna)
-- ============================================================

CREATE POLICY "referentes_select_admin_tecnico" ON referentes
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "referentes_insert_admin_tecnico" ON referentes
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "referentes_update_admin_tecnico" ON referentes
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- El DNI no se toca por operativa: solo Admin puede cambiarlo. RLS no distingue columnas,
-- así que se refuerza con un trigger (mismo patrón fn_/trg_ que fn_crear_alerta_incidente_grave).
CREATE OR REPLACE FUNCTION fn_proteger_dni_referente()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.dni IS DISTINCT FROM OLD.dni AND get_my_role() <> 'Admin' THEN
    RAISE EXCEPTION 'Solo Admin puede modificar el DNI de un referente';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_dni_referente ON referentes;
CREATE TRIGGER trg_proteger_dni_referente
  BEFORE UPDATE ON referentes
  FOR EACH ROW
  EXECUTE FUNCTION fn_proteger_dni_referente();

-- ============================================================
-- vinculos_tutela — SELECT ambos, INSERT/UPDATE Admin, DELETE nadie
-- ============================================================

CREATE POLICY "vinculos_tutela_select_admin_tecnico" ON vinculos_tutela
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "vinculos_tutela_insert_admin" ON vinculos_tutela
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "vinculos_tutela_update_admin" ON vinculos_tutela
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- ============================================================
-- validaciones_renaper — SELECT/INSERT ambos, UPDATE/DELETE nadie (evidencia inmutable)
-- ============================================================

CREATE POLICY "validaciones_renaper_select_admin_tecnico" ON validaciones_renaper
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "validaciones_renaper_insert_admin_tecnico" ON validaciones_renaper
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- ============================================================
-- transferencia_auh — SELECT ambos, INSERT/UPDATE Admin, DELETE nadie
-- ============================================================

CREATE POLICY "transferencia_auh_select_admin_tecnico" ON transferencia_auh
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "transferencia_auh_insert_admin" ON transferencia_auh
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "transferencia_auh_update_admin" ON transferencia_auh
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- ============================================================
-- evaluacion_institucional — SELECT ambos, INSERT/UPDATE Admin, DELETE nadie
-- ============================================================

CREATE POLICY "evaluacion_institucional_select_admin_tecnico" ON evaluacion_institucional
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "evaluacion_institucional_insert_admin" ON evaluacion_institucional
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "evaluacion_institucional_update_admin" ON evaluacion_institucional
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- ============================================================
-- evaluacion_institucional_asistentes — SELECT ambos, INSERT/DELETE Admin, UPDATE ambos
-- ============================================================

CREATE POLICY "evaluacion_institucional_asistentes_select_admin_tecnico" ON evaluacion_institucional_asistentes
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "evaluacion_institucional_asistentes_insert_admin" ON evaluacion_institucional_asistentes
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "evaluacion_institucional_asistentes_update_admin_tecnico" ON evaluacion_institucional_asistentes
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "evaluacion_institucional_asistentes_delete_admin" ON evaluacion_institucional_asistentes
  FOR DELETE TO authenticated
  USING (get_my_role() = 'Admin');

-- ============================================================
-- evaluacion_institucional_casos — SELECT/INSERT/UPDATE ambos, DELETE nadie
-- ============================================================

CREATE POLICY "evaluacion_institucional_casos_select_admin_tecnico" ON evaluacion_institucional_casos
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "evaluacion_institucional_casos_insert_admin_tecnico" ON evaluacion_institucional_casos
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "evaluacion_institucional_casos_update_admin_tecnico" ON evaluacion_institucional_casos
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- ============================================================
-- propuestas_mejora — SELECT ambos, INSERT Admin, UPDATE Admin u responsable, DELETE nadie
-- ============================================================

CREATE POLICY "propuestas_mejora_select_admin_tecnico" ON propuestas_mejora
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "propuestas_mejora_insert_admin" ON propuestas_mejora
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "propuestas_mejora_update_admin_o_responsable" ON propuestas_mejora
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'Admin'
    OR responsable_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    get_my_role() = 'Admin'
    OR responsable_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
  );

-- ============================================================
-- turnos_personal — SELECT ambos, INSERT Admin, UPDATE firma doble, DELETE nadie
-- ============================================================

CREATE POLICY "turnos_personal_select_admin_tecnico" ON turnos_personal
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "turnos_personal_insert_admin" ON turnos_personal
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "turnos_personal_update_firma" ON turnos_personal
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'Admin'
    OR usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
    OR recibido_por IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
    OR (estado = 'entregado' AND recibido_por IS NULL)
  )
  WITH CHECK (
    get_my_role() = 'Admin'
    OR usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
    OR recibido_por IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
    OR (estado = 'entregado' AND recibido_por IS NULL)
  );

-- ============================================================
-- seguimiento_post_egreso — SELECT/INSERT ambos, UPDATE Admin o contactado_por, DELETE nadie
-- ============================================================

CREATE POLICY "seguimiento_post_egreso_select_admin_tecnico" ON seguimiento_post_egreso
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "seguimiento_post_egreso_insert_admin_tecnico" ON seguimiento_post_egreso
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "seguimiento_post_egreso_update_admin_o_contactado" ON seguimiento_post_egreso
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'Admin'
    OR contactado_por IS NULL
    OR contactado_por IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    get_my_role() = 'Admin'
    OR contactado_por IS NULL
    OR contactado_por IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
  );
