# A-Z Tor & Zaun – Firmen-Webseite + barrierefreier Shop (Prototyp)

Moderne, rechtlich strukturierte und barrierefreie Webseite mit integriertem Online-Shop für die
**A-Z Tor & Zaun GmbH**, Hattingen. Umgesetzt als eigenständige React-Anwendung (React 18 + Vite +
TypeScript strict + TailwindCSS) – maximale Kontrolle über Barrierefreiheit (BFSG/WCAG 2.1 AA) und Design.

> Dieser Ordner ist ein **eigenständiges Projekt** und unabhängig vom übrigen Repository.

## Schnellstart

```bash
cd tor-zaun-website
npm install
npm run dev        # Entwicklungsserver (Vite)
npm run build      # Typecheck (tsc) + Production-Build
npm run preview    # Production-Build lokal ansehen
```

## Datenstand & Quellen

Die Firmendaten stammen aus **öffentlich zugänglichen Verzeichnissen** (Handelsregister-Eintrag,
Branchenbücher), da die Live-Webseite aus der Build-Umgebung technisch nicht abrufbar war.

| Verifiziert | Quelle |
|---|---|
| A-Z Tor & Zaun GmbH, Am Beul 33, 45525 Hattingen | Branchenbücher |
| Tel. 02324 6857200 · HRB 16992 | Branchenbücher / Handelsregister |
| Produkte (Doppelstabmatten, Schiebetore, Drehtore, Sichtschutz …) | öffentliche Firmendarstellung |

**Nicht verifizierte, rechtlich relevante Angaben** (USt-IdNr., Geschäftsführer, Registergericht,
E-Mail, Preise, Mitarbeiterzahl) sind im Code und auf den Seiten konsequent mit
`[BITTE AUSFÜLLEN: …]` markiert und **wurden nicht erfunden**. Preise sind Beispielwerte.

## Was ist umgesetzt

**Seiten:** Start · Über uns · Produkte (+ Detailseiten) · Shop (Filter/Suche/Sortierung) ·
Warenkorb · Kasse · Bestellbestätigung · FAQ · Kontakt · Impressum · Datenschutz · AGB ·
Widerrufsbelehrung · elektronische Widerrufsfunktion · Versand & Zahlung · Barrierefreiheitserklärung · 404.

**Shop & Recht (Stand 2026):**
- Katalog mit Kacheln, Preis inkl. MwSt-Hinweis, Filter/Suche/Sortierung
- Produktdetail mit Galerie, Varianten, Verfügbarkeit, Lieferzeit, **GPSR-Block**
  (Hersteller, EU-Verantwortlicher, Produkt-ID, Material, Warnhinweise)
- **PAngV:** inkl. MwSt., zzgl. Versand, Grundpreis, niedrigster 30-Tage-Preis bei Rabatt
- Warenkorb mit änderbarer Menge, transparenter Summe (Versand + MwSt), `aria-live`
- Schlanker **Checkout mit Gastbestellung**, Fortschritt, Feld-Validierung (`role="alert"`),
  Bestellübersicht direkt vor dem Button **„Zahlungspflichtig bestellen"** (§ 312j BGB)
- **Consent-Banner**: echtes Opt-in, „Ablehnen" gleichwertig zu „Akzeptieren", granular, dokumentiert
- **Elektronischer Widerrufs-Button** (Pflicht seit 19.06.2026) inkl. Muster-Widerrufsformular
- Hinweis VerpackG/LUCID, EU-Streitschlichtung

**Barrierefreiheit (BFSG / WCAG 2.1 AA):** semantisches HTML, Skip-Link, durchgehende
Tastaturbedienung, sichtbarer Fokus, verknüpfte Labels + Fehlermeldungen, Kontraste ≥ 4,5:1,
Touch-Ziele ≥ 44 px, Alt-Texte (dekorativ = leer), `aria-live` für Warenkorb/Filter,
`prefers-reduced-motion`.

**SEO/Technik:** Title/Description/OpenGraph je Seite, Schema.org (LocalBusiness, Product,
BreadcrumbList, FAQPage), `sitemap.xml`, `robots.txt`, keine externen Tracking-/Font-/Karten-Requests
ohne Einwilligung.

## Bekannte Grenzen / nächste Schritte

1. **Kein echtes Payment/Backend** – Checkout ist UI-Prototyp; Bestätigungs-E-Mail ist Platzhalter.
2. **Bilder** sind generierte SVG-Platzhalter → durch lizenzierte Produktfotos ersetzen.
3. **Rechtstexte** sind strukturierte Entwürfe → vor Livegang anwaltlich/per Rechtstext-Dienst prüfen.
4. **BFSG-Ausnahme** (Kleinstunternehmer) anhand echter Mitarbeiterzahl/Umsatz prüfen – Shop ist
   dennoch barrierefrei gebaut.
5. Für Production-Routing (BrowserRouter) einen Server-Fallback auf `index.html` konfigurieren.
6. Dev-Abhängigkeiten (vite/esbuild) haben Hinweise, die nur den Entwicklungsserver betreffen, nicht
   das ausgelieferte Bundle.

## Struktur

```
src/
  context/    ConsentContext (DSGVO), CartContext (Warenkorb + aria-live)
  components/  Layout, Header, Footer, ConsentBanner, ProductImage, ui
  data/        company, products (inkl. GPSR), faq
  hooks/       useSeo (Title/Meta/JSON-LD)
  pages/       Start, Shop, Produkt, Warenkorb, Kasse … + legal/ (Pflichtseiten)
public/        favicon.svg, robots.txt, sitemap.xml
```
