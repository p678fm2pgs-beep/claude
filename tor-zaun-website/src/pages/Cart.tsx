import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { PageHeader } from '../components/ui';
import { formatEuro } from '../data/products';
import { useCart, SHIPPING_FLAT_CENTS, FREE_SHIPPING_THRESHOLD_CENTS } from '../context/CartContext';

export function Cart() {
  useSeo({ title: 'Warenkorb', description: 'Ihr Warenkorb bei A-Z Tor & Zaun.' });
  const { resolved, setQty, remove, subtotalCents, shippingCents, totalCents, vatIncludedCents } = useCart();

  if (resolved.length === 0) {
    return (
      <>
        <PageHeader title="Warenkorb" />
        <div className="container-x py-16 text-center">
          <p className="text-lg text-muted">Ihr Warenkorb ist leer.</p>
          <Link to="/shop" className="btn-primary mt-6">
            Weiter zum Shop
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Warenkorb" />
      <div className="container-x grid gap-8 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="space-y-4">
            {resolved.map((line) => (
              <li key={`${line.productSlug}-${line.variantId}`} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <h2 className="text-lg">{line.name}</h2>
                  <p className="text-sm text-muted">{line.variantLabel}</p>
                  <p className="mt-1 text-sm">
                    Einzelpreis: {formatEuro(line.unitPriceCents)}{' '}
                    <span className="text-muted">inkl. MwSt.</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor={`qty-${line.variantId}`} className="text-sm font-semibold">
                    Menge
                  </label>
                  <input
                    id={`qty-${line.variantId}`}
                    type="number"
                    min={0}
                    className="field-input w-20"
                    value={line.qty}
                    onChange={(e) => setQty(line.productSlug, line.variantId, Number(e.target.value) || 0)}
                  />
                </div>
                <div className="text-right sm:w-32">
                  <p className="font-semibold text-anthracite">{formatEuro(line.lineTotalCents)}</p>
                  <button
                    type="button"
                    className="link-text text-sm"
                    onClick={() => remove(line.productSlug, line.variantId)}
                  >
                    Entfernen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Zusammenfassung */}
        <aside aria-labelledby="sum-h" className="card h-fit p-6">
          <h2 id="sum-h" className="text-xl">
            Zusammenfassung
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Zwischensumme</dt>
              <dd>{formatEuro(subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Versand</dt>
              <dd>{shippingCents === 0 ? 'kostenfrei' : formatEuro(shippingCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-anthracite">
              <dt>Gesamtsumme</dt>
              <dd aria-live="polite">{formatEuro(totalCents)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>enthaltene MwSt. (19 %)</dt>
              <dd>{formatEuro(vatIncludedCents)}</dd>
            </div>
          </dl>

          {subtotalCents < FREE_SHIPPING_THRESHOLD_CENTS && (
            <p className="mt-3 text-xs text-muted">
              Versand pauschal {formatEuro(SHIPPING_FLAT_CENTS)} – ab {formatEuro(FREE_SHIPPING_THRESHOLD_CENTS)}{' '}
              versandkostenfrei. Lieferzeiten je Produkt; sperrige Anlagen ggf. per Spedition.
            </p>
          )}

          <Link to="/kasse" className="btn-primary mt-5 w-full">
            Weiter zur Kasse
          </Link>
          <Link to="/shop" className="btn-outline mt-2 w-full">
            Weiter einkaufen
          </Link>
        </aside>
      </div>
    </>
  );
}
