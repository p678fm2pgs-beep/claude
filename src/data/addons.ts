/**
 * HAVEN ATELIER — Automatische Nebenpositionen (Erweiterung 2, Abschnitt M).
 * Jede Nebenposition: Name, Gewerk, Mengenbasis, Preis (EK/VK).
 * Mengenbasis bestimmt, wie die Menge automatisch berechnet wird.
 */
import type { Gewerk } from '../lib/costs';

export type MengenBasis =
  | 'bodenflaeche' // m²
  | 'wandflaeche' // m²
  | 'deckenflaeche' // m²
  | 'sockel' // lfm = Umfang − Türbreiten
  | 'pauschal'; // 1 ×

export interface Addon {
  id: string;
  name: string;
  nameEn: string;
  gewerk: Gewerk;
  basis: MengenBasis;
  unit: string;
  ek: number;
  vk: number;
}

const A = (
  id: string,
  name: string,
  nameEn: string,
  gewerk: Gewerk,
  basis: MengenBasis,
  unit: string,
  ek: number,
  vk: number,
): Addon => ({ id, name, nameEn, gewerk, basis, unit, ek, vk });

export const ADDONS: Addon[] = [
  // Parkett / Diele / Laminat / Vinyl
  A('trittschall', 'Trittschalldämmung', 'Impact sound insulation', 'nebenposition', 'bodenflaeche', 'm²', 3, 7),
  A('dampfsperre', 'Dampfsperre', 'Vapour barrier', 'nebenposition', 'bodenflaeche', 'm²', 1.5, 3.5),
  A('sockelleisten', 'Sockelleisten', 'Skirting boards', 'nebenposition', 'sockel', 'lfm', 4, 9),
  A('verlegung', 'Verlegung', 'Installation', 'boden', 'bodenflaeche', 'm²', 14, 26),
  A('versiegelung', 'Oberflächenbehandlung / Versiegelung', 'Surface sealing', 'boden', 'bodenflaeche', 'm²', 5, 11),
  // Fliesen / Naturstein
  A('fliesenkleber', 'Fliesenkleber', 'Tile adhesive', 'nebenposition', 'bodenflaeche', 'm²', 4, 9),
  A('fugenmasse', 'Fugenmasse', 'Grout', 'nebenposition', 'bodenflaeche', 'm²', 2, 5),
  A('grundierung', 'Grundierung', 'Primer', 'nebenposition', 'bodenflaeche', 'm²', 2, 5),
  A('verlegung-fliese', 'Fliesenverlegung', 'Tile laying', 'fliesen', 'bodenflaeche', 'm²', 28, 52),
  A('impraegnierung', 'Imprägnierung Naturstein', 'Stone impregnation', 'nebenposition', 'bodenflaeche', 'm²', 4, 9),
  A('verbundabdichtung', 'Verbundabdichtung (Nassbereich)', 'Composite waterproofing', 'fliesen', 'bodenflaeche', 'm²', 12, 24),
  // Wandfarbe / Putz / Tapete
  A('grundierung-wand', 'Grundierung Wand', 'Wall primer', 'maler', 'wandflaeche', 'm²', 1.5, 4),
  A('abdecken', 'Abkleben & Abdecken', 'Masking & covering', 'maler', 'wandflaeche', 'm²', 1, 3),
  A('anstrich2', '2. Anstrich', '2nd coat', 'maler', 'wandflaeche', 'm²', 3, 7),
  A('aufbau-schicht', 'Aufbau-Schichten', 'Build-up layers', 'maler', 'wandflaeche', 'm²', 6, 13),
  A('kleister', 'Kleister', 'Wallpaper paste', 'nebenposition', 'wandflaeche', 'm²', 1, 3),
  A('untergrund-tapete', 'Untergrundvorbereitung', 'Substrate prep', 'maler', 'wandflaeche', 'm²', 2, 5),
  A('tapezierarbeit', 'Tapezierarbeit', 'Wallpapering', 'maler', 'wandflaeche', 'm²', 8, 16),
  A('musterversatz', 'Musterversatz-Zuschlag', 'Pattern repeat surcharge', 'nebenposition', 'wandflaeche', 'm²', 3, 6),
  // Decke
  A('unterkonstruktion-decke', 'Unterkonstruktion Decke', 'Ceiling substructure', 'nebenposition', 'deckenflaeche', 'm²', 8, 16),
  A('beplankung', 'Beplankung', 'Boarding', 'nebenposition', 'deckenflaeche', 'm²', 6, 13),
  A('spachteln', 'Spachteln', 'Filling', 'maler', 'deckenflaeche', 'm²', 5, 11),
  A('unterkonstruktion-wand', 'Unterkonstruktion Wand', 'Wall substructure', 'nebenposition', 'wandflaeche', 'm²', 8, 16),
  // Montage / Anschlüsse (pauschal)
  A('montage', 'Montage', 'Mounting', 'nebenposition', 'deckenflaeche', 'm²', 6, 13),
  A('elektro-anschluss', 'Elektro-Anschluss', 'Electrical connection', 'elektro', 'pauschal', 'psch', 120, 240),
];

export function findAddon(id: string): Addon | undefined {
  return ADDONS.find((a) => a.id === id);
}
