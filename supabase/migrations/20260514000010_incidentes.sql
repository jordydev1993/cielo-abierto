-- Incidentes: eventos adversos, conflictos o situaciones de riesgo
CREATE TABLE IF NOT EXISTS incidentes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id          UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  tipo             VARCHAR(50) NOT NULL,
  descripcion      TEXT NOT NULL,
  fecha_hora       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gravedad         VARCHAR(20) NOT NULL DEFAULT 'media'
                   CHECK (gravedad IN ('leve', 'media', 'grave', 'critica')),
  reportado_por    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  acciones_tomadas TEXT,
  estado           VARCHAR(20) NOT NULL DEFAULT 'abierto'
                   CHECK (estado IN ('abierto', 'en_seguimiento', 'cerrado')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidentes_nnya ON incidentes(nnya_id);
