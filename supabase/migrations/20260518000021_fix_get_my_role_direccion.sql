-- Fix: get_my_role() ahora normaliza el rol 'Direccion' → 'Admin'.
-- El rol 'Direccion' existe en la institución pero no figura en las políticas
-- RLS (que solo conocen 'Admin', 'Equipo Tecnico', 'Educador'). Sin este mapeo
-- los usuarios con ese rol no pueden hacer INSERT/UPDATE/DELETE en ninguna tabla.
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
