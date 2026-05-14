-- Tutores/Familiares de NNyA con tabla puente N:M
CREATE TABLE IF NOT EXISTS tutores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     VARCHAR(100) NOT NULL,
  apellido   VARCHAR(100) NOT NULL,
  dni        VARCHAR(20) NOT NULL,
  telefono   VARCHAR(20),
  email      VARCHAR(255),
  domicilio  TEXT,
  parentesco VARCHAR(50) NOT NULL,
  ocupacion  VARCHAR(100),
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nnya_tutores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id      UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  tutor_id     UUID NOT NULL REFERENCES tutores(id) ON DELETE CASCADE,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nnya_id, tutor_id)
);

CREATE INDEX IF NOT EXISTS idx_nnya_tutores_nnya ON nnya_tutores(nnya_id);
