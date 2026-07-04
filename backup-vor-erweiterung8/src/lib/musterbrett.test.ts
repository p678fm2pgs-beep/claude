/**
 * Erweiterung 6 · S9 — Digitales Musterbrett: dauerhafte Beweise.
 * Layout ist pur berechenbar; Zeichnen läuft für jeden Signature-Look fehlerfrei.
 */
import { describe, it, expect } from 'vitest';
import { computeBoardLayout, drawMusterbrett, BOARD_W, BOARD_H } from './musterbrett';
import { SIGNATURE_LOOKS, applyLookToVariant } from '../data/signatureLooks';
import type { Room, Variant } from '../types';

function variant(): Variant {
  return {
    id: 'v1',
    name: 'A',
    colorRoles: { wand: 'weiss-1', boden: 'braun-1', akzent: 'gruen-2' },
    materials: [
      { id: 'm1', materialId: 'parkett-eiche-landhaus', surface: 'boden', tier: 'premium' },
      { id: 'm2', materialId: 'kalkfarbe', surface: 'wand', tier: 'premium' },
      { id: 'm3', materialId: 'metall-messing-gebuerstet', surface: 'sonstiges', tier: 'premium' },
    ],
    furniture: [],
    trades: [],
    lighting: [],
    notes: '',
  } as Variant;
}

function room(): Room {
  return {
    id: 'r1',
    name: 'Wohnen',
    type: 'wohnzimmer',
    floorplan: { points: [{ x: 0, y: 0 }, { x: 500, y: 0 }, { x: 500, y: 400 }, { x: 0, y: 400 }], openings: [] },
    heightCm: 270,
    light: { orientation: 'S', daylight: 'mittel' },
    activeVariantId: 'v1',
    variants: [variant()],
  } as Room;
}

describe('S9 — computeBoardLayout', () => {
  it('liefert Coupons für Boden, Wand, Sonstiges + Farb-Chips', () => {
    const items = computeBoardLayout(variant(), 'de');
    const kinds = items.map((i) => i.kind);
    expect(kinds.filter((k) => k === 'material').length).toBe(3);
    expect(kinds.filter((k) => k === 'tone').length).toBe(3);
    expect(items.find((i) => i.refId === 'parkett-eiche-landhaus')?.sub).toContain('Boden');
  });

  it('alle Elemente liegen innerhalb des Bretts', () => {
    for (const i of computeBoardLayout(variant(), 'de')) {
      expect(i.x).toBeGreaterThanOrEqual(0);
      expect(i.y).toBeGreaterThanOrEqual(0);
      expect(i.x + i.w).toBeLessThanOrEqual(BOARD_W);
      expect(i.y + i.h).toBeLessThanOrEqual(BOARD_H);
    }
  });

  it('leere Variante → leeres Layout (kein Absturz, kein Fantasie-Inhalt)', () => {
    const v = { ...variant(), colorRoles: {}, materials: [] };
    expect(computeBoardLayout(v, 'de')).toEqual([]);
  });
});

describe('S9 — drawMusterbrett', () => {
  it('zeichnet ohne Fehler (Basis-Variante)', () => {
    const canvas = document.createElement('canvas');
    expect(() => drawMusterbrett(canvas, room(), variant(), 'de')).not.toThrow();
    expect(canvas.width).toBe(BOARD_W);
    expect(canvas.height).toBe(BOARD_H);
  });

  it('zeichnet jeden der 8 Signature Looks ohne Fehler', () => {
    for (const look of SIGNATURE_LOOKS) {
      const v = variant();
      applyLookToVariant(v, look);
      const canvas = document.createElement('canvas');
      expect(() => drawMusterbrett(canvas, room(), v, 'de'), look.id).not.toThrow();
      // Jeder Look muss mindestens Boden + Wand + 2 Chips aufs Brett bringen.
      const items = computeBoardLayout(v, 'de');
      expect(items.length, look.id).toBeGreaterThanOrEqual(4);
    }
  });
});
