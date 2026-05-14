-- Audiencias judiciales: citaciones y resoluciones del poder judicial
CREATE TABLE IF NOT EXISTS audiencias_judiciales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id           UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  fecha_hora        TIMESTAMPTZ NOT NULL,
  tribunal          VARCHAR(200) NOT NULL,
  juzgado           VARCHAR(200),
  caratula          VARCHAR(300),
  numero_expediente VARCHAR(50),
  tipo              VARCHAR(50) NOT NULL,
  resultado         TEXT,
  observaciones     TEXT,
  estado            VARCHAR(20) NOT NULL DEFAULT 'programada'
                    CHECK (estado IN ('programada', 'realizada', 'postergada', 'cancelada')),
  created_by        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audiencias_nnya      ON audiencias_judiciales(nnya_id);
CREATE INDEX IF NOT EXISTS idx_audiencias_fecha_hora ON audiencias_judiciales(fecha_hora);
