/**
 * HAVEN ATELIER — Elektro-Symbole (Erweiterung 8 · T3).
 * Genormte, schlichte Elektro-Plansymbole als reine Geometrie (Kreis + Striche),
 * relativ zum Platzierungspunkt in cm. Editor und Aufmaß-PDF nutzen dieselbe Quelle.
 */
import type { ElectroKind, Point } from '../types';
import type { SymbolLine } from './planSymbols';

const R = 9; // Symbolradius in cm

function circle(cx: number, cy: number, r: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= 20; i++) {
    const a = (i / 20) * 2 * Math.PI;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

/**
 * Symbol eines Elektro-Objekts am Punkt (x,y), ausgerichtet nach `angle` (Grad,
 * z. B. Wandrichtung — der „Fuß" des Symbols zeigt zur Wand).
 */
export function electroSymbol(kind: ElectroKind, x: number, y: number, angleDeg = 0): SymbolLine[] {
  const rad = (angleDeg * Math.PI) / 180;
  const rot = (p: Point): Point => ({
    x: x + p.x * Math.cos(rad) - p.y * Math.sin(rad),
    y: y + p.x * Math.sin(rad) + p.y * Math.cos(rad),
  });
  const out: SymbolLine[] = [];
  const push = (pts: Point[], style: SymbolLine['style'] = 'solid') => out.push({ pts: pts.map(rot), style });

  if (kind.startsWith('steckdose')) {
    push(circle(0, 0, R));
    push([{ x: -R, y: 0 }, { x: R, y: 0 }]); // Steckdosen-Querstrich
    const n = kind === 'steckdose2' ? 2 : kind === 'steckdose3' ? 3 : 1;
    for (let i = 1; i < n; i++) push([{ x: -R + (2 * R * i) / n, y: 0 }, { x: -R + (2 * R * i) / n, y: -R * 0.6 }], 'thin');
  } else if (kind === 'schalter' || kind === 'wechsel' || kind === 'doppel') {
    push(circle(0, 0, R));
    push([{ x: 0, y: 0 }, { x: R * 1.3, y: -R * 1.3 }]); // Schalt-Hebel
    if (kind === 'wechsel') push([{ x: R * 0.4, y: -R * 0.9 }, { x: R * 1.1, y: -R * 0.4 }], 'thin');
    if (kind === 'doppel') push([{ x: 0, y: 0 }, { x: R * 1.3, y: R * 0.2 }]);
  } else if (kind === 'deckenauslass' || kind === 'wandauslass') {
    push(circle(0, 0, R));
    push([{ x: -R * 0.7, y: -R * 0.7 }, { x: R * 0.7, y: R * 0.7 }]);
    push([{ x: R * 0.7, y: -R * 0.7 }, { x: -R * 0.7, y: R * 0.7 }]);
  } else if (kind === 'netzwerk' || kind === 'tv') {
    push(circle(0, 0, R));
    push([{ x: -R * 0.5, y: R * 0.4 }, { x: 0, y: -R * 0.5 }, { x: R * 0.5, y: R * 0.4 }], 'thin'); // Antennen-/LAN-Zeichen
    if (kind === 'tv') push([{ x: 0, y: -R * 0.5 }, { x: 0, y: -R }], 'thin');
  } else if (kind === 'herd') {
    push(circle(0, 0, R * 1.1));
    push([{ x: -R * 0.5, y: 0 }, { x: R * 0.5, y: 0 }]);
    push([{ x: 0, y: -R * 0.5 }, { x: 0, y: R * 0.5 }]);
  }
  return out;
}
