// Gráficas del panel en SVG, sin librerías. Reglas (skill dataviz): líneas de
// 2 px, columnas de 24 px como máximo con extremo redondeado, rejilla fina y
// sólida, un solo eje, tooltip con todas las series y tabla equivalente.

import { el, svg, num, compacto } from "./util.js";

const SUPERFICIE = "#f5f0e2";
const REJILLA = "#ddd5bf";

// ---- Tooltip único ---------------------------------------------------------
const tip = () => document.getElementById("tip");
export function mostrarTip(titulo, filas, x, y) {
  const t = tip();
  // replaceChildren no aplana arreglos ni ignora null: se arma la lista completa antes.
  t.replaceChildren(
    ...[
      titulo ? el("div", { class: "tip-titulo", text: titulo }) : null,
      ...filas.map((f) => el("div", { class: "tip-fila" }, f.color ? svgClave(f.color) : null, el("b", { text: f.valor }), el("span", { text: f.nombre }))),
    ].filter(Boolean),
  );
  t.hidden = false;
  const r = t.getBoundingClientRect();
  const izq = Math.min(Math.max(8, x + 14), window.innerWidth - r.width - 8);
  const arriba = y + 18 + r.height > window.innerHeight ? Math.max(8, y - r.height - 12) : y + 18;
  t.style.left = `${izq}px`;
  t.style.top = `${arriba}px`;
}
export function ocultarTip() {
  tip().hidden = true;
}
function svgClave(color) {
  const i = el("i");
  i.style.background = color;
  return i;
}

// ---- Redibujar al cambiar el ancho ----------------------------------------
function observar(caja, dibujar) {
  let ancho = 0;
  new ResizeObserver(() => {
    const w = Math.floor(caja.clientWidth);
    if (w && w !== ancho) {
      ancho = w;
      dibujar(w);
    }
  }).observe(caja);
}

// Tope "redondo" del eje y sus marcas (0 incluido).
function eje(maximo) {
  const bruto = Math.max(1, maximo);
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  // Pasos enteros (son conteos): 1, 2, 5 por la potencia de diez, con 4 tramos como máximo.
  const paso =
    [0.5, 1, 2, 5, 10]
      .map((k) => k * potencia)
      .filter(Number.isInteger)
      .find((p) => bruto / p <= 4) ?? potencia * 10;
  const tope = Math.ceil(bruto / paso) * paso;
  const marcas = [];
  for (let v = 0; v <= tope + 1e-9; v += paso) marcas.push(v);
  return { tope, marcas };
}

