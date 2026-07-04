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

// ═══════════ Erweiterung 7 · W4: freies Wand-Werkzeug ═══════════
import type { InnerWall } from '../types';

/** Fangkandidaten für einen Wandpunkt: Ecken, Wand-Fußpunkte, Wandmitten, Raster. */
export function snapWallPoint(
  points: Point[],
  innerWalls: InnerWall[] | undefined,
  p: Point,
  gridCm = 10,
  snapDistCm = 15,
): Point {
  let best: { pt: Point; d: number } | null = null;
  const consider = (pt: Point) => {
    const d = Math.hypot(pt.x - p.x, pt.y - p.y);
    if (d <= snapDistCm && (!best || d < best.d)) best = { pt, d };
  };
  // Ecken + Wandmitten des Umrisses
  for (let i = 0; i < points.length; i++) {
    consider(points[i]);
    const b = points[(i + 1) % points.length];
    consider({ x: (points[i].x + b.x) / 2, y: (points[i].y + b.y) / 2 });
  }
  // Endpunkte bestehender Innenwände
  for (const w of innerWalls ?? []) {
    consider(w.a);
    consider(w.b);
  }
  if (best !== null) return (best as { pt: Point; d: number }).pt;
  // Fußpunkt auf der nächstgelegenen Umriss-Wand (Punkt liegt AUF der Wandlinie)
  for (let i = 0; i < points.length; i++) {
    const { s, distCm } = projectOntoWall(points, i, p);
    const len = wallLengthCm(points, i);
    if (distCm <= snapDistCm && s >= 0 && s <= len) {
      return pointOnWall(points, i, Math.round(s / gridCm) * gridCm);
    }
  }
  // Raster
  return { x: Math.round(p.x / gridCm) * gridCm, y: Math.round(p.y / gridCm) * gridCm };
}

/** Winkel-Einrasten der Zugrichtung auf 0/45/90° (free = ohne Einrasten). */
export function snapWallDirection(a: Point, raw: Point, free = false): Point {
  if (free) return raw;
  const dx = raw.x - a.x;
  const dy = raw.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return raw;
  const angle = Math.atan2(dy, dx);
  const step = Math.PI / 4; // 45°
  const snapped = Math.round(angle / step) * step;
  return { x: a.x + Math.cos(snapped) * len, y: a.y + Math.sin(snapped) * len };
}

/** Punkt in exakter Länge (cm) entlang der aktuellen Zugrichtung. */
export function exactLengthPoint(a: Point, towards: Point, lengthCm: number): Point {
  const dx = towards.x - a.x;
  const dy = towards.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: a.x + (dx / len) * lengthCm, y: a.y + (dy / len) * lengthCm };
}

/** Liegt der Punkt (Toleranz cm) auf einer Umriss-Wand? → { wallIndex, s } */
export function pointOnBoundary(
  points: Point[],
  p: Point,
  tolCm = 2,
): { wallIndex: number; s: number } | null {
  for (let i = 0; i < points.length; i++) {
    const { s, distCm } = projectOntoWall(points, i, p);
    const len = wallLengthCm(points, i);
    if (distCm <= tolCm && s >= tolCm && s <= len - tolCm) return { wallIndex: i, s };
  }
  return null;
}

export interface PolygonSplit {
  polyA: Point[];
  polyB: Point[];
}

/**
 * Teilt ein Polygon durch eine Sehne cutA→cutB (beide Punkte auf verschiedenen
 * Umriss-Wänden). null, wenn die Punkte nicht auf zwei verschiedenen Wänden liegen.
 */
