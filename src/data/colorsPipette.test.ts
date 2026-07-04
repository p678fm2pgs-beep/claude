/**
 * Erweiterung 8 · T10 — Farb-Pipette: nächste HAVEN-Töne.
 */
import { describe, it, expect } from 'vitest';
import { nearestTones, findTone } from './colors';

describe('T10 — nearestTones', () => {
  it('exakter Ton-HEX findet genau diesen Ton als nächsten', () => {
    const white = findTone('weiss-1')!;
    const res = nearestTones(white.hex, 1);
    expect(res[0].hex.toUpperCase()).toBe(white.hex.toUpperCase());
  });

  it('liefert die gewünschte Anzahl, absteigend nach Nähe', () => {
    const res = nearestTones('#7F7F7F', 3);
    expect(res.length).toBe(3);
  });

  it('ungültiger HEX → leere Liste', () => {
    expect(nearestTones('#abc', 3)).toEqual([]);
  });

  it('dunkles Grau ist näher an einem Anthrazit-Ton als an Weiß', () => {
    const res = nearestTones('#2A2A2A', 1)[0];
    const l = parseInt(res.hex.slice(1, 3), 16);
    expect(l).toBeLessThan(120);
  });
});
