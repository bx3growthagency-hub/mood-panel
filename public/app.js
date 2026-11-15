// Panel de Mood by BX3. Lee /api/panel con la clave del enlace privado y arma
// las secciones. Reglas del encargo: cada cifra con fuente y fecha; lo que no
// se sabe dice "Sin dato" y qué falta, nunca 0.

import { el, num, dec, compacto, signo, fechaCorta, fechaLarga, fechaConDia, mesCorto, mesLargo, mesNombre, sumarDias, diasEntre, rangoDias, suma, mediana, plural } from "./util.js";
import { graficaLineas, graficaColumnas, leyenda, tabla } from "./graficas.js";
import { seccionPlan } from "./plan.js";

const ISLAS = ["Le Meridiem", "Buenavista 2", "Parque Alegra"];
const COLOR = { "Le Meridiem": "#1f8fc4", "Buenavista 2": "#e8574f", "Parque Alegra": "#4f3fa8" };
const S1 = "#1f8fc4";
const TIPO = { reel: "Reel", carrusel: "Carrusel", imagen: "Imagen" };
const BOTONES = { resena: "Reseña en Google", moodcard: "Mood Card", menu: "Menú", instagram: "Instagram", whatsapp: "WhatsApp", rappi: "Rappi", didi: "DiDi", "otra-sede": "Otra isla" };

const contenido = document.getElementById("contenido");
const estado = (titulo, texto) => contenido.replaceChildren(el("p", { class: "estado", role: "status" }, el("strong", { text: titulo }), texto));

// ---- Piezas comunes ---------------------------------------------------------
let CAPTURAS = new Map();
const fuente = (conjunto, extra) => {
  const c = CAPTURAS.get(conjunto);
  return el("p", { class: "fuente", text: c ? `Fuente: ${c.fuente}. Dato del ${fechaLarga(c.capturado)}.${extra ? ` ${extra}` : ""}` : `Fuente sin registrar.${extra ? ` ${extra}` : ""}` });
};
export const tarjeta = (titulo, bajada, ...hijos) =>
  el("section", { class: "tarjeta" }, el("div", {}, el("h3", { text: titulo }), bajada ? el("p", { class: "bajada", text: bajada }) : null), hijos);
const cifra = (rotulo, valor, detalle, origen) =>
  el(
    "div",
    { class: "cifra" },
    el("p", { class: "rotulo", text: rotulo }),
    el("p", { class: valor === null ? "valor sin" : "valor", text: valor === null ? "Sin dato" : valor }),
    detalle ? el("p", { class: "detalle", text: detalle }) : null,
    origen ? el("p", { class: "origen", text: origen }) : null,
  );
export const pendiente = (titulo, falta, ...hijos) =>
  el("section", { class: "tarjeta pendiente" }, el("div", {}, el("span", { class: "sello", text: "Sin dato" }), el("h3", { text: titulo })), el("p", { class: "nota", text: falta }), hijos);
const cabecera = (titulo, texto) => el("header", {}, el("h2", { text: titulo }), texto ? el("p", { text: texto }) : null);
const caja = () => el("div", { class: "grafica-caja" });

// ---- Cálculos ---------------------------------------------------------------
function preparar(d) {
  const diario = d.ig.diario.filter((f) => f.vistas !== null);
  const conSeguidores = d.ig.diario.filter((f) => f.seguidores !== null);
  const ventana = diario.slice(-30);
  const desde = ventana[0]?.dia;
  const hasta = ventana.at(-1)?.dia;
  const corte = d.ig.piezas[0]?.capturado ?? d.hoy;
  const piezas = d.ig.piezas.map((p) => ({
    ...p,
    dia: p.publicado.slice(0, 10),
    // Menos de 3 días publicada al capturar: Instagram todavía la está repartiendo.
    enMedicion: diasEntre(p.publicado.slice(0, 10), corte) < 3,
    url: `https://www.instagram.com/${p.tipo === "reel" ? "reel" : "p"}/${encodeURIComponent(p.id)}/`,
  }));

  // Stands: toques y visitas directas, descontando los ajustes (pruebas).
  const ajustes = new Map(d.stands.ajustes.map((a) => [`${a.codigo}|${a.origen}|${a.dia}|${a.hora}`, a.cuenta]));
  const llegadas = [];
  const clics = [];
  if (d.stands.disponible) {
    for (const t of d.stands.toques) {
      const cuenta = t.cuenta - (ajustes.get(`${t.codigo}|${t.origen}|${t.dia}|${t.hora}`) ?? 0);
      if (cuenta > 0) llegadas.push({ isla: d.codigos[t.codigo] ?? null, tipo: t.origen, dia: t.dia, hora: t.hora, cuenta });
    }
    for (const v of d.stands.directas) llegadas.push({ isla: d.codigos[v.codigo] ?? null, tipo: "directa", dia: v.dia, hora: v.hora, cuenta: v.cuenta });
    for (const c of d.stands.clics) clics.push({ isla: d.codigos[c.codigo] ?? null, destino: c.destino, dia: c.dia, cuenta: c.cuenta });
  }
  const doc = (clave) => d.documentos[clave]?.datos ?? null;
  return { ...d, diario, conSeguidores, ventana, desde, hasta, corte, piezas, llegadas, clics, doc };
}

