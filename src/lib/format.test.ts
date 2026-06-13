import { describe, it, expect } from 'vitest';
import { parseLocaleNumber, formatEUR, formatArea } from './format';

describe('Format — tolerantes Parsen', () => {
  it('akzeptiert Komma und Punkt', () => {
    expect(parseLocaleNumber('5,2')).toBeCloseTo(5.2, 6);
    expect(parseLocaleNumber('5.2')).toBeCloseTo(5.2, 6);
  });

  it('akzeptiert Tausenderpunkt', () => {
    expect(parseLocaleNumber('1.234')).toBeCloseTo(1234, 6);
  });

  it('leere oder ungültige Eingabe → NaN', () => {
    expect(Number.isNaN(parseLocaleNumber(''))).toBe(true);
    expect(Number.isNaN(parseLocaleNumber('abc'))).toBe(true);
    expect(Number.isNaN(parseLocaleNumber('1,2,3'))).toBe(true);
  });

  it('Währung & Fläche ohne NaN', () => {
    expect(formatEUR(NaN)).toContain('0');
    expect(formatArea(22.88)).toContain('m²');
  });
});
