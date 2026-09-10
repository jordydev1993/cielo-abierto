# 002 — Proteger `app/api/usuarios` con chequeo de rol

## Objetivo

Que `POST /api/usuarios` solo pueda ser ejecutado por un usuario autenticado con rol `Admin`, cerrando el gap de seguridad documentado en `AGENTS-WEB.md` § Deuda conocida (punto 4).

## Contexto

`proxy.ts` ya exige una sesión autenticada para llegar a cualquier ruta que no sea `/login` (incluye `/api/*`, su matcher solo excluye assets estáticos). Pero **no valida rol**, solo que exista un usuario logueado. `app/api/usuarios/route.ts` usa `SUPABASE_SERVICE_ROLE_KEY` (correctamente, solo server-side) para crear un usuario en Supabase Auth + insertar en la tabla `usuarios`, y **no verifica el rol de quien llama**.

Confirmé además que `usuarioCreateSchema` (`lib/validations/usuarios.schema.ts`) acepta `rol_id` como cualquier UUID válido, sin restricción. Esto significa que **cualquier usuario autenticado con rol `Equipo Tecnico`** (que según la matriz de permisos de `procesos-del-negocio.md` § 3 no debería tener ningún acceso a Gestión de Usuarios) puede llamar directamente a este endpoint —sin pasar por la UI, que sí está protegida con `AccessGuard` del lado del cliente— y crearse una cuenta propia con `rol_id` de Admin. Como el insert usa la service_role key, no hay RLS que lo bloquee. Es una escalada de privilegios real, no solo teórica.

No es acceso anónimo (la sesión es obligatoria por `proxy.ts`), pero sí es una violación clara de la matriz de permisos documentada.

## Archivos inspeccionados

- `app/api/usuarios/route.ts`
- `lib/validations/usuarios.schema.ts`
- `proxy.ts`
- `lib/supabase/server.ts`
- `context/AuthContext.tsx` (uso de la RPC `get_my_role`)

## Skills utilizadas

- `role-permission.skill.md` (matriz de permisos: Admin CRUD completo sobre Usuarios/Roles, Equipo Tecnico sin acceso)
- `auth-implementation.skill.md` (flujo de sesión con Supabase Auth + Next.js 16)

## Supuestos

- La RPC `get_my_role()` ya existente en la base (usada hoy desde el cliente vía `context/AuthContext.tsx`) también puede invocarse server-side con el cliente de `lib/supabase/server.ts` (cookies de sesión), sin necesitar una RPC nueva.
- No se cambia la firma del endpoint ni el contrato con el frontend — solo se agrega la validación de rol antes de ejecutar la lógica actual.
- El mismo problema (falta de chequeo de rol server-side) podría existir en otras rutas si se agregan en el futuro; este plan solo cubre `app/api/usuarios/route.ts`, que es el único endpoint privilegiado confirmado hoy (`app/api/incidentes/prediccion` no usa `service_role` ni opera sobre datos de administración).

## Archivos a crear

Ninguno.

## Archivos a modificar

- `arguello-infancias/app/api/usuarios/route.ts`: al inicio del `POST`, antes de crear el cliente admin, obtener el usuario y su rol con el cliente server (`lib/supabase/server.ts`) llamando a la RPC `get_my_role`; si no hay sesión o el rol no es `Admin`, devolver `401`/`403` sin ejecutar ninguna operación privilegiada.

## Requisitos de implementación

1. Usar `createClient()` de `lib/supabase/server.ts` (cliente con cookies de sesión, respeta RLS) para:
   - Obtener el usuario autenticado (`supabase.auth.getUser()`).
   - Si no hay usuario → `401` con mensaje claro.
   - Llamar a `supabase.rpc('get_my_role')`.
   - Si el rol no es `'Admin'` → `403` con mensaje claro (reutilizar el estilo de mensaje de `U-EX-*` ya usado en el archivo, ej. `"Acceso denegado: su rol no cuenta con los permisos necesarios para gestionar usuarios."`).
2. Solo si pasa ambas validaciones, continuar con el flujo actual (cliente admin con `service_role`, alta en Auth, insert en `usuarios`).
3. No modificar el comportamiento para un llamador con rol `Admin` válido — debe seguir funcionando exactamente igual que hoy.

## Seguridad

Este plan es en sí mismo una corrección de seguridad: cierra una escalada de privilegios donde un usuario con rol `Equipo Tecnico` podía crear una cuenta con rol `Admin` llamando directamente al endpoint. No introduce nuevas superficies de riesgo — reutiliza la misma RPC (`get_my_role`) que ya es la fuente de verdad del rol en el resto de la app.

## Criterios de aceptación

- Una request `POST /api/usuarios` sin sesión → `401`.
- Una request `POST /api/usuarios` con sesión de un usuario `Equipo Tecnico` → `403`, y no se crea ningún usuario ni en Auth ni en la tabla `usuarios`.
- Una request `POST /api/usuarios` con sesión de un usuario `Admin` → funciona exactamente igual que antes (`201` con el usuario creado).

## Chequeos

- `npm run lint`
- `tsc --noEmit` (o el chequeo de tipos equivalente que use el proyecto)

## Verificación manual

1. Iniciar sesión como un usuario con rol `Equipo Tecnico` (ej. el usuario semilla de ese rol).
2. Con la sesión activa, hacer `POST` directo a `/api/usuarios` (ej. con `curl`/Postman usando la cookie de sesión del navegador) con un `rol_id` de Admin y datos válidos → confirmar que responde `403` y que no aparece un usuario nuevo en `/usuarios` ni en Supabase Auth.
3. Repetir el mismo `POST` sin ninguna cookie de sesión → confirmar `401`.
4. Iniciar sesión como `Admin`, crear un usuario nuevo desde la UI (`/usuarios/nuevo`) → confirmar que sigue funcionando igual que antes de este cambio.

---

**Estado**: pendiente de aprobación. No implementar hasta recibir "Aprobado" o "Ejecuta".
