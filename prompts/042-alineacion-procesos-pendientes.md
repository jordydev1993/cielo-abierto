# 042 — Alineación de procesos: lo que falta después del PR #35

**Tarjeta:** sin tarjeta — Jordy — Media
**Estado:** ✓ Aprobado el 2026-10-12 por Jordy, con el informe en `revisado` → `borrador` y los códigos L-EX-18 a L-EX-20 aceptados. Implementado en la rama `feat/alineacion-procesos-042`; las migraciones están pendientes de aplicar (ver § Despliegue).

## Objetivo

Completar las reglas del relevamiento de procesos que se decidió implementar y que **todavía no están** en `master` (`6a9df77`). El PR #35 (`prompts/037-legajo-reglas-de-estado.md`) ya resolvió P1 (cierre de incidentes), P2 (archivado solo desde cerrado) y las reglas de estado del legajo de P3; este plan no las repite.

**Requisitos que implementa** (`../specs/`):

| Decisión | Requisitos |
|---|---|
| P3 (resto) | `REQ-LEG-09`, `REQ-TRZ-04`, y los estados terminales de `REQ-INF-02`, `REQ-SAL-03`, `REQ-SAL-05`, `REQ-ALR-01`, `REQ-INC-04` |
| P6 | `REQ-LEG-03`, `REQ-INF-03` |
| P7 | `REQ-SAL-05` |
| P8 | `REQ-INF-04` |
| P10 | `REQ-TRZ-05`, `REQ-AUD-03` |

## Contexto

Análisis completo: `../documentacion/alineacion-procesos.md` (corregido contra `master`). Verificado en producción el 2026-10-12, solo lectura:

