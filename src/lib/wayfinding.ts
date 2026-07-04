/**
 * HAVEN ATELIER — Laufwege-Check (Erweiterung 8 · T5).
 * REINE Funktion: erzeugt dezente, ignorierbare Qualitäts-Hinweise aus der
 * Raumgeometrie + Einrichtung. Keine Blockade — nur Hinweise mit stabilem
 * Schlüssel (für „ignorieren"). Nutzt dieselbe Schwelle wie die T1-Warnfärbung.
 */
import type { Floorplan, PlacedObject, Point } from '../types';
import { findFurnitureType } from '../data/furniture';
import { objectFootprint, polyDistance, bbox, nearestNeighborDistances, CLEARANCE_WARN_CM } from './objects';
import { pointOnWall } from './planEditor';
import { wallLengthCm } from './geometry';

export type HintKind = 'durchgang' | 'tuer-blockiert' | 'fenster-blockiert' | 'kein-zugang' | 'treppe-verstellt';

export interface Wayhint {
  /** stabiler Schlüssel für „ignorieren" (unabhängig von Reihenfolge). */
  key: string;
  kind: HintKind;
  messageKey: string;
  /** Ankerpunkt (cm) für die Anzeige. */
  at: Point;
}

/** Distanz eines Punkts zum Objekt-Footprint (0 wenn innerhalb-nah). */
function pointToObject(p: Point, o: PlacedObject): number {
  return polyDistance([p], objectFootprint(o));
}

/** Öffnungsmitte in Weltkoordinaten. */
function openingCenter(fp: Floorplan, wallIndex: number, offsetCm: number, widthCm: number): Point {
  return pointOnWall(fp.points, wallIndex, Math.min(wallLengthCm(fp.points, wallIndex), offsetCm + widthCm / 2));
}

/**
 * Erzeugt alle Hinweise. `dismissed` filtert ignorierte weg.
 */
export function checkWayfinding(
  fp: Floorplan,
  placed: PlacedObject[],
  dismissed: string[] = [],
): Wayhint[] {
  const hints: Wayhint[] = [];
  const solid = placed.filter((o) => (o.layer ?? (findFurnitureType(o.typeId)?.place?.rugLayer ? 'teppich' : 'moebel')) !== 'teppich' && !o.bestand);
  const dis = new Set(dismissed);

  // 1) Enge Durchgänge zwischen Möbeln (< 60 cm)
  for (let i = 0; i < solid.length; i++) {
    for (let j = i + 1; j < solid.length; j++) {
      const d = polyDistance(objectFootprint(solid[i]), objectFootprint(solid[j]));
      if (d > 0.5 && d < CLEARANCE_WARN_CM) {
        const key = `durchgang:${[solid[i].id, solid[j].id].sort().join('|')}`;
        if (!dis.has(key)) {
          hints.push({
            key,
            kind: 'durchgang',
            messageKey: 'hint.durchgang',
            at: { x: (solid[i].x + solid[j].x) / 2, y: (solid[i].y + solid[j].y) / 2 },
          });
        }
      }
    }
  }

  // 2) Möbel blockiert Tür / Durchbruch (Objekt näher als 40 cm an der Öffnungsmitte)
  for (const op of fp.openings) {
    if (op.kind === 'fenster') continue;
    const c = openingCenter(fp, op.wallIndex, op.offsetCm, op.widthCm);
    for (const o of solid) {
      if (pointToObject(c, o) < 40) {
        const key = `tuer:${op.id}:${o.id}`;
        if (!dis.has(key)) {
          hints.push({ key, kind: 'tuer-blockiert', messageKey: 'hint.tuerBlockiert', at: c });
        }
        break;
      }
    }
  }

  // 3) Möbel verstellt Fenster (bündig davor, Objekt höher als Brüstung wäre — vereinfachend: Nähe < 15 cm)
  for (const op of fp.openings) {
    if (op.kind !== 'fenster') continue;
    const c = openingCenter(fp, op.wallIndex, op.offsetCm, op.widthCm);
    for (const o of solid) {
      const ft = findFurnitureType(o.typeId);
      if (ft?.place?.category === 'heizkoerper') continue; // Heizkörper unter Fenster ist OK
      if (pointToObject(c, o) < 12 && o.heightCm > op.sillCm) {
        const key = `fenster:${op.id}:${o.id}`;
        if (!dis.has(key)) hints.push({ key, kind: 'fenster-blockiert', messageKey: 'hint.fensterBlockiert', at: c });
        break;
      }
    }
  }

  // 4) Bett/Sofa ohne seitlichen Zugang (~50 cm zu Wand UND Nachbar auf mind. einer Längsseite)
  for (const o of solid) {
    const cat = findFurnitureType(o.typeId)?.place?.category;
    if (cat !== 'bett' && cat !== 'sofa') continue;
    const nb = nearestNeighborDistances(o, solid);
    const b = bbox(objectFootprint(o));
    // Abstand zu den vier Wänden (grob über bbox zu Umriss)
    const wallGap = minWallGap(fp, b);
    const nbGap = nb[0]?.distCm ?? Infinity;
    if (wallGap < 50 && nbGap < 50) {
      const key = `zugang:${o.id}`;
      if (!dis.has(key)) hints.push({ key, kind: 'kein-zugang', messageKey: 'hint.keinZugang', at: { x: o.x, y: o.y } });
    }
  }

  // 5) Treppen-Antritt/Austritt verstellt (Objekt nahe der Treppen-Enden)
  for (const st of solid) {
    if (findFurnitureType(st.typeId)?.place?.category !== 'treppe') continue;
    const foot = objectFootprint(st);
    for (const o of solid) {
      if (o.id === st.id) continue;
      if (polyDistance(foot, objectFootprint(o)) < 40) {
        const key = `treppe:${st.id}:${o.id}`;
        if (!dis.has(key)) hints.push({ key, kind: 'treppe-verstellt', messageKey: 'hint.treppeVerstellt', at: { x: st.x, y: st.y } });
        break;
      }
    }
  }

  return hints;
}

/** Kleinster Abstand einer bbox zu einer Umriss-Wand (Näherung über Kanten). */
function minWallGap(fp: Floorplan, b: { minX: number; minY: number; maxX: number; maxY: number }): number {
  const corners: Point[] = [
    { x: b.minX, y: b.minY }, { x: b.maxX, y: b.minY },
    { x: b.maxX, y: b.maxY }, { x: b.minX, y: b.maxY },
  ];
  let best = Infinity;
  for (let i = 0; i < fp.points.length; i++) {
    const a = fp.points[i];
    const c = fp.points[(i + 1) % fp.points.length];
    for (const cor of corners) best = Math.min(best, distPointSeg(cor, a, c));
  }
  return best;
}

function distPointSeg(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y);
}
