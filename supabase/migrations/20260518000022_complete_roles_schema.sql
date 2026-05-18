-- Agrega columnas faltantes a la tabla roles.
-- La migración 000001 solo definió id_rol/nombre/descripcion; estas columnas
-- son requeridas por el resto del sistema (types, hooks, UI) pero nunca se crearon.
ALTER TABLE roles ADD COLUMN IF NOT EXISTS activo     BOOLEAN     NOT NULL DEFAULT TRUE;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
