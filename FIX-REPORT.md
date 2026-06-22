# FIX-REPORT — Material-Darstellungsfehler (2D „Realistisch" & 3D)

## Nachgewiesene Ursache
2D (`RealisticPlan`) und 3D (`Room3D`) lösten das anzuzeigende Boden-/Wandmaterial mit
`variant.materials.find((m) => m.surface === 'boden')` auf → das liefert die **ERSTE** Auswahl.
Neue Auswahlen werden jedoch **angehängt** (und ein Stil-Preset setzt vorab eine Auswahl), sodass
die **zuletzt** getroffene Wahl nie sichtbar wurde — gerendert wurde die alte erste Auswahl
(oft die hellere Preset-Wahl → „komplett anders, zu hell"). Dieselbe `find`-Logik existierte
**doppelt** → gemeinsame Ursache für 2D und 3D.

Gegenproben (maschinell): keine fehlenden Material-IDs, kein ungültiger `texture.base` →
**kein** Key-/Asset-/Fallback-Problem. Reiner Auswahl-Auflösungsfehler.

## Was geändert wurde (an der Wurzel, gemeinsam)
- **Neu:** `src/lib/materialResolve.ts` — zentrale Resolver-Schicht:
  - `resolveSurfaceSelection / resolveFloorSelection / resolveFloorMaterial` → **most-recent-wins**.
  - `resolveMaterial` → bei fehlender ID `console.warn` (kein stilles Scheitern, kein irreführend
    helles Standardbild).
  - `resolveWallColorHex` → vereinheitlicht die zuvor **doppelte** Wandfarb-Auflösung.
- **`RealisticPlan.tsx` & `Room3D.tsx`:** nutzen jetzt ausschließlich diese Schicht (keine
  eigene `find`/`wallColor`-Logik mehr) → 2D und 3D automatisch korrekt & konsistent.
- **`MaterialsModule.tsx`:** Auswahl eines Bodens/einer Decke **ersetzt** die bestehende
  (Einzel-Fläche je Raum); Wände bleiben pro-Wand additiv. So entspricht die Auswahl der Anzeige
  und es entstehen keine doppelten Boden-/Decken-Positionen.

## Beweis-Tests (GRÜN)
- `src/lib/materialResolve.test.ts` (8): **Mapping** (16 IDs → korrektes Material), **Asset-Existenz**
  (alle Materialien/Presets/Demos lösen auf), **Resolver last-wins** (zweite Boden-Auswahl gewinnt;
  alte `find`-Logik hätte die erste genommen — direkt gegenübergestellt), **Wandfarb-Priorität**,
  **Fallback warnt** statt still zu scheitern.
- `e2e/material-fix.spec.ts` (browsergebunden): wählt dunklen vs. hellen Boden, prüft, dass sich
  2D- **und** 3D-Darstellung sichtbar unterscheiden; Screenshots in `qa/material-fix/`.
- `npm run verify` GRÜN; Regressionsschutz (`no-regression`) GRÜN; offline unverändert.

## Fehlende Assets
Keine. Alle referenzierten Materialien lösen auf (Diagnose-Lauf bestätigt).

Backup-Tag: `backup-vor-materialfix`.

---

## Nachtrag — Fix 2: Boden-Parität (Katalog-Kachel ↔ dargestellter Boden)
Nach erneuter Meldung zweite Ursache gefunden & behoben: Der gerenderte Boden nutzte `fillFloorPattern`
(kennt nur Holzdielen/Fliesenraster), die Katalog-Kachel jedoch `drawTexture` (alle Material-Varianten).
→ Nicht-Holz/Nicht-Fliesen-Böden (Mikrozement, Linoleum, Teppich, Putz, Gussboden, Metall …) erschienen
als **Holzdielen** = „komplett anderes Material" (fast alle betroffen, auch bei Einzel-Auswahl).

**Geändert:** neue gemeinsame `fillFloorSurface` (routet nach `texture.variant`); `RealisticPlan` & `Room3D`
nutzen sie ausschließlich. Holz → Verlegemuster, Fliese/Stein → Raster+Fugen, Rest → exakt die
Katalog-Kachel-Optik. Fallback = korrekte Materialfarbe + (bei fehlendem Material) `console.warn`.

**Tests:** `src/lib/floorSurface.test.ts` (3) — alle Textur-Varianten & alle Katalog-Böden rendern ohne
Fehler; Holz-Verlegemuster akzeptiert. `e2e/material-fix.spec.ts` (dunkel≠hell, 2D & 3D) unverändert gültig.
`npm run verify` GRÜN.
