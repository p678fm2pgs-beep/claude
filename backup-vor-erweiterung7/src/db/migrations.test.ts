import { describe, it, expect } from 'vitest';
import { migrateProject } from './migrations';
import { SCHEMA_VERSION, type Project } from '../types';

describe('Migrationen', () => {
  it('v1-Projekt ohne `trades` lädt fehlerfrei und erhält trades:[]', () => {
    const legacy = {
      id: 'p1',
      schemaVersion: 1,
      name: 'Alt',
      created: 1,
      modified: 2,
      priceListDate: '01/2025',
      rooms: [
        {
          id: 'r1',
          name: 'Raum',
          type: 'wohnzimmer',
          floorplan: { points: [], openings: [] },
          heightCm: 270,
          light: { orientation: 'S', daylight: 'mittel' },
          activeVariantId: 'v1',
          variants: [{ id: 'v1', name: 'A', colorRoles: {}, materials: [], furniture: [], notes: '' }],
        },
      ],
      settings: { reservePercent: 10, fee: { type: 'prozent', value: 12 }, vatPercent: 19, paintCoverage: 8 },
    } as unknown as Project;

    const migrated = migrateProject(legacy);
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrated.rooms[0].variants[0].trades).toEqual([]);
    expect(migrated.rooms[0].variants[0].lighting).toEqual([]);
  });

  it('fehlende settings werden mit Defaults ergänzt', () => {
    const broken = {
      id: 'p2',
      name: 'X',
      created: 1,
      modified: 1,
      priceListDate: '01/2025',
      rooms: [],
    } as unknown as Project;
    const migrated = migrateProject(broken);
    expect(migrated.settings.reservePercent).toBe(10);
    expect(migrated.settings.vatPercent).toBe(19);
    expect(migrated.settings.paintCoverage).toBe(8);
  });
});