function rejilla(g, { marcas, tope }, m, W, H) {
  const y = (v) => m.t + (H - m.t - m.b) * (1 - v / tope);
  const fmt = tope >= 10000 ? compacto : num;
  for (const v of marcas) {
    g.append(
      svg("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: REJILLA, "stroke-width": 1 }),
      svg("text", { x: m.l - 6, y: y(v) + 4, "text-anchor": "end" }, fmt(v)),
    );
  }
  return y;
}

function etiquetasX(g, etiquetas, x, m, W, H) {
  const n = etiquetas.length;
  // El espacio por etiqueta depende de su largo (unos 6,2 px por carácter más aire).
  const largo = Math.max(...etiquetas.map((e) => String(e).length));
  const caben = Math.max(2, Math.floor((W - m.l - m.r) / (largo * 6.2 + 22)));
  const paso = Math.max(1, Math.ceil(n / caben));
  // La última etiqueta se muestra siempre; las que quedarían pegadas a ella se omiten.
  const marcas = [];
  for (let i = 0; i < n - 1; i += paso) if (n - 1 - i >= paso * 0.75) marcas.push(i);
  if (n > 0) marcas.push(n - 1);
  for (const i of marcas)
    g.append(svg("text", { x: x(i), y: H - 8, "text-anchor": i === 0 && n > 1 ? "start" : i === n - 1 && n > 1 ? "end" : "middle" }, etiquetas[i]));
}

export function leyenda(series, forma = "linea") {
  return el(
    "div",
    { class: "leyenda" },
    series.map((s) => {
      const i = el("i", { class: forma === "caja" ? "caja" : null });
      i.style.background = s.color;
      return el("span", {}, i, s.nombre);
    }),
  );
}

// ---- Líneas ----------------------------------------------------------------
// series: [{ nombre, color, valores: (número|null)[] }]; etiquetas del eje X y
// etiquetasLargas para el tooltip.
export function graficaLineas(caja, { series, etiquetas, etiquetasLargas = etiquetas, alto = 230, descripcion, formato = num }) {
  observar(caja, (W) => {
    const H = alto;
    const m = { l: 44, r: 12, t: 12, b: 28 };
    const n = etiquetas.length;
    const escala = eje(Math.max(0, ...series.flatMap((s) => s.valores.filter((v) => v !== null))));
    const g = svg("svg", { class: "grafica", viewBox: `0 0 ${W} ${H}`, height: H, role: "img", "aria-label": descripcion, tabindex: 0 });
    const y = rejilla(g, escala, m, W, H);
    const x = (i) => (n === 1 ? (m.l + W - m.r) / 2 : m.l + (i * (W - m.l - m.r)) / (n - 1));
    etiquetasX(g, etiquetas, x, m, W, H);

    for (const s of series) {
      let d = "";
      let abierto = false;
      s.valores.forEach((v, i) => {
        if (v === null) {
          abierto = false;
          return;
        }
        d += `${abierto ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
        abierto = true;
        // Punto aislado (sin vecinos): se dibuja para que no desaparezca.
        if ((s.valores[i - 1] ?? null) === null && (s.valores[i + 1] ?? null) === null)
          g.append(svg("circle", { cx: x(i), cy: y(v), r: 3, fill: s.color }));
      });
      g.append(svg("path", { d, fill: "none", stroke: s.color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));
      const ultimo = s.valores.findLastIndex((v) => v !== null);
      if (ultimo >= 0)
        g.append(svg("circle", { cx: x(ultimo), cy: y(s.valores[ultimo]), r: 4, fill: s.color, stroke: SUPERFICIE, "stroke-width": 2 }));
    }

    // Capa de lectura: una línea vertical que salta a la fecha más cercana.
    const cursor = svg("line", { y1: m.t, y2: H - m.b, stroke: "#024159", "stroke-width": 1, visibility: "hidden" });
    const puntos = series.map((s) => svg("circle", { r: 4.5, fill: s.color, stroke: SUPERFICIE, "stroke-width": 2, visibility: "hidden" }));
    g.append(cursor, puntos);
    let actual = -1;
    const leer = (i, cx, cy) => {
      actual = Math.min(n - 1, Math.max(0, i));
      cursor.setAttribute("x1", x(actual));
      cursor.setAttribute("x2", x(actual));
      cursor.setAttribute("visibility", "visible");
      series.forEach((s, k) => {
        const v = s.valores[actual];
        puntos[k].setAttribute("visibility", v === null ? "hidden" : "visible");
        if (v !== null) {
          puntos[k].setAttribute("cx", x(actual));
          puntos[k].setAttribute("cy", y(v));
        }
      });
      mostrarTip(
        etiquetasLargas[actual],
        series.map((s) => ({ color: s.color, valor: s.valores[actual] === null ? "Sin dato" : formato(s.valores[actual]), nombre: s.nombre })),
        cx,
        cy,
      );
    };
    const salir = () => {
      cursor.setAttribute("visibility", "hidden");
      puntos.forEach((p) => p.setAttribute("visibility", "hidden"));
      ocultarTip();
    };
    const indiceDe = (e) => {
      const r = g.getBoundingClientRect();
      return n === 1 ? 0 : Math.round(((e.clientX - r.left - m.l) / (W - m.l - m.r)) * (n - 1));
    };
    g.addEventListener("pointermove", (e) => leer(indiceDe(e), e.clientX, e.clientY));
    g.addEventListener("pointerdown", (e) => leer(indiceDe(e), e.clientX, e.clientY));
    g.addEventListener("pointerleave", salir);
    g.addEventListener("blur", salir);
    const porTeclado = (i) => {
      const r = g.getBoundingClientRect();
      leer(i, r.left + x(Math.min(n - 1, Math.max(0, i))), r.top + m.t);
    };
    g.addEventListener("focus", () => porTeclado(actual < 0 ? n - 1 : actual));
    g.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        porTeclado(actual + (e.key === "ArrowLeft" ? -1 : 1));
      }
    });
    caja.replaceChildren(g);
  });
}

// ---- Columnas (apiladas si hay varias series) -------------------------------
export function graficaColumnas(caja, { series, etiquetas, etiquetasLargas = etiquetas, alto = 210, descripcion, total = "Total" }) {
  observar(caja, (W) => {
    const H = alto;
    const m = { l: 34, r: 8, t: 12, b: 28 };
    const n = etiquetas.length;
    const totales = etiquetas.map((_, i) => series.reduce((t, s) => t + (s.valores[i] ?? 0), 0));
    const escala = eje(Math.max(0, ...totales));
    const g = svg("svg", { class: "grafica", viewBox: `0 0 ${W} ${H}`, height: H, role: "img", "aria-label": descripcion, tabindex: 0 });
    const y = rejilla(g, escala, m, W, H);
    const banda = (W - m.l - m.r) / n;
    const ancho = Math.max(2, Math.min(24, banda - 3));
    const x = (i) => m.l + banda * (i + 0.5);
    etiquetasX(g, etiquetas, x, m, W, H);
    const base = y(0);

    const columnas = etiquetas.map((_, i) => {
      const grupo = svg("g");
      let acumulado = 0;
      const partes = series.map((s) => s.valores[i] ?? 0);
      const ultima = partes.findLastIndex((v) => v > 0);
      partes.forEach((v, k) => {
        if (v <= 0) return;
        const y0 = y(acumulado);
        const y1 = y(acumulado + v);
        acumulado += v;
        // 2 px de superficie entre segmentos; el de arriba lleva el extremo redondeado.
        const abajo = k === partes.findIndex((p) => p > 0) ? y0 : y0 - 1;
        const arriba = Math.min(abajo - 1, y1 + (k === ultima ? 0 : 1));
        const r = k === ultima ? Math.min(4, ancho / 2, (abajo - arriba) / 1) : 0;
        const x0 = x(i) - ancho / 2;
        grupo.append(
          svg("path", {
            d: `M${x0} ${abajo}V${arriba + r}Q${x0} ${arriba} ${x0 + r} ${arriba}H${x0 + ancho - r}Q${x0 + ancho} ${arriba} ${x0 + ancho} ${arriba + r}V${abajo}Z`,
            fill: series[k].color,
          }),
        );
      });
      g.append(grupo);
      return grupo;
    });
    g.append(svg("line", { x1: m.l, x2: W - m.r, y1: base, y2: base, stroke: "#8a9aa0", "stroke-width": 1 }));

    let actual = -1;
    const leer = (i, cx, cy) => {
      actual = Math.min(n - 1, Math.max(0, i));
      columnas.forEach((c, k) => c.setAttribute("opacity", k === actual ? 1 : 0.45));
      const filas = series.map((s) => ({ color: s.color, valor: num(s.valores[actual] ?? 0), nombre: s.nombre }));
      if (series.length > 1) filas.push({ valor: num(totales[actual]), nombre: total });
      mostrarTip(etiquetasLargas[actual], filas, cx, cy);
    };
    const salir = () => {
      columnas.forEach((c) => c.setAttribute("opacity", 1));
      ocultarTip();
    };
    const indiceDe = (e) => Math.floor((e.clientX - g.getBoundingClientRect().left - m.l) / banda);
    g.addEventListener("pointermove", (e) => leer(indiceDe(e), e.clientX, e.clientY));
    g.addEventListener("pointerdown", (e) => leer(indiceDe(e), e.clientX, e.clientY));
    g.addEventListener("pointerleave", salir);
    g.addEventListener("blur", salir);
    const porTeclado = (i) => {
      const r = g.getBoundingClientRect();
      leer(i, r.left + x(Math.min(n - 1, Math.max(0, i))), r.top + m.t);
    };
    g.addEventListener("focus", () => porTeclado(actual < 0 ? n - 1 : actual));
    g.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        porTeclado(actual + (e.key === "ArrowLeft" ? -1 : 1));
      }
    });
    caja.replaceChildren(g);
  });
}

// ---- Tabla equivalente -------------------------------------------------------
// filas: arreglos de celdas; null se muestra como "Sin dato".
export function tabla(cabeceras, filas, { abierta = false, resumen = "Ver los datos en tabla" } = {}) {
  const cuerpo = el(
    "div",
    { class: "desborde" },
    el(
      "table",
      {},
      el("thead", {}, el("tr", {}, cabeceras.map((c) => el("th", { scope: "col", text: c })))),
      el(
        "tbody",
        {},
        filas.map((f) =>
          el(
            "tr",
            {},
            f.map((c, i) =>
              c === null || c === undefined
                ? el("td", { class: "sin", text: "Sin dato" })
                : el(i === 0 ? "th" : "td", i === 0 ? { scope: "row", text: c } : { text: typeof c === "number" ? num(c) : c }),
            ),
          ),
        ),
      ),
    ),
  );
  return abierta ? cuerpo : el("details", { class: "tabla" }, el("summary", { text: resumen }), cuerpo);
}
