-- FASE A0 (AGENTS.md sección 11): fecha de egreso como dato de primera clase en nnya,
-- reemplaza la inferencia frágil vía nnya.estado_actual + legajos.fecha_cierre.
-- Ver prompts/011-fecha-egreso-nnya.md para el análisis completo.

-- 1. Columna nueva
ALTER TABLE nnya ADD COLUMN fecha_egreso DATE NULL;

-- 2. Backfill: legajo más reciente por fecha_cierre por NNyA (desambigua el caso
--    hipotético de varios legajos cerrados; hoy no ocurre en los datos)
UPDATE nnya n
SET fecha_egreso = l.fecha_cierre
FROM (
  SELECT DISTINCT ON (nnya_id) nnya_id, fecha_cierre
  FROM legajos
  WHERE fecha_cierre IS NOT NULL
  ORDER BY nnya_id, fecha_cierre DESC
) l
WHERE l.nnya_id = n.id
  AND n.estado_actual = 'Egresado';

-- 3. Salvaguarda: si el backfill deja algún 'Egresado' sin fecha resuelta, abortar
--    la migración entera (no llegar a aplicar el CHECK sobre datos inconsistentes)
DO $$
DECLARE
  n_inconsistentes INT;
BEGIN
  SELECT count(*) INTO n_inconsistentes
  FROM nnya WHERE estado_actual = 'Egresado' AND fecha_egreso IS NULL;

  IF n_inconsistentes > 0 THEN
    RAISE EXCEPTION
      'Backfill incompleto: % NNyA en estado Egresado sin fecha_egreso resuelta. No se aplica el CHECK.',
      n_inconsistentes;
  END IF;
END $$;

-- 4. Constraint de coherencia (solo se llega acá si el paso 3 no abortó)
ALTER TABLE nnya ADD CONSTRAINT chk_nnya_fecha_egreso_coherente
  CHECK ((estado_actual = 'Egresado') = (fecha_egreso IS NOT NULL));
