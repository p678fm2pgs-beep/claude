import { Link } from 'react-router-dom';
import { company, fullAddress } from '../data/company';
import { useConsent } from '../context/ConsentContext';

const legalLinks = [
  { to: '/impressum', label: 'Impressum' },
  { to: '/datenschutz', label: 'Datenschutz' },
  { to: '/agb', label: 'AGB' },
  { to: '/widerruf', label: 'Widerrufsbelehrung' },
  { to: '/versand-zahlung', label: 'Versand & Zahlung' },
  { to: '/barrierefreiheit', label: 'Barrierefreiheit' },
];

export function Footer() {
  const { openSettings } = useConsent();

  return (
    <footer className="mt-16 border-t border-line bg-anthracite text-white/90">
      <div className="container-x grid gap-10 py-12 md:grid-cols-4">
        <div>
          <p className="font-serif text-lg text-white">{company.name}</p>
          <address className="mt-3 not-italic text-sm leading-relaxed text-white/80">
            {company.street}
            <br />
            {company.zip} {company.city}
            <br />
            Tel.{' '}
            <a className="underline underline-offset-2 hover:text-white" href={`tel:${company.phone.replace(/\s/g, '')}`}>
              {company.phone}
            </a>
          </address>
        </div>

        <nav aria-label="Rechtliches" className="text-sm">
          <h2 className="mb-3 font-serif text-base text-white">Rechtliches</h2>
          <ul className="space-y-2">
            {legalLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="underline-offset-2 hover:text-white hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Service" className="text-sm">
          <h2 className="mb-3 font-serif text-base text-white">Service</h2>
          <ul className="space-y-2">
            <li>
              <Link to="/produkte" className="underline-offset-2 hover:text-white hover:underline">
                Produkte & Leistungen
              </Link>
            </li>
            <li>
              <Link to="/faq" className="underline-offset-2 hover:text-white hover:underline">
                Häufige Fragen
              </Link>
            </li>
            <li>
              <Link to="/kontakt" className="underline-offset-2 hover:text-white hover:underline">
                Kontakt & Aufmaß
              </Link>
            </li>
            <li>
              <button type="button" onClick={openSettings} className="underline-offset-2 hover:text-white hover:underline">
                Cookie-Einstellungen
              </button>
            </li>
          </ul>
        </nav>

        <div className="text-sm">
          <h2 className="mb-3 font-serif text-base text-white">Widerruf</h2>
          <p className="text-white/80">
            Sie möchten Ihre Bestellung widerrufen? Nutzen Sie unsere elektronische Widerrufsfunktion.
          </p>
          {/* Elektronischer Widerrufs-Button – Pflicht seit 19.06.2026 */}
          <Link
            to="/widerruf-button"
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-bronze-400 px-4 py-2.5 font-semibold text-anthracite hover:bg-white"
          >
            Vertrag widerrufen
          </Link>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {company.name} · {fullAddress}
          </p>
          <p>
            Plattform der EU-Kommission zur Online-Streitbeilegung:{' '}
            <a
              className="underline underline-offset-2 hover:text-white"
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
