# Plan 028 — Modelo de datos para retiros y verificación de identidad con Didit

## Objetivo

Diseñar el modelo de datos necesario para registrar retiros de NNyA y verificaciones de identidad mediante Didit, reutilizando la estructura existente del sistema y respetando las decisiones D-1 a D-10 definidas por Jordy en `DECISIONES-PENDIENTES-INNOVACIONES.md`.

Este documento es únicamente un PLAN. No implementa migraciones ni modifica todavía el esquema de la base de datos.

El modelo debe permitir:

- registrar un retiro y la autorización utilizada;
- verificar únicamente tutores autorizados;
- conservar hasta 3 intentos de verificación Didit por retiro;
- conservar cada sesión Didit, incluso las fallidas;
- reutilizar `sesiones_didit` tanto para retiros como para validación de referentes;
- vincular cada validación RENAPER con la sesión Didit que la originó;
- representar los 5 estados funcionales de RNF-12;
- registrar errores del proveedor aunque Didit no llegue a generar un `session_id`;
- permitir fallback manual únicamente a usuarios con rol `Admin`;
- conservar trazabilidad histórica de autorizaciones;
- impedir inconsistencias entre retiro, tutor, NNyA y autorización;
- aplicar minimización de datos y no persistir información biométrica.

---

## Contexto

El sistema ya cuenta, entre otras, con las siguientes estructuras relevantes:

- `nnya`
- `tutores`
- `nnya_tutores`
- `referentes`
- `vinculos_tutela`
- `validaciones_renaper`
- `usuarios`
- `roles`
- `audit_log`
- `get_my_role()`
- `fn_audit_trigger()`
- triggers `trg_audit_*`

También existe el webhook de Didit en:

`app/api/didit/webhook`

El webhook valida la firma HMAC mediante `DIDIT_WEBHOOK_SECRET`.

La fuente de verdad del esquema son las migraciones reales de `supabase/migrations/`, especialmente `20260620000031_clean_schema.sql` y las migraciones posteriores.

Las nuevas relaciones hacia información histórica deben priorizar `ON DELETE RESTRICT`.

Las decisiones D-1 a D-10 de `DECISIONES-PENDIENTES-INNOVACIONES.md`, resueltas por Jordy el 06/10, se consideran decisiones vigentes para este plan.

---

## Archivos inspeccionados

Para elaborar y corregir este plan se consideran:

- `AGENTS-WEB.md`
- `supabase/migrations/20260620000031_clean_schema.sql`
- migraciones posteriores relacionadas con `nnya_tutores`, `validaciones_renaper`, auditoría y RLS;
- `app/api/didit/webhook`
- tipos generados de base de datos;
- tipos de dominio relacionados;
- `prompts/016-webhook-didit.md`
- `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`
- `DECISIONES-PENDIENTES-INNOVACIONES.md`
- `PLAN-INTEGRACION-INNOVACIONES.md`

Antes de escribir la migración deberán volver a verificarse las definiciones reales de las tablas y constraints afectados.

---

## Skills utilizadas

Las skills disponibles relacionadas con este trabajo se encuentran en el repo mobile:

- `skills/database.md`
- `skills/testing.md`
- `skills/design.md`

Para este plan, la referencia principal es `skills/database.md`.

No se asume la existencia de skills equivalentes dentro del repo web.

---

## Supuestos y decisiones confirmadas

1. `retiros` será una tabla propia.
2. `sesiones_didit` será una tabla compartida por distintos propósitos de verificación.
3. `sesiones_didit.proposito` tendrá valores controlados:
   - `retiro`
   - `validacion_referente`
4. Un retiro puede tener varias sesiones Didit.
5. Se permiten como máximo 3 intentos terminados por retiro.
6. No se almacenará manualmente un contador de intentos.
7. La cantidad de intentos se obtiene contando las sesiones terminadas asociadas al retiro.
8. Según D-3, cuentan como intento terminado:
   - `Approved`
   - `Declined`
   - `Expired`
   - `Abandoned`
   - `Kyc Expired`
