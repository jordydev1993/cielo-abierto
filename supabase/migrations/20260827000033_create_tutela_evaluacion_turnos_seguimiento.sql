-- FASE A1 (AGENTS.md sección 11): 10 tablas nuevas para tutela/revinculación (1.1, 1.5),
-- evaluación institucional (1.8) y acompañamiento diario (1.3).
-- Ver prompts/012-tutela-evaluacion-turnos-seguimiento.md para el análisis completo,
-- incluyendo las 4 desviaciones respecto al prompt original documentadas ahí.
--
-- NO incluye triggers de auditoría (trg_audit_*): ese patrón no existe en ninguna de las
-- 17 tablas reales (fn_audit_trigger() no existe, pg_trigger no tiene ningún trg_audit_%).
-- Queda para una FASE A2b separada si se decide restaurar la auditoría real. (Opción A,
-- confirmada por el usuario.)
-- NO incluye políticas RLS (quedan para A2, según lo pedido). RLS sí se habilita ahora,
-- por lo que estas 10 tablas son inaccesibles vía la app hasta que A2 agregue políticas.
-- NO incluye trigger de updated_at: el proyecto no tiene esa función a nivel de esquema
-- (solo existe storage.update_updated_at_column(), interna de Supabase Storage, no usada
-- por ninguna de las 17 tablas); updated_at se setea a mano desde los hooks, igual que
-- en el resto de las entidades.

-- ============================================================
-- BLOQUE 1: Tutela y referentes (Procesos 1.1 y 1.5)
-- ============================================================

-- 1. referentes (persona externa: familiar, educador, vecino, etc.)
CREATE TABLE IF NOT EXISTS referentes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre               VARCHAR(100) NOT NULL,
  apellido             VARCHAR(100) NOT NULL,
  -- dni: mismo formato que nnya.dni/tutores.dni (VARCHAR(20), texto plano, UNIQUE).
  -- El proyecto NO cifra el DNI hoy (ver prompt 012) — no se inventa cifrado acá.
  dni                  VARCHAR(20) UNIQUE NOT NULL,
  fecha_nacimiento     DATE,
  tipo                 VARCHAR(20) NOT NULL
                       CHECK (tipo IN ('familiar','educador','vecino','otro')),
  vinculo_descripcion  TEXT,
  telefono             VARCHAR(20),
  email                VARCHAR(255),
  domicilio            TEXT,
  activo               BOOLEAN NOT NULL DEFAULT TRUE,
  -- created_by NOT NULL + ON DELETE RESTRICT (no SET NULL): usuarios no se borra en duro
  -- en este proyecto (siempre se desactiva con `activo`), así que RESTRICT nunca bloquea
  -- nada en la práctica y preserva la trazabilidad de quién dio de alta el registro.
  created_by           UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referentes_apellido_nombre ON referentes(apellido, nombre);
CREATE INDEX IF NOT EXISTS idx_referentes_activo ON referentes(activo);

-- 2. vinculos_tutela (quién tiene la tutela del NNyA, y desde cuándo)
CREATE TABLE IF NOT EXISTS vinculos_tutela (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id              UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  tipo                 VARCHAR(30) NOT NULL
                       CHECK (tipo IN ('tutela_residencia','revinculacion_familiar','referente_afectivo')),
  usuario_id           UUID REFERENCES usuarios(id) ON DELETE RESTRICT,     -- responsable de la residencia
  referente_id         UUID REFERENCES referentes(id) ON DELETE RESTRICT,  -- persona externa
  vigente_desde        DATE NOT NULL,
  vigente_hasta        DATE,
  estado               VARCHAR(20) NOT NULL DEFAULT 'vigente'
                       CHECK (estado IN ('propuesto','vigente','finalizado','revocado')),
  resolucion_respaldo  TEXT,
  motivo_finalizacion  TEXT,
  observaciones        TEXT,
  created_by           UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (num_nonnulls(usuario_id, referente_id) = 1),
  CHECK (tipo <> 'tutela_residencia' OR usuario_id IS NOT NULL),
  CHECK (tipo NOT IN ('revinculacion_familiar','referente_afectivo') OR referente_id IS NOT NULL),
  CHECK (vigente_hasta IS NULL OR vigente_hasta >= vigente_desde)
);

-- Un solo vínculo vigente por NNyA: la sucesión residencia → referente exige cerrar
-- el anterior (estado <> 'vigente') antes de abrir el nuevo. Mismo patrón que
-- uq_legajo_activo_por_nnya en legajos.
CREATE UNIQUE INDEX IF NOT EXISTS uq_vinculo_vigente_por_nnya
  ON vinculos_tutela(nnya_id) WHERE estado = 'vigente';

