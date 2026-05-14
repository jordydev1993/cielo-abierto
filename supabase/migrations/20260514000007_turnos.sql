-- Turnos: citas médicas, psicológicas y de otros profesionales
CREATE TABLE IF NOT EXISTS turnos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id      UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  tipo         VARCHAR(50) NOT NULL,
  fecha_hora   TIMESTAMPTZ NOT NULL,
  lugar        VARCHAR(200),
  profesional  VARCHAR(100),
  motivo       TEXT,
  estado       VARCHAR(30) NOT NULL DEFAULT 'programado'
               CHECK (estado IN ('programado', 'confirmado', 'realizado', 'cancelado', 'ausente')),
  observaciones TEXT,
  created_by   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turnos_nnya      ON turnos(nnya_id);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha_hora ON turnos(fecha_hora);
