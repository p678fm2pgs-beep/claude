/**
 * REGRESSIONSSCHUTZ (Erweiterung 4, Abschnitt 2) — „no-regression".
 * Schutzschild: stellt sicher, dass nichts Bestehendes verloren geht.
 * Baselines wurden VOR Erweiterung 4 festgeschrieben (Stand backup-vor-erweiterung4).
 * Neue Zahl darf nur ≥ Baseline sein, niemals <.
 */
import { describe, it, expect } from 'vitest';
import { ALL_TONES, COLOR_FAMILIES, findTone } from '../data/colors';
import { MATERIALS, findMaterial } from '../data/materials';
import { FURNITURE_TYPES, findFurnitureType } from '../data/furniture';
import { TRADE_POSITIONS, findTrade } from '../data/prices';
import { ADDONS, findAddon } from '../data/addons';
import { STYLE_PRESETS } from '../data/presets';
import { migrateProject } from '../db/migrations';
import { computeProjectCost } from '../lib/projectCost';
import type { Project } from '../types';

// ── Eingefrorene Baselines (vor Erweiterung 4) ──
const BASELINE = {
  tones: 120,
  families: 12,
  materials: 63,
  furniture: 18, // Baseline VOR Erw. 4 (nur ≥) — Erw. 8 wuchs auf 56 (siehe furniturePlus)
  trades: 18,
  addons: 25,
  presets: 5,
} as const;

describe('no-regression — Katalogmengen ≥ Baseline (nur additiv)', () => {
  it('Farbtöne', () => expect(ALL_TONES.length).toBeGreaterThanOrEqual(BASELINE.tones));
  it('Farbfamilien', () => expect(COLOR_FAMILIES.length).toBeGreaterThanOrEqual(BASELINE.families));
  it('Materialien', () => expect(MATERIALS.length).toBeGreaterThanOrEqual(BASELINE.materials));
  it('Möbeltypen', () => expect(FURNITURE_TYPES.length).toBeGreaterThanOrEqual(BASELINE.furniture));
  it('Gewerke-Positionen', () => expect(TRADE_POSITIONS.length).toBeGreaterThanOrEqual(BASELINE.trades));
  it('Nebenpositionen', () => expect(ADDONS.length).toBeGreaterThanOrEqual(BASELINE.addons));
  it('Stil-Presets', () => expect(STYLE_PRESETS.length).toBeGreaterThanOrEqual(BASELINE.presets));
});

describe('no-regression — Stichproben bestehender Einträge unverändert', () => {
  it('Farben: Reinweiß & Anthrazit exakt gleich', () => {
    const reinweiss = findTone('weiss-1');
    expect(reinweiss?.name).toBe('Reinweiß');
    expect(reinweiss?.hex).toBe('#F4F4F2');
    expect(reinweiss?.ral).toBe('RAL 9010');
    expect(findTone('anthrazit-1')?.ral).toBe('RAL 7016');
    expect(findTone('weiss-1')?.lrv).toBe(88);
  });

  it('Material: Eiche Landhausdiele natur — Name & Preise unverändert', () => {
    const m = findMaterial('parkett-eiche-landhaus');
    expect(m?.name).toBe('Eiche Landhausdiele natur');
    expect(m?.prices.standard.materialVK).toBe(79);
    expect(m?.prices.premium.laborVK).toBe(42);
    expect(m?.surface).toBe('boden');
  });

  it('Material: R10-Fliese & Marmor bestehen weiter', () => {
    expect(findMaterial('feinstein-6060-r10')?.tech.rutschklasse).toBe('R10 / B');
    expect(findMaterial('naturstein-marmor')?.name).toBe('Marmor Calacatta poliert');
  });

  it('Möbel & Gewerke & Nebenpositionen: Stichproben vorhanden', () => {
    expect(findFurnitureType('sofa')?.price.standard).toEqual([800, 1800]);
    expect(findTrade('fbh')?.gewerk).toBe('heizung');
    expect(findAddon('sockelleisten')?.vk).toBe(9);
  });
});

describe('no-regression — Altprojekte bleiben gültig & rechnen unverändert', () => {
  /** Ein „altes" Projekt OHNE die neuen optionalen Felder (Erweiterung 4). */
  function legacyProject(): Project {
    return {
      id: 'legacy',
      schemaVersion: 2,
      name: 'Alt',
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
              colorRoles: { wand: 'weiss-1', boden: 'braun-1' },
              materials: [
                { id: 'm1', materialId: 'parkett-eiche-landhaus', surface: 'boden', tier: 'standard', pattern: 'gerade' },
                { id: 'm2', materialId: 'wandfarbe-matt', surface: 'wand', tier: 'standard' },
              ],
              furniture: [{ id: 'f1', typeId: 'sofa', label: 'Sofa', tier: 'standard', quantity: 1, unit: 'Stk' }],
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

  it('Migration hebt schemaVersion an, ohne Daten zu verlieren', () => {
    const migrated = migrateProject(legacyProject());
    expect(migrated.rooms[0].variants[0].materials.length).toBe(2);
    expect(migrated.rooms[0].variants[0].materials[0].pattern).toBe('gerade');
  });

  it('Kalkulation eines Altprojekts bleibt valide (Brutto > Netto, kein NaN)', () => {
    const cost = computeProjectCost(migrateProject(legacyProject()));
    expect(cost.net.min).toBeGreaterThan(0);
    expect(cost.gross.min).toBeGreaterThan(cost.net.min);
    expect(Number.isNaN(cost.gross.max)).toBe(false);
  });
});
