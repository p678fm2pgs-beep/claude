/**
 * HAVEN ATELIER — Möbel & Leuchten (Modul 10 / Erweiterung J).
 * Ohne Markennamen. Je Raumtyp passende Vorschlagsliste.
 * Preisklassen Standard/Premium/Luxus als VON–BIS-Spanne (VK).
 */
import type { PriceTier, RoomType } from '../types';

export interface FurnitureType {
  id: string;
  name: string;
  nameEn: string;
  styleTag: string;
  unit: string;
  defaultQty: number;
  /** [von, bis] VK je Einheit. */
  price: Record<PriceTier, [number, number]>;
  rooms: RoomType[];
}

const F = (
  id: string,
  name: string,
  nameEn: string,
  styleTag: string,
  unit: string,
  defaultQty: number,
  rooms: RoomType[],
  price: FurnitureType['price'],
): FurnitureType => ({ id, name, nameEn, styleTag, unit, defaultQty, rooms, price });

export const FURNITURE_TYPES: FurnitureType[] = [
  F('sofa', 'Sofa', 'Sofa', 'Quiet Luxury', 'Stk', 1, ['wohnzimmer'], {
    standard: [800, 1800], premium: [1800, 4500], luxus: [4500, 12000],
  }),
  F('sessel', 'Sessel', 'Armchair', 'Quiet Luxury', 'Stk', 2, ['wohnzimmer', 'schlafzimmer', 'arbeitszimmer'], {
    standard: [300, 700], premium: [700, 1800], luxus: [1800, 5000],
  }),
  F('couchtisch', 'Couchtisch', 'Coffee Table', 'Modern Minimal', 'Stk', 1, ['wohnzimmer'], {
    standard: [200, 500], premium: [500, 1400], luxus: [1400, 4000],
  }),
  F('esstisch', 'Esstisch', 'Dining Table', 'Klassisch-Elegant', 'Stk', 1, ['esszimmer', 'kueche'], {
    standard: [500, 1200], premium: [1200, 3500], luxus: [3500, 9000],
  }),
  F('stuhl', 'Esszimmerstuhl', 'Dining Chair', 'Klassisch-Elegant', 'Stk', 6, ['esszimmer', 'kueche'], {
    standard: [120, 300], premium: [300, 700], luxus: [700, 1800],
  }),
  F('bett', 'Bett', 'Bed', 'Quiet Luxury', 'Stk', 1, ['schlafzimmer', 'kinderzimmer'], {
    standard: [600, 1500], premium: [1500, 4000], luxus: [4000, 11000],
  }),
  F('nachttisch', 'Nachttisch', 'Nightstand', 'Modern Minimal', 'Stk', 2, ['schlafzimmer'], {
    standard: [120, 300], premium: [300, 800], luxus: [800, 2200],
  }),
  F('schrank', 'Kleiderschrank / Schranksystem', 'Wardrobe', 'Modern Minimal', 'lfm', 3, ['schlafzimmer', 'ankleide'], {
    standard: [400, 900], premium: [900, 2200], luxus: [2200, 6000],
  }),
  F('sideboard', 'Sideboard', 'Sideboard', 'Klassisch-Elegant', 'Stk', 1, ['wohnzimmer', 'esszimmer', 'flur'], {
    standard: [350, 800], premium: [800, 2200], luxus: [2200, 6500],
  }),
  F('teppich', 'Teppich', 'Rug', 'Japandi', 'Stk', 1, ['wohnzimmer', 'schlafzimmer', 'esszimmer', 'kinderzimmer'], {
    standard: [200, 600], premium: [600, 2000], luxus: [2000, 8000],
  }),
  F('pendelleuchte', 'Pendelleuchte', 'Pendant Light', 'Modern Minimal', 'Stk', 1, ['wohnzimmer', 'esszimmer', 'kueche', 'schlafzimmer', 'flur'], {
    standard: [150, 400], premium: [400, 1200], luxus: [1200, 4500],
  }),
  F('stehleuchte', 'Stehleuchte', 'Floor Lamp', 'Quiet Luxury', 'Stk', 1, ['wohnzimmer', 'arbeitszimmer', 'schlafzimmer'], {
    standard: [120, 350], premium: [350, 900], luxus: [900, 3000],
  }),
  F('wandleuchte', 'Wandleuchte', 'Wall Light', 'Modern Minimal', 'Stk', 2, ['wohnzimmer', 'schlafzimmer', 'flur', 'bad'], {
    standard: [80, 220], premium: [220, 600], luxus: [600, 1800],
  }),
  F('vorhang', 'Vorhänge', 'Curtains', 'Klassisch-Elegant', 'lfm', 4, ['wohnzimmer', 'schlafzimmer', 'esszimmer', 'arbeitszimmer', 'kinderzimmer'], {
    standard: [60, 150], premium: [150, 400], luxus: [400, 1200],
  }),
  F('spiegel', 'Spiegel', 'Mirror', 'Quiet Luxury', 'Stk', 1, ['flur', 'schlafzimmer', 'bad', 'ankleide'], {
    standard: [100, 280], premium: [280, 700], luxus: [700, 2200],
  }),
  F('schreibtisch', 'Schreibtisch', 'Desk', 'Modern Minimal', 'Stk', 1, ['arbeitszimmer', 'kinderzimmer'], {
    standard: [250, 600], premium: [600, 1500], luxus: [1500, 4000],
  }),
  F('aussenmoebel', 'Außenmöbel-Set', 'Outdoor Furniture Set', 'Mediterran', 'Set', 1, ['aussen'], {
    standard: [600, 1500], premium: [1500, 4000], luxus: [4000, 12000],
  }),
  F('garderobe', 'Garderobe', 'Coat Rack / Wardrobe', 'Modern Minimal', 'Stk', 1, ['flur'], {
    standard: [150, 400], premium: [400, 1000], luxus: [1000, 3000],
  }),
];

export function furnitureForRoom(roomType: RoomType): FurnitureType[] {
  return FURNITURE_TYPES.filter((f) => f.rooms.includes(roomType));
}

export function findFurnitureType(id: string): FurnitureType | undefined {
  return FURNITURE_TYPES.find((f) => f.id === id);
}