CREATE INDEX IF NOT EXISTS idx_vinculos_tutela_nnya_desde ON vinculos_tutela(nnya_id, vigente_desde);
CREATE INDEX IF NOT EXISTS idx_vinculos_tutela_referente ON vinculos_tutela(referente_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_tutela_estado ON vinculos_tutela(estado);

-- 3. validaciones_renaper (auditoría de cada consulta de DNI — Proceso 1.7)
CREATE TABLE IF NOT EXISTS validaciones_renaper (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referente_id        UUID NOT NULL REFERENCES referentes(id) ON DELETE CASCADE,
  momento             VARCHAR(20) NOT NULL
                      CHECK (momento IN ('alta_referente','egreso','reintento')),
  dni_consultado      VARCHAR(20) NOT NULL,  -- mismo formato que referentes.dni (texto plano)
  estado_dni          VARCHAR(20) NOT NULL
                      CHECK (estado_dni IN ('vigente','vencido','inexistente','error_servicio')),
  tiene_antecedentes  BOOLEAN,  -- NULL cuando el servicio no respondió
  resultado           VARCHAR(20) NOT NULL
                      CHECK (resultado IN ('aprobado','rechazado','no_concluyente')),
  respuesta_cruda     JSONB,    -- payload completo; puede traer datos personales, ver nota RLS
  consultado_por      UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  consultado_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validaciones_renaper_referente_fecha
  ON validaciones_renaper(referente_id, consultado_at DESC);
CREATE INDEX IF NOT EXISTS idx_validaciones_renaper_resultado ON validaciones_renaper(resultado);

-- 4. transferencia_auh (traspaso de la asignación universal — Proceso 1.5, sin montos)
CREATE TABLE IF NOT EXISTS transferencia_auh (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id        UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  vinculo_id     UUID NOT NULL REFERENCES vinculos_tutela(id) ON DELETE RESTRICT,
  fecha_gestion  DATE,
  fecha_efectiva DATE,
  estado         VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente','en_gestion','transferida','rechazada','no_corresponde')),
  organismo      VARCHAR(100),
  observaciones  TEXT,
  created_by     UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (nnya_id, vinculo_id)
);

CREATE INDEX IF NOT EXISTS idx_transferencia_auh_estado ON transferencia_auh(estado);

-- ============================================================
-- BLOQUE 2: Evaluación Institucional (Proceso 1.8)
-- ============================================================

-- 5. evaluacion_institucional
CREATE TABLE IF NOT EXISTS evaluacion_institucional (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_mes    INT NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio   INT NOT NULL,
  fecha_reunion  TIMESTAMPTZ NOT NULL,
  observaciones  TEXT,
  estado         VARCHAR(20) NOT NULL DEFAULT 'convocada'
                 CHECK (estado IN ('convocada','realizada','cancelada')),
  created_by     UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (periodo_mes, periodo_anio)
);

-- 6. evaluacion_institucional_asistentes
CREATE TABLE IF NOT EXISTS evaluacion_institucional_asistentes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id  UUID NOT NULL REFERENCES evaluacion_institucional(id) ON DELETE CASCADE,
  usuario_id     UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  asistio        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (evaluacion_id, usuario_id)
);

-- 7. evaluacion_institucional_casos
CREATE TABLE IF NOT EXISTS evaluacion_institucional_casos (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id          UUID NOT NULL REFERENCES evaluacion_institucional(id) ON DELETE CASCADE,
  nnya_id                UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  resumen_situacion      TEXT NOT NULL,
  indicador_avance       INT CHECK (indicador_avance BETWEEN 1 AND 5),
  recomendaciones        TEXT,
  seguimiento_requerido  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (evaluacion_id, nnya_id)
);

CREATE INDEX IF NOT EXISTS idx_evaluacion_casos_nnya ON evaluacion_institucional_casos(nnya_id);

-- 8. propuestas_mejora
CREATE TABLE IF NOT EXISTS propuestas_mejora (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id     UUID NOT NULL REFERENCES evaluacion_institucional(id) ON DELETE CASCADE,
  descripcion       TEXT NOT NULL,
  tipo              VARCHAR(20) NOT NULL DEFAULT 'mejora'
                    CHECK (tipo IN ('mejora','capacitacion')),
  area              VARCHAR(20)
                    CHECK (area IN ('educativa','sanitaria','social','institucional','protocolos')),
  responsable_id    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_vencimiento DATE,
  estado            VARCHAR(20) NOT NULL DEFAULT 'abierto'
                    CHECK (estado IN ('abierto','en_progreso','completado','cancelado')),
  observaciones     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_propuestas_mejora_estado ON propuestas_mejora(estado);
CREATE INDEX IF NOT EXISTS idx_propuestas_mejora_responsable ON propuestas_mejora(responsable_id);
CREATE INDEX IF NOT EXISTS idx_propuestas_mejora_vencimiento ON propuestas_mejora(fecha_vencimiento);

-- ============================================================
-- BLOQUE 3: Acompañamiento diario (Proceso 1.3)
-- ============================================================

-- 9. turnos_personal (cobertura de turno y traspaso de jornada, firma doble)
CREATE TABLE IF NOT EXISTS turnos_personal (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  fecha               DATE NOT NULL,
  turno               VARCHAR(10) NOT NULL CHECK (turno IN ('mañana','tarde','noche')),
  hora_inicio         TIMESTAMPTZ,
  hora_cierre         TIMESTAMPTZ,
  estado              VARCHAR(20) NOT NULL DEFAULT 'planificado'
                      CHECK (estado IN ('planificado','en_curso','entregado','cerrado','no_cubierto')),
  novedades_traspaso  TEXT,
  entregado_por       UUID REFERENCES usuarios(id) ON DELETE SET NULL,  -- firma el saliente
  entregado_at        TIMESTAMPTZ,
  recibido_por        UUID REFERENCES usuarios(id) ON DELETE SET NULL,  -- firma el entrante
  recibido_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (usuario_id, fecha, turno),
  CHECK (hora_cierre IS NULL OR hora_cierre > hora_inicio),
  CHECK (estado <> 'cerrado' OR (entregado_at IS NOT NULL AND recibido_at IS NOT NULL)),
  CHECK (recibido_at IS NULL OR entregado_at IS NULL OR recibido_at >= entregado_at),
  CHECK (entregado_por IS NULL OR entregado_por = usuario_id),
  CHECK (recibido_por IS NULL OR recibido_por <> usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_turnos_personal_fecha_turno ON turnos_personal(fecha, turno);
CREATE INDEX IF NOT EXISTS idx_turnos_personal_estado ON turnos_personal(estado);

-- ============================================================
-- BLOQUE 4: Egreso (Proceso 1.5)
-- ============================================================

-- 10. seguimiento_post_egreso (solo 30 y 60 días, según el proceso 1.5 literal)
CREATE TABLE IF NOT EXISTS seguimiento_post_egreso (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id                 UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  vinculo_id              UUID REFERENCES vinculos_tutela(id) ON DELETE SET NULL,
  dias_post_egreso        INT NOT NULL CHECK (dias_post_egreso IN (30, 60)),
  fecha_programada        DATE NOT NULL,  -- nnya.fecha_egreso + dias_post_egreso (ver prompt 011)
  fecha_contacto          TIMESTAMPTZ,
  contacto_realizado      BOOLEAN NOT NULL DEFAULT FALSE,
  contacto_efectivo       BOOLEAN,
  escolaridad             VARCHAR(20) CHECK (escolaridad IN ('cumple','parcial','no_cumple','no_corresponde')),
  salud                   VARCHAR(20) CHECK (salud IN ('cumple','parcial','no_cumple','no_corresponde')),
  terapias                VARCHAR(20) CHECK (terapias IN ('cumple','parcial','no_cumple','no_corresponde')),
  percibe_auh             BOOLEAN,
  detalle_incumplimiento  TEXT,
  observaciones           TEXT,
  indicador_reinsercion   INT CHECK (indicador_reinsercion BETWEEN 1 AND 5),
  requiere_intervencion   BOOLEAN NOT NULL DEFAULT FALSE,
  contactado_por          UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (nnya_id, dias_post_egreso)
);

CREATE INDEX IF NOT EXISTS idx_seguimiento_post_egreso_fecha ON seguimiento_post_egreso(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_seguimiento_post_egreso_contacto ON seguimiento_post_egreso(contacto_realizado);
CREATE INDEX IF NOT EXISTS idx_seguimiento_post_egreso_intervencion ON seguimiento_post_egreso(requiere_intervencion);

-- ============================================================
-- RLS: habilitar en las 10 tablas nuevas (sin políticas — llegan en A2)
-- ============================================================

ALTER TABLE referentes                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vinculos_tutela                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE validaciones_renaper                ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencia_auh                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluacion_institucional            ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluacion_institucional_asistentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluacion_institucional_casos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE propuestas_mejora                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_personal                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimiento_post_egreso             ENABLE ROW LEVEL SECURITY;
