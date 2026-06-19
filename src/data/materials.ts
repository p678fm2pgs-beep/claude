/**
 * HAVEN ATELIER — Material-Bibliothek (Katalog A–I der Erweiterung 2).
 * Jede Option: Name, Kategorie/Unterkategorie, Beschreibung, technische Eigenschaften,
 * Farbwelt-Tags, drei Preisstufen (EK+VK getrennt), Textur-Deskriptor (programmatisch erzeugt).
 * Im Expertenmodus editierbar (über Store-Overlay).
 */
import type { PriceTier } from '../types';

export type Surface = 'boden' | 'wand' | 'decke' | 'sonstiges';
export type FbhEignung = 'ja' | 'bedingt' | 'nein';
export type TextureVariant = 'wood' | 'stone' | 'tile' | 'plaster' | 'textile' | 'metal' | 'carpet' | 'solid';

export interface MaterialTech {
  nutzungsklasse?: string; // AC/NK
  staerkeMm?: number;
  nutzschichtMm?: number;
  format?: string;
  rutschklasse?: string; // R9..R13 (+ A/B/C)
  fbh: FbhEignung;
  nasszelle: boolean;
  aussen: boolean;
  emission?: string;
  pflege?: string;
}

export interface TierPrice {
  materialEK: number;
  materialVK: number;
  laborEK: number;
  laborVK: number;
  unit: 'm2' | 'stk' | 'lfm' | 'psch';
}

export interface Texture {
  base: string;
  variant: TextureVariant;
  grain?: string;
}

export interface Material {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  subcategory: string;
  surface: Surface;
  description: string;
  descriptionEn: string;
  tags: string[]; // Farbwelt-Tags
  tech: MaterialTech;
  prices: Record<PriceTier, TierPrice>;
  texture: Texture;
  supportsPattern?: boolean;
  /** IDs der zugehörigen Nebenpositionen (default an). */
  addons: string[];
}

interface Row {
  id: string;
  name: string;
  nameEn: string;
  sub: string;
  surface: Surface;
  desc: string;
  descEn: string;
  tags: string[];
  tech: MaterialTech;
  /** €/m² (oder Einheit): [matEK, matVK, labEK, labVK] je Stufe. */
  p: { standard: [number, number, number, number]; premium: [number, number, number, number]; luxus: [number, number, number, number] };
  tex: Texture;
  unit?: 'm2' | 'stk' | 'lfm' | 'psch';
  pattern?: boolean;
  addons: string[];
}

function build(category: string, categoryEn: string, rows: Row[]): Material[] {
  return rows.map((r) => {
    const unit = r.unit ?? 'm2';
    const tp = (a: [number, number, number, number]): TierPrice => ({
      materialEK: a[0],
      materialVK: a[1],
      laborEK: a[2],
      laborVK: a[3],
      unit,
    });
    return {
      id: r.id,
      name: r.name,
      nameEn: r.nameEn,
      category,
      categoryEn,
      subcategory: r.sub,
      surface: r.surface,
      description: r.desc,
      descriptionEn: r.descEn,
      tags: r.tags,
      tech: r.tech,
      prices: { standard: tp(r.p.standard), premium: tp(r.p.premium), luxus: tp(r.p.luxus) },
      texture: r.tex,
      supportsPattern: r.pattern,
      addons: r.addons,
    };
  });
}

const FLOOR_ADDONS = ['trittschall', 'sockelleisten', 'verlegung', 'versiegelung'];
const TILE_ADDONS = ['fliesenkleber', 'fugenmasse', 'grundierung', 'verlegung-fliese'];
const PAINT_ADDONS = ['grundierung-wand', 'abdecken', 'anstrich2'];

