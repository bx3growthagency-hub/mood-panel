// Clave del enlace privado del panel. En acceso.json solo queda el SHA-256,
// así que el enlace se muestra una sola vez.
//
//   node scripts/clave.mjs nueva [base]   → enlace nuevo; el anterior deja de servir
//   node scripts/clave.mjs local          → clave de desarrollo, guardada en .dev.clave
//                                           (fuera de git) para probar en localhost
//
// Después de "nueva" hay que publicar (deploy) para que el enlace funcione.

import { createHash, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const ARCHIVO = new URL("../acceso.json", import.meta.url);
const DEV = new URL("../.dev.clave", import.meta.url);
const [orden, base = "https://mood-panel.pages.dev"] = process.argv.slice(2);

const leer = () => JSON.parse(readFileSync(ARCHIVO, "utf8"));
const guardar = (datos) => writeFileSync(ARCHIVO, JSON.stringify(datos, null, 2) + "\n");
// 32 bytes al azar: 43 caracteres base64url, imposible de adivinar.
const nueva = () => {
  const clave = randomBytes(32).toString("base64url");
  return { clave, huella: createHash("sha256").update(clave).digest("hex") };
};
const hoy = new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);

if (orden === "nueva") {
  const { clave, huella } = nueva();
  const datos = leer();
  datos.produccion = { clave_sha256: huella, desde: hoy };
  guardar(datos);
  console.log("Enlace del panel de Mood (se muestra solo esta vez):\n");
  console.log(`  ${base.replace(/\/$/, "")}/#${clave}\n`);
  console.log("Funciona después de publicar. Mándalo por WhatsApp a quien corresponda; no lo pegues en grupos.");
} else if (orden === "local") {
  const { clave, huella } = nueva();
  const datos = leer();
  datos.desarrollo = { clave_sha256: huella, desde: hoy };
  guardar(datos);
  writeFileSync(DEV, clave + "\n");
  console.log("Clave de desarrollo guardada en .dev.clave (solo sirve en localhost).");
} else {
  console.error("Uso: node scripts/clave.mjs nueva [https://dominio] | local");
  process.exit(1);
}
