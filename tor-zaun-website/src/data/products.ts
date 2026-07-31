// Produktkatalog (Prototyp). Produktarten und Eigenschaften stammen aus der öffentlichen
// Darstellung des Betriebs. Preise sind BEISPIELWERTE und als solche markiert –
// vor Livegang durch echte Kalkulation ersetzen ([BITTE AUSFÜLLEN: Preis]).
//
// Jedes Produkt trägt die nach GPSR (EU 2023/988) nötige Datenstruktur:
//   manufacturer, euResponsible, productId, warnings, material, dimensions.
// Felder mit echten Pflichtangaben sind als [BITTE AUSFÜLLEN] markiert.

export type Category =
  | 'doppelstabmattenzaun'
  | 'schiebetore'
  | 'drehtore'
  | 'sichtschutz'
  | 'zubehoer';

export interface ProductVariant {
  id: string;
  label: string; // z. B. "Höhe 1,03 m · Anthrazit RAL 7016"
  /** Beispielpreis in Cent (brutto, inkl. 19 % MwSt). PLATZHALTER. */
  priceCents: number;
  /** Niedrigster Preis der letzten 30 Tage in Cent (PAngV bei Rabatt). Optional. */
  lowest30dCents?: number;
}

export interface Product {
  slug: string;
  name: string;
  category: Category;
  shortDescription: string;
  description: string;
  /** Verkaufseinheit für Grundpreisangabe (PAngV), z. B. "lfd. Meter". */
  unit?: string;
  /** Grundpreis-Basis in Cent je Einheit (PAngV), falls messbare Menge. PLATZHALTER. */
  basePriceCents?: number;
  basePriceUnit?: string; // z. B. "pro lfd. Meter"
  variants: ProductVariant[];
  availability: 'sofort' | 'kurzfristig' | 'auf-anfrage';
  deliveryTime: string; // Lieferzeit-Hinweis
  // GPSR-Datenstruktur
  gpsr: {
    manufacturer: string;
    euResponsible: string;
    productId: string;
    material: string;
    dimensions: string;
    warnings: string[];
  };
  // Bild-Platzhalter (lizenzfrei generiert) – Beschreibung dient als Alt-Text-Basis
  imageAlt: string;
  /** Farbwert für den generierten SVG-Platzhalter. */
  swatch: string;
  highlights: string[];
}

const PLACEHOLDER_PRICE_NOTE = '[BITTE AUSFÜLLEN: echter Preis]';

export const categories: { id: Category; label: string; description: string }[] = [
  {
    id: 'doppelstabmattenzaun',
    label: 'Doppelstabmattenzaun',
    description: 'Robuste, langlebige Zäune aus punktverschweißten Doppelstäben – das Rückgrat sicherer Grundstücke.',
  },
  {
    id: 'schiebetore',
    label: 'Schiebetore',
    description: 'Platzsparende Einfahrtstore, manuell oder elektrisch – mit langlebigem Antriebskonzept.',
  },
  {
    id: 'drehtore',
    label: 'Drehtore',
    description: 'Ein- und zweiflügelige Tore für Einfahrt und Garten, passend zum Doppelstabmattenzaun.',
  },
  {
    id: 'sichtschutz',
    label: 'Sichtschutz & Zubehör',
    description: 'Sichtschutzstreifen, Pfosten und Zubehör für die individuelle Gestaltung Ihrer Anlage.',
  },
];