// ───────────────────────── A. BÖDEN ─────────────────────────
const boeden = build('Böden', 'Floors', [
  {
    id: 'parkett-eiche-landhaus', name: 'Eiche Landhausdiele natur', nameEn: 'Oak Plank, Natural', sub: 'Parkett',
    surface: 'boden', desc: 'Mehrschicht-Landhausdiele, geölt, warmer Naturton.', descEn: 'Engineered oak plank, oiled.',
    tags: ['warm', 'natur', 'eiche'], tech: { staerkeMm: 14, nutzschichtMm: 4, format: '1900×190', fbh: 'bedingt', nasszelle: false, aussen: false, emission: 'A+', pflege: 'mittel' },
    p: { standard: [45, 79, 22, 38], premium: [70, 119, 24, 42], luxus: [110, 189, 28, 48] },
    tex: { base: '#C7A77B', variant: 'wood', grain: '#9B7F55' }, pattern: true, addons: FLOOR_ADDONS,
  },
  {
    id: 'parkett-eiche-fischgraet', name: 'Eiche Fischgrät geräuchert', nameEn: 'Oak Herringbone, Smoked', sub: 'Parkett',
    surface: 'boden', desc: 'Fischgrät, geräuchert & geölt — höherer Verschnitt.', descEn: 'Smoked oak herringbone.',
    tags: ['warm', 'dunkel', 'eiche'], tech: { staerkeMm: 14, nutzschichtMm: 4, format: '600×120', fbh: 'bedingt', nasszelle: false, aussen: false, emission: 'A+', pflege: 'mittel' },
    p: { standard: [62, 99, 30, 52], premium: [95, 159, 34, 58], luxus: [150, 239, 40, 68] },
    tex: { base: '#7A5C3E', variant: 'wood', grain: '#523E2A' }, pattern: true, addons: FLOOR_ADDONS,
  },
  {
    id: 'parkett-nussbaum-chevron', name: 'Nussbaum Chevron', nameEn: 'Walnut Chevron', sub: 'Parkett',
    surface: 'boden', desc: 'Edler Chevron in Nussbaum, dunkel-elegant.', descEn: 'Walnut chevron, dark elegant.',
    tags: ['dunkel', 'edel', 'nussbaum'], tech: { staerkeMm: 14, nutzschichtMm: 3.5, format: '600×90', fbh: 'bedingt', nasszelle: false, aussen: false, emission: 'A+', pflege: 'mittel' },
    p: { standard: [78, 129, 32, 55], premium: [120, 199, 36, 62], luxus: [185, 299, 44, 74] },
    tex: { base: '#5E4332', variant: 'wood', grain: '#3D2B20' }, pattern: true, addons: FLOOR_ADDONS,
  },
  {
    id: 'massivdiele-eiche', name: 'Massivholzdiele Eiche weiß geölt', nameEn: 'Solid Oak Plank, White Oiled', sub: 'Massivholzdielen',
    surface: 'boden', desc: 'Massive Diele, weiß geölt — nur bedingt für FBH.', descEn: 'Solid oak plank, white oiled.',
    tags: ['hell', 'natur', 'eiche'], tech: { staerkeMm: 20, format: '2000×160', fbh: 'nein', nasszelle: false, aussen: false, emission: 'A+', pflege: 'hoch' },
    p: { standard: [68, 115, 26, 45], premium: [98, 169, 30, 52], luxus: [150, 255, 36, 62] },
    tex: { base: '#D8C6A6', variant: 'wood', grain: '#B6A079' }, pattern: true, addons: FLOOR_ADDONS,
  },
  {
    id: 'laminat-eiche', name: 'Laminat Eiche-Optik AC5', nameEn: 'Laminate Oak AC5', sub: 'Laminat',
    surface: 'boden', desc: 'Nutzungsklasse 33/AC5, mit Trittschall integriert.', descEn: 'Class 33/AC5 laminate.',
    tags: ['warm', 'eiche', 'budget'], tech: { nutzungsklasse: 'AC5 / NK33', staerkeMm: 10, format: '1380×190', fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [14, 27, 14, 24], premium: [22, 39, 15, 26], luxus: [32, 55, 16, 28] },
    tex: { base: '#C2A578', variant: 'wood', grain: '#9E8456' }, pattern: false, addons: ['trittschall', 'sockelleisten', 'verlegung'],
  },
  {
    id: 'vinyl-spc-stein', name: 'SPC Klick-Vinyl Steinoptik', nameEn: 'SPC Click Vinyl, Stone', sub: 'Vinyl / LVT',
    surface: 'boden', desc: 'Hartkern-SPC, wasserfest, Nutzschicht 0,55 mm.', descEn: 'Rigid SPC, waterproof.',
    tags: ['grau', 'stein', 'robust'], tech: { nutzungsklasse: 'NK33', staerkeMm: 5, nutzschichtMm: 0.55, format: '610×305', rutschklasse: 'R10', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [24, 45, 16, 28], premium: [34, 62, 17, 30], luxus: [48, 85, 18, 32] },
    tex: { base: '#B8B4AC', variant: 'stone', grain: '#928E86' }, pattern: false, addons: ['trittschall', 'sockelleisten', 'verlegung'],
  },
  {
    id: 'feinstein-grossformat', name: 'Feinsteinzeug Großformat 120×280', nameEn: 'Porcelain Slab 120×280', sub: 'Fliesen / Feinsteinzeug',
    surface: 'boden', desc: 'Großformat in Marmor-Optik, matt.', descEn: 'Large-format marble look.',
    tags: ['hell', 'marmor', 'edel'], tech: { format: '120×280', rutschklasse: 'R9', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [55, 95, 45, 78], premium: [85, 145, 48, 82], luxus: [140, 235, 55, 95] },
    tex: { base: '#ECE7DD', variant: 'tile', grain: '#CFC8BB' }, pattern: false, addons: TILE_ADDONS,
  },
  {
    id: 'feinstein-6060-r10', name: 'Feinsteinzeug 60×60 R10', nameEn: 'Porcelain 60×60 R10', sub: 'Fliesen / Feinsteinzeug',
    surface: 'boden', desc: 'Rutschklasse R10/B — für Bad geeignet.', descEn: 'R10/B — bathroom-ready.',
    tags: ['grau', 'beton', 'robust'], tech: { format: '60×60', rutschklasse: 'R10 / B', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [32, 58, 42, 72], premium: [48, 85, 45, 78], luxus: [78, 135, 52, 88] },
    tex: { base: '#C5C2BC', variant: 'tile', grain: '#A29E97' }, pattern: false, addons: TILE_ADDONS,
  },
  {
    id: 'naturstein-travertin', name: 'Travertin getrommelt', nameEn: 'Travertine, Tumbled', sub: 'Naturstein',
    surface: 'boden', desc: 'Warmer Naturstein, imprägniert.', descEn: 'Warm natural stone, sealed.',
    tags: ['warm', 'creme', 'naturstein'], tech: { format: '610×406', rutschklasse: 'R10', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'hoch' },
    p: { standard: [62, 110, 52, 90], premium: [95, 165, 56, 96], luxus: [160, 270, 64, 110] },
    tex: { base: '#D9CBB0', variant: 'stone', grain: '#B7A688' }, pattern: false, addons: [...TILE_ADDONS, 'impraegnierung'],
  },
  {
    id: 'naturstein-marmor', name: 'Marmor Calacatta poliert', nameEn: 'Calacatta Marble, Polished', sub: 'Naturstein',
    surface: 'boden', desc: 'Edler Marmor mit grauer Äderung.', descEn: 'Fine marble with grey veining.',
    tags: ['hell', 'edel', 'marmor'], tech: { format: '600×600', rutschklasse: 'R9', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'hoch' },
    p: { standard: [95, 165, 58, 98], premium: [150, 255, 62, 105], luxus: [260, 430, 72, 120] },
    tex: { base: '#EEEAE3', variant: 'stone', grain: '#B9B3A8' }, pattern: false, addons: [...TILE_ADDONS, 'impraegnierung'],
  },
  {
    id: 'mikrozement-boden', name: 'Mikrozement / Spachtelboden', nameEn: 'Microcement Floor', sub: 'Mikrozement',
    surface: 'boden', desc: 'Fugenlos, mineralisch, versiegelt.', descEn: 'Seamless mineral floor.',
    tags: ['grau', 'beton', 'modern'], tech: { staerkeMm: 3, fbh: 'ja', nasszelle: true, aussen: false, emission: 'A', pflege: 'mittel' },
    p: { standard: [40, 75, 55, 95], premium: [55, 98, 60, 102], luxus: [80, 140, 68, 115] },
    tex: { base: '#B9B2A6', variant: 'plaster', grain: '#9C948899' }, pattern: false, addons: ['grundierung', 'versiegelung', 'verlegung'],
  },
  {
    id: 'kork-boden', name: 'Korkboden natur', nameEn: 'Cork Floor, Natural', sub: 'Kork',
    surface: 'boden', desc: 'Warm, leise, nachhaltig.', descEn: 'Warm, quiet, sustainable.',
    tags: ['warm', 'natur', 'braun'], tech: { staerkeMm: 11, fbh: 'bedingt', nasszelle: false, aussen: false, emission: 'A+', pflege: 'mittel' },
    p: { standard: [28, 52, 18, 32], premium: [38, 68, 20, 34], luxus: [55, 95, 22, 38] },
    tex: { base: '#B98C5A', variant: 'wood', grain: '#94693D' }, pattern: false, addons: ['sockelleisten', 'verlegung', 'versiegelung'],
  },
  {
    id: 'linoleum-boden', name: 'Linoleum natur', nameEn: 'Linoleum, Natural', sub: 'Linoleum',
    surface: 'boden', desc: 'Mineralisch-natürlich, antistatisch.', descEn: 'Natural, antistatic.',
    tags: ['neutral', 'natur', 'matt'], tech: { staerkeMm: 4, fbh: 'ja', nasszelle: false, aussen: false, emission: 'A+', pflege: 'mittel' },
    p: { standard: [26, 48, 18, 32], premium: [34, 60, 20, 34], luxus: [48, 82, 22, 38] },
    tex: { base: '#A6A290', variant: 'solid', grain: '#8A8675' }, pattern: false, addons: ['grundierung', 'verlegung'],
  },
  {
    id: 'teppichboden-wolle', name: 'Teppichboden Wolle Velours', nameEn: 'Wool Carpet, Velour', sub: 'Teppichboden',
    surface: 'boden', desc: 'Hochwertiger Wollvelours, warm.', descEn: 'Premium wool velour.',
    tags: ['warm', 'textil', 'creme'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'mittel' },
    p: { standard: [32, 58, 14, 24], premium: [48, 85, 15, 26], luxus: [78, 135, 16, 28] },
    tex: { base: '#CFC4AE', variant: 'carpet', grain: '#B3A88F' }, pattern: false, addons: ['verlegung'],
  },
]);

