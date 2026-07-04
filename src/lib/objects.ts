/**
 * HAVEN ATELIER — Einrichtungs-Geometrie (Erweiterung 8 · T1).
 * REINE Funktionen: Footprint-Polygone je Form (rect/rund/oval/L/frei, rotiert),
 * Abstände Objekt↔Wand und Objekt↔Objekt, Einrasten (Wand bündig/5 cm,
 * Nachbar-Ausrichtung), Skalier-Griffe, Warn-Schwelle für Durchgänge.
 * Der ObjectLayer im PlanEditor ist nur eine Schale um diese Logik.
 */
import type { Floorplan, PlacedObject, Point } from '../types';
import { wallLengthCm } from './geometry';
import { projectOntoWall } from './planEditor';

export const CLEARANCE_WARN_CM = 60;
export const WALL_SNAP_GAPS = [0, 5]; // bündig oder 5 cm Abstand
export const SNAP_DIST = 8; // cm Fangweite

/** Rotation eines Punkts um den Ursprung (Grad, Uhrzeigersinn bei y-nach-unten). */
function rot(p: Point, deg: number): Point {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

/**
 * Footprint eines Objekts als Polygon in WELT-cm (rotiert, um Mittelpunkt).
 * Runde/ovale Formen werden als 24-Eck angenähert (für Abstände völlig ausreichend).
 */
export function objectFootprint(o: PlacedObject): Point[] {
  const local: Point[] = [];
  const w = o.widthCm;
  const d = o.depthCm;
  if (o.shape === 'poly' && o.poly && o.poly.length >= 3) {
    local.push(...o.poly);
  } else if (o.shape === 'rund' || o.shape === 'oval') {
    const rx = w / 2;
    const ry = o.shape === 'rund' ? w / 2 : d / 2;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * 2 * Math.PI;
      local.push({ x: Math.cos(a) * rx, y: Math.sin(a) * ry });
    }
  } else if (o.shape === 'lform') {
    // Haupt-Schenkel w×d, zweiter Schenkel am rechten Ende nach unten (l2.w × l2.d)
    const w2 = Math.min(o.l2?.widthCm ?? d, w);
    const d2 = o.l2?.depthCm ?? d;
    local.push(
      { x: -w / 2, y: -d / 2 },
      { x: w / 2, y: -d / 2 },
      { x: w / 2, y: d / 2 + d2 },
      { x: w / 2 - w2, y: d / 2 + d2 },
      { x: w / 2 - w2, y: d / 2 },
      { x: -w / 2, y: d / 2 },
    );
  } else {
    local.push(
      { x: -w / 2, y: -d / 2 },
      { x: w / 2, y: -d / 2 },
      { x: w / 2, y: d / 2 },
      { x: -w / 2, y: d / 2 },
    );
  }
  return local.map((p) => {
    const q = rot(p, o.rotationDeg);
    return { x: q.x + o.x, y: q.y + o.y };
  });
}

/** Achsen-Bounding-Box eines Polygons. */
export function bbox(poly: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  return {
    minX: Math.min(...poly.map((p) => p.x)),
    minY: Math.min(...poly.map((p) => p.y)),
    maxX: Math.max(...poly.map((p) => p.x)),
    maxY: Math.max(...poly.map((p) => p.y)),
  };
}

/** Kürzester Abstand Punkt↔Strecke. */
function distPointSeg(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y);
}

/** Kürzester Abstand zweier Polygone (0 bei Überlappung wird NICHT erkannt — reicht als Näherung über Kanten). */
export function polyDistance(a: Point[], b: Point[]): number {
  let best = Infinity;
  for (const p of a) for (let i = 0; i < b.length; i++) best = Math.min(best, distPointSeg(p, b[i], b[(i + 1) % b.length]));
  for (const p of b) for (let i = 0; i < a.length; i++) best = Math.min(best, distPointSeg(p, a[i], a[(i + 1) % a.length]));
  return best;
}

export interface WallDistance {
  wallIndex: number;
  distCm: number;
  /** Fußpunkt an der Wand (für die Maßlinie). */
  from: Point;
  to: Point;
}

/** Abstände des Objekts zu den nächsten Wänden (max. die zwei nächsten, sinnvoll für Maßlinien). */
export function nearestWallDistances(fp: Floorplan, o: PlacedObject, maxCount = 2): WallDistance[] {
  const foot = objectFootprint(o);
  const out: WallDistance[] = [];
  for (let i = 0; i < fp.points.length; i++) {
    const a = fp.points[i];
    const b = fp.points[(i + 1) % fp.points.length];
    let best: WallDistance | null = null;
    for (const p of foot) {
      const d = distPointSeg(p, a, b);
      if (!best || d < best.distCm) {
        const { s } = projectOntoWall(fp.points, i, p);
        const len = wallLengthCm(fp.points, i);
        const cl = Math.max(0, Math.min(len, s));
        const footPt = {
          x: a.x + ((b.x - a.x) * cl) / (len || 1),
          y: a.y + ((b.y - a.y) * cl) / (len || 1),
        };
        best = { wallIndex: i, distCm: d, from: p, to: footPt };
      }
    }
    if (best) out.push(best);
  }
  return out.sort((x, y) => x.distCm - y.distCm).slice(0, maxCount);
}

export interface NeighborDistance {
  otherId: string;
  distCm: number;
}

