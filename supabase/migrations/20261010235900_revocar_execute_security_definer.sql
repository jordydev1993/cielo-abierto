-- prompts/038: quitar EXECUTE a anon (y a authenticated donde no hace falta) en las funciones
-- SECURITY DEFINER expuestas por /rest/v1/rpc, y fijar search_path en las 2 que no lo tenían.
-- Advisors 0028, 0029 y 0011 del 10/10/2026.

-- Funciones de trigger: nadie las llama por RPC. Postgres no exige EXECUTE para disparar
-- un trigger (solo para crearlo), así que los triggers siguen funcionando.
-- postgres y service_role conservan sus permisos explícitos.
REVOKE EXECUTE ON FUNCTION public.fn_audit_trigger()                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_crear_alerta_incidente_grave()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_crear_seguimiento_post_egreso()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_reportes_senaf_bloquear_aprobado() FROM PUBLIC, anon, authenticated;

-- get_my_role: la usan 56 políticas RLS (todas TO authenticated), fn_proteger_dni_referente
-- (SECURITY INVOKER) y las rutas app/api/usuarios y app/api/reportes/senaf, siempre con sesión.
-- Sin sesión no tiene uso: se le quita a anon y queda para authenticated.
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- search_path fijo (advisor 0011). Ambas usan solo tablas y funciones de public.
ALTER FUNCTION public.fn_crear_alerta_incidente_grave() SET search_path = public;
ALTER FUNCTION public.fn_proteger_dni_referente()       SET search_path = public;
