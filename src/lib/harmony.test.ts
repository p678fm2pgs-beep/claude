import { describe, it, expect } from 'vitest';
import {
  companionRecommendations,
  antiRecommendations,
  SIGNATURE_COMBOS,
  balance606030,
  lightHint,
  suggestCeilingTone,
} from './harmony';
import { ALL_TONES } from '../data/colors';

describe('Harmonie-Engine — deterministisch & nicht leer', () => {
  it('liefert für jeden Ton nicht-leere Begleitempfehlungen', () => {
    for (const tone of ALL_TONES.slice(0, 24)) {
      const recs = companionRecommendations(tone.id);
      expect(recs.length).toBeGreaterThanOrEqual(3);
      recs.forEach((r) => {
        expect(r.tone.id).not.toBe(tone.id);
        expect(r.reasonKey).toMatch(/^harmony\.reason\./);
      });
    }
  });

  it('Empfehlungen sind deterministisch (zweimal identisch)', () => {
    const a = companionRecommendations('weiss-4').map((r) => r.tone.id);
    const b = companionRecommendations('weiss-4').map((r) => r.tone.id);
    expect(a).toEqual(b);
  });

  it('enthält die vier Harmonie-Arten', () => {
    const kinds = companionRecommendations('blau-1').map((r) => r.kind);
    expect(kinds).toContain('analog');
    expect(kinds).toContain('komplementaer');
    expect(kinds).toContain('triade');
    expect(kinds).toContain('neutral');
  });

  it('Anti-Empfehlungen: 2–3 Töne mit Begründung', () => {
    const antis = antiRecommendations('terrakotta-1');
    expect(antis.length).toBeGreaterThanOrEqual(1);
    expect(antis.length).toBeLessThanOrEqual(3);
    antis.forEach((a) => expect(a.reasonKey).toMatch(/^harmony\.anti\./));
  });

  it('unbekannte Ton-ID → leere Listen', () => {
    expect(companionRecommendations('does-not-exist')).toEqual([]);
    expect(antiRecommendations('does-not-exist')).toEqual([]);
  });

  it('mindestens 8 Signature-Kombinationen mit gültigen Tönen', () => {
    expect(SIGNATURE_COMBOS.length).toBeGreaterThanOrEqual(8);
    for (const combo of SIGNATURE_COMBOS) {
      expect(combo.toneIds.length).toBeGreaterThanOrEqual(3);
      for (const id of combo.toneIds) {
        expect(ALL_TONES.find((t) => t.id === id)).toBeDefined();
      }
    }
  });
});

describe('Harmonie-Engine — 60-30-10 & Licht', () => {
  it('60-30-10-Bilanz erkennt dominanten Grundton', () => {
    const r = balance606030({ wand: 'weiss-1', boden: 'braun-1', akzent: 'anthrazit-1' });
    expect(r.shares.length).toBe(3);
    const wand = r.shares.find((s) => s.role === 'wand');
    expect(wand!.pct).toBeGreaterThanOrEqual(45);
    expect(r.skewed).toBe(false);
  });

  it('Nord/wenig Licht empfiehlt warme Untertöne & hohe LRV', () => {
    const h = lightHint({ orientation: 'N', daylight: 'wenig' }, 20);
    expect(h.recommendUndertone).toBe('warm');
    expect(h.minLrv).toBeGreaterThanOrEqual(60);
    expect(h.messageKey).toBe('harmony.light.northWarm');
  });

  it('Süd/viel Licht erlaubt kühle Töne', () => {
    const h = lightHint({ orientation: 'S', daylight: 'viel' }, 30);
    expect(h.recommendUndertone).toBe('kuehl');
  });

  it('kleiner Raum (<12 m²) empfiehlt LRV ≥ 60', () => {
    const h = lightHint({ orientation: 'O', daylight: 'mittel' }, 8);
    expect(h.minLrv).toBeGreaterThanOrEqual(60);
  });

  it('Decken-Vorschlag ist immer ein heller Weißton', () => {
    const ceil = suggestCeilingTone('braun-3');
    expect(ceil.familyId).toBe('weiss');
    expect(ceil.lrv).toBeGreaterThanOrEqual(70);
  });
});
