/**
 * Erweiterung 8 · T1 — Einrichtungs-Geometrie: dauerhafte Beweise.
 */
import { describe, it, expect } from 'vitest';
import {
  objectFootprint,
  bbox,
  polyDistance,
  nearestWallDistances,
  nearestNeighborDistances,
  snapObjectPosition,
  snapRotation,
  resizeByHandle,
  placedQuantity,
  footprintAreaM2,
  CLEARANCE_WARN_CM,
} from './objects';
import type { Floorplan, PlacedObject } from '../types';

const fp: Floorplan = {
  points: [
    { x: 0, y: 0 },
    { x: 500, y: 0 },
    { x: 500, y: 400 },
    { x: 0, y: 400 },
  ],
  openings: [],
};

function obj(extra: Partial<PlacedObject> = {}): PlacedObject {
  return {
    id: 'o1', typeId: 'sofa', x: 250, y: 200, rotationDeg: 0,
    widthCm: 200, depthCm: 90, heightCm: 80, shape: 'rect', tier: 'premium',
    ...extra,
  };
}

describe('T1 — Footprints je Form', () => {
  it('Rechteck: 4 Punkte, Maße exakt', () => {
    const f = objectFootprint(obj());
    const b = bbox(f);
    expect(f.length).toBe(4);
    expect(b.maxX - b.minX).toBeCloseTo(200, 5);
    expect(b.maxY - b.minY).toBeCloseTo(90, 5);
  });

  it('Rotation 90°: Breite und Tiefe tauschen die Achsen', () => {
    const b = bbox(objectFootprint(obj({ rotationDeg: 90 })));
    expect(b.maxX - b.minX).toBeCloseTo(90, 5);
    expect(b.maxY - b.minY).toBeCloseTo(200, 5);
  });

  it('Rund/Oval: 24-Eck mit korrekter Ausdehnung', () => {
    const rund = bbox(objectFootprint(obj({ shape: 'rund', widthCm: 120 })));
    expect(rund.maxX - rund.minX).toBeCloseTo(120, 1);
    expect(rund.maxY - rund.minY).toBeCloseTo(120, 1);
    const oval = bbox(objectFootprint(obj({ shape: 'oval', widthCm: 300, depthCm: 200 })));
    expect(oval.maxX - oval.minX).toBeCloseTo(300, 1);
    expect(oval.maxY - oval.minY).toBeCloseTo(200, 1);
  });

  it('L-Form: 6 Punkte, beide Schenkel getrennt bemaßt', () => {
    const f = objectFootprint(obj({ shape: 'lform', widthCm: 250, depthCm: 90, l2: { widthCm: 90, depthCm: 110 } }));
    expect(f.length).toBe(6);
    const b = bbox(f);
    expect(b.maxX - b.minX).toBeCloseTo(250, 5);
    expect(b.maxY - b.minY).toBeCloseTo(200, 5); // 90 + 110
  });

  it('Sonderform frei: Polygon wird übernommen und verschoben', () => {
    const f = objectFootprint(obj({
      shape: 'poly',
      poly: [{ x: -50, y: -50 }, { x: 50, y: -50 }, { x: 0, y: 60 }],
      x: 100, y: 100,
    }));
    expect(f.length).toBe(3);
    expect(f[2]).toEqual({ x: 100, y: 160 });
  });
});

describe('T1 — Abstände (Live-Platzprüfung)', () => {
  it('Wandabstände: Sofa mittig → die zwei nächsten Wände (links/rechts, je 150 cm)', () => {
    const dists = nearestWallDistances(fp, obj());
    expect(dists[0].distCm).toBeCloseTo(150, 1);
    expect(dists[1].distCm).toBeCloseTo(150, 1);
    // an die Wand geschoben: 10 cm Abstand wird exakt gemessen
    const nah = nearestWallDistances(fp, obj({ y: 55 }));
    expect(nah[0].distCm).toBeCloseTo(10, 1);
  });

  it('Nachbarabstand: zwei Schränke mit 40 cm Lücke → Warnung unter 60 cm', () => {
    const a = obj({ id: 'a', x: 100, widthCm: 100 });
    const b = obj({ id: 'b', x: 240, widthCm: 100 });
    const nd = nearestNeighborDistances(a, [b]);
    expect(nd[0].distCm).toBeCloseTo(40, 1);
    expect(nd[0].distCm).toBeLessThan(CLEARANCE_WARN_CM);
  });

  it('Teppiche zählen NICHT als Hindernis', () => {
    const sofa = obj({ id: 'a' });
    const teppich = obj({ id: 't', layer: 'teppich', widthCm: 300, depthCm: 200 });
    expect(nearestNeighborDistances(sofa, [teppich]).length).toBe(0);
  });

  it('polyDistance: überlappungsfreie Rechtecke exakt', () => {
    const a = objectFootprint(obj({ id: 'a', x: 100, y: 100, widthCm: 100, depthCm: 100 }));
    const b = objectFootprint(obj({ id: 'b', x: 300, y: 100, widthCm: 100, depthCm: 100 }));
    expect(polyDistance(a, b)).toBeCloseTo(100, 1);
  });
});

