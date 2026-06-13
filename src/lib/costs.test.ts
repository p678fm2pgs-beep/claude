import { describe, it, expect } from 'vitest';
import {
  floorCost,
  gebindeCount,
  paintLiters,
  paintCost,
  areaCost,
  furnitureCost,
  feeAmount,
  reserveAmount,
  vatAmount,
  addRange,
  sumLines,
  roundEuro,
  type CostLine,
} from './costs';

describe('Kosten-Engine — Grundformeln', () => {
  it('Boden: fläche × (1 + Verschnitt) × (Material + Arbeit)', () => {
    // 20 m², 5% Verschnitt, 50 €/m² Material, 30 €/m² Arbeit
    expect(floorCost(20, 0.05, 50, 30)).toBeCloseTo(20 * 1.05 * 80, 6);
    expect(floorCost(20, 0.05, 50, 30)).toBeCloseTo(1680, 6);
  });

  it('Fischgrät-Verschnitt 12% liegt über geradem 5%', () => {
    expect(floorCost(20, 0.12, 50, 30)).toBeGreaterThan(floorCost(20, 0.05, 50, 30));
  });

  it('Gebinde-Aufrundung rundet auf ganze Gebinde auf', () => {
    expect(gebindeCount(0.1, 2.5)).toBe(1);
    expect(gebindeCount(2.5, 2.5)).toBe(1);
    expect(gebindeCount(2.6, 2.5)).toBe(2);
    expect(gebindeCount(11, 10)).toBe(2);
    expect(gebindeCount(0, 10)).toBe(0);
  });

  it('Anstrich-Liter: fläche × Anstriche ÷ Ergiebigkeit', () => {
    // 40 m², 2 Anstriche, 8 m²/L → 10 L
    expect(paintLiters(40, 2, 8)).toBeCloseTo(10, 6);
  });

  it('paintLiters bei Ergiebigkeit 0 ist 0 (kein NaN)', () => {
    expect(paintLiters(40, 2, 0)).toBe(0);
  });

  it('Wandfarbe: 2 Anstriche, Gebinde-Aufrundung, + Malerarbeit', () => {
    // 40 m² → 10 L benötigt. Gebinde 10 L → 1×10 L. Literpreis 12 → 120 Material.
    // Arbeit 9 €/m² × 40 = 360. Total 480.
    const r = paintCost(40, 2, 8, 12, 9, [10, 2.5]);
    expect(r.liters).toBeCloseTo(10, 6);
    expect(r.material).toBeCloseTo(120, 6);
    expect(r.labor).toBeCloseTo(360, 6);
    expect(r.total).toBeCloseTo(480, 6);
  });

  it('Wandfarbe wählt günstige Gebinde-Mischung (10L + 2,5L)', () => {
    // 50 m² → 12,5 L. 1×10 + 1×2,5 = 12,5 L gekauft.
    const r = paintCost(50, 2, 8, 10, 0, [10, 2.5]);
    expect(r.liters).toBeCloseTo(12.5, 6);
    expect(r.material).toBeCloseTo(12.5 * 10, 6);
  });

  it('areaCost: fläche × €/m²', () => {
    expect(areaCost(25, 40)).toBe(1000);
  });

  it('Möbel-Spanne: Menge × VON–BIS', () => {
    expect(furnitureCost(6, 120, 300)).toEqual({ min: 720, max: 1800 });
  });
});

describe('Kosten-Engine — Honorar, Reserve, MwSt', () => {
  const base = { min: 10000, max: 10000 };

  it('Honorar prozentual', () => {
    expect(feeAmount(base, { type: 'prozent', value: 12 })).toEqual({ min: 1200, max: 1200 });
  });

  it('Honorar pauschal', () => {
    expect(feeAmount(base, { type: 'pauschal', value: 2500 })).toEqual({ min: 2500, max: 2500 });
  });

  it('Reserve 0 / 10 / 30 %', () => {
    expect(reserveAmount(base, 0)).toEqual({ min: 0, max: 0 });
    expect(reserveAmount(base, 10)).toEqual({ min: 1000, max: 1000 });
    expect(reserveAmount(base, 30)).toEqual({ min: 3000, max: 3000 });
  });

  it('MwSt 19 %', () => {
    expect(vatAmount(base, 19)).toEqual({ min: 1900, max: 1900 });
  });

  it('Kette: Basis → +Honorar → +Reserve → Netto → +MwSt → Brutto; Brutto > Netto', () => {
    const fee = feeAmount(base, { type: 'prozent', value: 12 }); // 1200
    const baseFee = addRange(base, fee); // 11200
    const reserve = reserveAmount(baseFee, 10); // 1120
    const net = addRange(baseFee, reserve); // 12320
    const vat = vatAmount(net, 19); // 2340.8
    const gross = addRange(net, vat);
    expect(net.min).toBeCloseTo(12320, 6);
    expect(gross.min).toBeCloseTo(12320 * 1.19, 4);
    expect(gross.min).toBeGreaterThan(net.min);
  });

  it('Rundung erst am Ende — kaufmännisch', () => {
    expect(roundEuro(12320.49)).toBe(12320);
    expect(roundEuro(12320.5)).toBe(12321);
  });

  it('Spannen-Summe über mehrere Zeilen', () => {
    const lines: CostLine[] = [
      { id: '1', label: 'a', gewerk: 'moebel', qty: 1, unit: 'Stk', unitMin: 100, unitMax: 200, totalMin: 100, totalMax: 200 },
      { id: '2', label: 'b', gewerk: 'moebel', qty: 1, unit: 'Stk', unitMin: 50, unitMax: 80, totalMin: 50, totalMax: 80 },
    ];
    expect(sumLines(lines)).toEqual({ min: 150, max: 280 });
  });
});
