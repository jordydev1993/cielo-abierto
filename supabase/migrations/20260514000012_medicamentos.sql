-- Medicamentos: prescripciones y tratamientos farmacológicos activos
CREATE TABLE IF NOT EXISTS medicamentos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id             UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  nombre              VARCHAR(100) NOT NULL,
  dosis               VARCHAR(50) NOT NULL,
  frecuencia          VARCHAR(100) NOT NULL,
  via_administracion  VARCHAR(50),
  prescriptor         VARCHAR(100),
  fecha_inicio        DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin           DATE,
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  observaciones       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicamentos_nnya ON medicamentos(nnya_id);
