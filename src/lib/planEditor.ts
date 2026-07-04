/**
 * HAVEN ATELIER — Editor-Logik für den interaktiven Grundriss (Erweiterung 7).
 * REINE Funktionen (kein DOM): Projektion auf Wandachsen, Kollisionsschutz,
 * Einrasten, Wand-Wechsel. Vollständig unit-getestet — der PlanEditor
 * (SVG/Pointer) ist nur eine dünne Schale um diese Logik.
 */
import type { Floorplan, Opening, Point } from '../types';
import { wallLengthCm, distanceCm } from './geometry';

/** Projektion eines Punkts auf die Wandachse i: Position s (cm, unbegrenzt) + Abstand. */
export function projectOntoWall(
  points: Point[],
  wallIndex: number,
  p: Point,
): { s: number; distCm: number } {
  const a = points[wallIndex % points.length];
  const b = points[(wallIndex + 1) % points.length];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { s: 0, distCm: distanceCm(a, p) };
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  const len = Math.sqrt(len2);
  const foot = { x: a.x + dx * t, y: a.y + dy * t };
  return { s: t * len, distCm: distanceCm(foot, p) };
}

/** Punkt auf der Wandachse bei Position s (cm). */
export function pointOnWall(points: Point[], wallIndex: number, s: number): Point {
  const a = points[wallIndex % points.length];
  const b = points[(wallIndex + 1) % points.length];
  const len = wallLengthCm(points, wallIndex) || 1;
  return { x: a.x + ((b.x - a.x) * s) / len, y: a.y + ((b.y - a.y) * s) / len };
}

/**
 * Kollisionsschutz: begrenzt den gewünschten Offset einer Öffnung so, dass sie
 * (a) die Wand nie verlässt und (b) keine andere Öffnung derselben Wand überlappt
 * (sanfter Stopp am Nachbarn).
 */
export function clampOpeningOffset(
  plan: Floorplan,
  wallIndex: number,
  widthCm: number,
  desired: number,
  ignoreId?: string,
): number {
  const len = wallLengthCm(plan.points, wallIndex);
  let lo = 0;
  let hi = Math.max(0, len - widthCm);
  const others = plan.openings
    .filter((o) => o.wallIndex === wallIndex && o.id !== ignoreId)
    .sort((a, b) => a.offsetCm - b.offsetCm);
  for (const o of others) {
    const oEnd = o.offsetCm + o.widthCm;
    if (oEnd <= desired) lo = Math.max(lo, oEnd); // Nachbar links
    else if (o.offsetCm >= desired + widthCm) hi = Math.min(hi, o.offsetCm - widthCm); // rechts
    else {
      // Zielbereich überlappt → auf die nähere freie Seite ausweichen
      const leftSlot = o.offsetCm - widthCm;
      const rightSlot = oEnd;
      const dLeft = Math.abs(desired - leftSlot);
      const dRight = Math.abs(desired - rightSlot);
      if (dLeft <= dRight && leftSlot >= lo) hi = Math.min(hi, leftSlot);
      else lo = Math.max(lo, rightSlot);
    }
  }
  if (lo > hi) return Math.max(0, Math.min(desired, len - widthCm)); // kein Platz — nur Wandgrenzen
  return Math.max(lo, Math.min(hi, desired));
}

/**
 * Einrasten des Offsets: Wandmitte (Fangweite 6 cm) und Raster
 * (10 cm; fein = 1 cm mit Modifiertaste).
 */
export function snapOffset(
  offset: number,
  widthCm: number,
  wallLenCm: number,
  fine = false,
): number {
  const centerOffset = (wallLenCm - widthCm) / 2;
  if (!fine && Math.abs(offset - centerOffset) < 6) return centerOffset;
  const grid = fine ? 1 : 10;
  return Math.round(offset / grid) * grid;
}

/**
 * Kompletter Drag-Schritt: Mausposition → neuer Offset auf der Wand
 * (Projektion, Zentrierung am Cursor, Einrasten, Kollisionsschutz).
 */
export function dragOpeningTo(
  plan: Floorplan,
  openingId: string,
  wallIndex: number,
  pointer: Point,
  fine = false,
): number {
  const o = plan.openings.find((x) => x.id === openingId);
  if (!o) return 0;
  const { s } = projectOntoWall(plan.points, wallIndex, pointer);
  const len = wallLengthCm(plan.points, wallIndex);
  const snapped = snapOffset(s - o.widthCm / 2, o.widthCm, len, fine);
  return clampOpeningOffset(plan, wallIndex, o.widthCm, snapped, openingId);
}

/**
 * Wand-Wechsel-Kandidat: nächstgelegene Wand, wenn der Zeiger nahe genug an ihr
 * und deutlich weiter von der aktuellen Wand entfernt ist. null = kein Wechsel.
 */
export function wallSwitchCandidate(
  points: Point[],
  pointer: Point,
  currentWall: number,
  thresholdCm = 40,
): number | null {
  let best: { i: number; dist: number } | null = null;
  for (let i = 0; i < points.length; i++) {
    const { s, distCm } = projectOntoWall(points, i, pointer);
    const len = wallLengthCm(points, i);
    if (s < 0 || s > len) continue; // nur echte Fußpunkte auf der Wand
    if (!best || distCm < best.dist) best = { i, dist: distCm };
  }
  if (!best || best.i === currentWall) return null;
  if (best.dist > thresholdCm) return null;
  const current = projectOntoWall(points, currentWall, pointer);
  // Nur wechseln, wenn die andere Wand klar näher ist als die aktuelle.
  return best.dist < current.distCm * 0.8 ? best.i : null;
}

/** Eck-Abstände einer Öffnung (links = zum Wandanfang, rechts = zum Wandende). */
export function cornerDistances(
  plan: Floorplan,
  o: Opening,
): { leftCm: number; rightCm: number } {
  const len = wallLengthCm(plan.points, o.wallIndex);
  return { leftCm: o.offsetCm, rightCm: Math.max(0, len - o.offsetCm - o.widthCm) };
}

/** Exakte Eck-Eingabe: setzt den Offset über den linken ODER rechten Abstand. */
export function offsetFromCorner(
  plan: Floorplan,
  o: Opening,
  side: 'links' | 'rechts',
  valueCm: number,
): number {
  const len = wallLengthCm(plan.points, o.wallIndex);
  const desired = side === 'links' ? valueCm : len - valueCm - o.widthCm;
  return clampOpeningOffset(plan, o.wallIndex, o.widthCm, desired, o.id);
}
