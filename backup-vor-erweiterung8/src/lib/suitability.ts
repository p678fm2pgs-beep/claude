/**
 * HAVEN ATELIER — Eignungs- & Plausibilitätswarnungen (Erweiterung 2, Abschnitt O).
 * Regelbasiert, deterministisch, unit-getestet. Gelb (nicht blockierend), mit Alternativvorschlag.
 */
import type { Material } from '../data/materials';
import type { RoomType } from '../types';

export type WarnSeverity = 'warn' | 'info';

export interface SuitabilityWarning {
  code: string; // i18n-Schlüssel
  severity: WarnSeverity;
  params?: Record<string, string | number>;
}

const WET_ROOMS: RoomType[] = ['bad'];
const OUTDOOR: RoomType[] = ['aussen'];

/**
 * Prüft ein Material gegen einen Raumtyp (+ optional Raumhöhe für Spiegel-/Glanz-Regel).
 */
export function checkMaterialSuitability(
  material: Material,
  roomType: RoomType,
  heightCm?: number,
): SuitabilityWarning[] {
  const out: SuitabilityWarning[] = [];
  const t = material.tech;

  // Massivparkett + FBH
  if (material.subcategory === 'Massivholzdielen' && t.fbh !== 'ja') {
    out.push({ code: 'suit.massivFbh', severity: 'warn' });
  }

  // Nassbereich: Material nicht nasszellentauglich
  if (WET_ROOMS.includes(roomType) && !t.nasszelle && material.surface === 'boden') {
    out.push({ code: 'suit.notWetroom', severity: 'warn' });
  }

  // Bad: Rutschklasse mind. R10/B
  if (WET_ROOMS.includes(roomType) && material.surface === 'boden') {
    const r = t.rutschklasse ?? '';
    const num = parseInt(r.replace(/[^0-9]/g, ''), 10);
    if (!r || Number.isNaN(num) || num < 10) {
      out.push({ code: 'suit.slipResistance', severity: 'warn' });
    }
  }

  // Außenbereich: frostsicher / außentauglich
  if (OUTDOOR.includes(roomType) && !t.aussen) {
    out.push({ code: 'suit.notFrostproof', severity: 'warn' });
  }

  // Hochglanz-Spanndecke in niedrigen Räumen (Heuristik über Tags + Höhe)
  if (
    material.surface === 'decke' &&
    /glanz|hochglanz/i.test(material.tags.join(' ') + material.name) &&
    heightCm !== undefined &&
    heightCm < 250
  ) {
    out.push({ code: 'suit.glossyCeilingLow', severity: 'info' });
  }

  // FBH bedingt → Hinweis (info)
  if (t.fbh === 'bedingt' && material.surface === 'boden') {
    out.push({ code: 'suit.fbhConditional', severity: 'info' });
  }

  return out;
}

/**
 * Plausibilitätsprüfung Material ↔ Raumtyp (grobe Passung), liefert ggf. Hinweis.
 */
export function checkRoomMaterialFit(material: Material, roomType: RoomType): SuitabilityWarning[] {
  const out: SuitabilityWarning[] = [];
  // Teppichboden im Bad ist unpassend
  if (roomType === 'bad' && material.subcategory === 'Teppichboden') {
    out.push({ code: 'suit.carpetBath', severity: 'warn' });
  }
  return out;
}

export function allWarnings(
  material: Material,
  roomType: RoomType,
  heightCm?: number,
): SuitabilityWarning[] {
  return [...checkMaterialSuitability(material, roomType, heightCm), ...checkRoomMaterialFit(material, roomType)];
}
