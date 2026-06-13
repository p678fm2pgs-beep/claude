import { describe, it, expect } from 'vitest';
import { checkMaterialSuitability, allWarnings } from './suitability';
import { findMaterial } from '../data/materials';

const get = (id: string) => {
  const m = findMaterial(id);
  if (!m) throw new Error(`Material ${id} fehlt`);
  return m;
};

describe('Eignungs- & Plausibilitätswarnungen', () => {
  it('Massivparkett + Bad: nicht nasszellentauglich + Rutschklasse', () => {
    const warns = checkMaterialSuitability(get('massivdiele-eiche'), 'bad').map((w) => w.code);
    expect(warns).toContain('suit.notWetroom');
    expect(warns).toContain('suit.slipResistance');
  });

  it('Massivparkett + FBH-Warnung im Wohnzimmer', () => {
    const warns = checkMaterialSuitability(get('massivdiele-eiche'), 'wohnzimmer').map((w) => w.code);
    expect(warns).toContain('suit.massivFbh');
  });

  it('R10-Fliese im Bad löst KEINE Rutsch-Warnung aus', () => {
    const warns = checkMaterialSuitability(get('feinstein-6060-r10'), 'bad').map((w) => w.code);
    expect(warns).not.toContain('suit.slipResistance');
    expect(warns).not.toContain('suit.notWetroom');
  });

  it('R9-Großformat im Bad warnt bei Rutschklasse', () => {
    const warns = checkMaterialSuitability(get('feinstein-grossformat'), 'bad').map((w) => w.code);
    expect(warns).toContain('suit.slipResistance');
  });

  it('Außenbereich: nicht frostsicheres Parkett warnt', () => {
    const warns = checkMaterialSuitability(get('parkett-eiche-landhaus'), 'aussen').map((w) => w.code);
    expect(warns).toContain('suit.notFrostproof');
  });

  it('Teppichboden im Bad → Plausibilitätswarnung', () => {
    const warns = allWarnings(get('teppichboden-wolle'), 'bad').map((w) => w.code);
    expect(warns).toContain('suit.carpetBath');
  });

  it('FBH bedingt → Info-Hinweis', () => {
    const warns = checkMaterialSuitability(get('parkett-eiche-landhaus'), 'wohnzimmer');
    expect(warns.some((w) => w.code === 'suit.fbhConditional' && w.severity === 'info')).toBe(true);
  });

  it('passendes Material erzeugt keine Warnung', () => {
    expect(checkMaterialSuitability(get('feinstein-6060-r10'), 'wohnzimmer')).toEqual([]);
  });
});