// ---- Resumen ----------------------------------------------------------------
function seccionResumen(p) {
  const vistas = suma(p.ventana.map((f) => f.vistas));
  const alcance = suma(p.ventana.map((f) => f.alcance)) / p.ventana.length;
  const seg0 = p.conSeguidores[0];
  const seg1 = p.conSeguidores.at(-1);
  const enVentana = p.piezas.filter((x) => x.dia >= p.desde);
  const cuenta = (t) => enVentana.filter((x) => x.tipo === t).length;
  const interacciones = suma(enVentana.map((x) => x.interacciones));
  const llegadasIslas = suma(p.llegadas.filter((l) => l.isla).map((l) => l.cuenta));
  const primerDiaStands = p.llegadas.map((l) => l.dia).sort()[0];
  const resenas = p.doc("gbp_resenas") ?? [];
  const mesesCompletos = [...new Set(p.google.mensual.filter((f) => !f.parcial).map((f) => f.mes))].sort();
  const ultimoMes = mesesCompletos.at(-1);
  const impresionesMes = suma(p.google.mensual.filter((f) => f.mes === ultimoMes).map((f) => f.impresiones));
  const mejor = [...enVentana].filter((x) => !x.enMedicion).sort((a, b) => b.vistas - a.vistas)[0];
  const base = p.doc("ig_linea_base");
  const medReels = mediana(enVentana.filter((x) => x.tipo === "reel" && !x.enMedicion).map((x) => x.vistas));
  const medCarr = mediana(enVentana.filter((x) => x.tipo === "carrusel" && !x.enMedicion).map((x) => x.vistas));
  const islaTop = ISLAS.map((i) => [i, suma(p.llegadas.filter((l) => l.isla === i).map((l) => l.cuenta))]).sort((a, b) => b[1] - a[1])[0];

  return el(
    "div",
    { class: "seccion" },
    cabecera("Resumen", `La marca de un vistazo. Instagram del ${fechaCorta(p.desde)} al ${fechaCorta(p.hasta)} (${p.ventana.length} días), que es lo que la herramienta de medición conserva hoy.`),
    el(
      "div",
      { class: "rejilla" },
      el(
        "section",
        { class: "tarjeta heroe" },
        el("div", {}, el("h3", { text: "Vistas en Instagram" }), el("p", { class: "valor", text: num(vistas) })),
        el("p", { class: "bajada", text: `Veces que se mostró contenido de la cuenta (reels, publicaciones, historias y perfil) en ${p.ventana.length} días. Promedio: ${num(vistas / p.ventana.length)} al día.` }),
        fuente("ig_diario"),
      ),
      el(
        "div",
        { class: "cifras" },
        cifra("Seguidores", seg1 ? num(seg1.seguidores) : null, seg1 && seg0 ? `${signo(seg1.seguidores - seg0.seguidores)} desde el ${fechaCorta(seg0.dia)}` : null, seg1 ? `Instagram · ${fechaCorta(seg1.dia)}` : null),
        cifra("Personas alcanzadas al día", num(alcance), "Promedio diario. Las personas se repiten entre días, por eso no se suma.", "Instagram"),
        cifra("Piezas publicadas", num(enVentana.length), `${plural(cuenta("reel"), "reel", "reels")}, ${plural(cuenta("carrusel"), "carrusel", "carruseles")} y ${plural(cuenta("imagen"), "imagen", "imágenes")}. Sin contar historias.`, "Instagram"),
        cifra("Interacciones en esas piezas", num(interacciones), "Me gusta, comentarios, guardados y compartidos.", "Instagram"),
        cifra("Llegadas a las páginas de las islas", p.stands.disponible ? num(llegadasIslas) : null, p.stands.disponible && primerDiaStands ? `Toques del chip, escaneos del QR y entradas directas desde el ${fechaCorta(primerDiaStands)}.` : "No se pudo leer el contador de los stands.", "Stands De un tap"),
        cifra("Reseñas en Google", resenas.length ? num(suma(resenas.map((r) => r.cantidad))) : null, resenas.length ? resenas.map((r) => `${r.isla}: ${num(r.cantidad)} (${dec(r.promedio)})`).join(" · ") : null, "Google Perfil de Empresa"),
        cifra(`Veces vistos en Google en ${ultimoMes ? mesNombre(ultimoMes) : "el mes"}`, ultimoMes ? num(impresionesMes) : null, "Las tres islas, en Búsqueda y Maps.", "Google Perfil de Empresa"),
        cifra("Vistas de historias", null, "Instagram solo las entrega durante 24 horas. Falta capturarlas a diario.", "Por conectar"),
      ),
      tarjeta(
        "Lo que destaca",
        null,
        el(
          "ul",
          { class: "lista-simple" },
          mejor ? el("li", {}, "La pieza más vista del periodo es ", el("a", { href: mejor.url, target: "_blank", rel: "noopener noreferrer", text: `«${mejor.titulo}»` }), `: ${num(mejor.vistas)} vistas (${TIPO[mejor.tipo].toLowerCase()}, ${fechaCorta(mejor.dia)}).`) : null,
          medReels !== null && medCarr !== null ? el("li", { text: `Un carrusel típico tiene ${num(medCarr)} vistas y un reel típico ${num(medReels)} (mediana de cada formato). No se sabe cuáles tuvieron pauta.` }) : null,
          p.stands.disponible && islaTop?.[1] ? el("li", { text: `${islaTop[0]} es la isla con más llegadas a su página: ${num(islaTop[1])}.` }) : null,
          el("li", { text: "En Google casi todo el que encuentra las fichas ya buscaba «mood». La búsqueda por categoría («heladería») todavía es pequeña: está en la sección Google." }),
        ),
      ),
      base
        ? tarjeta(
            "Antes y después de BX3",
            "Todavía no se puede comparar con rigor. Se muestran los dos periodos tal como están.",
            el(
              "div",
              { class: "dos" },
              el("div", {}, el("h4", { text: "Antes" }), el("p", { class: "periodo", text: `${fechaCorta(base.desde)} – ${fechaCorta(base.hasta)} · ${base.dias} días` }), el("p", { class: "valor", text: num(base.vistas) }), el("p", { class: "periodo", text: "vistas · capturas de Instagram" })),
              el("div", {}, el("h4", { text: "Con BX3" }), el("p", { class: "periodo", text: `${fechaCorta(p.desde)} – ${fechaCorta(p.hasta)} · ${p.ventana.length} días` }), el("p", { class: "valor", text: num(vistas) }), el("p", { class: "periodo", text: "vistas · medición de BX3" })),
            ),
            el("p", { class: "nota" }, el("strong", { text: "Por qué no se comparan aún. " }), `Los periodos duran distinto (${base.dias} y ${p.ventana.length} días) y vienen de fuentes distintas. La comparación válida necesita el mismo número de días medidos de la misma forma; se completa cuando el historial con BX3 llegue a ${base.dias} días.`),
            el("p", { class: "fuente", text: `Antes: ${p.documentos.ig_linea_base.fuente.toLowerCase()}. Con BX3: Instagram medido con Metricool, dato del ${fechaLarga(p.corte)}.` }),
          )
        : null,
    ),
  );
}

