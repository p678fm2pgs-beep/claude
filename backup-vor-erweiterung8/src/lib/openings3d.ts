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
  /** (Erweiterung 7) Versatz senkrecht zur Wandmitte in cm (z. B. Schiebetür VOR der Wand). */
  depthOffsetCm?: number;
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
      // Flügelteilung (Erweiterung 7): explizite Flügelzahl, sonst wie bisher ab 140 cm.
      const wings = o.wings ?? (w > 140 ? 2 : 1);
      for (let i = 1; i < wings; i++) {
        const mx = x0 + (w * i) / wings;
        parts.push({ kind: 'mullion', x0: mx - FRAME / 2, x1: mx + FRAME / 2, y0: gy0, y1: gy1, depthCm: FRAME_DEPTH });
      }
      // Sprossen (Erweiterung 7): zwei dezente Querstäbe.
      if (o.muntins) {
        for (let i = 1; i <= 2; i++) {
          const my = gy0 + ((gy1 - gy0) * i) / 3;
          parts.push({ kind: 'mullion', x0: gx0, x1: gx1, y0: my - 1.5, y1: my + 1.5, depthCm: GLASS_DEPTH + 1 });
        }
      }
    }
  } else if (o.kind === 'durchbruch') {
    // Offener Wanddurchbruch: nur Laibungs-Zargen, KEIN Blatt, kein Glas.
    const top = clamp(o.heightCm > 0 ? o.heightCm + o.sillCm : 210, 0, heightCm);
    parts.push({ kind: 'frame', x0, x1: Math.min(x0 + FRAME / 2, x1), y0: o.sillCm, y1: top, depthCm: FRAME_DEPTH - 2 });
    parts.push({ kind: 'frame', x0: Math.max(x1 - FRAME / 2, x0), x1, y0: o.sillCm, y1: top, depthCm: FRAME_DEPTH - 2 });
    parts.push({ kind: 'frame', x0, x1, y0: Math.max(top - FRAME / 2, 0), y1: top, depthCm: FRAME_DEPTH - 2 });
  } else {
    // Tür: Zarge (links/rechts/oben, KEIN Bodenbalken) + Türblatt je nach Typ
    const top = clamp(o.heightCm > 0 ? o.heightCm + o.sillCm : 210, 0, heightCm);
    parts.push({ kind: 'frame', x0, x1: Math.min(x0 + FRAME, x1), y0: 0, y1: top, depthCm: FRAME_DEPTH }); // links
    parts.push({ kind: 'frame', x0: Math.max(x1 - FRAME, x0), x1, y0: 0, y1: top, depthCm: FRAME_DEPTH }); // rechts
    parts.push({ kind: 'frame', x0, x1, y0: Math.max(top - FRAME, 0), y1: top, depthCm: FRAME_DEPTH }); // oben

    const dt = o.doorType ?? 'dreh';
    const hingeLeft = (o.hinge ?? 'links') === 'links';
    const inwardSign = (o.opensInward ?? true) ? 1 : -1;
    const lx0 = x0 + FRAME;
    const lx1 = x1 - FRAME;
    const ly1 = top - FRAME;
    const leafW = lx1 - lx0;

    if (leafW > 0 && ly1 > 0 && dt !== 'durchgang') {
      if (dt === 'doppel') {
        // Zwei Flügel, mittige Fuge; beide leicht angelehnt (Spalt in der Mitte).
        const gap = Math.min(6, leafW * 0.04);
        parts.push({ kind: 'leaf', x0: lx0, x1: lx0 + leafW / 2 - gap, y0: 0, y1: ly1, depthCm: LEAF_DEPTH });
        parts.push({ kind: 'leaf', x0: lx0 + leafW / 2 + gap, x1: lx1, y0: 0, y1: ly1, depthCm: LEAF_DEPTH });
      } else if (dt === 'schiebe') {
        // Blatt als Ebene VOR der Wand, zur Laufseite (Anschlag) verschoben.
        const shift = leafW * 0.25;
        const sx0 = hingeLeft ? lx0 - shift : lx0 + shift;
        parts.push({ kind: 'leaf', x0: sx0, x1: sx0 + leafW, y0: 0, y1: ly1, depthCm: LEAF_DEPTH, depthOffsetCm: 10 * inwardSign });
      } else if (dt === 'pocket') {
        // Blatt halb in der Wandtasche → nur die sichtbare Hälfte in der Öffnung.
        const half = leafW / 2;
        const px0 = hingeLeft ? lx0 : lx0 + half;
        parts.push({ kind: 'leaf', x0: px0, x1: px0 + half, y0: 0, y1: ly1, depthCm: LEAF_DEPTH });
      } else if (dt === 'falt') {
        // Vier Paneele mit feinen Fugen (gefaltete Optik).
        const seg = leafW / 4;
        for (let i = 0; i < 4; i++) {
          parts.push({ kind: 'leaf', x0: lx0 + seg * i + 1, x1: lx0 + seg * (i + 1) - 1, y0: 0, y1: ly1, depthCm: LEAF_DEPTH + (i % 2 === 0 ? 2 : 0) });
        }
      } else {
        // Drehtür: leicht geöffnet — Spalt an der Griffseite zeigt den Anschlag,
        // Blatt minimal aus der Wandmitte versetzt (öffnet nach innen/außen).
        const ajar = Math.min(14, leafW * 0.15);
        const dx0 = hingeLeft ? lx0 : lx0 + ajar;
        const dx1 = hingeLeft ? lx1 - ajar : lx1;
        parts.push({ kind: 'leaf', x0: dx0, x1: dx1, y0: 0, y1: ly1, depthCm: LEAF_DEPTH, depthOffsetCm: 4 * inwardSign });
      }
    }
  }

  return parts;
}
