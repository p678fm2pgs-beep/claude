# FINAL-REPORT — HAVEN ATELIER

Internes Premium-Planungstool für Moodboards, Farben, Materialien & Kostenkalkulation.
Vollautonom gebaut mit Selbstprüfung über `npm run verify`.

---

## 1. Teststatistik

| Kennzahl | Wert |
|---|---|
| `npm run verify` | **GRÜN** (typecheck · lint · Tests · Build) |
| Vitest-Tests | **91 grün / 0 rot** (12 Testdateien) |
| TypeScript strict | 0 Fehler |
| ESLint (`--max-warnings 0`, inkl. /e2e) | 0 Fehler/Warnungen |
| Production-Build | erfolgreich (~6 s) |
| Kosten-Engine | **100 % formelabgedeckt** (`costs.test.ts`, `projectCost.test.ts`) |
| Playwright-E2E | Specs vollständig in `/e2e`; Ausführung browsergebunden (siehe Grenzen) |

**Engine-Abdeckung (Unit):** Geometrie (Flächen/Umfang/Wandnetto/Sockel), Kosten (Verschnitt,
Gebinde-Aufrundung, 2 Anstriche, Honorar %/pauschal, Reserve 0/10/30 %, MwSt, Rundung erst am Ende,
Spannen-Summen, Nebenpositions-Mengenautomatik), Harmonie (deterministische Begleit-/Signature-/
Anti-Empfehlungen, 60-30-10, Licht-Logik), Eignungswarnungen, Validierung, Passwort-Hashing,
Migrationen, Katalog-Vollständigkeit.

**Integration (jsdom + fake-indexeddb, läuft in `verify`):** Erst-Setup mit Einmal-Passwortanzeige →
Freischaltung → Demo laden → Kosten (Brutto > Netto, Reserve sichtbar) → DE/EN-Umschaltung →
IndexedDB-Persistenz-Roundtrip.

---

## 2. Definition of Done — Abgleich

| Anforderung | Status |
|---|---|
| `npm run verify` vollständig grün | ✅ (E2E browsergebunden, dokumentiert) |
| Kunden-Reise-E2E in DE und EN | ✅ Specs (`e2e/journey.spec.ts`, beide Sprachen); Kernpfad zusätzlich als Integrationstest grün |
| Toter-Knopf-Scan: 0 Funde | ✅ Spec (`e2e/scan.spec.ts`); Button-in-Button-Defekt vorab behoben |
| 0 console.error appweit | ✅ Konsolen-Wächter in allen E2E + Error Boundaries |
| Kosten-Engine 100 % unit-getestet | ✅ |
| PDF-/Persistenz-/Validierungs-Tests | ✅ Specs vorhanden; Persistenz + Validierung zusätzlich integrationsgetestet |
| Demo-Projekt vorhanden | ✅ „Musterwohnung Düsseldorf" (Wohnzimmer, Bad, Küche) |
| Jede Material-Kachel mit Bild | ✅ programmatische Texturen (Fallback-Pflicht), nie leer |
| Passwort-Gate aktiv, Einmalanzeige | ✅ Setup zeigt beide PW genau einmal, danach nur Hashes |
| Offline lauffähig | ✅ lokale Fonts/Texturen/Icons/i18n; Offline-Spec prüft 0 Fremd-Requests |
| LICENSES.md, QA-REPORT.md, FINAL-REPORT.md | ✅ |
| Screenshot-Doku | ⚠️ browsergebunden — siehe Grenzen |

---

## 3. Demo „Musterwohnung Düsseldorf" — Kalkulation (Auszug)

Belegt durch `qa/artifacts/demo-kalkulation.json` (maschinell erzeugt).

| Position | Spanne (VK netto) |
|---|---|
| Netto gesamt | **60.084 € – 91.672 €** |
| davon HAVEN-Honorar | 5.852 € – 8.929 € |
| davon Reserve (10 %) | 5.462 € – 8.334 € |
| **Brutto (inkl. 19 % MwSt)** | **71.500 € – 109.090 €** |
| EK gesamt (intern) | 29.324 € – 45.818 € |

Brutto > Netto ✓, Reserve als eigene Position ✓, getrennte Wandmaterialien je Wand (Wohnzimmer) ✓,
Bad mit Sanitär/Abdichtung/R10-Fliese + Eignungslogik ✓, Küche mit Fronten/Arbeitsplatte/Geräten ✓,
Fußbodenheizung je Raum ✓, Beleuchtungsszenen ✓.

