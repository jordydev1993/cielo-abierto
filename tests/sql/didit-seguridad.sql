-- Pruebas de seguridad de Didit (prompts/046): RLS, Seguridad 1 y 2, D-14, error_proveedor,
-- intentos y fallback. Solo para Supabase local: npm run test:sql.
-- Todo corre en una transacción que termina en ROLLBACK, con datos ficticios (DNI 99…).
-- Cada caso imprime "OK Sn" o corta con "FALLO Sn: …".

\set ON_ERROR_STOP on
\set QUIET on

BEGIN;

-- ── Guardia: nunca contra una base con datos reales ─────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@arguelloinfancias.com') THEN
    RAISE EXCEPTION 'Esta base tiene el usuario real: las pruebas solo corren en Supabase local';
  END IF;
END $$;

-- ── Datos de prueba (como postgres, que simula al servidor) ─
INSERT INTO auth.users (id, instance_id, aud, role, email)
VALUES
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'qa.direccion@arguelloinfancias.test'),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'qa.educador@arguelloinfancias.test');

INSERT INTO usuarios (id, nombre, apellido, email, rol_id, auth_user_id)
VALUES
  ('10000000-0000-4000-a000-000000000001', 'Dirección', 'QA', 'qa.direccion@arguelloinfancias.test',
   (SELECT id FROM roles WHERE nombre = 'Admin'), '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000002', 'Educador', 'QA', 'qa.educador@arguelloinfancias.test',
   (SELECT id FROM roles WHERE nombre = 'Equipo Tecnico'), '00000000-0000-4000-a000-000000000002');

INSERT INTO nnya (id, nombre, apellido, dni, fecha_nacimiento)
VALUES ('20000000-0000-4000-a000-000000000001', 'Lucía', 'Prueba', '99000001', '2015-03-10');

INSERT INTO tutores (id, nombre, apellido, dni, parentesco)
VALUES ('30000000-0000-4000-a000-000000000001', 'Ana', 'Prueba', '99000011', 'Madre');

INSERT INTO nnya_tutores (id, nnya_id, tutor_id, es_principal)
VALUES ('40000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000001',
        '30000000-0000-4000-a000-000000000001', TRUE);

INSERT INTO autorizaciones_retiro (id, nnya_tutor_id, created_by)
VALUES ('50000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000001',
        '10000000-0000-4000-a000-000000000001');

-- Un retiro por caso (R1 a R6), registrados por el educador.
INSERT INTO retiros (id, nnya_id, tutor_id, created_by, autorizacion_retiro_id)
SELECT ('60000000-0000-4000-a000-00000000000' || n)::uuid,
       '20000000-0000-4000-a000-000000000001', '30000000-0000-4000-a000-000000000001',
       '10000000-0000-4000-a000-000000000002', '50000000-0000-4000-a000-000000000001'
FROM generate_series(1, 6) AS n;

-- Sesión pendiente de R1 (creada por el servidor, sin resultado todavía).
INSERT INTO sesiones_didit (id, session_id, proposito, retiro_id, creada_por)
VALUES ('70000000-0000-4000-a000-000000000001', 'qa-r1-pendiente', 'retiro',
        '60000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000002');

-- ── Como Equipo Tecnico ─────────────────────────────────────
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-a000-000000000002","role":"authenticated"}', TRUE) \gset

-- S1: insertar una sesión que ya diga Approved.
DO $$
BEGIN
  INSERT INTO sesiones_didit (session_id, proposito, retiro_id, creada_por, estado_didit, dni_coincide)
  VALUES ('qa-s1', 'retiro', '60000000-0000-4000-a000-000000000001',
          '10000000-0000-4000-a000-000000000002', 'Approved', TRUE);
  RAISE EXCEPTION 'FALLO S1: Equipo Tecnico pudo insertar una sesión Approved';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'OK S1: RLS bloquea insertar una sesión Approved';
END $$;

-- S2: insertar una sesión con dni_coincide cargado de antemano.
DO $$
BEGIN
  INSERT INTO sesiones_didit (session_id, proposito, retiro_id, creada_por, dni_coincide)
  VALUES ('qa-s2', 'retiro', '60000000-0000-4000-a000-000000000001',
          '10000000-0000-4000-a000-000000000002', TRUE);
  RAISE EXCEPTION 'FALLO S2: Equipo Tecnico pudo cargar dni_coincide';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'OK S2: RLS bloquea cargar dni_coincide desde el cliente';
END $$;

-- S3: cambiar una sesión existente a Approved.
DO $$
DECLARE
  v_filas INTEGER;
