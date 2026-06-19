# HAVEN ATELIER — Architektur- & Bauplan

Internes Premium-Planungstool für Moodboards, Farben, Materialien & Kostenkalkulation.
Standalone Web-App (offline-fähig), später Tauri-Desktop. Daten strikt von UI getrennt.

## Tech-Stack
- React 18 + Vite + TypeScript (strict) + TailwindCSS
- State: Zustand (mit Persistenz-Middleware Richtung Dexie)
- Persistenz: IndexedDB via Dexie, `schemaVersion` + Migrationen, Autosave
- Validierung: Zod-Schemas pro Eingabefeld
- PDF: jsPDF (lokale Fonts eingebettet)
- Grundriss: eigene SVG-Implementierung
- i18n: eigene leichte Lösung (DE Standard, EN), Wahl persistiert
- Icons: Lucide (lokal via lucide-react)

## QA-Fundament (`npm run verify`)
typecheck → lint → Unit-Tests (Vitest) → Production-Build → E2E (Playwright/Chromium).
Bricht beim ersten Fehler ab. Selbstreparatur-Schleife nach jedem Meilenstein.

## Verzeichnisstruktur
```
src/
  types.ts            Typisiertes Datenmodell (Projekt/Raum/Variante ...)
  i18n/               de.ts, en.ts, index.ts
  data/               colors, materials, prices, furniture, presets (typisiert, editierbar)
  lib/                geometry, costs, harmony, suitability, validation, password, id, format
  store/              Zustand-Store + Selektoren
  db/                 Dexie-DB + Migrationen + Autosave
  modules/            auth, project, rooms, colors, materials, furniture, costs, board, pdf, settings
  components/         ErrorBoundary, UI-Primitives, Layout
qa/                   screenshots, artifacts
e2e/                  Playwright-Specs
```

## Datenmodell (Kurz)
Projekt → Räume → Varianten. Abgeleitete Flächen werden live berechnet (nie persistiert).
`schemaVersion` ermöglicht Migration. Kataloge (Farben/Materialien/Preise) typisiert in /src/data.

## Engines (100% unit-getestet)
- **geometry.ts** — Polygonfläche (Shoelace), Umfang, Wandfläche netto (Umfang×Höhe − Öffnungen).
- **costs.ts** — Verschnitt, Gebinde-Aufrundung, 2 Anstriche, Honorar (% / pauschal),
  Reserve (0–30%), MwSt 19%, Rundung erst am Ende, Spannen-Summen, Nebenpositionen.
- **harmony.ts** — regelbasierte, deterministische Farbempfehlungen + Signature + Anti-Empfehlungen,
  60-30-10, Licht-Logik.
- **suitability.ts** — Eignungs-/Plausibilitätswarnungen (Bad/FBH/Außen/Hochglanz ...).

## Design-System (HAVEN-DNA)
Dark UI (#0A0A0B / #131312 / Gold #C9A84C), helle Boardfläche (#F6F4EF).
Cormorant Garamond (Headlines) + Montserrat (UI). Haarlinien, viel Negativraum.

## Modi
Beratungsmodus (geführt) · Expertenmodus (Dashboard, EK/Marge, Editoren) · Präsentationsmodus.

## Meilensteine
- M0 QA-Fundament  ✔ Setup + verify-Pipeline + Basis-E2E
- M1 Fundament     Design-System, Passwort-Setup/Gate, i18n, Projektverwaltung, Autosave/Export/Import
- M2 Raum-Editor   SVG-Grundriss, Öffnungen, Validierung, Flächen-Engine
- M3 Farben        12×10+ Bibliothek, Flow, Harmonie-Engine, Rollen, 60-30-10, Licht
- M4 Materialien   Voller Katalog A–I, Texturen/Fallback, Harmonie & Farb-Ampel
- M5 Möbel+Kosten  Preislisten-Editor, alle Formeln + Nebenpositionen, Unit-Tests
- M6 Board+PDF     Board, Präsentationsmodus, Kunden- & Kalkulations-PDF
- M7 Vergleich+Demo Varianten-Vergleich, Demo „Musterwohnung Düsseldorf", Feinschliff, Doku

## Definition of Done
`npm run verify` grün · Kunden-Reise-E2E (DE/EN) · Toter-Knopf-Scan 0 · 0 console.error ·
Kosten-Engine 100% unit-getestet · PDF/Persistenz/Validierung grün · Demo-Projekt · offline ·
LICENSES.md · QA-REPORT.md · FINAL-REPORT.md.

---

## Erweiterung 4 — Großer Katalog- & 2D-Visualisierungs-Ausbau (rein additiv)

**Ehernes Gesetz:** nichts Bestehendes überschreiben/entfernen. Regression = Bug Nr. 1.
Schutzschild: `src/test/no-regression.test.ts` (Baselines: 120 Töne · 12 Familien · 63 Materialien ·
18 Möbel · 18 Gewerke · 25 Nebenpos. · 5 Presets; + Stichproben + Altprojekt-Migration/Kalkulation).
Backup-Tag: `backup-vor-erweiterung4`.

### Datenmodell (Zwei-Ebenen, additiv, schemaVersion 2 → 3)
- Ebene 1 „Material/Typ" bleibt unverändert. Ebene 2 „Variante" als **optionale** Felder:
  `MaterialSelection.layingDirection | woodSpecies | finish | format | groutColor`,
  erweiterte `pattern`-Union (fischgraet, chevron, schiffsboden, wuerfel, mosaik, flechtmuster …).
- `Opening.frameColor?` (z. B. schwarze Fensterrahmen).
- `Variant.wallColors?` (Farbe je Wand), `Variant.lights?` (`LightSelection`).
- Migration v2→v3 stamp-only (alle neuen Felder optional → Altdaten bleiben gültig).

### Textur-Strategie
- Bestehender prozeduraler Generator (`src/lib/texture.ts`) wird additiv um **Verlegemuster-Rendering**
  ergänzt (Diele/Fischgräte/Chevron/Würfel/Diagonal, Fliesenraster + Fugenfarbe) — offline, deterministisch,
  niemals leer, kein „Lego-Look". Wandfarben HEX-treu.

### 2D „Realistische Ansicht" (Kernpunkt, additiv)
- Neue Komponente `RealisticPlan` rendert Bodenfläche mit Material-Textur + Muster, Wände als
  farbige/material­ige Stärke-Streifen, Tür-Öffnungsbogen + Fenster-Mehrfachlinie (+ Rahmenfarbe),
  Decken-/Voute-Lichtsaum. Umschalter **Technischer Plan ⇄ Realistische Ansicht**; der bestehende
  `MiniPlan` (technisch) bleibt unverändert erhalten.

### Selbstkritik / Risiken
- Größtes Risiko: versehentliche Regression bestehender Kataloge/Tests → durch Schutzschild abgesichert.
- 2D-Performance: Texturen werden in einen Off-Screen-Canvas gekachelt und als Pattern gefüllt (nicht pro
  Pixel) → flüssig.
- Realismus aus prozeduralen Texturen ist begrenzt; Anspruch ist „erkennbar Holz/Stein/Fliese/Fischgräte",
  nicht Fotorealismus. CC0-Fototexturen sind ein Roadmap-Schritt.
