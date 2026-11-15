// Abre el panel local en el navegador con la clave de desarrollo (.dev.clave).
// Necesita "npm run dev" corriendo. La clave solo vale en localhost.
import { exec } from "node:child_process";
import { readFileSync } from "node:fs";

const clave = readFileSync(new URL("../.dev.clave", import.meta.url), "utf8").trim();
if (!/^[A-Za-z0-9_-]{40,64}$/.test(clave)) throw new Error("Clave de desarrollo inválida: corre npm run clave -- local");
const url = `http://localhost:8791/#${clave}`;
exec(process.platform === "win32" ? `start "" "${url}"` : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`);
console.log("Abriendo el panel local en el navegador.");
