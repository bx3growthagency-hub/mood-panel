# Panel de Mood by BX3

Panel web privado donde Mood ve lo medible de su marca. Especificación en `ENCARGO.md`, `PLANIFICACION.md` y `DECISION_HOSTING.md`; estado de cada fuente en `datos/FUENTES.md`.

## Estado (2026-11-11)

**Construido y verificado en local. No está publicado**: no existe el proyecto en Cloudflare ni la base remota, y Mood no ha recibido ningún enlace. Publicar necesita el visto bueno de Leandro.

Hecho:

- Pestañas **Resumen, Instagram, Islas, Google, Plan y Por conectar**, con datos reales capturados el 2026-11-11.
- Acceso por enlace privado con clave (solo se guarda su SHA-256). Sin clave o con clave mala responde 401 y no muestra nada.
- Verificado en Chrome a 390 px y 1280 px: sin errores de consola ni desborde horizontal. Capturas en `verificacion/`.

No hecho (a propósito):

- **Formulario de ventas por isla y canal**: queda como tarjeta «Sin dato». Un punto de escritura abierto con un enlace compartido merece decisión aparte.
- **Fase 3** (que Mood apruebe o comente piezas): solo si Leandro la pide.
- **Historias, pauta, TikTok, personas únicas**: sin fuente todavía; salen como «Sin dato».

## Abrirlo en este computador

```
npm install
npm run clave -- local     # solo la primera vez: crea la clave de desarrollo
npm run local:preparar     # crea las bases locales y carga las capturas
npm run dev                # deja el servidor en http://localhost:8791
npm run abrir              # en otra terminal: abre el panel con la clave
npm run verificar          # capturas de celular y escritorio en verificacion/
```

La clave de desarrollo vive en `.dev.clave` (fuera de git) y solo vale en `localhost`.

Recién clonado desde GitHub funciona con esos mismos pasos: solo hace falta Node 20 o superior. No se necesita cuenta de Cloudflare para trabajar en local, porque las bases se arman en el propio computador con las capturas de `datos/capturas/`. Cada persona crea su propia clave de desarrollo.

## Cómo está armado

| Parte | Dónde | Qué hace |
|---|---|---|
| Página | `public/` | HTML, CSS y JS sin framework. `app.js` arma las secciones, `plan.js` el plan, `graficas.js` las gráficas en SVG |
| API | `lib/panel.ts`, `functions/api/panel.ts` | `GET /api/panel`: valida la clave y devuelve todo en un JSON |
| Base propia | `migrations/` (D1 `mood-panel`) | Capturas de Instagram, Google y plan, con fecha y fuente |
| Stands | binding `TOQUES` (D1 `deuntap-toques`) | **Solo SELECT.** El panel lee los conteos de las islas en vivo |
| Capturas | `datos/capturas/*.json` | La fuente de lo que se carga; cada archivo trae su fuente y su fecha |

En local, los conteos de los stands salen de una copia (`scripts/toques-local.mjs`); publicado, de la base real.

## Actualizar los datos («tomar la foto»)

Los datos de Instagram, Google y el plan no son en vivo. Para actualizarlos, pedirle a Claude en esta carpeta: **«toma la foto del panel de Mood»**. Lo que hace:

1. **Instagram** (conector de Metricool, marca `mood.helados`, brandId 7359802): por día `IGEV01, IGEV05, IGEV06, IGEV43, IGEV44, IGEV42`; reels `IGRE02, 03, 06, 07, 09, 10, 11, 12, 21, 23, 24`; publicaciones `IGPO02, 03, 06, 07, 08, 12, 13, 14, 15, 27, 28, 29`; audiencia `IGAG*` e `IGDC*`. Escribe `ig_diario.json`, `ig_piezas.json` y `documentos.json`.
2. **Google** (conector de Windsor, `google_my_business`): mensual por isla, reseñas y palabras de búsqueda. Escribe `gbp_mensual.json` y `documentos.json`.
3. **Plan** (Notion, Calendario de Contenido, cliente Mood): escribe `plan.json` **saneado**: sin encargado, prioridad ni notas internas; solo título, formato, isla, fechas, estado, gancho, cierre y lo que falta de Mood.
4. `npm run cargar` (local) o `node scripts/cargar.mjs --remoto` (publicado, con visto bueno).

Cada cuánto: Instagram **una vez por semana como mínimo** (la herramienta solo conserva 30 días; lo que no se capture se pierde). Google, una vez al mes. El plan, cuando cambie Notion. Las historias necesitan captura diaria y todavía no tienen vía.

