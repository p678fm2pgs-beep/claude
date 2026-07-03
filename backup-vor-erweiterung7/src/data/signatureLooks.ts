/**
 * HAVEN ATELIER — Signature Looks (Erweiterung 6 · S8).
 * 8 benannte, redaktionell kuratierte Raum-Looks: Farbrollen + Boden + Wand +
 * Akzent-Metall + Leittextil. One-Click-Anwenden (mit Bestätigung) auf die aktive Variante.
 * Rein additiv: eigener Katalog, bestehende Presets/Kombis bleiben unberührt.
 */
import type { ColorRole, LayingPattern, LayingDirection, Finish, PriceTier, Variant } from '../types';
import { uid } from '../lib/id';

export interface SignatureLook {
  id: string;
  /** Editorialer Name, z. B. „№ 1 · Stille Mitte". */
  name: string;
  nameEn: string;
  /** Ein-Satz-Claim (Beratungs-Sprache). */
  claim: string;
  claimEn: string;
  /** Farbrollen → Ton-IDs (HAVEN-Bibliothek). */
  colorRoles: Partial<Record<ColorRole, string>>;
  /** Boden inkl. Ebene-2-Ausführung. */
  floor: {
    materialId: string;
    tier: PriceTier;
    pattern?: LayingPattern;
    layingDirection?: LayingDirection;
    finish?: Finish;
  };
  /** Wandaufbau. */
  wall: { materialId: string; tier: PriceTier };
  /** Akzent-Metall (Beschläge/Armaturen/Leuchten). */
  accentMetal: string;
  /** Leittextil (Polster/Vorhang). */
  textile: string;
}

