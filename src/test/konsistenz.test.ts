/**
 * Erweiterung 7 — KONSISTENZ-PFLICHT (dauerhafter Schild).
 * Jede Geometrie-Änderung muss sofort Flächen und Kalkulation korrekt bewegen:
 * Wand einziehen → Wandfläche/Preis steigen; Wand löschen → exakt zurück;
 * Tür verschieben → Maße ändern sich, Flächen bleiben; Durchbruch → Fläche sinkt;
 * Altpläne → bitgleiche Werte wie vor Erweiterung 7.
 */
import { describe, it, expect } from 'vitest';
import { deriveAreas, innerWallAreaM2 } from '../lib/geometry';
import {
  snapWallPoint,
  snapWallDirection,
  exactLengthPoint,
  splitPolygon,
  reassignOpenings,
  pointOnBoundary,
  cornerDistances,
} from '../lib/planEditor';
import { computeRoomCost } from '../lib/projectCost';
import type { Floorplan, InnerWall, Room } from '../types';

function plan(extra: Partial<Floorplan> = {}): Floorplan {
  return {
    points: [
      { x: 0, y: 0 },
      { x: 500, y: 0 },
      { x: 500, y: 400 },
      { x: 0, y: 400 },
    ],
    openings: [
      { id: 'tuer1', kind: 'tuer', wallIndex: 0, offsetCm: 100, widthCm: 90, heightCm: 200, sillCm: 0 },
    ],
    ...extra,
  };
}

function roomWith(fp: Floorplan): Room {
  return {
    id: 'r1',
    name: 'Wohnen',
    type: 'wohnzimmer',
    floorplan: fp,
    heightCm: 270,
    light: { orientation: 'S', daylight: 'mittel' },
    activeVariantId: 'v1',
    variants: [
      {
        id: 'v1',
        name: 'A',
        colorRoles: { wand: 'weiss-1' },
        materials: [
          { id: 'm1', materialId: 'wandfarbe-matt', surface: 'wand', tier: 'standard' },
          { id: 'm2', materialId: 'parkett-eiche-landhaus', surface: 'boden', tier: 'standard' },
        ],
        furniture: [],
        trades: [],
        lighting: [],
        notes: '',
      },
    ],
  } as Room;
}

const midCost = (r: Room) => {
  const c = computeRoomCost(r, 8);
  return (c.subtotal.min + c.subtotal.max) / 2;
};

describe('Konsistenz — Innenwand einziehen/löschen', () => {
  const divider: InnerWall = {
    id: 'iw1', a: { x: 250, y: 0 }, b: { x: 250, y: 400 },
    thicknessCm: 11.5, wallType: 'trockenbau',
  };

  it('Wand einziehen → Netto-Wandfläche steigt um 2 × L × H', () => {
    const before = deriveAreas(plan(), 270);
    const after = deriveAreas(plan({ innerWalls: [divider] }), 270);
    expect(after.netWallAreaM2 - before.netWallAreaM2).toBeCloseTo(2 * 4 * 2.7, 1);
    expect(after.floorAreaM2).toBe(before.floorAreaM2); // Bodenfläche unverändert
  });

  it('Wand einziehen → Preis steigt; Wand löschen → exakt zurück', () => {
    const p0 = midCost(roomWith(plan()));
    const p1 = midCost(roomWith(plan({ innerWalls: [divider] })));
    const p2 = midCost(roomWith(plan({ innerWalls: [] })));
    expect(p1).toBeGreaterThan(p0);
    expect(p2).toBe(p0);
  });

  it('halbhohe Wand zählt mit eigener Höhe (beidseitig)', () => {
    const half: InnerWall = { ...divider, wallType: 'halbhoch', heightCm: 110 };
    expect(innerWallAreaM2(half, 270)).toBeCloseTo(2 * 4 * 1.1, 5);
  });
});

describe('Konsistenz — Tür verschieben', () => {
  it('Eckmaße ändern sich, Flächen bleiben identisch', () => {
    const p1 = plan();
    const p2 = plan();
    p2.openings[0].offsetCm = 300;
    expect(cornerDistances(p1, p1.openings[0]).leftCm).toBe(100);
    expect(cornerDistances(p2, p2.openings[0]).leftCm).toBe(300);
    expect(deriveAreas(p1, 270)).toEqual(deriveAreas(p2, 270));
  });
});

