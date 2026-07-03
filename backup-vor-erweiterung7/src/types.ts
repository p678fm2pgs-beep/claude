/**
 * HAVEN ATELIER — Typisiertes Datenmodell.
 * Daten strikt von UI getrennt. `schemaVersion` ermöglicht Migrationen.
 * Maße intern in Zentimetern, Flächen werden live abgeleitet (nie persistiert).
 */

export const SCHEMA_VERSION = 3 as const;

export type Lang = 'de' | 'en';
export type AppMode = 'beratung' | 'experte' | 'praesentation';

export type Untertone = 'warm' | 'kuehl' | 'neutral';

export type RoomType =
  | 'wohnzimmer'
  | 'esszimmer'
  | 'schlafzimmer'
  | 'kueche'
  | 'bad'
  | 'arbeitszimmer'
  | 'flur'
  | 'kinderzimmer'
  | 'ankleide'
  | 'aussen';

export type Orientation = 'N' | 'NO' | 'O' | 'SO' | 'S' | 'SW' | 'W' | 'NW';
export type Daylight = 'wenig' | 'mittel' | 'viel';
export type PriceTier = 'standard' | 'premium' | 'luxus';
export type ColorRole = 'wand' | 'decke' | 'boden' | 'akzent' | 'textil';

/** Ein Punkt im Grundriss in Zentimetern. */
export interface Point {
  x: number;
  y: number;
}

export type OpeningKind = 'fenster' | 'tuer';

/** Öffnung auf einer Wand (Wand = Kante zwischen Polygonpunkt i und i+1). */
export interface Opening {
  id: string;
  kind: OpeningKind;
  wallIndex: number;
  /** Versatz vom Wandanfang in cm. */
  offsetCm: number;
  widthCm: number;
  heightCm: number;
  /** Brüstungshöhe in cm (nur Fenster sinnvoll). */
  sillCm: number;
  /** (Erweiterung 4, optional) Rahmenfarbe als HEX, z. B. schwarze Fensterrahmen. */
  frameColor?: string;
}

// ── Erweiterung 4: Zwei-Ebenen-Logik (alle Felder optional → Altdaten bleiben gültig) ──

/** Verlegemuster (Ebene 2). */
export type LayingPattern =
  | 'gerade'
  | 'diagonal'
  | 'verband'
  | 'fischgraet'
  | 'chevron'
  | 'schiffsboden'
  | 'landhausdiele'
  | 'wuerfel'
  | 'mosaik'
  | 'flechtmuster';

/** Verlegerichtung (Ebene 2). */
export type LayingDirection = 'laengs' | 'quer' | 'diagonal';

/** Oberfläche/Finish (Ebene 2, Holzböden). */
export type Finish =
  | 'natur-geoelt'
  | 'weiss-geoelt'
  | 'matt-lackiert'
  | 'seidenmatt'
  | 'geraeuchert'
  | 'gebuerstet'
  | 'gekaelkt'
  | 'dunkel-gebeizt'
  | 'rustikal'
  | 'handgehobelt'
  | 'gebeizt-grau';

export interface Floorplan {
  /** Polygon-Eckpunkte in cm, im Uhrzeigersinn oder gegen. */
  points: Point[];
  openings: Opening[];
}

export interface Light {
  orientation: Orientation;
  daylight: Daylight;
}

/** Eine gewählte Material-Position innerhalb einer Variante. */
export interface MaterialSelection {
  id: string;
  /** Verweis auf Katalog-Material. */
  materialId: string;
  /** Wo eingesetzt: boden | wand | decke | sonstiges. */
  surface: 'boden' | 'wand' | 'decke' | 'sonstiges';
  tier: PriceTier;
  /** Optionale Zuordnung zu einer Wand (Index) für getrennte Wandmaterialien. */
  wallIndex?: number;
  /** Verlegemuster (nur Boden) — beeinflusst Verschnitt & 2D-Darstellung. */
  pattern?: LayingPattern;
  /** (Erweiterung 4, optional) Verlegerichtung. */
  layingDirection?: LayingDirection;
  /** (Erweiterung 4, optional) Holzart als Variante (z. B. 'eiche-geraeuchert'). */
  woodSpecies?: string;
  /** (Erweiterung 4, optional) Oberfläche/Finish. */
  finish?: Finish;
  /** (Erweiterung 4, optional) Fliesenformat, z. B. '60x120'. */
  format?: string;
  /** (Erweiterung 4, optional) Fugenfarbe als HEX (Fliesen). */
  groutColor?: string;
  /** Aktive Nebenpositionen (default alle an). Map id->aktiv. */
  addonsDisabled?: string[];
}

export interface FurnitureItem {
  id: string;
  /** Verweis auf Katalog-Möbeltyp. */
  typeId: string;
  label: string;
  tier: PriceTier;
  quantity: number;
  unit: string;
}

export interface LightingScene {
  id: string;
  name: string;
  /** Lichttemperatur in Kelvin. */
  kelvin: number;
  dimmable: boolean;
  types: string[];
}

/** Gewerke-Position (Bad/Küche/Heizung/Smart-Home) innerhalb einer Variante. */
export interface TradeSelection {
  id: string;
  tradeId: string;
  tier: PriceTier;
  quantity: number;
}

/** (Erweiterung 4, optional) Platzierte/zugewiesene Beleuchtungs-Position. */
export interface LightSelection {
  id: string;
  /** Verweis auf Beleuchtungs-Katalog. */
  fixtureId: string;
  tier: PriceTier;
  quantity: number;
  /** Lichtfarbe in Kelvin (z. B. 2700). */
  kelvin?: number;
  /** Profil-Art für indirektes Licht (z. B. 'vouten-profil'). */
  profile?: string;
  /** Für umlaufende Voute: an welchen Wänden (Indizes) der Lichtsaum sitzt. */
  wallIndices?: number[];
}

export interface Variant {
  id: string;
  name: string;
  colorRoles: Partial<Record<ColorRole, string>>; // role -> colorToneId
  /** (Erweiterung 4, optional) Farbe je einzelner Wand: wallIndex -> colorToneId. */
  wallColors?: Record<number, string>;
  /** (Erweiterung 4, optional) Beleuchtungs-Positionen. */
  lights?: LightSelection[];
  materials: MaterialSelection[];
  furniture: FurnitureItem[];
  trades: TradeSelection[];
  lighting: LightingScene[];
  notes: string;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  floorplan: Floorplan;
  heightCm: number;
  light: Light;
  stylePreset?: string;
  variants: Variant[];
  activeVariantId: string;
}

export interface FeeSettings {
  type: 'prozent' | 'pauschal';
  value: number;
}

export interface ProjectSettings {
  reservePercent: number; // 0..30
  fee: FeeSettings;
  vatPercent: number; // 19
  /** Anstriche-Ergiebigkeit m²/L (editierbar, Standard 8). */
  paintCoverage: number;
}

export interface Project {
  id: string;
  schemaVersion: number;
  name: string;
  customer?: string;
  address?: string;
  created: number;
  modified: number;
  priceListDate: string; // "MM/JJJJ"
  rooms: Room[];
  settings: ProjectSettings;
}

/** Editierbares Preislisten-Overlay (Expertenmodus). */
export interface PriceOverrides {
  [key: string]: number;
}
