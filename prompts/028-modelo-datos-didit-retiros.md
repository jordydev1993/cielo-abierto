# Plan 028 — Modelo de datos para retiros y verificación de identidad con Didit

## Objetivo

Diseñar el modelo de datos necesario para implementar el proceso de retiro de NNyA y la verificación de identidad mediante Didit, respetando el modelo de datos vigente de Argüello Infancias.

Este documento es un PLAN. No realiza cambios en la base de datos ni crea migraciones todavía.

El diseño debe permitir:

* registrar un retiro y su autorización;
* registrar hasta 3 intentos de verificación Didit por retiro;
* conservar todas las sesiones de Didit, incluidas las fallidas;
* asociar las validaciones RENAPER a la sesión que las originó;
* representar los cinco estados funcionales exigidos por RNF-12;
* soportar errores del proveedor aun cuando Didit no haya generado `session_id`;
* registrar fallback manual de forma trazable y restringida en base de datos;
* representar autorizaciones y restricciones vigentes del vínculo tutor–NNyA;
* aplicar minimización de datos y no almacenar información biométrica.

---

## Contexto

El proyecto cuenta actualmente con las tablas y mecanismos relevantes:

* `nnya`
* `tutores`
* `nnya_tutores`
* `referentes`
* `vinculos_tutela`
* `validaciones_renaper`
* `usuarios`
* `roles`
* `audit_log`
* `get_my_role()`
* `fn_audit_trigger()`
* triggers `trg_audit_*`

El webhook de Didit está contemplado en `app/api/didit/webhook` y utiliza firma HMAC con `DIDIT_WEBHOOK_SECRET`.

La fuente de verdad del schema son las migraciones de `supabase/migrations/`, teniendo en cuenta que `20260620000031_clean_schema.sql` es la definición vigente del schema en una DB nueva.

Las nuevas relaciones con `nnya_id` deberán respetar `ON DELETE RESTRICT`.

---

## Archivos inspeccionados

Para este plan se consideran como fuentes de diseño:

* `AGENTS-WEB.md`
* `supabase/migrations/20260620000031_clean_schema.sql`
* `supabase/migrations/20260827000033_*.sql`
* migraciones posteriores que modifican `nnya`, `tutores`, `nnya_tutores`, `validaciones_renaper`, `audit_log` y roles
* `app/api/didit/webhook`
* `types/database.generated.ts`
* `types/database.types.ts`
* `prompts/016-*`
* `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`
* `DECISIONES-PENDIENTES-INNOVACIONES.md`

La implementación deberá volver a verificar las definiciones exactas de columnas, constraints, índices y políticas antes de crear la migración.

---

## Skills utilizadas

* `database-design`
* `domain-validation`
* `role-permission`
* `documentation`

La implementación posterior deberá volver a consultar estas skills antes de crear la migración.

---

## Supuestos

1. `retiros` será una tabla propia y no un tipo de `actividades`.
2. `sesiones_didit` será una tabla compartida para distintos propósitos.
3. `proposito` distinguirá como mínimo:

   * `retiro`
   * `validacion_referente`
4. Un retiro puede tener múltiples sesiones Didit, una por intento.
5. El máximo funcional es de 3 intentos por retiro.
6. `cantidad_intentos` no será un contador manual: se derivará contando las sesiones terminadas asociadas al retiro.
7. La autorización para retirar no se deduce de `nnya_tutores.es_principal`.
8. `autorizaciones_retiro` representará la autorización y su vigencia.
9. El rol habilitado para fallback manual queda pendiente de decisión de Jordy (D-2).
10. La decisión sobre si un referente también puede retirar queda pendiente de definición de Jordy. Por lo tanto, no se fija todavía la obligatoriedad de `tutor_id`.
11. El DNI utilizado para iniciar una verificación Didit proviene de `tutores.dni`; el operador no lo tipea manualmente.
12. No se almacenarán selfies, videos de liveness, plantillas biométricas ni copias del DNI.
13. `validaciones_renaper.respuesta_cruda` no deberá recibir payloads de Didit.
14. El webhook no tiene una sesión de usuario normal y por lo tanto necesitará una vía server-side autorizada para escribir en las tablas protegidas por RLS.
15. Los nombres funcionales de los cinco estados RNF-12 son los definidos en `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`.