describe('Konsistenz — Durchbruch', () => {
  it('Durchbruch reduziert die Netto-Wandfläche um sein Öffnungsmaß', () => {
    const before = deriveAreas(plan(), 270);
    const withPassage = plan();
    withPassage.openings.push({
      id: 'p1', kind: 'durchbruch', wallIndex: 2, offsetCm: 100, widthCm: 150, heightCm: 220, sillCm: 0,
    });
    const after = deriveAreas(withPassage, 270);
    expect(before.netWallAreaM2 - after.netWallAreaM2).toBeCloseTo(1.5 * 2.2, 1);
  });
});

describe('Konsistenz — Altpläne bitgleich', () => {
  it('Plan ohne neue Felder liefert exakt die bisherigen Flächen', () => {
    const legacy: Floorplan = {
      points: plan().points,
      openings: plan().openings,
    };
    const d = deriveAreas(legacy, 270);
    expect(d.floorAreaM2).toBe(20);
    expect(d.perimeterM).toBe(18);
    expect(d.netWallAreaM2).toBeCloseTo(18 * 2.7 - 0.9 * 2, 1);
  });
});

describe('W4 — Wand-Werkzeug-Geometrie', () => {
  it('snapWallPoint: rastet an Ecke, Wandmitte, Wandlinie und Raster', () => {
    const pts = plan().points;
    expect(snapWallPoint(pts, undefined, { x: 8, y: 6 })).toEqual({ x: 0, y: 0 }); // Ecke
    expect(snapWallPoint(pts, undefined, { x: 246, y: 8 })).toEqual({ x: 250, y: 0 }); // Wandmitte
    expect(snapWallPoint(pts, undefined, { x: 123, y: 6 })).toEqual({ x: 120, y: 0 }); // Wandlinie + Raster
    expect(snapWallPoint(pts, undefined, { x: 203, y: 187 })).toEqual({ x: 200, y: 190 }); // freies Raster
  });

  it('snapWallDirection: 0/45/90° — frei mit Modifiertaste', () => {
    const a = { x: 100, y: 100 };
    const s = snapWallDirection(a, { x: 300, y: 118 });
    expect(s.y).toBeCloseTo(100, 5); // auf 0° gerastet
    const free = snapWallDirection(a, { x: 300, y: 118 }, true);
    expect(free.y).toBe(118);
  });

  it('exactLengthPoint: exakte Länge in Zugrichtung', () => {
    const p = exactLengthPoint({ x: 0, y: 0 }, { x: 10, y: 0 }, 342);
    expect(p).toEqual({ x: 342, y: 0 });
  });
});

describe('W4 — Raumteilung', () => {
  const pts = plan().points;
  const cutA = { x: 250, y: 0 };
  const cutB = { x: 250, y: 400 };

  it('splitPolygon: Sehne teilt das Rechteck in zwei Hälften gleicher Fläche', () => {
    const split = splitPolygon(pts, cutA, cutB)!;
    expect(split).not.toBeNull();
    const a = deriveAreas({ points: split.polyA, openings: [] }, 270).floorAreaM2;
    const b = deriveAreas({ points: split.polyB, openings: [] }, 270).floorAreaM2;
    expect(a + b).toBeCloseTo(20, 2);
    expect(a).toBeCloseTo(10, 2);
  });

  it('splitPolygon: Punkte auf derselben Wand → null (keine Fantasie-Teilung)', () => {
    expect(splitPolygon(pts, { x: 100, y: 0 }, { x: 400, y: 0 })).toBeNull();
  });

  it('reassignOpenings: Tür wandert in den richtigen Teilraum mit gültigem Offset', () => {
    const split = splitPolygon(pts, cutA, cutB)!;
    const { forA, forB } = reassignOpenings(plan().openings, pts, split.polyA, split.polyB);
    // Tür sitzt bei 100..190 auf Wand 0 → links der Teilung (x<250)
    const all = [...forA, ...forB];
    expect(all.length).toBe(1);
    const door = all[0];
    const poly = forA.length ? split.polyA : split.polyB;
    const len = Math.hypot(
      poly[(door.wallIndex + 1) % poly.length].x - poly[door.wallIndex].x,
      poly[(door.wallIndex + 1) % poly.length].y - poly[door.wallIndex].y,
    );
    expect(door.offsetCm).toBeGreaterThanOrEqual(0);
    expect(door.offsetCm + door.widthCm).toBeLessThanOrEqual(len + 0.01);
  });

  it('pointOnBoundary erkennt Wandpunkte, lehnt Innenpunkte ab', () => {
    expect(pointOnBoundary(pts, { x: 250, y: 0 })).not.toBeNull();
    expect(pointOnBoundary(pts, { x: 250, y: 200 })).toBeNull();
  });
});
