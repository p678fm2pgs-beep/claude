# DECISIONS — Entscheidungslog (Was · Warum · Alternative)

| # | Entscheidung | Warum | Alternative |
|---|---|---|---|
| 1 | Eigene leichte i18n statt react-i18next | Volle Kontrolle, null Laufzeit-Fetches, typisierte Keys, kleiner Bundle | react-i18next (mehr Gewicht, mehr Magie) |
| 2 | jsPDF statt pdfmake | Direkte Kontrolle über Layout + Font-Embedding, gut testbar | pdfmake (deklarativ, aber schwergewichtiger) |
| 3 | Zustand + manueller Dexie-Autosave | Klare Trennung UI/State/Persistenz, einfache Migrationen | Redux Toolkit (Boilerplate), Dexie-Hooks direkt im UI |
| 4 | Passwort-Hash via Web Crypto PBKDF2 (SHA-256, hohe Iterationszahl, Salt) | Komplett clientseitig, keine externe Lib, im Browser verfügbar | bcrypt.js (Bundle-Größe), argon2-wasm (Komplexität) |
| 5 | Texturen primär programmatisch generiert (Canvas, deterministisch) + CC0-Slots | Build bleibt offline & deterministisch, niemals fehlendes Bild, kein flakiger Download | Nur CC0-Download (flaky, große Repos) |
| 6 | Flächen immer live abgeleitet, nie persistiert | Keine Inkonsistenz zwischen Eingabe und gespeichertem Wert | Persistieren + Sync (Fehlerquelle) |
| 7 | Kataloge als typisierte TS-Module, im Expertenmodus per Store-Overlay editierbar | Typsicherheit + Default-Daten versioniert, User-Änderungen separat persistiert | JSON in DB (kein Typcheck) |
| 8 | Einheiten intern in cm/m² konsistent, Anzeige formatiert (DE-Komma) | Vermeidet NaN/Rundungsfehler; Parsing akzeptiert Komma & Punkt | Float-Meter überall (Rundungsdrift) |
| 9 | Rundung erst am Ende der Kostenkette | Spec-Pflicht; vermeidet kumulierte Rundungsfehler | Pro Position runden (ungenau) |
| 10 | E2E mit Playwright/Chromium, Unit mit Vitest/jsdom | Standard, schnell, gut in CI | Cypress (schwergewichtiger) |

## Erweiterung 4 (rein additiv)
| # | Entscheidung | Warum | Alternative |
|---|---|---|---|
| 11 | Zwei-Ebenen-Modell über **optionale** Felder statt neuer Pflichtfelder | Altdaten bleiben ohne Migration gültig; keine Regression | Neue Pflichtfelder (würde Altprojekte brechen) |
| 12 | schemaVersion 2→3 als stamp-only Migration | Neue Felder optional → kein Datenumbau nötig | Vollmigration (unnötig, riskanter) |
| 13 | Verlegemuster prozedural aus Dielen-Albedo erzeugt (Canvas) | Offline, deterministisch, keine externen Assets, beliebig kachelbar | Fertige Muster-Fotos (Lizenz/Größe/Flakiness) |
| 14 | `RealisticPlan` als NEUE Komponente neben `MiniPlan` | Bestehender technischer Plan bleibt 1:1 erhalten (additiv) | MiniPlan umbauen (Regressionsrisiko) |
| 15 | Beleuchtung als eigener Katalog + `Variant.lights` | Saubere Trennung, additiv in Kalkulation | In Möbel mischen (unsauber) |

## three.js — 3D-Raumansicht (additiv)
| # | Entscheidung | Warum | Alternative |
|---|---|---|---|
| 16 | three.js (MIT) für die 3D-Ansicht | De-facto-Standard für WebGL, lokal bündelbar, offline | eigenes WebGL (Aufwand), babylon.js (schwerer) |
| 17 | `Room3D` per `React.lazy` code-gesplittet | three.js (~130 KB gzip) lädt erst bei Bedarf → Initial-Bundle/2D bleibt schlank | statischer Import (vergrößert Startbundle) |
| 18 | Wand-Öffnungen über reine `computeWallPanels`-Zerlegung statt CSG | unit-testbar, performant, kein Boolean-Mesh-Aufwand | three-bvh-csg (Abhängigkeit, langsamer) |
