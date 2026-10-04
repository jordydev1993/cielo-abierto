-- Innovación 5 (prompts/027): informe mensual institucional para SENAF.
-- Tabla reportes_senaf + RLS solo Admin + auditoría + función de agregados.
-- La función devuelve SOLO conteos sobre columnas con dominio cerrado (CHECK):
-- nunca nombres, DNI ni texto libre. Es lo único que viaja al proveedor de IA.

CREATE TABLE reportes_senaf (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_mes              INTEGER NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio             INTEGER NOT NULL CHECK (periodo_anio BETWEEN 2020 AND 2100),
  version                  INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  datos                    JSONB NOT NULL,
  borrador                 JSONB NOT NULL,
  origen_borrador          VARCHAR(20) NOT NULL CHECK (origen_borrador IN ('ia', 'plantilla')),
  modelo                   VARCHAR(60),
  advertencias             JSONB NOT NULL DEFAULT '[]'::jsonb,
  texto_final              JSONB NOT NULL,
  observaciones_direccion  TEXT,
  estado                   VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'aprobado')),
  generado_por             UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  aprobado_por             UUID REFERENCES usuarios(id) ON DELETE RESTRICT,
  aprobado_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_reportes_senaf_periodo_version UNIQUE (periodo_anio, periodo_mes, version),
  CONSTRAINT chk_reportes_senaf_aprobacion_coherente
    CHECK ((estado = 'aprobado') = (aprobado_por IS NOT NULL AND aprobado_at IS NOT NULL))
);

-- Un solo informe aprobado por período.
CREATE UNIQUE INDEX uq_reportes_senaf_aprobado_por_periodo
  ON reportes_senaf (periodo_anio, periodo_mes)
  WHERE estado = 'aprobado';

-- R6: un informe aprobado no se edita más (para corregirlo se genera otra versión).
CREATE OR REPLACE FUNCTION fn_reportes_senaf_bloquear_aprobado()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.estado = 'aprobado' THEN
    RAISE EXCEPTION 'El informe del período %/% ya está aprobado y no se puede modificar. Generá una versión nueva.',
      OLD.periodo_mes, OLD.periodo_anio;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reportes_senaf_bloquear_aprobado
  BEFORE UPDATE ON reportes_senaf
  FOR EACH ROW EXECUTE FUNCTION fn_reportes_senaf_bloquear_aprobado();

-- Auditoría (mismo patrón que prompts/018).
CREATE TRIGGER trg_audit_reportes_senaf
  AFTER INSERT OR UPDATE OR DELETE ON reportes_senaf
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- RLS: solo Admin. Sin política de DELETE (RLS lo deniega).
ALTER TABLE reportes_senaf ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reportes_senaf_select_admin" ON reportes_senaf
  FOR SELECT TO authenticated
  USING (get_my_role() = 'Admin');