export function splitPolygon(points: Point[], cutA: Point, cutB: Point): PolygonSplit | null {
  const ha = pointOnBoundary(points, cutA);
  const hb = pointOnBoundary(points, cutB);
  if (!ha || !hb || ha.wallIndex === hb.wallIndex) return null;
  const n = points.length;
  let ia = ha.wallIndex;
  let ib = hb.wallIndex;
  let A = cutA;
  let B = cutB;
  if (ia > ib) {
    // normieren: ia < ib (A auf der früheren Wand)
    [ia, ib] = [ib, ia];
    [A, B] = [B, A];
  }
  // polyA: A → pts[ia+1 … ib] → B
  const polyA: Point[] = [A];
  for (let k = ia + 1; k <= ib; k++) polyA.push(points[k % n]);
  polyA.push(B);
  // polyB: B → pts[ib+1 … ia (über 0)] → A
  const polyB: Point[] = [B];
  for (let k = ib + 1; k <= ia + n; k++) polyB.push(points[k % n]);
  polyB.push(A);
  if (polyA.length < 3 || polyB.length < 3) return null;
  return { polyA, polyB };
}

/**
 * Ordnet nach einer Teilung jede Öffnung dem richtigen Teil-Polygon zu und
 * berechnet wallIndex/offset neu (über den Mittelpunkt der Öffnung).
 */
export function reassignOpenings(
  openings: Opening[],
  original: Point[],
  polyA: Point[],
  polyB: Point[],
): { forA: Opening[]; forB: Opening[] } {
  const forA: Opening[] = [];
  const forB: Opening[] = [];
  for (const o of openings) {
    const len = wallLengthCm(original, o.wallIndex);
    const mid = pointOnWall(original, o.wallIndex, Math.min(len, o.offsetCm + o.widthCm / 2));
    const inA = locate(polyA, mid);
    const inB = locate(polyB, mid);
    const target = inA && (!inB || inA.distCm <= inB.distCm) ? 'A' : inB ? 'B' : null;
    if (!target) continue;
    const hit = target === 'A' ? inA! : inB!;
    const poly = target === 'A' ? polyA : polyB;
    const wallLen = wallLengthCm(poly, hit.wallIndex);
    const newOffset = Math.max(0, Math.min(wallLen - o.widthCm, hit.s - o.widthCm / 2));
    const copy: Opening = { ...o, wallIndex: hit.wallIndex, offsetCm: newOffset };
    (target === 'A' ? forA : forB).push(copy);
  }
  return { forA, forB };

  function locate(poly: Point[], p: Point): { wallIndex: number; s: number; distCm: number } | null {
    let best: { wallIndex: number; s: number; distCm: number } | null = null;
    for (let i = 0; i < poly.length; i++) {
      const { s, distCm } = projectOntoWall(poly, i, p);
      const len = wallLengthCm(poly, i);
      if (s < -1 || s > len + 1) continue;
      if (distCm <= 3 && (!best || distCm < best.distCm)) best = { wallIndex: i, s: Math.max(0, Math.min(len, s)), distCm };
    }
    return best;
  }
}

// ═══════════ Erweiterung 7 · W5: Wand teilen / löschen (zentraler Remapper) ═══════════
import type { Room, WallProps } from '../types';

/**
 * EIN zentraler Remapper für ALLE wandgebundenen Verweise eines Raums
 * (wallProps, wallColors, MaterialSelection.wallIndex, LightSelection.wallIndices).
 * map(alt) → neu oder null (Verweis entfällt). Verhindert stille Inkonsistenzen.
 */
export function remapWallRefs(room: Room, map: (i: number) => number | null): void {
  const fp = room.floorplan;
  if (fp.wallProps) {
    const next: Record<number, WallProps> = {};
    for (const [k, v] of Object.entries(fp.wallProps)) {
      const m = map(Number(k));
      if (m !== null) next[m] = v;
    }
    fp.wallProps = next;
  }
  for (const v of room.variants) {
    if (v.wallColors) {
      const next: Record<number, string> = {};
      for (const [k, c] of Object.entries(v.wallColors)) {
        const m = map(Number(k));
        if (m !== null) next[m] = c;
      }
      v.wallColors = next;
    }
    for (const sel of v.materials) {
      if (sel.wallIndex !== undefined) {
        const m = map(sel.wallIndex);
        if (m === null) delete sel.wallIndex;
        else sel.wallIndex = m;
      }
    }
    for (const l of v.lights ?? []) {
      if (l.wallIndices) {
        l.wallIndices = l.wallIndices
          .map((i) => map(i))
          .filter((x): x is number => x !== null);
      }
    }
  }
}

