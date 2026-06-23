import { useSeo } from '../../hooks/useSeo';
import { PageHeader, Section } from '../../components/ui';
import { LegalNote } from './LegalNote';
import { company, fullAddress } from '../../data/company';

export function Datenschutz() {
  useSeo({ title: 'Datenschutzerklärung', description: 'Informationen zur Verarbeitung personenbezogener Daten nach DSGVO.' });
  return (
    <>
      <PageHeader title="Datenschutzerklärung" />
      <Section>
        <div className="prose-page">
          <LegalNote />

          <h2>1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:
            <br />
            {company.name}, {fullAddress}
            <br />
            Telefon: {company.phone} · E-Mail: {company.email}
          </p>
          <p>Datenschutzbeauftragte:r: [BITTE AUSFÜLLEN, falls bestellpflichtig/vorhanden]</p>

          <h2>2. Allgemeines zur Datenverarbeitung</h2>
          <p>
            Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung einer funktionsfähigen
            Website sowie unserer Inhalte und Leistungen erforderlich ist oder Sie eingewilligt haben.
            Rechtsgrundlagen sind insbesondere Art. 6 Abs. 1 DSGVO.
          </p>

          <h2>3. Hosting</h2>
          <p>
            Diese Website wird bei einem Dienstleister gehostet. [BITTE AUSFÜLLEN: Name und Anschrift des Hosters,
            DSGVO-konform/EU-Hosting, Auftragsverarbeitungsvertrag nach Art. 28 DSGVO]. Beim Aufruf werden technisch
            notwendige Daten (Server-Logfiles: IP-Adresse, Datum/Uhrzeit, abgerufene Seite, Browsertyp) verarbeitet.
          </p>

          <h2>4. Cookies & Einwilligung</h2>
          <p>
            Technisch notwendige Cookies setzen wir auf Grundlage von § 25 Abs. 2 TDDDG. Nicht notwendige Dienste
            (Statistik, Marketing) laden wir erst nach Ihrer ausdrücklichen Einwilligung (§ 25 Abs. 1 TDDDG, Art. 6
            Abs. 1 lit. a DSGVO). Ihre Einwilligung können Sie jederzeit über „Cookie-Einstellungen" im Footer
            widerrufen.
          </p>

          <h2>5. Kontaktaufnahme</h2>
          <p>
            Bei Kontakt per Formular, E-Mail oder Telefon verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage
            (Art. 6 Abs. 1 lit. b bzw. f DSGVO). Die Daten werden gelöscht, sobald sie nicht mehr erforderlich sind
            und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
          </p>

          <h2>6. Bestellung & Vertragsabwicklung</h2>
          <p>
            Zur Abwicklung von Bestellungen verarbeiten wir die im Bestellprozess angegebenen Daten (Name, Anschrift,
            E-Mail, Zahlungsdaten) auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO. Eine Weitergabe erfolgt an
            Versanddienstleister und Zahlungsdienstleister, soweit zur Vertragserfüllung erforderlich. [BITTE
            AUSFÜLLEN: konkret eingesetzte Dienstleister benennen.]
          </p>

          <h2>7. Eingesetzte Dienste</h2>
          <p>
            [BITTE AUSFÜLLEN: Alle tatsächlich eingesetzten Tools/Dienste vollständig benennen – z. B.
            Webanalyse, Karten, Schriftarten, Newsletter, Social-Media-Plugins, Zahlungsanbieter – jeweils mit Zweck,
            Rechtsgrundlage, Empfänger und Drittlandübermittlung.] In diesem Prototyp werden keine externen
            Tracking-Dienste, keine externen Schriftarten und keine eingebetteten Karten ohne Einwilligung geladen.
          </p>

          <h2>8. Ihre Rechte</h2>
          <p>
            Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung
            (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO) sowie das Recht, eine
            erteilte Einwilligung jederzeit zu widerrufen. Zudem besteht ein Beschwerderecht bei einer
            Aufsichtsbehörde (für NRW: Landesbeauftragte für Datenschutz und Informationsfreiheit NRW).
          </p>

          <p className="text-sm text-muted">Stand: [BITTE AUSFÜLLEN: Datum] · Version: Entwurf</p>
        </div>
      </Section>
    </>
  );
}
