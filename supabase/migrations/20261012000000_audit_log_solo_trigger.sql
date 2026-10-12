-- prompts/040: audit_log solo lo escribe fn_audit_trigger().
-- La política audit_log_system_insert (TO public, WITH CHECK true) y los privilegios por
-- defecto de Supabase dejaban insertar filas falsas con la clave anon (hallazgo del 11/10).
-- fn_audit_trigger es SECURITY DEFINER y corre como postgres, dueño de la tabla: sin
-- FORCE ROW LEVEL SECURITY no necesita política ni GRANT para insertar.

DROP POLICY IF EXISTS audit_log_system_insert ON public.audit_log;

-- Solo el dueño (postgres, el rol de fn_audit_trigger) inserta. Sin FORCE RLS no hace
-- falta; queda para que el trigger siga andando si algún día se activa.
CREATE POLICY audit_log_trigger_insert ON public.audit_log
  FOR INSERT TO postgres
  WITH CHECK (true);

-- anon no tiene nada que hacer con el log; authenticated solo lee (RLS limita a Admin).
REVOKE ALL ON public.audit_log FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.audit_log FROM authenticated;