`ajustes.json` guarda los toques de prueba que se descuentan (con motivo visible en el panel) y las dinámicas con premio.

## Renovar el enlace

`npm run clave -- nueva https://<dominio>` imprime el enlace nuevo una sola vez y deja inservible el anterior. Hay que volver a publicar para que rija.

## Publicar (cuando Leandro lo apruebe)

1. `npx wrangler d1 create mood-panel` y poner el `database_id` en `wrangler.toml`.
2. `npx wrangler d1 migrations apply mood-panel --remote`.
3. `node scripts/cargar.mjs --remoto`.
4. `npm run clave -- nueva https://mood-panel.pages.dev`.
5. `npx wrangler pages project create mood-panel` (una vez) y `npx wrangler pages deploy --branch main`.
6. Abrir el enlace, comprobar las seis pestañas y que sin clave responda 401.

Nunca correr `d1 migrations apply deuntap-toques` desde aquí. `wrangler.toml` apunta esa base a una carpeta de migraciones vacía como seguro.

## Lo que Leandro debe saber antes de mostrárselo a Mood

1. **El plan de Notion está desactualizado.** Las 57 piezas de Mood están en guion o pendientes de material, ninguna figura publicada ni tiene enlace, y lo que salió en Instagram es otro contenido (3x2, Navidad, Alpimood). El panel lo resuelve mostrando lo publicado desde Instagram y lo planeado solo de hoy en adelante, pero **la pestaña Plan no debería ir a Mood hasta poner Notion al día** (estados y `Link a pieza`). Con el enlace cargado, el panel puede unir cada pieza con su resultado.
2. **Antes y después de BX3: por día, hoy da menos vistas.** Antes: 785.995 vistas en 40 días (unas 19.650 al día, capturas de Instagram sin verificar). Con BX3: 422.968 en 30 días (unas 14.100 al día, Metricool). Son fuentes y duraciones distintas, y el panel dice que todavía no se comparan, pero muestra los dos bloques. Decidir si esa tarjeta va, o esperar a tener 40 días medidos igual.
3. **La pestaña Plan muestra «Falta que Mood confirme»** en cada pieza (lo que en Notion está como `[FALTA: …]`). Es útil para destrabar producción; revisar que el tono sea el que se quiere frente al cliente.
4. **Pauta sin dato.** No se sabe qué piezas tuvieron pauta. El carrusel del 2 de noviembre (30.882 vistas, 26 seguidores nuevos) destaca mucho sobre el resto; si tuvo pauta, la comparación entre formatos cambia.
5. **Chips.** Solo Buenavista 2 cuenta NFC. El panel explica que en Le Meridiem y Parque Alegra el chip abre la reseña directo y por eso aparece en cero.
6. **Toques de prueba.** Se descontaron los 8 del 11 de noviembre a las 14 h en `mood-buenavista-nfc`. Hay 2 más ese día a las 16 h sin clasificar: se cuentan como reales.
7. **Dinámicas con premio.** Antes de lanzarlas, confirmar con un abogado si las de azar necesitan autorización en Colombia. No está verificado.

## Pendientes que desbloquean secciones

| Pendiente | Desbloquea |
|---|---|
| Poner al día Notion (estados y enlace de cada pieza) | Pestaña Plan fiable y «resultado por pieza» |
| Vía para capturar historias a diario | Historias y dinámicas |
| Conectar Meta Ads | Pauta, campañas, comparación limpia entre formatos |
| Conectar TikTok y Facebook en Metricool | TikTok |
| `SALT_MEDICION` y despliegue de De un tap | Personas únicas en los stands |
| Regrabar chips de Le Meridiem y Parque Alegra | NFC real en esas islas |
| Que Mood comparta ventas por isla y canal | La medida principal |
| Registrar la meta pactada del mes | «Avance del mes» contra lo pactado |
| Datos de registros de la Mood Card (Commodo) | Mood Card más allá de clics |

## Reglas que no se negocian

- Cada cifra con fuente y fecha. Sin dato se dice «Sin dato», nunca 0.
- Al panel no entran precios, contrato, pagos, notas internas ni nombres del equipo.
- No tocar `bx3-nfc-resenas` ni migrar `deuntap-toques` desde aquí.
- No publicar ni mandar enlaces a Mood sin el visto bueno de Leandro.
