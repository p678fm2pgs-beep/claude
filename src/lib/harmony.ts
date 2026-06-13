/**
 * HAVEN ATELIER — Harmonie-Engine (regelbasiert, deterministisch, unit-getestet).
 * Liefert zu jedem Ton: Begleitfarben nach Farbtheorie (mit Begründung),
 * HAVEN-Signature-Kombinationen und Anti-Empfehlungen.
 * Plus 60-30-10-Bilanz und Licht-Logik.
 */
import { ALL_TONES, findTone, type ColorTone } from '../data/colors';
import type { ColorRole, Light } from '../types';
import { hexToHsl, approxLRV } from './color';

export type HarmonyKind = 'analog' | 'komplementaer' | 'triade' | 'neutral';

export interface Recommendation {
  kind: HarmonyKind;
  tone: ColorTone;
  reasonKey: string; // i18n-Schlüssel
}

export interface AntiRecommendation {
  tone: ColorTone;
  reasonKey: string;
}

const NEUTRAL_FAMILIES = ['weiss', 'creme', 'greige', 'grau'];

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Nächster Katalogton zu einem Ziel-Farbton (HSL-Hue + Helligkeit), optional gefiltert. */
function nearestByHue(
  targetHue: number,
  opts: { exclude?: string[]; familyIn?: string[]; preferLrvNear?: number } = {},
): ColorTone | undefined {
  const exclude = new Set(opts.exclude ?? []);
  let best: ColorTone | undefined;
  let bestScore = Infinity;
  for (const t of ALL_TONES) {
    if (exclude.has(t.id)) continue;
    if (opts.familyIn && !opts.familyIn.includes(t.familyId)) continue;
    const hsl = hexToHsl(t.hex);
    let score = hueDistance(hsl.h, targetHue);
    // Sehr graue/ungesättigte Töne haben instabilen Hue → leicht bestrafen außer bei Neutral-Suche.
    if (!opts.familyIn && hsl.s < 8) score += 30;
    if (opts.preferLrvNear !== undefined) score += Math.abs(t.lrv - opts.preferLrvNear) * 0.15;
    if (score < bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}

/** Begleitfarben-Empfehlungen zu einem Ton. */
export function companionRecommendations(toneId: string): Recommendation[] {
  const tone = findTone(toneId);
  if (!tone) return [];
  const baseHsl = hexToHsl(tone.hex);
  const recs: Recommendation[] = [];
  const used = new Set<string>([tone.id]);

  const analog = nearestByHue(baseHsl.h + 28, { exclude: [...used] });
  if (analog) {
    used.add(analog.id);
    recs.push({ kind: 'analog', tone: analog, reasonKey: 'harmony.reason.analog' });
  }

  const complement = nearestByHue((baseHsl.h + 180) % 360, { exclude: [...used] });
  if (complement) {
    used.add(complement.id);
    recs.push({ kind: 'komplementaer', tone: complement, reasonKey: 'harmony.reason.komplementaer' });
  }

  const triad = nearestByHue((baseHsl.h + 120) % 360, { exclude: [...used] });
  if (triad) {
    used.add(triad.id);
    recs.push({ kind: 'triade', tone: triad, reasonKey: 'harmony.reason.triade' });
  }

  // Neutral-Anker: heller, ungesättigter Ton mit passendem Unterton.
  const neutral =
    nearestByHue(baseHsl.h, {
      exclude: [...used],
      familyIn: NEUTRAL_FAMILIES,
      preferLrvNear: 80,
    }) ?? ALL_TONES.find((t) => t.familyId === 'weiss');
  if (neutral) recs.push({ kind: 'neutral', tone: neutral, reasonKey: 'harmony.reason.neutral' });

  return recs;
}

/** Anti-Empfehlungen: 2–3 unpassende Töne mit Grund. */
export function antiRecommendations(toneId: string): AntiRecommendation[] {
  const tone = findTone(toneId);
  if (!tone) return [];
  const baseHsl = hexToHsl(tone.hex);
  const out: AntiRecommendation[] = [];

  // 1) Gegensätzlicher Unterton, hohe Sättigung → Spannung.
  const oppositeUndertone = tone.undertone === 'warm' ? 'kuehl' : 'warm';
  const clash = ALL_TONES.filter((t) => t.id !== tone.id && t.undertone === oppositeUndertone)
    .map((t) => ({ t, hsl: hexToHsl(t.hex) }))
    .filter((x) => x.hsl.s > 35)
    .sort((a, b) => hueDistance(a.hsl.h, (baseHsl.h + 150) % 360) - hueDistance(b.hsl.h, (baseHsl.h + 150) % 360))[0];
  if (clash) out.push({ tone: clash.t, reasonKey: 'harmony.anti.undertone' });

  // 2) Zwei dominante, gesättigte Töne ähnlicher Helligkeit konkurrieren.
  const competitor = ALL_TONES.filter(
    (t) => t.id !== tone.id && Math.abs(t.lrv - tone.lrv) < 12 && hexToHsl(t.hex).s > 45,
  ).sort((a, b) => hexToHsl(b.hex).s - hexToHsl(a.hex).s)[0];
  if (competitor && competitor.id !== clash?.t.id)
    out.push({ tone: competitor, reasonKey: 'harmony.anti.competing' });

  // 3) Direkter Nachbarton minimal verschoben → „schmutziger" Beinaheklang.
  const muddy = ALL_TONES.filter((t) => {
    if (t.id === tone.id) return false;
    const h = hexToHsl(t.hex);
    const hd = hueDistance(h.h, baseHsl.h);
    return hd > 8 && hd < 22 && Math.abs(t.lrv - tone.lrv) < 18;
  })[0];
  if (muddy && muddy.id !== clash?.t.id && muddy.id !== competitor?.id)
    out.push({ tone: muddy, reasonKey: 'harmony.anti.muddy' });

  return out.slice(0, 3);
}

// ───────────── HAVEN Signature-Kombinationen (≥8) ─────────────

export interface SignatureCombo {
  id: string;
  name: string;
  nameEn: string;
  toneIds: string[];
  materialHint: string;
  materialHintEn: string;
}

export const SIGNATURE_COMBOS: SignatureCombo[] = [
  {
    id: 'stille-moderne',
    name: 'Stille Moderne',
    nameEn: 'Quiet Modern',
    toneIds: ['weiss-4', 'anthrazit-1', 'creme-3'],
    materialHint: 'Eiche natur · Messing gebürstet',
    materialHintEn: 'Natural oak · Brushed brass',
  },
  {
    id: 'warmes-atelier',
    name: 'Warmes Atelier',
    nameEn: 'Warm Atelier',
    toneIds: ['creme-1', 'greige-3', 'braun-3'],
    materialHint: 'Travertin · Leinen · Bronze',
    materialHintEn: 'Travertine · Linen · Bronze',
  },
  {
    id: 'salbei-ruhe',
    name: 'Salbei-Ruhe',
    nameEn: 'Sage Calm',
    toneIds: ['gruen-1', 'weiss-2', 'greige-1'],
    materialHint: 'Esche · Wollweiß-Textil',
    materialHintEn: 'Ash · Wool-white textile',
  },
  {
    id: 'petrol-eleganz',
    name: 'Petrol-Eleganz',
    nameEn: 'Petrol Elegance',
    toneIds: ['blau-1', 'creme-9', 'ocker-9'],
    materialHint: 'Nussbaum · Messing poliert',
    materialHintEn: 'Walnut · Polished brass',
  },
  {
    id: 'terracotta-mediterran',
    name: 'Terracotta Mediterran',
    nameEn: 'Mediterranean Terracotta',
    toneIds: ['terrakotta-1', 'creme-5', 'gruen-2'],
    materialHint: 'Kalkputz · Travertin',
    materialHintEn: 'Lime plaster · Travertine',
  },
  {
    id: 'bordeaux-bibliothek',
    name: 'Bordeaux-Bibliothek',
    nameEn: 'Bordeaux Library',
    toneIds: ['bordeaux-1', 'creme-9', 'anthrazit-2'],
    materialHint: 'Räuchereiche · Samt',
    materialHintEn: 'Smoked oak · Velvet',
  },
  {
    id: 'japandi-erde',
    name: 'Japandi Erde',
    nameEn: 'Japandi Earth',
    toneIds: ['greige-2', 'anthrazit-3', 'creme-8'],
    materialHint: 'Eiche geräuchert · Leinen · Schwarzstahl',
    materialHintEn: 'Smoked oak · Linen · Black steel',
  },
  {
    id: 'puder-klassik',
    name: 'Puder-Klassik',
    nameEn: 'Powder Classic',
    toneIds: ['rose-1', 'weiss-3', 'greige-7'],
    materialHint: 'Marmor Calacatta · Messing',
    materialHintEn: 'Calacatta marble · Brass',
  },
  {
    id: 'graphit-monochrom',
    name: 'Graphit-Monochrom',
    nameEn: 'Graphite Monochrome',
    toneIds: ['grau-1', 'anthrazit-1', 'weiss-1'],
    materialHint: 'Mikrozement · Edelstahl gebürstet',
    materialHintEn: 'Microcement · Brushed steel',
  },
  {
    id: 'ocker-sonne',
    name: 'Ocker-Sonne',
    nameEn: 'Ochre Sun',
    toneIds: ['ocker-1', 'creme-1', 'braun-7'],
    materialHint: 'Eiche natur · Bouclé',
    materialHintEn: 'Natural oak · Bouclé',
  },
];

// ───────────── 60-30-10-Bilanz ─────────────

export interface BalanceResult {
  shares: { role: ColorRole; lrv: number; pct: number }[];
  skewed: boolean;
  messageKey?: string;
}

const ROLE_TARGET: Record<ColorRole, number> = {
  wand: 60,
  boden: 30,
  decke: 0,
  textil: 10,
  akzent: 10,
};

/** 60-30-10-Bilanz aus den Farbrollen. Warnt bei Schieflage. */
export function balance606030(roles: Partial<Record<ColorRole, string>>): BalanceResult {
  const present = (Object.keys(ROLE_TARGET) as ColorRole[]).filter((r) => roles[r]);
  const totalTarget = present.reduce((s, r) => s + (ROLE_TARGET[r] || 0), 0) || 1;
  const shares = present.map((role) => {
    const tone = findTone(roles[role]);
    return {
      role,
      lrv: tone ? tone.lrv : 0,
      pct: Math.round(((ROLE_TARGET[role] || 0) / totalTarget) * 100),
    };
  });
  // Schieflage: kein dominanter Grundton ODER zu viele gesättigte Akzente.
  const hasDominant = shares.some((s) => s.pct >= 45);
  const skewed = shares.length >= 3 && !hasDominant;
  return {
    shares,
    skewed,
    messageKey: skewed ? 'harmony.balance.skewed' : undefined,
  };
}

// ───────────── Licht-Logik ─────────────

export interface LightHint {
  messageKey: string;
  recommendUndertone: 'warm' | 'kuehl' | 'neutral';
  minLrv?: number;
}

/**
 * Nord/wenig Licht → warme Untertöne + hohe LRV.
 * Süd → kühle Töne geeignet. Räume < 12 m² → LRV ≥ 60 empfehlen.
 */
export function lightHint(light: Light, floorAreaM2: number): LightHint {
  const northish = ['N', 'NO', 'NW'].includes(light.orientation);
  const southish = ['S', 'SO', 'SW'].includes(light.orientation);
  const small = floorAreaM2 > 0 && floorAreaM2 < 12;

  if (northish || light.daylight === 'wenig') {
    return {
      messageKey: 'harmony.light.northWarm',
      recommendUndertone: 'warm',
      minLrv: small ? 70 : 60,
    };
  }
  if (southish && light.daylight === 'viel') {
    return {
      messageKey: 'harmony.light.southCool',
      recommendUndertone: 'kuehl',
      minLrv: small ? 60 : undefined,
    };
  }
  return {
    messageKey: small ? 'harmony.light.smallRoom' : 'harmony.light.balanced',
    recommendUndertone: 'neutral',
    minLrv: small ? 60 : undefined,
  };
}

/** Empfohlenes Hellweiß für die Decke (immer heller Ton mit passendem Unterton). */
export function suggestCeilingTone(wandToneId?: string): ColorTone {
  const wand = findTone(wandToneId);
  const whites = ALL_TONES.filter((t) => t.familyId === 'weiss');
  if (!wand) return whites.find((t) => t.id === 'weiss-1') ?? whites[0];
  const match = whites
    .filter((t) => t.undertone === wand.undertone || t.undertone === 'neutral')
    .sort((a, b) => b.lrv - a.lrv)[0];
  return match ?? whites[0];
}

export { approxLRV };
