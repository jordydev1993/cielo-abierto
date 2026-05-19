-- Asegura que el FK entre usuarios.rol_id y roles.id exista con nombre conocido.
-- PostgREST necesita el constraint para resolver joins embebidos ('*, roles(nombre)').
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usuarios_rol_id_fkey'
      AND conrelid = 'usuarios'::regclass
  ) THEN
    ALTER TABLE usuarios
      ADD CONSTRAINT usuarios_rol_id_fkey
      FOREIGN KEY (rol_id) REFERENCES roles(id);
  END IF;
END $$;
