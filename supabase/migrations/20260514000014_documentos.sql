-- Documentos: archivos adjuntos almacenados en Supabase Storage
CREATE TABLE IF NOT EXISTS documentos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id      UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  nombre       VARCHAR(200) NOT NULL,
  tipo         VARCHAR(50) NOT NULL,
  url          VARCHAR(500) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  tamaño_bytes BIGINT,
  mime_type    VARCHAR(100),
  subido_por   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE documentos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_documentos_nnya ON documentos(nnya_id);
