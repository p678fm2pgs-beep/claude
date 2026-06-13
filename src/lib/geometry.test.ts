import { describe, it, expect } from 'vitest';
import {
  polygonAreaM2,
  perimeterM,
  netWallAreaM2,
  netWallAreaForWallM2,
  deriveAreas,
  skirtingLengthM,
  rectanglePoints,
  lShapePoints,
  wallLengthCm,
  snapToGrid,
} from './geometry';
import type { Floorplan } from '../types';

describe('Geometrie — Flächen & Umfang', () => {
  const rect = rectanglePoints(520, 440); // 5,2 × 4,4 m

  it('Polygonfläche (Shoelace) eines Rechtecks', () => {
    expect(polygonAreaM2(rect)).toBeCloseTo(5.2 * 4.4, 6);
    expect(polygonAreaM2(rect)).toBeCloseTo(22.88, 2);
  });

  it('Umfang eines Rechtecks', () => {
    expect(perimeterM(rect)).toBeCloseTo(2 * (5.2 + 4.4), 6);
  });

  it('Wandlänge einzelner Wände', () => {
    expect(wallLengthCm(rect, 0)).toBeCloseTo(520, 6);
    expect(wallLengthCm(rect, 1)).toBeCloseTo(440, 6);
  });

  it('L-Form-Fläche kleiner als umschließendes Rechteck', () => {
    const l = lShapePoints(500, 400, 150);
    expect(polygonAreaM2(l)).toBeLessThan(polygonAreaM2(rectanglePoints(500, 400)));
    expect(polygonAreaM2(l)).toBeGreaterThan(0);
  });

  it('weniger als 3 Punkte → Fläche 0', () => {
    expect(polygonAreaM2([{ x: 0, y: 0 }, { x: 10, y: 0 }])).toBe(0);
  });
});

describe('Geometrie — Wandfläche netto', () => {
  it('Wandfläche netto = Umfang × Höhe − Öffnungen', () => {
    const plan: Floorplan = {
      points: rectanglePoints(520, 440),
      openings: [
        { id: 'w', kind: 'fenster', wallIndex: 0, offsetCm: 100, widthCm: 220, heightCm: 150, sillCm: 80 },
        { id: 'd', kind: 'tuer', wallIndex: 2, offsetCm: 120, widthCm: 100, heightCm: 210, sillCm: 0 },
      ],
    };
    const perimeter = 2 * (5.2 + 4.4);
    const gross = perimeter * 2.7;
    const openings = (2.2 * 1.5) + (1.0 * 2.1);
    expect(netWallAreaM2(plan, 270)).toBeCloseTo(gross - openings, 2);
  });

  it('Wandfläche nie negativ', () => {
    const plan: Floorplan = {
      points: rectanglePoints(100, 100),
      openings: [{ id: 'x', kind: 'fenster', wallIndex: 0, offsetCm: 0, widthCm: 100, heightCm: 9999, sillCm: 0 }],
    };
    expect(netWallAreaM2(plan, 250)).toBeGreaterThanOrEqual(0);
  });

  it('Netto-Wandfläche einer einzelnen Wand', () => {
    const plan: Floorplan = {
      points: rectanglePoints(500, 400),
      openings: [{ id: 'w', kind: 'fenster', wallIndex: 0, offsetCm: 50, widthCm: 200, heightCm: 150, sillCm: 90 }],
    };
    // Wand 0: 5 m × 2,5 m = 12,5 − (2×1,5=3) = 9,5
    expect(netWallAreaForWallM2(plan, 0, 250)).toBeCloseTo(9.5, 2);
  });
});

describe('Geometrie — abgeleitete Werte & Sockel', () => {
  it('deriveAreas liefert konsistente Werte ohne NaN', () => {
    const plan: Floorplan = { points: rectanglePoints(520, 440), openings: [] };
    const d = deriveAreas(plan, 270);
    expect(d.floorAreaM2).toBeCloseTo(22.88, 2);
    expect(d.ceilingAreaM2).toBe(d.floorAreaM2);
    expect(Number.isNaN(d.netWallAreaM2)).toBe(false);
    expect(d.wallCount).toBe(4);
  });

  it('Sockelleisten = Umfang − Türbreiten', () => {
    const plan: Floorplan = {
      points: rectanglePoints(500, 400),
      openings: [{ id: 'd', kind: 'tuer', wallIndex: 0, offsetCm: 0, widthCm: 100, heightCm: 200, sillCm: 0 }],
    };
    expect(skirtingLengthM(plan)).toBeCloseTo(2 * (5 + 4) - 1.0, 2);
  });

  it('snapToGrid rastet auf 5 cm', () => {
    expect(snapToGrid(123, 5)).toBe(125);
    expect(snapToGrid(122, 5)).toBe(120);
  });
});
