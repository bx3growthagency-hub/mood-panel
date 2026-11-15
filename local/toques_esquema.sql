-- SOLO PARA DESARROLLO LOCAL. Copia del esquema de las tablas de De un tap que
-- el panel lee (bx3-nfc-resenas/migrations 0001, 0003, 0004 y unicos de 0005).
-- Nunca se ejecuta contra la base real: scripts/toques-local.mjs fuerza --local.
DROP TABLE IF EXISTS toques;
DROP TABLE IF EXISTS visitas_directas;
DROP TABLE IF EXISTS clics;
DROP TABLE IF EXISTS unicos;
CREATE TABLE toques (
  codigo TEXT NOT NULL,
  origen TEXT NOT NULL CHECK (origen IN ('nfc', 'qr')),
  dia TEXT NOT NULL,
  hora INTEGER NOT NULL CHECK (hora BETWEEN 0 AND 23),
  cuenta INTEGER NOT NULL DEFAULT 0 CHECK (cuenta >= 0),
  PRIMARY KEY (codigo, origen, dia, hora)
) WITHOUT ROWID;
CREATE TABLE visitas_directas (
  codigo TEXT NOT NULL,
  dia TEXT NOT NULL,
  hora INTEGER NOT NULL CHECK (hora BETWEEN 0 AND 23),
  cuenta INTEGER NOT NULL DEFAULT 0 CHECK (cuenta >= 0),
  PRIMARY KEY (codigo, dia, hora)
) WITHOUT ROWID;
CREATE TABLE clics (
  codigo TEXT NOT NULL,
  destino TEXT NOT NULL,
  dia TEXT NOT NULL,
  hora INTEGER NOT NULL CHECK (hora BETWEEN 0 AND 23),
  cuenta INTEGER NOT NULL DEFAULT 0 CHECK (cuenta >= 0),
  PRIMARY KEY (codigo, destino, dia, hora)
) WITHOUT ROWID;
CREATE TABLE unicos (
  codigo TEXT NOT NULL,
  dia TEXT NOT NULL,
  cuenta INTEGER NOT NULL DEFAULT 0 CHECK (cuenta >= 0),
  PRIMARY KEY (codigo, dia)
) WITHOUT ROWID;
