-- Fix definitivo: get_my_role() con row_security = off.
--
-- Problema: la función se llama desde políticas RLS de `roles` y `usuarios`.
-- Cuando intenta hacer JOIN con `roles`, esa tabla también tiene RLS que vuelve
-- a llamar get_my_role() → recursión → resultado NULL → rol nunca se resuelve.
--
-- SET row_security = off dentro de una función SECURITY DEFINER desactiva RLS
-- para todas las queries dentro de la función, rompiendo el ciclo definitivamente.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT CASE r.nombre WHEN 'Direccion' THEN 'Admin' ELSE r.nombre END
  INTO result
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
  WHERE u.auth_user_id = auth.uid()
    AND u.activo = TRUE
  LIMIT 1;
  RETURN result;
END;
$$;
