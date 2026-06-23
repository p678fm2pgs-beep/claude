import { useSeo } from '../../hooks/useSeo';
import { PageHeader, Section } from '../../components/ui';
import { LegalNote } from './LegalNote';
import { formatEuro } from '../../data/products';
import { SHIPPING_FLAT_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from '../../context/CartContext';

export function VersandZahlung() {
  useSeo({ title: 'Versand & Zahlung', description: 'Versandkosten, Lieferzeiten, Liefergebiete und Zahlungsarten.' });
  return (
    <>
      <PageHeader title="Versand & Zahlung" />
      <Section>
        <div className="prose-page">
          <LegalNote />

          <h2>Versandkosten</h2>
          <p>
            Standardversand: pauschal {formatEuro(SHIPPING_FLAT_CENTS)} pro Bestellung (Beispielwert). Ab einem
            Bestellwert von {formatEuro(FREE_SHIPPING_THRESHOLD_CENTS)} liefern wir versandkostenfrei. [BITTE
            AUSFÜLLEN: echte Versandkostenstaffel; sperrige/lange Anlagen werden ggf. per Spedition geliefert –
            Kosten nach Aufwand.]
          </p>

          <h2>Lieferzeiten</h2>
          <p>
            Die voraussichtliche Lieferzeit ist bei jedem Produkt angegeben. Lagerware liefern wir in der Regel
            innerhalb weniger Werktage; Tore mit Aufmaß und Montage benötigen je nach Ausführung mehrere Wochen.
          </p>

          <h2>Liefergebiete</h2>
          <p>
            Wir liefern innerhalb Deutschlands. Montagen führen wir im Ruhrgebiet und in ganz Nordrhein-Westfalen
            durch. [BITTE AUSFÜLLEN: Lieferung ins Ausland ja/nein, Montagegebiet exakt.]
          </p>

          <h2>Zahlungsarten</h2>
          <ul>
            <li>Kauf auf Rechnung</li>
            <li>PayPal</li>
            <li>Kreditkarte</li>
            <li>Sofort / Klarna</li>
            <li>Apple Pay / Google Pay</li>
          </ul>
          <p className="text-sm text-muted">
            [BITTE AUSFÜLLEN: tatsächlich angebundene Zahlungsdienstleister und Bedingungen. Die Verfügbarkeit hängt
            vom gewählten Anbieter ab.]
          </p>

          <h2>Hinweis nach Verpackungsgesetz (VerpackG) / LUCID</h2>
          <p>
            Als Inverkehrbringer von Verpackungen sind wir verpflichtet, uns im Verpackungsregister LUCID zu
            registrieren und uns an einem dualen System zu beteiligen. [BITTE AUSFÜLLEN: LUCID-Registrierungsnummer
            und beteiligtes System angeben.]
          </p>
        </div>
      </Section>
    </>
  );
}
