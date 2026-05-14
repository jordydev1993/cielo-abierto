-- NNyA: Niños, Niñas y Adolescentes — entidad central del sistema
CREATE TABLE IF NOT EXISTS nnya (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            VARCHAR(100) NOT NULL,
  apellido          VARCHAR(100) NOT NULL,
  dni               VARCHAR(20) UNIQUE NOT NULL,
  fecha_nacimiento  DATE NOT NULL,
  lugar_nacimiento  VARCHAR(100),
  nacionalidad      VARCHAR(100) DEFAULT 'Argentina',
  genero            VARCHAR(20),
  domicilio         TEXT,
  telefono          VARCHAR(20),
  email             VARCHAR(255),
  escolaridad       VARCHAR(100),
  obra_social       VARCHAR(100),
  numero_expediente VARCHAR(50),
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE nnya ADD COLUMN IF NOT EXISTS estado_actual VARCHAR(50) NOT NULL DEFAULT 'En residencia'
  CHECK (estado_actual IN ('En residencia', 'En proceso de egreso', 'Egresado', 'Fallecido'));

CREATE INDEX IF NOT EXISTS idx_nnya_activo ON nnya(activo);
CREATE INDEX IF NOT EXISTS idx_nnya_dni   ON nnya(dni);
