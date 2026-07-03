/**
 * Erweiterung 4 — additive Tests (Kataloge, Beleuchtung, Muster-Rendering, Showcase).
 */
import { describe, it, expect } from 'vitest';
import { COLOR_FAMILIES, MANUFACTURER_COLLECTIONS, ALL_MANUFACTURER_COLORS, findFamily } from '../data/colors';
import { findMaterial } from '../data/materials';
import { LIGHT_FIXTURES, findFixture, fixturesForRoom } from '../data/lighting';
import { fillFloorPattern, type FloorPatternOptions } from '../lib/texture';
import { createShowcaseProject } from '../lib/factory';
import { computeRoomCost, computeProjectCost } from '../lib/projectCost';
import { perimeterM } from '../lib/geometry';

describe('Erweiterung 4 — Farben (additiv)', () => {
  it('neue Familien vorhanden, je ≥ 10 Töne', () => {
    for (const id of ['hellgrau', 'taupe', 'schwarz', 'tuerkis', 'lavendel']) {
      const fam = findFamily(id);
      expect(fam, `Familie ${id}`).toBeDefined();
      expect(fam!.tones.length).toBeGreaterThanOrEqual(10);
    }
    expect(COLOR_FAMILIES.length).toBeGreaterThanOrEqual(17);
  });

  it('Hersteller-Farbwelten: 4 Sammlungen mit gültigen HEX', () => {
    expect(MANUFACTURER_COLLECTIONS.map((c) => c.manufacturer)).toEqual(
      expect.arrayContaining(['Farrow & Ball', 'Little Greene', 'Caparol', 'Alpina']),
    );
    expect(ALL_MANUFACTURER_COLORS.length).toBeGreaterThanOrEqual(20);
    for (const c of ALL_MANUFACTURER_COLORS) {
      expect(c.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.code.length).toBeGreaterThan(0);
    }
  });
});

describe('Erweiterung 4 — Böden/Wände (additiv)', () => {
  it('neue Materialien existieren mit Preisen & Textur', () => {
    for (const id of ['naturstein-granit', 'bambus-boden', 'rigid-spc-eiche', 'feinstein-hexagon', 'beton-cire', 'kassettenwand']) {
      const m = findMaterial(id);
      expect(m, id).toBeDefined();
      expect(m!.prices.luxus.materialVK).toBeGreaterThan(0);
      expect(m!.texture.base).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('Erweiterung 4 — Beleuchtung', () => {
  it('Katalog enthält indirekte Voute & Spots', () => {
    expect(findFixture('lichtvoute')?.voute).toBe(true);
    expect(LIGHT_FIXTURES.length).toBeGreaterThanOrEqual(12);
    expect(fixturesForRoom('aussen').some((f) => f.category === 'aussen')).toBe(true);
  });

  it('Beleuchtung fließt in die Kalkulation (lfm-Voute nutzt Umfang als Menge)', () => {
    const p = createShowcaseProject();
    const room = p.rooms[0];
    const rc = computeRoomCost(room, p.settings.paintCoverage);
    const voute = rc.lines.find((l) => l.gewerk === 'leuchten' && l.unit === 'lfm');
    expect(voute).toBeDefined();
    expect(voute!.qty).toBeCloseTo(Math.round(perimeterM(room.floorplan.points) * 100) / 100, 1);
    expect(voute!.totalMin).toBeGreaterThan(0);
  });
});

describe('Erweiterung 4 — Muster-Rendering (kein Crash, offline)', () => {
  it('fillFloorPattern läuft für alle Muster ohne Fehler', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const bbox = { minX: 0, minY: 0, maxX: 400, maxY: 300 };
    const patterns = ['gerade', 'diagonal', 'schiffsboden', 'fischgraet', 'chevron', 'wuerfel', 'mosaik', 'flechtmuster'];
    for (const pattern of patterns) {
      const opts: FloorPatternOptions = { pattern, base: '#C7A77B', grain: '#9B7F55', unitM: 1.2 };
      expect(() => fillFloorPattern(ctx, bbox, 60, opts)).not.toThrow();
    }
    // Fliesen mit Fugen
    expect(() =>
      fillFloorPattern(ctx, bbox, 60, { pattern: 'gerade', base: '#ECE7DD', grain: '#CFC8BB', tile: true, groutColor: '#999', unitM: 0.6 }),
    ).not.toThrow();
  });
});

describe('Erweiterung 4 — Showcase-Demo', () => {
  it('Musterwohnzimmer: 1 Raum, Fischgräte-Boden, schwarze Wand, schwarze Fensterrahmen, Voute', () => {
    const p = createShowcaseProject();
    expect(p.rooms.length).toBe(1);
    const v = p.rooms[0].variants[0];
    const floor = v.materials.find((m) => m.surface === 'boden');
    expect(floor?.pattern).toBe('fischgraet');
    expect(v.wallColors?.[0]).toBe('schwarz-1');
    expect(p.rooms[0].floorplan.openings.some((o) => o.frameColor === '#141414')).toBe(true);
    expect((v.lights ?? []).some((l) => l.fixtureId === 'lichtvoute')).toBe(true);
    // Kalkulation valide
    const cost = computeProjectCost(p);
    expect(cost.gross.min).toBeGreaterThan(cost.net.min);
  });
});
