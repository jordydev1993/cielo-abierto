-- Tabla de auditoría: registra toda acción de INSERT/UPDATE/DELETE
CREATE TABLE IF NOT EXISTS audit_log (
  id            BIGSERIAL PRIMARY KEY,
  tabla         TEXT NOT NULL,
  operacion     TEXT NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
  id_registro   TEXT NOT NULL,
  datos_antes   JSONB,
  datos_despues JSONB,
  auth_uid      UUID,
  fecha         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_admin_read" ON audit_log
  FOR SELECT TO authenticated
  USING (get_my_role() = 'Admin');

-- Función genérica de auditoría (requiere columna 'id' en la tabla)
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tabla, operacion, id_registro, datos_despues, auth_uid)
    VALUES (TG_TABLE_NAME, 'INSERT', NEW.id::TEXT, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tabla, operacion, id_registro, datos_antes, datos_despues, auth_uid)
    VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id::TEXT, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (tabla, operacion, id_registro, datos_antes, auth_uid)
    VALUES (TG_TABLE_NAME, 'DELETE', OLD.id::TEXT, to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
END;
$$;

-- Aplicar trigger a todas las tablas con columna 'id UUID'
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'nnya', 'tutores', 'nnya_tutores', 'legajos', 'intervenciones',
    'turnos', 'alertas', 'actividades', 'incidentes', 'diagnosticos',
    'medicamentos', 'informes', 'documentos', 'audiencias_judiciales'
  ] LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_audit_%I
       AFTER INSERT OR UPDATE OR DELETE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger()',
      t, t
    );
  END LOOP;
END;
$$;