// ---- Instagram --------------------------------------------------------------
function seccionInstagram(p) {
  const dias = p.ventana;
  const gVistas = caja();
  graficaLineas(gVistas, {
    series: [{ nombre: "Vistas", color: S1, valores: dias.map((f) => f.vistas) }],
    etiquetas: dias.map((f) => fechaCorta(f.dia)),
    etiquetasLargas: dias.map((f) => fechaConDia(f.dia)),
    descripcion: `Vistas de la cuenta por día, del ${fechaCorta(p.desde)} al ${fechaCorta(p.hasta)}`,
  });
  const ganados = suma(dias.map((f) => f.ganados));
  const perdidos = suma(dias.map((f) => f.perdidos));
  const diasSeg = dias.filter((f) => f.ganados !== null).length;
  const cuentas = mediana(dias.map((f) => f.cuentas_interactuaron));

  // Por formato (sin las piezas todavía en medición)
  const medidas = p.piezas.filter((x) => x.dia >= p.desde && !x.enMedicion);
  const porFormato = Object.keys(TIPO)
    .map((t) => [t, medidas.filter((x) => x.tipo === t)])
    .filter(([, xs]) => xs.length)
    .map(([t, xs]) => [`${TIPO[t]}${xs.length === 1 ? " (una sola pieza)" : ""}`, xs.length, mediana(xs.map((x) => x.vistas)), mediana(xs.map((x) => x.alcance)), mediana(xs.map((x) => x.interacciones)), mediana(xs.map((x) => x.compartidos))]);

  // Piezas ordenables
  const METRICAS = { vistas: "Vistas", alcance: "Personas alcanzadas", interacciones: "Interacciones", compartidos: "Compartidos", guardados: "Guardados", comentarios: "Comentarios" };
  let metrica = "vistas";
  let formato = "todos";
  let todas = false;
  const lista = el("ol", { class: "barras" });
  const masBoton = el("button", { class: "boton", type: "button", onclick: () => ((todas = !todas), pintar()) });
  const pintar = () => {
    const filas = p.piezas.filter((x) => formato === "todos" || x.tipo === formato).sort((a, b) => (b[metrica] ?? -1) - (a[metrica] ?? -1));
    const maximo = Math.max(1, ...filas.map((x) => x[metrica] ?? 0));
    lista.replaceChildren(
      ...filas.slice(0, todas ? filas.length : 8).map((x) => {
        const barra = el("div", { class: "barra" });
        barra.style.width = `${(100 * (x[metrica] ?? 0)) / maximo}%`;
        return el(
          "li",
          {},
          el("div", { class: "cab" }, el("p", { class: "titulo" }, el("a", { href: x.url, target: "_blank", rel: "noopener noreferrer", text: x.titulo })), el("p", { class: "num", text: num(x[metrica]) })),
          el("p", { class: "meta", text: `${TIPO[x.tipo]} · ${fechaCorta(x.dia)}${x.enMedicion ? " · medición en curso" : ""}` }),
          el("div", { class: "pista" }, barra),
        );
      }),
    );
    masBoton.textContent = todas ? "Ver solo las primeras" : `Ver las ${filas.length} piezas`;
    masBoton.hidden = filas.length <= 8;
  };
  const selMetrica = el("select", { onchange: (e) => ((metrica = e.target.value), pintar()) }, Object.entries(METRICAS).map(([k, v]) => el("option", { value: k, text: v })));
  const selFormato = el("select", { onchange: (e) => ((formato = e.target.value), (todas = false), pintar()) }, el("option", { value: "todos", text: "Todos" }), Object.entries(TIPO).map(([k, v]) => el("option", { value: k, text: v })));
  pintar();

  // Audiencia
  const aud = p.doc("ig_audiencia");
  const SEXO = [
    ["Mujeres", "#1f8fc4"],
    ["Hombres", "#e8574f"],
    ["Sin especificar", "#8a9aa0"],
  ];
  const totalAud = aud ? suma(aud.edad_genero.flatMap((f) => f.slice(1))) : 0;
  const maxEdad = aud ? Math.max(...aud.edad_genero.map((f) => suma(f.slice(1)))) : 1;
  const historias = p.doc("ig_historias");

  return el(
    "div",
    { class: "seccion" },
    cabecera("Instagram", `Cuenta @mood.helados. Del ${fechaCorta(p.desde)} al ${fechaCorta(p.hasta)}.`),
    el(
      "div",
      { class: "rejilla dos-col" },
      el(
        "div",
        { class: "ancho" },
        tarjeta(
          "Vistas por día",
          "Veces que se mostró contenido de la cuenta, con y sin pauta.",
          gVistas,
          tabla(["Día", "Vistas", "Personas alcanzadas", "Seguidores"], dias.map((f) => [fechaCorta(f.dia), f.vistas, f.alcance, f.seguidores])),
          fuente("ig_diario", "Los días sin número de seguidores son días en que la herramienta no lo entregó."),
        ),
      ),
      el(
        "div",
        { class: "cifras ancho" },
        cifra("Seguidores ganados", num(ganados), `En ${diasSeg} de ${dias.length} días con dato.`, "Instagram"),
        cifra("Seguidores perdidos", num(perdidos), `Saldo: ${signo(ganados - perdidos)}.`, "Instagram"),
        cifra("Cuentas que interactúan al día", num(cuentas), "Día típico (mediana). Personas distintas que dieron me gusta, comentaron, guardaron o compartieron.", "Instagram"),
        cifra("Pauta", null, "La cuenta de anuncios no está conectada: no se sabe qué piezas tuvieron pauta ni cuánto.", "Por conectar"),
      ),
      tarjeta(
        "Qué formato rinde más",
        "Valor típico (mediana) por pieza. Compara solo piezas del mismo formato.",
        tabla(["Formato", "Piezas", "Vistas", "Alcance", "Interacciones", "Compartidos"], porFormato, { abierta: true }),
        el("p", { class: "nota", text: "Una pieza con pauta se ve inflada frente a las demás, y hoy no se pueden distinguir. Las piezas con menos de tres días publicadas no entran en este cálculo." }),
        fuente("ig_piezas"),
      ),
      tarjeta(
        "Piezas publicadas",
        "Ordenadas por la medida que elijas. El título lleva a la pieza en Instagram.",
        el("div", { class: "controles" }, el("label", {}, "Ordenar por", selMetrica), el("label", {}, "Formato", selFormato)),
        lista,
        masBoton,
        fuente("ig_piezas", "Datos orgánicos."),
      ),
      aud
        ? tarjeta(
            "Quién sigue a Mood",
            `Seguidores por edad. ${dec((100 * suma(aud.edad_genero.map((f) => f[1]))) / totalAud, 0)} % son mujeres.`,
            leyenda(SEXO.map(([nombre, color]) => ({ nombre, color })), "caja"),
            el(
              "ul",
              { class: "barras" },
              aud.edad_genero.map(([edad, ...valores]) => {
                const total = suma(valores);
                const pila = el("div", { class: "apilada" });
                pila.style.width = `${(100 * total) / maxEdad}%`;
                valores.forEach((v, i) => {
                  const s = el("span", { title: `${SEXO[i][0]}: ${num(v)}` });
                  s.style.background = SEXO[i][1];
                  s.style.flex = `${v} 0 0`;
                  pila.append(s);
                });
                return el("li", {}, el("div", { class: "cab" }, el("p", { class: "titulo", text: `${edad} años` }), el("p", { class: "num", text: `${dec((100 * total) / totalAud, 0)} %` })), pila);
              }),
            ),
            tabla(["Edad", ...SEXO.map((s) => s[0])], aud.edad_genero),
            fuente("ig_audiencia"),
          )
        : pendiente("Quién sigue a Mood", "Falta capturar la audiencia."),
      aud
        ? tarjeta(
            "Dónde están",
            "Porcentaje de seguidores por ciudad.",
            el(
              "ul",
              { class: "barras" },
              aud.ciudades.slice(0, 7).map(([ciudad, pct]) => {
                const barra = el("div", { class: "barra" });
                barra.style.width = `${(100 * pct) / aud.ciudades[0][1]}%`;
                return el("li", {}, el("div", { class: "cab" }, el("p", { class: "titulo", text: ciudad }), el("p", { class: "num", text: `${dec(pct)} %` })), el("div", { class: "pista" }, barra));
              }),
            ),
            fuente("ig_audiencia", aud.ciudades_nota),
          )
        : null,
      pendiente("Historias", historias?.motivo ?? "Falta capturar las historias a diario.", fuente("ig_historias")),
    ),
  );
}

