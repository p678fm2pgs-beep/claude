/**
 * HAVEN ATELIER — Beleuchtungs-Katalog (Erweiterung 4, Abschnitt 6).
 * Rein additiv. Lichtarten als zuweisbare Katalogobjekte mit Daten + EK/VK (3 Stufen).
 */
import type { PriceTier } from '../types';

export type LightCategory = 'indirekt' | 'einbau' | 'aufbau' | 'akzent' | 'aussen';

export interface LightFixture {
  id: string;
  name: string;
  nameEn: string;
  category: LightCategory;
  unit: 'lfm' | 'Stk' | 'Set';
  /** Voreingestellte Lichtfarbe in Kelvin. */
  kelvin: number;
  /** Lumen-Richtwert. */
  lumen: number;
  watt: number;
  /** Schutzart, z. B. 'IP20', 'IP44', 'IP65'. */
  ip: string;
  dimmable: boolean;
  rgb?: boolean;
  /** [von, bis] VK je Stufe. */
  price: Record<PriceTier, [number, number]>;
  /** EK-Faktor (EK ≈ ek × VK). */
  ekFactor: number;
  /** Erzeugt diese Leuchte einen indirekten Lichtsaum im 2D-Plan? */
  voute?: boolean;
}

const L = (
  id: string,
  name: string,
  nameEn: string,
  category: LightCategory,
  unit: LightFixture['unit'],
  kelvin: number,
  lumen: number,
  watt: number,
  ip: string,
  price: LightFixture['price'],
  opts: { dimmable?: boolean; rgb?: boolean; voute?: boolean; ekFactor?: number } = {},
): LightFixture => ({
  id, name, nameEn, category, unit, kelvin, lumen, watt, ip,
  dimmable: opts.dimmable ?? true, rgb: opts.rgb, voute: opts.voute, ekFactor: opts.ekFactor ?? 0.55,
  price,
});

export const LIGHT_PROFILES = [
  { id: 'decken-schattenfuge', name: 'Decken-Schattenfuge', nameEn: 'Ceiling shadow gap' },
  { id: 'wand-lichtkante', name: 'Wand-Lichtkante', nameEn: 'Wall light edge' },
  { id: 'vouten-profil', name: 'Vouten-Profil', nameEn: 'Cove profile' },
  { id: 'trockenbau-lichtkanal', name: 'Trockenbau-Lichtkanal', nameEn: 'Drywall light channel' },
  { id: 'aufputz-profil', name: 'Aufputz-Profil', nameEn: 'Surface profile' },
  { id: 'einbau-profil', name: 'Einbau-Profil', nameEn: 'Recessed profile' },
  { id: 'sockelprofil', name: 'Sockelprofil', nameEn: 'Skirting profile' },
] as const;

export const LIGHT_FIXTURES: LightFixture[] = [
  L('led-stripe', 'LED-Streifen', 'LED Strip', 'indirekt', 'lfm', 2700, 900, 9, 'IP20', {
    standard: [18, 32], premium: [32, 58], luxus: [58, 110],
  }, { rgb: true }),
  L('lichtvoute', 'Indirekte Lichtvoute (umlaufend)', 'Indirect Cove (perimeter)', 'indirekt', 'lfm', 2700, 1100, 11, 'IP20', {
    standard: [38, 68], premium: [68, 120], luxus: [120, 210],
  }, { voute: true }),
  L('wandfluter', 'Wandfluter', 'Wall Washer', 'indirekt', 'Stk', 3000, 1400, 14, 'IP20', {
    standard: [60, 110], premium: [110, 220], luxus: [220, 480],
  }, { voute: true }),
  L('einbauspot-rund', 'Einbau-Spot rund', 'Recessed Spot (round)', 'einbau', 'Stk', 3000, 600, 7, 'IP20', {
    standard: [25, 48], premium: [48, 95], luxus: [95, 220],
  }),
  L('einbauspot-eckig', 'Einbau-Spot eckig', 'Recessed Spot (square)', 'einbau', 'Stk', 3000, 600, 7, 'IP20', {
    standard: [28, 52], premium: [52, 100], luxus: [100, 240],
  }),
  L('deckenleuchte', 'Deckenleuchte (Aufbau)', 'Ceiling Light (surface)', 'aufbau', 'Stk', 3000, 2000, 22, 'IP20', {
    standard: [60, 120], premium: [120, 300], luxus: [300, 900],
  }),
  L('pendelleuchte-licht', 'Pendelleuchte', 'Pendant Light', 'aufbau', 'Stk', 2700, 1200, 14, 'IP20', {
    standard: [150, 400], premium: [400, 1200], luxus: [1200, 4500],
  }),
  L('stehleuchte-licht', 'Stehleuchte', 'Floor Lamp', 'akzent', 'Stk', 2700, 1000, 12, 'IP20', {
    standard: [120, 350], premium: [350, 900], luxus: [900, 3000],
  }),
  L('wandleuchte-licht', 'Wandleuchte', 'Wall Light', 'akzent', 'Stk', 2700, 700, 8, 'IP44', {
    standard: [80, 220], premium: [220, 600], luxus: [600, 1800],
  }),
  L('led-profil', 'Lichtleiste / LED-Profil', 'Light Bar / LED Profile', 'indirekt', 'lfm', 3000, 1000, 10, 'IP20', {
    standard: [28, 50], premium: [50, 92], luxus: [92, 165],
  }),
  L('stromschiene', 'Stromschienensystem', 'Track System', 'aufbau', 'lfm', 3000, 900, 10, 'IP20', {
    standard: [45, 82], premium: [82, 150], luxus: [150, 280],
  }),
  L('sockelprofil-licht', 'Sockel-/Bodenprofil-Licht', 'Skirting Floor Light', 'indirekt', 'lfm', 2700, 450, 5, 'IP44', {
    standard: [30, 55], premium: [55, 100], luxus: [100, 185],
  }, { voute: true }),
  L('spiegel-hinterleuchtung', 'Spiegel-Hinterleuchtung', 'Mirror Backlight', 'akzent', 'Stk', 4000, 800, 9, 'IP44', {
    standard: [60, 110], premium: [110, 220], luxus: [220, 460],
  }, { voute: true }),
  L('treppenlicht', 'Treppenbeleuchtung', 'Stair Lighting', 'akzent', 'Stk', 3000, 200, 3, 'IP44', {
    standard: [22, 42], premium: [42, 80], luxus: [80, 160],
  }),
  L('aussenleuchte', 'Außen-/Gartenleuchte', 'Outdoor / Garden Light', 'aussen', 'Stk', 3000, 1200, 14, 'IP65', {
    standard: [70, 130], premium: [130, 280], luxus: [280, 650],
  }),
];

export const KELVIN_OPTIONS = [2700, 3000, 4000] as const;

export function findFixture(id: string): LightFixture | undefined {
  return LIGHT_FIXTURES.find((f) => f.id === id);
}

export function fixturesForRoom(roomType: string): LightFixture[] {
  // Außenleuchten nur außen anbieten; sonst alle.
  if (roomType === 'aussen') return LIGHT_FIXTURES.filter((f) => f.category === 'aussen' || f.category === 'akzent');
  return LIGHT_FIXTURES.filter((f) => f.category !== 'aussen');
}
