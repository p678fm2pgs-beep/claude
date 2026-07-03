import { describe, it, expect } from 'vitest';
import { computeWallPanels, panelsAreaM2 } from './room3d';
import { rectanglePoints } from './geometry';
import type { Floorplan } from '../types';

describe('3D — Wand-Panels (Öffnungen ausgespart)', () => {
  it('Wand ohne Öffnung: ein volles Panel (Boden..Decke)', () => {
    const plan: Floorplan = { points: rectanglePoints(500, 400), openings: [] };
    const panels = computeWallPanels(plan, 0, 270);
    expect(panels.length).toBe(1);
    expect(panels[0]).toMatchObject({ x0: 0, x1: 500, y0: 0, y1: 270 });
  });

  it('Tür: volle Aussparung — links/rechts volle Wandstücke, kein Stück über der Tür', () => {
    const plan: Floorplan = {
      points: rectanglePoints(500, 400),
      openings: [{ id: 'd', kind: 'tuer', wallIndex: 0, offsetCm: 100, widthCm: 100, heightCm: 210, sillCm: 0 }],
    };
    const panels = computeWallPanels(plan, 0, 270);
    // zwei volle Seitenstücke, kein Brüstungs-/Sturzpanel
    expect(panels.filter((p) => p.y0 === 0 && p.y1 === 270).length).toBe(2);
    // im Türbereich (x 100..200) gibt es kein Panel
    expect(panels.some((p) => p.x0 >= 100 && p.x1 <= 200)).toBe(false);
  });

  it('Fenster: Brüstung unten + Sturz oben bleiben, Fensteröffnung frei', () => {
    const plan: Floorplan = {
      points: rectanglePoints(500, 400),
      openings: [{ id: 'w', kind: 'fenster', wallIndex: 0, offsetCm: 150, widthCm: 200, heightCm: 120, sillCm: 90 }],
    };
    const panels = computeWallPanels(plan, 0, 270);
    // Brüstung 0..90 und Sturz 210..270 im Fensterbereich
    expect(panels.some((p) => p.x0 === 150 && p.x1 === 350 && p.y0 === 0 && p.y1 === 90)).toBe(true);
    expect(panels.some((p) => p.x0 === 150 && p.x1 === 350 && p.y0 === 210 && p.y1 === 270)).toBe(true);
    // im Fenster-Glasbereich (y 90..210) kein Panel
    expect(panels.some((p) => p.x0 === 150 && p.y0 === 90 && p.y1 === 210)).toBe(false);
  });

  it('Panel-Flächen-Summe ist plausibel (kleiner als volle Wand bei Öffnung)', () => {
    const plan: Floorplan = {
      points: rectanglePoints(500, 400),
      openings: [{ id: 'd', kind: 'tuer', wallIndex: 0, offsetCm: 100, widthCm: 100, heightCm: 210, sillCm: 0 }],
    };
    const full = (5 * 2.7);
    expect(panelsAreaM2(computeWallPanels(plan, 0, 270))).toBeLessThan(full);
    expect(panelsAreaM2(computeWallPanels(plan, 0, 270))).toBeGreaterThan(0);
  });

  it('degenerierte Eingaben → leere Panelliste (kein Crash)', () => {
    expect(computeWallPanels({ points: [], openings: [] }, 0, 270)).toEqual([]);
  });
});
