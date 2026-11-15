# Encargo: Panel de Mood by BX3

Especificación del panel (2026-11-11). El panel ya está construido en local: el estado, cómo abrirlo y lo pendiente están en `LEEME.md`. Este archivo sigue mandando sobre qué entra, qué no y las reglas de honestidad.

## Qué es y para quién

Un panel web **privado** donde Mood (Adrián, Lau) ve todo lo medible de su marca desde que BX3 la trabaja. Es un entregable de BX3 para un cliente que pasó a pagar $2M y pidió «registrar todas las métricas posibles», «mucha organización» y que BX3 se vea más profesional. Objetivo del cliente: **subir el engagement**.

Dos lectores: Mood (decide con él) y BX3 (se defiende con él). Una sola vista, pensada para Mood. Nada interno de BX3 entra.

## Qué NO entra jamás

Precios, fee, contrato, pagos, el NDA con GetLocallista, notas internas de BX3, margen, nombres de Hurtado/Medrano/Santiago como personal interno, datos personales de clientes finales (Ley 1581). Si dudas de un dato, no va.

## Reglas de honestidad (lo más importante)

1. **Cada cifra lleva fuente y fecha de captura.** Si no hay dato, la tarjeta dice «Sin dato» y qué falta, nunca 0 ni un número de relleno.
2. Los datos demo (`npm run reporte:mood -- --demo`) no se mezclan con reales ni se publican.
3. Conteos de De un tap = eventos, no personas. El panel dice qué es y qué no es (ver aviso de `scripts/reporte-mood.mjs`).
4. Comparar «con BX3» contra «antes» solo con **periodos de igual número de días**. El «antes» existente son capturas del 9 ago–17 sep (40 días) y están sin verificar; márcalas como tales.
5. Clic en «Reseña Google» o «Mood Card» = interés, no reseña publicada ni registro completado.
6. Los 8 toques de prueba de `mood-buenavista-nfc` se descuentan o se marcan.

## Secciones del panel (en este orden)

1. **Resumen**: seguidores, vistas, alcance, interacciones, y el antes/después con la advertencia de periodos.
2. **Instagram**: evolución diaria, reels vs publicaciones vs historias, top piezas del periodo, mejores horas/días, audiencia (edad, género, país, ciudad).
3. **Islas y stands (De un tap)**: por sede (Buenavista 2, Le Meridiem, Parque Alegra): llegadas NFC/QR/directas, clics por botón (Reseña, Mood Card, Menú, Instagram), únicos e interacción cuando exista la sal (ver FUENTES).
4. **Google, Perfil de Empresa (3 islas)**: vistas, llamadas, cómo llegar, reseñas. **Estado 2026-11-11**: BX3 ya es Administrador de las 3 fichas. Windsor `google_my_business` ya lee las 3 fichas: datos reales en `datos/capturas/gbp_mensual.json` y `datos/capturas/documentos.json` (impresiones, cómo llegar, llamadas, clics al sitio, reseñas y palabras de búsqueda, mensual desde 2025-07). Reglas: ceros previos a la apertura de la ficha = «sin dato», nunca 0; noviembre es parcial; las búsquedas genéricas bajo 15 se muestran como «<15». Si Google guarda historial, úsalo como parte del «antes».
5. **Planificación y producción**: calendario del mes (reels, historias, carruseles y publicaciones), rodajes por isla, dinámicas de historias con premios, y «qué funcionó» enlazado a Metricool. Es solo lectura primero. **Especificación completa en `PLANIFICACION.md`** (léela: manda sobre lo que aquí se resuma). Premios sin definir: estructura lista, sin cifras.
6. **Mood Card / Commodo**: clics al enlace de actualización por isla (los tenemos); registros solo si Commodo da el dato.
7. **Campañas**: «Berry win» y pauta de Meta cuando haya datos de campaña; hoy pendiente.
8. **TikTok**: pendiente de conexión; tarjeta honesta.
9. **Ventas por isla y canal (North Star)**: Mood tiene que compartirlas. Dejar un formulario simple de captura semanal (isla, canal Rappi/DiDi/local, monto) con fecha y quién lo cargó. Sin datos no se inventa.

