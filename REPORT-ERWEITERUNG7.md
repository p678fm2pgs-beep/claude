# ERWEITERUNG 7 — „PLANUNGS-PROFI-AUSBAU" · Abschlussbericht

Branch: `claude/haven-atelier-build-37c8rb` · Backup: Tag `vor-erweiterung7` + `/backup-vor-erweiterung7/`
Prüfstand bei Abgabe: **TypeScript strict, ESLint, Vitest (242 Tests in 27 Dateien), Production-Build — alles grün.**
Alle Bestandstests (Regressionsschutz, Mapping/Asset/Unterschied, Integrität) unverändert grün.

## Meilensteine (je eigener Commit, jeweils verify-grün)

| MS | Inhalt |
| --- | --- |
| W0 | Sicherung (Tag + Backup-Kopie), PLAN-ERWEITERUNG7.md, DECISIONS |
| W1+W3 | 6 Tür-Typen (Dreh/Schiebe/Doppelflügel/Durchgang/Pocket/Falt) + 4 Fenster-Typen mit korrekten Architektursymbolen (eine Symbol-Quelle `planSymbols.ts` für Editor UND PDF); Anschlag DIN links/rechts + Innen/Außen mit Ein-Klick-„Spiegeln"; Öffnungsbogen korrekt im Plan; Standardmaße 76/88,5/101; Brüstungs-Schnellwerte 0/60/85/90/110; Flügel 1–3 + Sprossen — alles wirkt in Plan UND 3D (Türblatt hängt richtig, leicht geöffnet; Schiebetür-Ebene VOR der Wand; Durchgang ohne Blatt) |
| W2 | **Kern-Interaktion**: Tür/Fenster gedrückt ziehen → gleitet NUR entlang der Wand (Projektion auf die Wandachse), Live-Eckmaße laufen mit, Einrasten (Wandmitte/10 cm, Alt = 1 cm), Kollisionsschutz mit sanftem Stopp, Wand-Wechsel mit Gold-Vorschau, klickbare Maßzahlen → exakte Eingabe („50 cm zur Ecke"), Duplizieren (Kopie am Cursor, Taste D), Touch per Long-Press, ein Undo-Schritt pro Zug |
| W4 | freies Wand-Werkzeug: Live-Meter groß am Cursor + Winkel, Snapping 0/45/90° (Shift frei) + Ecken/Wandmitten/Raster, Ziffern + Enter = exakte Länge, Kettenmodus; Wand-Eigenschaften (11,5/17,5/24/36,5 cm; massiv/Trockenbau/halbhoch 90–150 cm — in 3D korrekt niedriger; „tragend" mit Warnung); **Raumteilung** per Dialog → zwei Räume mit eigenen Flächen/Kalkulationen, Öffnungen wandern korrekt |
| W5 | Wand **teilen** (Klickpunkt; Öffnungen bleiben auf ihrem Segment, Eigenschaften vererbt) und **löschen** (Dialog nennt enthaltene Öffnungen, rote Zusatzwarnung bei tragend); EIN zentraler wallIndex-Remapper für Öffnungen/Wandfarben/Materialien/Licht; **Durchbruch** als dritte Öffnungsart (Drag wie Türen, offenes Plansymbol, 3D ohne Blatt, senkt die Wandfläche) |
| W6 | Raum-Etikett (Name · m² · Umfang) im Flächenschwerpunkt, Doppelklick = umbenennen; aufklappbare **Raumliste** mit Summen; **Messwerkzeug**: A→B, rastet an Ecken/Öffnungen, frei diagonal, mehrere gleichzeitig, ⊕ = „im Plan behalten" (→ Aufmaß-PDF), einzeln/alle löschbar |
| W7 | dezenter **Nordpfeil** (Drag-drehbar, Gradzahl per Doppelklick; Tageslicht-3D folgt der Ausrichtung); **Raster** (50→25 cm) + **Lineale** mit Cursor-Markern (nur technische Ansicht); **Aufmaß-PDF**: maßstäblich (1:50…1:200, angegeben), Maßketten, Öffnungs-Tabelle mit Typ/Anschlag/innen-außen/Maßen/Brüstung/Eck-Abständen, Innenwände, behaltene Messungen, Nordpfeil, Raumliste mit Summen — OHNE Preise |
| W8 | Onboarding-Overlay + Kürzel-Übersicht (W/M/D/Entf/Esc/Alt/Shift, überspringbar, merkt sich Gesehen-Status), Tooltips auf allen Werkzeugen, Berichte |

## Konsistenz-Pflicht — Nachweis (dauerhafte Test-Suite `konsistenz.test.ts`, 29 Tests)

- Innenwand einziehen → Netto-Wandfläche **+2 × L × H** und Raumpreis steigt; Wand löschen → **exakt** der alte Preis.
- Halbhohe Wand zählt beidseitig mit eigener Höhe.
- Tür verschieben → Eckmaße ändern sich, Flächen bleiben identisch.
- Durchbruch → Wandfläche sinkt genau um sein Öffnungsmaß (läuft durch dieselbe Kalkulation).
- Wand teilen → Flächen unverändert, Öffnungen auf richtigem Segment, Eigenschaften vererbt.
- Wand löschen → Verweise (Farben/Materialien/Licht) zentral remappt, auch im Umlauf-Fall; Dreieck verweigert.
- Raumteilung → Teilflächen summieren sich exakt zur Ausgangsfläche.
- **Altpläne ohne neue Felder → bitgleiche Werte wie vor Erweiterung 7** (kein Migrationszwang).

## Ehernes Gesetz — Nachweis

- Alle neuen Datenfelder optional; `MiniPlan` (Karten/Boards/Alt-PDF) unangetastet, der interaktive `PlanEditor` ersetzt NUR die technische Ansicht im Raum-Editor.
- Material-Mapping, Kataloge, Signature Looks, Kalkulation, Exporte, 3D-Pipeline: unverändert; einzige 3D-Zusätze sind parametrisierte Öffnungsbauteile, Innenwand-Boxen und die Tageslicht-Nordausrichtung.
- Undo/Redo deckt alles Neue ab (Snapshots sichern seit W5 zusätzlich die Varianten).

## Bewusste Entscheidungen (Auszug, vollständig in DECISIONS.md)

- Raumteilung nur per bestätigtem Dialog; Möbel/Gewerke bleiben beim Ursprungsraum, Farben/Materialien werden kopiert; wandgebundene Zuordnungen werden zurückgesetzt (Dialog sagt das ausdrücklich; Rückweg: zweiten Raum löschen).
- „Wand löschen" bei Umriss-Wänden = Verschmelzen mit der Folgewand (Ein-Polygon-Modell); Raum-Verschmelzen zweier getrennter Räume ist in diesem Modell nicht sinnvoll und bewusst nicht gebaut.
- Exakte Längeneingabe: Werte ≤ 20 werden als Meter, größere als cm interpretiert.

## Grenzen (dokumentiert, kein Bug)

- **Screenshots/Demo-Klickstrecke** (`/qa/erweiterung7/`): in der Sandbox ist kein Browser installierbar; die E2E-Specs liegen in `/e2e` (lokal: `npm run e2e:install && npm run e2e`). Ersatz-Nachweis: 42 neue Unit-/Konsistenz-Tests über die gesamte Editor-Geometrie.
- Onboarding-Overlay erscheint einmalig je Browser (localStorage) und ist jederzeit über „?" wieder aufrufbar.
