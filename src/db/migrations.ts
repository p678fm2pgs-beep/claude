/**
 * HAVEN ATELIER — Projekt-Migrationen via schemaVersion.
 * Reine Funktionen → unit-getestet.
 */
import { SCHEMA_VERSION, type Project } from '../types';

/** Bringt ein (ggf. älteres) Projekt auf die aktuelle schemaVersion. */
export function migrateProject(input: Project): Project {
  let p: Project = { ...input };
  const version = p.schemaVersion ?? 1;

  if (version < 2) {
    // v1 → v2: Varianten erhielten das Feld `trades`.
    p = {
      ...p,
      rooms: p.rooms.map((r) => ({
        ...r,
        variants: r.variants.map((v) => ({
          ...v,
          trades: v.trades ?? [],
          lighting: v.lighting ?? [],
        })),
      })),
    };
  }

  // Defensive Defaults (falls Felder fehlen).
  p.settings = {
    reservePercent: p.settings?.reservePercent ?? 10,
    fee: p.settings?.fee ?? { type: 'prozent', value: 12 },
    vatPercent: p.settings?.vatPercent ?? 19,
    paintCoverage: p.settings?.paintCoverage ?? 8,
  };

  p.schemaVersion = SCHEMA_VERSION;
  return p;
}