## Arquitectura recomendada (ya decidida; si ves algo mejor, dilo antes de cambiar)

- **Proyecto propio de Cloudflare Pages `mood-panel`**, no dentro de `deuntap`. Razones y detalle en `DECISION_HOSTING.md`.
- Sitio estático (Next export o HTML + JS, lo que sea más simple de mantener) + Functions para leer **D1 `deuntap-toques`** con binding de solo lectura (`SELECT` únicamente) y para guardar las **fotos diarias** de Instagram.
- **Instantáneas**: Metricool gratuito solo da 30 días y las historias solo ~24 h. Se guarda una foto diaria/semanal de las métricas en una tabla propia (`snapshots_ig`, base D1 **nueva** `mood-panel`, no la de los stands). El panel lee de ahí. El script de captura lo corre Claude con el MCP de Metricool (ya probado: ver `datos/capturas/ig_diario.json`) o un export manual de Leandro.
- **Acceso**: enlace privado `…/#<clave>` con SHA-256 guardado, igual que `lib/panel-api.ts` de `bx3-nfc-resenas` (clave por Authorization, nunca en la URL, `noindex`, `no-store`). Mismo patrón; reúsalo copiando, no importando entre proyectos.
- **Estilo**: marca Mood, no De un tap. Crema `#E9E2CF`, azul `#809EB9`, tinta `#024159`, coral `#F36363`; Bebas Neue (títulos) + Manrope (texto), como `mood-web/css/style.css`. Móvil primero: Adrián y Lau lo abren en el celular. Gráficas legibles, sin adornos; usa los skills `dataviz` y `impeccable`.
- Dominio: primero `*.pages.dev`. Dominio propio después, decide Leandro.

## No tocar

- `bx3-nfc-resenas` tiene cambios sin commit (`/pedir`, `app/mood/medir-visita.tsx`, etc.). **No hagas commit ni deploy desde ahí.** Lo que necesites, cópialo.
- No ejecutes migraciones en `deuntap-toques`. Si hace falta una columna o tabla ahí, pídeselo a Leandro con el SQL.
- No cambies la ruta crítica de los stands (`/t`, `/q`, `/ir`, `/mood`): ahí toca clientes reales.
- No publiques a Internet ni mandes enlaces a Mood sin el visto bueno de Leandro.
- No generes voz ni imágenes con IA para esto.

## Criterios de «terminado»

- Abre sin errores en celular (390 px) y escritorio, en claro; contraste AA.
- Con la clave correcta muestra datos reales de la última foto; sin clave o con clave mala, 401 y nada visible.
- Cada tarjeta muestra fuente y fecha; las pendientes dicen qué falta.
- Hay un `LEEME.md` con: cómo tomar la foto diaria, cómo renovar la clave, cómo desplegar, y la lista de pendientes.
- Probado en el navegador de verdad (Chrome), con capturas en `verificacion/`. Si algo no se pudo ver, se dice.
- Al final: reporte corto de qué quedó, qué no, y qué necesita Leandro (ver abajo).

## Lo que Leandro debe resolver (el panel no puede avanzar sin esto)

| Pendiente | Bloquea |
|---|---|
| `wrangler pages secret put SALT_MEDICION --project-name deuntap` + deploy desde `_deploy_deuntap_limpio` | Únicos e interacción por sede |
| Regrabar chips de Meridiem y Alegra (`mood-meridiem-nfc`, `mood-alegra-nfc`) | NFC real en esas dos islas (Buenavista ya) |
| Conectar Facebook y TikTok en Metricool | Secciones TikTok y más métricas |
| Que Mood comparta ventas por isla y canal | North Star |
| ~~Confirmar si los $2M incluyen el panel~~ Confirmado por Leandro el 2026-11-11: incluye el panel y la planificación. Falta registrarlo en el Decision Register | Nada |
| Datos de Commodo (registros) y condiciones de los «Commodos» | Sección Mood Card más allá de clics |
| Plan de pago de Metricool (historial y comparar meses) | Comparativas largas; decide Leandro |
