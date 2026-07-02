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
