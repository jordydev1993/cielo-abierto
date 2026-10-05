# Plan 027 — Modelo de datos para retiros y verificación de identidad con Didit

## Objetivo

Diseñar el modelo de datos necesario para implementar el proceso de retiro de NNyA y la verificación de identidad mediante Didit, respetando el modelo de datos actual de Argüello Infancias.

Este documento es un PLAN. No realiza cambios en la base de datos ni crea migraciones todavía.

## Contexto

El proyecto ya cuenta con las tablas:

* `nnya`
* `tutores`
* `nnya_tutores`
* `referentes`
* `vinculos_tutela`
* `validaciones_renaper`
* `usuarios`
* `roles`
* `audit_log`

El webhook de Didit está contemplado en el Plan 016 y recibe un `session_id`.

Las nuevas relaciones con `nnya_id` deberán respetar `ON DELETE RESTRICT`.

## 1. Tabla `sesiones_didit`

Se propone una única tabla para registrar las sesiones de Didit utilizadas por distintos procesos.

### Campos propuestos

* `id`: UUID, clave primaria.
* `session_id`: identificador de sesión proporcionado por Didit, obligatorio y único.
* `proposito`: propósito de la sesión:

  * `retiro`
  * `validacion_referente`
* `estado_rnf12`: estado de la verificación según las cinco categorías definidas por RNF-12.
* `estado_didit`: estado informado por Didit.
* `validacion_renaper_id`: referencia opcional a `validaciones_renaper`.
* `creada_por`: usuario que inició la operación, cuando corresponda.
* `created_at`
* `updated_at`
* `finalizada_at`

### Reglas

* `session_id` debe ser único.
* Una sesión finalizada representa un intento de verificación.
* Los estados de Didit deben mapearse a las cinco categorías de RNF-12.
* `expired` y `abandoned` deben mapearse a “Identidad no verificada”.
* No se almacenarán selfies, videos de liveness, plantillas biométricas ni copias del DNI.

## 2. Tabla `retiros`

Se propone una tabla propia para registrar cada operación de retiro.

### Campos mínimos

* `id`: UUID, clave primaria.
* `nnya_id`: NNyA asociado.
* `tutor_id`: tutor que realiza el retiro.
* `usuario_id`: usuario que registra o gestiona la operación.
* `sesion_didit_id`: referencia opcional a `sesiones_didit`.
* `resultado_validacion_identidad`.
* `resultado_autorizacion`.
* `cantidad_intentos`.
* `motivo_rechazo`.
* `autorizado_por`: usuario que realiza una autorización manual.
* `estado`.
* `fecha_inicio`.
* `fecha_fin`.
* `descripcion`.
* `observaciones`.
* `created_at`.
* `updated_at`.

### Reglas

* `nnya_id` debe utilizar `ON DELETE RESTRICT`.
* `cantidad_intentos` tendrá un máximo de 3.
* Cada intento corresponde a una sesión de Didit finalizada.
* La identidad no verificada no debe generar autorización automática del retiro.
* La autorización manual debe quedar auditada.

## 3. Autorización para retirar

No se debe utilizar `nnya_tutores.es_principal` para determinar si una persona está autorizada a retirar.

Ser tutor principal y estar autorizado para retirar son conceptos diferentes.

Se propone una tabla específica:

### `autorizaciones_retiro`

Campos propuestos:

* `id`
* `nnya_tutor_id`
* `autorizado`
* `vigente_desde`
* `vigente_hasta`
* `restricciones`
* `created_by`
* `created_at`
* `updated_at`

Esto permitirá registrar si un tutor está autorizado, durante qué período y qué restricciones existen.

## 4. Autorización manual

El modelo debe contemplar un mecanismo de fallback cuando la validación automática mediante Didit no pueda completarse.

La autorización manual deberá registrar:

* resultado de la autorización;
* usuario que autorizó mediante `autorizado_por`;
* motivo cuando corresponda;
* fecha de autorización;
* auditoría de la operación.

### Punto pendiente

Se debe confirmar si la autorización manual corresponde solamente a `Admin` o también a `Equipo Tecnico`, ya que existe una diferencia entre definiciones previas.

## 5. Integración con RENAPER

No se propone crear una segunda tabla de validaciones RENAPER.

Se reutilizará la tabla existente `validaciones_renaper`.

`sesiones_didit.validacion_renaper_id` permitirá relacionar una sesión Didit con una validación RENAPER cuando corresponda.

## 6. Seguridad y RLS

Las nuevas tablas deberán:

* tener RLS habilitado;
* respetar los roles actuales;
* aplicar mínimo privilegio;
* impedir accesos innecesarios a información sensible.

Las operaciones de autorización manual deberán quedar restringidas a los roles que se definan.

## 7. Auditoría

Las nuevas tablas deberán integrarse al mecanismo de auditoría existente:

* `sesiones_didit`
* `retiros`
* `autorizaciones_retiro`

Se deberán crear los correspondientes triggers `trg_audit_*`.

No se deberán guardar datos biométricos en `audit_log`.

## 8. Webhook de Didit

El webhook utilizará `session_id` para localizar la sesión correspondiente en `sesiones_didit`.

Flujo propuesto:

1. Validar firma del webhook.
2. Buscar `session_id`.
3. Actualizar `sesiones_didit`.
4. Asociar el resultado con el retiro correspondiente cuando corresponda.
5. No crear registros huérfanos para sesiones desconocidas.

## 9. Minimización de datos

No se almacenarán:

* selfies;
* videos de liveness;
* plantillas biométricas;
* imágenes o copias del DNI;
* información biométrica innecesaria.

Se almacenará únicamente el resultado necesario para la operación y su auditoría.

## 10. Decisiones propuestas

1. Crear una tabla propia `retiros`.
2. Crear una tabla compartida `sesiones_didit`.
3. Utilizar `proposito` para diferenciar `retiro` y `validacion_referente`.
4. Limitar a 3 los intentos de Didit por retiro.
5. Considerar una sesión finalizada como un intento.
6. Utilizar `ON DELETE RESTRICT` para `nnya_id`.
7. No utilizar `es_principal` como autorización de retiro.
8. Crear `autorizaciones_retiro` para representar autorización y restricciones vigentes.
9. Reutilizar `validaciones_renaper`.
10. Integrar las nuevas tablas al sistema de auditoría.
11. Aplicar RLS y mínimo privilegio.
12. No almacenar datos biométricos ni copias de documentos.

## 11. Puntos a confirmar antes de implementar

Antes de crear la migración se deberá confirmar:

1. Los nombres exactos de las cinco categorías de RNF-12.
2. El mapeo definitivo de los estados de Didit.
3. Si la autorización manual corresponde a `Admin` o también a `Equipo Tecnico`.
4. Si `autorizaciones_retiro` será una tabla independiente o campos dentro de `nnya_tutores`.
5. Si el retiro será realizado exclusivamente por tutores o también por otros referentes/personas autorizadas.

## Próximo paso

Este documento no implementa cambios en la base de datos.

Una vez aprobado el modelo, se deberá crear la migración correspondiente en el repositorio web y actualizar los tipos/documentación necesarios.
