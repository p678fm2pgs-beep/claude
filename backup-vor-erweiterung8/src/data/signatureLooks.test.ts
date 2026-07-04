/**
 * Erweiterung 6 · S8 — HAVEN Signature Looks: dauerhafte Beweise.
 */
import { describe, it, expect } from 'vitest';
import { SIGNATURE_LOOKS, findLook, applyLookToVariant } from './signatureLooks';
import { findTone } from './colors';
import { findMaterial } from './materials';
import type { Variant } from '../types';

describe('S8 — Signature Looks Katalog', () => {
  it('genau 8 Looks, IDs eindeutig, Namen redaktionell gesetzt', () => {
    expect(SIGNATURE_LOOKS.length).toBe(8);
    expect(new Set(SIGNATURE_LOOKS.map((l) => l.id)).size).toBe(8);
    for (const l of SIGNATURE_LOOKS) {
      expect(l.name.length).toBeGreaterThan(3);
      expect(l.claim.length).toBeGreaterThan(10);
    }
  });

  it('alle Farbrollen-Töne existieren', () => {
    for (const l of SIGNATURE_LOOKS) {
      for (const id of Object.values(l.colorRoles)) {
        expect(findTone(id), `${l.id} → Ton ${id}`).toBeDefined();
      }
    }
  });

  it('alle Material-Referenzen existieren und passen zur Fläche', () => {
    for (const l of SIGNATURE_LOOKS) {
      expect(findMaterial(l.floor.materialId)?.surface, `${l.id} Boden`).toBe('boden');
      expect(findMaterial(l.wall.materialId)?.surface, `${l.id} Wand`).toBe('wand');
      expect(findMaterial(l.accentMetal)?.id, `${l.id} Metall`).toBe(l.accentMetal);
      expect(findMaterial(l.textile)?.id, `${l.id} Textil`).toBe(l.textile);
    }
  });

  it('findLook löst auf, unbekannte ID → undefined', () => {
    expect(findLook('stille-mitte')?.name).toContain('Stille Mitte');
    expect(findLook('gibtsnicht')).toBeUndefined();
  });
});

describe('S8 — applyLookToVariant', () => {
  function variant(): Variant {
    return {
      id: 'v1',
      name: 'A',
      colorRoles: { wand: 'grau-1' },
      materials: [
        { id: 'm1', materialId: 'parkett-eiche-landhaus', surface: 'boden', tier: 'standard' },
        { id: 'm2', materialId: 'decke-anstrich', surface: 'decke', tier: 'standard' },
      ],
      furniture: [{ id: 'f1', typeId: 'sofa', label: 'Sofa', tier: 'standard', quantity: 1, unit: 'Stk' }],
      trades: [],
      lighting: [],
      notes: 'wichtig',
    } as Variant;
  }

  it('setzt Farbrollen + Boden/Wand, lässt Decke/Möbel/Notizen unangetastet', () => {
    const v = variant();
    applyLookToVariant(v, findLook('goldene-stunde')!);
    expect(v.colorRoles.wand).toBe('creme-2');
    const boden = v.materials.find((m) => m.surface === 'boden');
    expect(boden?.materialId).toBe('parkett-eiche-fischgraet');
    expect(boden?.pattern).toBe('fischgraet');
    // Unangetastet:
    expect(v.materials.find((m) => m.surface === 'decke')?.materialId).toBe('decke-anstrich');
    expect(v.furniture.length).toBe(1);
    expect(v.notes).toBe('wichtig');
  });

  it('ist idempotent bezüglich Flächen: kein Stapeln von Boden/Wand-Auswahlen', () => {
    const v = variant();
    applyLookToVariant(v, findLook('nordlicht')!);
    applyLookToVariant(v, findLook('tiefe-see')!);
    expect(v.materials.filter((m) => m.surface === 'boden').length).toBe(1);
    expect(v.materials.filter((m) => m.surface === 'wand').length).toBe(1);
    expect(v.materials.find((m) => m.surface === 'boden')?.materialId).toBe('parkett-nussbaum-chevron');
  });

  it('jeder Look lässt sich fehlerfrei anwenden (alle 8)', () => {
    for (const l of SIGNATURE_LOOKS) {
      const v = variant();
      applyLookToVariant(v, l);
      expect(v.materials.find((m) => m.surface === 'boden')?.materialId).toBe(l.floor.materialId);
      expect(v.materials.find((m) => m.surface === 'wand')?.materialId).toBe(l.wall.materialId);
    }
  });
});