// ───────────────────────── B. WÄNDE ─────────────────────────
const waende = build('Wände', 'Walls', [
  {
    id: 'wandfarbe-matt', name: 'Wandfarbe matt', nameEn: 'Wall Paint, Matte', sub: 'Wandfarbe',
    surface: 'wand', desc: 'Hochdeckende Premium-Innenfarbe, stumpfmatt.', descEn: 'High-coverage matte paint.',
    tags: ['neutral', 'matt'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [3, 6, 9, 16], premium: [5, 9, 10, 18], luxus: [8, 14, 12, 22] },
    tex: { base: '#EDE9E0', variant: 'solid' }, addons: PAINT_ADDONS,
  },
  {
    id: 'kalkfarbe', name: 'Kalkfarbe / Kalkputz', nameEn: 'Lime Paint / Plaster', sub: 'Kalkfarbe',
    surface: 'wand', desc: 'Diffusionsoffen, lebendige matte Oberfläche.', descEn: 'Breathable, living matte finish.',
    tags: ['warm', 'natur', 'matt'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A+', pflege: 'mittel' },
    p: { standard: [9, 17, 14, 26], premium: [13, 24, 16, 30], luxus: [20, 36, 20, 38] },
    tex: { base: '#E6DFD0', variant: 'plaster', grain: '#CFC6B4' }, addons: ['grundierung-wand', 'aufbau-schicht', 'versiegelung'],
  },
  {
    id: 'tadelakt', name: 'Tadelakt', nameEn: 'Tadelakt', sub: 'Tadelakt',
    surface: 'wand', desc: 'Marokkanische Kalkspachtel, wasserfest poliert.', descEn: 'Polished waterproof lime.',
    tags: ['warm', 'edel', 'naturstein'], tech: { fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'mittel' },
    p: { standard: [28, 52, 45, 78], premium: [38, 68, 50, 86], luxus: [58, 98, 60, 102] },
    tex: { base: '#D7C9B2', variant: 'plaster', grain: '#B9A98E' }, addons: ['grundierung-wand', 'aufbau-schicht', 'versiegelung'],
  },
  {
    id: 'mikrozement-wand', name: 'Mikrozement Wand', nameEn: 'Microcement Wall', sub: 'Mikrozement',
    surface: 'wand', desc: 'Fugenlose Betonoptik für die Wand.', descEn: 'Seamless concrete look.',
    tags: ['grau', 'beton', 'modern'], tech: { fbh: 'ja', nasszelle: true, aussen: false, emission: 'A', pflege: 'mittel' },
    p: { standard: [30, 56, 48, 82], premium: [42, 75, 52, 90], luxus: [62, 105, 60, 102] },
    tex: { base: '#BDB6AB', variant: 'plaster', grain: '#9E968A' }, addons: ['grundierung-wand', 'aufbau-schicht', 'versiegelung'],
  },
  {
    id: 'spachtel-veneziano', name: 'Stucco Veneziano', nameEn: 'Venetian Plaster', sub: 'Spachteltechnik',
    surface: 'wand', desc: 'Polierte Kalkspachtel, marmorierter Glanz.', descEn: 'Polished marbled lime.',
    tags: ['edel', 'warm', 'glanz'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A+', pflege: 'mittel' },
    p: { standard: [26, 48, 42, 72], premium: [38, 68, 48, 82], luxus: [60, 102, 58, 98] },
    tex: { base: '#E0D6C4', variant: 'plaster', grain: '#C3B69E' }, addons: ['grundierung-wand', 'aufbau-schicht', 'versiegelung'],
  },
  {
    id: 'tapete-vlies', name: 'Vliestapete', nameEn: 'Non-woven Wallpaper', sub: 'Tapete',
    surface: 'wand', desc: 'Strapazierfähige Vliestapete, dezente Struktur.', descEn: 'Durable non-woven wallpaper.',
    tags: ['neutral', 'struktur'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [6, 12, 12, 22], premium: [12, 22, 14, 26], luxus: [24, 44, 16, 30] },
    tex: { base: '#E4DECF', variant: 'textile', grain: '#CCC4B1' }, addons: ['kleister', 'untergrund-tapete', 'tapezierarbeit'],
  },
  {
    id: 'tapete-textil', name: 'Textiltapete', nameEn: 'Textile Wallpaper', sub: 'Tapete',
    surface: 'wand', desc: 'Edle Textiltapete mit haptischer Tiefe.', descEn: 'Fine textile wallpaper.',
    tags: ['edel', 'warm', 'textil'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'mittel' },
    p: { standard: [18, 34, 14, 26], premium: [32, 58, 16, 30], luxus: [60, 105, 18, 34] },
    tex: { base: '#D8CFBC', variant: 'textile', grain: '#BCB29C' }, addons: ['kleister', 'untergrund-tapete', 'tapezierarbeit', 'musterversatz'],
  },
  {
    id: 'holz-lamellen', name: 'Holz-Lamellen Eiche', nameEn: 'Oak Slat Panels', sub: 'Holzvertäfelung',
    surface: 'wand', desc: 'Akustik-Lamellen auf Filz, warm.', descEn: 'Acoustic oak slats on felt.',
    tags: ['warm', 'eiche', 'akustik'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [55, 98, 22, 38], premium: [78, 135, 24, 42], luxus: [120, 205, 28, 48] },
    tex: { base: '#B89568', variant: 'wood', grain: '#8E7048' }, addons: ['unterkonstruktion-wand', 'montage'],
  },
  {
    id: 'ziegelriemchen', name: 'Ziegelriemchen', nameEn: 'Brick Slips', sub: 'Riemchen',
    surface: 'wand', desc: 'Klinkerriemchen, rustikal-warm.', descEn: 'Brick slips, rustic warm.',
    tags: ['warm', 'terrakotta', 'rustikal'], tech: { fbh: 'ja', nasszelle: false, aussen: true, emission: 'A+', pflege: 'gering' },
    p: { standard: [28, 52, 38, 66], premium: [42, 75, 42, 72], luxus: [68, 118, 48, 82] },
    tex: { base: '#A9694D', variant: 'tile', grain: '#7E4A34' }, addons: ['fliesenkleber', 'fugenmasse', 'grundierung'],
  },
  {
    id: 'wandfliese-zellige', name: 'Zellige-Wandfliese', nameEn: 'Zellige Wall Tile', sub: 'Wandfliesen',
    surface: 'wand', desc: 'Handgefertigte Zellige, lebendige Glasur.', descEn: 'Handmade zellige tile.',
    tags: ['edel', 'glanz', 'mediterran'], tech: { format: '10×10', rutschklasse: 'R9', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [38, 68, 55, 95], premium: [58, 98, 60, 102], luxus: [95, 165, 68, 115] },
    tex: { base: '#9DB7AE', variant: 'tile', grain: '#7C968D' }, addons: TILE_ADDONS,
  },
]);

// ───────────────────────── C. DECKEN ─────────────────────────
const decken = build('Decken', 'Ceilings', [
  {
    id: 'decke-anstrich', name: 'Deckenanstrich Hellweiß', nameEn: 'Ceiling Paint, Bright White', sub: 'Anstrich',
    surface: 'decke', desc: 'Stumpfmatter Deckenanstrich.', descEn: 'Matte ceiling paint.',
    tags: ['hell', 'matt'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [3, 5, 9, 16], premium: [4, 7, 10, 18], luxus: [6, 11, 12, 22] },
    tex: { base: '#F2F0EA', variant: 'solid' }, addons: ['grundierung-wand', 'abdecken', 'anstrich2'],
  },
  {
    id: 'decke-spanndecke', name: 'Spanndecke matt', nameEn: 'Stretch Ceiling, Matte', sub: 'Spanndecke',
    surface: 'decke', desc: 'Matte Spanndecke, fugenlos.', descEn: 'Seamless matte stretch ceiling.',
    tags: ['hell', 'modern'], tech: { fbh: 'ja', nasszelle: true, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [35, 62, 18, 32], premium: [48, 85, 20, 36], luxus: [72, 125, 24, 42] },
    tex: { base: '#EFEDE7', variant: 'solid' }, addons: ['unterkonstruktion-decke', 'montage'],
  },
  {
    id: 'decke-gk-abgehaengt', name: 'Abgehängte GK-Decke', nameEn: 'Suspended Plasterboard', sub: 'Gipskarton',
    surface: 'decke', desc: 'Abgehängt, gespachtelt, gestrichen.', descEn: 'Suspended, filled, painted.',
    tags: ['hell', 'glatt'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [18, 34, 35, 62], premium: [24, 44, 38, 66], luxus: [34, 60, 44, 76] },
    tex: { base: '#ECEAE3', variant: 'solid' }, addons: ['unterkonstruktion-decke', 'beplankung', 'spachteln', 'anstrich2'],
  },
  {
    id: 'decke-akustik', name: 'Akustikdecke', nameEn: 'Acoustic Ceiling', sub: 'Akustik',
    surface: 'decke', desc: 'Schallabsorbierende Deckensegel.', descEn: 'Sound-absorbing panels.',
    tags: ['neutral', 'akustik'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [42, 75, 28, 48], premium: [58, 98, 30, 52], luxus: [85, 145, 34, 58] },
    tex: { base: '#E2DED6', variant: 'textile', grain: '#C9C4B8' }, addons: ['unterkonstruktion-decke', 'montage'],
  },
  {
    id: 'decke-holz', name: 'Holzdecke Eiche', nameEn: 'Oak Ceiling', sub: 'Holzdecke',
    surface: 'decke', desc: 'Warme Holzdecke, geölt.', descEn: 'Warm oiled oak ceiling.',
    tags: ['warm', 'eiche', 'natur'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'mittel' },
    p: { standard: [55, 98, 32, 55], premium: [78, 135, 35, 60], luxus: [120, 205, 40, 68] },
    tex: { base: '#BE9C6E', variant: 'wood', grain: '#96774C' }, addons: ['unterkonstruktion-decke', 'montage'],
  },
  {
    id: 'decke-stuck', name: 'Stuck & Zierleisten', nameEn: 'Stucco & Cornices', sub: 'Stuck',
    surface: 'decke', desc: 'Klassische Stuckleisten & Rosette.', descEn: 'Classic cornices & rosette.',
    tags: ['klassisch', 'hell'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [22, 40, 25, 44], premium: [34, 60, 28, 48], luxus: [55, 95, 34, 58] },
    tex: { base: '#F0EEE8', variant: 'solid' }, addons: ['montage', 'anstrich2'],
  },
  {
    id: 'decke-lichtvoute', name: 'Indirekte Beleuchtung / Lichtvoute', nameEn: 'Indirect Light Cove', sub: 'Lichtvoute',
    surface: 'decke', desc: 'LED-Voute für indirektes Stimmungslicht.', descEn: 'LED cove for indirect light.',
    tags: ['modern', 'licht'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [38, 68, 22, 38], premium: [52, 92, 24, 42], luxus: [78, 135, 28, 48] },
    tex: { base: '#E8E5DD', variant: 'solid' }, addons: ['unterkonstruktion-decke', 'elektro-anschluss'],
  },
]);

// ───────────────────────── H. TEXTILIEN ─────────────────────────
const textilien = build('Textilien', 'Textiles', [
  rowTextile('textil-boucle', 'Bouclé', 'Bouclé', '#E2D9C6', ['warm', 'creme']),
  rowTextile('textil-leinen', 'Leinen', 'Linen', '#D8CFB8', ['natur', 'neutral']),
  rowTextile('textil-samt', 'Samt', 'Velvet', '#3E5A52', ['edel', 'gruen']),
  rowTextile('textil-wolle', 'Wolle', 'Wool', '#B6AB97', ['warm', 'greige']),
  rowTextile('textil-cord', 'Cord', 'Corduroy', '#9C7B4E', ['warm', 'braun']),
  rowTextile('textil-chenille', 'Chenille', 'Chenille', '#C9BBA6', ['weich', 'creme']),
  rowTextile('textil-leder', 'Leder', 'Leather', '#7A5238', ['edel', 'braun']),
  rowTextile('textil-kunstleder', 'Kunstleder', 'Faux Leather', '#6E5644', ['robust', 'braun']),
  rowTextile('textil-mikrofaser', 'Mikrofaser', 'Microfiber', '#9A958A', ['robust', 'grau']),
]);

function rowTextile(id: string, name: string, nameEn: string, base: string, tags: string[]): Row {
  return {
    id, name, nameEn, sub: 'Polsterstoff', surface: 'sonstiges',
    desc: `${name} — Polster-/Vorhangstoff.`, descEn: `${nameEn} upholstery fabric.`,
    tags, tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'mittel' },
    p: { standard: [22, 42, 0, 0], premium: [40, 72, 0, 0], luxus: [75, 130, 0, 0] },
    tex: { base, variant: 'textile', grain: '#00000022' }, unit: 'm2', addons: [],
  };
}

// ───────────────────────── I. METALLE / OBERFLÄCHEN ─────────────────────────
const metalle = build('Metalle & Oberflächen', 'Metals & Finishes', [
  rowMetal('metall-messing-gebuerstet', 'Messing gebürstet', 'Brushed Brass', '#B79A5B'),
  rowMetal('metall-messing-poliert', 'Messing poliert', 'Polished Brass', '#CBA85E'),
  rowMetal('metall-bronze', 'Bronze', 'Bronze', '#8C6A45'),
  rowMetal('metall-schwarz-matt', 'Schwarz matt', 'Matte Black', '#2C2C2C'),
  rowMetal('metall-edelstahl', 'Edelstahl gebürstet', 'Brushed Steel', '#A9ABAD'),
  rowMetal('metall-chrom', 'Chrom', 'Chrome', '#C7CCD0'),
  rowMetal('metall-nickel', 'Nickel gebürstet', 'Brushed Nickel', '#B4B2AC'),
  rowMetal('metall-kupfer', 'Kupfer', 'Copper', '#A9714B'),
]);

function rowMetal(id: string, name: string, nameEn: string, base: string): Row {
  return {
    id, name, nameEn, sub: 'Oberfläche', surface: 'sonstiges',
    desc: `${name} — Beschlag-/Armaturen-/Leuchtenoberfläche.`, descEn: `${nameEn} hardware finish.`,
    tags: ['metall'], tech: { fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [0, 0, 0, 0], premium: [0, 0, 0, 0], luxus: [0, 0, 0, 0] },
    tex: { base, variant: 'metal', grain: '#ffffff33' }, unit: 'stk', addons: [],
  };
}

// ── Erweiterung: zusätzliche Boden-/Wand-Varianten (Markttiefe) ──
const boedenExtra = build('Böden', 'Floors', [
  {
    id: 'parkett-nussbaum-landhaus', name: 'Nussbaum Landhausdiele', nameEn: 'Walnut Plank', sub: 'Parkett',
    surface: 'boden', desc: 'Warme Nussbaumdiele, geölt.', descEn: 'Warm oiled walnut plank.',
    tags: ['dunkel', 'edel', 'nussbaum'], tech: { staerkeMm: 14, nutzschichtMm: 4, format: '1900×190', fbh: 'bedingt', nasszelle: false, aussen: false, emission: 'A+', pflege: 'mittel' },
    p: { standard: [58, 99, 24, 42], premium: [88, 149, 28, 48], luxus: [135, 229, 32, 56] },
    tex: { base: '#6E4E38', variant: 'wood', grain: '#4C3526' }, pattern: true, addons: FLOOR_ADDONS,
  },
  {
    id: 'parkett-esche-schiff', name: 'Esche Schiffsboden weiß geölt', nameEn: 'Ash Ship-deck, White Oiled', sub: 'Parkett',
    surface: 'boden', desc: 'Helle Esche, dreireihig, weiß geölt.', descEn: 'Light ash, three-strip.',
    tags: ['hell', 'natur', 'esche'], tech: { staerkeMm: 14, nutzschichtMm: 3.5, format: '2200×200', fbh: 'bedingt', nasszelle: false, aussen: false, emission: 'A+', pflege: 'mittel' },
    p: { standard: [42, 75, 22, 38], premium: [64, 109, 24, 42], luxus: [98, 169, 28, 48] },
    tex: { base: '#DCCDB2', variant: 'wood', grain: '#BBA988' }, pattern: true, addons: FLOOR_ADDONS,
  },
  {
    id: 'parkett-eiche-mosaik', name: 'Eiche Mosaikparkett', nameEn: 'Oak Mosaic Parquet', sub: 'Parkett',
    surface: 'boden', desc: 'Klassisches Würfelmuster, robust.', descEn: 'Classic cube pattern.',
    tags: ['warm', 'eiche', 'klassisch'], tech: { staerkeMm: 8, format: '160×23', fbh: 'ja', nasszelle: false, aussen: false, emission: 'A+', pflege: 'mittel' },
    p: { standard: [38, 68, 28, 48], premium: [58, 99, 30, 52], luxus: [88, 149, 34, 58] },
    tex: { base: '#C19A66', variant: 'wood', grain: '#9A7A4C' }, pattern: true, addons: FLOOR_ADDONS,
  },
  {
    id: 'laminat-stein', name: 'Laminat Steinoptik AC4', nameEn: 'Laminate Stone AC4', sub: 'Laminat',
    surface: 'boden', desc: 'Steinoptik, NK32/AC4, 8 mm.', descEn: 'Stone look, class 32/AC4.',
    tags: ['grau', 'stein', 'budget'], tech: { nutzungsklasse: 'AC4 / NK32', staerkeMm: 8, format: '1290×327', fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [16, 30, 14, 24], premium: [24, 42, 15, 26], luxus: [34, 58, 16, 28] },
    tex: { base: '#B4B0A8', variant: 'stone', grain: '#928E86' }, pattern: false, addons: ['trittschall', 'sockelleisten', 'verlegung'],
  },
  {
    id: 'vinyl-klick-holz', name: 'Klick-Vinyl Holzoptik', nameEn: 'Click Vinyl, Wood', sub: 'Vinyl / LVT',
    surface: 'boden', desc: 'Warme Holzoptik, wasserfest, Nutzschicht 0,3 mm.', descEn: 'Warm wood look, waterproof.',
    tags: ['warm', 'eiche', 'robust'], tech: { nutzungsklasse: 'NK31', staerkeMm: 4.5, nutzschichtMm: 0.3, format: '1220×180', rutschklasse: 'R10', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [22, 40, 16, 28], premium: [30, 54, 17, 30], luxus: [44, 78, 18, 32] },
    tex: { base: '#C0A176', variant: 'wood', grain: '#9C8055' }, pattern: false, addons: ['trittschall', 'sockelleisten', 'verlegung'],
  },
  {
    id: 'feinstein-3060-holz', name: 'Feinsteinzeug 30×60 Holzoptik', nameEn: 'Porcelain 30×60 Wood', sub: 'Fliesen / Feinsteinzeug',
    surface: 'boden', desc: 'Holzoptik-Fliese, R10, fürs Bad geeignet.', descEn: 'Wood-look tile, R10.',
    tags: ['warm', 'holz', 'robust'], tech: { format: '30×60', rutschklasse: 'R10 / B', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [30, 54, 42, 72], premium: [44, 78, 45, 78], luxus: [70, 120, 52, 88] },
    tex: { base: '#B8966A', variant: 'tile', grain: '#937349' }, pattern: false, addons: TILE_ADDONS,
  },
  {
    id: 'naturstein-schiefer', name: 'Schiefer gespalten', nameEn: 'Split Slate', sub: 'Naturstein',
    surface: 'boden', desc: 'Anthrazit-Schiefer, rutschhemmend, außentauglich.', descEn: 'Anthracite slate, outdoor-rated.',
    tags: ['anthrazit', 'naturstein', 'robust'], tech: { format: '600×300', rutschklasse: 'R11', fbh: 'ja', nasszelle: true, aussen: true, emission: 'A+', pflege: 'mittel' },
    p: { standard: [48, 85, 52, 90], premium: [72, 125, 56, 96], luxus: [115, 195, 64, 110] },
    tex: { base: '#454A4D', variant: 'stone', grain: '#2E3133' }, pattern: false, addons: [...TILE_ADDONS, 'impraegnierung'],
  },
  {
    id: 'teppichboden-sisal', name: 'Sisal-Teppichboden', nameEn: 'Sisal Carpet', sub: 'Teppichboden',
    surface: 'boden', desc: 'Naturfaser Sisal, strukturiert.', descEn: 'Natural sisal fibre.',
    tags: ['natur', 'beige', 'textil'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'mittel' },
    p: { standard: [28, 50, 14, 24], premium: [40, 72, 15, 26], luxus: [62, 108, 16, 28] },
    tex: { base: '#C7B795', variant: 'carpet', grain: '#A99B79' }, pattern: false, addons: ['verlegung'],
  },
]);

const waendeExtra = build('Wände', 'Walls', [
  {
    id: 'feinputz', name: 'Feinputz Q3', nameEn: 'Fine Plaster Q3', sub: 'Feinputz',
    surface: 'wand', desc: 'Glatter Feinputz, Qualitätsstufe Q3.', descEn: 'Smooth fine plaster Q3.',
    tags: ['neutral', 'glatt'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [8, 15, 16, 28], premium: [11, 20, 18, 32], luxus: [16, 28, 22, 38] },
    tex: { base: '#E8E3D6', variant: 'plaster', grain: '#CFC9B9' }, addons: ['grundierung-wand', 'aufbau-schicht'],
  },
  {
    id: 'tapete-raufaser', name: 'Raufaser', nameEn: 'Woodchip Wallpaper', sub: 'Tapete',
    surface: 'wand', desc: 'Klassische Raufaser, überstreichbar.', descEn: 'Classic paintable woodchip.',
    tags: ['neutral', 'struktur', 'budget'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [3, 7, 12, 22], premium: [5, 10, 13, 24], luxus: [8, 15, 15, 28] },
    tex: { base: '#EDE8DC', variant: 'plaster', grain: '#D6CFBF' }, addons: ['kleister', 'untergrund-tapete', 'tapezierarbeit'],
  },
  {
    id: 'tapete-gras', name: 'Naturtapete Gras/Bambus', nameEn: 'Grasscloth Wallpaper', sub: 'Tapete',
    surface: 'wand', desc: 'Naturmaterial-Tapete mit Faserstruktur.', descEn: 'Natural grasscloth.',
    tags: ['natur', 'warm', 'textil'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'mittel' },
    p: { standard: [22, 40, 14, 26], premium: [38, 68, 16, 30], luxus: [68, 118, 18, 34] },
    tex: { base: '#C9B98F', variant: 'textile', grain: '#A99A70' }, addons: ['kleister', 'untergrund-tapete', 'tapezierarbeit', 'musterversatz'],
  },
  {
    id: 'holz-kassetten', name: 'Holz-Kassetten (Landhaus)', nameEn: 'Wood Coffer Panels', sub: 'Holzvertäfelung',
    surface: 'wand', desc: 'Kassettenvertäfelung, klassisch-elegant.', descEn: 'Coffered wall panelling.',
    tags: ['klassisch', 'hell', 'holz'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [62, 110, 28, 48], premium: [88, 155, 32, 56], luxus: [135, 235, 38, 66] },
    tex: { base: '#E4DECF', variant: 'wood', grain: '#C7BFAA' }, addons: ['unterkonstruktion-wand', 'montage'],
  },
  {
    id: 'wandfliese-metro', name: 'Metro-Wandfliese', nameEn: 'Metro Wall Tile', sub: 'Wandfliesen',
    surface: 'wand', desc: 'Klassische Metro-Fliese, glänzend.', descEn: 'Classic glossy metro tile.',
    tags: ['hell', 'glanz', 'klassisch'], tech: { format: '7,5×15', rutschklasse: 'R9', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [22, 40, 50, 86], premium: [34, 60, 55, 95], luxus: [55, 95, 62, 105] },
    tex: { base: '#EDEAE3', variant: 'tile', grain: '#D2CCC0' }, addons: TILE_ADDONS,
  },
  {
    id: 'naturstein-riemchen', name: 'Naturstein-Riemchen', nameEn: 'Stone Slips', sub: 'Riemchen',
    surface: 'wand', desc: 'Schichtquarzit-Riemchen, plastische Wand.', descEn: 'Layered quartzite slips.',
    tags: ['naturstein', 'grau', 'rustikal'], tech: { fbh: 'ja', nasszelle: false, aussen: true, emission: 'A+', pflege: 'gering' },
    p: { standard: [38, 68, 42, 72], premium: [55, 95, 46, 80], luxus: [88, 150, 52, 90] },
    tex: { base: '#8E8F8E', variant: 'stone', grain: '#6b6c6b' }, addons: ['fliesenkleber', 'fugenmasse', 'grundierung'],
  },
  {
    id: 'wandpaneel-akustik', name: 'Akustik-Wandpaneel', nameEn: 'Acoustic Wall Panel', sub: 'Wandpaneele',
    surface: 'wand', desc: 'Textilbespanntes Akustikpaneel.', descEn: 'Fabric-wrapped acoustic panel.',
    tags: ['neutral', 'akustik', 'textil'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [48, 85, 22, 38], premium: [68, 118, 24, 42], luxus: [98, 168, 28, 48] },
    tex: { base: '#B6AB97', variant: 'textile', grain: '#9A8F7B' }, addons: ['unterkonstruktion-wand', 'montage'],
  },
]);

// ───────── Erweiterung 4: weitere Böden (rein additiv) ─────────
const boeden4 = build('Böden', 'Floors', [
  {
    id: 'laminat-eiche-ac4', name: 'Laminat Eiche AC4', nameEn: 'Laminate Oak AC4', sub: 'Laminat',
    surface: 'boden', desc: 'NK32/AC4, 8 mm, gute Allround-Wahl.', descEn: 'Class 32/AC4 laminate.',
    tags: ['warm', 'eiche', 'budget'], tech: { nutzungsklasse: 'AC4 / NK32', staerkeMm: 8, format: '1380×190', fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [13, 25, 14, 24], premium: [20, 36, 15, 26], luxus: [29, 50, 16, 28] },
    tex: { base: '#C4A87C', variant: 'wood', grain: '#9E8456' }, pattern: false, addons: ['trittschall', 'sockelleisten', 'verlegung'],
  },
  {
    id: 'vinyl-klebe-eiche', name: 'Klebevinyl Eiche', nameEn: 'Glue-down Vinyl Oak', sub: 'Vinyl / LVT',
    surface: 'boden', desc: 'Vollflächig verklebt, sehr ruhig, Nutzschicht 0,55 mm.', descEn: 'Glue-down vinyl, quiet.',
    tags: ['warm', 'eiche', 'robust'], tech: { nutzungsklasse: 'NK33', staerkeMm: 2.5, nutzschichtMm: 0.55, format: '1220×185', rutschklasse: 'R10', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [20, 38, 22, 38], premium: [28, 50, 24, 42], luxus: [40, 70, 28, 48] },
    tex: { base: '#C0A074', variant: 'wood', grain: '#9A7E52' }, pattern: false, addons: ['grundierung', 'sockelleisten', 'verlegung'],
  },
  {
    id: 'rigid-spc-eiche', name: 'Rigid/SPC Diele Eiche', nameEn: 'Rigid SPC Oak', sub: 'Designboden / SPC',
    surface: 'boden', desc: 'Hartkern, formstabil, wasserfest.', descEn: 'Rigid core, dimensionally stable.',
    tags: ['warm', 'eiche', 'robust'], tech: { nutzungsklasse: 'NK33', staerkeMm: 5.5, nutzschichtMm: 0.55, format: '1500×230', rutschklasse: 'R10', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [26, 48, 16, 28], premium: [36, 64, 17, 30], luxus: [52, 90, 18, 32] },
    tex: { base: '#BE9E72', variant: 'wood', grain: '#977B50' }, pattern: false, addons: ['trittschall', 'sockelleisten', 'verlegung'],
  },
  {
    id: 'bambus-boden', name: 'Bambusparkett', nameEn: 'Bamboo Flooring', sub: 'Bambus',
    surface: 'boden', desc: 'Strand-Bambus, härter als viele Hölzer.', descEn: 'Strand-woven bamboo.',
    tags: ['warm', 'natur', 'bambus'], tech: { staerkeMm: 14, format: '1850×135', fbh: 'bedingt', nasszelle: false, aussen: false, emission: 'A+', pflege: 'mittel' },
    p: { standard: [38, 68, 22, 38], premium: [55, 95, 24, 42], luxus: [82, 140, 28, 48] },
    tex: { base: '#CDA976', variant: 'wood', grain: '#A8854F' }, pattern: true, addons: FLOOR_ADDONS,
  },
  {
    id: 'naturstein-granit', name: 'Granit poliert', nameEn: 'Polished Granite', sub: 'Naturstein',
    surface: 'boden', desc: 'Sehr hart, edel, pflegeleicht.', descEn: 'Very hard, elegant.',
    tags: ['grau', 'naturstein', 'edel'], tech: { format: '600×600', rutschklasse: 'R9', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [70, 120, 55, 95], premium: [110, 185, 60, 102], luxus: [180, 300, 70, 118] },
    tex: { base: '#8E8C8A', variant: 'stone', grain: '#6A6866' }, pattern: false, addons: [...TILE_ADDONS, 'impraegnierung'],
  },
  {
    id: 'naturstein-kalkstein', name: 'Kalkstein gebürstet', nameEn: 'Brushed Limestone', sub: 'Naturstein',
    surface: 'boden', desc: 'Warm-matter Naturstein, mediterran.', descEn: 'Warm matte limestone.',
    tags: ['creme', 'naturstein', 'warm'], tech: { format: '600×400', rutschklasse: 'R10', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'hoch' },
    p: { standard: [58, 100, 52, 90], premium: [90, 155, 56, 96], luxus: [150, 255, 64, 110] },
    tex: { base: '#D8CDB6', variant: 'stone', grain: '#B7AA8E' }, pattern: false, addons: [...TILE_ADDONS, 'impraegnierung'],
  },
  {
    id: 'naturstein-onyx', name: 'Onyx hinterleuchtbar', nameEn: 'Backlit Onyx', sub: 'Naturstein',
    surface: 'boden', desc: 'Edler, transluzenter Naturstein.', descEn: 'Translucent precious stone.',
    tags: ['edel', 'naturstein', 'luxus'], tech: { format: '600×300', rutschklasse: 'R9', fbh: 'ja', nasszelle: false, aussen: false, emission: 'A+', pflege: 'hoch' },
    p: { standard: [160, 270, 60, 105], premium: [260, 440, 68, 118], luxus: [420, 700, 80, 135] },
    tex: { base: '#D9C8A0', variant: 'stone', grain: '#B49C6E' }, pattern: false, addons: [...TILE_ADDONS, 'impraegnierung'],
  },
  {
    id: 'naturstein-quarzit', name: 'Quarzit', nameEn: 'Quartzite', sub: 'Naturstein',
    surface: 'boden', desc: 'Hart, frostsicher, außentauglich.', descEn: 'Hard, frost-proof.',
    tags: ['grau', 'naturstein', 'robust'], tech: { format: '600×600', rutschklasse: 'R11', fbh: 'ja', nasszelle: true, aussen: true, emission: 'A+', pflege: 'mittel' },
    p: { standard: [62, 108, 54, 92], premium: [98, 168, 58, 100], luxus: [160, 270, 66, 112] },
    tex: { base: '#A6A8A2', variant: 'stone', grain: '#80827C' }, pattern: false, addons: [...TILE_ADDONS, 'impraegnierung'],
  },
  {
    id: 'naturstein-sandstein', name: 'Sandstein', nameEn: 'Sandstone', sub: 'Naturstein',
    surface: 'boden', desc: 'Warm, natürlich, mediterran.', descEn: 'Warm natural sandstone.',
    tags: ['creme', 'naturstein', 'warm'], tech: { format: '600×400', rutschklasse: 'R10', fbh: 'ja', nasszelle: true, aussen: true, emission: 'A+', pflege: 'hoch' },
    p: { standard: [52, 92, 52, 90], premium: [82, 142, 56, 96], luxus: [135, 230, 64, 110] },
    tex: { base: '#D2BF98', variant: 'stone', grain: '#B19C72' }, pattern: false, addons: [...TILE_ADDONS, 'impraegnierung'],
  },
  {
    id: 'gussboden', name: 'Gussboden / Epoxid', nameEn: 'Poured Resin Floor', sub: 'Gussboden',
    surface: 'boden', desc: 'Fugenlos, industriell-edel, sehr robust.', descEn: 'Seamless industrial resin.',
    tags: ['grau', 'modern', 'robust'], tech: { staerkeMm: 4, fbh: 'ja', nasszelle: true, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [45, 80, 55, 95], premium: [62, 108, 60, 102], luxus: [90, 155, 68, 115] },
    tex: { base: '#B0ADA6', variant: 'solid' }, pattern: false, addons: ['grundierung', 'versiegelung', 'verlegung'],
  },
  {
    id: 'teppich-synthetik', name: 'Teppichboden Synthetik', nameEn: 'Synthetic Carpet', sub: 'Teppichboden',
    surface: 'boden', desc: 'Robust, fleckunempfindlich, günstig.', descEn: 'Durable synthetic carpet.',
    tags: ['grau', 'textil', 'budget'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [18, 34, 14, 24], premium: [28, 50, 15, 26], luxus: [44, 78, 16, 28] },
    tex: { base: '#A8A49B', variant: 'carpet', grain: '#8C887F' }, pattern: false, addons: ['verlegung'],
  },
  {
    id: 'feinstein-hexagon', name: 'Feinsteinzeug Hexagon', nameEn: 'Porcelain Hexagon', sub: 'Fliesen / Feinsteinzeug',
    surface: 'boden', desc: 'Sechseck-Fliese, dekorativ, R10.', descEn: 'Hexagon tile, R10.',
    tags: ['grau', 'dekor', 'modern'], tech: { format: 'Hexagon 25', rutschklasse: 'R10 / B', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [38, 68, 48, 82], premium: [56, 96, 52, 88], luxus: [88, 150, 60, 102] },
    tex: { base: '#C2C0BA', variant: 'tile', grain: '#9E9C95' }, pattern: false, addons: TILE_ADDONS,
  },
  {
    id: 'feinstein-terrazzo', name: 'Terrazzo-Optik 80×80', nameEn: 'Terrazzo-look 80×80', sub: 'Fliesen / Feinsteinzeug',
    surface: 'boden', desc: 'Terrazzo-Optik, großformatig, edel.', descEn: 'Terrazzo look, large format.',
    tags: ['creme', 'terrazzo', 'edel'], tech: { format: '80×80', rutschklasse: 'R9', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A+', pflege: 'gering' },
    p: { standard: [48, 85, 45, 78], premium: [72, 125, 48, 82], luxus: [115, 195, 56, 95] },
    tex: { base: '#E0DACB', variant: 'stone', grain: '#C3BBA6' }, pattern: false, addons: TILE_ADDONS,
  },
  {
    id: 'zementfliese', name: 'Zementfliese orientalisch', nameEn: 'Encaustic Cement Tile', sub: 'Fliesen / Feinsteinzeug',
    surface: 'boden', desc: 'Gemustert, mediterran-orientalisch.', descEn: 'Patterned cement tile.',
    tags: ['dekor', 'mediterran', 'muster'], tech: { format: '20×20', rutschklasse: 'R10', fbh: 'ja', nasszelle: true, aussen: false, emission: 'A', pflege: 'mittel' },
    p: { standard: [55, 95, 55, 95], premium: [82, 142, 60, 102], luxus: [130, 220, 68, 115] },
    tex: { base: '#9FB0AE', variant: 'tile', grain: '#7C8D8B' }, pattern: false, addons: [...TILE_ADDONS, 'impraegnierung'],
  },
]);

// ───────── Erweiterung 4: weitere Wände (rein additiv) ─────────
const waende4 = build('Wände', 'Walls', [
  {
    id: 'beton-cire', name: 'Beton Ciré', nameEn: 'Béton Ciré', sub: 'Spachteltechnik',
    surface: 'wand', desc: 'Fugenlose Betonoptik, samtig.', descEn: 'Seamless concrete finish.',
    tags: ['grau', 'beton', 'modern'], tech: { fbh: 'ja', nasszelle: true, aussen: false, emission: 'A', pflege: 'mittel' },
    p: { standard: [34, 62, 48, 82], premium: [46, 82, 52, 90], luxus: [68, 116, 60, 102] },
    tex: { base: '#BCB6AB', variant: 'plaster', grain: '#9D968A' }, addons: ['grundierung-wand', 'aufbau-schicht', 'versiegelung'],
  },
  {
    id: 'profilholz-landhaus', name: 'Profilholz Landhaus', nameEn: 'Tongue-and-Groove Panelling', sub: 'Holzvertäfelung',
    surface: 'wand', desc: 'Weiße Landhaus-Vertäfelung.', descEn: 'White country panelling.',
    tags: ['hell', 'klassisch', 'holz'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [42, 75, 26, 45], premium: [62, 108, 30, 52], luxus: [95, 165, 36, 62] },
    tex: { base: '#ECE7DB', variant: 'wood', grain: '#CFC8B6' }, addons: ['unterkonstruktion-wand', 'montage'],
  },
  {
    id: 'kassettenwand', name: 'Kassettenwand', nameEn: 'Coffered Wall', sub: 'Holzvertäfelung',
    surface: 'wand', desc: 'Elegante Kassetten, klassisch.', descEn: 'Elegant coffered panels.',
    tags: ['klassisch', 'edel', 'holz'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [68, 118, 30, 52], premium: [98, 168, 34, 58], luxus: [148, 250, 40, 68] },
    tex: { base: '#E0DACC', variant: 'wood', grain: '#C2BAA4' }, addons: ['unterkonstruktion-wand', 'montage'],
  },
  {
    id: 'steinriemchen-wand', name: 'Steinriemchen', nameEn: 'Stone Cladding Slips', sub: 'Riemchen',
    surface: 'wand', desc: 'Schichtstein, plastische Akzentwand.', descEn: 'Layered stone accent wall.',
    tags: ['naturstein', 'grau', 'rustikal'], tech: { fbh: 'ja', nasszelle: false, aussen: true, emission: 'A+', pflege: 'gering' },
    p: { standard: [40, 72, 42, 72], premium: [58, 100, 46, 80], luxus: [92, 158, 52, 90] },
    tex: { base: '#9A958C', variant: 'stone', grain: '#6F6B63' }, addons: ['fliesenkleber', 'fugenmasse', 'grundierung'],
  },
  {
    id: 'naturstein-verblender', name: 'Naturstein-Verblender', nameEn: 'Natural Stone Veneer', sub: 'Verblender',
    surface: 'wand', desc: 'Echtstein-Verblender, edle Tiefe.', descEn: 'Real-stone veneer.',
    tags: ['naturstein', 'edel'], tech: { fbh: 'ja', nasszelle: false, aussen: true, emission: 'A+', pflege: 'gering' },
    p: { standard: [55, 98, 48, 82], premium: [82, 142, 52, 90], luxus: [130, 222, 60, 102] },
    tex: { base: '#B0A693', variant: 'stone', grain: '#8B8273' }, addons: ['fliesenkleber', 'fugenmasse', 'grundierung'],
  },
  {
    id: 'paneel-3d', name: '3D-Wandpaneel', nameEn: '3D Wall Panel', sub: 'Wandpaneele',
    surface: 'wand', desc: 'Reliefpaneel mit Schattenspiel.', descEn: 'Relief panel with shadow play.',
    tags: ['modern', 'struktur'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [48, 85, 24, 42], premium: [70, 120, 28, 48], luxus: [108, 185, 34, 58] },
    tex: { base: '#E2DED6', variant: 'plaster', grain: '#C7C2B7' }, addons: ['unterkonstruktion-wand', 'montage'],
  },
  {
    id: 'textilbespannung', name: 'Textilbespannung', nameEn: 'Fabric Wall Covering', sub: 'Textilbespannung',
    surface: 'wand', desc: 'Wandbespannung, warm & akustisch.', descEn: 'Acoustic fabric wall.',
    tags: ['warm', 'textil', 'edel'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'mittel' },
    p: { standard: [38, 68, 22, 38], premium: [58, 100, 24, 42], luxus: [92, 158, 28, 48] },
    tex: { base: '#D8CFBC', variant: 'textile', grain: '#BCB29C' }, addons: ['unterkonstruktion-wand', 'montage'],
  },
  {
    id: 'tapete-fototapete', name: 'Fototapete', nameEn: 'Photo Wallpaper', sub: 'Tapete',
    surface: 'wand', desc: 'Großmotiv-Tapete als Statement-Wand.', descEn: 'Large-motif statement wallpaper.',
    tags: ['dekor', 'statement'], tech: { fbh: 'ja', nasszelle: false, aussen: false, emission: 'A', pflege: 'gering' },
    p: { standard: [18, 34, 14, 26], premium: [32, 58, 16, 30], luxus: [58, 100, 18, 34] },
    tex: { base: '#CFC6B8', variant: 'textile', grain: '#B2A892' }, addons: ['kleister', 'untergrund-tapete', 'tapezierarbeit', 'musterversatz'],
  },
]);

export const MATERIALS: Material[] = [
  ...boeden,
  ...boedenExtra,
  ...boeden4,
  ...waende,
  ...waendeExtra,
  ...waende4,
  ...decken,
  ...textilien,
  ...metalle,
];

export const MATERIAL_CATEGORIES = Array.from(new Set(MATERIALS.map((m) => m.category)));

export function findMaterial(id: string | undefined): Material | undefined {
  if (!id) return undefined;
  return MATERIALS.find((m) => m.id === id);
}

export function materialsByCategory(category: string): Material[] {
  return MATERIALS.filter((m) => m.category === category);
}

export function materialsBySurface(surface: Surface): Material[] {
  return MATERIALS.filter((m) => m.surface === surface);
}
