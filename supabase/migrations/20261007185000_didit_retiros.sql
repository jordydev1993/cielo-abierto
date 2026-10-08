-- Issue #18 — Modelo de datos Didit: retiros y sesiones
-- Implementa el Plan 028 aprobado.
-- No almacena biometría, selfies, videos, copias de DNI ni payloads completos de Didit.

-- ============================================================
-- 1. AUTORIZACIONES DE RETIRO
-- ============================================================

CREATE TABLE autorizaciones_retiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nnya_tutor_id UUID NOT NULL
    REFERENCES nnya_tutores(id) ON DELETE RESTRICT,

  estado TEXT NOT NULL DEFAULT 'vigente'
    CHECK (estado IN ('vigente', 'revocada')),

  vigente_desde TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vigente_hasta TIMESTAMPTZ,

  restricciones TEXT,

  created_by UUID NOT NULL
    REFERENCES usuarios(id) ON DELETE RESTRICT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT autorizaciones_retiro_vigencia_check
    CHECK (
      vigente_hasta IS NULL
      OR vigente_hasta >= vigente_desde
    )
);

-- Como máximo una autorización marcada como vigente por vínculo tutor-NNyA.
-- La vigencia temporal se valida al utilizar la autorización.
CREATE UNIQUE INDEX uq_autorizacion_retiro_vigente
  ON autorizaciones_retiro(nnya_tutor_id)
  WHERE estado = 'vigente';

-- ============================================================
-- 2. RETIROS
-- ============================================================

CREATE TABLE retiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nnya_id UUID NOT NULL
    REFERENCES nnya(id) ON DELETE RESTRICT,

  tutor_id UUID NOT NULL
    REFERENCES tutores(id) ON DELETE RESTRICT,

  created_by UUID NOT NULL
    REFERENCES usuarios(id) ON DELETE RESTRICT,

  autorizacion_retiro_id UUID NOT NULL
    REFERENCES autorizaciones_retiro(id) ON DELETE RESTRICT,

  resultado_autorizacion TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (
      resultado_autorizacion IN (
        'pendiente',
        'autorizada',
        'rechazada'
      )
    ),

  motivo_rechazo TEXT,

  estado TEXT NOT NULL DEFAULT 'en_curso'
    CHECK (
      estado IN (
        'en_curso',
        'realizada',
        'rechazada'
      )
    ),

  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_fin TIMESTAMPTZ,

  descripcion TEXT,
  observaciones TEXT,

  -- Campos utilizados únicamente para el fallback manual.
  autorizado_por UUID
    REFERENCES usuarios(id) ON DELETE RESTRICT,

  autorizado_at TIMESTAMPTZ,
  motivo_fallback TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT retiros_fecha_fin_check
    CHECK (
      fecha_fin IS NULL
      OR fecha_fin >= fecha_inicio
    )
);

CREATE INDEX idx_retiros_nnya_fecha
  ON retiros(nnya_id, fecha_inicio);

CREATE INDEX idx_retiros_tutor
  ON retiros(tutor_id);

CREATE INDEX idx_retiros_autorizacion
  ON retiros(autorizacion_retiro_id);

-- ============================================================
-- 3. SESIONES DIDIT
-- ============================================================

