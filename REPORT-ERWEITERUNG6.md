# ERWEITERUNG 6 — „SIGNATURE-AUSBAU" · Abschlussbericht

Branch: `claude/haven-atelier-build-37c8rb` · Backup-Tag: `vor-erweiterung6`
Prüfstand bei Abgabe: **TypeScript strict, ESLint, Vitest (182 Tests in 25 Dateien), Production-Build — alles grün.**

## Was umgesetzt wurde (je Schritt eigener Commit, jeweils verify-grün)

| Schritt | Inhalt | Commit |
| --- | --- | --- |
| S0 | Backup-Tag `vor-erweiterung6`, Baselines, Regressionsschutz aktiv | (Tag) |
| S1 | **Wurzel-Fix Material-Zuordnung**: EINE Resolver-Schicht (`materialResolve.ts`) für 2D & 3D; letzte Wahl gewinnt; ehrlicher Fallback (Materialgrundton + `console.warn`, nie heller Fantasie-Default); Beweise: Mapping-Tabelle 27 IDs, Asset-Existenz, visuelle Differenz | `7c84b7e` |
| S7 (0/a/b/d/e) | 3D nur in einzeln verifizierten Mini-Schritten: einfache korrekte 3D-Ansicht → sRGB+ACES → weiche Schatten → gefüllte Fenster/Türen → Decke einblendbar + verdeckende Wände transparent | `a32c0bb`…`8a2fd88` |
| S3 | Boden-/Wand-Auswahl als klarer **Zwei-Schritt-Flow** (1 Material → 2 Ausführung: Finish/Muster/Richtung/Format/Fuge) mit „Aktuelle Wahl"-Leiste, Live-Vorschau, Preis, Favoriten & zuletzt verwendet | `a3ea7ed` |
| S4/S5 | **Farb-Explosion**: RAL Classic komplett (213), NCS-Auswahl (70), kuratierte HAVEN-Töne 170 → **510**, **5 Hersteller-Welten** (+ Schöner Wohnen); `findTone` löst RAL-/NCS-/Hersteller-IDs überall auf; **Farb-Browser** (Tabs, Gruppen, Suche Name/Code/HEX, Filter Unterton/LRV, Favoriten, Vergleich 2–4, virtualisiert) | `4283e81` |
| S2 | **Fehler-Sweep** → `FIXLOG.md` + dauerhafter Integritäts-Schild (`integrity-sweep.test.ts`) | `6f263f5` |
| S8 | **8 HAVEN Signature Looks** (№ 1 Stille Mitte … № 8 Nachtblau-Salon), One-Click mit Bestätigungsdialog; Anwendung schont Decke/Möbel/Gewerke/Notizen, idempotent | `f4a754c` |
| S9 | **Digitales Musterbrett**: Canvas-Board mit echten Katalog-Texturen + Farb-Chips (RAL/NCS/LRV), live, PNG-Export | `0ad052e` |
| S10 | **Live-Budget-Regler**: Standard/Premium/Luxus, animierter Brutto-Preis (rAF), Spanne sichtbar, Übernahme nur nach Bestätigung; Original bleibt bei Vorschau unberührt | `38cbec1` |
| S11 | **Material-Nahaufnahme + Material-Pass**: Pflege/Haltbarkeit/Eignung/Nachhaltigkeit (Score 1–5, de/en) — Eignung wortgetreu aus Katalogdaten, Rest gekennzeichnete Einschätzung | `4e3a772` |
| S12 | **Still-Render (PNG)** aus der 3D-Ansicht, **Tageslicht**-Modus, **Lookbook-PDF** (editorial, kundensicher), **Musterbestell-Liste** (PDF-Teil im Lookbook + CSV mit BOM) | `b42d46b` |

Bewusst NICHT gebaut (laut Auftrag): Vorher-Nachher-Foto-Upload, Raumvorlagen-Bibliothek.

## Ehernes Gesetz — Nachweis

- **Rein additiv**: Kein bestehender Datensatz verändert; Zusatztöne werden angehängt
  (weiss-11 …), bestehende IDs/Werte durch `no-regression.test.ts` + Stichproben festgenagelt.
- **Kundenmodus**: Lookbook/Musterliste enthalten keinerlei EK/Marge (testbelegt: CSV ohne €/EK).
- **Offline**: alles lokal (three.js, jsPDF gebündelt); keine Netzabhängigkeit.
- **Rollback-fähig**: jeder Schritt einzeln committet; Backup-Tag `vor-erweiterung6`.

## S6 (Fotorealistische Texturen) — Status: dokumentierte Grenze

Die Sandbox erlaubt keine Downloads (CC0-Foto-Alben wie ambientCG sind nicht erreichbar).
Umgesetzt ist stattdessen die bestehende **prozedurale Textur-Pipeline** in bester Qualität
(Painter je Materialgruppe, Verlegemuster, Fugenbild), identisch in Katalog, 2D und 3D.

**Roadmap für den Foto-Pass (lokal ausführbar):**
1. CC0-Albedos (ambientCG/PolyHaven, 1K JPG) nach `public/textures/<materialId>.jpg` legen.
2. `Texture` um optionales Feld `photo?: string` erweitern (rein additiv).
3. `drawTexture`/`fillFloorSurface`: wenn `photo` vorhanden und ladbar → Foto kacheln,
   sonst unverändert prozedural (automatischer, ehrlicher Fallback).
4. Lizenznachweis je Datei in `LICENSES.md` ergänzen.

## Bekannte Grenzen

- **E2E/Screenshots**: kein Playwright-Browser in der Sandbox installierbar; Specs liegen in
  `/e2e` (`npm run e2e:install && npm run e2e` lokal). Deshalb keine Screenshots unter `/qa/erweiterung6/`.
- **Farb-Treue**: alle HEX-Werte (RAL/NCS/Hersteller) sind Bildschirm-Annäherungen;
  Hinweis „verbindlich nur Originalfächer/-muster" ist in UI, Musterbrett und PDF eingebaut.

## Prüfprotokoll (Abgabe)

- `npm run verify`: Typecheck ✔ · ESLint ✔ · Vitest ✔ (182 Tests) · Build ✔
- Neue dauerhafte Beweis-Suiten: `colorCatalog` (19), `integrity-sweep` (5),
  `signatureLooks` (7), `musterbrett` (5), `budget` (3), `materialPass` (4), `sampleList` (6).
- `no-regression.test.ts`: unverändert grün (Baselines nur nach oben bewegt).
