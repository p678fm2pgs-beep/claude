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