// ---- Islas y stands ---------------------------------------------------------
function seccionIslas(p) {
  if (!p.stands.disponible)
    return el("div", { class: "seccion" }, cabecera("Islas", "Stands De un tap en cada isla."), pendiente("Contador de los stands", "No se pudo leer el contador en este momento. Los demás datos del panel no dependen de él."));

  const dias = p.llegadas.map((l) => l.dia).sort();
  const desde = dias[0];
  const rango = desde ? rangoDias(desde, p.hoy) : [];
  const deIsla = (isla) => p.llegadas.filter((l) => l.isla === isla);
  const tipo = (xs, t) => suma(xs.filter((l) => l.tipo === t).map((l) => l.cuenta));
  const primerClic = p.clics.map((c) => c.dia).sort()[0];
  const clicsDe = (isla, destino) => suma(p.clics.filter((c) => c.isla === isla && c.destino === destino).map((c) => c.cuenta));
  const destinos = Object.keys(BOTONES).filter((d) => p.clics.some((c) => c.destino === d));
  const general = suma(p.llegadas.filter((l) => !l.isla).map((l) => l.cuenta));

  const gDias = caja();
  graficaColumnas(gDias, {
    series: ISLAS.map((i) => ({ nombre: i, color: COLOR[i], valores: rango.map((d) => suma(deIsla(i).filter((l) => l.dia === d).map((l) => l.cuenta))) })),
    etiquetas: rango.map(fechaCorta),
    etiquetasLargas: rango.map(fechaConDia),
    descripcion: "Llegadas por día a las páginas de las tres islas",
    total: "Las tres islas",
  });
  const horas = Array.from({ length: 24 }, (_, h) => h);
  const gHoras = caja();
  graficaColumnas(gHoras, {
    series: [{ nombre: "Llegadas", color: S1, valores: horas.map((h) => suma(p.llegadas.filter((l) => l.isla && l.hora === h).map((l) => l.cuenta))) }],
    etiquetas: horas.map((h) => `${h} h`),
    etiquetasLargas: horas.map((h) => `De ${h}:00 a ${h}:59`),
    alto: 180,
    descripcion: "Llegadas por hora del día, las tres islas juntas",
  });

  return el(
    "div",
    { class: "seccion" },
    cabecera("Islas", `Lo que pasa en el stand de cada isla: cuánta gente toca el chip, escanea el QR o entra al enlace, y qué botón oprime. Conteo desde el ${desde ? fechaCorta(desde) : "inicio"}.`),
    el(
      "div",
      { class: "rejilla tres-col" },
      ISLAS.map((isla) => {
        const xs = deIsla(isla);
        const marca = el("i");
        marca.style.background = COLOR[isla];
        return el(
          "section",
          { class: "tarjeta" },
          el("div", { class: "isla-cab" }, marca, el("h3", { text: isla })),
          el("div", {}, el("p", { class: "grande", text: num(suma(xs.map((l) => l.cuenta))) }), el("p", { class: "bajada", text: "llegadas" })),
          el("dl", { class: "pares" }, el("div", {}, el("dt", { text: "Chip (NFC)" }), el("dd", { text: num(tipo(xs, "nfc")) })), el("div", {}, el("dt", { text: "QR" }), el("dd", { text: num(tipo(xs, "qr")) })), el("div", {}, el("dt", { text: "Directas" }), el("dd", { text: num(tipo(xs, "directa")) }))),
          el("dl", { class: "pares" }, el("div", {}, el("dt", { text: "Clics a reseña" }), el("dd", { text: num(clicsDe(isla, "resena")) })), el("div", {}, el("dt", { text: "Clics a Mood Card" }), el("dd", { text: num(clicsDe(isla, "moodcard")) }))),
        );
      }),
      el(
        "div",
        { class: "ancho" },
        el(
          "div",
          { class: "aviso" },
          el("strong", { text: "Cómo leer el chip (NFC)" }),
          "Buenavista 2 cuenta los toques del chip desde el 11 de noviembre. En Le Meridiem y Parque Alegra el chip abre la reseña de Google directamente, sin pasar por el contador: por eso su NFC aparece en cero aunque se use. Se corrige regrabando esos dos chips.",
        ),
      ),
      el(
        "div",
        { class: "ancho" },
        tarjeta(
          "Llegadas por día",
          "Las tres islas. Un día sin columna es un día sin llegadas registradas.",
          leyenda(ISLAS.map((i) => ({ nombre: i, color: COLOR[i] })), "caja"),
          gDias,
          tabla(["Día", ...ISLAS, "Total"], rango.map((d) => { const v = ISLAS.map((i) => suma(deIsla(i).filter((l) => l.dia === d).map((l) => l.cuenta))); return [fechaCorta(d), ...v, suma(v)]; })),
          el("p", { class: "fuente", text: `Fuente: contador de los stands De un tap, leído al abrir el panel. Las entradas directas se cuentan desde el ${primerClic ? fechaCorta(primerClic) : "9 nov"}.` }),
        ),
      ),
      el(
        "div",
        { class: "ancho rejilla dos-col" },
      tarjeta(
        "A qué hora llegan",
        "Las tres islas juntas, hora de Colombia.",
        gHoras,
        tabla(["Hora", "Llegadas"], horas.map((h) => [`${h}:00`, suma(p.llegadas.filter((l) => l.isla && l.hora === h).map((l) => l.cuenta))]).filter((f) => f[1] > 0)),
        el("p", { class: "fuente", text: "Fuente: contador de los stands De un tap." }),
      ),
      tarjeta(
        "Qué botón oprimen",
        `Clics en la página de cada isla desde el ${primerClic ? fechaCorta(primerClic) : "9 nov"}.`,
        tabla(["Botón", ...ISLAS], destinos.map((d) => [BOTONES[d], ...ISLAS.map((i) => clicsDe(i, d))]), { abierta: true }),
        el("p", { class: "nota", text: "Un clic en «Reseña en Google» o en «Mood Card» muestra interés: no confirma que la reseña se publicó ni que el registro se completó." }),
        el("p", { class: "fuente", text: "Fuente: contador de los stands De un tap." }),
      ),
      ),
      el(
        "div",
        { class: "ancho" },
        tarjeta(
          "Cómo se cuenta",
          null,
          el(
            "ul",
            { class: "lista-simple" },
            el("li", { text: "Se cuentan eventos, no personas: la misma persona puede llegar o hacer clic varias veces. No se guarda ningún dato personal." }),
            p.stands.ajustes.map((a) => el("li", { text: `Se descontaron ${num(a.cuenta)} toques del ${fechaCorta(a.dia)} en ${p.codigos[a.codigo] ?? a.codigo}: ${a.motivo}.` })),
            general ? el("li", { text: `Además hubo ${num(general)} entradas a la página general de Mood sin elegir isla. No se suman a ninguna.` }) : null,
            el("li", { text: "Personas únicas por día: todavía sin dato. La medición está preparada y falta activarla en los stands." }),
          ),
        ),
      ),
    ),
  );
}

