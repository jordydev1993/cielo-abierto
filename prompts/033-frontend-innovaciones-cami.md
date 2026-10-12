# 033 — Plan frontend de innovaciones independientes (Cami)

**Estado:** Demos frontend implementadas; integraciones operativas pendientes.
**Fecha del relevamiento:** 2026-10-07
**Responsable:** Cami (UI/UX + frontend)
**Alcance autorizado:** solo frontend/demo para Timeline de NNyA y Alertas educativas.

> Este documento reemplaza el plan `prompts/018-frontend-innovaciones-cami.md`, eliminado por obsoleto. `prompts/018-audit-log-real.md` conserva su número y no está relacionado con este plan.

## 1. Objetivo

Avanzar únicamente en dos prototipos visuales y aislados, sin tocar la base, sin persistencia, sin reglas de negocio reales y sin invocar hooks operativos de Supabase. La intención es demostrar la propuesta en frontend para que el equipo pueda revisar la UX sin que el comportamiento quede confundido con la realidad del sistema.

Se prioriza:
- Timeline de NNyA como demostración local.
- Alertas educativas como demostración local.

No se avanza sobre ninguna otra innovación ni sobre integración externa.

## 2. Alcance autorizado

### Demos implementadas

1. Timeline de NNyA demo
   - Visualización cronológica ficticia dentro del detalle del NNyA.
   - Etiqueta visible: “Demostración — datos ficticios; no representa el historial real de este NNyA.”
   - Fixture local de 3 a 5 eventos ficticios, ordenados cronológicamente.
   - Sin consultar Supabase ni mezclar datos con el estado real de la página.

2. Alertas educativas demo
   - Sección identificada como “Demostración de alertas educativas”.
   - Carga local de una ausencia ficticia con fecha, motivo y descripción opcional.
   - Listado de ejemplos de alertas educativas con estado, fecha y descripción.
   - Estado React local; no persiste ni dispara mutations reales.

### Fuera del alcance actual

3. Hito de 90 días
   - No forma parte de estas demos ni se implementa como estado real o persistido.

4. Estado “Verificado”
   - No forma parte de estas demos ni se implementa como estado persistido; la regla de negocio requiere definición.

### Eliminado del plan

5. Demo de Reportería SENAF
   - Se elimina del alcance porque el módulo real ya existe en `/reportes-senaf` y quedó implementado por `prompts/027`.
   - No se tocará ni se reimplementará como demo en esta tarea.

### No corresponde a Cami

6. RENAPER / Didit / Meli / Sofi
   - El trabajo de integración externa queda fuera del alcance actual de Cami.
   - Debe esperarse la definición del modelo de Sofi y los endpoints de Meli antes de que esto corresponda a frontend.

## 3. Fuera de alcance

Queda explícitamente fuera del alcance este plan:

- Reportería SENAF demo.
- Hito real de 90 días.
- Estado persistido “Verificado”.
- RENAPER/Didit.
- Integraciones externas.
- Cambios de backend.
- Cambios de Supabase.
- Migraciones.
- RLS.
- Nuevos endpoints.
- Nuevos hooks de persistencia.
- Cambios en tipos generados de Supabase.
- Cambios de reglas de negocio.
- Nuevas dependencias salvo que exista una necesidad claramente justificada y aceptada por el repo.
- Commit o push automático.

## 4. Estado actual verificado en el código

### Confirmado

- `app/(dashboard)/nnya/[id]/page.tsx` existe y muestra datos reales del NNyA: datos personales, legajo y tutores.
- No hay una timeline cronológica operativa ni una sección de histórico en esa pantalla.
- `app/(dashboard)/alertas/page.tsx` es una pantalla real con alertas actuales usando hooks de Supabase y operaciones persistidas.
- `components/entities/alertas/AlertaList.tsx` y `components/legajos/tabs/AlertasTab.tsx` muestran alertas reales y no una demo.
- `app/(dashboard)/reportes-senaf/page.tsx` y `app/(dashboard)/reportes-senaf/[id]/page.tsx` ya existen con módulo real de SENAF, aprobado por `prompts/027`.
- El proyecto ya tiene `npm run test:unit` y `npm run lint`/`npm run build` disponibles.

