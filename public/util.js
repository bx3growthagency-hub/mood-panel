// Utilidades del panel: crear elementos sin innerHTML, fechas y números.

const SVG_NS = "http://www.w3.org/2000/svg";

function aplicar(e, props, hijos) {
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") e.setAttribute("class", v);
    else if (k === "text") e.textContent = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const h of hijos.flat(Infinity)) {
    if (h === null || h === undefined || h === false) continue;
    e.append(h.nodeType ? h : document.createTextNode(String(h)));
  }
  return e;
}
// Todo el texto entra con textContent o nodos de texto: nunca como HTML.
export const el = (etiqueta, props, ...hijos) => aplicar(document.createElement(etiqueta), props, hijos);
export const svg = (etiqueta, props, ...hijos) => aplicar(document.createElementNS(SVG_NS, etiqueta), props, hijos);

const nf = new Intl.NumberFormat("es-CO");
export const num = (n) => (n === null || n === undefined ? "Sin dato" : nf.format(Math.round(n)));
export const dec = (n, d = 1) =>
  n === null || n === undefined ? "Sin dato" : n.toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d });
export const compacto = (n) => {
  if (n === null || n === undefined) return "Sin dato";
  if (n >= 1e6) return `${(n / 1e6).toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;
  if (n >= 10000) return `${(n / 1000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} mil`;
  return num(n);
};
export const signo = (n) => (n > 0 ? `+${num(n)}` : num(n));

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const partes = (s) => s.slice(0, 10).split("-").map(Number);
export const fechaCorta = (s) => {
  const [, m, d] = partes(s);
  return `${d} ${MESES[m - 1]}`;
};
export const fechaLarga = (s) => {
  const [a, m, d] = partes(s);
  return `${d} de ${MESES_L[m - 1]} de ${a}`;
};
export const fechaConDia = (s) => {
  const [a, m, d] = partes(s);
  return `${DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]} ${d} de ${MESES_L[m - 1]}`;
};
export const mesCorto = (s) => {
  const [a, m] = s.split("-").map(Number);
  return `${MESES[m - 1]} ${a}`;
};
export const mesNombre = (s) => MESES_L[Number(s.split("-")[1]) - 1];
export const mesLargo = (s) => {
  const [a, m] = s.split("-").map(Number);
  return `${MESES_L[m - 1]} de ${a}`;
};
export const sumarDias = (s, n) => {
  const [a, m, d] = partes(s);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
};
export const diasEntre = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
export const rangoDias = (desde, hasta) => {
  const dias = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) dias.push(d);
  return dias;
};

export const suma = (xs) => xs.reduce((t, x) => t + (x ?? 0), 0);
export const mediana = (xs) => {
  const v = xs.filter((x) => x !== null && x !== undefined).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
export const plural = (n, uno, varios) => `${num(n)} ${n === 1 ? uno : varios}`;
