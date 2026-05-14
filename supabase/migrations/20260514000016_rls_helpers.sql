-- Función auxiliar: resuelve el rol del usuario autenticado en una sola consulta.
-- Usada en TODAS las políticas RLS; evitar repetir el JOIN en cada policy.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.nombre
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
  WHERE u.auth_user_id = auth.uid()
    AND u.activo = TRUE
  LIMIT 1;
$$;
