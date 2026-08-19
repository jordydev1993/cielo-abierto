-- ============================================================
-- SCHEMA COMPLETO CIELO ABIERTO — versión limpia y consolidada
-- Reemplaza las migraciones 001-030 en una DB nueva.
-- ============================================================

-- ── EXTENSIONES ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. ROLES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (nombre, descripcion) VALUES
  ('Admin',          'Acceso total al sistema'),
  ('Equipo Tecnico', 'Profesionales técnicos: psicólogos, trabajadores sociales y personal de planta')
ON CONFLICT (nombre) DO NOTHING;

-- ── 2. USUARIOS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       VARCHAR(100) NOT NULL,
  apellido     VARCHAR(100) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  telefono     VARCHAR(20),
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  rol_id       UUID NOT NULL REFERENCES roles(id),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. NNyA ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nnya (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre             VARCHAR(100) NOT NULL,
  apellido           VARCHAR(100) NOT NULL,
  dni                VARCHAR(20) UNIQUE NOT NULL,
  fecha_nacimiento   DATE NOT NULL,
  lugar_nacimiento   VARCHAR(150),
  nacionalidad       VARCHAR(100),
  genero             VARCHAR(30),
  domicilio          TEXT,
  telefono           VARCHAR(20),
  email              VARCHAR(255),
  escolaridad        VARCHAR(100),
  obra_social        VARCHAR(100),
  numero_expediente  VARCHAR(50),
  activo             BOOLEAN NOT NULL DEFAULT TRUE,
  estado_actual      VARCHAR(50) NOT NULL DEFAULT 'En residencia'
                     CHECK (estado_actual IN ('En residencia','En proceso de egreso','Egresado','Fallecido')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. TUTORES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(100) NOT NULL,
  apellido    VARCHAR(100) NOT NULL,
  dni         VARCHAR(20) UNIQUE NOT NULL,
  telefono    VARCHAR(20),
  email       VARCHAR(255),
  domicilio   TEXT,
  parentesco  VARCHAR(50) NOT NULL,
  ocupacion   VARCHAR(100),
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. NNyA ↔ TUTORES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nnya_tutores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id     UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  tutor_id    UUID NOT NULL REFERENCES tutores(id) ON DELETE CASCADE,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nnya_id, tutor_id)
);

-- ── 6. LEGAJOS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legajos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id        UUID NOT NULL REFERENCES nnya(id) ON DELETE RESTRICT,
  numero_legajo  VARCHAR(50) NOT NULL UNIQUE,
  fecha_apertura DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_cierre   DATE,
  estado         VARCHAR(20) NOT NULL DEFAULT 'activo'
                 CHECK (estado IN ('activo','cerrado','archivado')),
  motivo_cierre  TEXT,
  observaciones  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_legajo_activo_por_nnya
  ON legajos(nnya_id) WHERE estado = 'activo';

-- ── 7. INTERVENCIONES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intervenciones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id        UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  tipo           VARCHAR(50) NOT NULL,
  descripcion    TEXT NOT NULL,
  fecha          DATE NOT NULL DEFAULT CURRENT_DATE,
  profesional_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  estado         VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente','en_curso','cerrada')),
  resultado      TEXT,
  observaciones  TEXT,
  created_by     UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. TURNOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS turnos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id       UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  legajo_id     UUID REFERENCES legajos(id) ON DELETE CASCADE,
  tipo          VARCHAR(50) NOT NULL,
  fecha_hora    TIMESTAMPTZ NOT NULL,
  lugar         VARCHAR(200),
  profesional   VARCHAR(100),
  motivo        TEXT,
  estado        VARCHAR(30) NOT NULL DEFAULT 'programado'
                CHECK (estado IN ('programado','confirmado','realizado','cancelado','ausente')),
  observaciones TEXT,
  created_by    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turnos_nnya      ON turnos(nnya_id);
CREATE INDEX IF NOT EXISTS idx_turnos_legajo    ON turnos(legajo_id);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha_hora ON turnos(fecha_hora);

-- ── 9. ALERTAS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alertas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id           UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  titulo            VARCHAR(200) NOT NULL,
  descripcion       TEXT,
  tipo              VARCHAR(50) NOT NULL,
  prioridad         VARCHAR(20) NOT NULL DEFAULT 'media'
                    CHECK (prioridad IN ('baja','media','alta','critica')),
  estado            VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','en_proceso','completada','vencida')),
  fecha_vencimiento DATE,
  completada_por    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_completada  DATE,
  observacion_cierre TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_nnya   ON alertas(nnya_id);
CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas(estado) WHERE estado = 'pendiente';