CREATE POLICY "reportes_senaf_insert_admin" ON reportes_senaf
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "reportes_senaf_update_admin" ON reportes_senaf
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- Agregados del mes. SECURITY INVOKER: corre con los permisos (y la RLS) de quien llama.
-- Además exige Admin explícitamente.
CREATE OR REPLACE FUNCTION fn_agregados_senaf(p_mes INTEGER, p_anio INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_desde DATE;
  v_hasta DATE;
  v_eval_id     UUID;
  v_eval_estado VARCHAR;
  v_result JSONB;
BEGIN
  IF get_my_role() IS DISTINCT FROM 'Admin' THEN
    RAISE EXCEPTION 'Solo Admin puede generar el informe SENAF.' USING ERRCODE = '42501';
  END IF;
  IF p_mes NOT BETWEEN 1 AND 12 OR p_anio NOT BETWEEN 2020 AND 2100 THEN
    RAISE EXCEPTION 'Período inválido: %/%', p_mes, p_anio;
  END IF;

  v_desde := make_date(p_anio, p_mes, 1);
  v_hasta := (v_desde + INTERVAL '1 month - 1 day')::date;

  SELECT id, estado INTO v_eval_id, v_eval_estado
  FROM evaluacion_institucional
  WHERE periodo_mes = p_mes AND periodo_anio = p_anio
  ORDER BY created_at DESC
  LIMIT 1;

  WITH poblacion AS (
    -- NNyA alojados al cierre del mes: ingresaron (primer legajo) antes del cierre
    -- y no habían egresado. Se excluyen bajas lógicas que no son egresos.
    SELECT n.id,
           CASE WHEN n.genero IN ('Femenino', 'Masculino') THEN n.genero ELSE 'Otro / no informado' END AS genero,
           date_part('year', age(v_hasta, n.fecha_nacimiento))::int AS edad
    FROM nnya n
    WHERE (n.activo OR n.fecha_egreso IS NOT NULL)
      AND (n.fecha_egreso IS NULL OR n.fecha_egreso > v_hasta)
      AND (SELECT min(l.fecha_apertura) FROM legajos l WHERE l.nnya_id = n.id) <= v_hasta
  ),
  franjas AS (
    SELECT CASE
             WHEN edad IS NULL THEN 'sin dato'
             WHEN edad <= 5 THEN '0 a 5'
             WHEN edad <= 11 THEN '6 a 11'
             WHEN edad <= 17 THEN '12 a 17'
             ELSE '18 o más'
           END AS franja
    FROM poblacion
  )
  SELECT jsonb_build_object(
    'periodo', jsonb_build_object('mes', p_mes, 'anio', p_anio, 'desde', v_desde, 'hasta', v_hasta),
    'poblacion', jsonb_build_object(
      'alojados_al_cierre', (SELECT count(*) FROM poblacion),
      'por_genero', COALESCE((SELECT jsonb_object_agg(genero, c) FROM (SELECT genero, count(*) c FROM poblacion GROUP BY genero) g), '{}'::jsonb),
      'por_franja_edad', COALESCE((SELECT jsonb_object_agg(franja, c) FROM (SELECT franja, count(*) c FROM franjas GROUP BY franja) f), '{}'::jsonb)
    ),
    'movimientos', jsonb_build_object(
      'ingresos', (SELECT count(*) FROM legajos WHERE fecha_apertura BETWEEN v_desde AND v_hasta),
      'egresos', (SELECT count(*) FROM nnya WHERE fecha_egreso BETWEEN v_desde AND v_hasta)
    ),
    'audiencias', jsonb_build_object(
      'total', (SELECT count(*) FROM audiencias_judiciales WHERE fecha_hora::date BETWEEN v_desde AND v_hasta),
      'por_estado', COALESCE((SELECT jsonb_object_agg(estado, c) FROM (
        SELECT estado, count(*) c FROM audiencias_judiciales
        WHERE fecha_hora::date BETWEEN v_desde AND v_hasta GROUP BY estado) a), '{}'::jsonb)
    ),
    'incidentes', jsonb_build_object(
      'total', (SELECT count(*) FROM incidentes WHERE fecha_hora::date BETWEEN v_desde AND v_hasta),
      'por_gravedad', COALESCE((SELECT jsonb_object_agg(gravedad, c) FROM (
        SELECT gravedad, count(*) c FROM incidentes
        WHERE fecha_hora::date BETWEEN v_desde AND v_hasta GROUP BY gravedad) i), '{}'::jsonb)
    ),
    'intervenciones', jsonb_build_object(
      'total', (SELECT count(*) FROM intervenciones WHERE fecha BETWEEN v_desde AND v_hasta),
      'por_estado', COALESCE((SELECT jsonb_object_agg(estado, c) FROM (
        SELECT estado, count(*) c FROM intervenciones
        WHERE fecha BETWEEN v_desde AND v_hasta GROUP BY estado) iv), '{}'::jsonb)
    ),
    'evaluacion_institucional', jsonb_build_object(
      'realizada', COALESCE(v_eval_estado = 'realizada', false),
      'estado', v_eval_estado,
      'propuestas_del_mes_por_estado', COALESCE((SELECT jsonb_object_agg(estado, c) FROM (
        SELECT estado, count(*) c FROM propuestas_mejora
        WHERE evaluacion_id = v_eval_id GROUP BY estado) p), '{}'::jsonb),
      'propuestas_pendientes_totales', (SELECT count(*) FROM propuestas_mejora WHERE estado IN ('abierto', 'en_progreso'))
    ),
    'seguimiento_post_egreso', jsonb_build_object(
      'programados', (SELECT count(*) FROM seguimiento_post_egreso WHERE fecha_programada BETWEEN v_desde AND v_hasta),
      'realizados', (SELECT count(*) FROM seguimiento_post_egreso WHERE fecha_programada BETWEEN v_desde AND v_hasta AND contacto_realizado),
      'efectivos', (SELECT count(*) FROM seguimiento_post_egreso WHERE fecha_programada BETWEEN v_desde AND v_hasta AND contacto_efectivo),
      'requieren_intervencion', (SELECT count(*) FROM seguimiento_post_egreso WHERE fecha_programada BETWEEN v_desde AND v_hasta AND requiere_intervencion),
      'indicador_reinsercion_promedio', (SELECT round(avg(indicador_reinsercion)::numeric, 1) FROM seguimiento_post_egreso
        WHERE fecha_programada BETWEEN v_desde AND v_hasta AND indicador_reinsercion IS NOT NULL)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION fn_agregados_senaf(INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION fn_agregados_senaf(INTEGER, INTEGER) TO authenticated;