9. `In Review` todavía no cuenta como intento.
10. El flujo de retiro permite únicamente tutores autorizados.
11. Según D-10, `retiros.tutor_id` será obligatorio.
12. `nnya_tutores.es_principal` no representa autorización para retirar.
13. La autorización para retirar se modelará mediante `autorizaciones_retiro`.
14. El fallback manual será exclusivo del rol `Admin`, según D-2.
15. El rol se validará en base de datos utilizando `get_my_role()`.
16. El DNI enviado a Didit siempre se obtendrá desde `tutores.dni`.
17. El operador nunca escribirá manualmente el DNI que se envía a Didit.
18. No se almacenarán selfies, videos de prueba de vida, plantillas biométricas ni copias de DNI.
19. `validaciones_renaper.respuesta_cruda` no almacenará payloads de Didit.
20. El webhook necesita una vía de escritura server-side autorizada.
21. Una sesión Didit de propósito `validacion_referente` deberá identificar explícitamente al referente correspondiente.
22. Cada sesión Didit podrá originar como máximo una `validaciones_renaper`.
23. Las sesiones desconocidas recibidas por webhook se resolverán según D-4: responder `200`, registrar en log el `session_id` y no escribir datos.

---

# Modelo propuesto

## 1. `sesiones_didit`

Se propone una tabla compartida para representar las sesiones de verificación realizadas mediante Didit.

Campos conceptuales:

- `id UUID PRIMARY KEY`
- `session_id TEXT NULL`
- `proposito TEXT NOT NULL`
- `retiro_id UUID NULL`
- `referente_id UUID NULL`
- `estado_didit TEXT`
- `estado_rnf12 TEXT`
- `error_proveedor TEXT NULL`
- `creada_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`
- `finalizada_at TIMESTAMPTZ NULL`

### Propósito

Valores permitidos:

- `retiro`
- `validacion_referente`

Debe existir un `CHECK` equivalente a:

`(proposito = 'retiro') = (retiro_id IS NOT NULL)`

También debe existir:

`(proposito = 'validacion_referente') = (referente_id IS NOT NULL)`

Esto evita que una sesión declare un propósito pero no tenga la entidad correspondiente.

### `session_id` y errores del proveedor

`session_id` debe poder ser `NULL` cuando Didit falle antes de crear la sesión.

Debe existir el `CHECK`:

`(session_id IS NULL) = (error_proveedor IS NOT NULL)`

Por lo tanto:

- una sesión creada correctamente por Didit tendrá `session_id` y no tendrá `error_proveedor`;
- un fallo previo a la creación de sesión tendrá `session_id = NULL` y deberá registrar `error_proveedor`.

`session_id` será único cuando exista.

El contenido de `error_proveedor` debe ser mínimo y no contener payloads completos ni información biométrica.

---

## 2. Estados Didit e intentos

Se utilizará el mapeo completo de los 10 estados definido en D-1 de `DECISIONES-PENDIENTES-INNOVACIONES.md`.

La migración deberá copiar explícitamente esa tabla de mapeo y no inventar valores adicionales.

Para el cálculo del máximo de 3 intentos, según D-3 cuentan únicamente las sesiones terminadas con estado Didit:

- `Approved`
- `Declined`
- `Expired`
- `Abandoned`
- `Kyc Expired`

`In Review` no cuenta todavía como intento.

El máximo de 3 intentos no puede implementarse mediante un `CHECK`, porque requiere consultar otras filas de `sesiones_didit`.

Debe implementarse mediante trigger o función de base de datos que, antes de permitir un nuevo intento, cuente las sesiones terminadas asociadas al `retiro_id`.

No se almacenará `cantidad_intentos` manualmente en `retiros`.

---

## 3. Estados RNF-12

Los valores funcionales serán exactamente los 5 definidos en `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`:

- `Pendiente de verificación`
- `Identidad verificada`
- `Identidad no verificada`
- `Requiere revisión`
- `Error del proveedor`

`estado_rnf12` debe derivarse de `estado_didit` mediante una única fuente de verdad, por ejemplo una función o trigger.

