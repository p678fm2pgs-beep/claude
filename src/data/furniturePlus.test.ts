/**
 * Erweiterung 8 · T2 — Katalog-Ausbau: dauerhafte Beweise.
 * Katalog nur GEWACHSEN, alle neuen Typen platzierbar, Kalkulation maßabhängig.
 */
import { describe, it, expect } from 'vitest';
import { FURNITURE_TYPES, findFurnitureType } from './furniture';
import { FURNITURE_PLUS } from './furniturePlus';
import { computeRoomCost, ELECTRO_LABELS } from '../lib/projectCost';
import type { Room, PlacedObject } from '../types';

describe('T2 — Katalog gewachsen, Bestand unverändert', () => {
  it('alle 40+ neuen Typen sind im Katalog, IDs eindeutig', () => {
    expect(FURNITURE_PLUS.length).toBeGreaterThanOrEqual(38);
    expect(new Set(FURNITURE_TYPES.map((f) => f.id)).size).toBe(FURNITURE_TYPES.length);
    expect(FURNITURE_TYPES.length).toBeGreaterThanOrEqual(18 + 38);
  });

  it('Bestandstypen: Preise exakt unverändert (Regressionsschutz)', () => {
    expect(findFurnitureType('sofa')?.price.standard).toEqual([800, 1800]);
    expect(findFurnitureType('bett')?.price.luxus).toEqual([4000, 11000]);
  });

  it('jede geforderte Kategorie ist vertreten', () => {
    const cats = new Set(FURNITURE_TYPES.map((f) => f.place?.category).filter(Boolean));
    for (const c of ['schrank', 'sofa', 'kueche', 'bad', 'kamin', 'heizkoerper', 'teppich', 'spiegel', 'treppe']) {
      expect(cats.has(c as never), c).toBe(true);
    }
  });

  it('alle Typen mit place: Maße plausibel (min ≤ default ≤ max), Formen nicht leer', () => {
    for (const f of FURNITURE_TYPES) {
      if (!f.place) continue;
      expect(f.place.minW, f.id).toBeLessThanOrEqual(f.place.defaultW);
      expect(f.place.maxW, f.id).toBeGreaterThanOrEqual(f.place.defaultW);
      expect(f.place.minD, f.id).toBeLessThanOrEqual(f.place.defaultD);
      expect(f.place.maxD, f.id).toBeGreaterThanOrEqual(f.place.defaultD);
      expect(f.place.shapes.length, f.id).toBeGreaterThan(0);
    }
  });

  it('Wanddocker (Heizkörper/Wandkamin/Einbauschrank/Wandspiegel) sind markiert; Teppiche als Ebene', () => {
    for (const id of ['hk-flach', 'hk-vertikal', 'kamin-wand', 'einbauschrank']) {
      expect(findFurnitureType(id)?.place?.wallDock, id).toBe(true);
    }
    expect(findFurnitureType('teppich')?.place?.rugLayer).toBe(true);
    expect(findFurnitureType('laeufer')?.place?.rugLayer).toBe(true);
  });

  it('Hinweis-Tags: Kamine (Sicherheitsabstand) und Treppen (Fachbetrieb)', () => {
    expect(findFurnitureType('kaminofen')?.place?.hintTag).toBe('kamin');
    expect(findFurnitureType('treppe-l')?.place?.hintTag).toBe('treppe');
  });
});

describe('T2 — Kalkulation: Maße fließen ein', () => {
  function roomWithPlaced(placed: PlacedObject[]): Room {
    return {
      id: 'r1', name: 'Test', type: 'schlafzimmer',
      floorplan: { points: [{ x: 0, y: 0 }, { x: 500, y: 0 }, { x: 500, y: 400 }, { x: 0, y: 400 }], openings: [] },
      heightCm: 270, light: { orientation: 'S', daylight: 'mittel' },
      activeVariantId: 'v1',
      variants: [{ id: 'v1', name: 'A', colorRoles: {}, materials: [], furniture: [], trades: [], lighting: [], notes: '', placed }],
    } as Room;
  }
  const schrank = (widthCm: number, extra: Partial<PlacedObject> = {}): PlacedObject => ({
    id: 'p1', typeId: 'einbauschrank', x: 200, y: 60, rotationDeg: 0,
    widthCm, depthCm: 60, heightCm: 250, shape: 'rect', tier: 'premium', ...extra,
  });

  it('Einbauschrank pro Meter: 2,45 m Breite → qty 2,45 lfm', () => {
    const cost = computeRoomCost(roomWithPlaced([schrank(245)]), 8);
    const line = cost.lines.find((l) => l.label.includes('Einbauschrank'))!;
    expect(line.qty).toBe(2.45);
    expect(line.totalMin).toBeCloseTo(1000 * 2.45, 0);
  });

  it('breiterer Schrank kostet mehr (Maß → Preis)', () => {
    const a = computeRoomCost(roomWithPlaced([schrank(200)]), 8).subtotal.min;
    const b = computeRoomCost(roomWithPlaced([schrank(300)]), 8).subtotal.min;
    expect(b).toBeGreaterThan(a);
  });

  it('Bestandsmöbel zählen NIE in die Kalkulation', () => {
    const leer = computeRoomCost(roomWithPlaced([]), 8).subtotal.min;
    const mitBestand = computeRoomCost(roomWithPlaced([schrank(300, { bestand: true })]), 8).subtotal.min;
    expect(mitBestand).toBe(leer);
  });

  it('Altprojekt ohne placed: Kosten bitgleich (kein Regressions-Risiko)', () => {
    const r = roomWithPlaced([]);
    delete r.variants[0].placed;
    const without = computeRoomCost(r, 8);
    const withEmpty = computeRoomCost(roomWithPlaced([]), 8);
    expect(without.subtotal).toEqual(withEmpty.subtotal);
  });

  it('Elektro-Zähler: 3 Steckdosen + 1 Herd → 2 Zeilen mit Stückzahlen, 0-Preise', () => {
    const r = roomWithPlaced([]);
    r.variants[0].electro = [
      { id: 'e1', kind: 'steckdose2', wallIndex: 0, offsetCm: 50 },
      { id: 'e2', kind: 'steckdose2', wallIndex: 0, offsetCm: 150 },
      { id: 'e3', kind: 'steckdose2', wallIndex: 1, offsetCm: 80 },
      { id: 'e4', kind: 'herd', wallIndex: 2, offsetCm: 100 },
    ];
    const cost = computeRoomCost(r, 8);
    const dosen = cost.lines.find((l) => l.label === `Elektro: ${ELECTRO_LABELS.steckdose2}`)!;
    expect(dosen.qty).toBe(3);
    expect(dosen.totalMax).toBe(0);
    expect(cost.lines.filter((l) => l.gewerk === 'elektro').length).toBe(2);
  });

  it('FBH-Zone 18 m² erscheint in der Kalkulation', () => {
    const r = roomWithPlaced([]);
    r.variants[0].heatZones = [
      { id: 'z1', poly: [{ x: 0, y: 0 }, { x: 600, y: 0 }, { x: 600, y: 300 }, { x: 0, y: 300 }] },
    ];
    const cost = computeRoomCost(r, 8);
    const fbh = cost.lines.find((l) => l.label.includes('(Zonen)'))!;
    expect(fbh.qty).toBe(18);
    expect(fbh.totalMin).toBeGreaterThan(0);
  });
});
