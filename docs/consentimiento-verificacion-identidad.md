# Consentimiento — verificación de identidad con Didit (innovación 1)

**Estado:** borrador del 14/10/2026 (D-25). **Antes de usarlo con datos reales lo tiene que revisar alguien con formación legal** (requisito previo 2 de la Práctica 3: los datos biométricos y los de RENAPER son datos sensibles).

**Dónde se usa:** pantalla de consentimiento previa a la verificación, en el retiro de un NNyA y en el alta de un referente (#26). Si el adulto no acepta, se aplica D-26.

**Pendientes antes de producción:**
- Nombre, dirección y contacto de la residencia (responsable de los datos y canal para ejercer derechos).
- País donde Didit procesa los datos. Las pruebas en sandbox del 09/10 mostraron archivos guardados en un servidor de AWS en Europa (eu-west-1); hay que confirmarlo con Didit antes de afirmar un país.

---

## Texto breve (pantalla)

> **Verificación de identidad**
>
> Para [retirar a / registrarte como referente de] un niño, niña o adolescente de la residencia, necesitamos confirmar que sos quien decís ser.
>
> Vas a ingresar tu número de DNI y tu sexo, y sacarte una selfie. Un servicio externo (Didit) compara esos datos con el Registro Nacional de las Personas (RENAPER) y controla que la selfie sea de una persona real.
>
> La residencia solo guarda el resultado: si tu identidad se verificó o no. No guardamos tu selfie ni tus datos personales de RENAPER.
>
> Es voluntario. Si no aceptás, un responsable de la residencia puede verificar tu identidad a mano con tu DNI.
>
> [Acepto y continúo] · [No acepto] · [Ver más]

El texto entre corchetes del primer párrafo cambia según el flujo: retiro o alta de referente.

## Detalle ("Ver más")

> **Quién es responsable de tus datos:** la residencia.
>
> **Para qué los usamos:** solo para verificar tu identidad en este retiro o alta como referente. No los usamos para otra cosa ni los compartimos con terceros, salvo con el servicio de verificación.
>
> **Qué datos se usan:**
> - número de DNI y sexo, para consultar el RENAPER;
> - una selfie y una prueba de que sos una persona real (sin gestos).
>
> **Quién los procesa:** Didit, un servicio de verificación de identidad. Didit consulta el RENAPER y nos devuelve el resultado.
>
> **Qué se guarda y cuánto tiempo:**
> - la residencia guarda solo el resultado de la verificación, la fecha y quién la inició;
> - pedimos a Didit que borre la verificación apenas registramos el resultado. Si el borrado falla, Didit la elimina sola en un plazo máximo de un mes.
>
> **Tus derechos (Ley 25.326):** podés pedir en la residencia acceder a tus datos, corregirlos o que se eliminen. La Agencia de Acceso a la Información Pública es la autoridad de control y recibe denuncias si creés que no se respetan tus derechos.
>
> **Si no aceptás:** no se hace la verificación con Didit. Un responsable de la residencia compara tu DNI físico con los datos registrados, y queda constancia de que se hizo a mano.

---

## De dónde sale cada afirmación

| Afirmación del texto | Respaldo |
|---|---|
| DNI y sexo para consultar RENAPER | Pantalla de Didit (vista previa del workflow v9) |
| Selfie y prueba de vida sin gestos | D-22 (prueba de vida pasiva) |
| La residencia guarda solo el resultado; no la selfie ni los datos de RENAPER | D-28 (el webhook descarta todo salvo estado, motivo y DNI) |
| Borrado apenas se registra el resultado; máximo un mes | Respuestas aprobadas del 09/10 (RF-10) y retención de 1 mes en Didit (D-23) |
| Alternativa manual si no acepta | D-26 |
