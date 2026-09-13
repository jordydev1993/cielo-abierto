-- Tabla nueva de mobile (F2/F3): diario liviano de novedades por NNA, en tiempo real.
-- Única tabla genuinamente nueva del modelo mobile, según decisión registrada en
-- mobile/docs/04-backend/modelo-de-datos/CORRECCIONES-Y-DUDAS-PARA-MELI-SOFI.md §2.
-- Ver prompts/015-tabla-novedades.md para el análisis completo (diseño tomado de
-- `incidentes`, no del docx original: nnya_id en vez de residente_id, `tipo` en vez
-- de `tipo_novedad`, usuario_id nullable + ON DELETE SET NULL en vez de NOT NULL +
-- RESTRICT, sin deleted_at).

CREATE TABLE IF NOT EXISTS novedades (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id      UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  usuario_id   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo         VARCHAR(50) NOT NULL
               CHECK (tipo IN ('Salud', 'Educación', 'Comportamiento', 'Alimentación', 'Visita Familiar', 'Otro')),
  descripcion  TEXT NOT NULL,
  fecha_hora   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novedades_nnya_fecha ON novedades(nnya_id, fecha_hora DESC);

ALTER TABLE novedades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "novedades_admin_tecnico_all" ON novedades
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin', 'Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin', 'Equipo Tecnico'));