---

## 1. Tabla `sesiones_didit`

Se propone una única tabla compartida para registrar las sesiones de Didit utilizadas por distintos procesos.

La tabla utilizará `proposito` para diferenciar:

* `retiro`
* `validacion_referente`

La relación con `retiros` se establece desde `sesiones_didit` hacia `retiros`, porque un retiro puede tener varias sesiones.

### Campos propuestos

* `id`: UUID, clave primaria.
* `retiro_id`: UUID, nullable cuando el propósito no sea `retiro` o cuando corresponda registrar un error previo a la creación de una sesión.
* `session_id`: identificador de sesión proporcionado por Didit; nullable para errores ocurridos antes de que Didit cree una sesión.
* `proposito`: valor controlado.
* `estado_didit`: estado informado por Didit, cuando exista.
* `estado_rnf12`: estado funcional derivado del estado de Didit.
* `error_proveedor`: información técnica mínima del error cuando Didit no pueda crear la sesión.
* `creada_por`: usuario que inició la operación, cuando corresponda.
* `created_at`
* `updated_at`
* `finalizada_at`

### Reglas de relación

Debe existir un `CHECK` que impida contradicciones entre propósito y retiro, siguiendo el patrón:

```text
(proposito = 'retiro') = (retiro_id IS NOT NULL)
```

Por lo tanto:

* una sesión con `proposito = 'retiro'` debe tener `retiro_id`;
* una sesión con `proposito = 'validacion_referente'` no debe tener `retiro_id`.

`session_id` será único cuando exista.

La relación será:

```text
retiros 1 ─── N sesiones_didit
```

Esto permite conservar las sesiones fallidas de los intentos anteriores.

### Intentos

Cada sesión finalizada asociada a un retiro representa un intento de verificación.

`cantidad_intentos` no se almacenará como contador manual.

El número de intentos se calculará contando las sesiones finalizadas correspondientes al retiro.

La regla funcional es:

* intento 1 → primera sesión finalizada;
* intento 2 → segunda sesión finalizada;
* intento 3 → tercera sesión finalizada;
* no se permite iniciar un cuarto intento.

El detalle exacto del estado que convierte una sesión en intento deberá quedar implementado en una función/constraint coherente con los estados definitivos de Didit.

### Estados RNF-12

La sesión deberá representar los cinco estados funcionales definidos por RNF-12:

1. `Pendiente de verificación`
2. `Identidad verificada`
3. `Identidad no verificada`
4. `Requiere revisión`
5. `Error del proveedor`

El estado funcional deberá derivarse de `estado_didit` en un único lugar.

No se permitirá que ambos campos se actualicen independientemente.

La traducción podrá implementarse mediante una función o trigger de base de datos, pero deberá existir una única fuente de verdad para el mapeo.

### Mapeos conocidos

Los estados de Didit deberán utilizar su forma técnica real, incluyendo mayúscula inicial cuando corresponda:

* `Expired` → `Identidad no verificada`
* `Abandoned` → `Identidad no verificada`
* `Kyc Expired` → `Identidad no verificada`

Los demás mapeos funcionales deberán quedar alineados con los estados confirmados por Jordy antes de implementar la migración.

### Error previo a `session_id`

Si Didit falla antes de crear una sesión, no existe `session_id`.

El modelo deberá permitir registrar ese error sin inventar un identificador de Didit.

En ese caso:

* `session_id` puede ser `NULL`;
* `error_proveedor` registra únicamente la información técnica mínima necesaria;
* el registro sigue asociado al retiro cuando `proposito = 'retiro'`.

No se deberá guardar un payload completo del proveedor.

---

## 2. Tabla `retiros`

Se propone una tabla propia para registrar cada operación de retiro.

No se utilizará un tipo de actividad para representar el retiro.

### Campos propuestos

