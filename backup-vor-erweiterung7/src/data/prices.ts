/**
 * HAVEN ATELIER — Preis-Parameter (NRW-Richtwerte, Stand 06/2026).
 * Im Expertenmodus editierbar. Beträge in € netto.
 */
import type { PriceTier } from '../types';

export const PRICE_LIST_DATE = '06/2026';

/** Wandfarben-Parameter je Preisstufe. */
export interface PaintPrice {
  literEK: number;
  literVK: number;
  laborVKperM2: number;
  laborEKperM2: number;
}

export const PAINT_PRICES: Record<PriceTier, PaintPrice> = {
  standard: { literEK: 6, literVK: 12, laborVKperM2: 9, laborEKperM2: 5 },
  premium: { literEK: 10, literVK: 19, laborVKperM2: 12, laborEKperM2: 7 },
  luxus: { literEK: 18, literVK: 32, laborVKperM2: 16, laborEKperM2: 9 },
};

export const PAINT_COVERAGE_DEFAULT = 8; // m²/L
export const PAINT_COATS = 2;
export const GEBINDE_SIZES = [10, 2.5]; // L

export const DEFAULT_RESERVE_PERCENT = 10;
export const DEFAULT_FEE_PERCENT = 12;
export const VAT_PERCENT = 19;

/** Pauschale Gewerke-Positionen (z. B. Bad/Küche/Heizung), als VON–BIS VK je Stufe. */
export interface TradePosition {
  id: string;
  name: string;
  nameEn: string;
  gewerk: 'sanitaer' | 'kueche' | 'heizung' | 'elektro';
  unit: string;
  /** [vonVK, bisVK, ekVon, ekBis] je Stufe. */
  prices: Record<PriceTier, [number, number, number, number]>;
  roomTypes: string[]; // wo anwendbar
}

const T = (
  id: string,
  name: string,
  nameEn: string,
  gewerk: TradePosition['gewerk'],
  unit: string,
  roomTypes: string[],
  prices: TradePosition['prices'],
): TradePosition => ({ id, name, nameEn, gewerk, unit, roomTypes, prices });

