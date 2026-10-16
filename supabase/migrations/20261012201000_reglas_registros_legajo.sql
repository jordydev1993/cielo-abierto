-- prompts/042: alineación de procesos, parte 2 (P3, resto).
-- Lleva a la base dos reglas que hasta ahora solo hacía cumplir la interfaz:
--   1. Un legajo que no está activo no admite registros nuevos ni cambios (L-EX-09, L-EX-10 y
--      las equivalentes por entidad: T-EX-04/05, I-EX-02/05, INF-EX-04, DGN-EX-04, M-EX-03/05,
--      D-EX-05, AJ-EX-03).
--   2. Los estados terminales no se modifican: alerta completada (A-EX-05), diagnóstico resuelto,
--      medicación finalizada, informe enviado (INF-EX-05) e incidente cerrado.
-- Las reglas de estado del propio legajo ya están en trg_legajos_reglas_estado (prompts/037).
--
-- Solo actúan sobre escrituras nuevas: las filas que ya existen en legajos no activos
-- (verificado el 2026-10-12: 1 turno, 1 informe, 1 audiencia) quedan de solo lectura.
--
-- Excepción: las actualizaciones que dispara otra operación de la base (por ejemplo un
-- ON DELETE SET NULL al borrar un usuario) llegan con pg_trigger_depth() > 1 y no se bloquean.
-- La app nunca borra usuarios (baja lógica), pero así una acción en cascada no queda trabada.

-- ---------------------------------------------------------------------------
-- 1. Legajo activo para registrar
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_exigir_legajo_activo()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_estado_nuevo    TEXT;
  v_estado_anterior TEXT;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  SELECT estado INTO v_estado_nuevo FROM legajos WHERE id = NEW.legajo_id;
  IF v_estado_nuevo IS DISTINCT FROM 'activo' THEN
    RAISE EXCEPTION 'El legajo no está activo: no admite registros nuevos ni cambios (L-EX-09).';
  END IF;

  -- Un registro de un legajo cerrado tampoco se puede "mudar" a otro legajo para editarlo.
  IF TG_OP = 'UPDATE' AND NEW.legajo_id IS DISTINCT FROM OLD.legajo_id THEN
    SELECT estado INTO v_estado_anterior FROM legajos WHERE id = OLD.legajo_id;
    IF v_estado_anterior IS DISTINCT FROM 'activo' THEN
      RAISE EXCEPTION 'El legajo no está activo: no admite registros nuevos ni cambios (L-EX-09).';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_turnos_exigir_legajo_activo ON public.turnos;
CREATE TRIGGER trg_turnos_exigir_legajo_activo
  BEFORE INSERT OR UPDATE ON public.turnos
  FOR EACH ROW EXECUTE FUNCTION public.fn_exigir_legajo_activo();

DROP TRIGGER IF EXISTS trg_incidentes_exigir_legajo_activo ON public.incidentes;
CREATE TRIGGER trg_incidentes_exigir_legajo_activo
  BEFORE INSERT OR UPDATE ON public.incidentes
  FOR EACH ROW EXECUTE FUNCTION public.fn_exigir_legajo_activo();

DROP TRIGGER IF EXISTS trg_informes_exigir_legajo_activo ON public.informes;
CREATE TRIGGER trg_informes_exigir_legajo_activo
  BEFORE INSERT OR UPDATE ON public.informes
  FOR EACH ROW EXECUTE FUNCTION public.fn_exigir_legajo_activo();

DROP TRIGGER IF EXISTS trg_diagnosticos_exigir_legajo_activo ON public.diagnosticos;
CREATE TRIGGER trg_diagnosticos_exigir_legajo_activo
  BEFORE INSERT OR UPDATE ON public.diagnosticos
  FOR EACH ROW EXECUTE FUNCTION public.fn_exigir_legajo_activo();

DROP TRIGGER IF EXISTS trg_medicamentos_exigir_legajo_activo ON public.medicamentos;
CREATE TRIGGER trg_medicamentos_exigir_legajo_activo
  BEFORE INSERT OR UPDATE ON public.medicamentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_exigir_legajo_activo();

DROP TRIGGER IF EXISTS trg_documentos_exigir_legajo_activo ON public.documentos;
CREATE TRIGGER trg_documentos_exigir_legajo_activo
  BEFORE INSERT OR UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_exigir_legajo_activo();

DROP TRIGGER IF EXISTS trg_audiencias_exigir_legajo_activo ON public.audiencias_judiciales;
CREATE TRIGGER trg_audiencias_exigir_legajo_activo
  BEFORE INSERT OR UPDATE ON public.audiencias_judiciales
  FOR EACH ROW EXECUTE FUNCTION public.fn_exigir_legajo_activo();

-- ---------------------------------------------------------------------------
-- 2. Estados terminales
-- El estado terminal de cada tabla llega como argumento del trigger (TG_ARGV[0]).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_bloquear_estado_terminal()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF OLD.estado = TG_ARGV[0] THEN
    RAISE EXCEPTION 'El registro está en estado "%" y ya no admite cambios.', TG_ARGV[0];
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alertas_estado_terminal ON public.alertas;
CREATE TRIGGER trg_alertas_estado_terminal
  BEFORE UPDATE ON public.alertas
  FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_estado_terminal('completada');

DROP TRIGGER IF EXISTS trg_diagnosticos_estado_terminal ON public.diagnosticos;
CREATE TRIGGER trg_diagnosticos_estado_terminal
  BEFORE UPDATE ON public.diagnosticos
  FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_estado_terminal('resuelto');

DROP TRIGGER IF EXISTS trg_medicamentos_estado_terminal ON public.medicamentos;
CREATE TRIGGER trg_medicamentos_estado_terminal
  BEFORE UPDATE ON public.medicamentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_estado_terminal('finalizado');

DROP TRIGGER IF EXISTS trg_informes_estado_terminal ON public.informes;
CREATE TRIGGER trg_informes_estado_terminal
  BEFORE UPDATE ON public.informes
  FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_estado_terminal('finalizado');

DROP TRIGGER IF EXISTS trg_incidentes_estado_terminal ON public.incidentes;
CREATE TRIGGER trg_incidentes_estado_terminal
  BEFORE UPDATE ON public.incidentes
  FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_estado_terminal('cerrado');

-- Funciones de trigger: nadie las llama por RPC (mismo criterio que prompts/038).
REVOKE EXECUTE ON FUNCTION public.fn_exigir_legajo_activo()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_bloquear_estado_terminal() FROM PUBLIC, anon, authenticated;
