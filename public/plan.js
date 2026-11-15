// Sección Plan: calendario del mes, próximas piezas, rodajes, dinámicas y
// cumplimiento. Solo lectura (ver PLANIFICACION.md).
//
// Dos fuentes que NO se cruzan mientras Notion no tenga el enlace de cada
// pieza: lo publicado sale de Instagram; lo planeado, de Notion, y solo de hoy
// en adelante. Lo planeado con fecha pasada va aparte, plegado.

import { el, num, fechaCorta, fechaConDia, fechaLarga, mesLargo, plural } from "./util.js";

const ESTADOS = {
  IDEA: "Idea",
  STRATEGY_APPROVED: "Idea",
  SCRIPT: "Guion",
  ASSET_NEEDED: "Pendiente de material",
  PRODUCTION: "En rodaje",
  EDITING: "En edición",
  INTERNAL_REVIEW: "En revisión",
  CLIENT_APPROVAL: "Para aprobar",
  SCHEDULED: "Programada",
  PUBLISHED: "Publicada",
};
// Un estado que no esté en la lista se muestra, nunca se esconde.
const estadoDe = (e) => ESTADOS[e] ?? "En preparación";
const LETRA = { reel: "R", carrusel: "C", imagen: "I", Reel: "R", Carrusel: "C", Historia: "H", "Post estatico": "I", Video: "V" };
const letra = (f) => LETRA[f] ?? "·";
const FORMATO = { Reel: "Reel", Historia: "Historias", Carrusel: "Carrusel", "Post estatico": "Imagen" };

