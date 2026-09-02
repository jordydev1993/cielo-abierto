# ✅ Checklist Final: Mañana Empezamos en Claude Code

**Estado:** Decisiones confirmadas, archivos listos, ready to code.  
**Tiempo total:** 5-6 semanas (Fases A-E)  
**Resultado:** 6 procesos completos + 27 tablas (17 existentes + 10 nuevas) + auditoría LPDP

---

## 🎯 HOY (Antes de Dormir)

### 1. Descarga los 4 archivos FINALES
- [ ] 00-RESUMEN-EJECUTIVO-FINAL.md (visión completa)
- [ ] 02-AGENTS-ACTUALIZADO.md (reglas del proyecto)
- [ ] 03-PROMPTS-A0-A1-A2-DEFINITIVO-v2.md ← USA ESTE (A0, A1, A2)
- [ ] CHECKLIST-FINAL.md (este archivo)

Guárdalos en: `arguello-infancias/docs/evolucion/`

**ARCHIVOS A IGNORAR (desactualizados):**
```
❌ 03-PROMPTS-EVOLUCION-ACTUALIZADO.md (viejo)
❌ 03-PROMPTS-A1-A2-DEFINITIVO.md (versión anterior)
❌ 03b-PROMPTS-A1-A2-CORREGIDOS.md (viejo)
❌ 04-FASE1-FASE2-ARQUITECTURA.md (todavía menciona admin)
❌ 05-FASE2-PROMPTS-E1-E8.md (todavía menciona admin)
❌ README.md (viejo)
❌ 01-NUEVAS-FUNCIONALIDADES.md (desfasado)
```

### 2. Haz backup de tu BD Supabase
```bash
# En Supabase Dashboard:
# Settings → Backups → Verify automatic backups ON
# ✅ Confirmar: Backups cada día a las 2 AM (UTC)
```

### 3. Lee rápido (15 min)
- [ ] Este archivo (CHECKLIST-FINAL.md)
- [ ] README.md (resumen)

**NO releas AGENTS.md ni PROMPTS.md hoy.** Lo haces en Claude Code mañana.

---

## 🚀 MAÑANA (Sesión 1: Fase A - RLS para nuevas tablas)

### Paso 1: Abre arguello-infancias en Claude Code
```bash
cd arguello-infancias
code .

# Se abre VS Code + Claude en sidebar derecho
```

### Paso 2: En el chat de Claude Code, pega EXACTAMENTE esto

```
Hola. Voy a evolucionar arguello-infancias implementando 6 procesos operativos reales:

Procesos a desarrollar:
1. Ingreso y Admisión (con gestión de tutores + RENAPER)
2. Evaluación Integral (ya existe, sin cambios)
3. Acompañamiento Diario (con registro de turnos)
4. Salud (ya existe, sin cambios)
5. Egreso o Reintegración Familiar (con seguimiento 30-60 días)
6. Evaluación Institucional (reunión mensual + propuestas)

Decisiones CONFIRMADAS:
✅ Mantener 2 roles (admin, equipo)
✅ Gestión de tutela y revinculación (no fondos/gastos/stock)
✅ Validación RENAPER integrada
✅ Seguimiento post-egreso: verificación de cumplimiento
✅ Firma doble en turnos (entrante + saliente)
✅ Auditoría inmutable + LPDP compliant

Necesito que leas:
- 02-AGENTS-ACTUALIZADO.md (reglas del proyecto)
- 03-PROMPTS-A0-A1-A2-DEFINITIVO-v2.md (prompts a ejecutar)

Arrancamos con Fase A:
- Prompt A0: agregar fecha_egreso a nnya
- Prompt A1: crear 10 tablas nuevas
- Prompt A2: RLS policies

Aquí está el Prompt A0 (copia de 03-PROMPTS-A0-A1-A2-DEFINITIVO-v2.md):

[COPIA PROMPT A0 COMPLETO]
```

### Paso 3: Claude propone un plan
- Leerá AGENTS.md + archivos del proyecto
- Te mostrará "Aquí está mi plan para Prompt A1..."
- **TÚ LEES COMPLETAMENTE**

### Paso 4: TÚ apruebas o pides cambios
```
"OK, el plan está bien. Adelante con la implementación."
O
"Espera, quiero que cambies X. Porque..."
```

### Paso 5: Claude implementa
- Crea migration SQL
- Actualiza archivos de código
- Muestra pasos de validación

### Paso 6: Valida localmente
```bash
# En tu terminal (no en Claude Code):
cd arguello-infancias

# Corre la migración en Supabase
# (Claude te dirá exactamente cómo)

# Verifica que funciona:
npm run dev
# Abre http://localhost:3000
# Login como admin
# Verifica que las tablas nuevas existen
# Intenta INSERT en referentes, vinculos_tutela, etc.
```

### Paso 7: Reporta a Claude
```
"Implementación OK. Pasé las validaciones.

A0: fecha_egreso agregada ✅
A1: 10 tablas creadas ✅
A2 listos para siguiente sesión

¿Continuamos con A2?"
```

**Sesión 1 = 2-3 horas, 3 prompts (A0 → A1 → A2), listo.**

---

## 📅 PRÓXIMAS SESIONES (Semana 1-6)

### Sesión 1 (HOY/Mañana - 2-3h)
```
Fase A: Tablas base
- A0: fecha_egreso
- A1: 10 tablas nuevas
- A2: RLS policies
```

