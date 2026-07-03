/**
 * HAVEN ATELIER — Material-/Textur-Resolver (gemeinsame Schicht für 2D & 3D).
 * Fix (Material-Darstellungsfehler): löst die Material-Auswahl je Fläche eindeutig auf —
 * es gewinnt die ZULETZT getroffene Auswahl (most-recent-wins), nicht die erste.
 * 2D (RealisticPlan) und 3D (Room3D) nutzen ausschließlich diese Funktionen.
 */
import type { Variant, MaterialSelection } from '../types';
import { findMaterial, type Material, type Surface } from '../data/materials';
import { findTone } from '../data/colors';

/** Zuletzt getroffene Auswahl für eine Fläche (optional für eine bestimmte Wand). */
export function resolveSurfaceSelection(
  variant: Variant,
  surface: Surface,
  wallIndex?: number,
): MaterialSelection | undefined {
  let result: MaterialSelection | undefined;
  for (const sel of variant.materials) {
    if (sel.surface !== surface) continue;
    if (wallIndex !== undefined && sel.wallIndex !== wallIndex) continue;
    result = sel; // späterer Eintrag überschreibt → "last wins"
  }
  return result;
}

export function resolveFloorSelection(variant: Variant): MaterialSelection | undefined {
  return resolveSurfaceSelection(variant, 'boden');
}

/** Löst die Material-Definition (inkl. Textur) auf; warnt bei fehlender ID statt still zu scheitern. */
export function resolveMaterial(sel: MaterialSelection | undefined): Material | undefined {
  if (!sel) return undefined;
  const m = findMaterial(sel.materialId);
  if (!m) {
    // Niemals stilles Fehlschlagen: fehlende Assets sichtbar machen (Konsolen-Wächter ignoriert warn).
    // eslint-disable-next-line no-console
    console.warn(`[HAVEN] Material nicht gefunden: "${sel.materialId}" — dezenter Platzhalter wird verwendet.`);
  }
  return m;
}

export function resolveFloorMaterial(variant: Variant): { sel?: MaterialSelection; material?: Material } {
  const sel = resolveFloorSelection(variant);
  return { sel, material: resolveMaterial(sel) };
}

/**
 * Farbe einer Wand (Draufsicht/3D): explizite Wandfarbe → (zuletzt gewähltes) Wandmaterial →
 * Wand-Rolle → dezente Neutralfarbe. Vereinheitlicht die zuvor doppelte Logik in 2D & 3D.
 */
export function resolveWallColorHex(variant: Variant, wallIndex: number): string {
  const explicit = variant.wallColors?.[wallIndex];
  if (explicit) {
    const tone = findTone(explicit);
    if (tone) return tone.hex;
  }
  const wallSel = resolveSurfaceSelection(variant, 'wand', wallIndex);
  const wallMat = resolveMaterial(wallSel);
  if (wallMat) return wallMat.texture.base;

  const wandTone = findTone(variant.colorRoles.wand);
  if (wandTone) return wandTone.hex;
  return '#D9D2C4';
}
