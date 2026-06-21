# LICENSES & Asset-Herkunft

## Schriften (lokal eingebettet, offline)

| Datei | Schrift | Quelle | Lizenz |
|---|---|---|---|
| `public/fonts/cormorant-1.woff2`, `cormorant-2.woff2` | Cormorant Garamond (500/600) | Google Fonts | SIL Open Font License 1.1 |
| `public/fonts/montserrat-1…4.woff2` | Montserrat (300/400/500/600) | Google Fonts | SIL Open Font License 1.1 |

Beide Familien stehen unter der **SIL OFL 1.1** und dürfen eingebettet und mit der Anwendung
ausgeliefert werden. Die Dateien liegen lokal in `public/fonts/` — zur Laufzeit erfolgt kein Fetch.

## Icons

- **lucide-react** — ISC License. Lokal als npm-Abhängigkeit gebündelt, kein CDN.

## Material-Texturen

Alle Material-Texturen werden **programmatisch zur Laufzeit erzeugt** (`src/lib/texture.ts`,
deterministisches Canvas-Rauschen/Gradient im jeweiligen Materialton). Das erfüllt die
**Fallback-Pflicht**: Die App zeigt nie ein leeres Bild und ist nicht von externen Downloads abhängig.

> **Status: Platzhalter — durch Musterfoto ersetzen.**
> Jede der aktuell generierten Texturen ist ein hochwertiger, neutraler **Platzhalter**.
> Für die finale Beratung sollten echte CC0-Musterfotos (z. B. von Poly Haven / ambientCG,
> beide CC0) lokal abgelegt und je Material in `src/data/materials.ts` referenziert werden.
> Diese Tabelle ist dann je Datei um „Quelle + Lizenz" zu ergänzen.

| Material-Kategorie | Aktueller Stand | Empfohlene CC0-Quelle (optional) |
|---|---|---|
| Böden (Parkett, Fliesen, Naturstein, Vinyl, …) | Platzhalter (generiert) | Poly Haven / ambientCG (CC0) |
| Wände (Putz, Tadelakt, Tapete, Paneele, …) | Platzhalter (generiert) | ambientCG (CC0) |
| Decken | Platzhalter (generiert) | ambientCG (CC0) |
| Textilien & Metalle | Platzhalter (generiert) | ambientCG (CC0) |

## Hinweis Farbcodes

RAL-Classic- und NCS-Codes in `src/data/colors.ts` sind **Annäherungen** zur Orientierung.
Verbindlich ist ausschließlich der physische Originalfarbton bzw. das Musterstück.

## Erweiterung 4 — Verlegemuster & realistische 2D-Ansicht

Die „Realistische Ansicht" (`src/components/RealisticPlan.tsx`) füllt die Bodenfläche mit
**prozedural erzeugten** Verlegemustern (`src/lib/texture.ts`: Diele, Fischgräte, Chevron, Würfel/
Flechtmuster, Diagonal, Fliesenraster mit Fugen). Alles offline & deterministisch, keine externen
Laufzeit-Requests. Status weiterhin: **Platzhalter-Qualität** (erkennbar Holz/Stein/Fliese/Fischgräte),
fotorealistische CC0-Albedo-Texturen (Poly Haven / ambientCG, CC0) sind ein dokumentierter Roadmap-Schritt
und können je Material in `src/data/materials.ts` hinterlegt werden.

RAL/NCS sowie Hersteller-Codes (Farrow & Ball, Little Greene, Caparol, Alpina) in
`src/data/colors.ts` sind **Annäherungen** — verbindlich nur der Original-Farbfächer des Herstellers.

## three.js (3D-Raumansicht)

- **three.js** (`three`, `@types/three`) — **MIT License** (© three.js authors / mrdoob).
  Lokal als npm-Abhängigkeit gebündelt, kein CDN/Laufzeit-Request. Wird per Code-Splitting erst
  geladen, wenn die 3D-Ansicht geöffnet wird. WebGL-Canvas, offline lauffähig.

## Erweiterung 5 — 3D-Realismus

- **three.js `RoomEnvironment`** (MIT, Teil von three.js) — prozedural erzeugtes Studio-Environment für
  Image-Based Lighting; **kein externer HDRI-Download**, vollständig offline.
- Fenster-Glas: `MeshPhysicalMaterial` (transmission) — stilisierte Echtzeit-Verglasung.
- Hinweis Visualisierung: Die 3D-Ansicht ist eine **stilisierte Echtzeit-Visualisierung**; Farben/
  Materialien sind bildschirmabhängig — verbindlich sind ausschließlich die Originalmuster (RAL/NCS).