### Sesión 2 (Jueves-Viernes - 4-5h)
```
Fase B: Gestión de tutela (Procesos 1.1 y 1.5)
- B1: UI crear/cambiar tutores + referentes
- B2: Integración RENAPER (validación DNI)
- B3: Seguimiento revinculación + AUH
```

### Sesión 3 (Lunes-Martes - 4-5h)
```
Fase C: Evaluación institucional (Proceso 1.8)
- C1: UI crear reuniones + registrar casos
- C2: Kanban de propuestas
- C3: Notificaciones automáticas
```

### Sesión 4 (Miércoles-Jueves - 3-4h)
```
Fase D: Turnos y acompañamiento (Proceso 1.3)
- D1: UI crear/gestionar turnos
- D2: Firma doble (entrante + saliente)
- D3: Dashboard de cobertura
```

### Sesión 5 (Viernes-Lunes - 3-4h)
```
Fase E: Seguimiento post-egreso (Proceso 1.5)
- E1: UI cumplimiento (escolaridad, salud, terapias)
- E2: Cron jobs (30-60 días)
- E3: Dashboard de reinserción
```



---

## ⚡ Tips para que sea rápido

1. **Lee prompts EN Claude Code, no aquí**
   - No copies todo de una. 1 prompt = 1 sesión.

2. **Aprueba rápido**
   - Si el plan está bien, no hagas 20 preguntas.
   - "OK, adelante" es suficiente.

3. **Valida localmente después de cada prompt**
   - `npm run dev` + prueba manual (5 min)
   - Reporta resultado: "OK ✅" o "Error: ..."

4. **Una sesión = 1-2 horas máximo**
   - Si se alarga, deja pausa para mañana.

5. **Git commit después de cada prompt**
   ```bash
   git add .
   git commit -m "Prompt A1: RLS policies para nuevas tablas"
   ```

---

## 📋 Tracking de Progreso (Úsalo)

Copia esto a un archivo `PROGRESO.md` y actualiza:

```
## Fase A: Tablas y Políticas Base
- [ ] A0: Agregar fecha_egreso a nnya
- [ ] A1: CREATE TABLE (10 tablas nuevas)
- [ ] A2: RLS policies

## Fase B: Gestión de Tutela (Procesos 1.1 y 1.5)
- [ ] B1: UI crear/cambiar tutores + referentes
- [ ] B2: Integración RENAPER
- [ ] B3: Seguimiento revinculación + AUH

## Fase C: Evaluación Institucional (Proceso 1.8)
- [ ] C1: UI crear reuniones + registrar casos
- [ ] C2: Kanban de propuestas
- [ ] C3: Notificaciones automáticas

## Fase D: Turnos y Acompañamiento (Proceso 1.3)
- [ ] D1: UI crear/gestionar turnos
- [ ] D2: Firma doble (entrante + saliente)
- [ ] D3: Dashboard de cobertura

## Fase E: Seguimiento Post-Egreso (Proceso 1.5)
- [ ] E1: UI cumplimiento (escolaridad, salud, terapias)
- [ ] E2: Cron jobs (30-60 días)
- [ ] E3: Dashboard de reinserción

TOTAL: 14 prompts | Completados: ☐/14
```

---

## ❓ Si algo sale mal

### "Error en la migración SQL"
```
1. Claude vuelve atrás
2. Revisa el error
3. Propone fix
4. Repites pasos
```

### "Código no compila"
```
1. Paste el error exacto a Claude
2. Él refactoriza
3. Validas de nuevo
```

### "Necesito pausa / entiendo lento"
```
= ES NORMAL
- Tómate el tiempo que necesites
- 5+ semanas = sin presión
- Puedes hacer 1 prompt cada 2 días si preferís
```

---

## 🎯 Resultado Final (Fin de Semana 6)

✅ **27 tablas totales** (17 existentes + 10 nuevas)
✅ **6 procesos operativos completos** (1.1, 1.3, 1.5, 1.8, + salud + evaluación)
✅ **Auditoría inmutable** en todas las acciones
✅ **Gestión de tutela y revinculación** completamente implementada
✅ **Validación RENAPER** integrada (DNI: antecedentes + vigencia)
✅ **Evaluación institucional** con Kanban de propuestas
✅ **Seguimiento post-egreso** 30-60 días + verificación de cumplimiento
✅ **Turnos y acompañamiento diario** con firma doble
✅ **LPDP compliance** verificado
✅ **Zero downtime** (migraciones sin perder datos)
✅ **Git history limpio** (commits por prompt)
✅ **Tests en funciones críticas** (auditoría, RLS, RENAPER)

**Listo para que usemos en producción.**

---

## ✨ Última Cosa

**Confianza:** Esto ya funciona en arguello-infancias actual (17 tablas, RLS, audit_log).
Los patrones que usamos están probados. Solo estamos replicando lo que funciona.

**Ritmo:** 1 prompt ≈ 2 horas. Sostenible. Calidad asegurada.

**Resultado:** Sistema enterprise-grade, LPDP-compliant, listo para Direcciones reales.

---

## 🚀 Mañana a las... [TÚ ELIGES LA HORA]

```
✅ Terminal abierto: cd arguello-infancias
✅ Claude Code abierto: code .
✅ Este checklist impreso/a-mano
✅ Prompt A1 copiado

Pegar → Leer → Aprobar → Implementar → Validar

Go. 🚀
```

---

**¿Preguntas antes de mañana? Pregunta ahora.** De lo contrario, nos vemos en Claude Code. 💪
