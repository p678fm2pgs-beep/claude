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

// ═══════════ Erweiterung 7 · W5: Wand teilen / löschen ═══════════
import { splitWallAt, deleteWall, remapWallRefs, openingsOnWallPair } from '../lib/planEditor';

function roomForW5(): Room {
  const r = roomWith(plan());
  r.floorplan.openings.push({
    id: 'fenster1', kind: 'fenster', wallIndex: 2, offsetCm: 150, widthCm: 120, heightCm: 140, sillCm: 90,
  });
  r.floorplan.wallProps = { 0: { loadbearing: true, thicknessCm: 24 }, 2: { wallType: 'trockenbau' } };
  r.variants[0].wallColors = { 0: 'weiss-1', 2: 'gruen-2' };
  r.variants[0].materials.push({ id: 'm3', materialId: 'kalkfarbe', surface: 'wand', tier: 'standard', wallIndex: 2 });
  return r;
}

describe('W5 — Wand teilen', () => {
  it('teilt Wand 0 bei 250: Punkt eingefügt, Öffnung bleibt auf ihrem Segment', () => {
    const r = roomForW5();
    expect(splitWallAt(r, 0, 250)).toBe(true);
    expect(r.floorplan.points.length).toBe(5);
    // Tür (100..190) bleibt auf Segment 0 mit unverändertem Offset:
    const tuer = r.floorplan.openings.find((o) => o.id === 'tuer1')!;
    expect(tuer.wallIndex).toBe(0);
    expect(tuer.offsetCm).toBe(100);
    // Fenster war auf Wand 2 → jetzt Wand 3:
    const fenster = r.floorplan.openings.find((o) => o.id === 'fenster1')!;
    expect(fenster.wallIndex).toBe(3);
    expect(fenster.offsetCm).toBe(150);
  });

  it('Öffnung rechts vom Teilungspunkt wandert aufs zweite Segment (Offset umgerechnet)', () => {
    const r = roomForW5();
    splitWallAt(r, 0, 80);
    const tuer = r.floorplan.openings.find((o) => o.id === 'tuer1')!;
    expect(tuer.wallIndex).toBe(1);
    expect(tuer.offsetCm).toBe(20); // 100 − 80
  });

  it('Referenzen (wallColors, wallProps, Material.wallIndex) werden konsistent verschoben + geerbt', () => {
    const r = roomForW5();
    splitWallAt(r, 0, 250);
    expect(r.floorplan.wallProps?.[0]?.loadbearing).toBe(true);
    expect(r.floorplan.wallProps?.[1]?.loadbearing).toBe(true); // zweites Segment erbt
    expect(r.floorplan.wallProps?.[3]?.wallType).toBe('trockenbau'); // alt 2 → 3
    expect(r.variants[0].wallColors?.[3]).toBe('gruen-2');
    expect(r.variants[0].materials.find((m) => m.id === 'm3')?.wallIndex).toBe(3);
  });

  it('randnaher Klickpunkt → keine Teilung', () => {
    const r = roomForW5();
    expect(splitWallAt(r, 0, 2)).toBe(false);
    expect(r.floorplan.points.length).toBe(4);
  });

  it('Flächen bleiben bei reiner Teilung identisch (Konsistenz)', () => {
    const r = roomForW5();
    const before = deriveAreas(r.floorplan, r.heightCm);
    splitWallAt(r, 0, 250);
    const after = deriveAreas(r.floorplan, r.heightCm);
    expect(after.floorAreaM2).toBe(before.floorAreaM2);
    expect(after.netWallAreaM2).toBe(before.netWallAreaM2);
  });
});

