# PLAN — ERWEITERUNG 8 „TERMIN-, EINRICHTUNGS- & ABSCHLUSS-AUSBAU"

Backup: Tag `vor-erweiterung8` + `/backup-vor-erweiterung8/`. Rein additiv.

## 1. Datenmodell (alle Felder OPTIONAL → Altdaten bleiben gültig)

```ts
// Platziertes Einrichtungsobjekt (T1/T2) — Variant.placed?: PlacedObject[]
PlacedObject {
  id, typeId (FurnitureType-ID | 'custom' | 'bestand'), label?,
  x, y (cm, Mittelpunkt), rotationDeg,
  widthCm, depthCm, heightCm,
  shape: 'rect'|'rund'|'oval'|'lform'|'poly',
  l2?: { widthCm, depthCm },        // zweiter L-Schenkel
  poly?: Point[],                    // Sonderform, relativ zum Mittelpunkt
  tier, layer?: 'teppich'|'moebel', bestand?: boolean,
  segments?: { pos: 0..n, kind: 'spuele'|'kochfeld'|'backofen'|'kuehlschrank'|'geschirrspueler'|'dunstabzug' }[],
  finishId?: string                  // Material-/Farbvariante
}
// Elektro (T3) — Variant.electro?: ElectroItem[]
ElectroItem { id, kind: 'steckdose1'|'steckdose2'|'steckdose3'|'schalter'|'wechsel'|'doppel'|
  'deckenauslass'|'wandauslass'|'netzwerk'|'tv'|'herd', wallIndex?, offsetCm?, x?, y?, heightCm? }
// Heizung (T4) — Variant.heatZones?: { id, poly: Point[] }[] (FBH), Heizkörper = PlacedObject-Typen
// Pins (T6) — Room.pins?: { id, x, y, category, text, photo?, done? }[]
// Freigabe (T8) — Project.approvals?: { id, variantId, roomStandHash?, signaturePng, timestamp, sumLabel }[]
// Inspiration (T10) — Project.inspiration?: { id, dataUrl, note, fav }[]
// Laufwege-Ignorieren (T5) — Project.dismissedHints?: string[] (stabile Hinweis-Schlüssel)
// FurnitureType (Katalog, T2 additiv erweitert): + defaultW/D/H, minW/maxW …, shape-Fähigkeiten,
//   category ('schrank'|'sofa'|…|'kamin'|'heizkoerper'|'teppich'|'spiegel'|'treppe'|'kueche'|'bad'),
//   wallDock?: boolean (Heizkörper/Wandkamin/Wandspiegel/Einbauschrank), perMeter?: boolean
```

## 2. Architektur

- **Reine Logik** `src/lib/objects.ts` (unit-getestet): Objekt-Footprint als Polygon je Form
  (rect/rund/oval/L/poly, rotiert), Abstände Objekt↔Wand + Objekt↔Objekt (min. Distanz der
  Polygone), Einrasten (Wand bündig/5 cm, Nachbar bündig/ausgerichtet), Wanddocking
  (Entlang-der-Wand-Logik aus E7 wiederverwendet), Skalier-Griffe-Mathematik,
  Warn-Schwelle < 60 cm, maßabhängige Menge (lfm-Typen × Breite).
- **ObjectLayer** in PlanEditor (SVG): Draufsichtsymbole je Kategorie, Auswahl mit
  Eck-/Seitengriffen (groß, touch-tauglich), Drag mit Live-Abständen (Färbung < 60 cm),
  Rotation (Griff + 15°-Snap, Shift frei), Duplizieren, Ebenen (Teppich unter Möbeln),
  Eigenschaften-Panel (Maße als Zahlen + Schnellmaße, Form, Stufe, Variante).
- **3D**: parametrische Körper je Kategorie (Boxen/Zylinder/abgeleitete Formen), Kamin mit
  ruhigem Emissive-Schimmer (Sinus im vorhandenen Animate-Loop), Spiegel als heller
  Glas-Look, Treppe mit sichtbaren Stufen + Materialwahl, Küche mit Arbeitsplatte +
  Segment-Andeutungen. Kein Pipeline-Umbau — nur zusätzliche Meshes.
- **Kalkulation**: computeRoomCost erhält additiv „platzierte Einrichtung"
  (Stück bzw. lfm × Breite; `bestand` zählt NIE) + Zähler-Gruppen Elektro/Heizung
  (Preise nur, wenn Positionen existieren). Altprojekte ohne `placed` → bitgleich (Test).
- **Module**: Elektro/Heizzonen/Pins als zusätzliche PlanEditor-Werkzeuge + Ebenen-Panel;
  Vergleich/Freigabe im Lookbook-Export; Aufmaß-Modus als eigene, reduzierte Ansicht;
  Inspiration als Projekt-Tab.
- **Modi**: Beratungs-/Präsentationsmodus zeigen NIE Pins/Hinweise/EK/Margen
  (bestehende mode-Gates wiederverwenden).

## 3. Meilensteine

| MS | Inhalt | Beweis |
| --- | --- | --- |
| T1 | Maß-System: PlacedObject, Footprints, Abstände, Snapping, Griffe, Live-Warnfärbung, Panel | objects.test |
| T2 | Katalog-Ausbau (Schränke/Küche 2-stufig/Bad/Kamine/Heizkörper/Teppiche/Spiegel/Treppen), 2D-Symbole, 3D-Körper, Kalkulation | Katalog-/Kosten-Tests |
| T3 | Elektro light (docken, Zähler, Mengenliste, Küchen-Snap) | electro.test |
| T4 | FBH-Zonen (m² → Kalkulation) + Heizkörper-Zähler | heat.test |
| T5 | Laufwege-Check (still, ignorierbar, intern) | hints.test |
| T6 | Notiz-Pins (+Foto, Liste, abhaken, intern) | UI + Datenmodell-Test |
| T7 | Lookbook-Vergleichsseite mit Preis-Differenz | lookbook.test |
| T8 | Freigabe-Seite + digitale Unterschrift (Zeitstempel) | approval.test |
| T9 | Aufmaß-Modus (Touch, Autosave, Bestandsmöbel) | UI + Konsistenz |
| T10 | Inspiration (+Pipette, Kompression) | UI |
| T11 | Ebenen-Panel, Kürzel, Reports | verify gesamt |

## 4. Risiken & Selbstkritik

- Größter Brocken ist T1/T2 — deshalb strikt: ALLE Geometrie pur in objects.ts mit Tests,
  UI nur als Schale. Kollisionsprüfung als Hinweis (nie Blockade) → kein UX-Ärger.
- Kosten-Doppelzählung vermeiden: platzierte Objekte erscheinen als EIGENE Positionen;
  die bestehende Möbel-LISTE bleibt unangetastet (beide Wege sind legitim und sichtbar
  getrennt ausgewiesen; Entscheidung dokumentiert).
- Fotos/Bilder (Pins/Inspiration) als DataURL mit Kompression (Canvas, max 1280 px) —
  IndexedDB-freundlich, offline.
- Kein Browser in der Sandbox → Screenshots als dokumentierte Grenze, Ersatz Tests.
- Mehrgeschoss-Planung bewusst NICHT (Roadmap).
