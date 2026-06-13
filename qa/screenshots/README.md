# Screenshot-Doku

Die Screenshot-Galerie (Kernscreens je Meilenstein, Dark-UI + helle Boardfläche, DE/EN,
Desktop 1440 + Laptop 1280) wird von Playwright erzeugt und in `qa/screenshots/M[x]/` abgelegt.

**Aktueller Stand:** In dieser Ausführungsumgebung ist kein Browser installierbar
(Browser-Download durch das Sandbox-Netz gesperrt — siehe `../../BLOCKER.md`, B1). Daher konnten
die Screenshots hier nicht gerendert werden.

So werden sie in einer Umgebung mit Browser erzeugt:

```bash
npm run e2e:install
npm run e2e            # die Journey-Specs durchlaufen alle Kernscreens
```

Die E2E-Specs in `/e2e` durchlaufen die komplette Kunden-Reise in **DE und EN** und können um
`page.screenshot(...)` je Screen ergänzt werden, um die Galerie automatisch zu füllen.
