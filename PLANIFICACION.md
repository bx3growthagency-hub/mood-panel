# Módulo de planificación y producción (parte del panel de Mood)

Decidido el 2026-11-11: los $2M incluyen el panel, y entra la planificación de historias, reels, rodajes y carruseles. Este módulo es lo que une «qué se produce» con «qué resultado dio», que es lo que Mood pidió (más engagement, organización, historias con dinámicas, calendario programado).

## Principio: no duplicar la verdad

- **Notion «Panel BX3» → tabla Producción (Calendario de Contenido)** sigue siendo donde el equipo mueve estados. Es la fuente de verdad del avance (regla del repo).
- El panel de Mood muestra una **copia publicada y de solo lectura** de las piezas de Mood. No es una segunda base de trabajo.
- Si en una fase posterior Mood aprueba o comenta desde el panel, eso se guarda en una tabla propia del panel (`aprobaciones`) y BX3 lo pasa a Notion. Nunca edición doble de la misma cosa.

## Cómo llegan los datos

1. Una rutina (la corre Claude con el conector de Notion, o un script) lee la vista de Producción **en modo `view`** (no gasta cupo del plan gratuito) filtrada a Mood. Vista actual: `view://3efda35e-4c95-8108-a789-000ce94fe0b9`. Si cambian sus filtros, cambia lo que se publica.
2. Guarda el resultado en la D1 del panel (`piezas`, `rodajes`, `dinamicas`), con fecha de captura. El panel nunca llama a Notion desde el navegador ni lleva el token de Notion.
3. Cada pieza **publicada** se enlaza con su resultado de Metricool (permalink o fecha+tipo): reels (`IGRE*`), publicaciones y carruseles (`IGPO*`), historias (`IGST*`). Las historias solo dan datos ~24 h: se capturan a diario o se pierden.

## Campos de Producción que existen hoy (verificado 2026-11-11)

`ID`, `Pieza` (título), `Estado` (hoy vimos `SCRIPT` y `ASSET_NEEDED`; **lee el esquema completo** para ver todos los valores), `Resultado`, `Fecha de publicacion`, `Prioridad`, `Link a pieza`, `Cliente`, `Ubicacion` (isla o «Marca»), `Canal` (multi: Instagram…), `Formato` (Reel, Historia, y los demás; comprueba si existe Carrusel), `Encargado`, `Copy` (hook y CTA), `Grabar antes de`, `Asset` (qué rodaje o material hace falta), `Tipo de ubicacion`.

## Lo que ve Mood (y lo que no)

| Se muestra | No se muestra |
|---|---|
| Título de la pieza, formato, canal, isla | `Encargado` (quién del equipo) y `Prioridad` internas |
| Fecha de publicación y «grabar antes de» | Costos, horas, notas internas, margen |
| Estado simplificado (ver abajo) | El texto crudo de errores o dudas del equipo |
| Hook y CTA (para que Mood opine) | Datos personales de terceros |
| Resultado cuando está publicada | Cualquier cosa de contrato, pago o NDA |

**Estados para Mood** (mapea los de Notion; si hay uno sin mapear, se muestra «En preparación», nunca se esconde): Idea · Guion · Por grabar · Rodada · En edición · Para aprobar · Aprobada · Programada · Publicada.

## Vistas del módulo

1. **Calendario del mes**: cuadrícula por día de publicación, color por formato (reel, historia, carrusel, publicación), filtro por isla. Es la pieza principal. Al tocar un día: la ficha de la pieza.
2. **Rodajes**: lista de jornadas por isla y fecha, con las piezas que se graban en cada una y lo que necesita Mood de su lado (producto listo, acceso, permiso del C.C.). Se arma con `Grabar antes de` + `Asset`; si no hay fecha de jornada confirmada, dice «fecha por confirmar», no se inventa.
3. **Historias y dinámicas**: secuencias de historias por semana y las dinámicas con premio: nombre, mecánica, fechas, premio, participaciones, resultado. **Los premios no están definidos** (falta saber de dónde salen): estado «Premio por definir», sin cifras.
4. **Qué funcionó**: las piezas publicadas ordenadas por resultado (vistas, alcance, interacciones, guardados, compartidos), por formato y por isla, con una lectura corta y honesta. Solo compara piezas de igual formato. Si una pieza tuvo pauta, se marca (la pauta distorsiona la comparación).
5. **Cumplimiento**: cuántas piezas del mes están programadas / publicadas / atrasadas frente a lo pactado. Lo pactado se lee del contrato real; **no lo supongas** (la cadencia fue motivo de contraoferta).

## Reglas

- Una pieza sin fecha no aparece en el calendario: va en «Sin fecha», visible.
- «Resultado» vacío es «Sin dato», nunca 0.
- Reels y publicaciones: Metricool da el dato días después de publicar; muestra «medición en curso» los primeros días en vez de cifras bajas.
- **Dinámicas con premio**: antes de publicar la función, hay que verificar con un abogado o con el regulador si las que son por azar (sorteos) necesitan autorización en Colombia. No lo afirmes ni lo descartes tú. Si se registran ganadores, solo lo mínimo, con consentimiento (Ley 1581).
- Rodajes y calendario incluyen horarios y lugares: sin datos de personas de Mood que no sean públicos.

## Fases (ordena el trabajo así)

1. **Base**: Resumen + Instagram + Islas + Google (ver `ENCARGO.md`).
2. **Planificación de solo lectura**: calendario del mes, rodajes y «qué funcionó» (este módulo, sin aprobaciones).
3. **Interacción**: aprobar y comentar piezas, registro de dinámicas con resultado. Solo si Leandro lo pide tras ver la fase 2.

Cada fase termina verificada en Chrome antes de abrir la siguiente.
