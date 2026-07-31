import { useState } from 'react';
import { useSeo } from '../hooks/useSeo';
import { PageHeader } from '../components/ui';
import { company, fullAddress } from '../data/company';

interface ContactForm {
  name: string;
  email: string;
  message: string;
  privacy: boolean;
}
type Errors = Partial<Record<keyof ContactForm, string>>;

export function Contact() {
  useSeo({
    title: 'Kontakt',
    description: `Kontakt zu A-Z Tor & Zaun GmbH in ${company.city}: Telefon, Adresse und Kontaktformular für Beratung und kostenloses Aufmaß.`,
  });

  const [form, setForm] = useState<ContactForm>({ name: '', email: '', message: '', privacy: false });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Errors = {};
    if (!form.name.trim()) err.name = 'Bitte geben Sie Ihren Namen ein.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    if (!form.message.trim()) err.message = 'Bitte beschreiben Sie kurz Ihr Anliegen.';
    if (!form.privacy) err.privacy = 'Bitte stimmen Sie der Datenschutzerklärung zu.';
    setErrors(err);
    if (Object.keys(err).length > 0) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setSent(true);
  }

  const errFor = (k: keyof ContactForm) =>
    errors[k] ? (
      <p id={`cerr-${k}`} role="alert" className="mt-1 text-sm font-medium text-red-700">
        {errors[k]}
      </p>
    ) : null;
  const props = (k: keyof ContactForm) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `cerr-${k}` : undefined,
  });

  return (
    <>
      <PageHeader title="Kontakt" lead="Sie haben ein Projekt im Kopf? Wir beraten Sie persönlich und nehmen gern ein kostenloses Aufmaß vor." />

      <div className="container-x grid gap-10 py-10 lg:grid-cols-2">
        {/* Kontaktdaten */}
        <div>
          <h2 className="text-2xl">So erreichen Sie uns</h2>
          <dl className="mt-4 space-y-4 text-ink">
            <div>
              <dt className="text-sm font-semibold text-muted">Adresse</dt>
              <dd>
                <address className="not-italic">{fullAddress}</address>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted">Telefon</dt>
              <dd>
                <a className="link-text" href={`tel:${company.phone.replace(/\s/g, '')}`}>
                  {company.phone}
                </a>{' '}
                · {company.phoneSecondary}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted">E-Mail</dt>
              <dd>{company.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted">Öffnungszeiten</dt>
              <dd>
                <ul>
                  {company.openingHours.map((o) => (
                    <li key={o.days}>
                      {o.days}: {o.time}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>

          <div className="mt-6 overflow-hidden rounded-xl2 border border-line">
            {/* Karte erst nach Einwilligung laden (DSGVO). Platzhalter statt eingebettetem Drittanbieter-iframe. */}
            <div className="flex h-56 items-center justify-center bg-line/50 p-6 text-center text-sm text-muted">
              [PLATZHALTER KARTE: Eine eingebettete Karte (z. B. OpenStreetMap/Google Maps) überträgt Daten an
              Dritte und darf erst nach Cookie-Einwilligung geladen werden. Adresse: {fullAddress}.]
            </div>
          </div>
        </div>

        {/* Formular */}
        <div>
          <h2 className="text-2xl">Nachricht senden</h2>
          {sent ? (
            <p role="status" className="mt-4 rounded-lg bg-green-50 p-4 text-green-900">
              Vielen Dank! Ihre Nachricht wurde erfasst (Prototyp – es wird keine echte E-Mail versendet). Wir melden
              uns schnellstmöglich.
            </p>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
              <div>
                <label htmlFor="c-name" className="field-label">
                  Name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="c-name"
                  className="field-input"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  {...props('name')}
                />
                {errFor('name')}
              </div>
              <div>
                <label htmlFor="c-email" className="field-label">
                  E-Mail <span aria-hidden="true">*</span>
                </label>
                <input
                  id="c-email"
                  type="email"
                  className="field-input"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  {...props('email')}
                />
                {errFor('email')}
              </div>
              <div>
                <label htmlFor="c-msg" className="field-label">
                  Ihre Nachricht <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="c-msg"
                  className="field-input min-h-32"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  {...props('message')}
                />
                {errFor('message')}
              </div>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5"
                  checked={form.privacy}
                  onChange={(e) => setForm({ ...form, privacy: e.target.checked })}
                  {...props('privacy')}
                />
                <span>
                  Ich habe die Datenschutzerklärung gelesen und stimme der Verarbeitung meiner Angaben zur
                  Bearbeitung meiner Anfrage zu. <span aria-hidden="true">*</span>
                </span>
              </label>
              {errFor('privacy')}
              <button type="submit" className="btn-primary">
                Nachricht absenden
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