export const SIGNATURE_LOOKS: SignatureLook[] = [
  {
    id: 'stille-mitte',
    name: '№ 1 · Stille Mitte',
    nameEn: 'No. 1 · Quiet Centre',
    claim: 'Quiet Luxury: Wollweiß, geölte Eiche, Greige — Ruhe als Statement.',
    claimEn: 'Quiet luxury: wool white, oiled oak, greige — calm as a statement.',
    colorRoles: { wand: 'weiss-4', decke: 'weiss-1', boden: 'creme-8', akzent: 'greige-3', textil: 'creme-5' },
    floor: { materialId: 'parkett-eiche-landhaus', tier: 'premium', pattern: 'landhausdiele', layingDirection: 'laengs', finish: 'natur-geoelt' },
    wall: { materialId: 'wandfarbe-matt', tier: 'premium' },
    accentMetal: 'metall-messing-gebuerstet',
    textile: 'textil-boucle',
  },
  {
    id: 'nordlicht',
    name: '№ 2 · Nordlicht',
    nameEn: 'No. 2 · Northern Light',
    claim: 'Skandinavische Klarheit: Schneeweiß, helle Esche, kühles Grau, viel Luft.',
    claimEn: 'Scandinavian clarity: snow white, pale ash, cool grey, plenty of air.',
    colorRoles: { wand: 'weiss-8', decke: 'weiss-2', boden: 'hellgrau-3', akzent: 'blau-3', textil: 'hellgrau-1' },
    floor: { materialId: 'parkett-esche-schiff', tier: 'premium', pattern: 'schiffsboden', layingDirection: 'laengs', finish: 'weiss-geoelt' },
    wall: { materialId: 'wandfarbe-matt', tier: 'standard' },
    accentMetal: 'metall-nickel',
    textile: 'textil-wolle',
  },
  {
    id: 'goldene-stunde',
    name: '№ 3 · Goldene Stunde',
    nameEn: 'No. 3 · Golden Hour',
    claim: 'Warmes Abendlicht als Raum: Kalkputz, Fischgrät-Eiche, Terrakotta, Messing.',
    claimEn: 'Warm evening light as a room: lime plaster, herringbone oak, terracotta, brass.',
    colorRoles: { wand: 'creme-2', decke: 'weiss-3', boden: 'braun-1', akzent: 'terrakotta-2', textil: 'ocker-4' },
    floor: { materialId: 'parkett-eiche-fischgraet', tier: 'luxus', pattern: 'fischgraet', finish: 'natur-geoelt' },
    wall: { materialId: 'kalkfarbe', tier: 'premium' },
    accentMetal: 'metall-messing-poliert',
    textile: 'textil-samt',
  },
  {
    id: 'tiefe-see',
    name: '№ 4 · Tiefe See',
    nameEn: 'No. 4 · Deep Sea',
    claim: 'Gedecktes Tiefblau mit Nussbaum-Chevron — konzentriert, souverän, abends magisch.',
    claimEn: 'Muted deep blue with walnut chevron — focused, confident, magic at night.',
    colorRoles: { wand: 'blau-4', decke: 'weiss-1', boden: 'braun-3', akzent: 'ocker-2', textil: 'blau-2' },
    floor: { materialId: 'parkett-nussbaum-chevron', tier: 'luxus', pattern: 'chevron' },
    wall: { materialId: 'wandfarbe-matt', tier: 'premium' },
    accentMetal: 'metall-messing-gebuerstet',
    textile: 'textil-samt',
  },
  {
    id: 'salbei-ruhe',
    name: '№ 5 · Salbei-Ruhe',
    nameEn: 'No. 5 · Sage Calm',
    claim: 'Botanische Gelassenheit: Salbeigrün, Leinen, geölte Eiche, mattes Nickel.',
    claimEn: 'Botanical ease: sage green, linen, oiled oak, matte nickel.',
    colorRoles: { wand: 'gruen-2', decke: 'weiss-5', boden: 'creme-8', akzent: 'gruen-6', textil: 'creme-5' },
    floor: { materialId: 'massivdiele-eiche', tier: 'premium', pattern: 'landhausdiele', finish: 'natur-geoelt' },
    wall: { materialId: 'kalkfarbe', tier: 'premium' },
    accentMetal: 'metall-nickel',
    textile: 'textil-leinen',
  },
  {
    id: 'galerie-monochrom',
    name: '№ 6 · Galerie Monochrom',
    nameEn: 'No. 6 · Gallery Monochrome',
    claim: 'Schwarz-Weiß wie im White Cube: Gussboden, Mattschwarz, ein einziger Kontrast.',
    claimEn: 'Black and white like a white cube: poured floor, matte black, one single contrast.',
    colorRoles: { wand: 'weiss-2', decke: 'weiss-2', boden: 'hellgrau-5', akzent: 'schwarz-9', textil: 'grau-2' },
    floor: { materialId: 'gussboden', tier: 'luxus' },
    wall: { materialId: 'wandfarbe-matt', tier: 'premium' },
    accentMetal: 'metall-schwarz-matt',
    textile: 'textil-leder',
  },
  {
    id: 'terra-atelier',
    name: '№ 7 · Terra Atelier',
    nameEn: 'No. 7 · Terra Atelier',
    claim: 'Mediterrane Erdung: Tadelakt, Travertin, Bronze, warmes Leder.',
    claimEn: 'Mediterranean grounding: tadelakt, travertine, bronze, warm leather.',
    colorRoles: { wand: 'greige-1', decke: 'weiss-5', boden: 'creme-3', akzent: 'terrakotta-4', textil: 'braun-9' },
    floor: { materialId: 'naturstein-travertin', tier: 'luxus' },
    wall: { materialId: 'tadelakt', tier: 'luxus' },
    accentMetal: 'metall-bronze',
    textile: 'textil-leder',
  },
  {
    id: 'nachtblau-salon',
    name: '№ 8 · Nachtblau-Salon',
    nameEn: 'No. 8 · Midnight Salon',
    claim: 'Dunkler Salon mit Tiefe: Nachtblau-Schwarz, Samt, Nussbaum, gebürstetes Messing.',
    claimEn: 'A dark salon with depth: midnight black, velvet, walnut, brushed brass.',
    colorRoles: { wand: 'anthrazit-7', decke: 'grau-1', boden: 'braun-3', akzent: 'ocker-10', textil: 'bordeaux-4' },
    floor: { materialId: 'parkett-nussbaum-landhaus', tier: 'luxus', pattern: 'landhausdiele' },
    wall: { materialId: 'wandfarbe-matt', tier: 'premium' },
    accentMetal: 'metall-messing-gebuerstet',
    textile: 'textil-samt',
  },
];

export function findLook(id: string): SignatureLook | undefined {
  return SIGNATURE_LOOKS.find((l) => l.id === id);
}

/**
 * Wendet einen Look auf eine Variante an (mutierend, für updateProject-Draft).
 * Ersetzt NUR Farbrollen sowie Boden-/Wand-Auswahl; alle übrigen Auswahlen
 * (Decke, Möbel, Gewerke, Licht, Notizen) bleiben unangetastet.
 */
export function applyLookToVariant(v: Variant, look: SignatureLook): void {
  v.colorRoles = { ...v.colorRoles, ...look.colorRoles };
  v.materials = v.materials.filter((s) => s.surface !== 'boden' && s.surface !== 'wand');
  v.materials.push({
    id: uid('ms'),
    materialId: look.floor.materialId,
    surface: 'boden',
    tier: look.floor.tier,
    ...(look.floor.pattern ? { pattern: look.floor.pattern } : {}),
    ...(look.floor.layingDirection ? { layingDirection: look.floor.layingDirection } : {}),
    ...(look.floor.finish ? { finish: look.floor.finish } : {}),
  });
  v.materials.push({
    id: uid('ms'),
    materialId: look.wall.materialId,
    surface: 'wand',
    tier: look.wall.tier,
  });
  v.materials.push({ id: uid('ms'), materialId: look.accentMetal, surface: 'sonstiges', tier: 'premium' });
  v.materials.push({ id: uid('ms'), materialId: look.textile, surface: 'sonstiges', tier: 'premium' });
}
