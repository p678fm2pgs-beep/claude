/**
 * Erweiterung 8 · T3 — Elektro-Symbole: dauerhafte Beweise.
 */
import { describe, it, expect } from 'vitest';
import { electroSymbol } from './electroSymbols';
import type { ElectroKind } from '../types';

describe('T3 — electroSymbol', () => {
  const kinds: ElectroKind[] = ['steckdose1', 'steckdose2', 'steckdose3', 'schalter', 'wechsel', 'doppel', 'deckenauslass', 'wandauslass', 'netzwerk', 'tv', 'herd'];

  it('jede Art liefert ein nicht-leeres Symbol; Steckdosen-Anzahl unterscheidbar', () => {
    for (const k of kinds) expect(electroSymbol(k, 100, 100).length, k).toBeGreaterThan(0);
    const s1 = electroSymbol('steckdose1', 0, 0).length;
    const s3 = electroSymbol('steckdose3', 0, 0).length;
    expect(s3).toBeGreaterThan(s1);
  });

  it('Rotation verschiebt die Symbolpunkte (Ausrichtung an der Wand)', () => {
    const a = JSON.stringify(electroSymbol('schalter', 100, 100, 0));
    const b = JSON.stringify(electroSymbol('schalter', 100, 100, 90));
    expect(a).not.toBe(b);
  });

  it('Symbol ist um den Platzierungspunkt zentriert', () => {
    const sym = electroSymbol('steckdose2', 200, 150);
    const allX = sym.flatMap((l) => l.pts.map((p) => p.x));
    const allY = sym.flatMap((l) => l.pts.map((p) => p.y));
    expect((Math.min(...allX) + Math.max(...allX)) / 2).toBeCloseTo(200, 0);
    expect((Math.min(...allY) + Math.max(...allY)) / 2).toBeCloseTo(150, 0);
  });
});
