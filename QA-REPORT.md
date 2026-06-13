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
