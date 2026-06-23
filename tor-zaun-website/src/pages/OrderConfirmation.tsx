import { Link, useLocation } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { PageHeader } from '../components/ui';
import { formatEuro } from '../data/products';

interface OrderState {
  email?: string;
  total?: number;
  payment?: string;
}

export function OrderConfirmation() {
  useSeo({ title: 'Bestellbestätigung', description: 'Vielen Dank für Ihre Bestellung.' });
  const { state } = useLocation();
  const order = (state as OrderState | null) ?? {};

  return (
    <>
      <PageHeader title="Vielen Dank für Ihre Bestellung!" />
      <div className="container-x py-12">
        <div className="card max-w-prose p-8">
          <p className="text-lg">
            Ihre Bestellung ist bei uns eingegangen. Eine Bestellbestätigung mit allen Pflichtinformationen
            {order.email ? (
              <>
                {' '}
                senden wir an <strong>{order.email}</strong>
              </>
            ) : (
              ' senden wir an Ihre E-Mail-Adresse'
            )}
            .
          </p>

          {order.total != null && (
            <dl className="mt-6 space-y-1 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt>Gesamtbetrag</dt>
                <dd className="font-bold text-anthracite">{formatEuro(order.total)}</dd>
              </div>
              {order.payment && (
                <div className="flex justify-between">
                  <dt>Zahlungsart</dt>
                  <dd>{order.payment}</dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-6 rounded-lg bg-line/60 p-4 text-sm text-muted">
            Hinweis (Prototyp): Es findet keine echte Zahlung statt. In der Live-Version würde hier die Anbindung
            an den Zahlungsdienstleister sowie der Versand der Bestätigungs-E-Mail erfolgen.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/" className="btn-primary">
              Zur Startseite
            </Link>
            <Link to="/shop" className="btn-outline">
              Weiter einkaufen
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