describe('W5 — Wand löschen', () => {
  it('zählt vorher die betroffenen Öffnungen (Dialog)', () => {
    const r = roomForW5();
    expect(openingsOnWallPair(r.floorplan, 0)).toBe(1); // Tür auf Wand 0
    expect(openingsOnWallPair(r.floorplan, 1)).toBe(1); // Fenster auf Folgewand 2
  });

  it('löscht Wand 0: Eckpunkt weg, Tür entfernt, Fenster-Referenzen verschoben', () => {
    const r = roomForW5();
    const res = deleteWall(r, 0)!;
    expect(res.removedOpenings).toBe(1);
    expect(r.floorplan.points.length).toBe(3);
    const fenster = r.floorplan.openings.find((o) => o.id === 'fenster1')!;
    expect(fenster.wallIndex).toBe(1); // alt 2 → 1
    expect(r.variants[0].wallColors?.[1]).toBe('gruen-2');
    expect(r.variants[0].materials.find((m) => m.id === 'm3')?.wallIndex).toBe(1);
  });

  it('Umlauf-Fall: letzte Wand löschen (Eckpunkt 0 entfällt) bleibt konsistent', () => {
    const r = roomForW5();
    const res = deleteWall(r, 3)!; // Wand 3 = (0,400)→(0,0), Eckpunkt 0 entfällt
    expect(res).not.toBeNull();
    expect(r.floorplan.points.length).toBe(3);
    for (const o of r.floorplan.openings) {
      expect(o.wallIndex).toBeLessThan(3);
      expect(o.wallIndex).toBeGreaterThanOrEqual(0);
    }
  });

  it('Dreieck: Löschen verweigert (null)', () => {
    const r = roomForW5();
    deleteWall(r, 0);
    expect(deleteWall(r, 0)).toBeNull();
  });

  it('remapWallRefs: null entfernt Verweise vollständig', () => {
    const r = roomForW5();
    remapWallRefs(r, () => null);
    expect(Object.keys(r.floorplan.wallProps ?? {}).length).toBe(0);
    expect(Object.keys(r.variants[0].wallColors ?? {}).length).toBe(0);
    expect(r.variants[0].materials.every((m) => m.wallIndex === undefined)).toBe(true);
  });
});

// ═══════════ Erweiterung 7 · W6: Raum-Etikett + Messwerkzeug ═══════════
import { polygonCentroid, snapMeasurePoint } from '../lib/planEditor';

describe('W6 — Raum-Etikett + Messwerkzeug', () => {
  it('polygonCentroid: Rechteck-Mitte exakt', () => {
    const c = polygonCentroid(plan().points);
    expect(c.x).toBeCloseTo(250, 5);
    expect(c.y).toBeCloseTo(200, 5);
  });

  it('snapMeasurePoint: rastet an Ecke und Öffnungskante, sonst frei', () => {
    const fp = plan();
    expect(snapMeasurePoint(fp, { x: 6, y: 8 })).toEqual({ x: 0, y: 0 }); // Ecke
    expect(snapMeasurePoint(fp, { x: 104, y: 5 })).toEqual({ x: 100, y: 0 }); // Türkante (offset 100)
    expect(snapMeasurePoint(fp, { x: 250, y: 123 })).toEqual({ x: 250, y: 123 }); // frei diagonal
  });

  it('behaltene Messungen verändern keinerlei Flächen (nur Anzeige/PDF)', () => {
    const withM = plan({ measurements: [{ id: 'm1', a: { x: 0, y: 0 }, b: { x: 500, y: 400 } }] });
    expect(deriveAreas(withM, 270)).toEqual(deriveAreas(plan(), 270));
  });
});

// ═══════════ Erweiterung 7 · W7: Aufmaß-PDF + Maßstab ═══════════
import { buildAufmassPdf, pickScale } from '../modules/pdf/exportAufmass';
import type { Project } from '../types';

describe('W7 — Aufmaß-PDF', () => {
  function projectFor(): Project {
    const r = roomForW5();
    r.floorplan.measurements = [{ id: 'm1', a: { x: 0, y: 0 }, b: { x: 500, y: 400 } }];
    r.floorplan.northAngleDeg = 30;
    r.floorplan.innerWalls = [
      { id: 'iw1', a: { x: 250, y: 0 }, b: { x: 250, y: 200 }, thicknessCm: 11.5, wallType: 'trockenbau' },
    ];
    return {
      id: 'p1', schemaVersion: 3, name: 'Aufmaß Test', created: 1, modified: 2,
      priceListDate: '06/2026', rooms: [r],
      settings: { reservePercent: 10, fee: { type: 'prozent', value: 12 }, vatPercent: 19, paintCoverage: 8 },
    } as Project;
  }

  it('pickScale: wählt 1:50 wenn es passt, sonst gröber', () => {
    expect(pickScale(500, 400, 160, 150)).toBe(50); // 100×80 mm bei 1:50 → passt
    expect(pickScale(1500, 1200, 160, 150)).toBe(100); // 150×120 mm bei 1:100
    expect(pickScale(6000, 6000, 160, 150)).toBe(200); // Notnagel
  });

  it('baut je Raum eine Seite + Raumliste, ohne Fehler, ohne Preise', () => {
    const doc = buildAufmassPdf(projectFor(), 'de');
    expect(doc.getNumberOfPages()).toBe(2); // 1 Raum + Raumliste
  });

  it('englische Ausgabe baut ebenfalls', () => {
    expect(() => buildAufmassPdf(projectFor(), 'en')).not.toThrow();
  });
});
