# 049 — Pantallas reales de retiro y validación de referentes con Didit (#26)

> **Estado: PLAN, pendiente de aprobación (21/10).** Paso 5 de lo que queda de la innovación 1. Usa los endpoints del Plan 047 y el webhook del 048. Se basa en las pantallas de diseño de Cami (`/retiros-demo`, PR #42) y en el flujo del Plan 035 §8.

## Objetivo

Que la residencia pueda, en la aplicación real:
- cargar quién está autorizado a retirar a cada NNyA;
- registrar un retiro con la verificación de identidad en Didit, hasta cerrarlo;
- resolver como Admin los casos en revisión;
- validar con Didit la identidad de un referente.

Todo con los mensajes de D-33 y sin datos de ejemplo. Cubre **REQ-EGR-04** y **REQ-EGR-01/02/03** (`specs/10-egreso-y-tutela.md`).

## Contexto

- **Endpoints** (Plan 047):
  - `POST /api/didit/sesiones` devuelve `url_didit` y los intentos;
  - `GET /api/didit/sesiones/[id]` devuelve `code`, `message`, `estado_rnf12`, los intentos y `fallback_habilitado`;
  - `POST /api/didit/sesiones/[id]/fallback` aplica el fallback del Admin.
- **El webhook** (Plan 048) guarda el resultado. La pantalla solo consulta el estado (N-6: cada 3 a 5 s, hasta 90 s, y después "Seguimos esperando" con un botón "Actualizar").
- **La base**, con RLS y triggers:
  - `retiros` se inserta con una `autorizaciones_retiro` vigente del mismo tutor y NNyA, o el trigger lo rechaza (RN-01);
  - `autorizaciones_retiro` solo la carga y la revoca un **Admin**;
  - Seguridad 2 impide `autorizada` o `realizada` sin identidad verificada;
  - D-16 impide pasar un vínculo a `vigente` sin una validación aprobada.
- **Diseño de Cami** (`components/entities/retiros/*`): el texto de consentimiento (D-25), el selector QR / tablet (D-24), la espera, los 5 estados con `EstadoVerificacionBadge`, la cola de revisión y el registro y cierre. Todo con datos de ejemplo.
- **Lo que no existe hoy:**
  - una pantalla para las autorizaciones de retiro;
  - una entrada "Retiros" en el menú;
  - una forma de generar el QR;
  - hooks para `retiros`, `autorizaciones_retiro` y `sesiones_didit`.
- **Formulario de vínculos:** deja elegir "Vigente" y, si no hay validación aprobada, la base responde con un error crudo (hallazgo del plan 046).

## Archivos inspeccionados

`app/(dashboard)/retiros-demo/page.tsx`, `components/entities/retiros/*` (DiditIdentityFlow, RetiroDemo, DiditReviewQueue, TutoresAutorizadosDemo, EstadoVerificacionBadge), `app/(dashboard)/referentes/page.tsx`, `components/entities/referentes/*`, `components/entities/vinculos-tutela/VinculoTutelaForm.tsx`, `components/legajos/tabs/TutelaTab.tsx`, `app/(dashboard)/layout.tsx` (menú), `hooks/referentes/*`, `hooks/nnya_tutores/*`, `lib/constants/queryKeys.ts`, `lib/didit/mensajes.ts`, `prompts/035` §7 y §8, `package.json`.

## Skills utilizadas

`crud-generator` (patrón Form + List por entidad), `role-permission`, `domain-validation`.

## Decisiones a aprobar

1. **QR con la dependencia `qrcode`** (MIT, sin dependencias de red) y `@types/qrcode`. Se genera en el navegador.
   - **Por qué hace falta:** la URL de Didit lleva el token de la sesión, así que **no** se puede usar un servicio externo para dibujar el QR.
   - **Alternativa sin dependencia:** por ahora, solo "Abrir en esta tablet" y "Copiar link". Eso deja sin cumplir la opción del celular propio de D-24.
2. **Campos obligatorios del registro** (mensaje D de D-33):
   - al empezar: el NNyA y el tutor con autorización vigente;
   - al registrar: la hora de inicio y la descripción;
   - las observaciones son opcionales;
   - al cerrar, la hora de finalización es obligatoria (mensaje E).
3. **Casos en revisión, para Admin:** además del fallback, una acción **"Rechazar retiro"** con motivo, que deja `estado = 'rechazada'`, `resultado_autorizacion = 'rechazada'` y el `motivo_rechazo`. Hoy un retiro en revisión no tiene forma de cerrarse sin autorizarlo.
4. **Referentes:**
   - se suma **"Validar identidad con Didit"**;
   - la **validación manual se mantiene** como estaba, tal como se pidió en la revisión del PR #42;
   - en el formulario de vínculos, la opción "Vigente" queda deshabilitada mientras el referente no tenga una validación `aprobado`, con un texto que explica por qué;
   - el error de la base se muestra con un mensaje claro.
5. **`/retiros-demo` se mantiene** como está, como demostración para la tesis. No se borra el trabajo de Cami. Del menú, "Retiros" lleva a la pantalla real.
6. **El selector de escenario de sandbox** (`prompts/045`, Supuesto 5) lo decide el servidor. `page.tsx` es un componente de servidor que lee `DIDIT_SANDBOX_SCENARIOS` y se lo pasa al componente de cliente. No se crea ninguna variable `NEXT_PUBLIC_`.

## Archivos a crear o modificar

**Retiros** (`/retiros`, en el menú, para Admin y Equipo Tecnico):

| Archivo | Qué |
|---|---|
| `app/(dashboard)/retiros/page.tsx` | Componente de servidor: lee `DIDIT_SANDBOX_SCENARIOS` y renderiza `RetirosPanel` |
| `components/entities/retiros/RetirosPanel.tsx` | Pestañas: "Registrar retiro", "Retiros en curso", "Casos en revisión" (solo Admin) y "Autorizaciones" (solo Admin) |
| `components/entities/retiros/RegistrarRetiro.tsx` | Asistente en pasos (Plan 035 §8.1): NNyA → tutor autorizado, con sus restricciones → consentimiento → verificación → resultado → registro |
| `components/entities/retiros/ConsentimientoDidit.tsx` | El texto de consentimiento de Cami, pasado a un componente compartido. Aceptar o no aceptar (D-26) |
| `components/entities/retiros/VerificacionDidit.tsx` | Compartido por retiro y referente. Crea la sesión, muestra el QR o el botón para la tablet, los intentos, la espera con polling, el resultado con el mensaje de D-33 y el fallback si está habilitado. El selector de escenario aparece solo en sandbox |
| `components/entities/retiros/RetiroList.tsx` | Retiros en curso y recientes. Desde acá se retoma la verificación, se registra o se cierra (mensaje E) |
| `components/entities/retiros/CasosRevisionList.tsx` | Admin: retiros en `requiere_revision`, con error del proveedor o sin consentimiento. Desde acá se aplica el fallback o se rechaza (decisión 3) |
| `components/entities/autorizaciones-retiro/AutorizacionForm.tsx` + `AutorizacionList.tsx` | Admin: por NNyA, el alta de una autorización para un tutor vinculado (vigente desde y hasta, restricciones) y la revocación |
| `hooks/retiros/*` | `useRetiros`, `useCreateRetiro`, `useUpdateRetiroConsentimiento`, `useRegistrarRetiro`, `useCerrarRetiro` y `useRechazarRetiro` |
| `hooks/autorizaciones-retiro/*` | `useAutorizacionesByNnya`, `useCreateAutorizacion` y `useRevocarAutorizacion` |
| `hooks/didit/*` | `useCrearSesionDidit`, `useSesionDidit` (polling con `refetchInterval` que corta en un estado final o a los 90 s) y `useFallbackDidit` |
| `lib/validations/retiros.schema.ts`, `autorizaciones-retiro.schema.ts` | Zod con los mensajes D y E de D-33 |
| `lib/constants/queryKeys.ts` | `retiros`, `autorizacionesRetiro` y `sesionesDidit` |
| `types/database.types.ts` | Los tipos de dominio `Retiro`, `AutorizacionRetiro` y `SesionDidit`, con los `CHECK` angostados a uniones |
| `app/(dashboard)/layout.tsx` | Entrada "Retiros" |

**Referentes y vínculos:**

| Archivo | Qué |
|---|---|
| `components/entities/referentes/ReferenteTable.tsx`, `app/(dashboard)/referentes/page.tsx` | Acción "Validar identidad con Didit": un diálogo con `ConsentimientoDidit` + `VerificacionDidit`, con `proposito: 'validacion_referente'` |
| `components/entities/vinculos-tutela/VinculoTutelaForm.tsx`, `components/legajos/tabs/TutelaTab.tsx` | "Vigente" deshabilitado sin validación aprobada (decisión 4), y el mensaje legible del error de D-16 |

**Pruebas y docs:** `tests/unit/retiros-schema.test.ts` (campos obligatorios y mensajes D y E); `tests/unit/didit-polling.test.ts` (cuándo para el polling); `docs/testingManual/QA-DIDIT-RETIRO.md` (Etapa 3 del plan 045, ya ejecutable); `TAREAS-…`; `README.md` (la dependencia, si se aprueba).

## Requisitos

1. **Registrar retiro**:
   - la lista de tutores sale de `autorizaciones_retiro` vigentes, unidas a `nnya_tutores` (RF02), y muestra las restricciones;
   - al elegir el tutor se crea el retiro `en_curso`, y si la base lo rechaza (autorización vencida o revocada) se muestra el mensaje B;
   - el consentimiento guarda `consentimiento_didit`: si se rechaza, se muestra el mensaje de D-26 y el retiro queda para el Admin.
2. **Verificación:**
   - se crea la sesión y se muestra el QR de `url_didit` o el botón "Abrir en esta tablet" (D-24);
   - se muestran los intentos restantes y se consulta el estado;
   - el resultado muestra el `message` que devuelve la API, sin textos propios para los estados de D-33;
   - con "Identidad no verificada" o "Error del proveedor" y quedando intentos, se ofrece "Reintentar";
   - con el retiro en revisión, se informa y se espera al Admin.
3. **Registro y cierre:** con la identidad verificada, se registran la hora de inicio y la descripción (mensaje D) y se pasa a `resultado_autorizacion = 'autorizada'`. El cierre pide la hora de finalización (mensaje E) y pasa a `estado = 'realizada'`. La base controla las dos cosas con Seguridad 2.
4. **Admin:**
   - casos en revisión: fallback con motivo (`POST …/fallback`) o rechazo (decisión 3);
   - autorizaciones: alta y revocación.
   - Equipo Tecnico no ve esas pestañas (`AccessGuard`). Igual, la garantía es RLS.
5. **Referentes:** misma verificación, con `proposito: 'validacion_referente'` y `consentimiento: true` después de aceptar. Al aprobarse, la última validación se actualiza y "Vigente" se habilita en el vínculo.
6. **Mensajes:**
   - los de la verificación salen de la API (`lib/didit/mensajes.ts`);
   - D y E, de los schemas;
   - la pantalla no inventa textos para los estados de D-33. Lo que no tiene texto en D-33 (la espera, por ejemplo) usa los textos que ya diseñó Cami.
7. **Accesibilidad y celular:** los pasos se pueden recorrer con el teclado, el QR tiene un texto alternativo y un botón "Copiar link", y todo se usa en una tablet en vertical.

## Seguridad

- **La pantalla solo oculta; la base autoriza:** RLS, Seguridad 2, el tope de intentos, el fallback solo de Admin y D-16.
- **El DNI no viaja desde la pantalla** al crear la sesión. Se muestra el del tutor para identificarlo (RF03), como ya se hace en "Tutores".
- **La URL de Didit no se guarda**, no se loguea y no se manda a servicios externos: el QR se genera en el navegador.
- **El selector de sandbox** solo aparece si el servidor lo habilita. En producción no hay variable, y la app `live` rechazaría el escenario.

## Supuestos a verificar

1. RLS permite a Equipo Tecnico leer `autorizaciones_retiro` y `nnya_tutores` (`autorizaciones_retiro_select`). Se verifica al implementar.
2. `retiros_update` deja a Equipo Tecnico actualizar `consentimiento_didit`, `descripcion`, `fecha_inicio`, `fecha_fin` y `estado`. Se verifica al implementar.
3. La prueba real de punta a punta necesita `DIDIT_WORKFLOW_ID` y que el webhook llegue a la base local (con un túnel) o usar el preview. Sin eso, se prueba con sesiones a las que se les manda el webhook firmado a mano.

## Fuera de alcance

- La QA completa del plan 045 (#33, paso 6).
- Aplicar las migraciones y cargar las variables en producción.
- El texto legal definitivo del consentimiento (D-25: revisión legal antes de usar datos reales).
- Borrar `/retiros-demo`.

## Criterios de aceptación

- Un Admin carga una autorización. Un Equipo Tecnico registra un retiro de ese tutor, acepta el consentimiento y ve el QR. Con un webhook `Approved` (con el DNI correcto) ve el mensaje de éxito, registra y cierra el retiro.
- Con `lookup_no_match`, ve el mensaje A y puede reintentar. Al tercer fallo, el retiro aparece en "Casos en revisión" del Admin, que puede aplicar el fallback o rechazarlo.
- Con "Error del proveedor", ve el mensaje C y no se consume intento. Con el consentimiento rechazado, ve el mensaje de D-26.
- Si falta un campo obligatorio, ve el mensaje D. Si cierra sin hora de fin, el mensaje E.
- Un referente validado con Didit habilita "Vigente" en su vínculo. Sin validación, la opción está deshabilitada y explica por qué.
- Equipo Tecnico no ve "Casos en revisión" ni "Autorizaciones".
- `npm run test:unit`, `npm run test:integration`, `npm run test:sql`, `npm run lint` (sin errores nuevos), `npx tsc --noEmit` y `npm run build` en verde.

## Chequeos

`npm run test:unit`, `npm run test:integration`, `npm run test:sql`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Verificación manual

Con `npx supabase start`, `next dev` apuntando a la base local, `DIDIT_SANDBOX_SCENARIOS=true` y los usuarios y datos del plan 045:

1. Recorrer los criterios de aceptación con los dos roles. Elegir el escenario con el selector.
2. Para el resultado, usar el webhook real (con túnel) o el script de webhook firmado de `tests/integration/didit-webhook-db.test.ts`.
3. Borrar las sesiones de Didit al terminar.