// ---- Google -----------------------------------------------------------------
function seccionGoogle(p) {
  const filas = p.google.mensual;
  const meses = [...new Set(filas.filter((f) => !f.parcial).map((f) => f.mes))].sort();
  const valor = (isla, mes, campo) => filas.find((f) => f.isla === isla && f.mes === mes && !f.parcial)?.[campo] ?? null;
  const ultimo = meses.at(-1);
  const previo = meses.at(-2);
  const resenas = p.doc("gbp_resenas") ?? [];
  const busq = p.doc("gbp_busquedas");
  const parciales = filas.filter((f) => f.parcial);

  const MEDIDAS = { impresiones: "Veces vistos", como_llegar: "Cómo llegar" };
  let medida = "impresiones";
  const g = caja();
  const tablaCaja = el("div");
  const botones = Object.entries(MEDIDAS).map(([k, v]) => el("button", { type: "button", "aria-pressed": String(k === medida), text: v, onclick: () => ((medida = k), pintar()) }));
  const pintar = () => {
    botones.forEach((b, i) => b.setAttribute("aria-pressed", String(Object.keys(MEDIDAS)[i] === medida)));
    const nueva = caja();
    g.replaceChildren(nueva);
    graficaLineas(nueva, {
      series: ISLAS.map((i) => ({ nombre: i, color: COLOR[i], valores: meses.map((m) => valor(i, m, medida)) })),
      etiquetas: meses.map(mesCorto),
      etiquetasLargas: meses.map(mesLargo),
      descripcion: `${MEDIDAS[medida]} por mes en Google, por isla`,
    });
    tablaCaja.replaceChildren(tabla(["Mes", ...ISLAS], meses.map((m) => [mesCorto(m), ...ISLAS.map((i) => valor(i, m, medida))])));
  };
  pintar();

  return el(
    "div",
    { class: "seccion" },
    cabecera("Google", "Las fichas de las tres islas en Búsqueda y Maps: cuánta gente las ve, cuánta pide la ruta y qué buscaba."),
    el(
      "div",
      { class: "rejilla tres-col" },
      ISLAS.map((isla) => {
        const r = resenas.find((x) => x.isla === isla);
        const marca = el("i");
        marca.style.background = COLOR[isla];
        const v = valor(isla, ultimo, "impresiones");
        const a = valor(isla, previo, "impresiones");
        return el(
          "section",
          { class: "tarjeta" },
          el("div", { class: "isla-cab" }, marca, el("h3", { text: isla })),
          el("div", {}, el("p", { class: "grande", text: num(v) }), el("p", { class: "bajada", text: `veces vista en ${mesLargo(ultimo)}${a !== null ? ` · ${num(a)} el mes anterior` : ""}` })),
          el("dl", { class: "pares" }, el("div", {}, el("dt", { text: "Cómo llegar" }), el("dd", { text: num(valor(isla, ultimo, "como_llegar")) })), el("div", {}, el("dt", { text: "Reseñas" }), el("dd", { text: r ? num(r.cantidad) : "Sin dato" })), el("div", {}, el("dt", { text: "Calificación" }), el("dd", { text: r ? dec(r.promedio) : "Sin dato" }))),
        );
      }),
      el(
        "div",
        { class: "ancho" },
        tarjeta(
          "Evolución por mes",
          "Cada isla desde que su ficha tiene datos. El mes en curso no se dibuja porque está incompleto.",
          el("div", { class: "controles" }, el("div", { class: "segmentos", role: "group", "aria-label": "Medida" }, botones)),
          leyenda(ISLAS.map((i) => ({ nombre: i, color: COLOR[i] }))),
          g,
          tablaCaja,
          parciales.length ? el("p", { class: "nota", text: `Mes en curso (${mesLargo(parciales[0].mes)}, incompleto): ${ISLAS.map((i) => { const f = parciales.find((x) => x.isla === i); return f ? `${i} ${num(f.impresiones)} vistas y ${num(f.como_llegar)} rutas` : null; }).filter(Boolean).join("; ")}.` }) : null,
          fuente("gbp_mensual", "«Veces vistos» cuenta personas distintas por día. El primer mes de cada ficha puede estar incompleto."),
        ),
      ),
      busq
        ? el(
            "div",
            { class: "ancho" },
            tarjeta(
              "Qué buscaba la gente que encontró las fichas",
              "Personas por mes. Google no informa las búsquedas con menos de 15 personas.",
              busq.islas.map((b) =>
                el(
                  "div",
                  {},
                  el("div", { class: "isla-cab" }, (() => { const i = el("i"); i.style.background = COLOR[b.isla]; return i; })(), el("h4", { text: b.isla })),
                  tabla(["Búsqueda", ...busq.meses.map(mesCorto)], b.filas.map(([palabra, ...vs]) => [palabra, ...vs.map((v) => (v === null ? "No aparece" : v))]), { abierta: true }),
                  el("p", { class: "nota", text: `Con menos de 15 personas al mes: ${b.menores}.` }),
                ),
              ),
              el("p", { class: "nota" }, el("strong", { text: "Lectura. " }), "Casi todo el que encuentra las fichas ya buscaba «mood». Quien busca «heladería» o «helados» todavía llega poco: ese es el espacio para crecer en Google."),
              fuente("gbp_busquedas", busq.nota),
            ),
          )
        : null,
      el(
        "div",
        { class: "ancho" },
        tarjeta(
          "Llamadas y clics al sitio",
          null,
          el("p", { class: "nota", text: `En ${mesLargo(ultimo)} las tres fichas sumaron ${num(suma(ISLAS.map((i) => valor(i, ultimo, "llamadas"))))} llamadas y ${num(suma(ISLAS.map((i) => valor(i, ultimo, "clics_sitio"))))} clics al sitio web. Son cifras muy bajas porque la gente compra en la isla o por domicilio, no llama ni entra a una web desde la ficha.` }),
          fuente("gbp_mensual"),
        ),
      ),
    ),
  );
}

