/**
 * HAVEN ATELIER — Erweiterung 5: 3D-Bauteile für Öffnungen (Fenster/Türen).
 * Reine Geometrie (kein three.js/DOM) → unit-getestet.
 * Liefert die „Teile" einer Öffnung in along-wall (x) × Höhe (y) Koordinaten (cm),
 * die der 3D-Renderer als flache Boxen in die Wandebene setzt — so sind die Löcher
 * mit Rahmen, Glas (Fenster) bzw. Türblatt (Tür) gefüllt.
 */
import type { Opening } from '../types';

export type OpeningPartKind = 'frame' | 'glass' | 'leaf' | 'mullion';

export interface OpeningPart {
  kind: OpeningPartKind;
  x0: number; // cm entlang der Wand (vom Wandanfang)
  x1: number;
  y0: number; // cm Höhe ab Boden
  y1: number;
  depthCm: number; // Dicke in die Wand
}

const FRAME = 6; // Rahmenbreite cm
const FRAME_DEPTH = 14; // Rahmen etwas tiefer als Wand (12 cm) → tritt leicht hervor
const GLASS_DEPTH = 2;
const LEAF_DEPTH = 5;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function computeOpeningParts(o: Opening, wallLenCm: number, heightCm: number): OpeningPart[] {
  const x0 = clamp(o.offsetCm, 0, wallLenCm);
  const x1 = clamp(o.offsetCm + o.widthCm, 0, wallLenCm);
  const w = x1 - x0;
  if (w <= 0) return [];

  const parts: OpeningPart[] = [];

  if (o.kind === 'fenster') {
    const sill = clamp(o.sillCm, 0, heightCm);
    const top = clamp(o.sillCm + o.heightCm, 0, heightCm);
    if (top - sill <= 0) return [];
    // Rahmen (4 Balken)
    parts.push({ kind: 'frame', x0, x1: Math.min(x0 + FRAME, x1), y0: sill, y1: top, depthCm: FRAME_DEPTH }); // links
    parts.push({ kind: 'frame', x0: Math.max(x1 - FRAME, x0), x1, y0: sill, y1: top, depthCm: FRAME_DEPTH }); // rechts
    parts.push({ kind: 'frame', x0, x1, y0: Math.max(top - FRAME, sill), y1: top, depthCm: FRAME_DEPTH }); // oben
    parts.push({ kind: 'frame', x0, x1, y0: sill, y1: Math.min(sill + FRAME, top), depthCm: FRAME_DEPTH }); // unten
    // Glas (innerhalb des Rahmens)
    const gx0 = x0 + FRAME;
    const gx1 = x1 - FRAME;
    const gy0 = sill + FRAME;
    const gy1 = top - FRAME;
    if (gx1 > gx0 && gy1 > gy0) {
      parts.push({ kind: 'glass', x0: gx0, x1: gx1, y0: gy0, y1: gy1, depthCm: GLASS_DEPTH });
      // Sprosse bei breiten Fenstern (Dreh-Kipp-Optik)
      if (w > 140) {
        const mx = (x0 + x1) / 2;
        parts.push({ kind: 'mullion', x0: mx - FRAME / 2, x1: mx + FRAME / 2, y0: gy0, y1: gy1, depthCm: FRAME_DEPTH });
      }
    }
  } else {
    // Tür: Zarge (links/rechts/oben, KEIN Bodenbalken) + Türblatt
    const top = clamp(o.heightCm > 0 ? o.heightCm + o.sillCm : 210, 0, heightCm);
    parts.push({ kind: 'frame', x0, x1: Math.min(x0 + FRAME, x1), y0: 0, y1: top, depthCm: FRAME_DEPTH }); // links
    parts.push({ kind: 'frame', x0: Math.max(x1 - FRAME, x0), x1, y0: 0, y1: top, depthCm: FRAME_DEPTH }); // rechts
    parts.push({ kind: 'frame', x0, x1, y0: Math.max(top - FRAME, 0), y1: top, depthCm: FRAME_DEPTH }); // oben
    // Türblatt (leicht eingerückt)
    const lx0 = x0 + FRAME;
    const lx1 = x1 - FRAME;
    const ly1 = top - FRAME;
    if (lx1 > lx0 && ly1 > 0) {
      parts.push({ kind: 'leaf', x0: lx0, x1: lx1, y0: 0, y1: ly1, depthCm: LEAF_DEPTH });
    }
  }

  return parts;
}