BEGIN
  UPDATE sesiones_didit
  SET estado_didit = 'Approved', dni_coincide = TRUE
  WHERE id = '70000000-0000-4000-a000-000000000001';
  GET DIAGNOSTICS v_filas = ROW_COUNT;
  IF v_filas <> 0 THEN
    RAISE EXCEPTION 'FALLO S3: Equipo Tecnico pudo modificar % sesión(es)', v_filas;
  END IF;
  RAISE NOTICE 'OK S3: no hay política de UPDATE en sesiones_didit (0 filas)';
END $$;

-- S4: autorizar o realizar un retiro sin sesión verificada (Seguridad 2).
DO $$
BEGIN
  BEGIN
    UPDATE retiros SET resultado_autorizacion = 'autorizada'
    WHERE id = '60000000-0000-4000-a000-000000000001';
    RAISE EXCEPTION 'FALLO S4: se autorizó un retiro sin identidad verificada';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'No se puede autorizar o realizar el retiro%' THEN RAISE; END IF;
  END;
  BEGIN
    UPDATE retiros SET estado = 'realizada'
    WHERE id = '60000000-0000-4000-a000-000000000001';
    RAISE EXCEPTION 'FALLO S4: se realizó un retiro sin identidad verificada';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'No se puede autorizar o realizar el retiro%' THEN RAISE; END IF;
  END;
  RAISE NOTICE 'OK S4: autorizada y realizada bloqueadas sin identidad verificada';
END $$;

-- ── Sesiones con resultado (como postgres, simulando al webhook) ─
RESET ROLE;

-- R2: Approved con otro DNI. R3: Approved con el DNI esperado.
INSERT INTO sesiones_didit (session_id, proposito, retiro_id, creada_por, estado_didit, dni_coincide, finalizada_at)
VALUES
  ('qa-r2-otro-dni', 'retiro', '60000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000002', 'Approved', FALSE, NOW()),
  ('qa-r3-ok', 'retiro', '60000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000002', 'Approved', TRUE, NOW());

DO $$
BEGIN
  IF (SELECT estado_rnf12 FROM sesiones_didit WHERE session_id = 'qa-r2-otro-dni') <> 'Identidad no verificada'
     OR (SELECT estado_rnf12 FROM sesiones_didit WHERE session_id = 'qa-r3-ok') <> 'Identidad verificada' THEN
    RAISE EXCEPTION 'FALLO S5/S6: estado_rnf12 no refleja dni_coincide';
  END IF;
END $$;

SET LOCAL ROLE authenticated;

-- S5: Approved con otro DNI no habilita el retiro (D-14).
DO $$
BEGIN
  UPDATE retiros SET resultado_autorizacion = 'autorizada'
  WHERE id = '60000000-0000-4000-a000-000000000002';
  RAISE EXCEPTION 'FALLO S5: se autorizó un retiro con otro DNI';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM NOT LIKE 'No se puede autorizar o realizar el retiro%' THEN RAISE; END IF;
  RAISE NOTICE 'OK S5: Approved con otro DNI queda "Identidad no verificada" y no autoriza';
END $$;

-- S6: Approved con el DNI esperado sí habilita el retiro.
DO $$
DECLARE
  v_filas INTEGER;
BEGIN
  UPDATE retiros SET resultado_autorizacion = 'autorizada'
  WHERE id = '60000000-0000-4000-a000-000000000003';
  GET DIAGNOSTICS v_filas = ROW_COUNT;
  IF v_filas <> 1 THEN
    RAISE EXCEPTION 'FALLO S6: no se pudo autorizar un retiro verificado';
  END IF;
  RAISE NOTICE 'OK S6: Approved con el DNI esperado autoriza el retiro';
END $$;

RESET ROLE;

-- S7 a S9: CHECK de la tabla.
DO $$
BEGIN
  BEGIN
    INSERT INTO sesiones_didit (session_id, proposito, retiro_id, creada_por, estado_didit)
    VALUES ('qa-s7', 'retiro', '60000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000002', 'Approved');
    RAISE EXCEPTION 'FALLO S7: se guardó un Approved sin dni_coincide';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK S7: Approved exige dni_coincide';
  END;

  BEGIN
    INSERT INTO sesiones_didit (session_id, proposito, retiro_id, creada_por, estado_didit, error_proveedor)
    VALUES ('qa-s8', 'retiro', '60000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000002', 'Declined', 'no_match');
    RAISE EXCEPTION 'FALLO S8: se guardó error_proveedor = no_match';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK S8: error_proveedor solo admite provider_error y didit_no_disponible';
  END;

  BEGIN
    INSERT INTO sesiones_didit (session_id, proposito, retiro_id, creada_por, error_proveedor)
    VALUES (NULL, 'retiro', '60000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000002', 'provider_error');
    RAISE EXCEPTION 'FALLO S9: se guardó provider_error sin session_id';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK S9: sin session_id el error tiene que ser didit_no_disponible';
  END;
