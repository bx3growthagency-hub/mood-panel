// Sube las capturas de datos/capturas/ a la base del panel (D1 "mood-panel").
//
//   node scripts/cargar.mjs            → base LOCAL (desarrollo)
//   node scripts/cargar.mjs --remoto   → base publicada (solo con visto bueno)
//
// Es idempotente: los días, piezas y meses se actualizan por su clave; el plan,
// las dinámicas y los ajustes se reemplazan enteros. Nunca toca la base de los
// stands de De un tap.

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const remoto = process.argv.includes("--remoto");
const CARPETA = new URL("../datos/capturas/", import.meta.url);
const leer = (nombre) => JSON.parse(readFileSync(new URL(nombre, CARPETA), "utf8"));

const q = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new Error("Número inválido en una captura");
    return String(v);
  }
  return `'${String(v).replaceAll("'", "''")}'`;
};
const fecha = (s, patron = /^\d{4}-\d{2}-\d{2}$/) => {
  if (!patron.test(String(s))) throw new Error(`Fecha inválida: ${s}`);
  return s;
};
const ahora = new Date().toISOString().slice(0, 19) + "Z";
const sql = [];
const registro = (conjunto, fuente, capturado, filas) =>
  sql.push(
    `INSERT INTO capturas (conjunto, fuente, capturado, cargado, filas) VALUES (${q(conjunto)}, ${q(fuente)}, ${q(fecha(capturado))}, ${q(ahora)}, ${filas}) ON CONFLICT(conjunto) DO UPDATE SET fuente=excluded.fuente, capturado=excluded.capturado, cargado=excluded.cargado, filas=excluded.filas;`,
  );

// Instagram por día
{
  const c = leer("ig_diario.json");
  for (const [dia, seguidores, vistas, alcance, ganados, perdidos, cuentas] of c.filas) {
    sql.push(
      `INSERT INTO ig_diario (dia, seguidores, vistas, alcance, ganados, perdidos, cuentas_interactuaron, capturado) VALUES (${q(fecha(dia))}, ${q(seguidores)}, ${q(vistas)}, ${q(alcance)}, ${q(ganados)}, ${q(perdidos)}, ${q(cuentas)}, ${q(c.capturado)}) ON CONFLICT(dia) DO UPDATE SET seguidores=COALESCE(excluded.seguidores, seguidores), vistas=COALESCE(excluded.vistas, vistas), alcance=COALESCE(excluded.alcance, alcance), ganados=COALESCE(excluded.ganados, ganados), perdidos=COALESCE(excluded.perdidos, perdidos), cuentas_interactuaron=COALESCE(excluded.cuentas_interactuaron, cuentas_interactuaron), capturado=excluded.capturado;`,
    );
  }
  registro("ig_diario", c.fuente, c.capturado, c.filas.length);
}