* `id`: UUID, clave primaria.
* `nnya_id`: UUID, obligatorio.
* `tutor_id`: UUID, pendiente de confirmar según la decisión de Jordy sobre referentes.
* `usuario_id`: UUID, usuario que registra o gestiona la operación.
* `autorizacion_retiro_id`: UUID, autorización concreta utilizada para este retiro.
* `resultado_autorizacion`: valor controlado.
* `motivo_rechazo`: nullable.
* `estado`: valor controlado.
* `descripcion`: nullable.
* `observaciones`: nullable.
* `created_at`
* `updated_at`
* `fecha_inicio`
* `fecha_fin`

No tendrá `sesion_didit_id`, porque un retiro puede tener múltiples sesiones.

Tampoco tendrá un contador manual de intentos.

### Estado del retiro

Los valores técnicos deberán definirse mediante `CHECK`.

Como mínimo se contemplan:

* `En curso`
* `Realizada`
* un estado de rechazo

El valor técnico definitivo de cada estado deberá quedar fijado antes de implementar la migración.

### Resultado de autorización

`resultado_autorizacion` tendrá un conjunto cerrado de valores mediante `CHECK`.

Deberá diferenciar como mínimo:

* autorización concedida;
* autorización rechazada.

Los valores técnicos definitivos deberán coincidir con el flujo de negocio confirmado.

### Resultado de identidad

No se duplicará en `retiros` el estado derivable de la sesión Didit.

El resultado de identidad se consultará desde `sesiones_didit`, evitando inconsistencias entre el retiro y su última sesión.

### Integridad

`nnya_id` utilizará:

```text
ON DELETE RESTRICT
```

La FK `autorizacion_retiro_id` deberá utilizar `ON DELETE RESTRICT`.

La autorización concreta utilizada debe quedar almacenada para preservar el historial incluso si posteriormente deja de estar vigente.

---

## 3. Autorización para retirar

No se debe utilizar `nnya_tutores.es_principal` para determinar si una persona está autorizada a retirar.

Ser tutor principal y estar autorizado para retirar son conceptos diferentes.

Se propone una tabla específica:

### `autorizaciones_retiro`

Campos propuestos:

* `id`: UUID, clave primaria.
* `nnya_tutor_id`: FK a `nnya_tutores`, obligatorio.
* `vigente_desde`: timestamp/date, obligatorio.
* `vigente_hasta`: timestamp/date, nullable.
* `restricciones`: representación de las restricciones vigentes.
* `created_by`: usuario que creó la autorización.
* `created_at`
* `updated_at`

El campo booleano `autorizado` no se almacenará.

La existencia y vigencia temporal de la autorización representan la autorización.

### Una sola autorización vigente

Debe existir un índice único parcial que garantice una sola autorización vigente por vínculo tutor–NNyA.

Deberá seguir el patrón de índices únicos parciales ya utilizado por el proyecto, como `uq_vinculo_vigente_por_nnya`.

### Integridad con `nnya_tutores`

La FK desde `autorizaciones_retiro.nnya_tutor_id` hacia `nnya_tutores` deberá utilizar:

```text
ON DELETE RESTRICT
```

Esto evita que el `ON DELETE CASCADE` existente sobre `nnya_tutores.tutor_id` pueda eliminar silenciosamente el historial de autorizaciones.

### Restricciones

Las restricciones vigentes deberán formar parte explícita del modelo de autorización.

El formato técnico definitivo del campo `restricciones` deberá definirse antes de implementar la migración.

---

## 4. Restricciones vigentes del vínculo tutor–NNyA

Las restricciones deberán permitir representar condiciones que limiten una autorización de retiro.

No se deberá inferir la autorización desde `es_principal`.

La autorización concreta utilizada por cada retiro se guardará mediante:

```text
retiros.autorizacion_retiro_id
```

Esto permite conservar qué autorización estaba vigente y fue utilizada en una operación determinada.

---

## 5. Fallback manual

El modelo contempla un mecanismo de fallback cuando la validación automática mediante Didit no pueda completarse.

`retiros` deberá registrar:

