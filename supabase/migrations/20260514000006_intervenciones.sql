-- Intervenciones: acciones profesionales sobre el caso de un NNyA
CREATE TABLE IF NOT EXISTS intervenciones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id        UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  tipo           VARCHAR(50) NOT NULL
                 CHECK (tipo IN ('Judicial', 'Social', 'Psicologica', 'Medica', 'Educativa', 'Familiar', 'Otra')),
  descripcion    TEXT NOT NULL,
  fecha          DATE NOT NULL DEFAULT CURRENT_DATE,
  profesional_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  estado         VARCHAR(30) NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente', 'en_curso', 'cerrada')),
  resultado      TEXT,
  observaciones  TEXT,
  created_by     UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intervenciones_nnya ON intervenciones(nnya_id);