export const TRADE_POSITIONS: TradePosition[] = [
  // BAD / SANITÄR
  T('wc-wand', 'Wand-WC mit Betätigungsplatte', 'Wall-hung WC', 'sanitaer', 'Stk', ['bad'], {
    standard: [350, 600, 200, 360], premium: [600, 1100, 360, 660], luxus: [1100, 2200, 660, 1320],
  }),
  T('dusch-wc', 'Dusch-WC', 'Shower WC', 'sanitaer', 'Stk', ['bad'], {
    standard: [1200, 2200, 720, 1320], premium: [2200, 3800, 1320, 2280], luxus: [3800, 6500, 2280, 3900],
  }),
  T('waschtisch', 'Waschtisch mit Unterschrank', 'Vanity unit', 'sanitaer', 'Stk', ['bad'], {
    standard: [400, 750, 240, 450], premium: [750, 1500, 450, 900], luxus: [1500, 3500, 900, 2100],
  }),
  T('badewanne-frei', 'Freistehende Badewanne', 'Freestanding bathtub', 'sanitaer', 'Stk', ['bad'], {
    standard: [700, 1300, 420, 780], premium: [1300, 2800, 780, 1680], luxus: [2800, 6000, 1680, 3600],
  }),
  T('dusche-ebenerdig', 'Bodengleiche Dusche', 'Walk-in shower', 'sanitaer', 'Stk', ['bad'], {
    standard: [900, 1700, 540, 1020], premium: [1700, 3200, 1020, 1920], luxus: [3200, 6500, 1920, 3900],
  }),
  T('armatur-bad', 'Armaturen-Set Bad', 'Bathroom fittings set', 'sanitaer', 'Stk', ['bad'], {
    standard: [250, 480, 150, 288], premium: [480, 950, 288, 570], luxus: [950, 2200, 570, 1320],
  }),
  T('sanitaer-installation', 'Sanitärinstallation', 'Plumbing installation', 'sanitaer', 'Psch', ['bad', 'kueche'], {
    standard: [1500, 2800, 1100, 2000], premium: [2800, 4500, 2000, 3200], luxus: [4500, 7500, 3200, 5400],
  }),
  // KÜCHE
  T('kueche-fronten', 'Küchenfronten', 'Kitchen fronts', 'kueche', 'lfm', ['kueche'], {
    standard: [350, 650, 220, 400], premium: [650, 1200, 400, 740], luxus: [1200, 2400, 740, 1480],
  }),
  T('kueche-arbeitsplatte', 'Arbeitsplatte', 'Worktop', 'kueche', 'lfm', ['kueche'], {
    standard: [150, 290, 95, 180], premium: [290, 600, 180, 380], luxus: [600, 1400, 380, 880],
  }),
  T('kueche-rueckwand', 'Küchenrückwand', 'Splashback', 'kueche', 'lfm', ['kueche'], {
    standard: [80, 160, 50, 100], premium: [160, 340, 100, 210], luxus: [340, 700, 210, 440],
  }),
  T('kueche-spuele-armatur', 'Spüle & Armatur', 'Sink & tap', 'kueche', 'Stk', ['kueche'], {
    standard: [180, 360, 110, 220], premium: [360, 720, 220, 440], luxus: [720, 1600, 440, 960],
  }),
  T('kueche-geraete', 'Geräte-Set (ohne Marke)', 'Appliance set', 'kueche', 'Set', ['kueche'], {
    standard: [2500, 4500, 1800, 3200], premium: [4500, 8500, 3200, 6000], luxus: [8500, 18000, 6000, 12000],
  }),
  T('kueche-montage', 'Montage & Anschlüsse Küche', 'Kitchen assembly & connections', 'kueche', 'Psch', ['kueche'], {
    standard: [800, 1500, 600, 1100], premium: [1500, 2500, 1100, 1800], luxus: [2500, 4500, 1800, 3200],
  }),
  // HEIZUNG / TECHNIK
  T('fbh', 'Fußbodenheizung (Warmwasser)', 'Underfloor heating (hydronic)', 'heizung', 'm²', ['wohnzimmer', 'esszimmer', 'schlafzimmer', 'kueche', 'bad', 'arbeitszimmer', 'flur', 'kinderzimmer', 'ankleide'], {
    standard: [45, 80, 30, 56], premium: [70, 120, 48, 84], luxus: [110, 180, 76, 126],
  }),
  T('heizkoerper-design', 'Designheizkörper', 'Design radiator', 'heizung', 'Stk', ['wohnzimmer', 'schlafzimmer', 'bad', 'arbeitszimmer'], {
    standard: [250, 480, 150, 290], premium: [480, 900, 290, 540], luxus: [900, 1800, 540, 1080],
  }),
  T('handtuchheizkoerper', 'Handtuchheizkörper', 'Towel radiator', 'heizung', 'Stk', ['bad'], {
    standard: [180, 350, 110, 210], premium: [350, 650, 210, 390], luxus: [650, 1300, 390, 780],
  }),
  // SMART-HOME / ELEKTRO
  T('smart-licht', 'Smart-Lichtsteuerung', 'Smart lighting control', 'elektro', 'Raum', ['wohnzimmer', 'esszimmer', 'schlafzimmer', 'kueche', 'bad', 'arbeitszimmer', 'flur', 'kinderzimmer', 'ankleide'], {
    standard: [350, 650, 220, 410], premium: [650, 1300, 410, 820], luxus: [1300, 2800, 820, 1680],
  }),
  T('smart-beschattung', 'Smart-Beschattung', 'Smart shading', 'elektro', 'Fenster', ['wohnzimmer', 'esszimmer', 'schlafzimmer', 'arbeitszimmer', 'kinderzimmer'], {
    standard: [250, 480, 150, 290], premium: [480, 900, 290, 540], luxus: [900, 1700, 540, 1020],
  }),
];

export function tradesForRoom(roomType: string): TradePosition[] {
  return TRADE_POSITIONS.filter((t) => t.roomTypes.includes(roomType));
}

export function findTrade(id: string): TradePosition | undefined {
  return TRADE_POSITIONS.find((t) => t.id === id);
}
