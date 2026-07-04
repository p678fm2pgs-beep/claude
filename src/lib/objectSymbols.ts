/**
 * HAVEN ATELIER — 2D-Draufsichtsymbole der Einrichtung (Erweiterung 8 · T2).
 * Reine Geometrie in WELT-cm (wie planSymbols): fachlich übliche Möblierungs-
 * Symbole je Kategorie. Editor UND Exporte zeichnen dieselben Linien.
 */
import type { PlacedObject, Point } from '../types';
import type { PlacementMeta } from '../data/furniture';
import { objectFootprint } from './objects';
import type { SymbolLine } from './planSymbols';

function rot(p: Point, deg: number): Point {
  const r = (deg * Math.PI) / 180;
  return { x: p.x * Math.cos(r) - p.y * Math.sin(r), y: p.x * Math.sin(r) + p.y * Math.cos(r) };
}

/** Symbol-Linien eines platzierten Objekts (inkl. Umriss). */
export function objectSymbol(o: PlacedObject, meta?: PlacementMeta): SymbolLine[] {
  const out: SymbolLine[] = [];
  const foot = objectFootprint(o);
  out.push({ pts: [...foot, foot[0]], style: (o.layer ?? (meta?.rugLayer ? 'teppich' : 'moebel')) === 'teppich' ? 'dashed' : 'solid' });

  // Lokal → Welt (Innenzeichnung)
  const P = (x: number, y: number): Point => {
    const q = rot({ x, y }, o.rotationDeg);
    return { x: q.x + o.x, y: q.y + o.y };
  };
  const w = o.widthCm;
  const d = o.depthCm;
  const cat = meta?.category ?? 'sonstig';

  if (cat === 'sofa') {
    // Rückenlehne + Armlehnen (Front = +y)
    out.push({ pts: [P(-w / 2 + 6, -d / 2 + 14), P(w / 2 - 6, -d / 2 + 14)], style: 'thin' });
    out.push({ pts: [P(-w / 2 + 12, -d / 2 + 14), P(-w / 2 + 12, d / 2 - 6)], style: 'thin' });
    out.push({ pts: [P(w / 2 - 12, -d / 2 + 14), P(w / 2 - 12, d / 2 - 6)], style: 'thin' });
  } else if (cat === 'bett') {
    // Kissenlinie + Deckenumschlag
    out.push({ pts: [P(-w / 2 + 5, -d / 2 + 30), P(w / 2 - 5, -d / 2 + 30)], style: 'thin' });
    out.push({ pts: [P(-w / 2 + 5, -d / 2 + 55), P(w / 2 - 5, -d / 2 + 55)], style: 'dashed' });
    if (w > 120) out.push({ pts: [P(0, -d / 2 + 5), P(0, -d / 2 + 30)], style: 'thin' });
  } else if (cat === 'schrank') {
    // Frontlinie + Tiefen-Kreuz (übliche Schrank-Signatur)
    out.push({ pts: [P(-w / 2, d / 2 - 4), P(w / 2, d / 2 - 4)], style: 'thin' });
    out.push({ pts: [P(-w / 2, -d / 2), P(w / 2, d / 2)], style: 'thin' });
  } else if (cat === 'tisch' || cat === 'stuhl' || cat === 'sideboard' || cat === 'tv') {
    if (cat === 'stuhl') out.push({ pts: [P(-w / 2 + 3, -d / 2 + 8), P(w / 2 - 3, -d / 2 + 8)], style: 'thin' });
    if (cat === 'tv') out.push({ pts: [P(-w / 2 + 8, -d / 2 + 6), P(w / 2 - 8, -d / 2 + 6)], style: 'solid' });
  } else if (cat === 'kueche') {
    // Arbeitsplatten-Kante + Segmente
    out.push({ pts: [P(-w / 2, -d / 2 + 6), P(w / 2, -d / 2 + 6)], style: 'thin' });
    for (const seg of o.segments ?? []) {
      const sx = -w / 2 + seg.posCm + 30; // Segmentmitte (60er-Raster)
      if (seg.kind === 'spuele') {
        out.push({ pts: circle(sx, 0, 16, P), style: 'thin' });
        out.push({ pts: circle(sx, -d / 2 + 12, 3, P), style: 'thin' });
      } else if (seg.kind === 'kochfeld') {
        for (const [cx, cy] of [[-9, -9], [9, -9], [-9, 9], [9, 9]] as [number, number][]) {
          out.push({ pts: circle(sx + cx, cy, 7, P), style: 'thin' });
        }
      } else if (seg.kind === 'backofen') {
        out.push({ pts: [P(sx - 22, -18), P(sx + 22, -18), P(sx + 22, 18), P(sx - 22, 18), P(sx - 22, -18)], style: 'thin' });
        out.push({ pts: [P(sx - 16, 8), P(sx + 16, 8)], style: 'thin' });
      } else if (seg.kind === 'kuehlschrank') {
        out.push({ pts: [P(sx - 25, -d / 2 + 4), P(sx + 25, -d / 2 + 4), P(sx + 25, d / 2 - 4), P(sx - 25, d / 2 - 4), P(sx - 25, -d / 2 + 4)], style: 'solid' });
        out.push({ pts: [P(sx - 25, 0), P(sx + 25, 0)], style: 'thin' });
      } else if (seg.kind === 'geschirrspueler') {
        out.push({ pts: [P(sx - 22, -18), P(sx + 22, 18)], style: 'thin' });
        out.push({ pts: [P(sx + 22, -18), P(sx - 22, 18)], style: 'thin' });
      } else if (seg.kind === 'dunstabzug') {
        out.push({ pts: circle(sx, 0, 20, P), style: 'dashed' });
      }
    }
  } else if (cat === 'bad') {
    // Innenkontur (Wanne/Dusche/Waschtisch)
    const inset = 8;
    out.push({
      pts: [P(-w / 2 + inset, -d / 2 + inset), P(w / 2 - inset, -d / 2 + inset), P(w / 2 - inset, d / 2 - inset), P(-w / 2 + inset, d / 2 - inset), P(-w / 2 + inset, -d / 2 + inset)],
      style: 'thin',
    });
    out.push({ pts: circle(0, -d / 2 + inset + 8, 3, P), style: 'thin' }); // Ablauf/Armatur
  } else if (cat === 'kamin') {
    // Flammen-Dreieck
    out.push({ pts: [P(-10, 8), P(0, -10), P(10, 8), P(-10, 8)], style: 'thin' });
  } else if (cat === 'heizkoerper') {
    // Schraffur (Glieder)
    const n = Math.max(3, Math.floor(w / 12));
    for (let i = 1; i < n; i++) {
      const x = -w / 2 + (w * i) / n;
      out.push({ pts: [P(x, -d / 2), P(x, d / 2)], style: 'thin' });
    }
  } else if (cat === 'spiegel') {
    // Spiegel-Signatur: Doppellinie + kurze Schräg-Ticks (Glas)
    out.push({ pts: [P(-w / 2 + 4, -1.5), P(w / 2 - 4, -1.5)], style: 'thin' });
    out.push({ pts: [P(-w / 2 + 4, 1.5), P(w / 2 - 4, 1.5)], style: 'thin' });
    for (let i = 0; i < 3; i++) {
      const x = -w / 4 + (i * w) / 4;
      out.push({ pts: [P(x - 4, 3), P(x + 4, -3)], style: 'thin' });
    }
  } else if (cat === 'treppe') {
    // Stufen + Laufrichtungspfeil + Schnittlinie (fachlich korrekt)
    const stepDepth = 27;
    const n = Math.max(3, Math.floor(w / stepDepth));
    for (let i = 1; i < n; i++) {
      const x = -w / 2 + (w * i) / n;
      out.push({ pts: [P(x, -d / 2), P(x, d / 2)], style: 'thin' });
    }
    // Lauflinie mit Pfeil (Antritt links)
    out.push({ pts: [P(-w / 2 + 10, 0), P(w / 2 - 14, 0)], style: 'solid' });
    out.push({ pts: [P(w / 2 - 22, -6), P(w / 2 - 12, 0), P(w / 2 - 22, 6)], style: 'solid' });
    out.push({ pts: circle(-w / 2 + 10, 0, 3, P), style: 'thin' });
    // Schnittlinie (Diagonale, gestrichelt) im oberen Drittel
    out.push({ pts: [P(w / 6, -d / 2), P(w / 3, d / 2)], style: 'dashed' });
  } else if (cat === 'leuchte') {
    out.push({ pts: [P(-8, -8), P(8, 8)], style: 'thin' });
    out.push({ pts: [P(8, -8), P(-8, 8)], style: 'thin' });
  }

  return out;

  function circle(cx: number, cy: number, r: number, PP: (x: number, y: number) => Point): Point[] {
    const pts: Point[] = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * 2 * Math.PI;
      pts.push(PP(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
    return pts;
  }
}