CREATE TABLE sesiones_didit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ID que devuelve Didit al crear una sesión.
  -- Puede ser NULL únicamente cuando hubo un error del proveedor
  -- antes de obtener un session_id.
  session_id TEXT,

  proposito TEXT NOT NULL
    CHECK (
      proposito IN (
        'retiro',
        'validacion_referente'
      )
    ),

  retiro_id UUID
    REFERENCES retiros(id) ON DELETE RESTRICT,

  referente_id UUID
    REFERENCES referentes(id) ON DELETE RESTRICT,

  -- Estado original informado por Didit.
  estado_didit TEXT
    CHECK (
      estado_didit IS NULL
      OR estado_didit IN (
        'Not Started',
        'In Progress',
        'Awaiting User',
        'Resubmitted',
        'Approved',
        'Declined',
        'In Review',
        'Abandoned',
        'Expired',
        'Kyc Expired'
      )
    ),

  -- Estado normalizado que utiliza Argüello Infancias.
  estado_rnf12 TEXT NOT NULL DEFAULT 'Pendiente'
    CHECK (
      estado_rnf12 IN (
        'Pendiente',
        'Identidad verificada',
        'Identidad no verificada',
        'Requiere revisión',
        'Error del proveedor'
      )
    ),

  error_proveedor TEXT,

  creada_por UUID NOT NULL
    REFERENCES usuarios(id) ON DELETE RESTRICT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalizada_at TIMESTAMPTZ,

  -- Una sesión para retiro debe apuntar únicamente a un retiro.
  CONSTRAINT sesiones_didit_proposito_retiro_check
    CHECK (
      (proposito = 'retiro' AND retiro_id IS NOT NULL AND referente_id IS NULL)
      OR
      (
        proposito = 'validacion_referente'
        AND referente_id IS NOT NULL
        AND retiro_id IS NULL
      )
    ),

  -- Si no existe session_id, debe registrarse un error del proveedor.
  -- Si la sesión existe, puede registrar provider_error
  -- cuando RENAPER falla durante la verificación.
  CONSTRAINT sesiones_didit_session_error_check
  CHECK (
    (session_id IS NOT NULL)
    OR
    (session_id IS NULL AND error_proveedor IS NOT NULL)
  )
);