END $$;

-- S10: 3 Approved con otro DNI → revisión, y el 4.º intento se rechaza.
INSERT INTO sesiones_didit (session_id, proposito, retiro_id, creada_por, estado_didit, dni_coincide, finalizada_at)
SELECT 'qa-r4-' || n, 'retiro', '60000000-0000-4000-a000-000000000004',
       '10000000-0000-4000-a000-000000000002', 'Approved', FALSE, NOW()
FROM generate_series(1, 3) AS n;

DO $$
BEGIN
  IF (SELECT estado FROM retiros WHERE id = '60000000-0000-4000-a000-000000000004') <> 'requiere_revision' THEN
    RAISE EXCEPTION 'FALLO S10: 3 intentos con otro DNI no dejaron el retiro en revisión';
  END IF;
  BEGIN
    INSERT INTO sesiones_didit (session_id, proposito, retiro_id, creada_por)
    VALUES ('qa-r4-4', 'retiro', '60000000-0000-4000-a000-000000000004', '10000000-0000-4000-a000-000000000002');
    RAISE EXCEPTION 'FALLO S10: se creó un 4.º intento';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Se alcanzó el máximo de 3 intentos%' THEN RAISE; END IF;
  END;
  RAISE NOTICE 'OK S10: 3 intentos con otro DNI → requiere_revision, y el 4.º se rechaza';
END $$;

-- S11: los errores del proveedor no cuentan como intento (D-12).
INSERT INTO sesiones_didit (session_id, proposito, retiro_id, creada_por, estado_didit, error_proveedor, finalizada_at)
VALUES
  ('qa-r5-pe1', 'retiro', '60000000-0000-4000-a000-000000000005', '10000000-0000-4000-a000-000000000002', 'Declined', 'provider_error', NOW()),
  ('qa-r5-pe2', 'retiro', '60000000-0000-4000-a000-000000000005', '10000000-0000-4000-a000-000000000002', 'Declined', 'provider_error', NOW()),
  ('qa-r5-nm', 'retiro', '60000000-0000-4000-a000-000000000005', '10000000-0000-4000-a000-000000000002', 'Declined', NULL, NOW());

DO $$
BEGIN
  IF (SELECT estado FROM retiros WHERE id = '60000000-0000-4000-a000-000000000005') <> 'en_curso' THEN
    RAISE EXCEPTION 'FALLO S11: los errores del proveedor contaron como intento';
  END IF;
  RAISE NOTICE 'OK S11: 2 provider_error + 1 no_match no pasan a revisión';
END $$;

-- S12: el fallback solo lo autoriza un Admin (D-2).
INSERT INTO sesiones_didit (session_id, proposito, retiro_id, creada_por, estado_didit, error_proveedor, finalizada_at)
VALUES ('qa-r6-pe', 'retiro', '60000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000002', 'Declined', 'provider_error', NOW());

SET LOCAL ROLE authenticated;

DO $$
BEGIN
  UPDATE retiros
  SET metodo_verificacion = 'manual', autorizado_por = '10000000-0000-4000-a000-000000000002',
      autorizado_at = NOW(), motivo_fallback = 'Prueba QA', resultado_autorizacion = 'autorizada'
  WHERE id = '60000000-0000-4000-a000-000000000006';
  RAISE EXCEPTION 'FALLO S12: Equipo Tecnico aplicó el fallback';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM NOT LIKE 'Solo un usuario Admin%' THEN RAISE; END IF;
END $$;

SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}', TRUE) \gset

DO $$
DECLARE
  v_filas INTEGER;
BEGIN
  UPDATE retiros
  SET metodo_verificacion = 'manual', autorizado_por = '10000000-0000-4000-a000-000000000001',
      autorizado_at = NOW(), motivo_fallback = 'Prueba QA', resultado_autorizacion = 'autorizada'
  WHERE id = '60000000-0000-4000-a000-000000000006';
  GET DIAGNOSTICS v_filas = ROW_COUNT;
  IF v_filas <> 1 THEN
    RAISE EXCEPTION 'FALLO S12: el Admin no pudo aplicar el fallback';
  END IF;
  RAISE NOTICE 'OK S12: el fallback lo bloquea para Equipo Tecnico y lo permite al Admin';
END $$;

RESET ROLE;

ROLLBACK;
