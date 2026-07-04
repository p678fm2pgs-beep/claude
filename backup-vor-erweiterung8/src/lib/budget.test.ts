/**
 * Erweiterung 6 · S10 — Live-Budget: dauerhafte Beweise.
 */
import { describe, it, expect } from 'vitest';
import { TIERS, applyTierToProject, computeProjectCostAtTier } from './budget';
import type { Project } from '../types';

function project(): Project {
  return {
    id: 'p1',
    schemaVersion: 3,
    name: 'Test',
    created: 1,
    modified: 2,
    priceListDate: '06/2026',
    rooms: [
      {
        id: 'r1',
        name: 'Wohnen',
        type: 'wohnzimmer',
        floorplan: {
          points: [
            { x: 0, y: 0 },
            { x: 500, y: 0 },
            { x: 500, y: 400 },
            { x: 0, y: 400 },
          ],
          openings: [],
        },
        heightCm: 270,
        light: { orientation: 'S', daylight: 'mittel' },
        activeVariantId: 'v1',
        variants: [
          {
            id: 'v1',
            name: 'A',
            colorRoles: { wand: 'weiss-1' },
            materials: [
              { id: 'm1', materialId: 'parkett-eiche-landhaus', surface: 'boden', tier: 'standard' },
              { id: 'm2', materialId: 'wandfarbe-matt', surface: 'wand', tier: 'premium' },
            ],
            furniture: [{ id: 'f1', typeId: 'sofa', label: 'Sofa', tier: 'standard', quantity: 1, unit: 'Stk' }],
            trades: [],
            lighting: [],
            notes: 'Notiz bleibt',
          },
        ],
      },
    ],
    settings: { reservePercent: 10, fee: { type: 'prozent', value: 12 }, vatPercent: 19, paintCoverage: 8 },
  } as Project;
}

describe('S10 — applyTierToProject', () => {
  it('setzt alle Material- und Möbel-Stufen, sonst nichts', () => {
    const p = project();
    applyTierToProject(p, 'luxus');
    const v = p.rooms[0].variants[0];
    expect(v.materials.every((m) => m.tier === 'luxus')).toBe(true);
    expect(v.furniture.every((f) => f.tier === 'luxus')).toBe(true);
    expect(v.notes).toBe('Notiz bleibt');
    expect(v.colorRoles.wand).toBe('weiss-1');
    expect(v.materials.length).toBe(2);
  });
});

describe('S10 — computeProjectCostAtTier', () => {
  it('verändert das Original-Projekt NICHT', () => {
    const p = project();
    computeProjectCostAtTier(p, 'luxus');
    expect(p.rooms[0].variants[0].materials[0].tier).toBe('standard');
  });

  it('Stufen sind monoton: Standard ≤ Premium ≤ Luxus (Brutto-Mitte)', () => {
    const p = project();
    const mids = TIERS.map((tier) => {
      const c = computeProjectCostAtTier(p, tier);
      return (c.gross.min + c.gross.max) / 2;
    });
    expect(mids[0]).toBeLessThanOrEqual(mids[1]);
    expect(mids[1]).toBeLessThanOrEqual(mids[2]);
    expect(mids[0]).toBeGreaterThan(0);
    expect(Number.isNaN(mids[2])).toBe(false);
  });
});