-- ── 10. ACTIVIDADES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS actividades (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo         VARCHAR(200) NOT NULL,
  descripcion    TEXT,
  tipo           VARCHAR(50) NOT NULL,
  fecha          DATE NOT NULL,
  hora_inicio    TIME,
  hora_fin       TIME,
  lugar          VARCHAR(200),
  responsable_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  nnya_ids       UUID[] NOT NULL DEFAULT '{}',
  estado         VARCHAR(20) NOT NULL DEFAULT 'programada'
                 CHECK (estado IN ('programada','en_curso','realizada','cancelada')),
  observaciones  TEXT,
  created_by     UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 11. INCIDENTES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidentes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id             UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  legajo_id           UUID REFERENCES legajos(id) ON DELETE CASCADE,
  tipo                VARCHAR(50) NOT NULL,
  descripcion         TEXT NOT NULL,
  fecha_hora          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gravedad            VARCHAR(20) NOT NULL DEFAULT 'media'
                      CHECK (gravedad IN ('leve','media','grave','critico')),
  reportado_por       UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  acciones_tomadas    TEXT,
  estado              VARCHAR(20) NOT NULL DEFAULT 'abierto'
                      CHECK (estado IN ('abierto','en_seguimiento','cerrado')),
  gravedad_sugerida   VARCHAR(20),
  sugerencia_aceptada BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidentes_nnya   ON incidentes(nnya_id);
CREATE INDEX IF NOT EXISTS idx_incidentes_legajo ON incidentes(legajo_id);

-- ── 12. DIAGNÓSTICOS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diagnosticos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id           UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  legajo_id         UUID REFERENCES legajos(id) ON DELETE CASCADE,
  tipo              VARCHAR(100) NOT NULL,
  descripcion       TEXT NOT NULL,
  fecha_diagnostico DATE NOT NULL DEFAULT CURRENT_DATE,
  profesional       VARCHAR(100),
  institucion       VARCHAR(150),
  estado            VARCHAR(20) NOT NULL DEFAULT 'activo'
                    CHECK (estado IN ('activo','en_seguimiento','resuelto')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnosticos_nnya   ON diagnosticos(nnya_id);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_legajo ON diagnosticos(legajo_id);

-- ── 13. MEDICAMENTOS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicamentos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id             UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  legajo_id           UUID REFERENCES legajos(id) ON DELETE CASCADE,
  diagnostico_id      UUID REFERENCES diagnosticos(id) ON DELETE SET NULL,
  nombre              VARCHAR(100) NOT NULL,
  dosis               VARCHAR(50) NOT NULL,
  frecuencia          VARCHAR(100) NOT NULL,
  via_administracion  VARCHAR(50),
  prescriptor         VARCHAR(100),
  fecha_inicio        DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin           DATE,
  estado              VARCHAR(20) NOT NULL DEFAULT 'en_curso'
                      CHECK (estado IN ('en_curso','finalizado')),
  observaciones       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicamentos_nnya        ON medicamentos(nnya_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_legajo      ON medicamentos(legajo_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_diagnostico ON medicamentos(diagnostico_id);

-- ── 14. INFORMES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS informes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id       UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  legajo_id     UUID REFERENCES legajos(id) ON DELETE CASCADE,
  tipo          VARCHAR(50) NOT NULL,
  titulo        VARCHAR(200) NOT NULL,
  contenido     TEXT NOT NULL,
  elaborado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_informe DATE NOT NULL DEFAULT CURRENT_DATE,
  estado        VARCHAR(30) NOT NULL DEFAULT 'borrador'
                CHECK (estado IN ('borrador','revisado','finalizado')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_informes_nnya   ON informes(nnya_id);
CREATE INDEX IF NOT EXISTS idx_informes_legajo ON informes(legajo_id);

-- ── 15. DOCUMENTOS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documentos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id       UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  legajo_id     UUID REFERENCES legajos(id) ON DELETE CASCADE,
  nombre        VARCHAR(200) NOT NULL,
  tipo          VARCHAR(50) NOT NULL,
  url           VARCHAR(500) NOT NULL,
  storage_path  VARCHAR(500) NOT NULL,
  tamaño_bytes  BIGINT,
  mime_type     VARCHAR(100),
  subido_por    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documentos_nnya   ON documentos(nnya_id);
CREATE INDEX IF NOT EXISTS idx_documentos_legajo ON documentos(legajo_id);

-- ── 16. AUDIENCIAS JUDICIALES ────────────────────────────────
CREATE TABLE IF NOT EXISTS audiencias_judiciales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id           UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  legajo_id         UUID REFERENCES legajos(id) ON DELETE CASCADE,
  fecha_hora        TIMESTAMPTZ NOT NULL,
  tribunal          VARCHAR(200) NOT NULL,
  juzgado           VARCHAR(200),
  caratula          VARCHAR(300),
  numero_expediente VARCHAR(50),
  tipo              VARCHAR(50) NOT NULL,
  resultado         TEXT,
  observaciones     TEXT,
  estado            VARCHAR(20) NOT NULL DEFAULT 'programada'
                    CHECK (estado IN ('programada','realizada','suspendida','cancelada')),
  created_by        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audiencias_nnya      ON audiencias_judiciales(nnya_id);
CREATE INDEX IF NOT EXISTS idx_audiencias_legajo    ON audiencias_judiciales(legajo_id);
CREATE INDEX IF NOT EXISTS idx_audiencias_fecha_hora ON audiencias_judiciales(fecha_hora);

-- ── 17. AUDIT LOG ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla       VARCHAR(100) NOT NULL,
  operacion   VARCHAR(10) NOT NULL,
  registro_id UUID,
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  datos_antes JSONB,
  datos_despues JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 18. FUNCIÓN get_my_role() ────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE r.nombre
    WHEN 'Direccion' THEN 'Admin'
    ELSE r.nombre
  END
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
  WHERE u.auth_user_id = auth.uid()
    AND u.activo = TRUE
  LIMIT 1;
$$;

-- ── 19. RLS: habilitar en todas las tablas ───────────────────
ALTER TABLE roles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE nnya                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE nnya_tutores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE legajos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervenciones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades           ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidentes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosticos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicamentos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE informes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audiencias_judiciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log             ENABLE ROW LEVEL SECURITY;

-- ── 20. RLS POLICIES ─────────────────────────────────────────

-- roles: Admin gestiona, todos los autenticados leen
CREATE POLICY "roles_admin_all" ON roles
  FOR ALL TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "roles_select_all" ON roles
  FOR SELECT TO authenticated
  USING (true);

-- usuarios: Admin gestiona, cada usuario se ve a sí mismo
CREATE POLICY "usuarios_admin_all" ON usuarios
  FOR ALL TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "usuarios_self_read" ON usuarios
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- nnya
CREATE POLICY "nnya_admin_tecnico_all" ON nnya
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- tutores
CREATE POLICY "tutores_admin_tecnico_all" ON tutores
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "nnya_tutores_admin_tecnico_all" ON nnya_tutores
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- legajos
CREATE POLICY "legajos_admin_tecnico_all" ON legajos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- intervenciones
CREATE POLICY "intervenciones_admin_tecnico_all" ON intervenciones
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- turnos
CREATE POLICY "turnos_admin_tecnico_all" ON turnos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- alertas
CREATE POLICY "alertas_admin_tecnico_all" ON alertas
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- actividades
CREATE POLICY "actividades_admin_tecnico_all" ON actividades
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- incidentes
CREATE POLICY "incidentes_admin_tecnico_all" ON incidentes
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- diagnósticos
CREATE POLICY "diagnosticos_admin_tecnico_all" ON diagnosticos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- medicamentos
CREATE POLICY "medicamentos_admin_tecnico_all" ON medicamentos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- informes
CREATE POLICY "informes_admin_tecnico_all" ON informes
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- documentos
CREATE POLICY "documentos_admin_tecnico_all" ON documentos
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- audiencias
CREATE POLICY "audiencias_admin_tecnico_all" ON audiencias_judiciales
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- audit_log: solo Admin lee, sistema inserta
CREATE POLICY "audit_log_admin_read" ON audit_log
  FOR SELECT TO authenticated
  USING (get_my_role() = 'Admin');

-- ── 21. TRIGGER: alerta automática por incidente grave/crítico ─
CREATE OR REPLACE FUNCTION fn_crear_alerta_incidente_grave()
RETURNS TRIGGER AS $$
DECLARE
  v_prioridad VARCHAR(20);
BEGIN
  IF NEW.gravedad IN ('grave','critico') THEN
    v_prioridad := CASE NEW.gravedad
      WHEN 'critico' THEN 'critica'
      ELSE 'alta'
    END;

    INSERT INTO alertas (
      nnya_id, titulo, descripcion, tipo, prioridad, estado, fecha_vencimiento
    ) VALUES (
      NEW.nnya_id,
      'Incidente ' || initcap(NEW.gravedad) || ': ' || left(NEW.descripcion, 100),
      'Incidente registrado el ' || to_char(NEW.fecha_hora, 'DD/MM/YYYY HH24:MI') ||
        '. Tipo: ' || NEW.tipo || '. Requiere seguimiento inmediato.',
      'incidente',
      v_prioridad,
      'pendiente',
      (CURRENT_DATE + INTERVAL '3 days')::DATE
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_alerta_incidente_grave ON incidentes;
CREATE TRIGGER trg_alerta_incidente_grave
  AFTER INSERT ON incidentes
  FOR EACH ROW
  EXECUTE FUNCTION fn_crear_alerta_incidente_grave();

-- ── 22. STORAGE: bucket privado documentos ───────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos', 'documentos', FALSE, 10485760,
  ARRAY[
    'application/pdf','image/jpeg','image/png','image/webp','image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "documentos_select_authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documentos');

CREATE POLICY "documentos_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "documentos_delete_authenticated" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'documentos');
