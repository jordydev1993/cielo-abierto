-- Columnas faltantes que no fueron aplicadas en migraciones anteriores

-- nnya: estado actual del NNyA en la residencia
ALTER TABLE nnya ADD COLUMN IF NOT EXISTS estado_actual VARCHAR(50) NOT NULL DEFAULT 'En residencia';

ALTER TABLE nnya DROP CONSTRAINT IF EXISTS nnya_estado_actual_check;
ALTER TABLE nnya ADD CONSTRAINT nnya_estado_actual_check
  CHECK (estado_actual IN ('En residencia', 'En proceso de egreso', 'Egresado', 'Fallecido'));

-- alertas: observación al cerrar/resolver la alerta
ALTER TABLE alertas ADD COLUMN IF NOT EXISTS observacion_cierre TEXT;

-- documentos: timestamp de última modificación
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- legajos: índice parcial para garantizar 1 activo por NNyA
CREATE UNIQUE INDEX IF NOT EXISTS uq_legajo_activo_por_nnya
  ON legajos(nnya_id) WHERE estado = 'activo';