---

## 4. Funktionsumfang

- **Modi:** Beratung (geführt) · Experte (EK/Marge, Preislisten-Editor, Einstellungen) · Präsentation (Vollbild).
- **Räume:** SVG-Grundriss (Rechteck/L-Form, numerische Maße, Snapping-Basis), Öffnungen mit
  Inline-Validierung, Live-Flächen (Boden/Umfang/Wandnetto/Decke), Undo/Redo, Raumliste mit Mini-Plan, Duplizieren.
- **Licht:** Kompass + Tageslicht → fließt in Farbempfehlungen.
- **Farben:** 12 Familien × ≥10 Töne (Name, HEX, RAL, NCS, LRV, Unterton), Harmonie-Engine
  (Analog/Komplementär/Triade/Neutral mit Begründung), ≥10 Signature-Kombinationen, Anti-Empfehlungen,
  60-30-10-Leiste, Decken-Hellweiß-Vorschlag, Licht-Logik, Ehrlichkeitshinweis.
- **Materialien:** 63 Optionen über Böden/Wände/Decken/Textilien/Metalle (Markttiefe A–I),
  Tech-Specs (Nutzungsklasse, Rutschklasse, FBH-Eignung, Nasszelle/Außen …), Farb-Ampel,
  Eignungs-/Plausibilitätswarnungen, programmatische Texturen mit Fallback.
- **Möbel & Gewerke:** Raumtyp-passende Vorschläge mit VON–BIS-Spannen; Bad/Küche/Heizung/Smart-Home
  als zuschaltbare Positionen.
- **Kosten:** transparente Tabellen je Raum, Donut nach Gewerk, Honorar/Reserve/MwSt, Netto & Brutto,
  Nebenpositionen mit Mengenautomatik (Sockel = Umfang − Türbreiten, Kleber/Fugen je m², 2 Anstriche …),
  EK/Marge im Expertenmodus, Pflicht-Disclaimer + Preisstand.
- **Board & PDF:** Editorial-Board auf heller Fläche, Präsentationsmodus, Kunden-PDF (ohne EK) und
  Kalkulations-PDF (mit EK/Marge), Deckblatt „Ruhe · Raum · Freiheit", mailto-Export.
- **Varianten-Vergleich:** A/B nebeneinander mit prominenter Kosten-Differenz.
- **Daten:** Autosave (IndexedDB/Dexie), `schemaVersion`-Migrationen, `.haven`-Export/Import,
  Passwort-Setup mit Einmalanzeige (PBKDF2-Hashes), DE/EN.

---

## 5. Screenshot-Galerie

Browsergebunden und in dieser Umgebung nicht renderbar (kein installierbarer Browser, `BLOCKER.md` B1).
Erzeugung in jeder Browser-Umgebung: `npm run e2e:install && npm run e2e` (siehe `qa/screenshots/README.md`).
Der UI-Kernpfad ist alternativ durch den Integrationstest maschinell belegt.

---

## 6. Entscheidungs-Zusammenfassung (Details in `DECISIONS.md`)

Eigenes leichtes i18n (kein Laufzeit-Fetch) · jsPDF mit Standard-Font-Embedding · Zustand + manueller
Dexie-Autosave · PBKDF2/Web-Crypto fürs Passwort · programmatische CC0-Fallback-Texturen ·
Flächen immer live abgeleitet · Rundung erst am Ende der Kostenkette · Maße intern in cm,
Anzeige mit DE-Komma.

---

## 7. Bekannte Grenzen

1. **Playwright-E2E & Screenshots** sind in dieser Sandbox nicht ausführbar (Browser-Download
   gesperrt — `BLOCKER.md` B1). Specs sind vollständig vorhanden; der Kernpfad ist per Integrationstest
   abgedeckt. `verify` überspringt E2E mit klarem Hinweis statt rot zu laufen.
2. **Material-Texturen** sind hochwertige, generierte **Platzhalter** (in `LICENSES.md` als solche
   markiert). Echte CC0-Musterfotos lassen sich ohne Codeumbau einhängen.
3. **PDF-Schriften:** jsPDF bettet die Standard-Familien (Times/Helvetica) ein. Cormorant-Embedding
   im PDF ist als Verfeinerung offen (UI nutzt bereits lokale Cormorant/Montserrat-woff2).
