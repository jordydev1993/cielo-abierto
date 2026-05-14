-- Legajos: expediente activo de cada NNyA (máximo 1 activo por NNyA)
CREATE TABLE IF NOT EXISTS legajos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id        UUID NOT NULL REFERENCES nnya(id) ON DELETE RESTRICT,
  numero_legajo  VARCHAR(50) NOT NULL,
  fecha_apertura DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_cierre   DATE,
  estado         VARCHAR(20) NOT NULL DEFAULT 'activo'
                 CHECK (estado IN ('activo', 'cerrado', 'archivado')),
  motivo_cierre  TEXT,
  observaciones  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garantiza 1 legajo activo por NNyA a nivel DB
CREATE UNIQUE INDEX IF NOT EXISTS uq_legajo_activo_por_nnya
  ON legajos(nnya_id) WHERE estado = 'activo';

CREATE INDEX IF NOT EXISTS idx_legajos_nnya ON legajos(nnya_id);
