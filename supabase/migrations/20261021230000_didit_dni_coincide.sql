-- prompts/046: D-14 en la base (dni_coincide), error_proveedor con valores cerrados
-- y conteos de intentos sobre estado_rnf12.
--
-- Didit no rechaza una sesión cuando el DNI presentado no es el esperado: solo genera una
-- advertencia (D-14, sandbox 07/10). El webhook compara personal_number con el DNI del
-- tutor o del referente y guarda el resultado en dni_coincide. Un Approved con otro DNI
-- pasa a "Identidad no verificada": cuenta como intento fallido y no habilita el retiro.

-- ── 1. COLUMNA dni_coincide ─────────────────────────────────

ALTER TABLE sesiones_didit
  ADD COLUMN dni_coincide BOOLEAN;

COMMENT ON COLUMN sesiones_didit.dni_coincide IS
  'Resultado de comparar el personal_number de Didit con tutores.dni (retiro) o referentes.dni (validación de referente). Lo completa el webhook. No se guarda el DNI devuelto (D-28).';

-- Un Approved sin la comparación del DNI no se puede guardar.
ALTER TABLE sesiones_didit
  ADD CONSTRAINT sesiones_didit_approved_dni_check
  CHECK (estado_didit IS DISTINCT FROM 'Approved' OR dni_coincide IS NOT NULL);

-- ── 2. error_proveedor CON VALORES CERRADOS ─────────────────
-- provider_error:      Didit creó la sesión pero RENAPER no respondió (fallback_from.reason).
-- didit_no_disponible: no se pudo crear la sesión (timeout, 5xx, red o respuesta inválida).

ALTER TABLE sesiones_didit
  ADD CONSTRAINT sesiones_didit_error_proveedor_check
  CHECK (
    error_proveedor IS NULL
    OR error_proveedor IN ('provider_error', 'didit_no_disponible')
  );

ALTER TABLE sesiones_didit
  DROP CONSTRAINT sesiones_didit_session_error_check;

ALTER TABLE sesiones_didit
  ADD CONSTRAINT sesiones_didit_session_error_check
  CHECK (
    (session_id IS NULL AND error_proveedor = 'didit_no_disponible')
    OR (session_id IS NOT NULL AND error_proveedor IS DISTINCT FROM 'didit_no_disponible')
  );

-- ── 3. ESTADO RNF-12 CON EL RESULTADO DEL DNI ───────────────

CREATE OR REPLACE FUNCTION fn_estado_rnf12_didit(
  p_estado_didit TEXT,
  p_error_proveedor TEXT,
  p_dni_coincide BOOLEAN
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF p_error_proveedor IS NOT NULL THEN
    RETURN 'Error del proveedor';
  END IF;

  IF p_estado_didit IS NULL THEN
    RETURN 'Pendiente';
  END IF;

  CASE p_estado_didit
    WHEN 'Not Started', 'In Progress', 'Awaiting User', 'Resubmitted', 'In Review' THEN
      RETURN 'Pendiente';

    -- D-14: Approved solo verifica la identidad si el DNI coincide.
    WHEN 'Approved' THEN
      IF p_dni_coincide THEN
        RETURN 'Identidad verificada';
      END IF;
      RETURN 'Identidad no verificada';

    WHEN 'Declined', 'Abandoned', 'Expired', 'Kyc Expired' THEN
      RETURN 'Identidad no verificada';

    ELSE
      RAISE EXCEPTION 'Estado Didit no reconocido: %', p_estado_didit;
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
    fn_estado_rnf12_didit(NEW.estado_didit, NEW.error_proveedor, NEW.dni_coincide);

  RETURN NEW;
END;
$$;

DROP FUNCTION fn_estado_rnf12_didit(TEXT, TEXT);

DROP TRIGGER trg_normalizar_estado_sesion_didit ON sesiones_didit;

CREATE TRIGGER trg_normalizar_estado_sesion_didit
  BEFORE INSERT OR UPDATE OF estado_didit, error_proveedor, dni_coincide
  ON sesiones_didit
  FOR EACH ROW
  EXECUTE FUNCTION fn_normalizar_estado_sesion_didit();

-- ── 4. "REQUIERE REVISIÓN" CON estado_rnf12 ─────────────────
-- Fallido = "Identidad no verificada" (incluye Approved con otro DNI y excluye los
-- errores del proveedor, D-12). Aprobado = "Identidad verificada".

CREATE OR REPLACE FUNCTION fn_marcar_retiro_revision_didit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_intentos_fallidos INTEGER;
  v_tiene_aprobacion BOOLEAN;
BEGIN
  IF NEW.proposito <> 'retiro' THEN
    RETURN NEW;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE estado_rnf12 = 'Identidad no verificada'),
    COALESCE(BOOL_OR(estado_rnf12 = 'Identidad verificada'), FALSE)
  INTO v_intentos_fallidos, v_tiene_aprobacion
  FROM sesiones_didit
  WHERE retiro_id = NEW.retiro_id;

  IF v_intentos_fallidos >= 3
     AND NOT v_tiene_aprobacion THEN
    UPDATE retiros
    SET estado = 'requiere_revision',
        updated_at = NOW()
    WHERE id = NEW.retiro_id
      AND estado = 'en_curso';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER trg_marcar_retiro_revision_didit ON sesiones_didit;

