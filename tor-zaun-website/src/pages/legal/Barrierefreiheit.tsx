import { useSeo } from '../../hooks/useSeo';
import { PageHeader, Section } from '../../components/ui';
import { LegalNote } from './LegalNote';
import { company } from '../../data/company';

export function Barrierefreiheit() {
  useSeo({
    title: 'Barrierefreiheitserklärung',
    description: 'Erklärung zur Barrierefreiheit gemäß BFSG, Status, bekannte Barrieren und Feedback-Mechanismus.',
  });
  return (
    <>
      <PageHeader title="Erklärung zur Barrierefreiheit" />
      <Section>
        <div className="prose-page">
          <LegalNote />

          <h2>Geltung des BFSG</h2>
          <p>
            Das Barrierefreiheitsstärkungsgesetz (BFSG) gilt seit dem 28.06.2025 verbindlich für
            B2C-Online-Shops; Maßstab ist WCAG 2.1 AA bzw. EN 301 549. Für Kleinstunternehmen (weniger als 10
            Beschäftigte <strong>und</strong> höchstens 2 Mio. € Jahresumsatz/Bilanzsumme) gilt eine Ausnahme für
            den Shop-Dienst.
          </p>
          <p>
            <strong>Prüfung der Ausnahme:</strong> Beschäftigte: {company.employees}; Umsatz/Bilanzsumme:{' '}
            {company.annualTurnover}. [BITTE AUSFÜLLEN/prüfen: Greift die Kleinstunternehmer-Ausnahme? Unabhängig
            davon setzen wir diese Website von Anfang an barrierefrei um.]
          </p>

          <h2>Stand der Vereinbarkeit</h2>
          <p>
            Diese Website wurde mit dem Ziel der weitgehenden Konformität zu WCAG 2.1 AA gestaltet: semantisches
            HTML, durchgängige Tastaturbedienbarkeit inkl. Kaufprozess, sichtbarer Fokus, verknüpfte Formular-Labels
            mit Fehlermeldungen (role="alert"/aria-live), ausreichende Farbkontraste (≥ 4,5:1), Alt-Texte für
            inhaltstragende Bilder sowie Live-Ankündigung von Warenkorb- und Filteränderungen.
          </p>

          <h2>Bekannte Einschränkungen</h2>
          <ul>
            <li>Produktbilder sind derzeit generierte Platzhalter; finale Fotos erhalten geprüfte Alt-Texte.</li>
            <li>Eingebettete Karten/Drittinhalte werden erst nach Einwilligung geladen und sind separat zu prüfen.</li>
            <li>
              [BITTE AUSFÜLLEN: weitere bekannte Barrieren nach automatischem Scan (Lighthouse/axe) und manueller
              Prüfung mit Tastatur und Screenreader.]
            </li>
          </ul>

          <h2>Feedback und Kontakt</h2>
          <p>
            Sind Ihnen Barrieren aufgefallen? Melden Sie sich bei uns – wir helfen weiter und verbessern die
            Zugänglichkeit:
            <br />
            {company.name}, E-Mail: {company.email}, Telefon: {company.phone}.
          </p>

          <h2>Durchsetzungsverfahren / Marktüberwachung</h2>
          <p>
            Sind Sie mit unserer Antwort nicht zufrieden, können Sie sich an die zuständige Marktüberwachungsbehörde
            wenden: [BITTE AUSFÜLLEN: zuständige Marktüberwachungsstelle der Länder für das BFSG, Anschrift/Link gem.
            Anlage 3 BFSG].
          </p>

          <p className="text-sm text-muted">Erstellt am: [BITTE AUSFÜLLEN: Datum] · Diese Erklärung wird regelmäßig überprüft.</p>
        </div>
      </Section>
    </>
  );
}
