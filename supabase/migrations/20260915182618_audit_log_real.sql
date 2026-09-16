-- Audit log real: fn_audit_trigger() + trg_audit_* en las 27 tablas de negocio
-- (todas menos audit_log misma). Resuelve la decisión A/B/C de prompts/012 (issue #2):
-- Jordy confirmó Opción C (auditar todo). Adaptado al schema real de audit_log
-- (registro_id/usuario_id), distinto del que tenía la migración superseded
-- 20260514000018_audit_log.sql (id_registro/auth_uid).

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

CREATE POLICY "audit_log_system_insert" ON audit_log
  FOR INSERT
  WITH CHECK (true);

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'roles', 'usuarios', 'nnya', 'tutores', 'nnya_tutores', 'legajos', 'intervenciones',
    'turnos', 'alertas', 'actividades', 'incidentes', 'diagnosticos', 'medicamentos',
    'informes', 'documentos', 'audiencias_judiciales',
    'referentes', 'vinculos_tutela', 'validaciones_renaper', 'transferencia_auh',
    'evaluacion_institucional', 'evaluacion_institucional_asistentes',
    'evaluacion_institucional_casos', 'propuestas_mejora', 'turnos_personal',
    'seguimiento_post_egreso', 'novedades'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_audit_%I ON %I;
       CREATE TRIGGER trg_audit_%I
       AFTER INSERT OR UPDATE OR DELETE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger()',
      t, t, t, t
    );
  END LOOP;
END;
$$;