// ---- Por conectar -----------------------------------------------------------
function seccionPendientes(p) {
  const clicsCard = ISLAS.map((i) => [i, suma(p.clics.filter((c) => c.isla === i && c.destino === "moodcard").map((c) => c.cuenta))]);
  return el(
    "div",
    { class: "seccion" },
    cabecera("Por conectar", "Lo que todavía no se puede medir y qué hace falta para verlo aquí. Mientras falte, no se muestra ninguna cifra."),
    el(
      "div",
      { class: "rejilla dos-col" },
      pendiente("Ventas por isla y canal", "Es la medida que más importa: ventas de cada isla, separando isla, Rappi y DiDi. Falta que Mood comparta el dato cada semana."),
      el(
        "section",
        { class: "tarjeta" },
        el("div", {}, el("span", { class: "chip coral", text: "Dato parcial" }), el("h3", { text: "Mood Card" })),
        el("p", { class: "nota", text: "Lo que sí se ve: clics al enlace de la Mood Card desde la página de cada isla." }),
        p.stands.disponible ? tabla(["Isla", "Clics a Mood Card"], clicsCard, { abierta: true }) : null,
        el("p", { class: "nota", text: "Lo que falta: cuántos de esos clics terminan en registro. Ese dato lo tiene el proveedor de la tarjeta." }),
        el("p", { class: "fuente", text: "Fuente: contador de los stands De un tap, desde el 9 de noviembre." }),
      ),
      pendiente("Historias de Instagram", "Instagram entrega las métricas de cada historia solo durante 24 horas. Hace falta capturarlas todos los días para medir las dinámicas y las encuestas."),
      pendiente("Pauta y campañas", "La cuenta de anuncios de Meta no está conectada. Sin eso no se puede separar el resultado orgánico del pagado ni medir campañas como «Berry win»."),
      pendiente("TikTok", "La cuenta de TikTok no está conectada a la herramienta de medición."),
      pendiente("Personas únicas en los stands", "Hoy se cuentan eventos. La medición de personas distintas por día está preparada y falta activarla."),
    ),
  );
}

