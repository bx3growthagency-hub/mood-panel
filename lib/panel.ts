// GET /api/panel: todos los datos del panel de Mood en un solo JSON.
//
// Se entra con el enlace privado <dominio>/#<clave>. El navegador manda la
// clave en Authorization (nunca en la URL, así no queda en registros) y aquí
// se compara su SHA-256 con acceso.json. La clave no se guarda en ningún lado.
//
// Solo lectura. De la base de De un tap (TOQUES) únicamente se hace SELECT.

import acceso from "../acceso.json";

type Sentencia = { bind(...valores: unknown[]): Sentencia; all<T>(): Promise<{ results: T[] }> };
type D1 = { prepare(sql: string): Sentencia; batch<T>(sentencias: Sentencia[]): Promise<{ results: T[] }[]> };
export type Contexto = { request: Request; env: { PANEL?: D1; TOQUES?: D1 } };

// Códigos de los stands de Mood en De un tap y la isla a la que pertenecen.
// "mood" es la página general, sin isla.
export const CODIGOS: Record<string, string | null> = {
  "mood-meridiem": "Le Meridiem",
  "mood-buenavista": "Buenavista 2",
  "mood-buenavista-nfc": "Buenavista 2",
  "mood-alegra": "Parque Alegra",
  mood: null,
};
const DIAS_STANDS = 90;

const CABECERAS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};
const json = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status, headers: CABECERAS });

async function sha256(texto: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Comparación que no depende de en qué carácter difieren las huellas.
function iguales(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

const esLocal = (host: string) => host === "localhost" || host === "127.0.0.1" || host === "[::1]";

async function autorizado(request: Request) {
  const clave = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{40,64})$/)?.[1];
  if (!clave) return false;
  const huella = await sha256(clave);
  const { produccion, desarrollo } = acceso as {
    produccion: { clave_sha256: string } | null;
    desarrollo: { clave_sha256: string } | null;
  };
  if (produccion && iguales(huella, produccion.clave_sha256)) return true;
  // La clave de desarrollo solo vale en localhost: no abre el panel publicado.
  return Boolean(desarrollo && esLocal(new URL(request.url).hostname) && iguales(huella, desarrollo.clave_sha256));
}

export async function manejarPanel({ request, env }: Contexto): Promise<Response> {
  if (request.method !== "GET") return json({ error: "método" }, 405);
  if (!(await autorizado(request))) return json({ error: "enlace" }, 401);
  if (!env.PANEL) return json({ error: "datos" }, 503);

  const hoy = new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10); // Colombia, UTC−5
  const p = env.PANEL;
  const [diario, piezas, google, plan, dinamicas, ajustes, documentos, capturas] = await p.batch<Record<string, unknown>>([
    p.prepare("SELECT dia, seguidores, vistas, alcance, ganados, perdidos, cuentas_interactuaron FROM ig_diario ORDER BY dia"),
    p.prepare(
      "SELECT id, tipo, publicado, titulo, comentarios, interacciones, likes, alcance, guardados, compartidos, vistas, seguidores_nuevos, reproduccion_media_s, capturado FROM ig_piezas ORDER BY publicado DESC",
    ),
    p.prepare("SELECT isla, mes, impresiones, llamadas, clics_sitio, como_llegar, parcial FROM gbp_mensual ORDER BY mes, isla"),
    p.prepare("SELECT id, formato, isla, publica, grabar, estado, canales, titulo, hook, cta, falta, enlace FROM plan_piezas ORDER BY publica, id"),
    p.prepare("SELECT id, nombre, mecanica, desde, hasta, premio, participaciones, resultado FROM dinamicas ORDER BY desde"),
    p.prepare("SELECT codigo, origen, dia, hora, cuenta, motivo FROM ajustes ORDER BY dia, hora"),
    p.prepare("SELECT clave, fuente, capturado, json FROM documentos"),
    p.prepare("SELECT conjunto, fuente, capturado FROM capturas ORDER BY conjunto"),
  ]);

  // Stands: si la base de De un tap no responde, el panel sigue y lo dice.
  let stands: Record<string, unknown> = { disponible: false };
  if (env.TOQUES) {
    try {
      const t = env.TOQUES;
      const codigos = Object.keys(CODIGOS);
      const marcas = codigos.map((_, i) => `?${i + 2}`).join(", ");
      const desde = new Date(Date.parse(hoy) - (DIAS_STANDS - 1) * 86400 * 1000).toISOString().slice(0, 10);
      const [toques, directas, clics] = await t.batch<Record<string, unknown>>([
        t.prepare(`SELECT codigo, origen, dia, hora, cuenta FROM toques WHERE dia >= ?1 AND codigo IN (${marcas}) ORDER BY dia, hora`).bind(desde, ...codigos),
        t.prepare(`SELECT codigo, dia, hora, cuenta FROM visitas_directas WHERE dia >= ?1 AND codigo IN (${marcas}) ORDER BY dia, hora`).bind(desde, ...codigos),
        t.prepare(`SELECT codigo, destino, dia, hora, cuenta FROM clics WHERE dia >= ?1 AND codigo IN (${marcas}) ORDER BY dia, hora`).bind(desde, ...codigos),
      ]);
      stands = { disponible: true, desde, toques: toques.results, directas: directas.results, clics: clics.results };
    } catch {
      stands = { disponible: false };
    }
  }

  const docs: Record<string, unknown> = {};
  for (const d of documentos.results) {
    docs[String(d.clave)] = { fuente: d.fuente, capturado: d.capturado, datos: JSON.parse(String(d.json)) };
  }

  return json({
    hoy,
    codigos: CODIGOS,
    ig: { diario: diario.results, piezas: piezas.results },
    google: { mensual: google.results },
    plan: {
      piezas: plan.results.map((f) => ({ ...f, canales: JSON.parse(String(f.canales)), falta: JSON.parse(String(f.falta)) })),
      dinamicas: dinamicas.results,
    },
    stands: { ...stands, ajustes: ajustes.results },
    documentos: docs,
    capturas: capturas.results,
  });
}
