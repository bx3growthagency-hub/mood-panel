// Verificación visual del panel en local: abre cada pestaña en celular (390 px)
// y en escritorio (1280 px) con el Chrome instalado, guarda las capturas en
// verificacion/ y avisa de errores de consola o de desborde horizontal.
//
//   npm run dev        (en otra terminal)
//   node scripts/capturar.mjs
//
// Usa la clave de desarrollo (.dev.clave), que solo vale en localhost.

import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const BASE = "http://localhost:8791";
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const clave = readFileSync(new URL("../.dev.clave", import.meta.url), "utf8").trim();
const salida = fileURLToPath(new URL("../verificacion/", import.meta.url));
rmSync(salida, { recursive: true, force: true });
mkdirSync(salida, { recursive: true });

const VISTAS = [
  { nombre: "celular", width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { nombre: "escritorio", width: 1280, height: 900, deviceScaleFactor: 1 },
];
const TRAMO = { celular: 1500, escritorio: 1400 };

const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, userDataDir: join(tmpdir(), "mood-panel-verificacion") });
const problemas = [];
try {
  for (const vista of VISTAS) {
    const pagina = await navegador.newPage();
    await pagina.setViewport(vista);
    pagina.on("pageerror", (e) => problemas.push(`${vista.nombre}: error de página: ${e.message}`));
    pagina.on("console", (m) => m.type() === "error" && problemas.push(`${vista.nombre}: consola: ${m.text()}`));
    await pagina.goto(`${BASE}/#${clave}`, { waitUntil: "networkidle0" });
    await pagina.waitForSelector("#pestanas button");
    await pagina.evaluate(() => document.fonts.ready);
    const nombres = await pagina.$$eval("#pestanas button", (bs) => bs.map((b) => b.textContent));
    for (const [i, nombre] of nombres.entries()) {
      await pagina.evaluate((k) => document.querySelectorAll("#pestanas button")[k].click(), i);
      await new Promise((r) => setTimeout(r, 500));
      const medidas = await pagina.evaluate(() => ({ alto: document.documentElement.scrollHeight, ancho: document.documentElement.scrollWidth, visible: innerWidth }));
      if (medidas.ancho > medidas.visible + 1) problemas.push(`${vista.nombre} / ${nombre}: desborde horizontal (${medidas.ancho} > ${medidas.visible})`);
      // El pie se repite en todas las pestañas: se captura solo el contenido de la sección.
      const hasta = await pagina.evaluate((k) => {
        const p = document.getElementById(`panel-${k}`).getBoundingClientRect();
        return Math.ceil(p.bottom + scrollY + 16);
      }, i);
      const slug = `${String(i + 1).padStart(2, "0")}-${nombre.toLowerCase().replaceAll(" ", "-")}`;
      const tramo = TRAMO[vista.nombre];
      for (let y = 0, n = 1; y < hasta; y += tramo, n++) {
        await pagina.screenshot({
          path: join(salida, `${vista.nombre}-${slug}-${n}.png`),
          clip: { x: 0, y, width: vista.width, height: Math.min(tramo, hasta - y) },
          captureBeyondViewport: true,
        });
      }
    }
    await pagina.close();
  }

  // Sin clave y con clave mala: no debe verse nada.
  for (const [nombre, hash] of [["sin-clave", ""], ["clave-mala", "#" + "x".repeat(43)]]) {
    const pagina = await navegador.newPage();
    await pagina.setViewport(VISTAS[0]);
    await pagina.goto(`${BASE}/${hash}`, { waitUntil: "load" });
    await pagina.waitForFunction(() => document.querySelector("main .estado strong"), { timeout: 15000 });
    const texto = await pagina.$eval("main", (m) => m.innerText);
    if (await pagina.$("#pestanas:not([hidden])")) problemas.push(`${nombre}: se muestran las pestañas`);
    console.log(`${nombre}: «${texto.replace(/\s+/g, " ").trim()}»`);
    await pagina.screenshot({ path: join(salida, `celular-00-${nombre}.png`) });
    await pagina.close();
  }
} finally {
  await navegador.close();
}
console.log(problemas.length ? `PROBLEMAS (${problemas.length}):\n- ${problemas.join("\n- ")}` : "Sin errores de consola ni desborde horizontal.");
process.exitCode = problemas.length ? 1 : 0;