/**
 * Teilt Umriss-Wand wallIndex am Punkt atCm in zwei Segmente.
 * Öffnungen bleiben auf ihrem Segment (Offset umgerechnet), Eigenschaften/Farben
 * der Wand gelten für beide Segmente weiter. false bei zu randnahem Klickpunkt.
 */
export function splitWallAt(room: Room, wallIndex: number, atCm: number): boolean {
  const fp = room.floorplan;
  const len = wallLengthCm(fp.points, wallIndex);
  if (atCm < 5 || atCm > len - 5) return false;
  const p = pointOnWall(fp.points, wallIndex, atCm);
  fp.points = [...fp.points.slice(0, wallIndex + 1), p, ...fp.points.slice(wallIndex + 1)];
  for (const o of fp.openings) {
    if (o.wallIndex > wallIndex) o.wallIndex += 1;
    else if (o.wallIndex === wallIndex) {
      const mid = o.offsetCm + o.widthCm / 2;
      if (mid > atCm) {
        o.wallIndex += 1;
        o.offsetCm = Math.max(0, o.offsetCm - atCm);
      }
      const segLen = wallLengthCm(fp.points, o.wallIndex);
      o.offsetCm = Math.max(0, Math.min(Math.max(0, segLen - o.widthCm), o.offsetCm));
    }
  }
  remapWallRefs(room, (i) => (i > wallIndex ? i + 1 : i));
  // Zweites Segment erbt Eigenschaften/Farbe des ersten:
  const props = fp.wallProps?.[wallIndex];
  if (props) fp.wallProps = { ...fp.wallProps, [wallIndex + 1]: { ...props } };
  for (const v of room.variants) {
    const c = v.wallColors?.[wallIndex];
    if (c) v.wallColors = { ...v.wallColors, [wallIndex + 1]: c };
  }
  return true;
}

/**
 * Löscht Umriss-Wand wallIndex: Eckpunkt wallIndex+1 entfällt, die Wand
 * verschmilzt mit der Folgewand. Öffnungen auf beiden betroffenen Wänden werden
 * entfernt (Anzahl im Ergebnis — für den Bestätigungsdialog VORHER zählen).
 * null bei Dreieck (Minimum) — dann ist Löschen nicht möglich.
 */
export function deleteWall(room: Room, wallIndex: number): { removedOpenings: number } | null {
  const fp = room.floorplan;
  const n = fp.points.length;
  if (n <= 3) return null;
  const v = (wallIndex + 1) % n;
  const mergedNew = v === 0 ? n - 2 : v - 1;
  const before = fp.openings.length;
  fp.openings = fp.openings.filter((o) => o.wallIndex !== wallIndex && o.wallIndex !== v);
  const removedOpenings = before - fp.openings.length;
  fp.points = fp.points.filter((_, idx) => idx !== v);
  const map = (k: number): number | null => {
    if (k === wallIndex || k === v) return mergedNew;
    return k > v ? k - 1 : k;
  };
  for (const o of fp.openings) {
    const m = map(o.wallIndex);
    if (m !== null) o.wallIndex = m;
  }
  remapWallRefs(room, map);
  return { removedOpenings };
}

/** Anzahl Öffnungen, die ein Wand-Löschen entfernen würde (für den Dialog). */
export function openingsOnWallPair(fp: Floorplan, wallIndex: number): number {
  const v = (wallIndex + 1) % fp.points.length;
  return fp.openings.filter((o) => o.wallIndex === wallIndex || o.wallIndex === v).length;
}