// ---- Pie --------------------------------------------------------------------
function pie(p) {
  const nombres = { ig_diario: "Instagram por día", ig_piezas: "Instagram por pieza", ig_audiencia: "Audiencia de Instagram", ig_historias: "Historias", ig_linea_base: "Periodo previo a BX3", gbp_mensual: "Google por mes", gbp_resenas: "Reseñas de Google", gbp_busquedas: "Búsquedas en Google", plan: "Plan de contenido" };
  const destino = document.getElementById("pie");
  destino.replaceChildren(
    el("h2", { text: "De dónde sale cada dato" }),
    tabla(["Dato", "Fuente", "Fecha del dato"], [...p.capturas.map((c) => [nombres[c.conjunto] ?? c.conjunto, c.fuente, fechaLarga(c.capturado)]), ["Stands de las islas", "Contador De un tap", "Al abrir el panel"]], { abierta: true }),
    el("h2", { text: "Cómo leer este panel" }),
    el("p", { text: "Cada cifra muestra de dónde viene y de qué fecha es. Donde dice «Sin dato» no hay medición todavía: no significa cero." }),
    el("p", { text: "Los datos de Instagram y de Google se actualizan por capturas, no en vivo. Los de los stands se leen en el momento." }),
    el("p", { text: "Panel privado de Mood, preparado por BX3. No lo compartas fuera del equipo." }),
  );
  destino.hidden = false;
}

