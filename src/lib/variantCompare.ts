/**
 * HAVEN ATELIER — Varianten-Vergleich (Erweiterung 8 · T7).
 * REINE Funktion: vergleicht zwei Varianten eines Raums über die Kalkulation
 * (Endpreise + Differenz) und die Kern-Materialien. Kundensicht = nur VK.
 */
import type { Room, Variant } from '../types';
import { computeRoomCost } from './projectCost';
import { findMaterial } from '../data/materials';

export interface VariantSummary {
  variantId: string;
  name: string;
  vkMin: number;
  vkMax: number;
  ekMin: number;
  ekMax: number;
  /** Kern-Materialien (Boden/Wand) als Klartext. */
  coreMaterials: string[];
}

export interface VariantComparison {
  a: VariantSummary;
  b: VariantSummary;
  /** Differenz b − a (Mitte der Spanne), positiv = B teurer. */
  diffMid: number;
}

function summarize(room: Room, variant: Variant, coverage: number, lang: 'de' | 'en'): VariantSummary {
  const tmpRoom: Room = { ...room, activeVariantId: variant.id, variants: [variant] };
  const cost = computeRoomCost(tmpRoom, coverage);
  const core: string[] = [];
  for (const surface of ['boden', 'wand'] as const) {
    const sel = variant.materials.filter((m) => m.surface === surface).pop();
    const m = sel ? findMaterial(sel.materialId) : undefined;
    if (m) core.push(lang === 'de' ? m.name : m.nameEn);
  }
  return {
    variantId: variant.id,
    name: variant.name,
    vkMin: cost.subtotal.min,
    vkMax: cost.subtotal.max,
    ekMin: cost.ekSubtotal.min,
    ekMax: cost.ekSubtotal.max,
    coreMaterials: core,
  };
}

/** Vergleicht zwei Varianten eines Raums (a, b via IDs). null bei fehlender Variante. */
export function compareVariants(
  room: Room,
  aId: string,
  bId: string,
  coverage: number,
  lang: 'de' | 'en',
): VariantComparison | null {
  const va = room.variants.find((v) => v.id === aId);
  const vb = room.variants.find((v) => v.id === bId);
  if (!va || !vb) return null;
  const a = summarize(room, va, coverage, lang);
  const b = summarize(room, vb, coverage, lang);
  const diffMid = (b.vkMin + b.vkMax) / 2 - (a.vkMin + a.vkMax) / 2;
  return { a, b, diffMid };
}
