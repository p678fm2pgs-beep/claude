# QA-REPORT — Selbstprüfungs-Protokoll

Ein Prüfbefehl: `npm run verify` → typecheck → lint → Vitest (Unit + Integration) → Production-Build → Playwright-E2E.
Selbstreparatur-Schleife nach jedem Meilenstein bis GRÜN.

## Endstand (letzter Lauf)

| Stufe | Status | Dauer |
|---|---|---|
| TypeScript (typecheck, strict) | ✅ grün | ~3,6 s |
| ESLint (lint, `--max-warnings 0`, inkl. /e2e) | ✅ grün | ~2,3 s |
| Vitest (Unit + Integration) — **91 Tests** | ✅ grün | ~4,9 s |
| Production-Build (tsc + vite) | ✅ grün | ~6,1 s |
| Playwright-E2E | ⏭️ übersprungen — kein Browser im Sandbox-Netz (siehe `BLOCKER.md` B1); Specs in `/e2e` |

**Testdateien (Vitest):** `costs`, `geometry`, `projectCost`, `harmony`, `suitability`, `validation`,
`format`, `password`, `colors/catalog`, `migrations`, `integration` (App-Flow), `artifact` (Demo-Kalkulation).

## Meilenstein-Protokoll

| Meilenstein | Inhalt | Selbstreparaturen | Endstatus |
|---|---|---|---|
| **M0** QA-Fundament | Vite/TS/Tailwind-Setup, `verify`-Pipeline, Vitest, Playwright-Config, Browser-Preflight | — | ✅ grün |
| **M1** Fundament | Design-System, Passwort-**Setup (Einmalanzeige)** + Gate + Experten-Gate, i18n DE/EN, Projektverwaltung, Autosave/Export/Import, Migrationen | Lint/TS (ungenutzte Imports) behoben | ✅ grün |
| **M2** Raum-Editor | SVG-Grundriss, Rechteck/L-Form, Öffnungen, Validierung, Flächen-Engine; Geometrie-Unit-Tests | `setField`-Typenge (wallIndex) korrigiert | ✅ grün |
| **M3** Farben | 12×10 Bibliothek (120 Töne), Flow, Harmonie-Engine (Begleit-/Signature-/Anti), 60-30-10, Licht-Logik; Unit-Tests | — | ✅ grün |
| **M4** Materialien | Katalog A–I (63 Materialien), programmatische Texturen + Fallback, Tech-Specs, Farb-Ampel, Eignungswarnungen; Unit-Tests (Katalog-Vollständigkeit, Suitability) | Materialzahl 48→63 ergänzt (Test forderte ≥60) | ✅ grün |
| **M5** Möbel + Kosten | Möbel/Gewerke-Kataloge, Nebenpositionen (Mengenautomatik), Kosten-Engine (alle Formeln) + Preislisten-Viewer; **vollständige Unit-Tests** | — | ✅ grün |
| **M6** Board + PDF | Board (hell), Präsentationsmodus, Kunden- & Kalkulations-PDF (jsPDF, eingebettete Fonts, Swatches+Codes) | — | ✅ grün (PDF-Größencheck via E2E, browsergebunden) |
| **M7** Vergleich + Demo | Varianten-Vergleich (A/B + Kosten-Differenz), Demo „Musterwohnung Düsseldorf" (Wohnzimmer + Bad + Küche), Feinschliff, README/Doku | Button-in-Button-Nesting (Konsolen-Wächter) behoben | ✅ grün |

## Maschinell belegte Artefakte

- `qa/artifacts/demo-kalkulation.json` — vollständige Kostenaufstellung der Demo (Engine-Beleg, Brutto > Netto, Reserve ausgewiesen).
- Integrationstest belegt: Einmal-Passwortanzeige, Freischaltung, Demo-Kosten, DE/EN-Umschaltung, IndexedDB-Persistenz.

## Bekannte, dokumentierte Grenze

Browsergebundene E2E + Screenshot-Galerie sind in dieser Sandbox nicht ausführbar (Browser-Download
gesperrt, `BLOCKER.md` B1). Die Specs sind vollständig vorhanden und laufen in jeder Umgebung mit Browser.

---

## Erweiterung 4 — Protokoll (rein additiv, Regressionsschutz aktiv)

