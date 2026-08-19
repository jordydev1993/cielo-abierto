-- ============================================================
-- Trigger: generar alerta automática para incidentes graves/críticos
-- ============================================================

CREATE OR REPLACE FUNCTION fn_crear_alerta_incidente_grave()
RETURNS TRIGGER AS $$
DECLARE
  v_prioridad VARCHAR(20);
BEGIN
  IF NEW.gravedad IN ('grave', 'critico') THEN
    v_prioridad := CASE NEW.gravedad
      WHEN 'critico' THEN 'critica'
      ELSE 'alta'
    END;

    INSERT INTO alertas (
      nnya_id,
      titulo,
      descripcion,
      tipo,
      prioridad,
      estado,
      fecha_vencimiento
    ) VALUES (
      NEW.nnya_id,
      'Incidente ' || initcap(NEW.gravedad) || ': ' || left(NEW.descripcion, 100),
      'Incidente registrado el ' || to_char(NEW.fecha_hora, 'DD/MM/YYYY HH24:MI') ||
        '. Tipo: ' || NEW.tipo || '. Requiere seguimiento inmediato.',
      'incidente',
      v_prioridad,
      'pendiente',
      (CURRENT_DATE + INTERVAL '3 days')::DATE
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_alerta_incidente_grave ON incidentes;
CREATE TRIGGER trg_alerta_incidente_grave
  AFTER INSERT ON incidentes
  FOR EACH ROW
  EXECUTE FUNCTION fn_crear_alerta_incidente_grave();
