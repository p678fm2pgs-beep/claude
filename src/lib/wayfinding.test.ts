/**
 * Erweiterung 8 · T5 — Laufwege-Check: dauerhafte Beweise.
 */
import { describe, it, expect } from 'vitest';
import { checkWayfinding } from './wayfinding';
import type { Floorplan, PlacedObject } from '../types';

const fp: Floorplan = {
  points: [{ x: 0, y: 0 }, { x: 500, y: 0 }, { x: 500, y: 400 }, { x: 0, y: 400 }],
  openings: [{ id: 'd1', kind: 'tuer', wallIndex: 0, offsetCm: 200, widthCm: 90, heightCm: 200, sillCm: 0 }],
};

const obj = (id: string, typeId: string, x: number, y: number, extra: Partial<PlacedObject> = {}): PlacedObject => ({
  id, typeId, x, y, rotationDeg: 0, widthCm: 100, depthCm: 60, heightCm: 80, shape: 'rect', tier: 'premium', ...extra,
});

describe('T5 — Laufwege-Check', () => {
  it('enger Durchgang < 60 cm zwischen zwei Möbeln → Hinweis', () => {
    const a = obj('a', 'sideboard', 150, 200);
    const b = obj('b', 'sideboard', 290, 200); // Lücke 40 cm
    const hints = checkWayfinding(fp, [a, b]);
    expect(hints.some((h) => h.kind === 'durchgang')).toBe(true);
  });

  it('genug Abstand (> 60 cm) → kein Durchgangs-Hinweis', () => {
    const a = obj('a', 'sideboard', 100, 200);
    const b = obj('b', 'sideboard', 350, 200); // Lücke 150 cm
    const hints = checkWayfinding(fp, [a, b]);
    expect(hints.some((h) => h.kind === 'durchgang')).toBe(false);
  });

  it('Möbel vor der Tür → Hinweis tuer-blockiert', () => {
    const sofa = obj('s', 'sofa', 240, 30, { widthCm: 200, depthCm: 90 });
    const hints = checkWayfinding(fp, [sofa]);
    expect(hints.some((h) => h.kind === 'tuer-blockiert')).toBe(true);
  });

  it('ignorierte Hinweise werden herausgefiltert (stabiler Schlüssel)', () => {
    const a = obj('a', 'sideboard', 150, 200);
    const b = obj('b', 'sideboard', 290, 200);
    const first = checkWayfinding(fp, [a, b]);
    const key = first.find((h) => h.kind === 'durchgang')!.key;
    const after = checkWayfinding(fp, [a, b], [key]);
    expect(after.some((h) => h.key === key)).toBe(false);
  });

  it('Schlüssel ist reihenfolge-unabhängig', () => {
    const a = obj('a', 'sideboard', 150, 200);
    const b = obj('b', 'sideboard', 290, 200);
    const k1 = checkWayfinding(fp, [a, b]).find((h) => h.kind === 'durchgang')!.key;
    const k2 = checkWayfinding(fp, [b, a]).find((h) => h.kind === 'durchgang')!.key;
    expect(k1).toBe(k2);
  });

  it('Bestandsmöbel und Teppiche lösen keine Durchgangs-Hinweise aus', () => {
    const bestand = obj('a', 'sideboard', 150, 200, { bestand: true });
    const teppich = obj('t', 'teppich', 260, 200, { layer: 'teppich', widthCm: 300, depthCm: 200 });
    expect(checkWayfinding(fp, [bestand, teppich]).length).toBe(0);
  });

  it('Treppe mit davorstehendem Möbel → Hinweis treppe-verstellt', () => {
    const treppe = obj('st', 'treppe-gerade', 100, 300, { widthCm: 300, depthCm: 100 });
    const stuhl = obj('c', 'stuhl', 120, 220, { widthCm: 48, depthCm: 55 });
    const hints = checkWayfinding(fp, [treppe, stuhl]);
    expect(hints.some((h) => h.kind === 'treppe-verstellt')).toBe(true);
  });
});
