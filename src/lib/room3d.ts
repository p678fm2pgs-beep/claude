/**
 * HAVEN ATELIER — Geometrie-Helfer für die 3D-Raumansicht (Erweiterung: three.js).
 * Reine Funktionen (kein three.js / kein DOM) → unit-getestet.
 * Zerlegt jede Wand in massive „Panels" und lässt Öffnungen frei:
 *  - Tür  → volle Aussparung (Boden bis Decke)
 *  - Fenster → Aussparung im Fensterbereich, Brüstung (unten) + Sturz (oben) bleiben.
 * Maße in Zentimetern; die along-wall-Achse läuft vom Wandanfang (0) bis Wandlänge L.
 */
import type { Floorplan } from '../types';
import { wallLengthCm } from './geometry';

export interface WallPanel {
  /** Position entlang der Wand (cm). */
  x0: number;
  x1: number;
  /** Höhe (cm), 0 = Boden. */
  y0: number;
  y1: number;
}

export function computeWallPanels(plan: Floorplan, wallIndex: number, heightCm: number): WallPanel[] {
  const L = wallLengthCm(plan.points, wallIndex);
  if (L <= 0 || heightCm <= 0) return [];

  const openings = plan.openings
    .filter((o) => o.wallIndex === wallIndex)
    .map((o) => ({
      x0: Math.max(0, Math.min(L, o.offsetCm)),
      x1: Math.max(0, Math.min(L, o.offsetCm + o.widthCm)),
      kind: o.kind,
      sill: Math.max(0, Math.min(heightCm, o.sillCm)),
      top: Math.max(0, Math.min(heightCm, o.sillCm + o.heightCm)),
    }))
    .filter((o) => o.x1 > o.x0)
    .sort((a, b) => a.x0 - b.x0);

  const panels: WallPanel[] = [];

  // 1) Volle Wandstücke zwischen den Öffnungen (Boden..Decke).
  let cursor = 0;
  for (const o of openings) {
    if (o.x0 > cursor) panels.push({ x0: cursor, x1: o.x0, y0: 0, y1: heightCm });
    cursor = Math.max(cursor, o.x1);
  }
  if (cursor < L) panels.push({ x0: cursor, x1: L, y0: 0, y1: heightCm });

  // 2) Brüstung & Sturz bei Fenstern (Türen bleiben offen).
  for (const o of openings) {
    if (o.kind === 'tuer') continue;
    if (o.sill > 0) panels.push({ x0: o.x0, x1: o.x1, y0: 0, y1: o.sill });
    if (o.top < heightCm) panels.push({ x0: o.x0, x1: o.x1, y0: o.top, y1: heightCm });
  }

  return panels;
}

/** Summe der Panel-Flächen (m²) — nützlich für Tests/Plausibilität. */
export function panelsAreaM2(panels: WallPanel[]): number {
  return panels.reduce((s, p) => s + ((p.x1 - p.x0) * (p.y1 - p.y0)) / 10000, 0);
}
