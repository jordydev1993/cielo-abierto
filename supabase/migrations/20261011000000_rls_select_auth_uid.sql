-- prompts/039: evaluar auth.uid() y get_my_role() una vez por consulta, no por fila (advisor 0003).
-- Misma lógica que las políticas vigentes; solo cambia la forma. ALTER POLICY evita que la
-- tabla quede sin política entre un DROP y un CREATE.

ALTER POLICY usuarios_self_read ON public.usuarios
  USING (auth_user_id = (SELECT auth.uid()));

ALTER POLICY propuestas_mejora_update_admin_o_responsable ON public.propuestas_mejora
  USING (
    (SELECT get_my_role()) = 'Admin'
    OR responsable_id IN (SELECT u.id FROM usuarios u WHERE u.auth_user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT get_my_role()) = 'Admin'
    OR responsable_id IN (SELECT u.id FROM usuarios u WHERE u.auth_user_id = (SELECT auth.uid()))
  );

ALTER POLICY turnos_personal_update_firma ON public.turnos_personal
  USING (
    (SELECT get_my_role()) = 'Admin'
    OR usuario_id   IN (SELECT u.id FROM usuarios u WHERE u.auth_user_id = (SELECT auth.uid()))
    OR recibido_por IN (SELECT u.id FROM usuarios u WHERE u.auth_user_id = (SELECT auth.uid()))
    OR (estado = 'entregado' AND recibido_por IS NULL)
  )
  WITH CHECK (
    (SELECT get_my_role()) = 'Admin'
    OR usuario_id   IN (SELECT u.id FROM usuarios u WHERE u.auth_user_id = (SELECT auth.uid()))
    OR recibido_por IN (SELECT u.id FROM usuarios u WHERE u.auth_user_id = (SELECT auth.uid()))
    OR (estado = 'entregado' AND recibido_por IS NULL)
  );

ALTER POLICY seguimiento_post_egreso_update_admin_o_contactado ON public.seguimiento_post_egreso
  USING (
    (SELECT get_my_role()) = 'Admin'
    OR contactado_por IS NULL
    OR contactado_por IN (SELECT u.id FROM usuarios u WHERE u.auth_user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    (SELECT get_my_role()) = 'Admin'
    OR contactado_por IS NULL
    OR contactado_por IN (SELECT u.id FROM usuarios u WHERE u.auth_user_id = (SELECT auth.uid()))
  );
