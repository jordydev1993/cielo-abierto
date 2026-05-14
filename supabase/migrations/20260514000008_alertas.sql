-- Alertas: notificaciones de seguimiento y urgencias
CREATE TABLE IF NOT EXISTS alertas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id           UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  titulo            VARCHAR(200) NOT NULL,
  descripcion       TEXT,
  tipo              VARCHAR(50) NOT NULL,
  prioridad         VARCHAR(20) NOT NULL DEFAULT 'media'
                    CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
  estado            VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'en_seguimiento', 'resuelta', 'vencida')),
  fecha_vencimiento DATE,
  completada_por    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_completada  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE alertas ADD COLUMN IF NOT EXISTS observacion_cierre TEXT;

CREATE INDEX IF NOT EXISTS idx_alertas_nnya   ON alertas(nnya_id);
CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas(estado) WHERE estado = 'pendiente';