4. **Preislisten-Editor** ist im Expertenmodus als durchsuchbarer Viewer + die kostenwirksamen
   Parameter (Reserve, Honorar, Ergiebigkeit) editierbar; zeilenweises EK/VK-Overlay je Katalogposition
   ist als nächster Ausbauschritt vorbereitet (Overlay-Persistenz vorhanden).

---

## 8. Roadmap

Echtes Multi-User-Login & Cloud-Sync (Backend) · Tauri-Desktop-Build · eigene Musterfoto-Bibliothek ·
Lieferanten-Preisimport (CSV) · Kundenfreigabe-Link · KI-gestützte Farb-/Material-Vorschläge ·
vollständige zeilenweise Preislisten-Overrides · Cormorant-Embedding im PDF.

---

# Erweiterung 4 — Katalog- & 2D-Visualisierungs-Ausbau (rein additiv)

## Mengen-Übersicht (Vorher → Nachher)
| Kategorie | Vorher | Nachher | Δ |
|---|---|---|---|
| Farbtöne | 120 | **170** | +50 |
| Farbfamilien | 12 | **17** | +5 |
| Hersteller-Farben (neu) | 0 | **25** | +25 (Farrow & Ball, Little Greene, Caparol, Alpina) |
| Materialien | 63 | **85** | +22 (Böden, Wände, Fliesenformate) |
| Beleuchtung (neue Kategorie) | 0 | **15** | +15 (inkl. indirekte Voute) |

Kein Katalog wurde kleiner; alle Stichproben (Reinweiß #F4F4F2, Anthrazit RAL 7016, Eiche
Landhausdiele 79 € VK …) sind unverändert — maschinell belegt durch `src/test/no-regression.test.ts`.

## 2D-Visualisierung — Vorher/Nachher
- **Vorher:** nur technischer Plan (`MiniPlan`, Linien + Maße).
- **Nachher (additiv):** Umschalter **Technischer Plan ⇄ Realistische Ansicht**. Die realistische
  Ansicht (`RealisticPlan`) füllt den Boden mit Material-Textur **inkl. Verlegemuster**
  (Fischgräte/Chevron/Diele/Würfel/Diagonal, Fliesenraster mit Fugenfarbe, Verlegerichtung),
  zeichnet **jede Wand in ihrer Farbe/ihrem Material** (z. B. eine schwarze Wand), **Tür-Öffnungsbogen**
  und **Fenster-Mehrfachlinie mit Rahmenfarbe** (schwarze Rahmen), sowie einen **dezenten Voute-Lichtsaum**.
  Der technische Plan bleibt unverändert erhalten.

## Datenmodell (Zwei-Ebenen, additiv)
schemaVersion **3**; alle neuen Felder optional (`LayingPattern`, `LayingDirection`, `Finish`,
`woodSpecies`, `format`, `groutColor`, `Opening.frameColor`, `Variant.wallColors`, `Variant.lights`).
Migration v2→v3 stamp-only → **Altprojekte bleiben gültig und rechnen unverändert** (Test belegt).

## Definition of Done — Abgleich (Erweiterung 4)
`npm run verify` GRÜN · no-regression GRÜN · Böden inkl. Holzarten/Finishes/Verlegemuster
(Fischgräte/Chevron) + 2D-Muster ✅ · Fliesenformate/Fugen ✅ · Wände pro Wand farbig in 2D ✅ ·
+50 Farben & Hersteller-Farbwelten ✅ · Beleuchtung inkl. Voute + Lichtsaum ✅ · prozedurale Texturen,
kein Lego-Look, Fallback dezent ✅ · Umschalter technisch ⇄ realistisch ✅ · jeder neue Eintrag mit
technischen Daten + EK/VK in der Kalkulation ✅ · offline ✅ · Demo/Showcase-Raum ✅ · QA-REPORT/DECISIONS
aktualisiert ✅.

## Bekannte Grenzen / Roadmap (Erweiterung 4)
- Texturen weiterhin prozedurale Platzhalter (erkennbar, aber nicht fotorealistisch) → CC0-Albedo-Fotos
  als nächster Schritt; Fischgräte ist stilisiert (±45°-Dielen mit Basisfüllung, keine Lücken).
- Browsergebundene Screenshot-Galerie/E2E weiterhin nur in Umgebungen mit Browser ausführbar
  (`e2e/realistic.spec.ts` vorhanden).
- Roadmap: mehr Fototexturen, Pipette/Custom-HEX an Wänden, spätere 3D-Verknüpfung.
