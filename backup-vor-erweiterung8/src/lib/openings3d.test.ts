import { describe, it, expect } from 'vitest';
import { computeOpeningParts } from './openings3d';
import type { Opening } from '../types';

const win: Opening = { id: 'w', kind: 'fenster', wallIndex: 0, offsetCm: 100, widthCm: 200, heightCm: 140, sillCm: 90 };
const door: Opening = { id: 'd', kind: 'tuer', wallIndex: 0, offsetCm: 100, widthCm: 100, heightCm: 210, sillCm: 0 };

describe('Erweiterung 5 — Öffnungs-Bauteile (3D)', () => {
  it('Fenster: 4 Rahmenbalken + Glas (keine leeren Löcher mehr)', () => {
    const parts = computeOpeningParts(win, 500, 270);
    expect(parts.filter((p) => p.kind === 'frame').length).toBe(4);
    const glass = parts.filter((p) => p.kind === 'glass');
    expect(glass.length).toBe(1);
    // Glas liegt innerhalb der Fensteröffnung
    expect(glass[0].x0).toBeGreaterThan(100);
    expect(glass[0].x1).toBeLessThan(300);
    expect(glass[0].y0).toBeGreaterThan(90);
    expect(glass[0].y1).toBeLessThan(230);
  });

  it('breites Fenster bekommt eine Sprosse (Mullion)', () => {
    expect(computeOpeningParts(win, 500, 270).some((p) => p.kind === 'mullion')).toBe(true);
    const schmal: Opening = { ...win, widthCm: 80 };
    expect(computeOpeningParts(schmal, 500, 270).some((p) => p.kind === 'mullion')).toBe(false);
  });

  it('Tür: 3 Zargenbalken (kein Bodenbalken) + Türblatt, kein Glas', () => {
    const parts = computeOpeningParts(door, 500, 270);
    expect(parts.filter((p) => p.kind === 'frame').length).toBe(3);
    expect(parts.filter((p) => p.kind === 'leaf').length).toBe(1);
    expect(parts.some((p) => p.kind === 'glass')).toBe(false);
    // Türblatt steht am Boden (y0 = 0)
    const leaf = parts.find((p) => p.kind === 'leaf')!;
    expect(leaf.y0).toBe(0);
  });

  it('alle Teile haben positive Ausdehnung und Tiefe', () => {
    for (const o of [win, door]) {
      for (const p of computeOpeningParts(o, 500, 270)) {
        expect(p.x1).toBeGreaterThan(p.x0);
        expect(p.y1).toBeGreaterThan(p.y0);
        expect(p.depthCm).toBeGreaterThan(0);
      }
    }
  });

  it('degenerierte Öffnung (Breite 0) → keine Teile', () => {
    expect(computeOpeningParts({ ...win, widthCm: 0 }, 500, 270)).toEqual([]);
  });
});

// ── Erweiterung 7 · W1/W3: Türtypen, Anschlag, Flügel, Sprossen, Durchbruch ──
describe('Erweiterung 7 — parametrisierte Öffnungen', () => {
  const baseDoor: Opening = {
    id: 'd', kind: 'tuer', wallIndex: 0, offsetCm: 100, widthCm: 90,
    heightCm: 200, sillCm: 0,
  };
  const baseWin: Opening = {
    id: 'w', kind: 'fenster', wallIndex: 0, offsetCm: 100, widthCm: 180,
    heightCm: 140, sillCm: 90,
  };

  it('Durchgang: KEIN Türblatt', () => {
    const parts = computeOpeningParts({ ...baseDoor, doorType: 'durchgang' }, 500, 270);
    expect(parts.some((p) => p.kind === 'leaf')).toBe(false);
    expect(parts.some((p) => p.kind === 'frame')).toBe(true);
  });

  it('Doppelflügel: genau zwei Blätter', () => {
    const parts = computeOpeningParts({ ...baseDoor, doorType: 'doppel', widthCm: 160 }, 500, 270);
    expect(parts.filter((p) => p.kind === 'leaf').length).toBe(2);
  });

  it('Schiebetür: Blatt läuft VOR der Wand (depthOffset ≠ 0)', () => {
    const parts = computeOpeningParts({ ...baseDoor, doorType: 'schiebe' }, 500, 270);
    const leaf = parts.find((p) => p.kind === 'leaf')!;
    expect(Math.abs(leaf.depthOffsetCm ?? 0)).toBeGreaterThan(5);
  });

  it('Drehtür: Anschlag rechts → Spalt an der linken Griffseite', () => {
    const links = computeOpeningParts({ ...baseDoor, hinge: 'links' }, 500, 270).find((p) => p.kind === 'leaf')!;
    const rechts = computeOpeningParts({ ...baseDoor, hinge: 'rechts' }, 500, 270).find((p) => p.kind === 'leaf')!;
    expect(links.x0).toBeLessThan(rechts.x0);
  });

  it('Fenster: 3 Flügel → 2 Pfosten; Sprossen → zusätzliche Querstäbe', () => {
    const plain = computeOpeningParts({ ...baseWin, wings: 1 }, 500, 270);
    const three = computeOpeningParts({ ...baseWin, wings: 3 }, 500, 270);
    const sprossen = computeOpeningParts({ ...baseWin, wings: 1, muntins: true }, 500, 270);
    expect(three.filter((p) => p.kind === 'mullion').length).toBe(2);
    expect(plain.filter((p) => p.kind === 'mullion').length).toBe(0);
    expect(sprossen.filter((p) => p.kind === 'mullion').length).toBe(2);
  });

  it('Brüstung 0 (bodentief): Glas beginnt am Boden(-Rahmen)', () => {
    const parts = computeOpeningParts({ ...baseWin, sillCm: 0, windowType: 'bodentief', heightCm: 230 }, 500, 270);
    const glass = parts.find((p) => p.kind === 'glass')!;
    expect(glass.y0).toBeLessThanOrEqual(6.5);
  });

  it('Durchbruch: keine Blätter, kein Glas, Wandfläche über Öffnungsmaß reduzierbar', () => {
    const parts = computeOpeningParts(
      { id: 'p', kind: 'durchbruch', wallIndex: 0, offsetCm: 50, widthCm: 150, heightCm: 220, sillCm: 0 },
      500, 270,
    );
    expect(parts.some((p) => p.kind === 'leaf' || p.kind === 'glass')).toBe(false);
    expect(parts.length).toBeGreaterThan(0);
  });

  it('Altdaten ohne neue Felder: identisches Verhalten wie vor Erweiterung 7', () => {
    const before = computeOpeningParts(baseDoor, 500, 270);
    const explicit = computeOpeningParts({ ...baseDoor, doorType: 'dreh', hinge: 'links', opensInward: true }, 500, 270);
    expect(before).toEqual(explicit);
  });
});
