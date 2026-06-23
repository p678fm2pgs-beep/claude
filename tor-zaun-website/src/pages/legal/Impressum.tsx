import { useSeo } from '../../hooks/useSeo';
import { PageHeader, Section } from '../../components/ui';
import { LegalNote } from './LegalNote';
import { company } from '../../data/company';

export function Impressum() {
  useSeo({ title: 'Impressum', description: 'Anbieterkennzeichnung gemäß § 5 DDG.' });
  return (
    <>
      <PageHeader title="Impressum" />
      <Section>
        <div className="prose-page">
          <LegalNote />
          <h2>Angaben gemäß § 5 DDG</h2>
          <p>
            {company.name}
            <br />
            {company.street}
            <br />
            {company.zip} {company.city}
            <br />
            {company.country}
          </p>

          <h2>Vertreten durch</h2>
          <p>Geschäftsführer: {company.managingDirector}</p>

          <h2>Kontakt</h2>
          <p>
            Telefon: {company.phone} / {company.phoneSecondary}
            <br />
            E-Mail: {company.email}
          </p>

          <h2>Registereintrag</h2>
          <p>
            Eintragung im Handelsregister.
            <br />
            Registergericht: {company.registerCourt}
            <br />
            Registernummer: {company.registerNumber}
          </p>

          <h2>Umsatzsteuer-ID</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {company.vatId}</p>

          <h2>Redaktionell verantwortlich (§ 18 Abs. 2 MStV)</h2>
          <p>{company.responsibleForContent}</p>

          <h2>EU-Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
              https://ec.europa.eu/consumers/odr
            </a>
            . Unsere E-Mail-Adresse finden Sie oben.
          </p>

          <h2>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
          <p>
            [BITTE AUSFÜLLEN: Wir sind zur Teilnahme an einem Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle nicht verpflichtet / nicht bereit / bereit – bitte zutreffende Variante
            wählen.]
          </p>
        </div>
      </Section>
    </>
  );
}
