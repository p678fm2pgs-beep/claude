# PLAN — ERWEITERUNG 7 „PLANUNGS-PROFI-AUSBAU"

Backup: Tag `vor-erweiterung7` + `/backup-vor-erweiterung7/`. Rein additiv.

## 1. Datenmodell (alle Felder OPTIONAL → Altdaten bleiben ohne Migration gültig)

```ts
// Opening (erweitert):
kind: 'fenster' | 'tuer' | 'durchbruch'          // 'durchbruch' NEU (W5)
doorType?:  'dreh'|'schiebe'|'doppel'|'durchgang'|'pocket'|'falt'   // W1, default 'dreh'
windowType?: 'dreh-kipp'|'fest'|'schiebe'|'bodentief'               // W1, default 'dreh-kipp'
hinge?: 'links'|'rechts'      // DIN-Anschlag, default 'links'
opensInward?: boolean          // default true
wings?: 1|2|3                  // Fensterflügel (W3), default 1
muntins?: boolean              // Sprossen (W3), default false

// Floorplan (erweitert):
innerWalls?: InnerWall[]       // W4: freie Wände/Raumteiler
  { id, a: Point, b: Point, thicknessCm, wallType: 'massiv'|'trockenbau'|'halbhoch',
    heightCm?: number, loadbearing?: boolean }
wallProps?: Record<number, { thicknessCm?; wallType?; loadbearing? }>  // W4: Umfassungswände
measurements?: { id, a: Point, b: Point }[]   // W6: behaltene Messungen
northAngleDeg?: number                        // W7: Nordpfeil
```

Konsistenz: `deriveAreas` bezieht Innenwände ein (beidseitiger Anstrich:
2 × Länge × Höhe, halbhoch mit eigener Höhe) und `durchbruch` reduziert Wandfläche
wie jede Öffnung (läuft automatisch über `totalOpeningAreaM2`). Altpläne ohne neue
Felder liefern EXAKT die bisherigen Werte (Testpflicht).

## 2. Architektur

- **Reine Logik** in `src/lib/planEditor.ts` (unit-getestet, kein DOM):
  Projektion Punkt→Wand, `clampOpeningOffset` (Kollision + Wandenden),
  Snapping (Wandmitte, 10-cm-Raster, fein), Wand-Wechsel-Kandidat,
  `splitWall` (Polygonpunkt einfügen + wallIndex/offset-Remap aller Öffnungen),
  `removeWallVertex` (Wände verschmelzen + Remap), `splitPolygon` (Raumteilung
  durch Sehne), Innenwand-Snapping (0/45/90°, Endpunkte, Raster), Messungen.
- **Interaktiver Editor** `src/components/PlanEditor.tsx` (SVG, Pointer-Events,
  Touch: Long-Press-Drag): ersetzt die MiniPlan-Anzeige NUR in der Ansicht
  „Technisch" des Raum-Editors. MiniPlan selbst bleibt unverändert (Karten,
  Boards, PDF nutzen es weiter) → rein additiv.
- **Symbole** (`src/lib/planSymbols.ts`, pur): korrekte Architektursymbole je
  Tür-/Fenstertyp inkl. Öffnungsbogen nach Anschlag/Innen-Außen als
  SVG-Pfaddaten — von PlanEditor UND Aufmaß-PDF genutzt (eine Quelle).
- **3D**: nur `computeOpeningParts` parametrisieren (Türblatt-Seite, kein Blatt
  bei Durchgang/Durchbruch, Schiebe-Ebene vor der Wand, Flügel/Sprossen,
  Brüstung wirkt bereits); Innenwände als zusätzliche Boxen in Room3D
  (halbhoch = eigene Höhe). Pipeline unangetastet.
- **Aufmaß-PDF** `src/modules/pdf/exportAufmass.ts`: maßstäblicher Plan (1:50,
  automatisch gröber wenn nötig), Maßketten, Öffnungs-Tabelle (Typ, Anschlag,
  Maße, Brüstung), Raumliste mit Summen, behaltene Messungen, Nordpfeil,
  OHNE Preise.

