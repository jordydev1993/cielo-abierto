-- Informes: documentos técnicos elaborados por el equipo
CREATE TABLE IF NOT EXISTS informes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id       UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  tipo          VARCHAR(50) NOT NULL,
  titulo        VARCHAR(200) NOT NULL,
  contenido     TEXT NOT NULL,
  elaborado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_informe DATE NOT NULL DEFAULT CURRENT_DATE,
  estado        VARCHAR(30) NOT NULL DEFAULT 'borrador'
                CHECK (estado IN ('borrador', 'revisado', 'finalizado')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_informes_nnya ON informes(nnya_id);