* `autorizado_por`: usuario que realiza la autorización manual;
* `autorizado_at`: fecha/hora de autorización;
* `motivo_fallback`: motivo de la autorización manual;
* `resultado_autorizacion`.

### Reglas

`autorizado_por` será nullable.

Solo podrá completarse cuando:

* se hayan agotado los 3 intentos fallidos; o
* haya ocurrido un error del proveedor que impida completar la verificación automática.

Deberá existir un `CHECK` que impida registrar `autorizado_por` fuera de esas condiciones.

El rol habilitado para ejecutar el fallback queda pendiente de decisión de Jordy (D-2).

La restricción deberá vivir en la base de datos, no solamente en la UI.

Se propone un trigger de base de datos que utilice `get_my_role()` para verificar el rol antes de permitir la autorización manual.

La implementación deberá respetar exactamente el rol que Jordy defina.

El fallback deberá quedar auditado.

---

## 6. Relación con `validaciones_renaper`

La relación se establece desde `validaciones_renaper` hacia `sesiones_didit`.

Se propone:

```text
validaciones_renaper.sesion_didit_id
```

La dirección responde al flujo real:

1. se crea/inicia la sesión Didit;
2. Didit devuelve el resultado;
3. se procesa la validación RENAPER;
4. se registra la validación asociada a la sesión.

No se agregará `validacion_renaper_id` a `sesiones_didit`.

### `respuesta_cruda`

La columna existente `validaciones_renaper.respuesta_cruda` guarda JSONB.

No deberá recibir payloads de Didit ni decisiones completas del proveedor.

La información almacenada deberá limitarse a la respuesta necesaria del proceso RENAPER y respetar la política de minimización.

En particular:

* no copiar el payload de Didit;
* no almacenar selfies;
* no almacenar videos de liveness;
* no almacenar plantillas biométricas;
* no almacenar copias de DNI.

Esto es especialmente importante porque el mecanismo de auditoría puede copiar cambios de la fila al `audit_log`.

### `referente_id`

La implementación deberá respetar que `validaciones_renaper.referente_id` es `NOT NULL`.

Por lo tanto, el caso `momento = 'alta_referente'` deberá contar con un referente previamente existente antes de crear la validación.

No se deberá modificar esa regla en este plan sin una decisión explícita.

### `estado_dni`

El resultado de `id_lookup` deberá traducirse a los valores funcionales de `estado_dni`:

* `vigente`
* `vencido`
* `inexistente`
* `error_servicio`

El mapeo técnico definitivo deberá quedar documentado antes de la migración.

---

## 7. DNI utilizado para Didit

El DNI enviado a Didit deberá obtenerse directamente de:

```text
tutores.dni
```

El operador no deberá tipear manualmente el DNI para iniciar una verificación.

La identificación del tutor deberá derivarse de la relación existente con el NNyA.

Esta regla evita verificar a una persona y registrar el resultado sobre otra.

No se almacenará una copia adicional del DNI en `sesiones_didit` o `retiros` salvo que una migración posterior demuestre una necesidad concreta y aprobada.

---

## 8. Integración con RENAPER

Se reutilizará la tabla existente `validaciones_renaper`.

No se propone crear una segunda tabla de validaciones RENAPER.

La relación será:

```text
sesiones_didit 1 ─── N validaciones_renaper
```

mediante:

```text
validaciones_renaper.sesion_didit_id
```

La cardinalidad definitiva deberá respetar las reglas del proceso RENAPER existentes.

---

## 9. Seguridad y RLS

Las nuevas tablas deberán:

* tener RLS habilitado;
* respetar los roles actuales;
* aplicar mínimo privilegio;
* impedir accesos innecesarios a información sensible;
* mantener las restricciones críticas también en la base de datos.

### Webhook de Didit

El webhook no dispone de una sesión de usuario normal.

Por lo tanto, para escribir en `sesiones_didit` y las tablas relacionadas deberá utilizar:

* service role únicamente server-side; o
* una función `SECURITY DEFINER` cuidadosamente restringida.

Nunca se deberá exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.

Las políticas RLS deberán contemplar explícitamente el camino de escritura utilizado por el webhook.

---

## 10. Auditoría

