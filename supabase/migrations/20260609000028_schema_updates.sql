-- ============================================================
-- Schema updates: legajo_id, estados, trigger alertas
-- ============================================================

-- ── 1. ALERTAS: actualizar constraint de estado ──────────────
ALTER TABLE alertas DROP CONSTRAINT IF EXISTS alertas_estado_check;
ALTER TABLE alertas ADD CONSTRAINT alertas_estado_check
  CHECK (estado IN ('pendiente', 'en_proceso', 'completada', 'vencida'));

-- Actualizar valores anteriores
UPDATE alertas SET estado = 'en_proceso'  WHERE estado = 'en_seguimiento';
UPDATE alertas SET estado = 'completada'  WHERE estado = 'resuelta';

-- ── 2. TURNOS: agregar legajo_id ─────────────────────────────
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS legajo_id UUID REFERENCES legajos(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_turnos_legajo ON turnos(legajo_id);

-- ── 3. INCIDENTES: agregar legajo_id + columnas de predicción ──
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS legajo_id UUID REFERENCES legajos(id) ON DELETE CASCADE;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS gravedad_sugerida VARCHAR(20);
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS sugerencia_aceptada BOOLEAN NOT NULL DEFAULT FALSE;

-- Ajustar constraint de gravedad: critica → critico
ALTER TABLE incidentes DROP CONSTRAINT IF EXISTS incidentes_gravedad_check;
ALTER TABLE incidentes ADD CONSTRAINT incidentes_gravedad_check
  CHECK (gravedad IN ('leve', 'media', 'grave', 'critico'));
UPDATE incidentes SET gravedad = 'critico' WHERE gravedad = 'critica';

CREATE INDEX IF NOT EXISTS idx_incidentes_legajo ON incidentes(legajo_id);

-- ── 4. INFORMES: agregar legajo_id ───────────────────────────
ALTER TABLE informes ADD COLUMN IF NOT EXISTS legajo_id UUID REFERENCES legajos(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_informes_legajo ON informes(legajo_id);

-- ── 5. DOCUMENTOS: agregar legajo_id ─────────────────────────
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS legajo_id UUID REFERENCES legajos(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_documentos_legajo ON documentos(legajo_id);

-- ── 6. AUDIENCIAS JUDICIALES: legajo_id + estado suspendida ──
ALTER TABLE audiencias_judiciales ADD COLUMN IF NOT EXISTS legajo_id UUID REFERENCES legajos(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_audiencias_legajo ON audiencias_judiciales(legajo_id);

ALTER TABLE audiencias_judiciales DROP CONSTRAINT IF EXISTS audiencias_judiciales_estado_check;
ALTER TABLE audiencias_judiciales ADD CONSTRAINT audiencias_judiciales_estado_check
  CHECK (estado IN ('programada', 'realizada', 'suspendida', 'cancelada'));
UPDATE audiencias_judiciales SET estado = 'suspendida' WHERE estado = 'postergada';

-- ── 7. DIAGNÓSTICOS: reemplazar activo por estado + legajo_id ─
ALTER TABLE diagnosticos ADD COLUMN IF NOT EXISTS legajo_id UUID REFERENCES legajos(id) ON DELETE CASCADE;
ALTER TABLE diagnosticos ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'activo'
  CHECK (estado IN ('activo', 'en_seguimiento', 'resuelto'));

-- Migrar datos de activo → estado
UPDATE diagnosticos SET estado = 'resuelto' WHERE activo = FALSE;
ALTER TABLE diagnosticos DROP COLUMN IF EXISTS activo;

CREATE INDEX IF NOT EXISTS idx_diagnosticos_legajo ON diagnosticos(legajo_id);

-- ── 8. MEDICAMENTOS: reemplazar activo por estado + legajo_id + diagnostico_id ──
ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS legajo_id UUID REFERENCES legajos(id) ON DELETE CASCADE;
ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS diagnostico_id UUID REFERENCES diagnosticos(id) ON DELETE SET NULL;
ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'en_curso'
  CHECK (estado IN ('en_curso', 'finalizado'));

-- Migrar datos de activo → estado
UPDATE medicamentos SET estado = 'finalizado' WHERE activo = FALSE;
ALTER TABLE medicamentos DROP COLUMN IF EXISTS activo;

CREATE INDEX IF NOT EXISTS idx_medicamentos_legajo      ON medicamentos(legajo_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_diagnostico ON medicamentos(diagnostico_id);