CREATE UNIQUE INDEX uq_sesiones_didit_session_id
  ON sesiones_didit(session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX idx_sesiones_didit_retiro
  ON sesiones_didit(retiro_id, created_at);

CREATE INDEX idx_sesiones_didit_referente
  ON sesiones_didit(referente_id, created_at);

-- ============================================================
-- 4. RELACIÓN DIDIT ↔ VALIDACIONES RENAPER
-- ============================================================

ALTER TABLE validaciones_renaper
  ADD COLUMN sesion_didit_id UUID;

ALTER TABLE validaciones_renaper
  ADD CONSTRAINT validaciones_renaper_sesion_didit_fkey
  FOREIGN KEY (sesion_didit_id)
  REFERENCES sesiones_didit(id)
  ON DELETE RESTRICT;

CREATE UNIQUE INDEX uq_validaciones_renaper_sesion_didit
  ON validaciones_renaper(sesion_didit_id)
  WHERE sesion_didit_id IS NOT NULL;

-- ============================================================
-- 5. VALIDACIÓN DE AUTORIZACIÓN VIGENTE PARA EL RETIRO
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validar_autorizacion_retiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_nnya_id UUID;
  v_tutor_id UUID;
  v_estado TEXT;
  v_vigente_desde TIMESTAMPTZ;
  v_vigente_hasta TIMESTAMPTZ;
BEGIN
  SELECT
    nt.nnya_id,
    nt.tutor_id,
    ar.estado,
    ar.vigente_desde,
    ar.vigente_hasta
  INTO
    v_nnya_id,
    v_tutor_id,
    v_estado,
    v_vigente_desde,
    v_vigente_hasta
  FROM autorizaciones_retiro ar
  JOIN nnya_tutores nt
    ON nt.id = ar.nnya_tutor_id
  WHERE ar.id = NEW.autorizacion_retiro_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'La autorización de retiro indicada no existe';
  END IF;

  IF v_nnya_id <> NEW.nnya_id OR v_tutor_id <> NEW.tutor_id THEN
    RAISE EXCEPTION
      'La autorización no corresponde al tutor y NNyA del retiro';
  END IF;

  IF v_estado <> 'vigente' THEN
    RAISE EXCEPTION
      'La autorización de retiro no está vigente';
  END IF;

  IF CURRENT_TIMESTAMP < v_vigente_desde THEN
    RAISE EXCEPTION
      'La autorización de retiro todavía no está vigente';
  END IF;

  IF v_vigente_hasta IS NOT NULL
     AND CURRENT_TIMESTAMP > v_vigente_hasta THEN
    RAISE EXCEPTION
      'La autorización de retiro está vencida';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_autorizacion_retiro
  BEFORE INSERT OR UPDATE OF
    nnya_id,
    tutor_id,
    autorizacion_retiro_id
  ON retiros
  FOR EACH ROW
  EXECUTE FUNCTION fn_validar_autorizacion_retiro();

-- ============================================================
-- 6. MÁXIMO DE 3 INTENTOS DIDIT POR RETIRO
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validar_max_intentos_didit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_intentos_terminados INTEGER;
BEGIN
  -- Esta regla aplica únicamente a sesiones cuyo propósito es retiro.
  IF NEW.proposito <> 'retiro' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
  INTO v_intentos_terminados
  FROM sesiones_didit
  WHERE retiro_id = NEW.retiro_id
    AND id IS DISTINCT FROM NEW.id
    AND estado_didit IN (
      'Approved',
      'Declined',
      'Abandoned',
      'Expired',
      'Kyc Expired'
    )
  AND NOT (
    estado_didit = 'Declined'
    AND error_proveedor = 'provider_error'
  );

  -- Al crear una nueva sesión, no se permite iniciar un cuarto intento
  -- si ya existen tres sesiones terminadas.
  IF TG_OP = 'INSERT' AND v_intentos_terminados >= 3 THEN
    RAISE EXCEPTION
      'El retiro ya alcanzó el máximo de 3 intentos de verificación';
  END IF;

  -- También se protege el paso de una sesión a estado terminado
  -- para evitar superar el máximo por sesiones concurrentes.
  IF TG_OP = 'UPDATE'
     AND NEW.estado_didit IN (
       'Approved',
       'Declined',
       'Abandoned',
       'Expired',
       'Kyc Expired'
     )
     AND NOT (
       NEW.estado_didit = 'Declined'
       AND NEW.error_proveedor = 'provider_error'
     )
     AND (
      OLD.estado_didit IS DISTINCT FROM NEW.estado_didit
      OR OLD.error_proveedor IS DISTINCT FROM NEW.error_proveedor
    )
     AND v_intentos_terminados >= 3 THEN
    RAISE EXCEPTION
      'El retiro ya alcanzó el máximo de 3 intentos de verificación';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_max_intentos_didit
  BEFORE INSERT OR UPDATE OF estado_didit, error_proveedor
  ON sesiones_didit
  FOR EACH ROW
  EXECUTE FUNCTION fn_validar_max_intentos_didit();

  -- ============================================================
-- 7. FALLBACK MANUAL
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validar_fallback_retiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_usuario_id UUID;
  v_intentos_fallidos INTEGER;
  v_tiene_error_proveedor BOOLEAN;
BEGIN
  -- Si no se está utilizando fallback manual, no hay nada que validar.
  IF NEW.autorizado_por IS NULL
     AND NEW.autorizado_at IS NULL
     AND NEW.motivo_fallback IS NULL THEN
    RETURN NEW;
  END IF;

  -- Los tres datos del fallback deben existir juntos.
  IF NEW.autorizado_por IS NULL
     OR NEW.autorizado_at IS NULL
     OR NEW.motivo_fallback IS NULL
     OR BTRIM(NEW.motivo_fallback) = '' THEN
    RAISE EXCEPTION
      'El fallback requiere autorizado_por, autorizado_at y motivo_fallback';
  END IF;

  -- D-2: únicamente Admin puede autorizar el fallback.
  IF get_my_role() <> 'Admin' THEN
    RAISE EXCEPTION
      'Solo un usuario Admin puede autorizar el fallback manual';
  END IF;

  SELECT id
  INTO v_usuario_id
  FROM usuarios
  WHERE auth_user_id = auth.uid()
    AND activo = TRUE
  LIMIT 1;

  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION
      'No se pudo identificar al usuario que autoriza el fallback';
  END IF;

  IF NEW.autorizado_por <> v_usuario_id THEN
    RAISE EXCEPTION
      'autorizado_por debe corresponder al usuario Admin autenticado';
  END IF;

  -- Un error del proveedor habilita el fallback sin consumir un intento.
  SELECT EXISTS (
    SELECT 1
    FROM sesiones_didit
    WHERE retiro_id = NEW.id
      AND proposito = 'retiro'
      AND error_proveedor IS NOT NULL
  )
  INTO v_tiene_error_proveedor;

  -- Para el fallback por intentos agotados se cuentan únicamente
  -- verificaciones terminadas sin aprobación.
  SELECT COUNT(*)
  INTO v_intentos_fallidos
  FROM sesiones_didit
  WHERE retiro_id = NEW.id
    AND proposito = 'retiro'
    AND estado_didit IN (
      'Declined',
      'Abandoned',
      'Expired',
      'Kyc Expired'
  )
  AND NOT (
    estado_didit = 'Declined'
    AND error_proveedor = 'provider_error'
  );

  IF NOT v_tiene_error_proveedor
     AND v_intentos_fallidos < 3 THEN
    RAISE EXCEPTION
      'El fallback solo está permitido por error del proveedor o después de 3 intentos fallidos';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_fallback_retiro
  BEFORE INSERT OR UPDATE OF
    autorizado_por,
    autorizado_at,
    motivo_fallback
  ON retiros
  FOR EACH ROW
  EXECUTE FUNCTION fn_validar_fallback_retiro();

-- ============================================================
-- 8. NORMALIZACIÓN DE ESTADOS DIDIT → RNF-12
-- ============================================================

CREATE OR REPLACE FUNCTION fn_estado_rnf12_didit(
  p_estado_didit TEXT,
  p_error_proveedor TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Si la creación de la sesión falló antes de obtener session_id.
  IF p_error_proveedor IS NOT NULL THEN
    RETURN 'Error del proveedor';
  END IF;

  -- Mientras todavía no llegó un estado desde el webhook.
  IF p_estado_didit IS NULL THEN
    RETURN 'Pendiente';
  END IF;

  CASE p_estado_didit
    WHEN 'Not Started' THEN
      RETURN 'Pendiente';

    WHEN 'In Progress' THEN
      RETURN 'Pendiente';

    WHEN 'Awaiting User' THEN
      RETURN 'Pendiente';

    WHEN 'Resubmitted' THEN
      RETURN 'Pendiente';

    WHEN 'Approved' THEN
      RETURN 'Identidad verificada';

    WHEN 'Declined' THEN
      RETURN 'Identidad no verificada';

    WHEN 'Abandoned' THEN
      RETURN 'Identidad no verificada';

    WHEN 'Expired' THEN
      RETURN 'Identidad no verificada';

    WHEN 'Kyc Expired' THEN
      RETURN 'Identidad no verificada';

    WHEN 'In Review' THEN
      RETURN 'Requiere revisión';

    ELSE
      RAISE EXCEPTION
        'Estado Didit no reconocido: %',
        p_estado_didit;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION fn_normalizar_estado_sesion_didit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.estado_rnf12 :=
    fn_estado_rnf12_didit(
      NEW.estado_didit,
      NEW.error_proveedor
    );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_normalizar_estado_sesion_didit
  BEFORE INSERT OR UPDATE OF
    estado_didit,
    error_proveedor
  ON sesiones_didit
  FOR EACH ROW
  EXECUTE FUNCTION fn_normalizar_estado_sesion_didit();

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE autorizaciones_retiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE retiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_didit ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- AUTORIZACIONES DE RETIRO
-- Admin y Equipo Tecnico pueden consultar.
-- Solo Admin puede crear o modificar autorizaciones.
-- No se permite DELETE: se revoca cambiando el estado.
-- ------------------------------------------------------------

CREATE POLICY "autorizaciones_retiro_select"
  ON autorizaciones_retiro
  FOR SELECT
  TO authenticated
  USING (
    get_my_role() IN ('Admin', 'Equipo Tecnico')
  );

CREATE POLICY "autorizaciones_retiro_insert_admin"
  ON autorizaciones_retiro
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_role() = 'Admin'
  );

CREATE POLICY "autorizaciones_retiro_update_admin"
  ON autorizaciones_retiro
  FOR UPDATE
  TO authenticated
  USING (
    get_my_role() = 'Admin'
  )
  WITH CHECK (
    get_my_role() = 'Admin'
  );


-- ------------------------------------------------------------
-- RETIROS
-- Admin y Equipo Tecnico pueden consultar, crear y actualizar.
-- No se permite DELETE para conservar el historial.
-- ------------------------------------------------------------

CREATE POLICY "retiros_select"
  ON retiros
  FOR SELECT
  TO authenticated
  USING (
    get_my_role() IN ('Admin', 'Equipo Tecnico')
  );

CREATE POLICY "retiros_insert"
  ON retiros
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_role() IN ('Admin', 'Equipo Tecnico')
  );

