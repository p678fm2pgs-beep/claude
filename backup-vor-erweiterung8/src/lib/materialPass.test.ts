/**
 * Erweiterung 6 · S11 — Material-Pass: dauerhafte Beweise.
 */
import { describe, it, expect } from 'vitest';
import { buildMaterialPass } from './materialPass';
import { MATERIALS, findMaterial } from '../data/materials';

describe('S11 — buildMaterialPass', () => {
  it('liefert für JEDES Katalog-Material einen vollständigen Pass', () => {
    for (const m of MATERIALS) {
      const pass = buildMaterialPass(m);
      for (const sec of [pass.pflege, pass.haltbarkeit, pass.eignung, pass.nachhaltigkeit]) {
        expect(sec.score, m.id).toBeGreaterThanOrEqual(1);
        expect(sec.score, m.id).toBeLessThanOrEqual(5);
        expect(sec.summary.length, m.id).toBeGreaterThan(3);
        expect(sec.lines.length, m.id).toBeGreaterThan(0);
        expect(sec.lines.length, m.id).toBe(sec.linesEn.length);
      }
    }
  });

  it('Eignung spiegelt die Katalogdaten (FBH/Nasszelle) wortgetreu', () => {
    const parkett = buildMaterialPass(findMaterial('parkett-eiche-landhaus')!);
    expect(parkett.eignung.lines.join(' ')).toContain('Fußbodenheizung');
    const fliese = buildMaterialPass(findMaterial('feinstein-6060-r10')!);
    expect(fliese.eignung.lines.join(' ')).toContain('Nasszelle/Bad: geeignet');
    expect(fliese.eignung.lines.join(' ')).toContain('R10');
  });

  it('Nachhaltigkeit: Holz sehr gut, Vinyl mit PVC-Hinweis', () => {
    const holz = buildMaterialPass(findMaterial('parkett-eiche-landhaus')!);
    expect(holz.nachhaltigkeit.score).toBe(5);
    const vinyl = buildMaterialPass(findMaterial('vinyl-spc-stein')!);
    expect(vinyl.nachhaltigkeit.score).toBeLessThanOrEqual(2);
    expect(vinyl.nachhaltigkeit.lines.join(' ')).toContain('PVC');
  });

  it('Pflege-Score folgt der gepflegten Pflegestufe', () => {
    const gering = MATERIALS.find((m) => m.tech.pflege === 'gering');
    const hoch = MATERIALS.find((m) => m.tech.pflege === 'hoch');
    if (gering && hoch) {
      expect(buildMaterialPass(gering).pflege.score).toBeGreaterThan(buildMaterialPass(hoch).pflege.score);
    }
  });
});