| Dato | Valor | Impacto |
|---|---|---|
| Informes en estado `revisado` | 1 de 4 | Hay que migrarlo antes de quitar el valor del CHECK (P8) |
| Medicamentos con `fecha_fin < fecha_inicio` | 0 | El CHECK de P7 entra sin tocar datos |
| Filas en legajos no activos | 1 turno, 1 informe, 1 audiencia | El trigger de P3 actúa solo sobre escrituras nuevas; esas filas quedan de solo lectura |
| `chk_incidente_cerrado_con_acciones` | existe (PR #35) | No se duplica |

## Archivos inspeccionados

- Migraciones: `20260620000031_clean_schema.sql` (CHECK de estados, RLS `FOR ALL`), `20261010230000_legajo_reglas_estado.sql` (patrón de trigger a seguir).
- `lib/validations/{legajos,informes,medicamentos}.schema.ts`.
- `hooks/legajos/{useCreateLegajo,useUpdateLegajo}.ts`, `hooks/documentos/useUploadDocumento.ts`, `hooks/diagnosticos/useActualizarDiagnostico.ts`, `hooks/audiencias/useActualizarAudiencia.ts`, `hooks/incidentes/useCambiarEstadoIncidente.ts`.
- `components/entities/{documentos/DocumentoUpload,diagnosticos/DiagnosticoList,audiencias/AudienciaList}.tsx`.
- Mobile: `arguello-infancias-mobile/src/hooks/useCriticalIncidents.ts` (solo crea incidentes, y ya filtra por legajo activo).

## Skills utilizadas

`database-design` (triggers y CHECKs), `crud-generator` (formularios), `documentation` (specs).

## Supuestos

1. Las reglas vigentes son las de `../documentacion/procesos-del-negocio.md` y los requisitos de `../specs/`.
2. Los triggers nuevos siguen el patrón de `fn_legajos_reglas_estado`: `SET search_path = public`, mensajes en castellano y sin `SECURITY DEFINER`.
3. Mobile no se modifica: solo inserta incidentes en legajos activos.

## Archivos a crear o modificar

### P3 · Reglas en la base (resto)

Migración nueva `supabase/migrations/<timestamp>_reglas_registros_legajo.sql`:

1. **`fn_exigir_legajo_activo()`**, `BEFORE INSERT OR UPDATE` en `turnos`, `incidentes`, `informes`, `diagnosticos`, `medicamentos`, `documentos` y `audiencias_judiciales`: rechaza la escritura si el legajo de `NEW.legajo_id` no está `activo`. Mensaje: "El legajo no está activo: no admite registros nuevos ni cambios (L-EX-09)".
2. **Estados terminales**, `BEFORE UPDATE`: no se modifica una alerta `completada` (A-EX-05), un diagnóstico `resuelto`, una medicación `finalizado`, un informe `finalizado` (INF-EX-05) ni un incidente `cerrado`. Una función por tabla o una genérica con `TG_TABLE_NAME`, a definir al implementar.

**Fuera del trigger:** `intervenciones` no tiene `legajo_id` (se asocia al NNyA) y `actividades` es grupal; quedan como validación de aplicación.

### P6 · Columnas nuevas

En la misma migración o en otra:

- `legajos.motivo_ingreso TEXT` + `CHECK (motivo_ingreso IS NOT NULL AND btrim(motivo_ingreso) <> '') NOT VALID`: obliga a los legajos nuevos sin invalidar los 5 existentes. **Ojo:** con `NOT VALID`, un `UPDATE` sobre un legajo viejo también se valida; los legajos activos sin motivo no podrían cerrarse hasta completarlo. Alternativa: validar solo en `INSERT` dentro de `fn_legajos_reglas_estado`. Se elige al implementar; recomiendo la segunda.
- `informes.destinatario VARCHAR(20) CHECK (destinatario IN ('SENAF','Juzgado','Interno'))`, obligatorio en `INSERT` (misma estrategia).
- Formularios: `components/entities/legajos/LegajoForm.tsx`, `components/entities/informes/InformeForm.tsx` y sus schemas zod.

### P7 · Fechas de medicación

`ALTER TABLE medicamentos ADD CONSTRAINT chk_medicamentos_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio);` (0 filas en conflicto) y el `.refine()` equivalente en `lib/validations/medicamentos.schema.ts`.

### P8 · Quitar `revisado`

1. `UPDATE informes SET estado = '<ver decisión abierta>' WHERE estado = 'revisado';` (1 fila).
2. Redefinir el CHECK de `informes.estado` como `('borrador','finalizado')`.
3. Regenerar `types/database.generated.ts` y ajustar `types/database.types.ts`.

### P10 · Etiquetas

| Archivo | Hoy | Pasa a |
|---|---|---|
| `hooks/legajos/useCreateLegajo.ts:18` | L-EX-03 (número duplicado) | L-EX-17 |
| `hooks/legajos/useUpdateLegajo.ts:60` y `:70` | L-EX-10 (informe de egreso) | L-EX-12 |
| `hooks/documentos/useUploadDocumento.ts:17`, `components/entities/documentos/DocumentoUpload.tsx:35` | DOC-EX-01 (10 MB) | D-EX-06 |
| `hooks/diagnosticos/useActualizarDiagnostico.ts:18`, `components/entities/diagnosticos/DiagnosticoList.tsx:67` | DGN-EX-05 (resuelto terminal) | sin código (regla de la máquina de estados) |
| `hooks/audiencias/useActualizarAudiencia.ts:19`, `components/entities/audiencias/AudienciaList.tsx:232` | AJ-EX-04 por fecha futura | AJ-EX-04 por estado: solo se registra resolución en una audiencia `programada` cuya fecha ya pasó |

### Documentación

- `../specs/*.md`: estado y evidencia de cada requisito implementado.
- `AGENTS-WEB.md` § Deuda conocida: cerrar la fila `legajo-estados` (resuelta por el PR #35 y la decisión P5).

## Requisitos

Los de las specs citadas en § Objetivo, con sus criterios de aceptación.

## Seguridad

- Los triggers de P3 llevan a la base las reglas que hoy solo hace cumplir la interfaz, como pide la regla de oro "Validar en la base".
- No cambian RLS ni roles. El `audit_log` registra todo como hoy.
- Correr `get_advisors` de seguridad después de aplicar: sin avisos nuevos.

## Decisiones

1. **El informe en `revisado`** pasa a `borrador` (Jordy, 2026-10-12): `finalizado` lo habría vuelto no editable sin que nadie lo enviara.
2. **Motivo de ingreso** (riesgo de P6): se exige solo al abrir el legajo, con un trigger `BEFORE INSERT`, no con un CHECK. Así los 5 legajos existentes se pueden seguir editando y cerrando. Si un legajo ya tiene motivo, no se puede borrar, y un legajo no activo no lo cambia.
3. **Acciones en cascada:** los triggers de P3 dejan pasar las actualizaciones que dispara otra operación de la base (`pg_trigger_depth() > 1`), por ejemplo un `ON DELETE SET NULL` al borrar un usuario.

## Criterios de aceptación

1. La base rechaza crear o modificar un turno, incidente, informe, diagnóstico, medicación, documento o audiencia de un legajo cerrado o archivado; lo existente se sigue pudiendo leer.
2. La base rechaza modificar una alerta completada, un diagnóstico resuelto, una medicación finalizada, un informe enviado o un incidente cerrado.
3. Un legajo nuevo sin motivo de ingreso y un informe nuevo sin destinatario se rechazan; los existentes siguen funcionando.
4. La medicación rechaza una fecha de fin anterior a la de inicio, en el formulario y en la base.
5. No existe el estado `revisado` en informes.
6. Los mensajes citan los códigos correctos del catálogo; AJ-EX-04 se valida por estado.

## Chequeos

`npm run lint`, `npx tsc --noEmit`, `npm run build`. Las migraciones se prueban primero con bloques que fuerzan `ROLLBACK` o en Supabase local. **Las aplica Jordy** (no se escribe en producción por MCP).

## Verificación manual

En producción después del merge (las Preview de Vercel no tienen variables):

1. En un legajo cerrado, intentar agregar un turno desde la API o la consola: error con L-EX-09.
2. Resolver una alerta y luego intentar editarla: error.
3. Abrir un legajo sin motivo de ingreso: el formulario lo pide y la base lo rechaza.
4. Cargar medicación con fin anterior al inicio: error en el formulario.
5. Revisar que el informe migrado quedó en el estado decidido.

## Implementación

| Parte | Archivos |
|---|---|
| P10 | `hooks/legajos/useCreateLegajo.ts` (L-EX-17; además corrige un bug: un número de legajo duplicado mostraba "el NNyA ya tiene un legajo activo", porque cualquier error 23505 caía primero en ese caso), `hooks/legajos/useUpdateLegajo.ts` (L-EX-12), `hooks/documentos/useUploadDocumento.ts` y `DocumentoUpload.tsx` (D-EX-06), `hooks/diagnosticos/useActualizarDiagnostico.ts` y `DiagnosticoList.tsx` (sin código), `hooks/audiencias/useActualizarAudiencia.ts` (AJ-EX-04 también por estado) |
| P6 | `lib/validations/{legajos,informes}.schema.ts`, `LegajoForm.tsx`, `InformeForm.tsx`, `InformeList.tsx` (muestra el destinatario), `useCreateLegajo.ts`, `useUpdateLegajo.ts`, `useCreateInforme.ts` |
| P7 | `lib/validations/medicamentos.schema.ts` (`.refine`), `useFinalizarMedicamento.ts` (mensaje claro si el tratamiento todavía no empezó) |
| P8 | `app/(dashboard)/informes/page.tsx`, `InformeList.tsx`, `types/database.types.ts` |
| Tipos | `types/database.generated.ts`: se agregaron a mano `legajos.motivo_ingreso` e `informes.destinatario`. **Regenerar** con `supabase gen types` después de aplicar la migración y verificar que el diff quede igual |
| Migraciones | `20261012200000_alineacion_columnas_y_checks.sql` (P6, P7, P8), `20261012201000_reglas_registros_legajo.sql` (P3) |

Chequeos: `npx tsc --noEmit` ✓, `npm run build` ✓, `npm run test:unit` ✓ (26/26). `eslint` sobre los archivos tocados: 4 errores y 1 advertencia **preexistentes** (`any` en exportaciones CSV y `catch`, un parámetro sin usar), los mismos que en `master`; ninguno nuevo.

## Despliegue

El código nuevo escribe `legajos.motivo_ingreso` e `informes.destinatario`, que crea la migración, y la migración exige esos datos. Ninguno de los dos funciona sin el otro:

1. Probar las migraciones con el script de § Pruebas (transacción con `ROLLBACK`, no deja cambios).
2. Aplicar `20261012200000` y mergear el PR **seguidos**: en el intervalo, abrir legajos o crear informes falla.
3. Aplicar `20261012201000` (P3). No depende del código nuevo.
4. Regenerar los tipos y correr `get_advisors` de seguridad.

## Pruebas

Pegar en el SQL Editor de Supabase, **después** del contenido de las dos migraciones y dentro de la misma transacción. Cada bloque imprime `OK` o corta con `FALLO`. El `ROLLBACK` final deshace todo.

```sql
BEGIN;
-- (pegar acá las dos migraciones)

DO $$
DECLARE
  v_activo  legajos%ROWTYPE;
  v_cerrado legajos%ROWTYPE;
  v_turno   UUID;
  v_alerta  UUID;
BEGIN
  SELECT * INTO v_activo  FROM legajos WHERE estado = 'activo'  LIMIT 1;
  SELECT * INTO v_cerrado FROM legajos WHERE estado = 'cerrado' LIMIT 1;

  -- P6: legajo sin motivo de ingreso
  BEGIN
    INSERT INTO legajos (nnya_id, numero_legajo) VALUES (v_cerrado.nnya_id, 'PRUEBA-042');
    RAISE EXCEPTION 'FALLO: se abrió un legajo sin motivo de ingreso';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FALLO%' THEN RAISE; END IF;
    RAISE NOTICE 'OK P6 legajo: %', SQLERRM;
  END;

  -- P6: informe sin destinatario y con destinatario inválido
  BEGIN
    INSERT INTO informes (nnya_id, legajo_id, tipo, titulo, contenido)
    VALUES (v_activo.nnya_id, v_activo.id, 'Otro', 'Prueba', 'Prueba');
    RAISE EXCEPTION 'FALLO: se creó un informe sin destinatario';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FALLO%' THEN RAISE; END IF;
    RAISE NOTICE 'OK P6 informe: %', SQLERRM;
  END;
  BEGIN
    INSERT INTO informes (nnya_id, legajo_id, tipo, titulo, contenido, destinatario)
    VALUES (v_activo.nnya_id, v_activo.id, 'Otro', 'Prueba', 'Prueba', 'Escuela');
    RAISE EXCEPTION 'FALLO: se aceptó un destinatario inválido';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK P6 destinatario: %', SQLERRM;
  END;

  -- P7: medicación con fin anterior al inicio
  BEGIN
    INSERT INTO medicamentos (nnya_id, legajo_id, nombre, dosis, frecuencia, fecha_inicio, fecha_fin)
    VALUES (v_activo.nnya_id, v_activo.id, 'Prueba', '1', 'diaria', CURRENT_DATE, CURRENT_DATE - 1);
    RAISE EXCEPTION 'FALLO: se aceptó fin anterior al inicio';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK P7: %', SQLERRM;
  END;

  -- P8: no queda ningún informe en revisado
  IF EXISTS (SELECT 1 FROM informes WHERE estado = 'revisado') THEN
    RAISE EXCEPTION 'FALLO: quedó un informe en revisado';
  END IF;
  RAISE NOTICE 'OK P8';

  -- P3: turno nuevo en legajo cerrado
  BEGIN
    INSERT INTO turnos (nnya_id, legajo_id, tipo, fecha_hora)
    VALUES (v_cerrado.nnya_id, v_cerrado.id, 'Médico', NOW() + INTERVAL '7 days');
    RAISE EXCEPTION 'FALLO: se agendó un turno en un legajo cerrado';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FALLO%' THEN RAISE; END IF;
    RAISE NOTICE 'OK P3 alta en legajo cerrado: %', SQLERRM;
  END;

  -- P3: modificar un turno existente de un legajo no activo
  SELECT t.id INTO v_turno FROM turnos t JOIN legajos l ON l.id = t.legajo_id WHERE l.estado <> 'activo' LIMIT 1;
  IF v_turno IS NOT NULL THEN
    BEGIN
      UPDATE turnos SET observaciones = 'prueba' WHERE id = v_turno;
      RAISE EXCEPTION 'FALLO: se modificó un turno de un legajo cerrado';
    EXCEPTION WHEN raise_exception THEN
      IF SQLERRM LIKE 'FALLO%' THEN RAISE; END IF;
      RAISE NOTICE 'OK P3 cambio en legajo cerrado: %', SQLERRM;
    END;
  END IF;

  -- P3: alta normal en legajo activo (tiene que funcionar)
  INSERT INTO turnos (nnya_id, legajo_id, tipo, fecha_hora)
  VALUES (v_activo.nnya_id, v_activo.id, 'Médico', NOW() + INTERVAL '7 days');
  RAISE NOTICE 'OK P3 alta en legajo activo';

  -- P3: estado terminal (una alerta completada no se modifica)
  INSERT INTO alertas (nnya_id, titulo, tipo, estado)
  VALUES (v_activo.nnya_id, 'Prueba 042', 'prueba', 'pendiente') RETURNING id INTO v_alerta;
  UPDATE alertas SET estado = 'completada', observacion_cierre = 'prueba' WHERE id = v_alerta;
  BEGIN
    UPDATE alertas SET titulo = 'cambio' WHERE id = v_alerta;
    RAISE EXCEPTION 'FALLO: se modificó una alerta completada';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FALLO%' THEN RAISE; END IF;
    RAISE NOTICE 'OK P3 estado terminal: %', SQLERRM;
  END;
END $$;

ROLLBACK;
```