CREATE POLICY "retiros_update"
  ON retiros
  FOR UPDATE
  TO authenticated
  USING (
    get_my_role() IN ('Admin', 'Equipo Tecnico')
  )
  WITH CHECK (
    get_my_role() IN ('Admin', 'Equipo Tecnico')
  );


-- ------------------------------------------------------------
-- SESIONES DIDIT
-- Admin y Equipo Tecnico pueden consultar y crear sesiones.
-- Las actualizaciones del resultado quedan reservadas al
-- procesamiento server-side del webhook.
-- No se permite DELETE.
-- ------------------------------------------------------------

CREATE POLICY "sesiones_didit_select"
  ON sesiones_didit
  FOR SELECT
  TO authenticated
  USING (
    get_my_role() IN ('Admin', 'Equipo Tecnico')
  );

CREATE POLICY "sesiones_didit_insert"
  ON sesiones_didit
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_role() IN ('Admin', 'Equipo Tecnico')
  );
  
-- ============================================================
-- 10. AUDITORÍA
-- ============================================================

CREATE TRIGGER trg_audit_autorizaciones_retiro
  AFTER INSERT OR UPDATE OR DELETE
  ON autorizaciones_retiro
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_retiros
  AFTER INSERT OR UPDATE OR DELETE
  ON retiros
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_sesiones_didit
  AFTER INSERT OR UPDATE OR DELETE
  ON sesiones_didit
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_trigger();
  
