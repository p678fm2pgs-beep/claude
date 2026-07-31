import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { PageHeader } from '../components/ui';
import { formatEuro } from '../data/products';
import { useCart } from '../context/CartContext';

interface FormState {
  email: string;
  firstName: string;
  lastName: string;
  street: string;
  zip: string;
  city: string;
  payment: string;
  agb: boolean;
  widerruf: boolean;
}

type Errors = Partial<Record<keyof FormState, string>>;

const payments = [
  { id: 'rechnung', label: 'Kauf auf Rechnung' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'kreditkarte', label: 'Kreditkarte' },
  { id: 'klarna', label: 'Sofort / Klarna' },
  { id: 'applepay', label: 'Apple Pay / Google Pay' },
];

export function Checkout() {
  useSeo({ title: 'Kasse', description: 'Bestellung abschließen – Gastbestellung möglich, ohne Kundenkonto.' });
  const navigate = useNavigate();
  const { resolved, subtotalCents, shippingCents, totalCents, vatIncludedCents, clear } = useCart();

  const [form, setForm] = useState<FormState>({
    email: '',
    firstName: '',
    lastName: '',
    street: '',
    zip: '',
    city: '',
    payment: 'rechnung',
    agb: false,
    widerruf: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const summaryRef = useRef<HTMLDivElement>(null);

  if (resolved.length === 0) {
    return (
      <>
        <PageHeader title="Kasse" />
        <div className="container-x py-16 text-center">
          <p className="text-lg text-muted">Ihr Warenkorb ist leer.</p>
          <Link to="/shop" className="btn-primary mt-6">
            Zum Shop
          </Link>
        </div>
      </>
    );
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    if (!form.firstName.trim()) e.firstName = 'Bitte geben Sie Ihren Vornamen ein.';
    if (!form.lastName.trim()) e.lastName = 'Bitte geben Sie Ihren Nachnamen ein.';
    if (!form.street.trim()) e.street = 'Bitte geben Sie Straße und Hausnummer ein.';
    if (!/^\d{5}$/.test(form.zip)) e.zip = 'Bitte geben Sie eine gültige PLZ (5 Ziffern) ein.';
    if (!form.city.trim()) e.city = 'Bitte geben Sie Ihren Ort ein.';
    if (!form.agb) e.agb = 'Bitte bestätigen Sie die AGB.';
    if (!form.widerruf) e.widerruf = 'Bitte bestätigen Sie die Kenntnisnahme der Widerrufsbelehrung.';
    return e;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      // Fokus auf das erste fehlerhafte Feld
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      first?.focus();
      return;
    }
    clear();
    navigate('/bestellbestaetigung', {
      state: { email: form.email, total: totalCents, payment: form.payment },
    });
  }

  const fieldErr = (key: keyof FormState) =>
    errors[key] ? (
      <p id={`err-${key}`} role="alert" className="mt-1 text-sm font-medium text-red-700">
        {errors[key]}
      </p>
    ) : null;

  const inputProps = (key: keyof FormState) => ({
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `err-${key}` : undefined,
  });

  return (
    <>
      <PageHeader title="Kasse" />

      {/* Fortschrittsanzeige */}
      <nav aria-label="Bestellfortschritt" className="border-b border-line bg-surface">
        <ol className="container-x flex flex-wrap gap-x-6 gap-y-1 py-3 text-sm">
          <li className="text-muted">1. Warenkorb ✓</li>
          <li className="font-semibold text-anthracite" aria-current="step">
            2. Daten &amp; Zahlung
          </li>
          <li className="text-muted">3. Bestätigung</li>
        </ol>
      </nav>

      <form onSubmit={onSubmit} noValidate className="container-x grid gap-8 py-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <p className="rounded-lg bg-line/60 px-4 py-3 text-sm">
            <strong>Gastbestellung möglich</strong> – Sie benötigen kein Kundenkonto. Pflichtfelder sind mit
            <span aria-hidden="true"> *</span> markiert.
          </p>

          {/* Kontakt */}
          <fieldset className="card p-6">
            <legend className="px-1 font-serif text-xl">Kontakt</legend>
            <div className="mt-4">
              <label htmlFor="email" className="field-label">
                E-Mail-Adresse <span aria-hidden="true">*</span>
                <span className="sr-only">Pflichtfeld</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="field-input"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                {...inputProps('email')}
              />
              {fieldErr('email')}
            </div>
          </fieldset>

          {/* Lieferadresse */}
          <fieldset className="card p-6">
            <legend className="px-1 font-serif text-xl">Lieferadresse</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="field-label">
                  Vorname <span aria-hidden="true">*</span>
                </label>
                <input
                  id="firstName"
                  autoComplete="given-name"
                  className="field-input"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  {...inputProps('firstName')}
                />
                {fieldErr('firstName')}
              </div>
              <div>
                <label htmlFor="lastName" className="field-label">
                  Nachname <span aria-hidden="true">*</span>
                </label>
                <input
                  id="lastName"
                  autoComplete="family-name"
                  className="field-input"
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  {...inputProps('lastName')}
                />
                {fieldErr('lastName')}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="street" className="field-label">
                  Straße &amp; Hausnummer <span aria-hidden="true">*</span>
                </label>
                <input
                  id="street"
                  autoComplete="street-address"
                  className="field-input"
                  value={form.street}
                  onChange={(e) => update('street', e.target.value)}
                  {...inputProps('street')}
                />
                {fieldErr('street')}
              </div>
              <div>
                <label htmlFor="zip" className="field-label">
                  PLZ <span aria-hidden="true">*</span>
                </label>
                <input
                  id="zip"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className="field-input"
                  value={form.zip}
                  onChange={(e) => update('zip', e.target.value)}
                  {...inputProps('zip')}
                />
                {fieldErr('zip')}
              </div>
              <div>
                <label htmlFor="city" className="field-label">
                  Ort <span aria-hidden="true">*</span>
                </label>
                <input
                  id="city"
                  autoComplete="address-level2"
                  className="field-input"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  {...inputProps('city')}
                />
                {fieldErr('city')}
              </div>
            </div>
          </fieldset>

          {/* Zahlart */}
          <fieldset className="card p-6">
            <legend className="px-1 font-serif text-xl">Zahlungsart</legend>
            <div className="mt-4 space-y-2">
              {payments.map((p) => (
                <label key={p.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
                  <input
                    type="radio"
                    name="payment"
                    value={p.id}
                    checked={form.payment === p.id}
                    onChange={(e) => update('payment', e.target.value)}
                    className="h-5 w-5"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              [Hinweis: Verfügbarkeit der Zahlarten abhängig vom angebundenen Zahlungsdienstleister.]
            </p>
          </fieldset>
        </div>

        {/* Bestellübersicht – direkt vor dem Bestell-Button (§312j BGB) */}
        <aside className="h-fit space-y-4">
          <div ref={summaryRef} className="card p-6">
            <h2 className="text-xl">Ihre Bestellung</h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {resolved.map((l) => (
                <li key={l.variantId} className="flex justify-between gap-2 py-2">
                  <span>
                    {l.qty} × {l.name}
                    <span className="block text-muted">{l.variantLabel}</span>
                  </span>
                  <span className="whitespace-nowrap font-medium">{formatEuro(l.lineTotalCents)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Zwischensumme</dt>
                <dd>{formatEuro(subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Versand</dt>
                <dd>{shippingCents === 0 ? 'kostenfrei' : formatEuro(shippingCents)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-1 text-base font-bold text-anthracite">
                <dt>Gesamt</dt>
                <dd>{formatEuro(totalCents)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>inkl. MwSt. (19 %)</dt>
                <dd>{formatEuro(vatIncludedCents)}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5"
                  checked={form.agb}
                  onChange={(e) => update('agb', e.target.checked)}
                  {...inputProps('agb')}
                />
                <span>
                  Ich akzeptiere die{' '}
                  <Link to="/agb" className="link-text">
                    AGB
                  </Link>
                  . <span aria-hidden="true">*</span>
                </span>
              </label>
              {fieldErr('agb')}
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5"
                  checked={form.widerruf}
                  onChange={(e) => update('widerruf', e.target.checked)}
                  {...inputProps('widerruf')}
                />
                <span>
                  Ich habe die{' '}
                  <Link to="/widerruf" className="link-text">
                    Widerrufsbelehrung
                  </Link>{' '}
                  zur Kenntnis genommen. <span aria-hidden="true">*</span>
                </span>
              </label>
              {fieldErr('widerruf')}
            </div>

            {/* Eindeutige Button-Beschriftung gem. § 312j Abs. 3 BGB */}
            <button type="submit" className="btn-accent mt-5 w-full text-lg">
              Zahlungspflichtig bestellen
            </button>
            <p className="mt-2 text-xs text-muted">
              Mit Klick bestellen Sie kostenpflichtig. Sie erhalten anschließend eine Bestellbestätigung per E-Mail.
            </p>
          </div>
        </aside>
      </form>
    </>
  );
}
