import { describe, it, expect } from 'vitest';
import { COLOR_FAMILIES, ALL_TONES } from './colors';
import { MATERIALS, MATERIAL_CATEGORIES } from './materials';
import { FURNITURE_TYPES } from './furniture';
import { TRADE_POSITIONS } from './prices';
import { ADDONS } from './addons';

describe('Katalog-Vollständigkeit — Farben', () => {
  it('≥ 12 Familien mit je ≥ 10 Tönen (additiv erweiterbar)', () => {
    expect(COLOR_FAMILIES.length).toBeGreaterThanOrEqual(12);
    for (const fam of COLOR_FAMILIES) {
      expect(fam.tones.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('jeder Ton trägt HEX, RAL, NCS, LRV und Unterton', () => {
    for (const t of ALL_TONES) {
      expect(t.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(t.ral).toMatch(/RAL/);
      expect(t.ncs.length).toBeGreaterThan(0);
      expect(t.lrv).toBeGreaterThanOrEqual(0);
      expect(['warm', 'kuehl', 'neutral']).toContain(t.undertone);
    }
  });

  it('Ton-IDs sind eindeutig', () => {
    const ids = new Set(ALL_TONES.map((t) => t.id));
    expect(ids.size).toBe(ALL_TONES.length);
  });

  it('Anker-Weißtöne vorhanden (Reinweiß ≈ RAL 9010)', () => {
    expect(ALL_TONES.find((t) => t.name === 'Reinweiß')?.ral).toBe('RAL 9010');
    expect(ALL_TONES.find((t) => t.name === 'Anthrazit')?.ral).toBe('RAL 7016');
  });
});

describe('Katalog-Vollständigkeit — Materialien', () => {
  it('60+ Materialien gesamt', () => {
    expect(MATERIALS.length).toBeGreaterThanOrEqual(60);
  });

  it('keine leere Kategorie, jede Kachel hat Textur & Beschreibung', () => {
    for (const cat of MATERIAL_CATEGORIES) {
      const list = MATERIALS.filter((m) => m.category === cat);
      expect(list.length).toBeGreaterThan(0);
    }
    for (const m of MATERIALS) {
      expect(m.texture.base).toMatch(/^#?[0-9A-Fa-f]/);
      expect(m.description.length).toBeGreaterThan(0);
      expect(m.tags.length).toBeGreaterThan(0);
      expect(m.prices.standard).toBeDefined();
      expect(m.prices.premium).toBeDefined();
      expect(m.prices.luxus).toBeDefined();
    }
  });

  it('Böden decken die Hauptarten ab', () => {
    const subs = new Set(MATERIALS.filter((m) => m.category === 'Böden').map((m) => m.subcategory));
    ['Parkett', 'Laminat', 'Vinyl / LVT', 'Naturstein', 'Fliesen / Feinsteinzeug', 'Teppichboden', 'Mikrozement', 'Kork', 'Linoleum', 'Massivholzdielen'].forEach(
      (s) => expect(subs.has(s)).toBe(true),
    );
  });

  it('Material-IDs sind eindeutig', () => {
    const ids = new Set(MATERIALS.map((m) => m.id));
    expect(ids.size).toBe(MATERIALS.length);
  });

  it('jedes Material verweist nur auf existierende Nebenpositionen', () => {
    const addonIds = new Set(ADDONS.map((a) => a.id));
    for (const m of MATERIALS) {
      for (const a of m.addons) expect(addonIds.has(a)).toBe(true);
    }
  });
});

describe('Katalog-Vollständigkeit — Möbel & Gewerke', () => {
  it('Möbeltypen vorhanden und je Raumtyp zugeordnet', () => {
    expect(FURNITURE_TYPES.length).toBeGreaterThanOrEqual(15);
    for (const f of FURNITURE_TYPES) {
      expect(f.rooms.length).toBeGreaterThan(0);
      expect(f.price.standard[0]).toBeLessThanOrEqual(f.price.standard[1]);
    }
  });

  it('Gewerke-Positionen für Bad und Küche vorhanden', () => {
    const bad = TRADE_POSITIONS.filter((t) => t.roomTypes.includes('bad'));
    const kueche = TRADE_POSITIONS.filter((t) => t.roomTypes.includes('kueche'));
    expect(bad.length).toBeGreaterThanOrEqual(5);
    expect(kueche.length).toBeGreaterThanOrEqual(5);
    expect(TRADE_POSITIONS.find((t) => t.id === 'fbh')).toBeDefined();
  });
});