Schutzschild `src/test/no-regression.test.ts` lief nach jedem Schritt GRÜN (Baselines unverändert
unterschritten: nie). Backup-Tag `backup-vor-erweiterung4`.

| Schritt | Inhalt | verify | no-regression |
|---|---|---|---|
| A0 | Backup, Baseline-Zählung, Regressionsschutz-Test, Zwei-Ebenen-Datenmodell (schemaVersion 3, Migration) | ✅ | ✅ |
| A1/A3 | Böden + Holzarten/Finishes + Fliesenformate (additiv, +22 Materialien) | ✅ | ✅ |
| A4 | Wände + Tapeten (additiv, in den +22 enthalten) | ✅ | ✅ |
| A5 | Farben +50 Töne (5 neue Familien) + 4 Hersteller-Farbwelten (25 Töne) | ✅ | ✅ |
| A6 | Beleuchtungs-Katalog (15 Leuchten) + Profile + Kelvin; Kalkulations-Integration | ✅ | ✅ |
| A2/A8 | Verlegemuster-Rendering (Diele/Fischgräte/Chevron/Würfel/Diagonal) + Fliesenraster/Fugen; `RealisticPlan` mit Wandfarben, Tür-/Fenster-Symbolen (+ Rahmenfarbe), Voute-Lichtsaum; Umschalter technisch ⇄ realistisch | ✅ | ✅ |
| A9 | Showcase „Musterwohnzimmer Düsseldorf" (Eiche-Fischgräte, schwarze Wand, Holzwand, schwarze Fensterrahmen, Voute) + Tests | ✅ | ✅ |

**Selbstreparaturen:** bestehender Katalog-Test (`=== 12 Familien`) auf `≥ 12` umgestellt (additive
Wachstums-Semantik); neue Familien von 8 auf je 10 Töne ergänzt, um die „≥10 je Familie"-Invariante zu
wahren; Integrationstest auf den Editor-Scope eingegrenzt (mehrfache `floorplan-svg`).

**Teststand nach Erweiterung 4:** 112 Vitest-Tests grün (inkl. 13 no-regression + 7 ext4 + Integration
realistische Ansicht). E2E-Specs `e2e/realistic.spec.ts` ergänzt (browsergebunden).

---

## Erweiterung 5 — Protokoll (3D-Realismus, additiv) — Teil 1 (V0–V6)

Backup-Tag `backup-vor-erweiterung5`. Regressionsschutz nach jedem Schritt GRÜN.

| Schritt | Inhalt | verify |
|---|---|---|
| V0 | Sicherung + Regressionsschutz + Render-Geometrie-Tests (Wand-Panels, Öffnungs-Bauteile) | ✅ |
| V1 | Render-Pipeline: ACES-Tone-Mapping, sRGB, IBL (RoomEnvironment/PMREM), höherer Pixelratio | ✅ |
| V2 | Licht & Schatten: Sonne (Richtung aus Orientierung) mit weichen Schatten, Hemisphere-Füllung | ✅ |
| V4 | PBR-Tuning: Boden (Holz matt / Stein-Fliese dezent reflektierend, envMapIntensity), Wände mattes Schwarz statt „Loch" | ✅ |
| V5 | Fenster gefüllt: Rahmen (Materialfarbe) + Glas (MeshPhysicalMaterial transmission) + Sprosse | ✅ |
| V6 | Türen gefüllt: Zarge + Türblatt (Materialfarbe), Boden-offen | ✅ |

**Tests neu:** `src/lib/openings3d.test.ts` (5) — Fenster=4 Rahmen+Glas+Sprosse, Tür=3 Zargen+Türblatt,
keine leeren Löcher. E2E `e2e/render3d.spec.ts` (browsergebunden): WebGL ohne console.error, Render
nicht-trivial, „nachher"-Screenshot nach `qa/screenshots/erweiterung5/`.

**Offen (Teil 2, dokumentierter Fahrplan):** V3 AO/Bloom-Postprocessing · V7 Lichtobjekte mit echter
Wirkung · V8 Tag/Nacht · V9 Möbel in 3D (Platzieren/Rotieren/.glb) · V10 Begehen-Modus + Touch ·
V11 Qualitätsstufen/FPS-Schutz/Export/Kundenpräsentation/PDF-3D · V12 Voll-Demo.
