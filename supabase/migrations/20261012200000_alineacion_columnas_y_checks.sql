-- prompts/042: alineación de procesos, parte 1 (columnas y restricciones).
-- P6: motivo de ingreso del legajo (L-EX-15) y destinatario del informe (INF-EX-06).
-- P7: coherencia de fechas de la medicación (M-EX-04).
-- P8: el informe tiene solo dos estados, borrador y finalizado.
--
-- Datos verificados en producción el 2026-10-12 (solo lectura): 5 legajos y 4 informes sin
-- estos datos, 1 informe en 'revisado', 0 medicamentos con fecha_fin < fecha_inicio.

-- ---------------------------------------------------------------------------
-- P6 · legajos.motivo_ingreso
-- Obligatorio al abrir un legajo. Los 5 legajos existentes no lo tienen: por eso no es
-- NOT NULL ni un CHECK, que también se evaluaría al cerrar o editar un legajo viejo.
-- ---------------------------------------------------------------------------
ALTER TABLE public.legajos ADD COLUMN IF NOT EXISTS motivo_ingreso TEXT;

CREATE OR REPLACE FUNCTION public.fn_legajos_motivo_ingreso()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.motivo_ingreso IS NULL OR btrim(NEW.motivo_ingreso) = '' THEN
      RAISE EXCEPTION 'Para abrir el legajo hay que indicar el motivo de ingreso (L-EX-15).';
    END IF;
    RETURN NEW;
  END IF;

  -- Un legajo que tiene motivo no lo pierde, y uno que no está activo no lo cambia
  -- (complementa trg_legajos_reglas_estado, que no compara esta columna).
  IF OLD.motivo_ingreso IS NOT NULL AND (NEW.motivo_ingreso IS NULL OR btrim(NEW.motivo_ingreso) = '') THEN
    RAISE EXCEPTION 'El motivo de ingreso no se puede borrar (L-EX-15).';
  END IF;
  IF OLD.estado <> 'activo' AND NEW.motivo_ingreso IS DISTINCT FROM OLD.motivo_ingreso THEN
    RAISE EXCEPTION 'El legajo no está activo: no se puede cambiar el motivo de ingreso.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_legajos_motivo_ingreso ON public.legajos;
CREATE TRIGGER trg_legajos_motivo_ingreso
  BEFORE INSERT OR UPDATE ON public.legajos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_legajos_motivo_ingreso();

-- ---------------------------------------------------------------------------
-- P6 · informes.destinatario
-- Valores cerrados por CHECK (admite NULL para los 4 informes existentes);
-- obligatorio en los informes nuevos.
-- ---------------------------------------------------------------------------
ALTER TABLE public.informes ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20);

ALTER TABLE public.informes
  ADD CONSTRAINT chk_informes_destinatario
  CHECK (destinatario IS NULL OR destinatario IN ('SENAF', 'Juzgado', 'Interno'));

CREATE OR REPLACE FUNCTION public.fn_informes_exigir_destinatario()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.destinatario IS NULL THEN
    RAISE EXCEPTION 'El informe tiene que indicar el destinatario: SENAF, Juzgado o Interno (INF-EX-06).';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_informes_exigir_destinatario ON public.informes;
CREATE TRIGGER trg_informes_exigir_destinatario
  BEFORE INSERT ON public.informes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_informes_exigir_destinatario();

-- ---------------------------------------------------------------------------
-- P7 · medicamentos: la fecha de fin no es anterior a la de inicio (0 filas en conflicto)
-- ---------------------------------------------------------------------------
ALTER TABLE public.medicamentos
  ADD CONSTRAINT chk_medicamentos_fechas
  CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio);

-- ---------------------------------------------------------------------------
-- P8 · informes: se elimina el estado 'revisado' (ninguna pantalla lo usaba).
-- El único informe en ese estado vuelve a borrador (decisión de Jordy, 2026-10-12):
-- 'finalizado' lo habría vuelto no editable sin que nadie lo enviara.
-- ---------------------------------------------------------------------------
UPDATE public.informes SET estado = 'borrador', updated_at = NOW() WHERE estado = 'revisado';

ALTER TABLE public.informes DROP CONSTRAINT informes_estado_check;
ALTER TABLE public.informes
  ADD CONSTRAINT informes_estado_check
  CHECK (estado IN ('borrador', 'finalizado'));

-- Funciones de trigger: nadie las llama por RPC (mismo criterio que prompts/038).
REVOKE EXECUTE ON FUNCTION public.fn_legajos_motivo_ingreso()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_informes_exigir_destinatario() FROM PUBLIC, anon, authenticated;
