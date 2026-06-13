/** Zahlen-/Währungsformatierung & tolerantes Parsen (Komma & Punkt). */

export function formatEUR(value: number, lang: 'de' | 'en' = 'de'): string {
  const locale = lang === 'de' ? 'de-DE' : 'en-GB';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number, decimals = 2, lang: 'de' | 'en' = 'de'): string {
  const locale = lang === 'de' ? 'de-DE' : 'en-GB';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatArea(m2: number, lang: 'de' | 'en' = 'de'): string {
  return `${formatNumber(m2, 2, lang)} m²`;
}

export function formatLength(m: number, lang: 'de' | 'en' = 'de'): string {
  return `${formatNumber(m, 2, lang)} m`;
}

/**
 * Tolerantes Parsen einer Nutzereingabe in eine Zahl.
 * Akzeptiert Komma und Punkt. Liefert NaN bei ungültiger Eingabe.
 */
export function parseLocaleNumber(input: string): number {
  if (typeof input !== 'string') return NaN;
  const trimmed = input.trim();
  if (trimmed === '') return NaN;
  // Tausenderpunkte/-leerzeichen entfernen, Komma -> Punkt.
  const normalized = trimmed.replace(/\s/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
  if (!/^-?\d*\.?\d+$/.test(normalized)) return NaN;
  return Number(normalized);
}
