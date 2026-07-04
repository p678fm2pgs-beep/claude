/**
 * Erweiterung 8 · T7/T8 — Varianten-Vergleich + Lookbook/Freigabe: Beweise.
 */
import { describe, it, expect } from 'vitest';
import { compareVariants } from './variantCompare';
import { buildLookbookPdf } from '../modules/pdf/exportLookbook';
import type { Project, Room, Variant } from '../types';

function variant(id: string, floorMat: string): Variant {
  return {
    id, name: id.toUpperCase(), colorRoles: { wand: 'weiss-1' },
    materials: [
      { id: `m-${id}`, materialId: floorMat, surface: 'boden', tier: 'premium' },
      { id: `w-${id}`, materialId: 'wandfarbe-matt', surface: 'wand', tier: 'premium' },
    ],
    furniture: [], trades: [], lighting: [], notes: '',
  };
}

function room(): Room {
  return {
    id: 'r1', name: 'Wohnen', type: 'wohnzimmer',
    floorplan: { points: [{ x: 0, y: 0 }, { x: 500, y: 0 }, { x: 500, y: 400 }, { x: 0, y: 400 }], openings: [] },
    heightCm: 270, light: { orientation: 'S', daylight: 'mittel' },
    activeVariantId: 'a',
    variants: [variant('a', 'laminat-eiche'), variant('b', 'naturstein-marmor')],
  } as Room;
}

function project(): Project {
  return {
    id: 'p1', schemaVersion: 3, name: 'Vergleich', created: 1, modified: 2,
    priceListDate: '06/2026', rooms: [room()],
    settings: { reservePercent: 10, fee: { type: 'prozent', value: 12 }, vatPercent: 19, paintCoverage: 8 },
  } as Project;
}

describe('T7 — Varianten-Vergleich', () => {
  it('liefert beide Summen + Differenz; Marmor teurer als Laminat', () => {
    const cmp = compareVariants(room(), 'a', 'b', 8, 'de')!;
    expect(cmp.a.coreMaterials.length).toBeGreaterThan(0);
    expect(cmp.diffMid).toBeGreaterThan(0); // B (Marmor) teurer
    expect(cmp.b.vkMin).toBeGreaterThan(cmp.a.vkMin);
  });

  it('EK nur in der Summary vorhanden (Kundensicht filtert im PDF)', () => {
    const cmp = compareVariants(room(), 'a', 'b', 8, 'de')!;
    expect(cmp.a.ekMin).toBeGreaterThan(0);
  });

  it('unbekannte Variante → null', () => {
    expect(compareVariants(room(), 'a', 'x', 8, 'de')).toBeNull();
  });
});

describe('T7/T8 — Lookbook mit Optionen', () => {
  it('Vergleichsseite + Freigabeseite bauen ohne Fehler', () => {
    const doc = buildLookbookPdf(project(), 'de', { compare: true, approval: true, internal: false });
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(3);
  });

  it('Freigabe mit vorhandener Unterschrift wird eingebettet', () => {
    const p = project();
    p.approvals = [{ id: 'ap1', variantId: 'a', signaturePng: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', timestamp: 1700000000000, sumLabel: '10.000 €' }];
    expect(() => buildLookbookPdf(p, 'de', { approval: true })).not.toThrow();
  });

  it('ohne Optionen: kein Absturz (Standard-Lookbook)', () => {
    expect(() => buildLookbookPdf(project(), 'en')).not.toThrow();
  });
});
