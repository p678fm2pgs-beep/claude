import { describe, it, expect } from 'vitest';
import { fillFloorSurface } from './texture';
import { MATERIALS } from '../data/materials';
import type { Texture } from '../data/materials';

const bbox = { minX: 0, minY: 0, maxX: 400, maxY: 300 };

describe('Boden-Parität (Fix 2) — Material-Optik statt immer Holzdielen', () => {
  it('fillFloorSurface läuft für jede Textur-Variante ohne Fehler', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const variants: Texture['variant'][] = ['wood', 'stone', 'tile', 'plaster', 'textile', 'metal', 'carpet', 'solid'];
    for (const variant of variants) {
      const texture: Texture = { base: '#B9B2A6', variant, grain: '#8A8675' };
      expect(() => fillFloorSurface(ctx, bbox, 60, { texture }), variant).not.toThrow();
    }
  });

  it('jeder Katalog-Boden lässt sich ohne Fehler als Bodenfläche füllen', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const floors = MATERIALS.filter((m) => m.surface === 'boden');
    expect(floors.length).toBeGreaterThan(10);
    for (const m of floors) {
      expect(() => fillFloorSurface(ctx, bbox, 60, { texture: m.texture }), m.id).not.toThrow();
    }
  });

  it('Holz-Verlegemuster (Fischgräte/Chevron) werden für Holzböden akzeptiert', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const wood: Texture = { base: '#7A5C3E', variant: 'wood', grain: '#523E2A' };
    for (const pattern of ['gerade', 'fischgraet', 'chevron', 'diagonal']) {
      expect(() => fillFloorSurface(ctx, bbox, 60, { texture: wood, pattern })).not.toThrow();
    }
  });
});