CREATE TRIGGER trg_marcar_retiro_revision_didit
  AFTER INSERT OR UPDATE OF estado_didit, error_proveedor, dni_coincide
  ON sesiones_didit
  FOR EACH ROW
  EXECUTE FUNCTION fn_marcar_retiro_revision_didit();

-- ── 5. FALLBACK: INTENTOS FALLIDOS CON estado_rnf12 ─────────

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
  -- Si no se solicita una verificación manual ni un fallback,
  -- no hay datos de autorización que validar.
  IF NEW.metodo_verificacion IS DISTINCT FROM 'manual'
     AND NEW.autorizado_por IS NULL
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
  IF get_my_role() IS DISTINCT FROM 'Admin' THEN
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

  -- Para el fallback por intentos agotados se cuentan las verificaciones
  -- terminadas sin identidad verificada (incluye Approved con otro DNI, D-14).
  SELECT COUNT(*)
  INTO v_intentos_fallidos
  FROM sesiones_didit
  WHERE retiro_id = NEW.id
    AND proposito = 'retiro'
    AND estado_rnf12 = 'Identidad no verificada';

  -- D-26: el rechazo del consentimiento habilita
  -- la verificación manual por un Admin.
  IF NEW.metodo_verificacion = 'manual'
     AND NEW.consentimiento_didit = 'rechazado' THEN
    RETURN NEW;
  END IF;

  -- D-20: fallback por error del proveedor
  -- o por tres intentos fallidos.
  IF NOT v_tiene_error_proveedor
     AND v_intentos_fallidos < 3 THEN
    RAISE EXCEPTION
      'El fallback requiere 3 intentos fallidos, error del proveedor o consentimiento rechazado';
  END IF;

  RETURN NEW;
END;
$$;

-- ── 6. SEGURIDAD 2 CON estado_rnf12 ─────────────────────────

CREATE OR REPLACE FUNCTION fn_validar_identidad_para_retiro()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_estado_ultima_sesion TEXT;
BEGIN
  IF NEW.resultado_autorizacion = 'autorizada'
     OR NEW.estado = 'realizada' THEN

    -- Permitir la verificación manual documentada.
    IF NEW.metodo_verificacion = 'manual'
       AND NEW.autorizado_por IS NOT NULL
       AND NEW.autorizado_at IS NOT NULL
       AND NULLIF(BTRIM(NEW.motivo_fallback), '') IS NOT NULL THEN
      RETURN NEW;
    END IF;

    -- La última sesión Didit del retiro tiene que haber verificado la
    -- identidad: Approved y con el DNI esperado (D-14).
    SELECT estado_rnf12
    INTO v_estado_ultima_sesion
    FROM sesiones_didit
    WHERE retiro_id = NEW.id
      AND proposito = 'retiro'
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    IF v_estado_ultima_sesion IS DISTINCT FROM 'Identidad verificada' THEN
      RAISE EXCEPTION
        'No se puede autorizar o realizar el retiro sin identidad verificada';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ── 7. RLS: dni_coincide NO SE CARGA DESDE EL CLIENTE ───────

DROP POLICY "sesiones_didit_insert" ON sesiones_didit;

CREATE POLICY "sesiones_didit_insert"
  ON sesiones_didit
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_role() IN ('Admin', 'Equipo Tecnico')
    AND estado_didit IS NULL
    AND finalizada_at IS NULL
    AND dni_coincide IS NULL
  );
