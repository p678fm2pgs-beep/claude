# ROLLBACK-REPORT — Wiederherstellung auf den letzten guten Stand (vor 3D)

## Aktion
Sauberer, vollständiger Rückbau des aktuellen (kaputten) 3D-Stands auf den letzten guten
Pre-3D-Stand. **Kein** Reparaturversuch am 3D-Stand, **keine** Vermischung.

## Gesicherter kaputter Stand
- Tag **`broken-3d-2026-06-22`** → `8e6cc60` (bleibt erhalten).

## Gewählter Zielstand
- **`ce0a98c`** — „Erweiterung 4 · Katalog- & 2D-Visualisierungs-Ausbau" (siehe `ROLLBACK-OPTIONEN.md`).
- Begründung: neuester Stand mit vollständigen Katalogen + 2D, aber **ohne jegliches 3D/three.js**.

## Durchführung
- Working Tree exakt auf `ce0a98c` gesetzt (`git read-tree -u --reset ce0a98c`) → neuer Commit auf
  dem Arbeitsbranch, dessen Baum identisch mit `ce0a98c` ist (Historie bleibt erhalten, kein Force-Push).
- Entfernt: alle 3D-Artefakte (`src/components/Room3D.tsx`, `src/lib/room3d.ts`, `src/lib/openings3d.ts`,
  `src/lib/materialResolve.ts`, zugehörige Tests, `e2e/render3d.spec.ts`, `e2e/material-fix.spec.ts`),
  `three`/`@types/three` aus `package.json`/Lockfile.
- Abhängigkeiten exakt zum Stand neu installiert (`npm ci`) → `three` ist nicht mehr installiert.

## Verifikation
- `npm run verify` **GRÜN**: TypeScript (strict) · ESLint · Vitest (Unit + Integration) · Production-Build.
- Playwright-E2E weiterhin nur in Umgebungen mit Browser ausführbar (Sandbox blockiert Browser-Download,
  siehe `BLOCKER.md`); die Specs des Stands liegen in `/e2e`. Screenshot-Galerie daher hier nicht renderbar.
- Inhaltlich enthalten und unverändert (Erweiterung-4-Stand): Passwort-Setup/Gate + beide Modi
  (Kunde ohne EK/Marge), 2D-Grundriss-Editor (Technischer Plan **⇄ Realistische Ansicht**), vollständige
  Kataloge (85 Materialien, 170 Farbtöne, Möbel, Beleuchtung), Kosten/PDF, Speichern/Laden (IndexedDB),
  `.haven`-Export/Import — alles maschinell durch die Tests des Stands abgedeckt.

## Transparenz (wichtig)
- Die beiden Material-Darstellungs-Fixes (Resolver „last-wins" und Boden-Parität) waren **auf dem
  3D-Stand** entstanden und wurden bewusst **nicht** mitübernommen (Gesetz: keine Vermischung).
  In diesem wiederhergestellten Stand zeichnet die 2D „Realistische Ansicht" den Boden wie ursprünglich
  in Erweiterung 4. Die **Katalog-Materialkacheln** (Auswahlansicht), der technische Plan, Farben und
  Kosten sind korrekt.

## Empfehlung für das weitere Vorgehen
- 3D künftig **getrennt** und nur in **sehr kleinen, einzeln geprüften Schritten** — mit Screenshot-
  Freigabe nach jedem Schritt, bevor der nächste folgt. Erst eine korrekte, freigegebene Standbild-
  Darstellung, dann Beleuchtung, dann Öffnungen usw.
- Falls gewünscht, lassen sich die beiden 2D-Material-Darstellungs-Verbesserungen später als **separater,
  kleiner, einzeln geprüfter Schritt** sauber auf diesen stabilen Stand aufsetzen (ohne 3D).
