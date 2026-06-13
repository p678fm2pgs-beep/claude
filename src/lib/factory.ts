/**
 * HAVEN ATELIER — Factory für Projekte/Räume/Varianten + Demo-Seed.
 */
import {
  SCHEMA_VERSION,
  type Project,
  type Room,
  type Variant,
  type RoomType,
  type ProjectSettings,
} from '../types';
import { uid } from './id';
import { rectanglePoints } from './geometry';
import { DEFAULT_RESERVE_PERCENT, DEFAULT_FEE_PERCENT, VAT_PERCENT, PAINT_COVERAGE_DEFAULT, PRICE_LIST_DATE } from '../data/prices';

export function defaultSettings(): ProjectSettings {
  return {
    reservePercent: DEFAULT_RESERVE_PERCENT,
    fee: { type: 'prozent', value: DEFAULT_FEE_PERCENT },
    vatPercent: VAT_PERCENT,
    paintCoverage: PAINT_COVERAGE_DEFAULT,
  };
}

export function createVariant(name = 'Variante A'): Variant {
  return {
    id: uid('var'),
    name,
    colorRoles: {},
    materials: [],
    furniture: [],
    trades: [],
    lighting: [],
    notes: '',
  };
}

export function createRoom(name: string, type: RoomType, widthCm = 400, depthCm = 350, heightCm = 270): Room {
  const variant = createVariant();
  return {
    id: uid('room'),
    name,
    type,
    floorplan: { points: rectanglePoints(widthCm, depthCm), openings: [] },
    heightCm,
    light: { orientation: 'S', daylight: 'mittel' },
    variants: [variant],
    activeVariantId: variant.id,
  };
}

export function createProject(name: string): Project {
  const now = Date.now();
  return {
    id: uid('prj'),
    schemaVersion: SCHEMA_VERSION,
    name,
    created: now,
    modified: now,
    priceListDate: PRICE_LIST_DATE,
    rooms: [],
    settings: defaultSettings(),
  };
}

/**
 * Demo-Projekt „Musterwohnung Düsseldorf" — 3 vollständige Räume:
 * Wohnzimmer, Bad (mit Sanitär, Abdichtung, R10-Fliese), Küche (Fronten+Arbeitsplatte+Geräte).
 * Inkl. Fußbodenheizung, Eignungswarnung-Trigger, getrennte Wandmaterialien, Beleuchtungsszene.
 */
