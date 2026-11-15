# ¿Alojar el panel de Mood dentro de De un tap?

**Recomendación: no dentro, sí al lado.** Proyecto propio `mood-panel` en la misma cuenta de Cloudflare, leyendo la base de De un tap en solo lectura.

## Por qué no dentro de `deuntap`

1. **Riesgo para clientes reales.** `deuntap` sirve `/t`, `/q`, `/ir` y `/mood`: la ruta de los toques de los stands. Un deploy del panel de Mood comparte releases con eso; un error ahí rompería chips ya entregados.
2. **El repo está sucio.** `bx3-nfc-resenas` tiene cambios sin commit de `/pedir` y de medición. Ya se tuvo que desplegar desde una copia limpia (`_deploy_deuntap_limpio`). Meter el panel ahí multiplica ese problema.
3. **Marca y producto.** De un tap es un producto que BX3 vende a otros negocios. El panel de Mood trae Instagram, calendario, campañas y ventas, que no son de De un tap. Mood debe ver «Mood by BX3», no un subsitio de otro producto.
4. **Datos de Mood mezclados con un sitio público.** Más superficie de fuga y más difícil de auditar.

## Qué sí se reutiliza de De un tap

- Cuenta de Cloudflare y Pages (ya existe, gratis).
- La base D1 `deuntap-toques` (database_id `6181a17a-e9cb-426f-b927-92a68d0ae171`) con **binding en el proyecto nuevo**, solo `SELECT`. Tablas: `toques`, `visitas_directas`, `clics`, `unicos`, `interaccion`, `origenes`.
- El patrón de acceso por enlace privado con SHA-256 (`lib/panel-api.ts`), copiado.
- Las consultas de `scripts/reporte-mood.mjs`.

## Contras de la opción separada (honestos)

- Dos proyectos que mantener (poco: es estático + 2–3 Functions).
- Dos bindings a la misma D1: si Leandro cambia el esquema de los stands, el panel se entera tarde. Mitigación: el panel solo lee `toques`, `visitas_directas`, `clics`, `unicos`.
- Cloudflare se bloquea desde España en días de partido (afecta la vista de Leandro en España, no a Mood en Colombia). Para revisar entonces, usar otra red.

## Dominio

Primero `mood-panel.pages.dev` con enlace privado. Más adelante, subdominio de un dominio de BX3 (`bx3agency.com` cuando se registre). No usar `moodcol.com`: es de Mood y está dedicado a su web y correo.

## Si Leandro igual prefiere dentro de De un tap

Sería viable como ruta `/panel/mood` reutilizando casi todo, pero solo después de limpiar el repo (commit o descartar lo de `/pedir`) y con el panel en una carpeta aislada. Costo: menos trabajo hoy, más riesgo mañana.
