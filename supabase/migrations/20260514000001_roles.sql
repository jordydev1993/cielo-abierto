-- Entidad maestra: Roles del sistema
CREATE TABLE IF NOT EXISTS roles (
  id_rol      SERIAL PRIMARY KEY,
  nombre      VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT
);

-- Roles iniciales del sistema
INSERT INTO roles (nombre, descripcion) VALUES
  ('Admin',          'Acceso total al sistema'),
  ('Equipo Tecnico', 'Profesionales técnicos: psicólogos, trabajadores sociales'),
  ('Educador',       'Personal educativo de planta')
ON CONFLICT (nombre) DO NOTHING;