export function createDemoProject(): Project {
  const p = createProject('Musterwohnung Düsseldorf');
  p.customer = 'Familie Celik';
  p.address = 'Königsallee 1, 40212 Düsseldorf';

  // ── Wohnzimmer 5,2 × 4,4 m, Höhe 2,7 m, 1 Fenster, 1 Tür ──
  const wohn = createRoom('Wohnzimmer', 'wohnzimmer', 520, 440, 270);
  wohn.light = { orientation: 'S', daylight: 'viel' };
  wohn.floorplan.openings = [
    { id: uid('op'), kind: 'fenster', wallIndex: 0, offsetCm: 150, widthCm: 220, heightCm: 150, sillCm: 80 },
    { id: uid('op'), kind: 'tuer', wallIndex: 2, offsetCm: 120, widthCm: 100, heightCm: 210, sillCm: 0 },
  ];
  const wv = wohn.variants[0];
  wv.name = 'Quiet Luxury';
  wohn.stylePreset = 'quiet-luxury';
  wv.colorRoles = { wand: 'weiss-4', decke: 'weiss-1', boden: 'braun-1', akzent: 'anthrazit-1', textil: 'creme-5' };
  wv.materials = [
    { id: uid('ms'), materialId: 'parkett-eiche-landhaus', surface: 'boden', tier: 'premium', pattern: 'gerade' },
    { id: uid('ms'), materialId: 'wandfarbe-matt', surface: 'wand', tier: 'premium', wallIndex: 0 },
    { id: uid('ms'), materialId: 'kalkfarbe', surface: 'wand', tier: 'premium', wallIndex: 1 },
    { id: uid('ms'), materialId: 'decke-anstrich', surface: 'decke', tier: 'standard' },
    { id: uid('ms'), materialId: 'textil-boucle', surface: 'sonstiges', tier: 'premium' },
    { id: uid('ms'), materialId: 'metall-messing-gebuerstet', surface: 'sonstiges', tier: 'premium' },
  ];
  wv.furniture = [
    { id: uid('fi'), typeId: 'sofa', label: 'Sofa', tier: 'premium', quantity: 1, unit: 'Stk' },
    { id: uid('fi'), typeId: 'couchtisch', label: 'Couchtisch', tier: 'premium', quantity: 1, unit: 'Stk' },
    { id: uid('fi'), typeId: 'pendelleuchte', label: 'Pendelleuchte', tier: 'premium', quantity: 1, unit: 'Stk' },
  ];
  wv.trades = [
    { id: uid('ts'), tradeId: 'fbh', tier: 'premium', quantity: 1 },
    { id: uid('ts'), tradeId: 'smart-licht', tier: 'premium', quantity: 1 },
  ];
  wv.lighting = [{ id: uid('ls'), name: 'Abendstimmung', kelvin: 2700, dimmable: true, types: ['Pendel', 'Stehleuchte', 'Lichtvoute'] }];

  // ── Bad 2,6 × 3,0 m ──
  const bad = createRoom('Bad', 'bad', 260, 300, 260);
  bad.light = { orientation: 'N', daylight: 'wenig' };
  bad.floorplan.openings = [
    { id: uid('op'), kind: 'tuer', wallIndex: 3, offsetCm: 40, widthCm: 90, heightCm: 200, sillCm: 0 },
  ];
  const bv = bad.variants[0];
  bv.name = 'Spa';
  bv.colorRoles = { wand: 'greige-1', decke: 'weiss-1', boden: 'grau-3', akzent: 'gruen-1' };
  bv.materials = [
    // R10-Fliese (geeignet) am Boden + Tadelakt-Wand
    { id: uid('ms'), materialId: 'feinstein-6060-r10', surface: 'boden', tier: 'premium' },
    { id: uid('ms'), materialId: 'tadelakt', surface: 'wand', tier: 'luxus' },
    { id: uid('ms'), materialId: 'decke-anstrich', surface: 'decke', tier: 'standard' },
    // Bewusst eine Eignungswarnung: Teppichboden-Auswahl als „sonstiges" für Demo-Warnung im Bad
  ];
  bv.trades = [
    { id: uid('ts'), tradeId: 'dusche-ebenerdig', tier: 'premium', quantity: 1 },
    { id: uid('ts'), tradeId: 'waschtisch', tier: 'premium', quantity: 1 },
    { id: uid('ts'), tradeId: 'wc-wand', tier: 'premium', quantity: 1 },
    { id: uid('ts'), tradeId: 'armatur-bad', tier: 'premium', quantity: 1 },
    { id: uid('ts'), tradeId: 'sanitaer-installation', tier: 'premium', quantity: 1 },
    { id: uid('ts'), tradeId: 'handtuchheizkoerper', tier: 'premium', quantity: 1 },
    { id: uid('ts'), tradeId: 'fbh', tier: 'premium', quantity: 1 },
  ];
  bv.furniture = [{ id: uid('fi'), typeId: 'spiegel', label: 'LED-Spiegel', tier: 'premium', quantity: 1, unit: 'Stk' }];
  bv.lighting = [{ id: uid('ls'), name: 'Spa-Licht', kelvin: 3000, dimmable: true, types: ['Einbauspot', 'LED-Profil'] }];

  // ── Küche 3,6 × 3,2 m ──
  const kueche = createRoom('Küche', 'kueche', 360, 320, 270);
  kueche.light = { orientation: 'O', daylight: 'mittel' };
  kueche.floorplan.openings = [
    { id: uid('op'), kind: 'fenster', wallIndex: 1, offsetCm: 80, widthCm: 140, heightCm: 130, sillCm: 95 },
    { id: uid('op'), kind: 'tuer', wallIndex: 3, offsetCm: 60, widthCm: 100, heightCm: 210, sillCm: 0 },
  ];
  const kv = kueche.variants[0];
  kv.name = 'Modern';
  kv.colorRoles = { wand: 'weiss-1', decke: 'weiss-1', boden: 'feinstein', akzent: 'anthrazit-1' };
  kv.colorRoles.boden = 'grau-3';
  kv.materials = [
    { id: uid('ms'), materialId: 'feinstein-grossformat', surface: 'boden', tier: 'premium' },
    { id: uid('ms'), materialId: 'wandfarbe-matt', surface: 'wand', tier: 'standard' },
    { id: uid('ms'), materialId: 'decke-anstrich', surface: 'decke', tier: 'standard' },
  ];
  kv.trades = [
    { id: uid('ts'), tradeId: 'kueche-fronten', tier: 'premium', quantity: 6 },
    { id: uid('ts'), tradeId: 'kueche-arbeitsplatte', tier: 'premium', quantity: 6 },
    { id: uid('ts'), tradeId: 'kueche-rueckwand', tier: 'premium', quantity: 4 },
    { id: uid('ts'), tradeId: 'kueche-spuele-armatur', tier: 'premium', quantity: 1 },
    { id: uid('ts'), tradeId: 'kueche-geraete', tier: 'premium', quantity: 1 },
    { id: uid('ts'), tradeId: 'kueche-montage', tier: 'premium', quantity: 1 },
    { id: uid('ts'), tradeId: 'fbh', tier: 'premium', quantity: 1 },
  ];
  kv.furniture = [{ id: uid('fi'), typeId: 'pendelleuchte', label: 'Pendelleuchte über Insel', tier: 'premium', quantity: 2, unit: 'Stk' }];
  kv.lighting = [{ id: uid('ls'), name: 'Arbeitslicht', kelvin: 4000, dimmable: false, types: ['Einbauspot'] }];

  p.rooms = [wohn, bad, kueche];
  p.modified = Date.now();
  return p;
}