export function seccionPlan(p, { tarjeta, pendiente, cabecera, fuente, TIPO }) {
  const hoy = p.hoy;
  const publicadas = p.piezas;
  const futuras = p.plan.piezas.filter((x) => x.publica && x.publica >= hoy);
  const pasadas = p.plan.piezas.filter((x) => x.publica && x.publica < hoy && x.estado !== "PUBLISHED");
  const sinFecha = p.plan.piezas.filter((x) => !x.publica);
  const enlazadas = p.plan.piezas.filter((x) => x.enlace).length;
  const islas = [...new Set(p.plan.piezas.map((x) => x.isla).filter(Boolean))].sort();

  const meses = [...new Set([...publicadas.map((x) => x.dia.slice(0, 7)), ...futuras.map((x) => x.publica.slice(0, 7)), hoy.slice(0, 7)])].sort();
  let mes = hoy.slice(0, 7);
  let dia = hoy;
  let isla = "todas";
  const filtro = (x) => isla === "todas" || x.isla === isla;

  // ---- Fichas ---------------------------------------------------------------
  const fichaPublicada = (x) =>
    el(
      "article",
      { class: "ficha" },
      el("div", { class: "linea-1" }, el("span", { class: "chip lleno", text: "Publicada" }), el("span", { class: "chip", text: TIPO[x.tipo] })),
      el("h4", {}, el("a", { href: x.url, target: "_blank", rel: "noopener noreferrer", text: x.titulo })),
      el("p", { class: "meta", text: x.enMedicion ? "Medición en curso: Instagram todavía la está mostrando." : `${num(x.vistas)} vistas · ${num(x.alcance)} personas · ${num(x.interacciones)} interacciones` }),
    );
  const fichaPlan = (x, conFecha = false) =>
    el(
      "article",
      { class: "ficha" },
      el("div", { class: "linea-1" }, el("span", { class: "chip", text: estadoDe(x.estado) }), el("span", { class: "chip", text: FORMATO[x.formato] ?? x.formato }), x.canales.includes("TikTok") ? el("span", { class: "chip", text: "También TikTok" }) : null),
      el("h4", { text: x.titulo }),
      el("p", { class: "meta", text: [conFecha ? fechaConDia(x.publica) : null, x.isla === "Marca" ? "Toda la marca" : x.isla].filter(Boolean).join(" · ") }),
      x.hook ? el("blockquote", {}, x.hook, x.cta ? el("p", { class: "meta", text: `Cierre: ${x.cta}` }) : null) : null,
      x.falta.length ? el("div", { class: "falta" }, el("b", { text: "Falta que Mood confirme" }), el("ul", {}, x.falta.map((f) => el("li", { text: f })))) : null,
    );

  // ---- Calendario -----------------------------------------------------------
  const titulo = el("h3");
  const rejilla = el("div", { class: "cal" });
  const detalle = el("div");
  const detalleTitulo = el("h3");
  const anterior = el("button", { class: "boton", type: "button", "aria-label": "Mes anterior", text: "‹", onclick: () => mover(-1) });
  const siguiente = el("button", { class: "boton", type: "button", "aria-label": "Mes siguiente", text: "›", onclick: () => mover(1) });
  const mover = (paso) => {
    mes = meses[meses.indexOf(mes) + paso] ?? mes;
    dia = hoy.startsWith(mes) ? hoy : null;
    pintar();
  };
  const delDia = (d) => ({ pub: publicadas.filter((x) => x.dia === d), plan: futuras.filter((x) => x.publica === d && filtro(x)) });

  function pintar() {
    const [a, m] = mes.split("-").map(Number);
    titulo.textContent = mesLargo(mes);
    anterior.disabled = meses.indexOf(mes) === 0;
    siguiente.disabled = meses.indexOf(mes) === meses.length - 1;
    const diasDelMes = new Date(Date.UTC(a, m, 0)).getUTCDate();
    const vacios = (new Date(Date.UTC(a, m - 1, 1)).getUTCDay() + 6) % 7; // la semana empieza en lunes
    const celdas = ["L", "M", "X", "J", "V", "S", "D"].map((n) => el("div", { class: "dia-nombre", text: n, "aria-hidden": "true" }));
    for (let i = 0; i < vacios; i++) celdas.push(el("div", {}));
    for (let n = 1; n <= diasDelMes; n++) {
      const d = `${mes}-${String(n).padStart(2, "0")}`;
      const { pub, plan } = delDia(d);
      const partes = [pub.length ? plural(pub.length, "publicada", "publicadas") : null, plan.length ? plural(plan.length, "planeada", "planeadas") : null].filter(Boolean);
      celdas.push(
        el(
          "button",
          { type: "button", class: `dia${d === hoy ? " hoy" : ""}`, "aria-pressed": String(d === dia), "aria-label": `${fechaConDia(d)}: ${partes.join(" y ") || "sin piezas"}`, onclick: () => ((dia = d), pintar()) },
          el("span", { class: "n", text: n }),
          el("span", { class: "marcas" }, pub.map((x) => el("span", { class: "marca-pieza pub", text: letra(x.tipo) })), plan.map((x) => el("span", { class: "marca-pieza", text: letra(x.formato) }))),
        ),
      );
    }
    rejilla.replaceChildren(...celdas);

    if (!dia) {
      detalleTitulo.textContent = "Toca un día para ver sus piezas";
      detalle.replaceChildren();
      return;
    }
    const { pub, plan } = delDia(dia);
    detalleTitulo.textContent = `${fechaConDia(dia)}${dia === hoy ? " (hoy)" : ""}`;
    detalle.replaceChildren(...(pub.length || plan.length ? [...pub.map(fichaPublicada), ...plan.map((x) => fichaPlan(x))] : [el("p", { class: "nota", text: dia < hoy ? "No hubo publicaciones en el feed ese día." : "No hay piezas planeadas para ese día." })]));
  }

  // ---- Próximas piezas ------------------------------------------------------
  const proximasCaja = el("div");
  let todas = false;
  const masBoton = el("button", { class: "boton", type: "button", onclick: () => ((todas = !todas), pintarProximas()) });
  function pintarProximas() {
    const filas = futuras.filter(filtro);
    proximasCaja.replaceChildren(...(filas.length ? filas.slice(0, todas ? filas.length : 5).map((x) => fichaPlan(x, true)) : [el("p", { class: "nota", text: "No hay piezas planeadas con ese filtro." })]));
    masBoton.textContent = todas ? "Ver solo las primeras" : `Ver las ${filas.length} piezas planeadas`;
    masBoton.hidden = filas.length <= 5;
  }
  const selIsla = el(
    "select",
    { onchange: (e) => ((isla = e.target.value), (todas = false), pintar(), pintarProximas()) },
    el("option", { value: "todas", text: "Todas" }),
    islas.map((i) => el("option", { value: i, text: i === "Marca" ? "Toda la marca" : i })),
  );
  pintar();
  pintarProximas();

  // ---- Rodajes --------------------------------------------------------------
  const jornadas = new Map();
  for (const x of p.plan.piezas.filter((y) => y.grabar)) {
    if (!jornadas.has(x.grabar)) jornadas.set(x.grabar, []);
    jornadas.get(x.grabar).push(x);
  }
  const lineaJornada = ([fecha, xs]) => {
    const donde = [...new Set(xs.map((x) => x.isla).filter((i) => i && i !== "Marca"))];
    return el("li", {}, el("strong", { text: fechaLarga(fecha) }), ` · ${plural(xs.length, "pieza", "piezas")}${donde.length ? ` · ${donde.join(", ")}` : ""}`);
  };
  const jornadasFuturas = [...jornadas].filter(([f]) => f >= hoy).sort();
  const jornadasPasadas = [...jornadas].filter(([f]) => f < hoy).sort().reverse();

  // ---- Cumplimiento del mes en curso ----------------------------------------
  const mesHoy = hoy.slice(0, 7);
  const pubMes = publicadas.filter((x) => x.dia.startsWith(mesHoy));
  const planMes = futuras.filter((x) => x.publica.startsWith(mesHoy));
  const cuentaPub = (t) => pubMes.filter((x) => x.tipo === t).length;
  const cuentaPlan = (f) => planMes.filter((x) => x.formato === f).length;
  const par = (rotulo, valor) => el("div", {}, el("dt", { text: rotulo }), el("dd", { text: valor }));

  return el(
    "div",
    { class: "seccion" },
    cabecera("Plan", "Qué se publicó, qué viene y qué hace falta para producirlo."),
    el(
      "div",
      { class: "rejilla dos-col" },
      !enlazadas
        ? el("div", { class: "ancho" }, el("div", { class: "aviso" }, el("strong", { text: "El plan y lo publicado todavía no están enlazados" }), "Lo publicado se muestra tal como está en Instagram. Lo planeado viene del calendario de trabajo y puede no reflejar cambios de última hora. Cuando cada pieza del plan tenga su enlace, aquí se verá el resultado de cada una."))
        : null,
      el(
        "div",
        { class: "ancho" },
        tarjeta(
          "Calendario",
          null,
          el("div", { class: "controles" }, el("label", {}, "Isla (solo lo planeado)", selIsla)),
          el("div", { class: "cal-cab" }, anterior, titulo, siguiente),
          rejilla,
          el(
            "div",
            { class: "leyenda" },
            el("span", {}, el("span", { class: "marca-pieza pub", text: "R" }), "Publicada"),
            el("span", {}, el("span", { class: "marca-pieza", text: "R" }), "Planeada"),
            el("span", { text: "R reel · C carrusel · I imagen · H historias" }),
          ),
          el("div", {}, detalleTitulo),
          detalle,
          fuente("plan", "Lo publicado viene de Instagram (reels, carruseles e imágenes; las historias no dejan registro)."),
        ),
      ),
      tarjeta("Lo que viene", `Piezas planeadas desde hoy, ${fechaCorta(hoy)}.`, proximasCaja, masBoton, fuente("plan")),
      el(
        "div",
        { class: "rejilla arriba" },
        tarjeta(
          `Avance de ${mesLargo(mesHoy)}`,
          null,
          el("dl", { class: "pares" }, par("Reels publicados", num(cuentaPub("reel"))), par("Carruseles", num(cuentaPub("carrusel"))), par("Imágenes", num(cuentaPub("imagen")))),
          el("dl", { class: "pares" }, par("Reels por salir", num(cuentaPlan("Reel"))), par("Historias por salir", num(cuentaPlan("Historia"))), par("Meta del mes", "Por registrar")),
          el("p", { class: "nota", text: "«Por salir» cuenta lo planeado de hoy a fin de mes. La meta pactada del mes se mostrará cuando quede registrada; no se supone." }),
          fuente("ig_piezas"),
        ),
        tarjeta(
          "Rodajes",
          null,
          jornadasFuturas.length ? el("ul", { class: "lista-simple" }, jornadasFuturas.map(lineaJornada)) : el("p", { class: "nota", text: "No hay jornadas de rodaje futuras cargadas. La próxima fecha se mostrará aquí cuando se confirme." }),
          jornadasPasadas.length ? el("details", { class: "tabla" }, el("summary", { text: `Jornadas anteriores (${jornadasPasadas.length})` }), el("ul", { class: "lista-simple" }, jornadasPasadas.map(lineaJornada))) : null,
          fuente("plan", "La fecha es el límite para grabar, no necesariamente el día del rodaje."),
        ),
        p.plan.dinamicas.length
          ? tarjeta(
              "Dinámicas en historias",
              null,
              el("ul", { class: "lista-simple" }, p.plan.dinamicas.map((d) => el("li", {}, el("strong", { text: d.nombre }), ` · ${d.premio ?? "Premio por definir"} · ${d.participaciones === null ? "participaciones sin dato" : plural(d.participaciones, "participación", "participaciones")}`))),
            )
          : pendiente("Dinámicas en historias", "Todavía no hay dinámicas registradas. Los premios están por definir; cuando se lance la primera, aquí se verán su mecánica, sus fechas y cuánta gente participó."),
      ),
      pasadas.length || sinFecha.length
        ? el(
            "div",
            { class: "ancho" },
            tarjeta(
              "Planeadas que no figuran como publicadas",
              `${plural(pasadas.length, "pieza", "piezas")} del plan con fecha anterior a hoy. Pudieron cambiarse por otra pieza, aplazarse o no estar actualizadas en el calendario de trabajo.`,
              el(
                "details",
                { class: "tabla" },
                el("summary", { text: "Ver la lista" }),
                el("ul", { class: "lista-simple" }, [...pasadas].reverse().map((x) => el("li", { text: `${fechaCorta(x.publica)} · ${FORMATO[x.formato] ?? x.formato} · ${x.titulo}` })), sinFecha.map((x) => el("li", { text: `Sin fecha · ${FORMATO[x.formato] ?? x.formato} · ${x.titulo}` }))),
              ),
              fuente("plan"),
            ),
          )
        : null,
    ),
  );
}
