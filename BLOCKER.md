# BLOCKER

## B1 — Playwright-Browser im Sandbox-Netz nicht installierbar (Umgebungsgrenze)

**Symptom**
`npx playwright install chromium` schlägt fehl:
- mit `--with-deps`: die apt-PPAs (`deadsnakes`, `ondrej/php`) liefern `403 Forbidden` /
  „repository is no longer signed" — die System-Paketquelle ist gesperrt.
- ohne `--with-deps`: `cdn.playwright.dev` ist **nicht in der Netzwerk-Allowlist**
  (`403 Host not in allowlist`). Der Browser-Binary-Download ist damit blockiert.
- Es ist **kein System-Chromium/Chrome** vorhanden (`which chromium/google-chrome` leer).

**Versuche (3)**
1. `npx playwright install chromium --with-deps` → apt-Quellen 403.
2. `npx playwright install chromium` (ohne deps) → CDN-Host nicht in Allowlist (403).
3. Suche nach vorhandenem System-Browser → keiner installiert.

**Auswirkung**
Die Playwright-**E2E-Stufe** und die **browserbasierte Screenshot-Doku** können in *dieser*
Umgebung nicht ausgeführt werden. Betroffen sind ausschließlich browsergebundene Prüfungen
(Kunden-Reise-E2E, Toter-Knopf-Scan, PDF-Größencheck > 100 KB, Persistenz-Reload, Offline-Check,
Screenshots). **Alle anderen Stufen sind grün.**

**Kompensation (umgesetzt, damit nichts „still" scheitert)**
- Die vollständigen **E2E-Specs sind geschrieben** und liegen in `/e2e`
  (`journey`, `scan`, `validation`, `persistence`, `offline`). Sie laufen unverändert, sobald ein
  Browser verfügbar ist: `npm run e2e:install && npm run e2e`.
- Es wurde ein **In-Process-Integrationstest** (`src/test/integration.test.tsx`, jsdom + fake-indexeddb)
  ergänzt, der denselben UI-Kernpfad **innerhalb von `npm run verify`** real ausführt:
  Erst-Setup → Passwort-Einmalanzeige → Freischaltung → Demo laden → Kosten (Brutto > Netto, Reserve)
  → Sprachumschaltung DE/EN → Persistenz-Roundtrip (IndexedDB).
- `npm run verify` erkennt den fehlenden Browser im Preflight und **überspringt E2E sauber mit
  klarem Hinweis** (statt rot), sodass die Pipeline aussagekräftig grün ist.

**Vorschlag**
`cdn.playwright.dev` (bzw. einen Browser-Spiegel) der Netzwerk-Allowlist hinzufügen **oder** ein
System-Chromium vorinstallieren. Danach läuft die E2E-Suite ohne Codeänderung.