describe('T1 — Einrasten', () => {
  it('Wand bündig: Objekt 6 cm vor der Wand rastet an (Abstand 0)', () => {
    const o = obj({ x: 250, y: 51 }); // Oberkante bei 6 → snappt auf 5-cm- oder 0-Abstand
    const s = snapObjectPosition(fp, o, []);
    const b = bbox(objectFootprint({ ...o, ...s }));
    expect([0, 5]).toContain(Math.round(b.minY));
  });

  it('Nachbar-Ausrichtung: Kanten bündig innerhalb der Fangweite', () => {
    const a = obj({ id: 'a', x: 100, y: 100, widthCm: 100, depthCm: 100 });
    const moving = obj({ id: 'b', x: 156, y: 300, widthCm: 100, depthCm: 100 }); // linke Kante 106 ≈ 100? nein: rechte 206 ≈ a.max 150? — Kante 106 nahe a.minX+? teste maxX≈150
    const s = snapObjectPosition(fp, moving, [a]);
    const b = bbox(objectFootprint({ ...moving, ...s }));
    // linke Kante (106) rastet auf a-Kante 150 (Δ=44>8? nein) — stattdessen: 106→100 (a.minX+? =50/150): Δ(106→150)=44 zu groß, Δ(106→50)=56 zu groß.
    // Erwartung hier: KEIN Snap (alles außerhalb Fangweite) → Position unverändert.
    expect(b.minX).toBeCloseTo(106, 5);
  });

  it('Nachbar-Snap greift innerhalb 8 cm', () => {
    const a = obj({ id: 'a', x: 100, y: 100, widthCm: 100, depthCm: 100 }); // Kanten x: 50..150
    const moving = obj({ id: 'b', x: 205, y: 100, widthCm: 100, depthCm: 100 }); // linke Kante 155 → 150
    const s = snapObjectPosition(fp, moving, [a]);
    const b = bbox(objectFootprint({ ...moving, ...s }));
    expect(b.minX).toBeCloseTo(150, 5);
  });

  it('fein (Alt): kein Einrasten', () => {
    const o = obj({ x: 250, y: 51 });
    expect(snapObjectPosition(fp, o, [], true)).toEqual({ x: 250, y: 51 });
  });

  it('Rotation: 15°-Snap, frei mit Shift', () => {
    expect(snapRotation(52)).toBe(45);
    expect(snapRotation(52, true)).toBe(52);
    expect(snapRotation(358)).toBe(0);
  });
});

describe('T1 — Skalier-Griffe', () => {
  const limits = { minW: 40, maxW: 400, minD: 30, maxD: 200 };

  it('Ost-Griff: Breite folgt dem Zeiger, Tiefe bleibt', () => {
    const r = resizeByHandle(obj(), 'e', { x: 250 + 120, y: 200 }, limits);
    expect(r.widthCm).toBe(240);
    expect(r.depthCm).toBe(90);
  });

  it('Eck-Griff SE: beide Maße; proportional hält das Verhältnis', () => {
    const r = resizeByHandle(obj(), 'se', { x: 250 + 150, y: 200 + 90 }, limits);
    expect(r.widthCm).toBe(300);
    expect(r.depthCm).toBe(180);
    const p = resizeByHandle(obj(), 'se', { x: 250 + 150, y: 200 + 50 }, limits, true);
    expect(p.widthCm / p.depthCm).toBeCloseTo(200 / 90, 1);
  });

  it('Grenzen: Min/Max je Objekttyp werden respektiert', () => {
    const r = resizeByHandle(obj(), 'e', { x: 250 + 900, y: 200 }, limits);
    expect(r.widthCm).toBe(400);
    const r2 = resizeByHandle(obj(), 'w', { x: 250 - 5, y: 200 }, limits);
    expect(r2.widthCm).toBe(40);
  });

  it('funktioniert auch rotiert (Zeiger wird in Lokalkoordinaten gerechnet)', () => {
    const r = resizeByHandle(obj({ rotationDeg: 90 }), 'e', { x: 250, y: 200 + 120 }, limits);
    expect(r.widthCm).toBe(240);
  });
});

describe('T1 — Kalkulations-Anbindung', () => {
  it('lfm-Typen zählen die Breite in Metern, Stück-Typen 1', () => {
    expect(placedQuantity(obj({ widthCm: 245 }), 'lfm')).toBe(2.45);
    expect(placedQuantity(obj(), 'Stk')).toBe(1);
  });

  it('footprintAreaM2: Teppich 3×2 m = 6 m²', () => {
    const t = objectFootprint(obj({ shape: 'rect', widthCm: 300, depthCm: 200 }));
    expect(footprintAreaM2(t)).toBeCloseTo(6, 2);
  });
});
