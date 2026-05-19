-- Root cause fix: infinite RLS recursion that causes ALL data queries to hang.
--
-- Chain:
--   SELECT from nnya/tutores/etc.
--   → RLS: get_my_role() IN ('Admin', 'Equipo Tecnico')
--   → get_my_role() queries usuarios
--   → usuarios RLS: usuarios_admin_all calls get_my_role() = 'Admin'
--   → get_my_role() queries usuarios again → infinite recursion
--   → connection crashes with no response → client hangs indefinitely
--
-- Fix: recursion guard via a transaction-local setting.
-- On recursive entry, return NULL immediately.
-- The current user's row is still found via usuarios_self_read
-- (auth_user_id = auth.uid()), which does NOT call get_my_role().
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE result TEXT;
BEGIN
  IF current_setting('app.getting_role', true) = 'yes' THEN
    RETURN NULL;
  END IF;
  PERFORM set_config('app.getting_role', 'yes', true);

  SELECT CASE r.nombre WHEN 'Direccion' THEN 'Admin' ELSE r.nombre END
  INTO result
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
  WHERE u.auth_user_id = auth.uid()
    AND u.activo = TRUE
  LIMIT 1;

  PERFORM set_config('app.getting_role', '', true);
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('app.getting_role', '', true);
  RAISE;
END;
$$;
