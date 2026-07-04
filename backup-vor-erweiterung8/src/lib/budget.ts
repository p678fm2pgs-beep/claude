/**
 * HAVEN ATELIER — Live-Budget (Erweiterung 6 · S10).
 * Rechnet das Projekt in einer Preisstufe (Standard/Premium/Luxus) durch,
 * ohne den Projektstand zu verändern — und wendet eine Stufe auf Wunsch an.
 */
import type { PriceTier, Project } from '../types';
import { computeProjectCost } from './projectCost';
import type { ProjectCost } from './costs';

export const TIERS: PriceTier[] = ['standard', 'premium', 'luxus'];

/** Setzt die Preisstufe aller Material- und Möbel-Auswahlen (mutierend, für Drafts). */
export function applyTierToProject(p: Project, tier: PriceTier): void {
  for (const room of p.rooms) {
    for (const v of room.variants) {
      for (const m of v.materials) m.tier = tier;
      for (const f of v.furniture) f.tier = tier;
    }
  }
}

/**
 * Projektkosten in einer hypothetischen Stufe — OHNE das Projekt zu verändern.
 * (Tiefe Kopie, dann Stufen setzen, dann normale Kalkulation.)
 */
export function computeProjectCostAtTier(project: Project, tier: PriceTier): ProjectCost {
  const copy = JSON.parse(JSON.stringify(project)) as Project;
  applyTierToProject(copy, tier);
  return computeProjectCost(copy);
}
