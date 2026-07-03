import { describe, it, expect } from 'vitest';
import {
  validateRoomHeight,
  validateWallLength,
  validateFloorArea,
  validateReservePercent,
  validateOpening,
  validateRequired,
} from './validation';
import { rectanglePoints } from './geometry';
import type { Floorplan } from '../types';

describe('Validierung — Grenzwerte', () => {
  it('Raumhöhe 2,00–6,00 m', () => {
    expect(validateRoomHeight(270).ok).toBe(true);
    expect(validateRoomHeight(900).ok).toBe(false); // 9 m
    expect(validateRoomHeight(150).ok).toBe(false);
  });

  it('Text im Zahlenfeld (NaN) wird abgewiesen', () => {
    expect(validateRoomHeight(NaN).ok).toBe(false);
    const r = validateRoomHeight(NaN);
    expect(r.ok ? '' : r.issue.code).toBe('err.notANumber');
  });

  it('Wandlänge 0,30–30,00 m', () => {
    expect(validateWallLength(500).ok).toBe(true);
    expect(validateWallLength(10).ok).toBe(false);
    expect(validateWallLength(4000).ok).toBe(false);
  });

  it('Fläche 1–500 m²', () => {
    expect(validateFloorArea(22).ok).toBe(true);
    expect(validateFloorArea(0.5).ok).toBe(false);
    expect(validateFloorArea(600).ok).toBe(false);
  });

  it('Reserve 0–30 %', () => {
    expect(validateReservePercent(0).ok).toBe(true);
    expect(validateReservePercent(30).ok).toBe(true);
    expect(validateReservePercent(31).ok).toBe(false);
    expect(validateReservePercent(-1).ok).toBe(false);
  });

  it('Pflichtfeld', () => {
    expect(validateRequired('Name').ok).toBe(true);
    expect(validateRequired('   ').ok).toBe(false);
  });
});

describe('Validierung — Öffnungen', () => {
  const base = (): Floorplan => ({ points: rectanglePoints(280, 400), openings: [] });

  it('Fenster breiter als Wand → Fehler mit Werten', () => {
    const plan = base();
    plan.openings = [{ id: 'w', kind: 'fenster', wallIndex: 0, offsetCm: 0, widthCm: 320, heightCm: 150, sillCm: 80 }];
    const r = validateOpening(plan, 270, 'w');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issue.code).toBe('err.openingWiderThanWall');
      expect(r.issue.params).toMatchObject({ opening: '3.20', wall: '2.80' });
    }
  });

  it('Öffnung höher als Raum → Fehler', () => {
    const plan = base();
    plan.openings = [{ id: 'w', kind: 'fenster', wallIndex: 0, offsetCm: 0, widthCm: 100, heightCm: 250, sillCm: 80 }];
    const r = validateOpening(plan, 270, 'w');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issue.code).toBe('err.openingTallerThanRoom');
  });

  it('Summe der Öffnungsbreiten > Wandlänge → Fehler', () => {
    const plan = base();
    plan.openings = [
      { id: 'a', kind: 'fenster', wallIndex: 0, offsetCm: 0, widthCm: 150, heightCm: 120, sillCm: 80 },
      { id: 'b', kind: 'fenster', wallIndex: 0, offsetCm: 150, widthCm: 150, heightCm: 120, sillCm: 80 },
    ];
    const r = validateOpening(plan, 270, 'b');
    expect(r.ok).toBe(false);
  });

  it('gültige Öffnung → ok', () => {
    const plan = base();
    plan.openings = [{ id: 'w', kind: 'fenster', wallIndex: 0, offsetCm: 30, widthCm: 200, heightCm: 140, sillCm: 90 }];
    expect(validateOpening(plan, 270, 'w').ok).toBe(true);
  });
});
