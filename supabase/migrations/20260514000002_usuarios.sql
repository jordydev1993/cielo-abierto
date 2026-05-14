-- Entidad maestra: Usuarios del sistema
-- La contraseña la gestiona Supabase Auth; esta tabla guarda el perfil.
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       VARCHAR(100) NOT NULL,
  apellido     VARCHAR(100) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  telefono     VARCHAR(20),
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  id_rol       INTEGER NOT NULL REFERENCES roles(id_rol),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Si la tabla ya existía sin auth_user_id, agregamos la columna
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono    VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo      BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Índice para resolver rol rápidamente desde auth.uid()
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);
