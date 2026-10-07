# Innovación 1 — Lo que falta por integrante

**Fecha:** 2026-10-07
**Innovación:** validación de identidad con RENAPER vía Didit, para dos usos: el **retiro** de un NNyA por su tutor autorizado y el **alta de referentes** en la revinculación familiar (proceso 1.5).
**Decisiones vigentes:** D-1 a D-17 en `DECISIONES-PENDIENTES-INNOVACIONES.md`. **Modelo de datos:** `prompts/028-modelo-datos-didit-retiros.md` (aprobado).

> Cada tarea que toque código o schema sigue el ciclo de `AGENTS-WEB.md`: plan en `prompts/`, aprobación de Jordy, implementación y PR desde una rama propia.

---

## Orden de dependencias

```
Jordy (consola Didit + 3 definiciones)
        │
Sofi ── migración #18 ──────────────┐
        │                           │
Meli ── requisitos + contrato ──► webhook y endpoints #23 ──► tests
        │                                                      │
Cami ── diseño con datos de ejemplo ──────────────► pantallas #26 conectadas
```

- **Arrancan ya:** Jordy, Sofi (#18), Meli (requisitos y contrato) y Cami (solo diseño, cuando Meli tenga el contrato).
- **Bloqueado:** la lógica del webhook espera la migración. Las pantallas conectadas esperan los endpoints.

---

## Lo que ya está hecho

| Qué | Dónde |
|---|---|
| Cuenta de Didit en modo de prueba, workflow `id_lookup` (DNI + selfie contra RENAPER) | App "arguelloinfancias (Sandbox)", workflow v2 |
| Webhook en producción que verifica la firma HMAC y la ventana anti-replay | `app/api/didit/webhook/route.ts` (`prompts/016`) |
| Webhook fuera del proxy: se testea sin variables de Supabase | `proxy.ts` (`prompts/032`) |
| Webhook probado con Didit real: 9 notificaciones, todas `200` | Sandbox, 07/10 |
| Estructura real de la respuesta de Didit y mapeo de resultados | D-11 a D-14 |
| Modelo de datos aprobado: `retiros`, `sesiones_didit`, `autorizaciones_retiro` | `prompts/028` (PR #17) |
| Decisiones de negocio: intentos, fallback, quién retira, antecedentes, vínculo `propuesto` | D-1 a D-17 |
| Validación RENAPER **manual** de referentes (la que se reemplaza) | `ValidarRenaperForm`, `prompts/019` |

---

## Jordy — producto, decisiones y consola de Didit

**Consola de Didit**
- [ ] **Publicar el borrador v3 del workflow** (`max_attempts: 1`, D-12). Antes, confirmar que no agregó prueba de vida ni comparación facial: Didit cambia solo `skip_liveness_and_face_match` a `false`.
- [ ] **Retención de datos:** pasar de "Ilimitado" a un plazo corto (D-13). Recomendado: 30 días.
- [ ] **Datos devueltos:** restringir el panel "Returned data" a lo que usa el webhook (D-13). Después, sesión de prueba para confirmar que siguen llegando `status`, `fallback_from` y `personal_number`.

**Definiciones que bloquean a Meli y Cami**
- [ ] **Dispositivo:** ¿la persona verifica con su propio celular (QR), con una tablet de la residencia o se habilita la PC?
- [ ] **Prueba de vida:** ¿la exige la entrega académica? Si sí, hay que agregarla al workflow (informe del 13/09, § 8).
- [ ] **Texto de consentimiento** que se le muestra al adulto antes de verificar (Ley 25.326, requisito previo 4 de la Práctica 3).

**Revisión**
- [ ] Revisar y aprobar: la migración de Sofi (#18), los planes de Meli (029 a 031) y el diseño de Cami (#26).
- [ ] Si Meli y Cami siguen sin aceptar, reenviarles la invitación al repo.

---

## Sofi — modelo de datos

- [ ] **Migración #18** según el Plan 028, en una rama nueva y probada en Supabase local. Tiene que resolver los 4 puntos de la aprobación:
  1. El retiro rechaza una autorización revocada o vencida (RN-01).
  2. `resultado_autorizacion` con valor `pendiente` mientras el retiro está `en_curso`.
  3. El mapeo `id_lookup` → `estado_dni` ya está definido en **D-11**: usarlo.
  4. Detalles del SQL: "Error del proveedor" / "Pendiente" en `estado_rnf12`, `restricciones` como `TEXT`, `CHECK (vigente_hasta >= vigente_desde)` y `RESTRICT` explícito.
- [ ] **Trigger de D-16** (comentario en el #18): un vínculo con referente no pasa a `vigente` sin una validación aprobada. Puede ir en la misma migración o aparte.
- [ ] **D-12** en el modelo: un `Declined` por `provider_error` no cuenta como intento. Ajustar la función que cuenta intentos.
- [ ] **RLS del webhook:** definir si escribe con service role (solo del lado servidor) o con una función `SECURITY DEFINER`, junto con Meli.
- [ ] Regenerar los tipos (`types/database.generated.ts`) después de aplicar la migración.

---

## Meli — requisitos, integración backend y QA

**Para empezar**
- [ ] **Aceptar la invitación al repo** `cielo-abierto` (pendiente desde septiembre).
- [ ] **Subir lo que ya tiene:** planes 029 a 031 y los 14 tests de firma, pasados a `tests/unit/` con `node:test` (issue #21).

**Requisitos (antes de que Cami diseñe)**
- [ ] Actualizar los RF y RNF de la Práctica 3 (documento de re-vinculación):
  - **Desactualizados:** método (es `id_lookup`, no documento + liveness), RF-10 sin regla de borrado, URL de la selfie que llega al webhook.
  - **RF que faltan:** intentos (D-3, D-12), fallback (D-2), comparar el DNI (D-14), vínculo `propuesto` (D-16), cuándo se valida (D-15, D-17), consultar el estado, dispositivo, consentimiento, quién atiende "Requiere revisión".
  - **RNF a precisar:** valores de timeout y reintentos (RNF-13), tiempo hasta el resultado, vencimiento de la sesión (Didit: 7 días), plazo de retención, usabilidad en celular, antecedentes fuera de alcance (D-15).

**Contrato para Cami** (en el plan)
- [ ] **Crear sesión:** ruta, qué recibe (`retiro_id` o `referente_id`), qué devuelve (URL o token de Didit, nuestro `id`), qué responde si Didit falla, qué roles.
- [ ] **Consultar estado:** estado RNF-12, intentos usados, motivo, si el fallback está habilitado. Definir polling o alternativa.
- [ ] **Fallback manual:** acción del Admin, con motivo obligatorio.
- [ ] **Errores:** qué recibe la pantalla para los 4 mensajes de la Práctica 3 (§ 6, A-D) y para "el DNI no coincide".

**Implementación (#23, después de la migración)**
- [ ] **Endpoint para crear la sesión:** DNI desde la base en `expected_details.identification_number` (D-14), `vendor_data` con nuestro `id`, timeout y manejo de errores (RNF-13). Si Didit no crea la sesión, registrar "Error del proveedor" sin `session_id`.
- [ ] **Lógica del webhook** (el `TODO(Meli)` de `route.ts`):
  - buscar la sesión;
  - leer `fallback_from.reason` (en los rechazos, `id_lookup` llega `null`);
  - aplicar D-1, D-11 y D-12;
  - comparar `personal_number` con el DNI esperado (D-14);
  - en referentes, crear la fila de `validaciones_renaper` sin `respuesta_cruda` de Didit;
  - `session_id` desconocido → `200` + log, sin escribir (D-4);
  - nunca loguear la selfie ni el `decision`.
- [ ] **Endpoint para consultar el estado.**
- [ ] **Reemplazar la carga manual** de `useCreateValidacionRenaper` por la sesión de Didit.
- [ ] **Borrar la sesión en Didit** una vez registrado el resultado (RF-10), si se decide así.

**Tests**
- [ ] **E-4:** contrato del webhook sin Supabase (firma, `401`, `400`, `200`, sesión desconocida).
- [ ] **Escenarios A-D de la Práctica 3** y los derivados, con sesiones de sandbox (`approve`, `lookup_no_match`, `lookup_partial_match`, `lookup_provider_error`). Borrarlas al terminar.

---

## Cami — UI/UX y frontend

**Para empezar**
- [ ] **Aceptar la invitación al repo** `cielo-abierto`.

**Diseño (cuando Meli tenga el contrato; se puede maquetar con datos de ejemplo)**
- [ ] **Registrar retiro:** elegir el NNyA → lista de **tutores con autorización vigente**, con sus restricciones visibles → iniciar la verificación.
- [ ] **Verificación:** pantalla de consentimiento → acceso a Didit según el dispositivo que defina Jordy (QR, link o pestaña) → "esperando resultado" con los intentos restantes.
- [ ] **Resultado:** los 5 estados de RNF-12 con badges distintos (`docs/design-system.md`) y los mensajes A-D de la Práctica 3 tal cual están escritos. "Error del proveedor" se ve distinto de "Identidad no verificada", porque no gasta intento.
- [ ] **Fallback manual:** visible solo para Admin y solo cuando corresponde (3 intentos fallidos o error del proveedor), con motivo obligatorio.
- [ ] **Registro y cierre del retiro:** hora de inicio, descripción y observaciones → después, hora de fin y "Realizada".
- [ ] **Referentes:** reemplazar `ValidarRenaperForm` (carga manual) por "Validar identidad" con Didit, y mostrar el vínculo en `propuesto` hasta que la validación esté aprobada (D-16).

**Integración (#26, después de los endpoints de Meli)**
- [ ] Conectar las pantallas a los endpoints reales y probarlas con sesiones de sandbox.

---

## Cómo saber que la innovación 1 está terminada

- [ ] Un retiro completo funciona de punta a punta en sandbox: aprobado, rechazado, error del proveedor y fallback del Admin.
- [ ] Una validación de referente con Didit habilita el vínculo `vigente`; sin validación, la base lo rechaza.
- [ ] No se guardan selfies, fotos de RENAPER, nombre ni domicilio de Didit, ni en la base ni en los logs.
- [ ] Todo queda en el audit log.
- [ ] Hay tests verdes del webhook y de los escenarios A-D.
- [ ] Los RF y RNF de la Práctica 3 coinciden con lo implementado.
