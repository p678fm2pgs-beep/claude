/**
 * Erweiterung 6 · S4/S5 („Farb-Explosion") — dauerhafte Beweise.
 * RAL Classic komplett, NCS-Auswahl, 500+ kuratierte Töne, 5 Hersteller-Welten,
 * externe Töne (RAL/NCS/Hersteller) über findTone überall auflösbar —
 * und alles rein additiv (bestehende IDs unverändert).
 */
import { describe, it, expect } from 'vitest';
import {
  ALL_TONES,
  COLOR_FAMILIES,
  MANUFACTURER_COLLECTIONS,
  ALL_MANUFACTURER_COLORS,
  findTone,
  externalTone,
  ralToneId,
  ncsToneId,
  hexLrv,
  hexUndertone,
} from './colors';
import { RAL_CLASSIC, RAL_GROUPS } from './ralClassic';
import { NCS_TONES } from './ncs';

const HEX = /^#[0-9A-Fa-f]{6}$/;

describe('S4 — RAL Classic komplett', () => {
  it('enthält exakt die 213 RAL-Classic-Töne', () => {
    expect(RAL_CLASSIC.length).toBe(213);
  });

  it('alle Codes eindeutig, alle HEX-Werte gültig', () => {
    const codes = new Set(RAL_CLASSIC.map((t) => t.code));
    expect(codes.size).toBe(RAL_CLASSIC.length);
    for (const t of RAL_CLASSIC) expect(t.hex).toMatch(HEX);
  });

  it('Anker-Töne stimmen (9010 Reinweiß, 7016 Anthrazitgrau, 9005 Tiefschwarz)', () => {
    expect(RAL_CLASSIC.find((t) => t.code === 'RAL 9010')?.name).toBe('Reinweiß');
    expect(RAL_CLASSIC.find((t) => t.code === 'RAL 7016')?.name).toBe('Anthrazitgrau');
    expect(RAL_CLASSIC.find((t) => t.code === 'RAL 9005')?.name).toBe('Tiefschwarz');
  });

  it('jede RAL-Gruppe hat Töne, jeder Ton genau eine Gruppe', () => {
    for (const g of RAL_GROUPS) {
      expect(RAL_CLASSIC.some((t) => g.test(t.code))).toBe(true);
    }
    for (const t of RAL_CLASSIC) {
      expect(RAL_GROUPS.filter((g) => g.test(t.code)).length).toBe(1);
    }
  });
});

describe('S4 — NCS-Auswahl', () => {
  it('mindestens 60 strukturierte NCS-Töne mit gültigem HEX', () => {
    expect(NCS_TONES.length).toBeGreaterThanOrEqual(60);
    for (const t of NCS_TONES) {
      expect(t.code.startsWith('S ')).toBe(true);
      expect(t.hex).toMatch(HEX);
    }
  });

  it('Codes eindeutig', () => {
    expect(new Set(NCS_TONES.map((t) => t.code)).size).toBe(NCS_TONES.length);
  });
});

describe('S5 — 500+ kuratierte Töne, rein additiv', () => {
  it('mindestens 500 kuratierte HAVEN-Töne', () => {
    expect(ALL_TONES.length).toBeGreaterThanOrEqual(500);
  });

  it('IDs eindeutig, HEX gültig, jede Familie ≥ 10 Töne', () => {
    expect(new Set(ALL_TONES.map((t) => t.id)).size).toBe(ALL_TONES.length);
    for (const t of ALL_TONES) expect(t.hex).toMatch(HEX);
    for (const f of COLOR_FAMILIES) expect(f.tones.length).toBeGreaterThanOrEqual(10);
  });

  it('bestehende IDs unverändert (Nummerierung wird nur fortgesetzt)', () => {
    expect(findTone('weiss-1')?.name).toBe('Reinweiß');
    expect(findTone('weiss-1')?.hex).toBe('#F4F4F2');
    expect(findTone('anthrazit-1')?.ral).toBe('RAL 7016');
    expect(findTone('lavendel-10')?.name).toBe('Mauverosé');
    // Zusatztöne hängen hinten an:
    expect(findTone('weiss-11')).toBeDefined();
    expect(findTone('weiss-11')?.familyId).toBe('weiss');
  });
});

describe('S4 — 5 Hersteller-Welten inkl. Schöner Wohnen', () => {
  it('mindestens 5 Kollektionen', () => {
    expect(MANUFACTURER_COLLECTIONS.length).toBeGreaterThanOrEqual(5);
    const names = MANUFACTURER_COLLECTIONS.map((c) => c.manufacturer);
    expect(names).toContain('Farrow & Ball');
    expect(names).toContain('Little Greene');
    expect(names).toContain('Caparol');
    expect(names).toContain('Alpina');
    expect(names).toContain('Schöner Wohnen');
  });

  it('alle Herstellerfarben mit eindeutiger ID und gültigem HEX', () => {
    expect(new Set(ALL_MANUFACTURER_COLORS.map((c) => c.id)).size).toBe(ALL_MANUFACTURER_COLORS.length);
    for (const c of ALL_MANUFACTURER_COLORS) expect(c.hex).toMatch(HEX);
  });
});

describe('S5 — externe Töne überall auflösbar (findTone)', () => {
  it('RAL-ID → vollwertiger Ton', () => {
    const t = findTone('ral-9010');
    expect(t?.hex).toMatch(HEX);
    expect(t?.name).toContain('Reinweiß');
    expect(t?.familyId).toBe('ral');
  });

  it('NCS-ID → vollwertiger Ton', () => {
    const t = findTone(ncsToneId('S 1005-Y20R'));
    expect(t?.ncs).toBe('S 1005-Y20R');
    expect(t?.familyId).toBe('ncs');
  });

  it('Hersteller-ID → vollwertiger Ton (Schöner Wohnen)', () => {
    const t = findTone('sw-5');
    expect(t?.name).toContain('Riviera');
    expect(t?.familyId).toBe('hersteller');
  });

  it('alle 213 RAL-IDs sind auflösbar', () => {
    for (const r of RAL_CLASSIC) expect(externalTone(ralToneId(r.code))).toBeDefined();
  });

  it('alle NCS-IDs sind auflösbar', () => {
    for (const n of NCS_TONES) expect(externalTone(ncsToneId(n.code))).toBeDefined();
  });

  it('unbekannte IDs bleiben undefined (kein Fantasie-Fallback)', () => {
    expect(findTone('ral-0000')).toBeUndefined();
    expect(findTone('gibtsnicht-99')).toBeUndefined();
  });
});

describe('S5 — Näherungs-Helfer', () => {
  it('hexLrv: schwarz ≈ 0, weiß ≈ 100, monoton', () => {
    expect(hexLrv('#000000')).toBe(0);
    expect(hexLrv('#FFFFFF')).toBe(100);
    expect(hexLrv('#F4F4F2')).toBeGreaterThan(hexLrv('#373F43'));
  });

  it('hexUndertone: Grau neutral, Terrakotta warm, Blau kühl', () => {
    expect(hexUndertone('#ACACA9')).toBe('neutral');
    expect(hexUndertone('#B96A4C')).toBe('warm');
    expect(hexUndertone('#46698A')).toBe('kuehl');
  });
});