No debe existir lógica duplicada de traducción en distintas partes de la aplicación.

El mapeo completo debe seguir D-1.

Entre los estados Didit contemplados se incluyen correctamente:

- `Expired`
- `Abandoned`
- `Kyc Expired`

---

## 4. `retiros`

Se propone una tabla propia.

Campos conceptuales:

- `id UUID PRIMARY KEY`
- `nnya_id UUID NOT NULL`
- `tutor_id UUID NOT NULL`
- `created_by UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT`
- `autorizacion_retiro_id UUID NOT NULL`
- `resultado_autorizacion TEXT NOT NULL`
- `motivo_rechazo TEXT NULL`
- `estado TEXT NOT NULL`
- `descripcion TEXT NULL`
- `observaciones TEXT NULL`
- `autorizado_por UUID NULL REFERENCES usuarios(id) ON DELETE RESTRICT`
- `autorizado_at TIMESTAMPTZ NULL`
- `motivo_fallback TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`
- `fecha_inicio TIMESTAMPTZ NOT NULL`
- `fecha_fin TIMESTAMPTZ NULL`

### Estado del retiro

Valores técnicos:

- `en_curso`
- `realizada`
- `rechazada`

Debe existir un `CHECK` equivalente a:

`estado IN ('en_curso', 'realizada', 'rechazada')`

### Resultado de autorización

`resultado_autorizacion` debe utilizar valores cerrados y explícitos.

Como mínimo:

- `autorizada`
- `rechazada`

La migración no debe introducir valores adicionales sin una decisión previa.

### Identidad

`retiros` no debe duplicar el resultado de identidad almacenado/derivado desde la sesión Didit.

Por lo tanto, no se propone mantener `resultado_validacion_identidad` como una segunda fuente de verdad.

La identidad debe resolverse desde las sesiones asociadas al retiro.

---

## 5. Relación retiro ↔ sesiones Didit

La relación será:

`retiros 1:N sesiones_didit`

La FK se ubicará en:

`sesiones_didit.retiro_id`

No se utilizará `retiros.sesion_didit_id`.

Esto permite conservar los intentos anteriores y no perder las sesiones fallidas.

---

## 6. `autorizaciones_retiro`

Se propone una tabla específica para representar la autorización de retiro asociada al vínculo tutor ↔ NNyA.

Campos conceptuales:

