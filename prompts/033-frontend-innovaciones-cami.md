# 033 — Plan frontend de innovaciones independientes (Cami)

**Estado:** Plan listo para aprobación; aún no implementado.
**Fecha del relevamiento:** 2026-10-07
**Responsable:** Cami (UI/UX + frontend)
**Alcance autorizado:** solo frontend/demo para Timeline de NNyA y Alertas educativas.

> Este documento reemplaza el estado operativo del plan anterior `prompts/018-frontend-innovaciones-cami.md` y no lo sobreescribe. Registra que el plan 033 es la versión vigente del trabajo de Cami.

## 1. Objetivo

Avanzar únicamente en dos prototipos visuales y aislados, sin tocar la base, sin persistencia, sin reglas de negocio reales y sin invocar hooks operativos de Supabase. La intención es demostrar la propuesta en frontend para que el equipo pueda revisar la UX sin que el comportamiento quede confundido con la realidad del sistema.

Se prioriza:
- Timeline de NNyA como demostración local.
- Alertas educativas como demostración local.

No se avanza sobre ninguna otra innovación ni sobre integración externa.

## 2. Alcance autorizado

### Implementar ahora

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

### Esperar nuevas definiciones

3. Hito de 90 días
   - Pendiente de decisión de Jordy.
   - No se implementa como estado real ni persistido.

4. Estado “Verificado”
   - Pendiente de decisión de Jordy.
   - No se implementa ni se conoce aún la regla de negocio ni la presentación real.

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

### No existe y queda pendiente

- No existe un hito 90 real en la base ni en la UI.
- No existe un estado “Verificado” persistido ni como valor del dominio.
- No hay un flujo de RENAPER/Didit en la capa de frontend para Cami aún.
- No hay una estructura de alertas educativas operativas con ausencia escolar.

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

## 7. Archivos a crear

- `components/entities/nnya/TimelineNnyaDemo.tsx`
- `components/entities/alertas/AlertasEducativasDemo.tsx`

Opcionalmente, si hiciera falta ajustar una composición reutilizable de UI, se podrá crear un helper pequeño local, pero sin mover lógica del dominio ni tocar hooks reales.

## 8. Archivos a modificar

- `app/(dashboard)/nnya/[id]/page.tsx`
- `app/(dashboard)/alertas/page.tsx`

Se evita tocar cualquier otra pantalla o flujo operativo. Si se requiere un ajuste de estilo muy puntual, se hará con el menor alcance posible.

## 9. Requisitos de implementación

### 9.1 Timeline de NNyA

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

### Unitarias / componentales

Si existe convención clara en el repo, se agregan pruebas mínimas para:
- Timeline renderiza.
- La marca de demostración aparece.
- Se renderizan los eventos ficticios.
- El orden es cronológico.
- El componente no requiere datos de Supabase.

Para alertas educativas demo:
- El formulario renderiza.
- Permite cargar una ausencia local.
- La ausencia aparece en la UI.
- No se llama a mutación real.
- Las fixtures demo están separadas de las alertas reales.

### Validación del repo

Se ejecutarán las validaciones reales del proyecto después de la aprobación del plan y solo si se implementa el código:
- `npm run test:unit`
- `npx tsc --noEmit`
- `npm run build`
- `npm run lint` (si existe)

## 13. Riesgos y dependencias

- El mayor riesgo es mezclar la demo con datos reales del sistema.
- Si se quiere un 90 real o un “Verificado” real, la decisión corresponde a Jordy y a trabajo backend/modelo.
- La falta de definición de políticas de negocio para alertas educativas puede llevar a una demo demasiado “inventada”; por eso debe quedar claramente marcada como ficticia.
- La integración con Didit/Renaper no corresponde a Cami todavía.

## 14. Estado final de implementación

El alcance final de esta tarea, si se aprueba el plan, será:
- Timeline demo en `/nnya/[id]`.
- Alertas educativas demo en `/alertas`.
- Todo lo demás queda fuera del alcance y documentado como pendiente.

## 15. Requisito de aprobación

Conforme a `AGENTS-WEB.md`, este plan requiere aprobación explícita del líder antes de cualquier modificación de código.

**Estado de aprobación requerido:** “✓ Aprobado” o “✕ Cambiar X”.

Sin esa aprobación, no se implementa código.

## 16. Pendientes del equipo

- Jordy: confirmar el alcance de 90 días y “Verificado”.
- Sofi: definir modelo de datos y endpoints para dependencias futuras.
- Meli: preparar integraciones y testing si corresponde.
- Cami: solo implementa frontend demo y no se expande más allá de la demo.

## 17. Estado del plan

- Timeline: implementable como demo frontend sin backend.
- Alertas educativas: implementable como demo frontend sin backend.
- 90 días: pendiente de decisión.
- Verificado: pendiente de decisión.
- SENAF: eliminado del alcance porque ya está implementado.
- RENAPER/Didit: fuera de alcance para Cami hasta que Sofi/Meli completan dependencias.
