# PLAN: Playwright E2E Testing Setup — ⚠️ SUPERADO / NO ADOPTADO

> ## ⚠️ Este plan NO fue adoptado por el proyecto. Documento histórico.
>
> Se escribió sobre `b4ab8e3`. Al llegar el `master` `84c4d23`, **el proyecto no adoptó esta infraestructura de E2E**:
>
> - **No existe `playwright.config.ts`** en el repositorio.
> - **`@playwright/test` no está en `package.json`**, ni en `dependencies` ni en `devDependencies`.
> - **No existen `tests/01`–`04`.** Los specs E2E no se trasladaron.
> - **No existen los scripts `test`, `test:e2e` ni `test:ui`.** El único script de test del master es **`npm run test:unit`** → `node --experimental-strip-types --no-warnings --test "tests/unit/**/*.test.ts"`, sobre `tests/unit/` con `node:test`.
> - La única cobertura automatizada que existe hoy son **tests de función pura** en `tests/unit/`: `senaf.test.ts` (7) y `didit-signature.test.ts` (14, migrados desde Playwright el 2026-10-05).
>
> **Nada de lo que este plan propone quedó en el master.** Se conserva completo como registro del relevamiento y de las restricciones del trabajo (principalmente: **no crear, borrar ni modificar datos de Supabase**). **No hay tareas pendientes aquí**: no instalar, no configurar, no agregar los specs.
>
> Si el E2E vuelve a considerarse, hay dos bloqueantes previos, ya identificados: (1) las variables `NEXT_PUBLIC_SUPABASE_*` — sin ellas `proxy.ts:7` lanza y toda ruta devuelve 500; (2) la decisión funcional de si los tests prueban comportamiento autenticado o anónimo. Ver `prompts/030-qa-didit-retiro.md` §12 y `prompts/031-qa-testing-integraciones-meli.md`.

## Objetivo
Configurar Playwright para tests E2E en el proyecto `cielo-abierto`, siguiendo las restricciones de no modificar datos en Supabase. La primera etapa comprende: instalación, configuración base, scripts en package.json, estructura de tests, y tests de lectura/navegación solo.

## Contexto
- Playwright está instalado (v1.62.1) como devDependency pero sin configurar.
- No hay tests escritos en el repo.
- Restricciones críticas: NO crear/borrar/editar/modificar datos en Supabase. Solo tests de lectura y navegación.
- El proyecto usa Next.js 16 App Router, Supabase Auth, role-based access (Admin / Equipo Tecnico).
- Documentación clave: AGENTS-WEB.md §7 (prohibiciones), §92 (modelo de datos 28 tablas), §77 (stack confirmado), §81-88 (prohibiciones).

## Archivos inspeccionados
- `package.json` - devDependencies incluye `playwright ^1.60.0`, scripts limitados a dev/build/start/lint
- `playwright` no tiene config.ts ni directory `tests/`
- `app/(auth)/login/page.tsx` - página de login
- `app/(dashboard)/layout.tsx` - layout con Sidebar y AccessGuard
- `context/AuthContext.tsx` - contexto de auth con role via RPC
- `app/api/usuarios/route.ts` - API de creación de usuarios (usa SERVICE_ROLE_KEY)
- `lib/supabase/client.ts` - cliente browser para Supabase
- `hooks/usuarios/useUsuarios.ts` - hook de listing de usuarios
- `components/shared/AccessGuard.tsx` - guard de rutas por rol
- `types/database.types.ts` - tipos de dominio con CHECKs estrechados

## Skills utilizadas
- `testing-nnya` - checklist manual de QA por módulo
- `playwright` - configuración y ejecución de tests E2E

## Supuestos
1. Los tests se ejecutarán contra el entorno actual sin schema separado.
2. No habrá datos de prueba creidos en Supabase; los tests usarán estados existentes o simularán sin escribir.
3. El login se probará con credenciales que ya existan en el sistema o se simulará el estado de auth.
4. Los roles Admin y Equipo Tecnico tienen acceso diferente; los tests verificarán la navegación según rol.
5. Los KPIs del Dashboard se cargan desde queries a tablas existentes (nnya, legajos, alertas).

## Archivos a crear
1. `playwright.config.ts` - configuración base de Playwright
2. `global-setup.ts` - setup global opcional (solo lecturas)
3. `global-teardown.ts` - teardown global opcional
4. `tests/` directory - estructura de specs de test
5. `tests/.gitignore` - para excluir tests de control de versiones

## Archivos a modificar
1. `package.json` - agregar scripts: `test`, `test:e2e`, possibly `test:ui`

## Requisitos
- Playwright configurado con modo headless por defecto.
- Base URL apunta a `http://localhost:3000` (o la URL de dev).
- Tests usable sin modificar datos en Supabase.
- Credenciales de test: usar usuario existente o simular auth state.
- No usar SUPABASE_SERVICE_ROLE_KEY en tests de cliente.

## Seguridad
- Nunca exponer credenciales reales en los tests.
- Los tests deben ser readonly - solo navegar, verificar textos, capturar screenshots.
- Si es necesario crear un usuario de test, hacerlo en un entorno aislado o usando la API de admin con precautions.
- No modificar RLS policies ni schema de base de datos.

## Criterios de aceptación
1. `npx playwright test` ejecuta sin errores.
2. `npx playwright test --help` muestra las opciones disponibles.
3. Al menos 4 tests implementados y passing:
   - a) Carga de la aplicación (home redirige a login)
   - b) Navegación según rol (sidebar visible según role)
   - c) Carga del Dashboard/KPIs (stats sin error)
   - d) Login/logout flow (verificar que el flujo auth funciona sin crear usuarios)
4. No hay modificaciones en Supabase (tabla counts unchanged después de tests).

## Chequeos
- `npm run lint` pasa limpio.
- `npm run build` pasa sin errores.
- `npx tsc --noEmit` sin errores de tipo.
- Los tests no alteran el count de registros en las tablas Supabase usadas.

## Verificación manual
1. Levantar el servidor: `npm run dev`
2. Acceder a la app y verificar que los tests E2E pasan.
3. Revisar screenshots y traces en la carpeta `.playwright/test-results/`.
4. Confirmar que los datos en Supabase siguen siendo los mismos antes y después de los tests.

# Checklist rápida
- [ ] Crear playwright.config.ts
- [ ] Agregar scripts a package.json
- [ ] Crear directory tests/ y files base
- [ ] Implementar 4 tests de lectura/navegación
- [ ] Ejecutar `npm run lint` y `npm run build` - verificar pasar
- [ ] Ejecutar `npx tsc --noEmit` - verificar pasar
- [ ] Ejecutar `npx playwright test` - verificar tests passing
- [ ] Informar al usuario los resultados
