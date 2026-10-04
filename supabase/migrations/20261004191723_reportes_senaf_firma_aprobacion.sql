-- La aprobación del informe SENAF la firma siempre el usuario de la sesión: la base
-- completa aprobado_por / aprobado_at e ignora lo que mande el cliente (prompts/027).
CREATE OR REPLACE FUNCTION fn_reportes_senaf_bloquear_aprobado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.estado = 'aprobado' THEN
    RAISE EXCEPTION 'El informe del período %/% ya está aprobado y no se puede modificar. Generá una versión nueva.',
      OLD.periodo_mes, OLD.periodo_anio;
  END IF;

  IF NEW.estado = 'aprobado' THEN
    SELECT id INTO NEW.aprobado_por FROM usuarios WHERE auth_user_id = auth.uid();
    IF NEW.aprobado_por IS NULL THEN
      RAISE EXCEPTION 'No se pudo identificar al usuario que aprueba el informe.';
    END IF;
    NEW.aprobado_at := now();
  ELSE
    NEW.aprobado_por := NULL;
    NEW.aprobado_at := NULL;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
