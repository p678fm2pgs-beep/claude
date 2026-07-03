/**
 * Erweiterung 6 · S12 — Musterbestell-Liste + Lookbook: dauerhafte Beweise.
 */
import { describe, it, expect } from 'vitest';
import { buildSampleList, sampleListCsv } from './sampleList';
import { buildLookbookPdf } from '../modules/pdf/exportLookbook';
import type { Project } from '../types';

function project(): Project {
  return {
    id: 'p1',
    schemaVersion: 3,
    name: 'Villa Test',
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
            colorRoles: { wand: 'weiss-1', akzent: 'gruen-2' },
            materials: [
              { id: 'm1', materialId: 'parkett-eiche-landhaus', surface: 'boden', tier: 'premium', pattern: 'fischgraet', finish: 'natur-geoelt' },
              { id: 'm2', materialId: 'kalkfarbe', surface: 'wand', tier: 'premium' },
            ],
            furniture: [],
            trades: [],
            lighting: [],
            notes: 'Ruhig; hell — "Quiet Luxury"',
          },
        ],
      },
      {
        id: 'r2',
        name: 'Bad',
        type: 'bad',
        floorplan: {
          points: [
            { x: 0, y: 0 },
            { x: 300, y: 0 },
            { x: 300, y: 250 },
            { x: 0, y: 250 },
          ],
          openings: [],
        },
        heightCm: 250,
        light: { orientation: 'N', daylight: 'gering' },
        activeVariantId: 'v2',
        variants: [
          {
            id: 'v2',
            name: 'A',
            colorRoles: { wand: 'weiss-1' }, // Duplikat → darf nur 1× erscheinen
            materials: [
              { id: 'm3', materialId: 'feinstein-6060-r10', surface: 'boden', tier: 'standard' },
            ],
            furniture: [],
            trades: [],
            lighting: [],
            notes: '',
          },
        ],
      },
    ],
    settings: { reservePercent: 10, fee: { type: 'prozent', value: 12 }, vatPercent: 19, paintCoverage: 8 },
  } as Project;
}

describe('S12 — buildSampleList', () => {
  it('sammelt Materialien + Farbtöne, dedupliziert projektweit', () => {
    const rows = buildSampleList(project());
    const mats = rows.filter((r) => r.art === 'material');
    const tones = rows.filter((r) => r.art === 'farbton');
    expect(mats.length).toBe(3);
    expect(tones.filter((r) => r.name === 'Reinweiß').length).toBe(1); // dedupliziert
    expect(tones.length).toBe(2);
  });

  it('Material-Zeilen tragen Ausführung, Farbton-Zeilen RAL/NCS-Referenz', () => {
    const rows = buildSampleList(project());
    const parkett = rows.find((r) => r.name === 'Eiche Landhausdiele natur');
    expect(parkett?.ausfuehrung).toContain('natur-geoelt');
    expect(parkett?.ausfuehrung).toContain('fischgraet');
    const weiss = rows.find((r) => r.name === 'Reinweiß');
    expect(weiss?.referenz).toContain('RAL 9010');
  });

  it('keinerlei Preis-/EK-Angaben in der Liste (kundensicher)', () => {
    const csv = sampleListCsv(buildSampleList(project()));
    expect(csv).not.toMatch(/EK|Marge|€|EUR/i);
  });
});

describe('S12 — sampleListCsv', () => {
  it('quotet Felder mit Semikolon/Anführungszeichen korrekt', () => {
    const csv = sampleListCsv([
      { art: 'farbton', name: 'Grün; "Salbei"', referenz: 'RAL 6021', raum: 'Bad', einsatz: 'Wand', ausfuehrung: '' },
    ]);
    expect(csv).toContain('"Grün; ""Salbei"""');
    expect(csv.charCodeAt(0)).toBe(0xfeff); // BOM für Excel
  });
});

describe('S12 — buildLookbookPdf', () => {
  it('baut ohne Fehler: Deckblatt + 1 Seite je Raum + Musterliste', () => {
    const doc = buildLookbookPdf(project(), 'de');
    // 1 Deckblatt + 2 Räume + ≥1 Musterlisten-Seite
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(4);
  });

  it('englische Ausgabe baut ebenfalls', () => {
    expect(() => buildLookbookPdf(project(), 'en')).not.toThrow();
  });
});
