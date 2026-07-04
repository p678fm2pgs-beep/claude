/**
 * Geometrie-Engine für den Grundriss-Editor.
 * Alle Eingaben in Zentimetern, Flächen in Quadratmetern, Längen in Metern.
 * Deterministisch & vollständig unit-getestet.
 */
import type { Floorplan, Point, Opening, InnerWall } from '../types';

export const CM_PER_M = 100;

/** Abstand zweier Punkte in cm. */
export function distanceCm(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Polygonfläche (Gauß'sche Trapezformel / Shoelace) in m². */
export function polygonAreaM2(points: Point[]): number {
  if (points.length < 3) return 0;
  let twiceArea = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    twiceArea += a.x * b.y - b.x * a.y;
  }
  const areaCm2 = Math.abs(twiceArea) / 2;
  return areaCm2 / (CM_PER_M * CM_PER_M);
}

/** Umfang des Polygons in m. */
export function perimeterM(points: Point[]): number {
  if (points.length < 2) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    sum += distanceCm(points[i], points[(i + 1) % points.length]);
  }
  return sum / CM_PER_M;
}

/** Länge einer einzelnen Wand (Kante i → i+1) in cm. */
export function wallLengthCm(points: Point[], wallIndex: number): number {
  if (points.length < 2) return 0;
  const a = points[wallIndex % points.length];
  const b = points[(wallIndex + 1) % points.length];
  return distanceCm(a, b);
}

/** Summe aller Öffnungsflächen einer Wand in m². */
export function openingAreaOnWallM2(openings: Opening[], wallIndex: number): number {
  return openings
    .filter((o) => o.wallIndex === wallIndex)
    .reduce((sum, o) => sum + (o.widthCm * o.heightCm) / (CM_PER_M * CM_PER_M), 0);
}

/** Gesamte Öffnungsfläche in m². */
export function totalOpeningAreaM2(openings: Opening[]): number {
  return openings.reduce((sum, o) => sum + (o.widthCm * o.heightCm) / (CM_PER_M * CM_PER_M), 0);
}

/**
 * Anstrichfläche einer Innenwand in m² — BEIDSEITIG (Raumteiler werden von
 * beiden Seiten gestrichen); halbhohe Wände mit eigener Höhe. (Erweiterung 7)
 */
export function innerWallAreaM2(w: InnerWall, roomHeightCm: number): number {
  const len = Math.hypot(w.b.x - w.a.x, w.b.y - w.a.y) / CM_PER_M;
  const h = (w.wallType === 'halbhoch' ? (w.heightCm ?? 110) : roomHeightCm) / CM_PER_M;
  return 2 * len * h;
}

/** Summe aller Innenwand-Flächen eines Plans in m². (Erweiterung 7) */
export function innerWallsAreaM2(plan: Floorplan, heightCm: number): number {
  return (plan.innerWalls ?? []).reduce((sum, w) => sum + innerWallAreaM2(w, heightCm), 0);
}

/**
 * Netto-Wandfläche in m²: Umfang × Höhe − Σ Öffnungen + Innenwände (beidseitig).
 * Nie negativ. Altpläne ohne Innenwände liefern exakt die bisherigen Werte.
 */
export function netWallAreaM2(plan: Floorplan, heightCm: number): number {
  const grossM2 = perimeterM(plan.points) * (heightCm / CM_PER_M);
  const net = grossM2 - totalOpeningAreaM2(plan.openings) + innerWallsAreaM2(plan, heightCm);
  return Math.max(0, round2(net));
}

/** Netto-Wandfläche einer einzelnen Wand in m². */
export function netWallAreaForWallM2(plan: Floorplan, wallIndex: number, heightCm: number): number {
  const grossM2 = (wallLengthCm(plan.points, wallIndex) / CM_PER_M) * (heightCm / CM_PER_M);
  const net = grossM2 - openingAreaOnWallM2(plan.openings, wallIndex);
  return Math.max(0, round2(net));
}

export interface DerivedAreas {
  floorAreaM2: number;
  ceilingAreaM2: number;
  perimeterM: number;
  netWallAreaM2: number;
  wallCount: number;
}

/** Alle abgeleiteten Flächen eines Raumes live berechnen. */
export function deriveAreas(plan: Floorplan, heightCm: number): DerivedAreas {
  const floor = round2(polygonAreaM2(plan.points));
  return {
    floorAreaM2: floor,
    ceilingAreaM2: floor,
    perimeterM: round2(perimeterM(plan.points)),
    netWallAreaM2: netWallAreaM2(plan, heightCm),
    wallCount: plan.points.length,
  };
}

/** Sockelleisten-Länge: Umfang − Σ Türbreiten, in m. */
export function skirtingLengthM(plan: Floorplan): number {
  const doorWidthsCm = plan.openings
    .filter((o) => o.kind === 'tuer')
    .reduce((sum, o) => sum + o.widthCm, 0);
  const m = perimeterM(plan.points) - doorWidthsCm / CM_PER_M;
  return Math.max(0, round2(m));
}

/** Rechteck-Schnellstart: B×H in cm. */
export function rectanglePoints(widthCm: number, heightCm: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: widthCm, y: 0 },
    { x: widthCm, y: heightCm },
    { x: 0, y: heightCm },
  ];
}

/** L-Form-Schnellstart. */
export function lShapePoints(widthCm: number, heightCm: number, notchCm: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: widthCm, y: 0 },
    { x: widthCm, y: heightCm - notchCm },
    { x: widthCm - notchCm, y: heightCm - notchCm },
    { x: widthCm - notchCm, y: heightCm },
    { x: 0, y: heightCm },
  ];
}

/** Snapping auf Raster (Standard 5 cm). */
export function snapToGrid(value: number, gridCm = 5): number {
  return Math.round(value / gridCm) * gridCm;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
