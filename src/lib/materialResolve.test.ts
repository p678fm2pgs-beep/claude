import { describe, it, expect, vi } from 'vitest';
import {
  resolveSurfaceSelection,
  resolveFloorSelection,
  resolveFloorMaterial,
  resolveMaterial,
  resolveWallColorHex,
} from './materialResolve';
import { MATERIALS, findMaterial } from '../data/materials';
import { STYLE_PRESETS } from '../data/presets';
import { createDemoProject, createShowcaseProject } from './factory';
import type { MaterialSelection, Variant } from '../types';

function variant(materials: MaterialSelection[], extra: Partial<Variant> = {}): Variant {
  return {
    id: 'v',
    name: 'v',
    colorRoles: {},
    materials,
    furniture: [],
    trades: [],
    lighting: [],
    notes: '',
    ...extra,
  };
}
const sel = (materialId: string, surface: MaterialSelection['surface'], wallIndex?: number): MaterialSelection => ({
  id: materialId + (wallIndex ?? ''),
  materialId,
  surface,
  tier: 'premium',
  wallIndex,
});

// repräsentative Liste quer durch ALLE Kategorien inkl. Verlegemuster-Varianten (≥20, Erweiterung 6 S1)
const SAMPLE_IDS = [
  'parkett-eiche-landhaus', 'parkett-eiche-fischgraet', 'parkett-nussbaum-chevron', 'massivdiele-eiche',
  'laminat-eiche', 'vinyl-spc-stein', 'feinstein-grossformat', 'feinstein-6060-r10', 'naturstein-travertin',
  'naturstein-marmor', 'naturstein-granit', 'bambus-boden', 'feinstein-hexagon', 'wandfarbe-matt',
  'kalkfarbe', 'tadelakt', 'mikrozement-boden', 'kork-boden', 'linoleum-boden', 'teppichboden-wolle',
  'gussboden', 'zementfliese', 'beton-cire', 'holz-lamellen', 'decke-anstrich', 'textil-boucle',
  'metall-messing-gebuerstet',
];

describe('Material-Mapping (Fix) — ID → korrekte Definition (kein Fallback)', () => {
  it('20+ Material-IDs lösen exakt auf das erwartete Material auf', () => {
    expect(SAMPLE_IDS.length).toBeGreaterThanOrEqual(20);
    for (const id of SAMPLE_IDS) {
      const m = findMaterial(id);
      expect(m, id).toBeDefined();
      expect(m!.id).toBe(id);
      expect(m!.texture.base).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('Asset-Existenz — keine toten Referenzen', () => {
  it('jedes Katalog-Material hat gültige Textur-Basisfarbe', () => {
    for (const m of MATERIALS) expect(m.texture.base, m.id).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
  it('alle Preset-Material-IDs existieren', () => {
    const ids = new Set(MATERIALS.map((m) => m.id));
    for (const p of STYLE_PRESETS) for (const mid of p.materialIds) expect(ids.has(mid), `${p.id}:${mid}`).toBe(true);
  });
  it('alle Demo-/Showcase-Auswahlen lösen auf', () => {
    for (const proj of [createDemoProject(), createShowcaseProject()])
      for (const r of proj.rooms)
        for (const v of r.variants)
          for (const ms of v.materials) expect(findMaterial(ms.materialId), ms.materialId).toBeDefined();
  });
});

describe('Resolver — zuletzt gewählte Auswahl gewinnt (behebt „falsches Material")', () => {
  it('bei mehreren Boden-Auswahlen zählt die LETZTE, nicht die erste', () => {
    const v = variant([
      sel('parkett-eiche-fischgraet', 'boden'), // alt (dunkel)
      sel('wandfarbe-matt', 'wand'),
      sel('naturstein-marmor', 'boden'), // neu gewählt (hell)
    ]);
    // alte (fehlerhafte) Logik hätte das ERSTE genommen:
    expect(v.materials.find((m) => m.surface === 'boden')!.materialId).toBe('parkett-eiche-fischgraet');
    // neue Resolver-Logik nimmt das LETZTE = aktuelle Auswahl:
    expect(resolveFloorSelection(v)!.materialId).toBe('naturstein-marmor');
    expect(resolveFloorMaterial(v).material!.id).toBe('naturstein-marmor');
  });

  it('Wandfarbe je Wand: explizit > Wandmaterial (zuletzt) > Wandrolle', () => {
    const reinweiss = findMaterial('wandfarbe-matt')!;
    const v = variant(
      [sel('holz-lamellen', 'wand', 2), sel('ziegelriemchen', 'wand', 2)],
      { wallColors: { 0: 'schwarz-1' }, colorRoles: { wand: 'weiss-1' } },
    );
    // Wand 0: explizite Farbe schwarz-1
    expect(resolveWallColorHex(v, 0).toLowerCase()).toBe('#171717');
    // Wand 2: zuletzt gewähltes Wandmaterial (ziegelriemchen)
    expect(resolveWallColorHex(v, 2)).toBe(findMaterial('ziegelriemchen')!.texture.base);
    // Wand 1: keine Auswahl → Wandrolle (weiss-1)
    expect(resolveWallColorHex(v, 1)).toBe(reinweiss && '#F4F4F2');
  });

  it('resolveSurfaceSelection respektiert wallIndex', () => {
    const v = variant([sel('tadelakt', 'wand', 0), sel('mikrozement-wand', 'wand', 1)]);
    expect(resolveSurfaceSelection(v, 'wand', 0)!.materialId).toBe('tadelakt');
    expect(resolveSurfaceSelection(v, 'wand', 1)!.materialId).toBe('mikrozement-wand');
  });
});

describe('Fallback — fehlende ID scheitert nicht still', () => {
  it('unbekannte Material-ID → undefined + console.warn (kein irreführendes Standardbild)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = resolveMaterial(sel('gibt-es-nicht', 'boden'));
    expect(m).toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