-- ============================================================
-- D-16: Validación RENAPER obligatoria para activar vínculos
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_validar_renaper_vinculo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_resultado VARCHAR(20);
BEGIN
  -- Solo aplica a vínculos con referentes externos.
  IF NEW.tipo IN ('revinculacion_familiar', 'referente_afectivo')
     AND NEW.estado = 'vigente'
     AND (
       TG_OP = 'INSERT'
       OR OLD.estado IS DISTINCT FROM 'vigente'
       OR OLD.referente_id IS DISTINCT FROM NEW.referente_id
       OR OLD.tipo IS DISTINCT FROM NEW.tipo
     )
  THEN
    SELECT vr.resultado
      INTO v_resultado
    FROM public.validaciones_renaper vr
    WHERE vr.referente_id = NEW.referente_id
    ORDER BY vr.consultado_at DESC, vr.id DESC
    LIMIT 1;

    IF v_resultado IS DISTINCT FROM 'aprobado' THEN
      RAISE EXCEPTION
        'No se puede activar el vínculo: el referente no tiene una validación RENAPER aprobada';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_renaper_vinculo
  ON public.vinculos_tutela;

CREATE TRIGGER trg_validar_renaper_vinculo
BEFORE INSERT OR UPDATE ON public.vinculos_tutela
FOR EACH ROW
EXECUTE FUNCTION public.fn_validar_renaper_vinculo();
