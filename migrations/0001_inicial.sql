-- Base propia del panel de Mood (2026-11-11). Aquí solo viven capturas con
-- fecha y fuente. Nada de esto identifica a una persona. Los conteos de los
-- stands NO están aquí: se leen de la base de De un tap (binding TOQUES).

-- Un día de la cuenta de Instagram. Se acumula: Metricool gratuito solo
-- devuelve 30 días, así que cada captura agrega o corrige días.
CREATE TABLE ig_diario (
  dia TEXT PRIMARY KEY CHECK (dia GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  seguidores INTEGER,
  vistas INTEGER,
  alcance INTEGER,
  ganados INTEGER,
  perdidos INTEGER,
  cuentas_interactuaron INTEGER,
  capturado TEXT NOT NULL
) WITHOUT ROWID;

-- Una pieza publicada (reel, carrusel o imagen). id = código del enlace.
CREATE TABLE ig_piezas (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('reel', 'carrusel', 'imagen')),
  publicado TEXT NOT NULL,
  titulo TEXT NOT NULL,
  comentarios INTEGER,
  interacciones INTEGER,
  likes INTEGER,
  alcance INTEGER,
  guardados INTEGER,
  compartidos INTEGER,
  vistas INTEGER,
  seguidores_nuevos INTEGER,
  reproduccion_media_s REAL,
  capturado TEXT NOT NULL
) WITHOUT ROWID;

-- Google Perfil de Empresa por isla y mes.
CREATE TABLE gbp_mensual (
  isla TEXT NOT NULL,
  mes TEXT NOT NULL CHECK (mes GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
  impresiones INTEGER,
  llamadas INTEGER,
  clics_sitio INTEGER,
  como_llegar INTEGER,
  parcial INTEGER NOT NULL DEFAULT 0 CHECK (parcial IN (0, 1)),
  capturado TEXT NOT NULL,
  PRIMARY KEY (isla, mes)
) WITHOUT ROWID;

-- Copia de solo lectura del plan (Notion). Se reemplaza entera en cada carga.
-- No tiene encargado, prioridad ni notas internas: no llegan a esta base.
CREATE TABLE plan_piezas (
  id INTEGER PRIMARY KEY,
  formato TEXT NOT NULL,
  isla TEXT,
  publica TEXT,
  grabar TEXT,
  estado TEXT NOT NULL,
  canales TEXT NOT NULL,
  titulo TEXT NOT NULL,
  hook TEXT,
  cta TEXT,
  falta TEXT NOT NULL DEFAULT '[]',
  enlace TEXT,
  capturado TEXT NOT NULL
);

-- Dinámicas de historias con premio. Sin datos de ganadores.
CREATE TABLE dinamicas (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  mecanica TEXT,
  desde TEXT,
  hasta TEXT,
  premio TEXT,
  participaciones INTEGER,
  resultado TEXT,
  capturado TEXT NOT NULL
);

-- Conteos de los stands que se descuentan (pruebas internas), con motivo.
CREATE TABLE ajustes (
  codigo TEXT NOT NULL,
  origen TEXT NOT NULL,
  dia TEXT NOT NULL,
  hora INTEGER NOT NULL,
  cuenta INTEGER NOT NULL CHECK (cuenta > 0),
  motivo TEXT NOT NULL,
  PRIMARY KEY (codigo, origen, dia, hora)
) WITHOUT ROWID;

-- Conjuntos pequeños guardados enteros (audiencia, reseñas, búsquedas, línea base).
CREATE TABLE documentos (
  clave TEXT PRIMARY KEY,
  fuente TEXT NOT NULL,
  capturado TEXT NOT NULL,
  json TEXT NOT NULL
) WITHOUT ROWID;

-- Registro de cada carga: qué fuente, de qué fecha, cuándo se subió.
CREATE TABLE capturas (
  conjunto TEXT PRIMARY KEY,
  fuente TEXT NOT NULL,
  capturado TEXT NOT NULL,
  cargado TEXT NOT NULL,
  filas INTEGER NOT NULL
) WITHOUT ROWID;