### Funcionalidades reales que siguen pendientes

- No existe un hito 90 real en la base ni en la UI.
- No existe un estado “Verificado” persistido ni como valor del dominio.
- La pantalla y el flujo real de retiros con RENAPER/Didit no forman parte de estas demos.
- No hay una estructura de alertas educativas operativas con ausencia escolar.

Las demos de Timeline y alertas educativas descritas en este plan sí están implementadas en la rama. Esto no convierte sus fixtures en información real ni implica que existan las integraciones, reglas de negocio o persistencia operativas.

### Definiciones necesarias para un timeline real

El relevamiento anterior mencionó como posibles fuentes `legajos`, `intervenciones`, `incidentes`, `diagnosticos`, `vinculos_tutela` y `nnya.fecha_egreso`. Son candidatas para evaluar, no fuentes aprobadas ni conectadas por la demo. Antes de construir un timeline real, el equipo debe definir qué eventos se incluyen, cómo se comparan y ordenan sus fechas, cómo tratar datos faltantes y qué reglas de privacidad y acceso aplican. La fixture actual no resuelve esas decisiones.

## 5. Decisiones ya tomadas

- La funcionalidad de demo debe ser clara y aislada visualmente.
- Los datos ficticios deben no ser reales y no contener DNI, nombres, expediente ni observaciones sensibles.
- Los prototipos no deben consultar Supabase ni disparar mutaciones reales.
- La demo no debe persistir en localStorage ni en base.
- La UI solo debe restringirse al frontend y al estado local de React.
- El diseño deberá reutilizar los tokens y componentes del sistema actual (`Button`, `Badge`, `Card`, `Input`, `Select`, `Textarea`, `Dialog`, etc.) de `docs/design-system.md`.

## 6. Dependencias técnicas

- Tiene que funcionar con el stack actual de Next.js 16 + App Router.
- Debe reutilizar la arquitectura existente: `components/entities`, `components/ui`, no crear nuevas dependencias salvo una necesidad muy justificada.
- El trabajo es local, no requiere cambios en Supabase ni migraciones.
- El estado demo será local al componente, sin query keys ni invalidación de cache.

## 7. Archivos implementados

- `components/entities/nnya/TimelineNnyaDemo.tsx`
- `components/entities/alertas/AlertasEducativasDemo.tsx`
- `components/entities/nnya/timeline-demo-data.ts`
- `components/entities/alertas/alertas-educativas-demo-data.ts`
- `tests/unit/innovacion1-demo.test.ts` — comprueba las fixtures y sus propiedades; no renderiza componentes React.

## 8. Archivos modificados

- `app/(dashboard)/nnya/[id]/page.tsx`
- `app/(dashboard)/alertas/page.tsx`

La demo de retiros está documentada e implementada por separado en `prompts/034-frontend-demo-retiros-innovacion-1.md`; no amplía el alcance de este plan. No se modificaron hooks de negocio, endpoints, base de datos, tipos ni políticas para implementar estas demos.

## 9. Requisitos satisfechos por las demos

### 9.1 Timeline de NNyA demo

- Insertar una sección claramente demarcada en el detalle del NNyA.
- El mensaje debe dejar en claro que es una demostración: “Demostración — datos ficticios; no representa el historial real de este NNyA.”
- Utilizar entre 3 y 5 eventos locales ficticios, coherentes cronológicamente.
- Incluir al menos: fecha, tipo/categoría, descripción breve.
- Orden cronológico consistente.
- No usar ningún dato real del NNyA o de su legajo.
- El componente debe ser responsive.
- Debe integrarse sin romper la vista actual del detalle.

### 9.2 Alertas educativas demo

- Añadir una sección claramente identificada como demostración dentro de `/alertas`.
- Permitir cargar una ausencia escolar ficticia con:
  - fecha
  - motivo
  - descripción opcional
