/**
 * Erweiterung 6 · S2 — Fehler-Sweep als dauerhafter Integritäts-Schild.
 * Prüft Querverweise zwischen den Katalogen: alles, was auf eine ID zeigt,
 * muss auch auflösbar sein. Verhindert stille Brüche bei künftigen Erweiterungen.
 */
import { describe, it, expect } from 'vitest';
import { STYLE_PRESETS } from '../data/presets';
import { SIGNATURE_COMBOS } from '../lib/harmony';
import { MATERIALS } from '../data/materials';
import { FURNITURE_TYPES } from '../data/furniture';
import { findTone } from '../data/colors';
import { findAddon } from '../data/addons';
import { findMaterial } from '../data/materials';

describe('Integritäts-Sweep — Querverweise auflösbar', () => {
  it('Signature-Kombinationen: alle Ton-IDs existieren', () => {
    for (const c of SIGNATURE_COMBOS) {
      for (const id of c.toneIds) {
        expect(findTone(id), `Kombi ${c.id} → Ton ${id}`).toBeDefined();
      }
    }
  });

  it('Stil-Presets: Farbrollen und Material-IDs existieren', () => {
    for (const p of STYLE_PRESETS) {
      for (const id of Object.values(p.colorRoles)) {
        if (id) expect(findTone(id), `Preset ${p.id} → Ton ${id}`).toBeDefined();
      }
      for (const mid of p.materialIds) {
        expect(findMaterial(mid), `Preset ${p.id} → Material ${mid}`).toBeDefined();
      }
    }
  });

  it('Materialien: alle Nebenpositions-Referenzen existieren', () => {
    for (const m of MATERIALS) {
      for (const a of m.addons) {
        expect(findAddon(a), `Material ${m.id} → Addon ${a}`).toBeDefined();
      }
    }
  });

  it('Materialien: IDs eindeutig, Preise plausibel (Flächen-Materialien: VK > 0)', () => {
    expect(new Set(MATERIALS.map((m) => m.id)).size).toBe(MATERIALS.length);
    for (const m of MATERIALS) {
      for (const tier of ['standard', 'premium', 'luxus'] as const) {
        const p = m.prices[tier];
        // Bewusste Ausnahmen (surface 'sonstiges'): Polsterstoffe ohne Verlege-Lohn,
        // Metall-Oberflächen als reine Referenzflächen ohne eigenen Preis.
        if (m.surface !== 'sonstiges') {
          expect(p.materialVK, `${m.id} ${tier} materialVK`).toBeGreaterThan(0);
          expect(p.laborVK, `${m.id} ${tier} laborVK`).toBeGreaterThan(0);
        } else {
          expect(p.materialVK, `${m.id} ${tier} materialVK`).toBeGreaterThanOrEqual(0);
          expect(p.laborVK, `${m.id} ${tier} laborVK`).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('Möbeltypen: IDs eindeutig, Preisspannen aufsteigend', () => {
    expect(new Set(FURNITURE_TYPES.map((f) => f.id)).size).toBe(FURNITURE_TYPES.length);
    for (const f of FURNITURE_TYPES) {
      for (const tier of ['standard', 'premium', 'luxus'] as const) {
        const [min, max] = f.price[tier];
        expect(min, `${f.id} ${tier}`).toBeGreaterThan(0);
        expect(max, `${f.id} ${tier}`).toBeGreaterThanOrEqual(min);
      }
    }
  });
});