// ---- Arranque ---------------------------------------------------------------
async function iniciar() {
  const clave = location.hash.slice(1);
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(clave)) return estado("Panel privado", "Este panel se abre con el enlace privado que te envió BX3.");
  let respuesta;
  try {
    respuesta = await fetch("/api/panel", { headers: { Authorization: `Bearer ${clave}` }, cache: "no-store" });
  } catch {
    return estado("Sin conexión", "No se pudo cargar el panel. Revisa tu conexión y vuelve a intentar.");
  }
  if (respuesta.status === 401) return estado("Enlace no válido", "El enlace no es válido o fue renovado. Pídele a BX3 el enlace actual.");
  if (!respuesta.ok) return estado("No disponible", "El panel no está disponible en este momento. Intenta de nuevo en unos minutos.");
  const p = preparar(await respuesta.json());
  CAPTURAS = new Map(p.capturas.map((c) => [c.conjunto, c]));
  if (!p.ventana.length) return estado("Sin datos", "Todavía no hay capturas cargadas en el panel.");

  document.getElementById("corte").textContent = `Datos al ${fechaCorta(p.corte)}`;
  const SECCIONES = [
    ["Resumen", seccionResumen],
    ["Instagram", seccionInstagram],
    ["Islas", seccionIslas],
    ["Google", seccionGoogle],
    ["Plan", (x) => seccionPlan(x, { tarjeta, pendiente, cabecera, fuente, TIPO })],
    ["Por conectar", seccionPendientes],
  ];
  const nav = document.getElementById("pestanas");
  const paneles = SECCIONES.map(([nombre, armar], i) => el("div", { id: `panel-${i}`, role: "tabpanel", "aria-label": nombre, hidden: i !== 0 }, armar(p)));
  const botones = SECCIONES.map(([nombre], i) =>
    el("button", { type: "button", role: "tab", "aria-selected": String(i === 0), "aria-controls": `panel-${i}`, text: nombre, onclick: () => abrir(i) }),
  );
  const abrir = (i) => {
    paneles.forEach((x, k) => (x.hidden = k !== i));
    botones.forEach((b, k) => b.setAttribute("aria-selected", String(k === i)));
    botones[i].scrollIntoView({ block: "nearest", inline: "center" });
    window.scrollTo({ top: 0 });
  };
  nav.setAttribute("role", "tablist");
  nav.replaceChildren(...botones);
  nav.hidden = false;
  contenido.replaceChildren(...paneles);
  pie(p);
}

iniciar();