- `id UUID PRIMARY KEY`
- `nnya_tutor_id UUID NOT NULL`
- `estado TEXT NOT NULL`
- `vigente_desde TIMESTAMPTZ NOT NULL`
- `vigente_hasta TIMESTAMPTZ NULL`
- `restricciones` según tipo que se defina para la migración
- `created_by UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

### Estado

Se utilizará un predicado fijo para determinar la autorización vigente.

Propuesta:

- `vigente`
- `revocada`

con un `CHECK` equivalente a:

`estado IN ('vigente', 'revocada')`

El índice único parcial utilizará una condición estable:

`WHERE estado = 'vigente'`

No se utilizará `now()` en el predicado del índice.

Debe existir como máximo una autorización con estado `vigente` por `nnya_tutor_id`.

### Sin booleano redundante

No se almacenará un campo `autorizado BOOLEAN`.

El estado/vigencia de la autorización representa esa condición.

### Conservación histórica

`retiros.autorizacion_retiro_id` conservará cuál fue la autorización utilizada en cada retiro.

La FK desde `autorizaciones_retiro.nnya_tutor_id` hacia `nnya_tutores` debe usar `ON DELETE RESTRICT`.

Esto evita perder el historial de autorizaciones por el `ON DELETE CASCADE` existente sobre relaciones de `nnya_tutores`.

---

## 7. Consistencia entre retiro y autorización

`retiros` almacena:

- `nnya_id`
- `tutor_id`
- `autorizacion_retiro_id`

La autorización, mediante `nnya_tutores`, también determina un NNyA y un tutor.

La base debe impedir que se utilice la autorización perteneciente a otra combinación tutor/NNyA.

Esto requiere un trigger o función de base de datos que valide que:

- el `nnya_id` del retiro coincide con el NNyA de `nnya_tutores` asociado a `autorizacion_retiro_id`;
- el `tutor_id` del retiro coincide con el tutor del mismo vínculo.

No alcanza con validarlo únicamente en frontend.

---

## 8. Restricciones vigentes

Las restricciones de retiro pertenecen a la autorización/vínculo correspondiente.

No deben inferirse desde `nnya_tutores.es_principal`.

`autorizaciones_retiro.restricciones` deberá representar las restricciones aplicables.

El tipo definitivo de `restricciones` debe elegirse antes de la migración según los requisitos funcionales concretos, evitando diseñar una estructura excesivamente genérica.

---

## 9. Fallback manual

Según D-2, únicamente un usuario con rol:

`Admin`

puede realizar el fallback manual.

El retiro deberá registrar:

- `autorizado_por`
- `autorizado_at`
- `motivo_fallback`

El fallback solo puede utilizarse:

1. después de 3 intentos fallidos terminados; o
2. ante un error del proveedor que impida completar el flujo normal.

Esta regla no puede resolverse mediante un `CHECK`, porque requiere consultar `sesiones_didit`.

Debe implementarse mediante trigger o función de base de datos.

El mismo control deberá verificar mediante `get_my_role()` que quien ejecuta el fallback tenga rol `Admin`.

La UI podrá ocultar o deshabilitar la acción para otros roles, pero la restricción real debe vivir en base de datos.

Toda utilización del fallback debe quedar auditada.

---

## 10. DNI utilizado por Didit

El DNI utilizado para iniciar la verificación Didit de un retiro deberá obtenerse exclusivamente desde:

`tutores.dni`

El operador no podrá ingresar manualmente un DNI diferente.

La regla evita verificar la identidad de una persona y posteriormente registrar el retiro a nombre de otra.

No se duplicará el DNI en `retiros` ni en `sesiones_didit` salvo que exista posteriormente una necesidad aprobada y documentada.

---

## 11. Integración con `validaciones_renaper`

La relación será:

`validaciones_renaper.sesion_didit_id`

No se agregará `validacion_renaper_id` en `sesiones_didit`.

La relación sesión ↔ validación será 1:1.

Por lo tanto:

`validaciones_renaper.sesion_didit_id`

deberá tener:

`UNIQUE (sesion_didit_id)`

### Referente

`validaciones_renaper.referente_id` continúa siendo `NOT NULL`.

Para las sesiones con:

`proposito = 'validacion_referente'`

se utilizará:

`sesiones_didit.referente_id`

De esta manera, cuando llegue el webhook se podrá identificar qué referente debe utilizarse al crear `validaciones_renaper`.

No se plantea validar un referente inexistente antes de su alta.

### `consultado_por`

`validaciones_renaper.consultado_por` es `NOT NULL`, pero el webhook de Didit no tiene una sesión de usuario.

Por lo tanto:

`validaciones_renaper.consultado_por`

se copiará desde:

`sesiones_didit.creada_por`

Por este motivo, `sesiones_didit.creada_por` será obligatorio (`NOT NULL`) y tendrá FK a `usuarios(id)` con `ON DELETE RESTRICT`.

---

## 12. Mapeo `id_lookup` → RENAPER

La respuesta de `id_lookup` debe traducirse a los campos funcionales ya existentes en `validaciones_renaper`.

### `estado_dni`

Los valores contemplados son:

- `vigente`
- `vencido`
- `inexistente`
- `error_servicio`

La migración/implementación deberá seguir el mapeo confirmado en las decisiones vigentes y no inferir valores nuevos.

### `resultado`

También debe mapearse:

- `aprobado`
- `rechazado`
- `no_concluyente`

### `tiene_antecedentes`

Didit no informa este dato.

Por lo tanto:

`tiene_antecedentes = NULL`

para las validaciones originadas mediante Didit.

No se debe inventar ni inferir este valor.

---

## 13. `respuesta_cruda` y minimización

`validaciones_renaper.respuesta_cruda` no debe utilizarse para almacenar el payload completo de Didit.

Esto debe quedar explícitamente prohibido en la implementación.

La razón es doble:

1. viola la política de minimización de datos;
2. los cambios pueden terminar replicados en `audit_log`.

No deben almacenarse:

- selfies;
- videos de prueba de vida;
- plantillas biométricas;
- copias o imágenes del DNI;
- payloads completos de Didit;
- información biométrica innecesaria.

Solo se almacenará la información mínima necesaria para:

- identificar la operación;
- conocer el estado funcional;
- relacionarla con retiro/referente;
- conservar la autorización utilizada;
- registrar errores mínimos;
- mantener trazabilidad y auditoría.

---

## 14. Webhook Didit

El webhook deberá:

1. validar la firma HMAC;
2. obtener el `session_id`;
3. localizar `sesiones_didit`;
4. actualizar el estado Didit;
5. derivar el estado RNF-12 desde una única función/fuente;
6. cuando corresponda, crear o actualizar la `validaciones_renaper` asociada;
7. utilizar `sesiones_didit.referente_id` para las validaciones de referente;
8. utilizar `sesiones_didit.creada_por` como `consultado_por`;
9. no guardar payloads biométricos;
10. no duplicar el resultado de identidad en `retiros`.

### Sesiones desconocidas

Según D-4, si llega un webhook con un `session_id` que el sistema no conoce:

- responder HTTP `200`;
- registrar en logs el `session_id`;
- no insertar ni modificar registros.

No se crearán sesiones huérfanas a partir de webhooks desconocidos.

---

## 15. RLS y escritura del webhook

Las nuevas tablas deberán tener RLS habilitado.

Las políticas deben seguir el principio de mínimo privilegio.

El webhook no tiene sesión normal de usuario, por lo que no puede depender de las mismas políticas RLS utilizadas por el frontend.

La escritura server-side deberá resolverse mediante una de las alternativas aprobadas para implementación:

- service role exclusivamente del lado servidor; o
- función `SECURITY DEFINER` cuidadosamente restringida.

La `SUPABASE_SERVICE_ROLE_KEY`, si se utiliza, nunca debe exponerse al cliente.

Las políticas y funciones deberán permitir el trabajo del webhook sin abrir permisos innecesarios a usuarios autenticados.

---

## 16. Auditoría

Las tablas nuevas deberán integrarse al sistema existente mediante los triggers `trg_audit_*` y `fn_audit_trigger()` según el patrón actual del proyecto.

La auditoría debe conservar:

- creación/modificación del retiro;
- autorización utilizada;
- cambios relevantes de estado;
- fallback manual;
- usuario responsable.

La auditoría no debe almacenar:

- biometría;
- selfies;
- videos;
- copias de DNI;
- payloads completos de Didit.

---

## 17. Reglas que requieren trigger o función

No todas las reglas pueden implementarse con `CHECK`.

Requieren trigger o función porque consultan otras filas/tablas:

1. máximo de 3 intentos terminados por retiro;
2. fallback únicamente después de 3 intentos fallidos o error del proveedor;
3. fallback únicamente por rol `Admin`, validado mediante `get_my_role()`;
4. consistencia entre `retiros.nnya_id`, `retiros.tutor_id` y `autorizacion_retiro_id`;
5. derivación centralizada de `estado_rnf12` desde `estado_didit`, si se decide persistir ambos.

Los `CHECK` se reservarán para reglas internas de una misma fila, como:

- valores permitidos de `proposito`;
- valores permitidos de `retiros.estado`;
- valores permitidos de `autorizaciones_retiro.estado`;
- coherencia `proposito` ↔ `retiro_id`;
- coherencia `proposito` ↔ `referente_id`;
- coherencia `session_id` ↔ `error_proveedor`.

---

## 18. Archivos a crear/modificar después de la aprobación

Este plan no implementa cambios.

Una vez aprobado, la implementación deberá evaluar/modificar:

- nueva migración en `supabase/migrations/`;
- tipos generados de Supabase;
- tipos de dominio si corresponde;
- `app/api/didit/webhook`;
- funciones/helpers server-side relacionados con Didit;
- documentación relacionada;
- tests de las reglas de negocio.

Los tipos generados no deben editarse manualmente. Deben regenerarse después de aplicar la migración.

---

## Requisitos

La implementación deberá cumplir como mínimo:

1. tabla propia `retiros`;
2. tabla compartida `sesiones_didit`;
3. `proposito` controlado;
4. `retiro_id` para sesiones de retiro;
5. `referente_id` para sesiones de validación de referente;
6. `tutor_id NOT NULL` en retiros;
7. máximo 3 intentos terminados;
8. conservación de todos los intentos;
9. fallback únicamente Admin;
10. autorización explícita independiente de `es_principal`;
11. historial de autorización utilizada;
12. validación de coherencia retiro/autorización;
13. integración 1:1 sesión ↔ `validaciones_renaper`;
14. `creada_por NOT NULL`;
15. DNI proveniente de `tutores.dni`;
16. minimización de datos;
17. RLS;
18. auditoría;
19. escritura segura del webhook;
20. `ON DELETE RESTRICT` donde corresponda a información histórica.

---

## Seguridad

- RLS en todas las tablas nuevas.
- Mínimo privilegio.
- Fallback validado en base de datos.
- `get_my_role()` para validar rol `Admin`.
- Service role únicamente server-side si se utiliza.
- Nunca exponer secretos al cliente.
- DNI obtenido desde `tutores.dni`.
- No permitir DNI manual para iniciar la verificación.
- No guardar selfies.
- No guardar videos de prueba de vida.
- No guardar plantillas biométricas.
- No guardar copias de DNI.
- No guardar payloads completos de Didit.
- No copiar payloads Didit a `validaciones_renaper.respuesta_cruda`.
- Auditoría de operaciones sensibles.
- `ON DELETE RESTRICT` para preservar historial.

---

## Criterios de aceptación

El plan queda listo para implementación cuando se verifique que:

1. `retiros` es una tabla propia.
2. `retiros.tutor_id` es obligatorio.
3. Solo tutores autorizados pueden asociarse a retiros.
4. `sesiones_didit` admite los propósitos `retiro` y `validacion_referente`.
5. Una sesión de retiro tiene `retiro_id`.
6. Una sesión de referente tiene `referente_id`.
7. Se conservan todas las sesiones Didit de un retiro.
8. El máximo de 3 se calcula desde sesiones terminadas.
9. Cuentan `Approved`, `Declined`, `Expired`, `Abandoned` y `Kyc Expired`.
10. `In Review` no cuenta todavía.
11. No existe contador manual de intentos.
12. Un error previo a crear la sesión puede registrarse sin `session_id`.
13. Se cumple `(session_id IS NULL) = (error_proveedor IS NOT NULL)`.
14. Los 5 estados RNF-12 están definidos.
15. El estado RNF-12 se deriva desde una única fuente.
16. Se utiliza el mapeo completo D-1 de 10 estados.
17. La relación con RENAPER se realiza mediante `validaciones_renaper.sesion_didit_id`.
18. `sesion_didit_id` es único en `validaciones_renaper`.
19. El referente se obtiene desde `sesiones_didit.referente_id`.
20. `consultado_por` se obtiene desde `sesiones_didit.creada_por`.
21. `creada_por` es obligatorio y referencia `usuarios`.
22. Se define el mapeo de `estado_dni`.
23. Se define el mapeo de `resultado`.
24. `tiene_antecedentes` queda `NULL` para Didit.
25. `respuesta_cruda` no almacena payloads Didit.
26. `retiros.estado` tiene valores cerrados.
27. `proposito` tiene valores cerrados.
28. La autorización de retiro no depende de `es_principal`.
29. Existe como máximo una autorización `vigente` por vínculo.
30. No se utiliza `now()` en un índice parcial.
31. El retiro conserva `autorizacion_retiro_id`.
32. La FK histórica hacia `nnya_tutores` utiliza `RESTRICT`.
33. Un trigger impide utilizar la autorización de otro tutor o NNyA.
34. El fallback registra `autorizado_por`, `autorizado_at` y `motivo_fallback`.
35. El fallback solo se permite después de 3 fallos o error del proveedor.
36. El fallback solo puede realizarlo un `Admin`.
37. El rol se valida en base de datos.
38. El DNI enviado a Didit proviene de `tutores.dni`.
39. Un operador no puede ingresar otro DNI manualmente.
40. Un webhook desconocido responde `200`, registra el `session_id` en log y no escribe datos.
41. El webhook tiene una estrategia server-side compatible con RLS.
42. Las tablas nuevas quedan auditadas.
43. No se almacenan datos biométricos.
44. No se almacenan payloads completos de Didit.
45. Las relaciones históricas relevantes utilizan `ON DELETE RESTRICT`.

---

## Chequeos

Este documento es únicamente un plan y no modifica código ni base de datos, por lo que en esta etapa no corresponde ejecutar chequeos de implementación.

Después de implementar la migración deberán ejecutarse, como mínimo:

```bash
npm run lint
npm run build
npx tsc --noEmit
```

También deberá verificarse la migración contra una base de desarrollo antes de aplicarla en un entorno compartido.

---

## Verificación manual futura

Después de implementar el modelo se deberá verificar manualmente:

1. crear un retiro con tutor autorizado;
2. comprobar que un tutor no autorizado no pueda utilizarse;
3. iniciar una sesión Didit;
4. registrar una sesión fallida y conservarla;
5. iniciar un segundo y tercer intento;
6. comprobar que no pueda iniciarse un cuarto intento terminado;
7. verificar que `In Review` no incremente todavía el contador;
8. verificar el mapeo de los 10 estados Didit;
9. verificar los 5 estados RNF-12;
10. simular un error del proveedor sin `session_id`;
11. comprobar el CHECK `session_id/error_proveedor`;
12. realizar una validación de referente y comprobar que conserva `referente_id`;
13. comprobar que el webhook utiliza `creada_por` como `consultado_por`;
14. comprobar la relación 1:1 con `validaciones_renaper`;
15. comprobar los mapeos de `estado_dni` y `resultado`;
16. comprobar que `tiene_antecedentes` quede `NULL`;
17. comprobar que `respuesta_cruda` no reciba payloads Didit;
18. comprobar que no se guarden selfies, videos, biometría ni copias de DNI;
19. comprobar la unicidad de autorización vigente;
20. comprobar que no se pueda eliminar en cascada información histórica;
21. intentar usar una autorización perteneciente a otro tutor/NNyA y verificar que la base lo rechace;
22. intentar fallback antes de cumplir las condiciones y verificar que sea rechazado;
23. intentar fallback con un rol distinto de `Admin`;
24. realizar fallback con `Admin` y comprobar la auditoría;
25. verificar que el DNI enviado a Didit sea el de `tutores.dni`;
26. enviar un webhook con sesión desconocida y comprobar `200` sin escritura;
27. verificar que el webhook pueda escribir mediante el mecanismo server-side aprobado;
28. verificar los registros generados en `audit_log`.

---

## Decisiones cerradas incorporadas

Este plan incorpora las decisiones D-1 a D-10 relevantes, entre ellas:

- fallback únicamente `Admin`;
- `tutor_id` obligatorio;
- solo tutores autorizados pueden retirar;
- mapeo Didit según D-1;
- definición de qué estados cuentan como intento según D-3;
- tratamiento de sesión desconocida según D-4;
- propósitos técnicos definidos;
- estados técnicos del retiro definidos;
- 5 estados RNF-12 definidos.

No deben volver a presentarse estas decisiones como pendientes en la migración.

---

## Próximo paso

No implementar todavía.

Primero Jordy debe aprobar esta versión corregida del Plan 028.

Después de la aprobación se podrá preparar la migración correspondiente, regenerar los tipos necesarios, adaptar el webhook y agregar las verificaciones/tests definidos en este documento.