/** Abstände zu den nächsten Nachbarobjekten (Teppiche zählen nicht als Hindernis). */
export function nearestNeighborDistances(
  o: PlacedObject,
  others: PlacedObject[],
  maxCount = 2,
): NeighborDistance[] {
  const foot = objectFootprint(o);
  return others
    .filter((x) => x.id !== o.id && (x.layer ?? 'moebel') !== 'teppich')
    .map((x) => ({ otherId: x.id, distCm: polyDistance(foot, objectFootprint(x)) }))
    .sort((a, b) => a.distCm - b.distCm)
    .slice(0, maxCount);
}

/**
 * Einrasten beim Verschieben: Wand bündig (Abstand 0) oder 5 cm, sowie
 * Ausrichtung an Nachbar-Kanten (bbox-Kanten). Liefert die korrigierte Position.
 */
export function snapObjectPosition(
  fp: Floorplan,
  o: PlacedObject,
  others: PlacedObject[],
  fine = false,
): { x: number; y: number } {
  if (fine) return { x: o.x, y: o.y };
  let dx = 0;
  let dy = 0;
  // Wand-Snap: nur achsparallele Wände (häufigster Fall) exakt einrasten
  const foot = objectFootprint(o);
  const fb = bbox(foot);
  for (let i = 0; i < fp.points.length; i++) {
    const a = fp.points[i];
    const b = fp.points[(i + 1) % fp.points.length];
    if (Math.abs(a.y - b.y) < 0.01) {
      // horizontale Wand
      for (const gap of WALL_SNAP_GAPS) {
        for (const edge of [fb.minY, fb.maxY]) {
          for (const target of [a.y + gap, a.y - gap]) {
            const delta = target - edge;
            if (Math.abs(delta) <= SNAP_DIST && Math.abs(delta) > Math.abs(dy) - 0.001 && dy === 0) dy = delta;
          }
        }
      }
    } else if (Math.abs(a.x - b.x) < 0.01) {
      for (const gap of WALL_SNAP_GAPS) {
        for (const edge of [fb.minX, fb.maxX]) {
          for (const target of [a.x + gap, a.x - gap]) {
            const delta = target - edge;
            if (Math.abs(delta) <= SNAP_DIST && dx === 0) dx = delta;
          }
        }
      }
    }
  }
  // Nachbar-Ausrichtung (Kanten bündig)
  for (const other of others) {
    if (other.id === o.id) continue;
    const ob = bbox(objectFootprint(other));
    for (const [edge, targets] of [
      [fb.minX, [ob.minX, ob.maxX]],
      [fb.maxX, [ob.minX, ob.maxX]],
    ] as [number, number[]][]) {
      for (const tg of targets) {
        const delta = tg - edge;
        if (Math.abs(delta) <= SNAP_DIST && dx === 0) dx = delta;
      }
    }
    for (const [edge, targets] of [
      [fb.minY, [ob.minY, ob.maxY]],
      [fb.maxY, [ob.minY, ob.maxY]],
    ] as [number, number[]][]) {
      for (const tg of targets) {
        const delta = tg - edge;
        if (Math.abs(delta) <= SNAP_DIST && dy === 0) dy = delta;
      }
    }
  }
  return { x: o.x + dx, y: o.y + dy };
}

/** Rotations-Snap auf 15° (free = ohne). */
export function snapRotation(deg: number, free = false): number {
  const norm = ((deg % 360) + 360) % 360;
  return free ? Math.round(norm) : Math.round(norm / 15) * 15 % 360;
}

export type HandleId = 'e' | 'w' | 'n' | 's' | 'ne' | 'nw' | 'se' | 'sw';

/**
 * Skalier-Griff: neue Maße aus der Zeigerposition (in Objekt-Lokalkoordinaten
 * umgerechnet). proportional = Seitenverhältnis halten. Grenzen min/max je Achse.
 */
export function resizeByHandle(
  o: PlacedObject,
  handle: HandleId,
  pointer: Point,
  limits: { minW: number; maxW: number; minD: number; maxD: number },
  proportional = false,
): { widthCm: number; depthCm: number } {
  // Zeiger in Lokalkoordinaten (Rotation herausrechnen)
  const local = rot({ x: pointer.x - o.x, y: pointer.y - o.y }, -o.rotationDeg);
  let w = o.widthCm;
  let d = o.depthCm;
  if (handle.includes('e')) w = Math.max(1, local.x * 2);
  if (handle.includes('w')) w = Math.max(1, -local.x * 2);
  if (handle.includes('s')) d = Math.max(1, local.y * 2);
  if (handle.includes('n')) d = Math.max(1, -local.y * 2);
  if (proportional) {
    const k = Math.max(w / o.widthCm, d / o.depthCm);
    w = o.widthCm * k;
    d = o.depthCm * k;
  }
  w = Math.round(Math.max(limits.minW, Math.min(limits.maxW, w)));
  d = Math.round(Math.max(limits.minD, Math.min(limits.maxD, d)));
  return { widthCm: w, depthCm: d };
}

/** Menge für die Kalkulation: lfm-Typen zählen die Breite in Metern, sonst Stück. */
export function placedQuantity(o: PlacedObject, unit: string): number {
  if (unit === 'lfm') return Math.round((o.widthCm / 100) * 100) / 100;
  return 1;
}

/** Flächeninhalt des Footprints in m² (für FBH-Zonen und Teppiche). */
export function footprintAreaM2(poly: Point[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2 / 10000;
}
