# DIAGNOSE — Material-Darstellungsfehler (2D „Realistisch" & 3D)

## Fehlerbild
Ausgewähltes Boden-/Wandmaterial wird NICHT angezeigt; stattdessen erscheint ein anderes
(älteres) Material — in 2D „Realistische Ansicht" UND in 3D. „Zu hell/komplett anders."

## Datenfluss (ein konkretes Material verfolgt)
1. **Auswahl/Speichern:** In `MaterialsModule.addMaterial` wird eine neue `MaterialSelection`
   per `v.materials.push({...})` **angehängt** (kein Ersetzen). Ein Stil-Preset (`StyleModule`)
   setzt zuvor bereits eine Boden-Auswahl.
2. **Auflösung in 2D:** `src/components/RealisticPlan.tsx:63`
   `const floorSel = variant.materials.find((m) => m.surface === 'boden');`
3. **Auflösung in 3D:** `src/components/Room3D.tsx:124` — **identisch** `…find(surface==='boden')`.

## Nachgewiesene Ursache (Beleg)
`Array.prototype.find` liefert das **ERSTE** Element mit `surface==='boden'`. Da neue Auswahlen
**angehängt** werden, bleibt die zuletzt getroffene Auswahl unsichtbar — gerendert wird stets die
**erste/älteste** Boden-Auswahl (häufig die vom Preset gesetzte). Dieselbe `find`-Logik existiert
**doppelt** (2D + 3D) → gemeinsame Ursache, beide Ansichten betroffen.

Maschinelle Gegenproben (Diagnose-Lauf):
- **Keine** fehlenden Material-IDs (Presets/Demos lösen alle korrekt auf) → kein Key-/Pfad-Mismatch.
- **Kein** ungültiger Textur-Basiswert (`texture.base` aller 85 Materialien gültiges HEX) →
  kein fehlendes Asset/Fallback-Bild.
- Bestätigt: **Off-by-selection** — falsche Auswahl-Auflösung (erstes statt aktuelles), nicht falsche Textur.

## Fix (an der Wurzel, gemeinsam für 2D & 3D)
Zentrale Resolver-Schicht `src/lib/materialResolve.ts`:
- `resolveSurfaceSelection(variant, surface, wallIndex?)` → liefert die **zuletzt** getroffene Auswahl
  (most-recent-wins), sodass die aktuelle Nutzerauswahl angezeigt wird.
- `resolveMaterial(sel)` → löst die Textur/Definition auf; bei (theoretisch) fehlender ID
  `console.warn` + Rückgabe `undefined` (Aufrufer nutzen dann eine dezente Material-/Neutralfarbe,
  kein irreführend helles Standardbild).
- `resolveWallColorHex(variant, wallIndex)` → vereinheitlicht die zuvor **doppelt** vorhandene
  Wandfarb-/Wandmaterial-Auflösung (ebenfalls most-recent-wins).
2D (`RealisticPlan`) und 3D (`Room3D`) nutzen ab jetzt **dieselbe** Schicht → automatisch beide korrekt.

Zusätzlich (Konsistenz, minimal): `addMaterial` ersetzt bei Einzel-Flächen (Boden/Decke) die bestehende
Auswahl statt anzuhängen; Wand bleibt pro-Wand additiv.
