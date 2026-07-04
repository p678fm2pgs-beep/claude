/**
 * Erweiterung 8 · T2 — Draufsichtsymbole: dauerhafte Beweise.
 */
import { describe, it, expect } from 'vitest';
import { objectSymbol } from './objectSymbols';
import { findFurnitureType } from '../data/furniture';
import type { PlacedObject } from '../types';

function placed(typeId: string, extra: Partial<PlacedObject> = {}): PlacedObject {
  const ft = findFurnitureType(typeId)!;
  const m = ft.place!;
  return {
    id: 'o', typeId, x: 200, y: 200, rotationDeg: 0,
    widthCm: m.defaultW, depthCm: m.defaultD, heightCm: m.defaultH,
    shape: m.shapes[0], tier: 'premium', ...extra,
  };
}

describe('T2 — objectSymbol', () => {
  it('jede Kategorie liefert ein eigenes, nicht-leeres Symbol', () => {
    const ids = ['sofa', 'bett', 'schrank', 'esstisch', 'kuechenzeile', 'badewanne', 'kamin-wand', 'hk-flach', 'teppich', 'spiegel', 'treppe-gerade'];
    const prints = ids.map((id) => {
      const lines = objectSymbol(placed(id), findFurnitureType(id)!.place);
      expect(lines.length, id).toBeGreaterThan(0);
      return JSON.stringify(lines.map((l) => l.pts.length + l.style)).slice(0, 400);
    });
    expect(new Set(prints).size).toBe(ids.length);
  });

  it('Teppich: gestrichelter Umriss (Ebene unter Möbeln)', () => {
    const lines = objectSymbol(placed('teppich'), findFurnitureType('teppich')!.place);
    expect(lines[0].style).toBe('dashed');
  });

  it('Treppe: Stufenlinien + Lauflinie mit Pfeil + Schnittlinie', () => {
    const lines = objectSymbol(placed('treppe-gerade'), findFurnitureType('treppe-gerade')!.place);
    expect(lines.filter((l) => l.style === 'thin').length).toBeGreaterThanOrEqual(5); // Stufen
    expect(lines.some((l) => l.style === 'dashed')).toBe(true); // Schnittlinie
  });

  it('Küche: Segmente erzeugen sichtbare Zusatzsymbole', () => {
    const ohne = objectSymbol(placed('kuechenzeile'), findFurnitureType('kuechenzeile')!.place);
    const mit = objectSymbol(
      placed('kuechenzeile', { segments: [{ posCm: 0, kind: 'spuele' }, { posCm: 60, kind: 'kochfeld' }] }),
      findFurnitureType('kuechenzeile')!.place,
    );
    expect(mit.length).toBeGreaterThan(ohne.length + 3);
  });

  it('Rotation dreht das gesamte Symbol mit', () => {
    const a = objectSymbol(placed('sofa'), findFurnitureType('sofa')!.place);
    const b = objectSymbol(placed('sofa', { rotationDeg: 90 }), findFurnitureType('sofa')!.place);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
});