Las nuevas tablas deberán integrarse al mecanismo de auditoría existente:

* `sesiones_didit`
* `retiros`
* `autorizaciones_retiro`

Se deberán crear los correspondientes triggers:

```text
trg_audit_*
```

No se deberán almacenar datos biométricos en `audit_log`.

Especialmente, se deberá evitar que `audit_log` termine conteniendo payloads completos de Didit mediante `respuesta_cruda` u otras columnas.

---

## 11. Webhook de Didit

El webhook utilizará `session_id` para localizar la sesión correspondiente cuando Didit haya creado una sesión.

Flujo propuesto:

1. validar firma HMAC del webhook;
2. buscar `session_id`;
3. actualizar `sesiones_didit`;
4. derivar `estado_rnf12` desde `estado_didit`;
5. asociar la validación RENAPER mediante `validaciones_renaper.sesion_didit_id`, cuando corresponda;
6. reflejar el resultado en el retiro sin duplicar el estado de identidad;
7. no crear registros huérfanos para sesiones desconocidas.

Si Didit falla antes de generar `session_id`, el error deberá registrarse mediante el mecanismo definido para errores de proveedor, sin inventar un `session_id`.

---

## 12. Minimización de datos

El modelo deberá aplicar una política estricta de minimización.

No se almacenarán:

* selfies;
* videos de prueba de vida/liveness;
* plantillas biométricas;
* imágenes o copias del DNI;
* payloads completos de Didit;
* información biométrica innecesaria.

Se almacenará únicamente la información necesaria para:

* conocer el resultado de la verificación;
* mantener el estado funcional;
* registrar el retiro;
* registrar la autorización;
* mantener la trazabilidad y auditoría.

La minimización también deberá aplicarse al `audit_log`.

---

## 13. Decisiones propuestas

1. Crear una tabla propia `retiros`.
2. Crear una tabla compartida `sesiones_didit`.
3. Relacionar `sesiones_didit.retiro_id` con `retiros`.
4. Permitir múltiples sesiones por retiro.
5. Contar los intentos a partir de sesiones finalizadas, con tope de 3.
6. Utilizar `proposito` para diferenciar `retiro` y `validacion_referente`.
7. Impedir contradicciones entre `proposito` y `retiro_id` mediante `CHECK`.
8. Permitir `session_id` nullable para errores previos a la creación de una sesión.
9. Derivar `estado_rnf12` desde `estado_didit` en un único lugar.
10. Utilizar los cinco estados funcionales de RNF-12.
11. Mapear `Expired`, `Abandoned` y `Kyc Expired` a `Identidad no verificada`, sujeto a confirmación final de Jordy.
12. Relacionar `validaciones_renaper.sesion_didit_id` con `sesiones_didit`.
13. Prohibir payloads de Didit en `validaciones_renaper.respuesta_cruda`.
14. Mantener `referente_id` obligatorio en `validaciones_renaper`.
15. Definir el mapeo de `id_lookup` a `estado_dni`.
16. No duplicar en `retiros` el estado de identidad derivable de `sesiones_didit`.
17. Definir tipos, `NOT NULL` y `CHECK` para los estados y resultados.
18. Crear `autorizaciones_retiro`.
19. Representar la autorización mediante vigencia, sin campo booleano redundante.
20. Garantizar una sola autorización vigente por vínculo mediante índice único parcial.
21. Usar `ON DELETE RESTRICT` en la FK de `autorizaciones_retiro` hacia `nnya_tutores`.
22. Guardar en `retiros.autorizacion_retiro_id` la autorización concreta utilizada.
23. Registrar fallback mediante `autorizado_por`, `autorizado_at` y `motivo_fallback`.
24. Impedir fallback salvo agotamiento de 3 intentos o error del proveedor.
25. Controlar el rol de fallback en la base mediante `get_my_role()`.
26. Dejar pendiente de decisión de Jordy el rol exacto habilitado para fallback.
27. Obtener el DNI para Didit exclusivamente desde `tutores.dni`.
28. No permitir que el operador tipee manualmente el DNI utilizado para la verificación.
29. Aplicar RLS a las nuevas tablas.
30. Resolver la escritura del webhook mediante service role server-side o `SECURITY DEFINER`.
31. Integrar las nuevas tablas con `trg_audit_*`.
32. No almacenar biometría, selfies, liveness, copias de DNI ni payloads completos de Didit.
33. Mantener `ON DELETE RESTRICT` para las relaciones con `nnya_id`.
34. Dejar pendiente de decisión de Jordy si un referente también puede realizar retiros y, por lo tanto, si `tutor_id` debe ser obligatorio.

