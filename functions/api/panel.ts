// Datos del panel de Mood: GET /api/panel. Ver lib/panel.ts.
import { manejarPanel, type Contexto } from "../../lib/panel";

export const onRequest = (contexto: Contexto) => manejarPanel(contexto);