export const products: Product[] = [
  {
    slug: 'doppelstabmattenzaun-set-anthrazit',
    name: 'Doppelstabmattenzaun-Set 6/5/6',
    category: 'doppelstabmattenzaun',
    shortDescription:
      'Komplettset aus Matten, Pfosten und Befestigung – die solide Standardlösung für Haus und Hof.',
    description:
      'Der Doppelstabmattenzaun 6/5/6 besteht aus punktverschweißten Stahldrähten: zwei waagerechte Stäbe außen, ein senkrechter Stab innen. Das Set umfasst Matten, passende Pfosten und das komplette Befestigungsmaterial. Feuerverzinkt und pulverbeschichtet für jahrzehntelange Haltbarkeit. Auf Wunsch planen und montieren wir die gesamte Anlage bei Ihnen vor Ort.',
    unit: 'lfd. Meter',
    basePriceCents: 4900,
    basePriceUnit: 'pro lfd. Meter',
    variants: [
      { id: 'h83-ral7016', label: 'Höhe 0,83 m · Anthrazit RAL 7016', priceCents: 12900 },
      { id: 'h103-ral7016', label: 'Höhe 1,03 m · Anthrazit RAL 7016', priceCents: 14900 },
      { id: 'h123-ral7016', label: 'Höhe 1,23 m · Anthrazit RAL 7016', priceCents: 16900, lowest30dCents: 15900 },
      { id: 'h103-ral6005', label: 'Höhe 1,03 m · Moosgrün RAL 6005', priceCents: 14900 },
    ],
    availability: 'sofort',
    deliveryTime: 'ca. 5–10 Werktage (Lieferung), Montage nach Terminvereinbarung',
    gpsr: {
      manufacturer: '[BITTE AUSFÜLLEN: Hersteller/Marke der Matten]',
      euResponsible:
        'A-Z Tor & Zaun GmbH, Am Beul 33, 45525 Hattingen [bzw. [BITTE AUSFÜLLEN], falls importiert]',
      productId: 'DSM-656-AZ',
      material: 'Stahl, feuerverzinkt + pulverbeschichtet',
      dimensions: 'Mattenbreite 2,50 m · Drahtstärke 6/5/6 mm · Höhe je nach Variante',
      warnings: [
        'Montage durch fachkundige Personen empfohlen.',
        'Scharfkantige Drahtenden – bei Selbstmontage Schutzhandschuhe tragen.',
      ],
    },
    imageAlt: 'Anthrazitfarbener Doppelstabmattenzaun entlang einer Grundstücksgrenze',
    swatch: '#3a444a',
    highlights: ['Feuerverzinkt & pulverbeschichtet', 'Komplett mit Pfosten & Befestigung', 'Optional mit Montage'],
  },
  {
    slug: 'schiebetor-elektrisch',
    name: 'Schiebetor (elektrisch)',
    category: 'schiebetore',
    shortDescription:
      'Freitragendes Einfahrtstor mit langlebigem Antrieb – komfortabel per Funk, ideal bei wenig Platz.',
    description:
      'Unser freitragendes Schiebetor sichert die Einfahrt zuverlässig und öffnet besonders leichtgängig. Das bewährte Antriebskonzept sorgt für einen ruhigen Lauf; die Steuerung erfolgt per Handsender. Passend zum Doppelstabmattenzaun in identischer Optik. Wir beraten zur richtigen Durchfahrtsbreite, liefern und montieren inklusive Elektroanschluss-Vorbereitung.',
    variants: [
      { id: 'b400-h160', label: 'Durchfahrt 4,00 m · Höhe 1,60 m · Anthrazit', priceCents: 289000 },
      { id: 'b500-h180', label: 'Durchfahrt 5,00 m · Höhe 1,80 m · Anthrazit', priceCents: 339000 },
    ],
    availability: 'kurzfristig',
    deliveryTime: 'ca. 3–6 Wochen inkl. Aufmaß und Montage',
    gpsr: {
      manufacturer: '[BITTE AUSFÜLLEN: Hersteller des Tors/Antriebs]',
      euResponsible: 'A-Z Tor & Zaun GmbH, Am Beul 33, 45525 Hattingen',
      productId: 'ST-EL-AZ',
      material: 'Stahl/Aluminium, pulverbeschichtet; Antrieb 230 V',
      dimensions: 'Durchfahrtsbreite und Höhe je nach Variante',
      warnings: [
        'Kraftbetätigtes Tor: Inbetriebnahme und Sicherheitsabnahme gemäß DIN EN 13241/12453 erforderlich.',
        'Quetsch- und Schergefahr – Kinder vom Tor fernhalten.',
        'Elektroanschluss nur durch Fachkraft.',
      ],
    },
    imageAlt: 'Elektrisch betriebenes anthrazitfarbenes Schiebetor an einer Hofeinfahrt',
    swatch: '#2d353a',
    highlights: ['Leichtgängiges Antriebskonzept', 'Per Handsender bedienbar', 'Aufmaß & Montage inklusive'],
  },
  {
    slug: 'drehtor-zweifluegelig',
    name: 'Drehtor (zweiflügelig)',
    category: 'drehtore',
    shortDescription: 'Klassisches zweiflügeliges Einfahrtstor, optisch passend zum Zaun.',
    description:
      'Das zweiflügelige Drehtor ist die klassische Lösung für Einfahrten mit ausreichend Schwenkraum. Stabile Rahmenkonstruktion mit Doppelstabmatten-Füllung, inklusive Pfosten, Schloss und Beschlägen. Auf Wunsch mit Drehtorantrieb nachrüstbar.',
    variants: [
      { id: 'b300-h120', label: 'Durchfahrt 3,00 m · Höhe 1,20 m · Anthrazit', priceCents: 99000 },
      { id: 'b400-h140', label: 'Durchfahrt 4,00 m · Höhe 1,40 m · Anthrazit', priceCents: 124000 },
    ],
    availability: 'kurzfristig',
    deliveryTime: 'ca. 2–4 Wochen, Montage optional',
    gpsr: {
      manufacturer: '[BITTE AUSFÜLLEN: Hersteller des Tors]',
      euResponsible: 'A-Z Tor & Zaun GmbH, Am Beul 33, 45525 Hattingen',
      productId: 'DT-2F-AZ',
      material: 'Stahl, feuerverzinkt + pulverbeschichtet',
      dimensions: 'Durchfahrtsbreite und Höhe je nach Variante',
      warnings: ['Bei nachträglichem Antrieb Sicherheitsabnahme erforderlich.'],
    },
    imageAlt: 'Zweiflügeliges anthrazitfarbenes Drehtor zwischen zwei Pfosten',
    swatch: '#3a444a',
    highlights: ['Stabile Rahmenkonstruktion', 'Mit Schloss & Beschlägen', 'Antrieb nachrüstbar'],
  },
  {
    slug: 'sichtschutzstreifen',
    name: 'Sichtschutzstreifen (Set)',
    category: 'sichtschutz',
    shortDescription: 'PVC-Sichtschutzstreifen zum Einflechten – mehr Privatsphäre für Ihren Zaun.',
    description:
      'Hochwertige Sichtschutzstreifen zum Einflechten in den Doppelstabmattenzaun. Witterungsbeständig, farbecht und in wenigen Stunden montiert. Set für ca. 25 lfd. Meter Zaun inkl. Befestigungsclips.',
    unit: 'Set',
    variants: [
      { id: 'ral7016', label: 'Anthrazit RAL 7016 · ~25 m', priceCents: 7900 },
      { id: 'ral6005', label: 'Moosgrün RAL 6005 · ~25 m', priceCents: 7900 },
    ],
    availability: 'sofort',
    deliveryTime: 'ca. 3–5 Werktage',
    gpsr: {
      manufacturer: '[BITTE AUSFÜLLEN: Hersteller der Streifen]',
      euResponsible: 'A-Z Tor & Zaun GmbH, Am Beul 33, 45525 Hattingen',
      productId: 'SS-PVC-AZ',
      material: 'Hart-PVC, UV-stabilisiert',
      dimensions: 'Streifenhöhe passend zu gängigen Mattenhöhen',
      warnings: ['Nicht für Traglasten geeignet – reiner Sichtschutz.'],
    },
    imageAlt: 'Anthrazitfarbene Sichtschutzstreifen in einen Doppelstabmattenzaun eingeflochten',
    swatch: '#55606a',
    highlights: ['Witterungsbeständig & farbecht', 'Einfach einzuflechten', 'Für ca. 25 lfd. Meter'],
  },
];

export function formatEuro(cents: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export { PLACEHOLDER_PRICE_NOTE };
