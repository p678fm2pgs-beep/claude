/**
 * HAVEN ATELIER — Kosten-Engine.
 * Exakt, transparent, editierbar. 100% unit-getestet.
 * Grundsatz: RUNDUNG ERST AM ENDE. Domänen-Aufrundung (Gebinde) ist davon ausgenommen.
 */

export type Gewerk =
  | 'boden'
  | 'wand'
  | 'decke'
  | 'maler'
  | 'fliesen'
  | 'sanitaer'
  | 'kueche'
  | 'elektro'
  | 'heizung'
  | 'moebel'
  | 'leuchten'
  | 'nebenposition'
  | 'honorar'
  | 'reserve';

export type PriceTier = 'standard' | 'premium' | 'luxus';

/** Eine Kostenzeile. Beträge als Spanne (min..max); fixe Werte: min===max. */
export interface CostLine {
  id: string;
  label: string;
  gewerk: Gewerk;
  qty: number;
  unit: string;
  unitMin: number; // VK Einzelpreis von
  unitMax: number; // VK Einzelpreis bis
  totalMin: number; // VK Summe von (qty × unitMin)
  totalMax: number; // VK Summe bis
  ekMin?: number; // EK Summe von (Expertenmodus)
  ekMax?: number;
  tier?: PriceTier;
  meta?: Record<string, string | number>;
}

export interface CostRange {
  min: number;
  max: number;
}

export interface RoomCost {
  roomId: string;
  roomName: string;
  lines: CostLine[];
  subtotal: CostRange; // VK netto vor Honorar/Reserve
  ekSubtotal: CostRange;
}

export interface ProjectCost {
  rooms: RoomCost[];
  baseSubtotal: CostRange; // Summe aller Räume (VK)
  fee: CostLine; // Honorar-Position
  reserve: CostLine; // Reserve-Position
  net: CostRange; // baseSubtotal + Honorar + Reserve
  vat: CostRange; // MwSt
  gross: CostRange; // Brutto
  ekTotal: CostRange; // Summe EK (Expertenmodus)
  byGewerk: { gewerk: Gewerk; min: number; max: number }[]; // für Donut
}

// ───────────────────────── Reine Formeln ─────────────────────────

export const VERSCHNITT: Record<string, number> = {
  gerade: 0.05,
  diagonal: 0.1,
  verband: 0.05,
  fischgraet: 0.12,
  chevron: 0.12,
  schiffsboden: 0.05,
  landhausdiele: 0.05,
  wuerfel: 0.1,
  mosaik: 0.12,
  flechtmuster: 0.12,
  grossformat: 0.08,
  fliese: 0.08,
};

/** Bodenkosten: fläche × (1 + Verschnitt) × (Material€ + Arbeit€). */
export function floorCost(
  areaM2: number,
  verschnitt: number,
  materialPerM2: number,
  laborPerM2: number,
): number {
  return areaM2 * (1 + verschnitt) * (materialPerM2 + laborPerM2);
}

/** Auf Gebindegröße aufrunden (z. B. 2,5 L oder 10 L) → Anzahl Gebinde. */
export function gebindeCount(liters: number, gebindeSize: number): number {
  if (gebindeSize <= 0) return 0;
  return Math.ceil(liters / gebindeSize);
}

/** Benötigte Farbliter: fläche × Anstriche ÷ Ergiebigkeit. */
export function paintLiters(areaM2: number, coats: number, coverageM2PerL: number): number {
  if (coverageM2PerL <= 0) return 0;
  return (areaM2 * coats) / coverageM2PerL;
}

/**
 * Wandfarbe/Decke-Anstrich:
 * Liter → Gebinde aufrunden × Literpreis + Malerarbeit €/m².
 * Wählt das günstigste Gebinde-Gemisch aus den angegebenen Größen.
 */
export function paintCost(
  areaM2: number,
  coats: number,
  coverageM2PerL: number,
  pricePerLiter: number,
  laborPerM2: number,
  gebindeSizes: number[] = [10, 2.5],
): { material: number; labor: number; total: number; liters: number } {
  const liters = paintLiters(areaM2, coats, coverageM2PerL);
  // Günstigste Abdeckung aus verfügbaren Gebinden (greedy groß→klein, dann Rest mit kleinstem).
  const sorted = [...gebindeSizes].sort((a, b) => b - a);
  let remaining = liters;
  let purchasedLiters = 0;
  for (let i = 0; i < sorted.length; i++) {
    const size = sorted[i];
    const isSmallest = i === sorted.length - 1;
    if (isSmallest) {
      purchasedLiters += gebindeCount(remaining, size) * size;
      remaining = 0;
    } else {
      const whole = Math.floor(remaining / size);
      purchasedLiters += whole * size;
      remaining -= whole * size;
    }
  }
  const material = purchasedLiters * pricePerLiter;
  const labor = areaM2 * laborPerM2;
  return { material, labor, total: material + labor, liters };
}

/** Flächen-Materialkosten (Wand/Decke ohne Anstrich): fläche × €/m². */
export function areaCost(areaM2: number, pricePerM2: number): number {
  return areaM2 * pricePerM2;
}

/** Möbel: Menge × Spanne (VON–BIS). */
export function furnitureCost(qty: number, vonPerUnit: number, bisPerUnit: number): CostRange {
  return { min: qty * vonPerUnit, max: qty * bisPerUnit };
}

// ───────────────────────── Aggregation ─────────────────────────

export function addRange(a: CostRange, b: CostRange): CostRange {
  return { min: a.min + b.min, max: a.max + b.max };
}

export function emptyRange(): CostRange {
  return { min: 0, max: 0 };
}

export function sumLines(lines: CostLine[]): CostRange {
  return lines.reduce<CostRange>((acc, l) => ({ min: acc.min + l.totalMin, max: acc.max + l.totalMax }), {
    min: 0,
    max: 0,
  });
}

export function sumEk(lines: CostLine[]): CostRange {
  return lines.reduce<CostRange>(
    (acc, l) => ({ min: acc.min + (l.ekMin ?? 0), max: acc.max + (l.ekMax ?? 0) }),
    { min: 0, max: 0 },
  );
}

export interface FeeInput {
  type: 'prozent' | 'pauschal';
  value: number;
}

/** Honorar-Betrag auf eine Basissumme. */
export function feeAmount(base: CostRange, fee: FeeInput): CostRange {
  if (fee.type === 'pauschal') return { min: fee.value, max: fee.value };
  return { min: base.min * (fee.value / 100), max: base.max * (fee.value / 100) };
}

/** Reserve-Betrag (Prozent auf Basis + Honorar). */
export function reserveAmount(base: CostRange, reservePercent: number): CostRange {
  const p = reservePercent / 100;
  return { min: base.min * p, max: base.max * p };
}

/** MwSt auf Netto. */
export function vatAmount(net: CostRange, vatPercent: number): CostRange {
  const p = vatPercent / 100;
  return { min: net.min * p, max: net.max * p };
}

/** Kaufmännische Rundung auf ganze Euro — NUR am Ende. */
export function roundEuro(n: number): number {
  return Math.round(n);
}

export function roundRange(r: CostRange): CostRange {
  return { min: roundEuro(r.min), max: roundEuro(r.max) };
}
