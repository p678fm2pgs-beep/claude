import { useSeo } from '../../hooks/useSeo';
import { PageHeader, Section } from '../../components/ui';
import { LegalNote } from './LegalNote';
import { company } from '../../data/company';

export function Agb() {
  useSeo({ title: 'AGB', description: 'Allgemeine Geschäftsbedingungen.' });
  return (
    <>
      <PageHeader title="Allgemeine Geschäftsbedingungen (AGB)" />
      <Section>
        <div className="prose-page">
          <LegalNote />

          <h2>§ 1 Geltungsbereich</h2>
          <p>
            Diese AGB gelten für alle Bestellungen über den Online-Shop sowie für Verträge mit der {company.name}{' '}
            („Verkäufer"). Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die
            überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden
            können.
          </p>

          <h2>§ 2 Vertragsschluss</h2>
          <p>
            Die Darstellung der Produkte stellt kein bindendes Angebot dar. Mit Anklicken von „Zahlungspflichtig
            bestellen" geben Sie ein verbindliches Angebot ab. Der Vertrag kommt mit unserer Annahme (z. B.
            Auftragsbestätigung oder Lieferung) zustande.
          </p>

          <h2>§ 3 Preise und Versandkosten</h2>
          <p>
            Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer. Zusätzlich anfallende Versandkosten
            werden im Bestellprozess gesondert ausgewiesen. [BITTE AUSFÜLLEN: konkrete Versandkostenregelung,
            Speditionsversand bei sperrigen Anlagen.]
          </p>

          <h2>§ 4 Lieferung</h2>
          <p>
            Lieferzeiten ergeben sich aus der jeweiligen Produktangabe. Bei nach Kundenmaß gefertigten oder montierten
            Anlagen gelten gesonderte Vereinbarungen. [BITTE AUSFÜLLEN: Liefergebiete, Teillieferungen,
            Selbstabholung.]
          </p>

          <h2>§ 5 Zahlung</h2>
          <p>Es gelten die im Bestellprozess angebotenen Zahlungsarten. [BITTE AUSFÜLLEN: Details je Zahlart, Fälligkeit, Verzug.]</p>

          <h2>§ 6 Eigentumsvorbehalt</h2>
          <p>Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.</p>

          <h2>§ 7 Gewährleistung</h2>
          <p>Es gelten die gesetzlichen Gewährleistungsrechte. [BITTE AUSFÜLLEN: ergänzende Regelungen, Garantien.]</p>

          <h2>§ 8 Widerrufsrecht</h2>
          <p>
            Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Einzelheiten regelt die separate
            Widerrufsbelehrung. Den Widerruf können Sie auch über unsere elektronische Widerrufsfunktion erklären.
          </p>

          <h2>§ 9 Streitbeilegung</h2>
          <p>Siehe Hinweise im Impressum.</p>

          <p className="text-sm text-muted">Stand: [BITTE AUSFÜLLEN: Datum]</p>
        </div>
      </Section>
    </>
  );
}
