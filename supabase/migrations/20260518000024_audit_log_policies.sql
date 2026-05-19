-- Permite que el trigger fn_audit_trigger inserte en audit_log sin restricciones RLS.
-- El trigger es SECURITY DEFINER (corre como postgres), pero este policy garantiza
-- que también funcione si Supabase aplica FORCE ROW LEVEL SECURITY.
CREATE POLICY "audit_log_system_insert" ON audit_log
  FOR INSERT
  WITH CHECK (true);
