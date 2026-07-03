# FIXLOG — Erweiterung 6 · S2 (Fehler-Sweep)

Stand: Erweiterung 6, nach S1/S3/S4/S5/S7. Jeder Eintrag: Befund → Ursache → Fix → Beweis.

## Behobene Fehler

### 1. „Manchmal falsches Material angezeigt" (Wurzel-Fix, S1)
- **Befund:** 2D und 3D lösten die Materialauswahl unabhängig und teils unterschiedlich auf;
  bei mehreren Auswahlen je Fläche gewann mal die erste, mal die letzte.
- **Ursache:** Keine gemeinsame Auflösungsschicht; zusätzlich irreführender heller Fallback bei fehlender Material-ID.
- **Fix:** EINE gemeinsame Resolver-Schicht `src/lib/materialResolve.ts`
  (`resolveSurfaceSelection` = letzte Wahl gewinnt, `resolveMaterial` mit `console.warn` und
  ehrlichem Material-Grundton statt hellem Fantasie-Fallback). 2D (`RealisticPlan`) und
  3D (`Room3D`) nutzen ausschließlich diese Schicht.
- **Beweis:** `src/lib/materialResolve.test.ts` — Mapping-Tabelle über 27 Katalog-IDs (≥ 20 gefordert),
  Asset-Existenz, visuelle Differenz (Fliese ≠ Parkett im gerenderten Canvas).

### 2. Bodendarstellung ≠ Katalog-Kachel
- **Befund:** Boden im Plan wirkte teils anders als die Kachel im Katalog (Fliesen ohne Fugenbild).
- **Ursache:** Plan malte eigene, vereinfachte Muster statt der Katalog-Textur-Painter.
- **Fix:** `fillFloorSurface` in `src/lib/texture.ts` routet nach `texture.variant`
  (Holz → Verlegemuster, Fliese/Stein → Raster mit Fugenfarbe, sonst → `drawTexture` gekachelt);
  von 2D UND 3D verwendet.
- **Beweis:** Texture-Tests + visuelle Differenz-Tests, `npm run verify` grün.

### 3. Doppelte Boden-/Decken-Auswahl je Raum
- **Befund:** Mehrfaches „Wählen" stapelte Auswahlen; angezeigt wurde nicht sicher die letzte.
- **Fix:** `MaterialsModule.addMaterial` ersetzt bei Einzel-Flächen (Boden/Decke) die bestehende
  Auswahl statt anzuhängen; Resolver sichert zusätzlich „letzte gewinnt" ab.

### 4. HEX-Tippfehler in neuen Farbdaten (vor Commit gefunden)
- **Befund:** Zwei ungültige HEX-Werte in `colorsExtended.ts` (`#AEA austauschbar`, `#20272 4`).
- **Fix:** Korrigiert auf `#AEA294` / `#202724`.
- **Beweis:** `colorCatalog.test.ts` prüft seither ALLE Töne gegen `^#[0-9A-Fa-f]{6}$` —
  dieser Fehlertyp kann nicht mehr unbemerkt passieren.

## Sweep-Prüfungen ohne Befund (Stand heute)

| Prüfung | Ergebnis |
| --- | --- |
| TypeScript strict (`tsc -b`) | 0 Fehler |
| ESLint | 0 Fehler |
| Vitest (152 → 157 Tests inkl. neuem Sweep) | alle grün |
| Production-Build | grün |
| i18n: alle 217 statisch genutzten Keys in `de.ts` vorhanden | vollständig |
| i18n: jeder de-Key auch in `en.ts` | vollständig |
| TODO/FIXME/@ts-ignore im Quellcode | keine |
| Signature-Kombis → Ton-IDs auflösbar | alle |
| Stil-Presets → Ton-/Material-IDs auflösbar | alle |
| Material-Addons → Nebenpositionen auflösbar | alle |
| Material-/Möbel-IDs eindeutig, Preise plausibel | ja |

## Geprüft und als GEWOLLT eingestuft (keine Fehler)

- **Polsterstoffe** (`textil-*`, surface `sonstiges`): `laborVK = 0` — Stoffe werden ohne
  Verlege-Lohn kalkuliert (Verarbeitung steckt im Möbel).
- **Metall-Oberflächen** (`metall-*`, surface `sonstiges`): Preise 0/0 — reine
  Referenz-Oberflächen (Beschläge/Armaturen), Preis entsteht am Objekt, nicht am Material.

Beides ist jetzt im dauerhaften Sweep-Test dokumentiert und abgesichert
(`src/test/integrity-sweep.test.ts`), sodass echte Preis-Lücken bei Flächen-Materialien
weiterhin auffallen würden.

## Bekannte Grenzen (kein Bug, dokumentiert)

- **E2E/Screenshots:** In dieser Sandbox ist kein Playwright-Browser installierbar —
  E2E-Specs liegen in `/e2e` und laufen lokal mit `npm run e2e:install && npm run e2e`.
- **Farb-Treue:** HEX-Werte für RAL/NCS/Hersteller sind Bildschirm-Annäherungen;
  der Hinweis „verbindlich nur Originalfächer/-muster" ist überall eingeblendet.