// Instagram por pieza
{
  const c = leer("ig_piezas.json");
  for (const f of c.filas) {
    const [id, tipo, publicado, titulo, ...metricas] = f;
    if (!/^[A-Za-z0-9_-]{5,20}$/.test(id)) throw new Error(`Id de pieza inválido: ${id}`);
    fecha(publicado, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    sql.push(
      `INSERT INTO ig_piezas (id, tipo, publicado, titulo, comentarios, interacciones, likes, alcance, guardados, compartidos, vistas, seguidores_nuevos, reproduccion_media_s, capturado) VALUES (${[id, tipo, publicado, titulo, ...metricas, c.capturado].map(q).join(", ")}) ON CONFLICT(id) DO UPDATE SET tipo=excluded.tipo, publicado=excluded.publicado, titulo=excluded.titulo, comentarios=excluded.comentarios, interacciones=excluded.interacciones, likes=excluded.likes, alcance=excluded.alcance, guardados=excluded.guardados, compartidos=excluded.compartidos, vistas=excluded.vistas, seguidores_nuevos=excluded.seguidores_nuevos, reproduccion_media_s=excluded.reproduccion_media_s, capturado=excluded.capturado;`,
    );
  }
  registro("ig_piezas", c.fuente, c.capturado, c.filas.length);
}

// Google por mes
{
  const c = leer("gbp_mensual.json");
  for (const [isla, mes, impresiones, llamadas, clics, llegar, parcial] of c.filas) {
    fecha(mes, /^\d{4}-\d{2}$/);
    sql.push(
      `INSERT INTO gbp_mensual (isla, mes, impresiones, llamadas, clics_sitio, como_llegar, parcial, capturado) VALUES (${[isla, mes, impresiones, llamadas, clics, llegar, parcial, c.capturado].map(q).join(", ")}) ON CONFLICT(isla, mes) DO UPDATE SET impresiones=excluded.impresiones, llamadas=excluded.llamadas, clics_sitio=excluded.clics_sitio, como_llegar=excluded.como_llegar, parcial=excluded.parcial, capturado=excluded.capturado;`,
    );
  }
  registro("gbp_mensual", c.fuente, c.capturado, c.filas.length);
}

// Plan (se reemplaza entero: es una copia de Notion)
{
  const c = leer("plan.json");
  sql.push("DELETE FROM plan_piezas;");
  for (const [id, formato, isla, publica, grabar, estado, canales, titulo, hook, cta, falta] of c.filas) {
    if (!Number.isInteger(id)) throw new Error("Id de plan inválido");
    if (publica) fecha(publica);
    if (grabar) fecha(grabar);
    sql.push(
      `INSERT INTO plan_piezas (id, formato, isla, publica, grabar, estado, canales, titulo, hook, cta, falta, enlace, capturado) VALUES (${[id, formato, isla, publica, grabar, estado, JSON.stringify(canales), titulo, hook, cta, JSON.stringify(falta), null, c.capturado].map(q).join(", ")});`,
    );
  }
  registro("plan", c.fuente, c.capturado, c.filas.length);
}

// Ajustes y dinámicas (se reemplazan enteros)
{
  const c = leer("ajustes.json");
  sql.push("DELETE FROM ajustes;", "DELETE FROM dinamicas;");
  for (const a of c.filas) {
    sql.push(
      `INSERT INTO ajustes (codigo, origen, dia, hora, cuenta, motivo) VALUES (${[a.codigo, a.origen, fecha(a.dia), a.hora, a.cuenta, a.motivo].map(q).join(", ")});`,
    );
  }
  for (const [i, d] of (c.dinamicas ?? []).entries()) {
    sql.push(
      `INSERT INTO dinamicas (id, nombre, mecanica, desde, hasta, premio, participaciones, resultado, capturado) VALUES (${[i + 1, d.nombre, d.mecanica, d.desde, d.hasta, d.premio, d.participaciones, d.resultado, d.capturado ?? ahora.slice(0, 10)].map(q).join(", ")});`,
    );
  }
}

// Documentos
{
  const c = leer("documentos.json");
  for (const [clave, d] of Object.entries(c.documentos)) {
    sql.push(
      `INSERT INTO documentos (clave, fuente, capturado, json) VALUES (${q(clave)}, ${q(d.fuente)}, ${q(fecha(d.capturado))}, ${q(JSON.stringify(d.json))}) ON CONFLICT(clave) DO UPDATE SET fuente=excluded.fuente, capturado=excluded.capturado, json=excluded.json;`,
    );
    registro(clave, d.fuente, d.capturado, 1);
  }
}

const tmp = new URL("../.tmp/", import.meta.url);
mkdirSync(tmp, { recursive: true });
const archivo = fileURLToPath(new URL("carga.sql", tmp));
writeFileSync(archivo, sql.join("\n") + "\n");

console.log(`${sql.length} sentencias → base ${remoto ? "PUBLICADA (remota)" : "local"} mood-panel`);
// La ruta es fija (carpeta .tmp del proyecto): no entra nada escrito por el usuario.
execSync(`npx wrangler d1 execute mood-panel ${remoto ? "--remote" : "--local"} --file "${archivo}" --yes`, { stdio: ["ignore", "ignore", "inherit"] });
console.log("Carga terminada.");
