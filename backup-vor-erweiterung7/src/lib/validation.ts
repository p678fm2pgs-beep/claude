/**
 * Zentrale Validierungs-Schicht (deterministisch, unit-getestet).
 * Liefert i18n-fähige Fehlercodes mit Parametern statt fertiger Texte,
 * damit DE/EN identisch validieren.
 */
import type { Floorplan } from '../types';
import { wallLengthCm } from './geometry';

export interface ValidationIssue {
  code: string;
  params?: Record<string, string | number>;
}

export type ValidationResult = { ok: true } | { ok: false; issue: ValidationIssue };

const ok: ValidationResult = { ok: true };
const fail = (code: string, params?: Record<string, string | number>): ValidationResult => ({
  ok: false,
  issue: { code, params },
});

// Grenzwerte (appweit).
export const LIMITS = {
  heightCmMin: 200,
  heightCmMax: 600,
  wallCmMin: 30,
  wallCmMax: 3000,
  areaM2Min: 1,
  areaM2Max: 500,
  reserveMin: 0,
  reserveMax: 30,
} as const;

export function validateRoomHeight(heightCm: number): ValidationResult {
  if (!Number.isFinite(heightCm)) return fail('err.notANumber');
  if (heightCm < LIMITS.heightCmMin || heightCm > LIMITS.heightCmMax)
    return fail('err.heightRange', { min: LIMITS.heightCmMin / 100, max: LIMITS.heightCmMax / 100 });
  return ok;
}

export function validateWallLength(lengthCm: number): ValidationResult {
  if (!Number.isFinite(lengthCm)) return fail('err.notANumber');
  if (lengthCm < LIMITS.wallCmMin || lengthCm > LIMITS.wallCmMax)
    return fail('err.wallRange', { min: LIMITS.wallCmMin / 100, max: LIMITS.wallCmMax / 100 });
  return ok;
}

export function validateFloorArea(areaM2: number): ValidationResult {
  if (!Number.isFinite(areaM2)) return fail('err.notANumber');
  if (areaM2 < LIMITS.areaM2Min || areaM2 > LIMITS.areaM2Max)
    return fail('err.areaRange', { min: LIMITS.areaM2Min, max: LIMITS.areaM2Max });
  return ok;
}

export function validateReservePercent(value: number): ValidationResult {
  if (!Number.isFinite(value)) return fail('err.notANumber');
  if (value < LIMITS.reserveMin || value > LIMITS.reserveMax)
    return fail('err.reserveRange', { min: LIMITS.reserveMin, max: LIMITS.reserveMax });
  return ok;
}

/**
 * Öffnung gegen ihre Wand prüfen:
 * - Breite/Höhe positiv
 * - Höhe + Brüstung ≤ Raumhöhe
 * - Versatz + Breite ≤ Wandlänge
 * - Σ Öffnungsbreiten auf der Wand ≤ Wandlänge
 */
export function validateOpening(
  plan: Floorplan,
  heightCm: number,
  openingId: string,
): ValidationResult {
  const opening = plan.openings.find((o) => o.id === openingId);
  if (!opening) return ok;
  if (!Number.isFinite(opening.widthCm) || opening.widthCm <= 0) return fail('err.openingWidthPositive');
  if (!Number.isFinite(opening.heightCm) || opening.heightCm <= 0) return fail('err.openingHeightPositive');

  const wallLen = wallLengthCm(plan.points, opening.wallIndex);

  if (opening.widthCm > wallLen)
    return fail('err.openingWiderThanWall', {
      opening: (opening.widthCm / 100).toFixed(2),
      wall: (wallLen / 100).toFixed(2),
    });

  if (opening.heightCm + opening.sillCm > heightCm)
    return fail('err.openingTallerThanRoom', {
      opening: ((opening.heightCm + opening.sillCm) / 100).toFixed(2),
      room: (heightCm / 100).toFixed(2),
    });

  if (opening.offsetCm + opening.widthCm > wallLen + 0.5)
    return fail('err.openingOutsideWall', {
      wall: (wallLen / 100).toFixed(2),
    });

  const sumWidth = plan.openings
    .filter((o) => o.wallIndex === opening.wallIndex)
    .reduce((s, o) => s + o.widthCm, 0);
  if (sumWidth > wallLen + 0.5)
    return fail('err.openingsSumExceedWall', {
      sum: (sumWidth / 100).toFixed(2),
      wall: (wallLen / 100).toFixed(2),
    });

  return ok;
}

/** Validiert alle Öffnungen eines Plans; liefert ersten Fehler oder ok. */
export function validateAllOpenings(plan: Floorplan, heightCm: number): ValidationResult {
  for (const o of plan.openings) {
    const r = validateOpening(plan, heightCm, o.id);
    if (!r.ok) return r;
  }
  return ok;
}

/** Pflichtfeld nicht leer. */
export function validateRequired(value: string): ValidationResult {
  return value.trim().length > 0 ? ok : fail('err.required');
}
