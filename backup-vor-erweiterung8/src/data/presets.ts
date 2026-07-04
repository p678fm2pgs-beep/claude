/**
 * HAVEN ATELIER — Stil-Presets (Modul 11).
 * Jedes Preset setzt Vorschlags-Palette, Kern-Materialien und Möbel-Stil-Tag.
 * Nichts ist Pflicht — ein Klick befüllt sinnvoll.
 */
import type { ColorRole } from '../types';

export interface StylePreset {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  /** Farbrollen → Ton-ID. */
  colorRoles: Partial<Record<ColorRole, string>>;
  /** Kern-Material-IDs. */
  materialIds: string[];
  furnitureStyleTag: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'quiet-luxury',
    name: 'Quiet Luxury',
    nameEn: 'Quiet Luxury',
    description: 'Zurückhaltender Luxus: Wollweiß, Anthrazit, Eiche, Messing.',
    descriptionEn: 'Understated luxury: wool white, anthracite, oak, brass.',
    colorRoles: { wand: 'weiss-4', decke: 'weiss-1', boden: 'braun-1', akzent: 'anthrazit-1', textil: 'creme-5' },
    materialIds: ['parkett-eiche-landhaus', 'wandfarbe-matt', 'decke-anstrich', 'textil-boucle', 'metall-messing-gebuerstet'],
    furnitureStyleTag: 'Quiet Luxury',
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    nameEn: 'Modern Minimal',
    description: 'Klar, grafisch, monochrom: Reinweiß, Grau, Mikrozement.',
    descriptionEn: 'Clear, graphic, monochrome: pure white, grey, microcement.',
    colorRoles: { wand: 'weiss-1', decke: 'weiss-8', boden: 'grau-3', akzent: 'anthrazit-1', textil: 'grau-1' },
    materialIds: ['mikrozement-boden', 'wandfarbe-matt', 'decke-anstrich', 'textil-wolle', 'metall-schwarz-matt'],
    furnitureStyleTag: 'Modern Minimal',
  },
  {
    id: 'mediterran',
    name: 'Mediterran',
    nameEn: 'Mediterranean',
    description: 'Sonnig-warm: Creme, Terrakotta, Salbei, Travertin, Kalkputz.',
    descriptionEn: 'Sunny warm: cream, terracotta, sage, travertine, lime plaster.',
    colorRoles: { wand: 'creme-5', decke: 'weiss-3', boden: 'terrakotta-1', akzent: 'gruen-1', textil: 'creme-1' },
    materialIds: ['naturstein-travertin', 'kalkfarbe', 'decke-anstrich', 'textil-leinen', 'metall-bronze'],
    furnitureStyleTag: 'Mediterran',
  },
  {
    id: 'japandi',
    name: 'Japandi',
    nameEn: 'Japandi',
    description: 'Ruhe & Erde: Greige, Anthrazit, geräucherte Eiche, Leinen.',
    descriptionEn: 'Calm & earth: greige, anthracite, smoked oak, linen.',
    colorRoles: { wand: 'greige-2', decke: 'weiss-2', boden: 'braun-3', akzent: 'anthrazit-3', textil: 'creme-8' },
    materialIds: ['parkett-eiche-fischgraet', 'kalkfarbe', 'holz-lamellen', 'textil-leinen', 'metall-schwarz-matt'],
    furnitureStyleTag: 'Japandi',
  },
  {
    id: 'klassisch-elegant',
    name: 'Klassisch-Elegant',
    nameEn: 'Classic Elegant',
    description: 'Zeitlos: Altweiß, Bordeaux, Marmor, Stuck, Samt.',
    descriptionEn: 'Timeless: old white, bordeaux, marble, stucco, velvet.',
    colorRoles: { wand: 'weiss-5', decke: 'weiss-1', boden: 'braun-3', akzent: 'bordeaux-1', textil: 'gruen-3' },
    materialIds: ['naturstein-marmor', 'spachtel-veneziano', 'decke-stuck', 'textil-samt', 'metall-messing-poliert'],
    furnitureStyleTag: 'Klassisch-Elegant',
  },
];

export function findPreset(id: string | undefined): StylePreset | undefined {
  if (!id) return undefined;
  return STYLE_PRESETS.find((p) => p.id === id);
}