## 3. Interaktionsdesign (W2-Kern)

- Öffnung greifen (pointerdown auf Symbol) → Drag projiziert Mausposition auf
  die Wandachse (`clampOpeningOffset` hält sie IMMER auf der Wand), Live-Maße zu
  beiden Ecken laufen mit, sanftes Einrasten Wandmitte + 10-cm-Raster
  (Alt = fein 1 cm). Nähe zu anderer Wand (< 40 cm Weltabstand) → Vorschau-
  Hervorhebung, Loslassen wechselt die Wand. Auswahl zeigt zwei klickbare
  Maßzahlen → Direkteingabe. Duplizieren: Kopie folgt dem Cursor, Klick setzt.
- Wand-Werkzeug: Klick 1 setzt Start, Cursor zieht mit Live-Länge („3,42 m")
  + Winkel; Snapping 0/45/90 (Shift = frei), Ecken/Wandmitten/Raster; Tippen
  einer Zahl + Enter = exakte Länge in Zugrichtung; Klick 2 setzt; Kettenmodus
  bis Esc/Doppelklick. Kreuzt die Wand das Polygon vollständig → Dialog
  „Raum teilen?" → zwei Räume (Flächen/Kalkulation je Teilraum).
- Messwerkzeug: A→B, snappt an Ecken/Öffnungen, mehrere gleichzeitig,
  „behalten" persistiert in `measurements`.

## 4. Risiken & Selbstkritik

- **wallIndex-Verschiebung** bei Teilen/Löschen von Wänden: Öffnungen,
  `wallColors` und `MaterialSelection.wallIndex` hängen daran → EIN zentraler
  Remapper in planEditor.ts, der ALLE drei Verweise konsistent verschiebt;
  eigener Konsistenz-Test.
- **Raumteilung** ist die riskanteste Operation → als expliziter, bestätigter
  Schritt (Dialog), nie implizit; Undo über bestehende Historie; Variante wird
  tief kopiert, Möbel bleiben beim Ursprungsraum (dokumentierte Entscheidung).
- **Touch**: Long-Press (300 ms) statt sofortigem Drag, damit Scrollen möglich
  bleibt; große Griffe (12 px+).
- **Kein Browser in der Sandbox**: Screenshots/Demo-Abnahme W8 werden als
  dokumentierte Grenze geführt; stattdessen dichte Unit-/Konsistenz-Tests.

## 5. Meilensteine & Beweise

| MS | Inhalt | Beweis |
| --- | --- | --- |
| W1 | Tür-/Fenster-Typen, Anschlag, Spiegeln, Symbole, 3D-Übernahme | planSymbols/openings3d-Tests |
| W2 | Drag entlang Wand, Live-Eckmaße, exakte Eingabe, Wandwechsel, Duplizieren | clamp/project/snap-Tests |
| W3 | Brüstung-Schnellwerte, Flügel, Sprossen (Plan+3D) | openings3d-Tests |
| W4 | Wand-Werkzeug, Live-Meter, Wand-Eigenschaften, halbhoch, Raumteilung | innerWalls/deriveAreas/split-Tests |
| W5 | Wand teilen/löschen (+Dialoge), Durchbruch | Remap-/Konsistenz-Tests |
| W6 | Raum-Etiketten, Raumliste, Messwerkzeug | measurement-Tests |
| W7 | Nordpfeil, Raster/Lineale, Aufmaß-PDF | exportAufmass-Test |
| W8 | Kürzel, Tooltips, QA/FINAL-Report | verify + Konsistenz-Suite |

Konsistenz-Test (Pflicht): Innenwand einziehen → Wandfläche + Preis steigen;
Wand löschen → exakt zurück; Tür verschieben → Eckmaße ändern sich, Flächen
bleiben; Durchbruch → Wandfläche sinkt; Altplan → deriveAreas unverändert.
