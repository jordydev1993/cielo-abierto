-- FASE E (issue #7, prompts/026): genera automáticamente las 2 filas de
-- seguimiento_post_egreso (30/60 días) en el momento del egreso, sin necesitar
-- infraestructura de cron. Mismo patrón que fn_crear_alerta_incidente_grave
-- (clean_schema.sql): SECURITY DEFINER, disparado por evento.

CREATE OR REPLACE FUNCTION fn_crear_seguimiento_post_egreso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.fecha_egreso IS NOT NULL AND OLD.fecha_egreso IS NULL THEN
    INSERT INTO seguimiento_post_egreso (nnya_id, dias_post_egreso, fecha_programada)
    VALUES (NEW.id, 30, NEW.fecha_egreso + 30)
    ON CONFLICT (nnya_id, dias_post_egreso) DO NOTHING;

    INSERT INTO seguimiento_post_egreso (nnya_id, dias_post_egreso, fecha_programada)
    VALUES (NEW.id, 60, NEW.fecha_egreso + 60)
    ON CONFLICT (nnya_id, dias_post_egreso) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crear_seguimiento_post_egreso ON nnya;
CREATE TRIGGER trg_crear_seguimiento_post_egreso
  AFTER UPDATE ON nnya
  FOR EACH ROW
  EXECUTE FUNCTION fn_crear_seguimiento_post_egreso();

-- Backfill: NNyA ya egresados (antes de este trigger) que todavía no tengan sus filas.
INSERT INTO seguimiento_post_egreso (nnya_id, dias_post_egreso, fecha_programada)
SELECT id, 30, fecha_egreso + 30 FROM nnya
WHERE estado_actual = 'Egresado' AND fecha_egreso IS NOT NULL
ON CONFLICT (nnya_id, dias_post_egreso) DO NOTHING;

INSERT INTO seguimiento_post_egreso (nnya_id, dias_post_egreso, fecha_programada)
SELECT id, 60, fecha_egreso + 60 FROM nnya
WHERE estado_actual = 'Egresado' AND fecha_egreso IS NOT NULL
ON CONFLICT (nnya_id, dias_post_egreso) DO NOTHING;
