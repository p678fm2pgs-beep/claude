# ERWEITERUNG 8 — „TERMIN-, EINRICHTUNGS- & ABSCHLUSS-AUSBAU" · Abschlussbericht

Branch: `claude/haven-atelier-build-37c8rb` · Backup: Tag `vor-erweiterung8` + `/backup-vor-erweiterung8/`
Prüfstand bei Abgabe: **TypeScript strict, ESLint, Vitest (299 Tests in 35 Dateien), Production-Build — alles grün.**
Alle Bestandstests (Regressionsschutz, Mapping/Asset/Unterschied, Konsistenz E7) unverändert grün. Katalog nur gewachsen (Möbel 18 → 56).

## Meilensteine (je eigener Commit, jeweils verify-grün)

| MS | Inhalt |
| --- | --- |
| T0 | Sicherung (Tag + Backup), PLAN-ERWEITERUNG8.md |
| T1 | **Maß-System** (`objects.ts`, 20 Tests): Footprints je Form (rect/rund/oval/L/frei, rotiert), Live-Abstände Objekt↔Wand + Objekt↔Nachbar (Warnschwelle 60 cm), Einrasten (Wand bündig/5 cm, Nachbar-Kanten), Skalier-Griffe (8 + Rotation 15°), lfm-Menge. UI: Maße als Zahlen **und** Griffe synchron, „Möbelmaße anzeigen", Live-Warnfärbung |
| T2 | **Katalog-Ausbau** (`furniturePlus.ts`, +38 Typen, 12 Tests): Schränke inkl. Einbau/Eck/begehbar/Bücherwand, Küchen-Baukasten (Zeile/L/U/Insel/Theke + Ausstattungs-Segmente Spüle/Kochfeld/Backofen/Kühlschrank/Geschirrspüler/Dunstabzug), Bad, **Kamine** (5 Arten, 3D-Schimmer), **Heizkörper** (5 Typen wanddockend), **Teppiche** (Ebene unter Möbeln), **Spiegel** (Wand+Stand), **Treppen** (gerade/L/U/Spindel mit Laufpfeil+Schnittlinie). 2D-Symbole (`objectSymbols.ts`, 6 Tests), parametrische 3D-Körper; Maße → Mengenliste/Kalkulation |
| T3 | **Elektro light** (`electroSymbols.ts`, 3 Tests): 11 Symbolarten, Wanddocking, Zähler + Mengenlisten-Gruppe (0-Preise ohne Preisposition), Küchen-Herd-Snap |
| T4 | **FBH-Zonen**: Polygon aufziehen mit Live-m² → Kalkulation über bestehende FBH-Position |
| T5 | **Laufwege-Check** (`wayfinding.ts`, 7 Tests): Durchgang < 60, Tür/Fenster blockiert, Bett/Sofa ohne Zugang, Treppe verstellt; dezent, ignorierbar (stabile Schlüssel → `dismissedHints`), Ebene schaltbar, Präsentationsmodus NIE |
| T6 | **Notiz-Pins**: Kategorie (Hinweis/Frage/Mangel/ToDo), Text, Foto (komprimiert), Abhaken; NUR Expertenmodus |
| T7 | **Varianten-Vergleich** (`variantCompare.ts`, 6 Tests) als Lookbook-Doppelseite mit Kernmaterialien + prominenter Preis-Differenz (Kunde VK, Experte EK) |
| T8 | **Freigabe-Seite** + digitale Unterschrift (`ApprovalDialog`, Canvas-Signatur mit Zeitstempel → `approvals`, im Lookbook eingebettet), Rechtshinweis sichtbar |
| T9 | **Aufmaß-Modus**: Vor-Ort-Panel (Expertenmodus) mit großen Touch-Buttons — Raumfotos (komprimiert), Bestandsmöbel-Schnellerfassung (zählt nicht in die Kalkulation), Autosave-Bestätigung; nahtlos in denselben Projektdaten weiterbearbeitbar |
| T10 | **Inspiration** (`InspirationModule`): Referenzbilder (Drag&Drop, komprimiert), Notizen, Favoriten, **Farb-Pipette** (`nearestTones`, 4 Tests) direkt auf dem Bild → nächste HAVEN-Töne; Tab nur im Expertenmodus |
| T11 | Ebenen-Panel (Elektro/Heizung/Pins/Hinweise einzeln schaltbar), Kürzel (E/W/M/D), Onboarding ergänzt, Elektro+FBH im Aufmaß-PDF, Berichte |

## Ehernes Gesetz — Nachweis

- **Rein additiv**: alle neuen Datenfelder optional (Altprojekte bitgleich — Kosten-Test belegt); der bestehende Möbelkatalog wurde nur ERWEITERT (Bestands-Preise/IDs unverändert, testbelegt); `MiniPlan`, Material-Mapping, Signature Looks, bestehende Exporte, 3D-Pipeline unangetastet.
- **Kunden-/Präsentationsmodus** zeigen NIE EK/Marge/Pins/Hinweise/Inspiration (mode-Gates, testbar über `internalAllowed`).
- **Kalkulation**: platzierte Objekte als eigene Positionen mit Maß (lfm × Breite), Bestand zählt NIE, FBH-Zonen-m² + Elektro-Zähler additiv — Altprojekte ohne `placed`/`electro`/`heatZones` rechnen bitgleich.
- **Offline**: Fotos/Signaturen als komprimierte DataURLs (Canvas, kein externer Dienst); Store persistiert nach jeder Eingabe (IndexedDB).

## Bewusste Entscheidungen (Auszug, vollständig in DECISIONS.md)

- Platzierte Einrichtung und die bestehende Möbel-LISTE sind zwei legitime, getrennt ausgewiesene Wege — keine Doppelzählung, beide sichtbar.
- Kollision/Enge ist immer Hinweis, nie Blockade (kein UX-Ärger im Kundengespräch).
- Treppen bewusst als „Platzhalter mit echtem Platzbedarf" (Hinweis-Tag Fachbetrieb); Mehrgeschoss-Planung NICHT gebaut → Roadmap.
- Bild-Kompression max. 1280 px (Pins/Inspiration) bzw. 800 px (Pin-Thumbnails).

## Grenzen (dokumentiert, kein Bug)

- **Screenshots/Demo-Klickstrecke** (`/qa/erweiterung8/`): in der Sandbox kein Browser installierbar; E2E-Specs in `/e2e` (lokal `npm run e2e:install && npm run e2e`). Ersatznachweis: 58 neue Unit-Tests über die gesamte neue Geometrie/Logik.

## Roadmap

- Mehrgeschoss-/Treppen-Vollplanung (bewusst ausgelassen).
- Fotorealistische Möbel-Modelle (.glb) als Option neben den parametrischen Körpern.
- Elektro-Preispositionen im Preis-Manager (aktuell ehrliche 0-Preise, reine Mengenliste).
