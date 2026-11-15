# Fuentes de datos del panel de Mood (estado a 2026-11-11)

| Fuente | Qué da | Cómo se lee | Estado |
|---|---|---|---|
| **Metricool** (cuenta BX3, marca `mood.helados`, brandId 7359802) | Instagram: seguidores, vistas, alcance, interacciones por día; posts, reels, historias; edad, género, país, ciudad; competidores; hashtags | MCP `mcp__claude_ai_Metricool_*` (`getAnalyticsDataByMetrics`, ids tipo `IGEV05`) | **Funciona.** Solo Instagram. Plan gratuito: 30 días de historial. Capturas en `capturas/ig_diario.json`, `ig_piezas.json` y `documentos.json`. Historias: el conector no devolvió ninguna. Gasto de pauta: vacío (Meta Ads sin conectar) |
| **De un tap D1** `deuntap-toques` | Llegadas NFC/QR/directas por sede, clics por botón, únicos, interacción | `SELECT` vía `wrangler d1 execute --remote` o binding en Pages | `toques`, `visitas_directas`, `clics` funcionan (filas de Mood copiadas en `capturas/deuntap_*.json` para desarrollo local). `unicos`/`interaccion`/`origenes` tienen 2, 5 y 5 filas el 2026-11-11: la medición no está activa de verdad hasta poner `SALT_MEDICION` y desplegar |
| **Google Perfil de Empresa** (3 islas) | Vistas, llamadas, cómo llegar, reseñas | Windsor `google_my_business` con la cuenta de BX3, o export manual | **Hecho 2026-11-11: bx3growthagency@gmail.com es Administrador de las 3 fichas (invitado desde la cuenta de Mood, aceptado; Mood sigue como Propietario principal). Visible en business.google.com con la cuenta de BX3.** **Windsor `google_my_business` conectado y leyendo (2026-11-11), con las 3 fichas, ~22 meses mensual, reseñas y palabras de búsqueda.** Capturas en `capturas/gbp_mensual.json` y `documentos.json`. Lectura mensual, no diaria; ceros previos a la apertura de cada ficha no son datos |
| **Windsor.ai** (plan Free, cuenta BX3) | Puente a Metricool, GBP, Meta Ads | `get_connectors`, `get_data` | **Solo `google_my_business` conectado** (2026-11-11). Metricool no aparece en Windsor; Metricool se lee por su MCP |
| **Meta Ads / Berry win** | Gasto, alcance, resultados | Sin acceso confirmado | Pendiente |
| **Commodo** (Mood Card) | Registros, comportamiento | `aliado.commodo.co` (acceso de Mood) | Sin acceso; solo tenemos clics por isla (`/ir/<sede>/moodcard`) |
| **TikTok / Facebook** | Métricas | Conectar en Metricool | No conectados |
| **Ventas por isla y canal** | North Star | Que Mood las comparta | Sin dato |
| **Notion “Panel BX3”** | Calendario de piezas y estados | `notion-query-data-sources` sobre `collection://6bf80b7e-7be0-42b4-b2ac-05a574b63b00`, filtrando `Cliente` por la página de Mood (`3efda35e4c9581b8999df11d83c745d4`). El modo `sql` funcionó el 2026-11-11; si se agota el cupo, usar `view` | **Desactualizado**: 57 piezas de Mood, ninguna publicada ni con enlace; lo publicado en Instagram es otro contenido. Copia saneada en `capturas/plan.json` |

## Línea base conocida (todas con fuente; ninguna verificada de forma independiente)

| Periodo | Dato | Fuente |
|---|---|---|
| 2026-09-15 | 19.400 seguidores, 415 publicaciones | Perfil de Instagram, `09_METRICS.md` |
| 9 ago–17 sep (40 días, **antes de BX3**) | 785.995 visualizaciones, 89.238 espectadores, 20.196 seguidores (+560 netos), ~11 mil visitas al perfil, ~1,4 mil toques en el enlace; historias 406 mil, reels 222 mil, publicaciones 97 mil | Capturas de Instagram nativo, `Downloads/WhatsApp Image 2026-11-07 at 07.04.*` |
| 18 sep–5 nov (con BX3) | 51 piezas, 286.167 vistas | Resumen de Metricool citado el 06/11 |
| 12 oct–10 nov | 20,21 mil seguidores; engagement posts 4,53 / reels 5,31; 390 mil visualizaciones | Metricool (interfaz), revisado 2026-11-11 |
| 12 oct–10 nov (30 días) | 422.968 vistas (suma diaria IGEV05); seguidores 20.085 (14 oct) → 20.223 (10 nov); 31 piezas en el feed (21 reels, 9 carruseles, 1 imagen) con 5.761 interacciones | Metricool MCP, `capturas/` |

### Discrepancias a resolver antes de mostrar nada

- **390 mil (interfaz) vs 422.968 (MCP)** para un periodo casi igual: son métricas distintas (la interfaz de posts/reels vs «Views» de cuenta que incluye perfil e historias). Elegir una definición y rotularla.
- **19.400 (15 sep) vs 20.196 (17 sep)**: dos fuentes distintas, no cuadran en dos días. No mostrar el delta de seguidores «antes» como fiable.
- **Interacciones por día no existen**: el campo diario de Metricool las atribuye a la fecha de publicación de la pieza. El panel las suma desde las piezas. **Seguidores** viene en 17 de 30 días.
- **Alcance diario no se suma** (personas únicas se repiten).
- Los periodos «antes» y «con BX3» tienen duraciones distintas (40 días vs ~50): hay que normalizar a igual número de días antes de comparar.

## Cosas que cambian con el tiempo (para que el panel no envejezca mal)

- Historias: solo ~24 h de métricas → guardar a diario.
- Metricool gratuito: ventana de 30 días → la foto semanal es lo único que conserva historial.
- Mood está migrando de proveedor de tarjetas (Dardo → Commodo): revisar enlaces antes de publicar.
- Toques de prueba de Buenavista: 8 hasta el 2026-11-11.
