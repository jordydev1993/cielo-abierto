-- Actividades: talleres, salidas y eventos grupales o individuales
CREATE TABLE IF NOT EXISTS actividades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        VARCHAR(200) NOT NULL,
  descripcion   TEXT,
  tipo          VARCHAR(50) NOT NULL,
  fecha         DATE NOT NULL,
  hora_inicio   TIME,
  hora_fin      TIME,
  lugar         VARCHAR(200),
  responsable_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  nnya_ids      UUID[] DEFAULT '{}',
  estado        VARCHAR(30) NOT NULL DEFAULT 'programada'
                CHECK (estado IN ('programada', 'en_curso', 'realizada', 'cancelada')),
  observaciones TEXT,
  created_by    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actividades_fecha ON actividades(fecha);
