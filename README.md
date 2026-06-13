# HAVEN ATELIER

Internes Premium-Planungstool für **Moodboards, Farben, Materialien & Kostenkalkulation**.
Standalone-Web-App (nach dem Laden offline lauffähig), später als Tauri-Desktop geplant.
Daten sind strikt von der UI getrennt — der Schritt zu Desktop/Backend erfordert keinen Umbau.

> _Ruhe · Raum · Freiheit_

## Schnellstart

```bash
npm install
npm run dev           # Entwicklungsserver (Vite)
```

Beim **allerersten Start** erscheint der Einrichtungs-Bildschirm, der **einmalig** zwei Passwörter
im Klartext zeigt (Start- und Experten-Passwort). Notieren Sie beide sicher — danach werden nur
noch Hashes (PBKDF2/SHA-256, clientseitig) in IndexedDB gespeichert.

## Build & Qualitätssicherung

```bash
npm run build         # Production-Build (tsc + vite)
npm run verify        # EIN Prüfbefehl: typecheck → lint → Tests → Build → E2E
```

`npm run verify` bricht beim ersten Fehler ab und gibt einen klaren Report. Die Playwright-E2E-Stufe
wird automatisch übersprungen, wenn (noch) kein Browser installiert ist:

```bash
npm run e2e:install   # einmalig: npx playwright install chromium --with-deps
npm run e2e           # End-to-End-Tests (Chromium)
```

Einzelne Stufen: `npm run typecheck` · `npm run lint` · `npm run test` · `npm run e2e`.

## Drei Modi

- **Beratungsmodus** — geführter Assistent (Projekt → Räume → Licht → Stil → Farben → Materialien → Möbel → Kosten → Board).
- **Expertenmodus** — Dashboard mit Direktzugriff, EK/Marge, Preislisten-Editor, Einstellungen. Erfordert das **Experten-Passwort**.
- **Präsentationsmodus** — Vollbild-Board fürs Kundengespräch, nur Blättern.

## Bedienung — Kurzreferenz

| Aufgabe | Weg |
|---|---|
| **Passwort ändern** | Expertenmodus → Einstellungen → „Passwörter ändern" (altes Passwort nötig; neues wird einmalig angezeigt) |
| **Preisliste pflegen** | Expertenmodus → Einstellungen → „Preislisten-Editor" (Suche, NRW-Richtwerte Stand 06/2026) |
| **Reserve/Honorar** | Einstellungen → Reserve (0–30 %) und Honorar (% oder Pauschale) |
| **Texturen ersetzen** | Programmatische Platzhalter in `src/lib/texture.ts`; echte CC0-Musterfotos in `public/` ablegen und in `src/data/materials.ts` referenzieren (siehe `LICENSES.md`) |
| **Projekt exportieren/importieren** | Projektliste → Export (`.haven`-JSON) / Import |
| **PDF (Kunde)** | Board → „PDF exportieren" (ohne EK/Marge) |
| **PDF (intern)** | Expertenmodus → Board → „Kalkulations-PDF" (mit EK/Marge) |
| **Daten zurücksetzen** | Einstellungen → „Alle Daten zurücksetzen" (einziger Recovery-Weg bei Passwortverlust) |

## Architektur

- **React 18 + Vite + TypeScript (strict) + Tailwind**, State via **Zustand**.
- **Persistenz:** IndexedDB via **Dexie**, mit `schemaVersion` + Migrationslogik und **Autosave**.
- **Engines (100 % unit-getestet):** `src/lib/geometry.ts` (Flächen), `src/lib/costs.ts` + `src/lib/projectCost.ts` (Kosten),
  `src/lib/harmony.ts` (Farbharmonie), `src/lib/suitability.ts` (Eignungswarnungen), `src/lib/validation.ts`.
- **Daten** (typisiert, im Expertenmodus editierbar): `src/data/` — Farben, Materialien, Preise, Möbel, Nebenpositionen, Presets.
- **Module:** `src/modules/{auth,project,rooms,style,colors,materials,furniture,costs,board,pdf,settings}`.
- **Error Boundaries** um jedes Modul: ein Fehler zeigt eine gestaltete Fehlerkarte mit „Erneut versuchen" — nie eine weiße Seite.
- **Offline:** Fonts (woff2), Texturen (generiert), Icons (lucide), Sprachdateien — alles lokal. Keine Laufzeit-Requests.

## Sprachen

Deutsch (Standard) + Englisch, vollständig via eigenes i18n (`src/i18n/`). Umschalter in Kopfzeile/Gate; Wahl wird gespeichert.

## Roadmap

Echtes Multi-User-Login & Cloud-Sync (Backend) · Tauri-Desktop-Build · eigene Musterfoto-Bibliothek ·
Lieferanten-Preisimport (CSV) · Kundenfreigabe-Link · KI-gestützte Vorschläge.

## Sicherheit / Hinweis

Das Passwort-Gate ist ein **Geräteschutz**, kein vollwertiges Login. Echtes Multi-User-Auth folgt mit
dem Backend. Passwörter werden nur als Hash gespeichert; bei Verlust hilft ausschließlich ein Daten-Reset.