---

## 14. Puntos a definir antes de implementar

Antes de crear la migración se deberá definir:

1. El nombre y tipo definitivos de `restricciones`.
2. Los valores técnicos definitivos de `estado_rnf12`.
3. Los valores técnicos definitivos de `proposito`.
4. Los valores técnicos definitivos de `retiros.estado`.
5. Los valores técnicos definitivos de `resultado_autorizacion`.
6. Qué estados de Didit se consideran sesiones finalizadas y por lo tanto cuentan como intento.
7. El mapeo completo de estados Didit a RNF-12.
8. El mapeo completo de `id_lookup` a `estado_dni`.
9. El mecanismo exacto para registrar un error de proveedor previo a `session_id`.
10. El rol exacto autorizado para fallback manual (D-2).
11. Si un referente puede realizar retiros.
12. Si `tutor_id` en `retiros` será obligatorio o nullable según la decisión anterior.
13. La forma exacta de la política RLS del webhook.
14. La implementación final del control de rol mediante `get_my_role()`.
15. La cardinalidad definitiva entre `sesiones_didit` y `validaciones_renaper`.

Estas definiciones no deben inventarse durante la implementación: si no están confirmadas, deberán resolverse antes de crear la migración.

---

## 15. Archivos a crear o modificar después de la aprobación

Este plan no modifica archivos de implementación.

Una vez aprobado, la implementación podrá requerir:

* una nueva migración en `supabase/migrations/`;
* actualización de `types/database.generated.ts` mediante generación automática;
* actualización de `types/database.types.ts` si corresponde;
* adaptación del webhook `app/api/didit/webhook`;
* documentación o constantes relacionadas con los nuevos estados;
* tests o chequeos necesarios para validar las restricciones de seguridad.

No se deberá editar manualmente `types/database.generated.ts`.

---

## 16. Seguridad

La implementación deberá cumplir como mínimo:

* RLS en todas las tablas nuevas;
* mínimo privilegio;
* control de roles en base de datos para operaciones críticas;
* service role exclusivamente server-side;
* no exposición de `SUPABASE_SERVICE_ROLE_KEY`;
* DNI de Didit obtenido desde `tutores.dni`;
* ningún DNI ingresado manualmente para la verificación;
* no almacenamiento de biometría;
* no almacenamiento de selfies;
* no almacenamiento de liveness;
* no almacenamiento de copias de DNI;
* no almacenamiento de payloads completos de Didit;
* auditoría mediante `trg_audit_*`;
* `ON DELETE RESTRICT` en relaciones críticas.

---

## 17. Criterios de aceptación

El plan se considerará correctamente definido cuando:

