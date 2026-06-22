# ROLLBACK-OPTIONEN — verfügbare Wiederherstellungspunkte

Stand der Untersuchung: 2026-06-22. Git-History + Tags ausgewertet.

## Sicherung des aktuellen (kaputten) Stands
- Tag **`broken-3d-2026-06-22`** → `8e6cc60` (kompletter 3D-Stand inkl. Fix-Versuche).
  Nichts geht verloren; jederzeit wieder einsehbar.

## Commit-/Tag-Landschaft (neueste zuerst)
| Commit | Inhalt | 3D? | Eignung als Zielstand |
|---|---|---|---|
| `8e6cc60` | Fix 2 Boden-Parität | ja (kaputt) | nein (= kaputter Stand) |
| `08b9b20` | Fix Material-Darstellung | ja (kaputt) | nein |
| `aec6780` | Erweiterung 5 · 3D-Realismus Teil 1 | ja (Umbau) | nein (Beginn des Problems) |
| `7d91184` | 3D-Raumansicht three.js (= Tag `backup-vor-erweiterung5`) | **ja (Basis-3D)** | nein — enthält bereits 3D |
| **`ce0a98c`** | **Erweiterung 4 · Katalog- & 2D-Ausbau** | **nein** | **★ GEWÄHLT** |
| `4a2804e` | Erweiterung 4 · A0 Datenmodell | nein | Alternative (älter) |
| `003338c` | macOS-Starthilfe (= Tag `backup-vor-erweiterung4`) | nein | Alternative (vor Katalog-Ausbau) |
| `0da2a5a` | Vollausbau M0–M7 | nein | Alternative (Basis) |

## Wichtiger Hinweis zu den Tag-Namen
- `backup-vor-erweiterung5` zeigt auf `7d91184` — dieser Stand enthält bereits die **Basis-3D-Ansicht**.
  Er ist also **nicht** „ohne 3D". Der wahre „vor dem 3D"-Stand ist dessen Vorgänger `ce0a98c`.
- `backup-vor-erweiterung4` zeigt auf `003338c` (noch **ohne** die Katalog-Erweiterungen).

## Gewählter Zielstand: `ce0a98c`
**Begründung:** Neuester Stand, der ALLE Katalog-Erweiterungen (Erweiterung 4: 85 Materialien,
170 Farbtöne, Beleuchtung, 2D „Realistische Ansicht") enthält, aber **kein three.js / kein 3D** —
exakt „der reine 2D-/Katalog-Stand vor dem 3D-Umbau". War zum Zeitpunkt des Commits `npm run verify` GRÜN.

**Alternative, falls auch dieser Stand Probleme zeigt:** `003338c` (`backup-vor-erweiterung4`) —
stabiler Kernstand vor den Katalog-Erweiterungen.
