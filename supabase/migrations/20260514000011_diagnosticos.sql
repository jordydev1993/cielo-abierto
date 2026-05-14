-- Diagnósticos: evaluaciones clínicas y psicológicas
CREATE TABLE IF NOT EXISTS diagnosticos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id           UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  tipo              VARCHAR(100) NOT NULL,
  descripcion       TEXT NOT NULL,
  fecha_diagnostico DATE NOT NULL DEFAULT CURRENT_DATE,
  profesional       VARCHAR(100),
  institucion       VARCHAR(150),
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnosticos_nnya ON diagnosticos(nnya_id);