- Mostrar la ausencia agregada localmente.
- Mostrar ejemplos de alertas educativas ficticias, con datos de demo y un texto claro de demostración.
- No generar alertas reales, no mutar Supabase, no invocar hooks reales.
- Debe ser local y temporal; se reinicia al recargar.
- Debe mantener intacto el flujo real de alertas ya funcionando.

## 10. Seguridad y datos

- No utilizar datos reales de NNyA, expedientes, nombres, DNI, observaciones, historial ni información sensible.
- No introducir secretos ni `.env.local`.
- No conectarse a servicios externos.
- No tocar rutas ni endpoints de Didit ni Meli.
- No persistir ninguna fixture en `localStorage`.
- No modificar RLS ni base de datos.
- No mezclar datos locales focalizados con datos reales del sistema.

## 11. Criterios de aceptación

### Timeline

- La pantalla `/nnya/[id]` renderiza sin errores.
- Existe una marca visible de demo.
- Se muestran 3 a 5 eventos ficticios.
- Los eventos están ordenados cronológicamente.
- No se usa ningún dato real del NNyA.
- El componente es responsive y no rompe la estructura existente.

### Alertas educativas

- La pantalla `/alertas` sigue funcionando con las alertas reales.
- Existe una sección de demo claramente identificada.
- El formulario local carga una ausencia ficticia.
- La ausencia se muestra localmente en la UI.
- No se escribe nada en Supabase.
- No se disparan queries o mutations reales.
- Las fixtures demo quedan separadas y no se mezclan con alertas reales.

## 12. Pruebas

`tests/unit/innovacion1-demo.test.ts` comprueba propiedades de las fixtures (orden cronológico, textos ficticios, estados de verificación y campos de demostración). No contiene pruebas de renderizado React ni de interacción del formulario; esos comportamientos requieren verificación manual.

### Validación del repo

Resultados ejecutados el 12/10/2026:
- `npm run test:unit`: pasó, 30/30.
- `npx tsc --noEmit`: pasó.
- `npm run build`: pasó; Next.js advirtió que detectó múltiples lockfiles y eligió `C:\Users\Admin\package-lock.json` como raíz.
- `npm run lint`: falló globalmente con 83 errores y 9 warnings, en su mayoría existentes y no relacionados con estas demos.
- ESLint directo sobre los archivos nuevos de demo y su prueba: pasó sin errores.

## 13. Riesgos y dependencias

- El mayor riesgo es mezclar la demo con datos reales del sistema.
- Las propuestas de una demo SENAF, un hito de 90 días y un estado “Verificado” del plan anterior no pertenecen al alcance vigente.
- La falta de definición de políticas de negocio para alertas educativas puede llevar a una demo demasiado “inventada”; por eso debe quedar claramente marcada como ficticia.
- La integración real con Didit/RENAPER permanece fuera del alcance y depende de decisiones y contratos confirmados por el equipo.

## 14. Estado de implementación

Implementado:
- Timeline ficticio en `/nnya/[id]`.
- Formulario local y ejemplos ficticios de alertas educativas en `/alertas`.

Las integraciones reales, la persistencia y las reglas de negocio siguen pendientes y no son parte de estas demos.

## 15. Aprobación y alcance

La implementación de las demos no autoriza ampliar su alcance a funcionalidades reales. Cualquier cambio de negocio, persistencia o integración debe seguir el proceso de aprobación vigente en `AGENTS-WEB.md`.

## 16. Pendientes del equipo

- Definir las fuentes, tipos de eventos, orden, privacidad y manejo de datos faltantes antes de desarrollar un timeline real.
- Definir captura, catálogo, reglas y persistencia antes de implementar alertas educativas operativas.
- Mantener cualquier desarrollo real de Didit/RENAPER sujeto a un contrato confirmado y a decisiones de producto.

## 17. Estado del plan

- Timeline y alertas educativas: demos frontend implementadas con datos ficticios, sin persistencia operativa.
- SENAF demo, hito de 90 días y estado “Verificado”: fuera del alcance actual.
- RENAPER/Didit y cualquier flujo real de retiros: fuera de este plan y pendientes de definiciones e integración.
