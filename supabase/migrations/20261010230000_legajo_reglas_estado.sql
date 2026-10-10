-- prompts/037: reglas de estado del legajo en la base (opción A) y cierre de incidentes con acciones.
-- El legajo nace activo; solo pasa de activo a cerrado (con motivo) y de cerrado a archivado
-- (12 meses después del cierre); nunca se reactiva, y cerrado o archivado es de solo lectura.

CREATE OR REPLACE FUNCTION public.fn_legajos_reglas_estado()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.estado <> 'activo' THEN
      RAISE EXCEPTION 'Un legajo se abre siempre en estado activo.';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.estado = 'archivado' THEN
    RAISE EXCEPTION 'El legajo está archivado: no admite modificaciones.';
  END IF;

  IF OLD.estado = 'cerrado' THEN
    IF NEW.estado <> 'archivado' THEN
      RAISE EXCEPTION 'El legajo está cerrado: solo se puede archivar, no reactivar ni modificar.';
    END IF;
    IF (NEW.nnya_id, NEW.numero_legajo, NEW.fecha_apertura, NEW.fecha_cierre, NEW.motivo_cierre, NEW.observaciones)
       IS DISTINCT FROM
       (OLD.nnya_id, OLD.numero_legajo, OLD.fecha_apertura, OLD.fecha_cierre, OLD.motivo_cierre, OLD.observaciones) THEN
      RAISE EXCEPTION 'El legajo está cerrado: al archivarlo no se pueden cambiar sus datos.';
    END IF;
    IF OLD.fecha_cierre IS NULL THEN
      RAISE EXCEPTION 'El legajo no tiene fecha de cierre: no se puede calcular cuándo archivarlo.';
    END IF;
    IF OLD.fecha_cierre > CURRENT_DATE - INTERVAL '12 months' THEN
      RAISE EXCEPTION 'Un legajo se puede archivar recién 12 meses después del cierre (desde el %).',
        to_char(OLD.fecha_cierre + INTERVAL '12 months', 'DD/MM/YYYY');
    END IF;
    RETURN NEW;
  END IF;

  -- Desde activo
  IF NEW.estado = 'archivado' THEN
    RAISE EXCEPTION 'Un legajo activo no se puede archivar: primero hay que cerrarlo.';
  END IF;
  IF NEW.estado = 'cerrado' THEN
    IF NEW.motivo_cierre IS NULL OR btrim(NEW.motivo_cierre) = '' THEN
      RAISE EXCEPTION 'Para cerrar el legajo hay que indicar el motivo de cierre.';
    END IF;
    NEW.fecha_cierre := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_legajos_reglas_estado ON public.legajos;
CREATE TRIGGER trg_legajos_reglas_estado
  BEFORE INSERT OR UPDATE ON public.legajos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_legajos_reglas_estado();

-- Un legajo nunca se borra: se cierra con motivo. Las FKs de legajo_id ya son RESTRICT
-- (prompts/036), pero un legajo sin registros asociados todavía se podía borrar.
CREATE OR REPLACE FUNCTION public.fn_legajos_prohibir_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Un legajo no se puede eliminar: si ya no corresponde, hay que cerrarlo con motivo.';
END;
$$;

DROP TRIGGER IF EXISTS trg_legajos_prohibir_delete ON public.legajos;
CREATE TRIGGER trg_legajos_prohibir_delete
  BEFORE DELETE ON public.legajos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_legajos_prohibir_delete();

-- Un incidente solo se cierra con las acciones tomadas registradas.
-- Verificado el 10/10: los 2 incidentes cerrados de producción ya las tienen.
ALTER TABLE public.incidentes
  ADD CONSTRAINT chk_incidente_cerrado_con_acciones
  CHECK (estado <> 'cerrado' OR (acciones_tomadas IS NOT NULL AND btrim(acciones_tomadas) <> ''));