1. Un retiro pueda tener hasta 3 sesiones Didit y ninguna sesión fallida se pierda.
2. Los intentos puedan contarse a partir de las sesiones finalizadas.
3. `proposito` no pueda contradecir la presencia de `retiro_id`.
4. Una sesión sin `session_id` pueda representar un error ocurrido antes de la creación de la sesión.
5. `estado_rnf12` tenga una única fuente de derivación.
6. Los cinco estados RNF-12 estén definidos.
7. `Expired`, `Abandoned` y `Kyc Expired` tengan un mapeo explícito.
8. `validaciones_renaper` pueda apuntar a la sesión Didit que originó la validación.
9. `respuesta_cruda` no pueda utilizarse para almacenar payloads de Didit.
10. El caso `alta_referente` respete el `referente_id NOT NULL` existente.
11. El mapeo de `id_lookup` a `estado_dni` esté definido.
12. Los estados de `retiros` y resultados de autorización tengan valores cerrados.
13. No existan campos redundantes cuyo valor pueda contradecir otra fuente de verdad.
14. Exista una única autorización vigente por vínculo.
15. El retiro conserve la autorización concreta utilizada.
16. La FK de autorización hacia `nnya_tutores` utilice `ON DELETE RESTRICT`.
17. El fallback requiera 3 intentos fallidos o error del proveedor.
18. El fallback tenga `autorizado_por`, `autorizado_at` y motivo.
19. El control del rol de fallback exista en la base de datos.
20. El DNI de Didit provenga de `tutores.dni`.
21. El webhook tenga una vía explícita y segura para escribir pese a RLS.
22. Las nuevas tablas estén auditadas.
23. No se almacenen datos biométricos ni payloads completos de Didit.
24. Las relaciones críticas con `nnya_id` utilicen `ON DELETE RESTRICT`.
25. La decisión sobre referentes que pueden retirar quede resuelta antes de fijar la nulabilidad de `tutor_id`.

---

## 18. Chequeos

Antes de implementar la migración se deberá verificar:

* `CREATE TABLE` real de `validaciones_renaper`;
* constraints existentes de `nnya_tutores`;
* índices únicos parciales existentes para reutilizar el patrón;
* implementación actual de `get_my_role()`;
* políticas RLS existentes;
* implementación del webhook Didit;
* trigger `fn_audit_trigger()`;
* estructura de `audit_log`;
* tipos reales de DNI;
* estados reales utilizados por Didit;
* estados y valores existentes en las tablas relacionadas.

Después de implementar, deberán ejecutarse los chequeos definidos por `AGENTS-WEB.md`:

```text
npm run lint
npm run build
npx tsc --noEmit
```

Este plan no ejecuta todavía esos chequeos porque no implementa cambios.

---

## 19. Verificación manual posterior a la implementación

Una vez aprobada e implementada la migración, se deberá verificar como mínimo:

1. Crear un retiro y una primera sesión Didit.
2. Registrar una sesión fallida y comprobar que queda conservada.
3. Registrar un segundo intento y comprobar que ambos siguen asociados al mismo retiro.
4. Impedir un cuarto intento.
5. Comprobar la derivación del estado RNF-12.
6. Simular un error de proveedor sin `session_id`.
7. Verificar que una validación RENAPER queda asociada mediante `sesion_didit_id`.
8. Comprobar que un payload Didit no pueda terminar en `respuesta_cruda`.
9. Comprobar que no se almacenen datos biométricos.
10. Crear dos autorizaciones vigentes para el mismo vínculo y comprobar que la segunda sea rechazada.
11. Realizar un retiro y comprobar que queda registrada la autorización concreta utilizada.
12. Intentar eliminar un `nnya` relacionado y comprobar que `ON DELETE RESTRICT` protege la trazabilidad.
13. Intentar ejecutar fallback con un rol no autorizado y comprobar que la base lo rechaza.
14. Comprobar que el webhook puede actualizar las tablas utilizando únicamente el mecanismo server-side autorizado.
15. Verificar los registros generados en `audit_log`.
16. Verificar que el DNI enviado a Didit provenga de `tutores.dni` y no de un campo ingresado manualmente.

---

## 20. Deuda conocida

Quedan expresamente fuera de este plan hasta decisión de Jordy:

* si un referente puede realizar retiros;
* el rol exacto autorizado para fallback manual;
* cualquier cambio sobre `validaciones_renaper.referente_id NOT NULL`;
* cualquier cambio sobre la política actual de DNI;
* cualquier modificación de los estados de negocio no solicitada por RNF-12.

No se deberán resolver automáticamente estas cuestiones durante la implementación.

---

## Próximo paso

Este documento no implementa cambios en la base de datos.

Una vez revisado y aprobado por Jordy, se deberá crear la migración correspondiente en el repositorio web y actualizar los tipos/documentación necesarios.

La migración deberá respetar todas las decisiones aprobadas en este plan y no deberá almacenar datos biométricos, copias de DNI ni payloads completos de Didit.
