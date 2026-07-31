import { useState } from 'react';
import { useSeo } from '../../hooks/useSeo';
import { PageHeader, Section } from '../../components/ui';
import { company } from '../../data/company';

// Elektronische Widerrufsfunktion – Pflicht seit 19.06.2026.
// Klar erkennbarer „Widerrufs-Button", sauber an die Rückabwicklung angebunden.
interface WForm {
  orderNumber: string;
  name: string;
  email: string;
  date: string;
  items: string;
  reason: string;
}
type Errors = Partial<Record<keyof WForm, string>>;

export function WiderrufButton() {
  useSeo({
    title: 'Vertrag widerrufen',
    description: 'Elektronische Widerrufsfunktion gemäß gesetzlicher Pflicht – widerrufen Sie Ihren Vertrag online.',
  });

  const [form, setForm] = useState<WForm>({ orderNumber: '', name: '', email: '', date: '', items: '', reason: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Errors = {};
    if (!form.name.trim()) err.name = 'Bitte geben Sie Ihren Namen ein.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    if (!form.items.trim()) err.items = 'Bitte geben Sie an, welche Ware/Leistung Sie widerrufen.';
    setErrors(err);
    if (Object.keys(err).length > 0) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setSent(true);
  }

  const errFor = (k: keyof WForm) =>
    errors[k] ? (
      <p id={`werr-${k}`} role="alert" className="mt-1 text-sm font-medium text-red-700">
        {errors[k]}
      </p>
    ) : null;
  const props = (k: keyof WForm) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `werr-${k}` : undefined,
  });

  return (
    <>
      <PageHeader
        title="Vertrag widerrufen"
        lead="Mit diesem Formular erklären Sie den Widerruf Ihres Vertrags elektronisch. Sie erhalten umgehend eine Bestätigung des Eingangs."
      />
      <Section>
        {sent ? (
          <div className="card max-w-prose p-8" role="status">
            <h2 className="text-2xl">Widerruf eingegangen</h2>
            <p className="mt-3 text-muted">
              Vielen Dank. Ihr Widerruf wurde erfasst. In der Live-Version erhalten Sie unverzüglich eine Bestätigung
              des Eingangs per E-Mail (gesetzlich vorgeschrieben) und wir leiten die Rückabwicklung ein. (Prototyp:
              es wird keine echte E-Mail versendet.)
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="card max-w-2xl space-y-4 p-6">
            <p className="text-sm text-muted">
              Empfänger: {company.name}. Pflichtfelder sind mit <span aria-hidden="true">*</span> markiert.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="w-order" className="field-label">
                  Bestellnummer
                </label>
                <input
                  id="w-order"
                  className="field-input"
                  value={form.orderNumber}
                  onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="w-date" className="field-label">
                  Bestell-/Lieferdatum
                </label>
                <input
                  id="w-date"
                  type="date"
                  className="field-input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="w-name" className="field-label">
                  Name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="w-name"
                  className="field-input"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  {...props('name')}
                />
                {errFor('name')}
              </div>
              <div>
                <label htmlFor="w-email" className="field-label">
                  E-Mail <span aria-hidden="true">*</span>
                </label>
                <input
                  id="w-email"
                  type="email"
                  className="field-input"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  {...props('email')}
                />
                {errFor('email')}
              </div>
            </div>
            <div>
              <label htmlFor="w-items" className="field-label">
                Widerrufene Ware / Leistung <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="w-items"
                rows={3}
                className="field-input"
                value={form.items}
                onChange={(e) => setForm({ ...form, items: e.target.value })}
                {...props('items')}
              />
              {errFor('items')}
            </div>
            <div>
              <label htmlFor="w-reason" className="field-label">
                Grund (freiwillig)
              </label>
              <textarea
                id="w-reason"
                rows={2}
                className="field-input"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-accent text-lg">
              Widerruf verbindlich absenden
            </button>
          </form>
        )}
      </Section>
    </>
  );
}
