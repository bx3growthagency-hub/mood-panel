// SOLO DESARROLLO LOCAL. Siembra una copia local de las tablas de los stands
// con las filas de Mood capturadas en datos/capturas/deuntap_*.json, para
// poder abrir el panel en localhost. En producción el panel lee la base real
// de De un tap por el binding TOQUES; este script nunca la toca: "--local"
// está escrito fijo y no hay forma de pasarle "--remote".

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CARPETA = new URL("../datos/capturas/", import.meta.url);
const leer = (nombre) => JSON.parse(readFileSync(new URL(nombre, CARPETA), "utf8"));
const texto = (s) => {
  if (!/^[a-z0-9-]{1,40}$/.test(String(s))) throw new Error(`Valor inválido: ${s}`);
  return `'${s}'`;
};
const dia = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) throw new Error(`Día inválido: ${s}`);
  return `'${s}'`;
};
const entero = (n) => {
  if (!Number.isInteger(n) || n < 0) throw new Error("Conteo inválido");
  return n;
};

const sql = [readFileSync(new URL("../local/toques_esquema.sql", import.meta.url), "utf8")];
for (const f of leer("deuntap_toques.json"))
  sql.push(`INSERT INTO toques VALUES (${texto(f.codigo)}, ${texto(f.origen)}, ${dia(f.dia)}, ${entero(f.hora)}, ${entero(f.cuenta)});`);
for (const f of leer("deuntap_visitas_directas.json"))
  sql.push(`INSERT INTO visitas_directas VALUES (${texto(f.codigo)}, ${dia(f.dia)}, ${entero(f.hora)}, ${entero(f.cuenta)});`);
for (const f of leer("deuntap_clics.json"))
  sql.push(`INSERT INTO clics VALUES (${texto(f.codigo)}, ${texto(f.destino)}, ${dia(f.dia)}, ${entero(f.hora)}, ${entero(f.cuenta)});`);

const tmp = new URL("../.tmp/", import.meta.url);
mkdirSync(tmp, { recursive: true });
const archivo = fileURLToPath(new URL("toques-local.sql", tmp));
writeFileSync(archivo, sql.join("\n") + "\n");
execSync(`npx wrangler d1 execute deuntap-toques --local --file "${archivo}" --yes`, { stdio: ["ignore", "ignore", "inherit"] });
console.log("Copia local de los stands lista (solo desarrollo).");
