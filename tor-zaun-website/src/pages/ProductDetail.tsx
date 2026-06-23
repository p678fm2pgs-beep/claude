import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { Breadcrumbs } from '../components/ui';
import { ProductImage } from '../components/ProductImage';
import { getProduct, formatEuro } from '../data/products';
import { company } from '../data/company';
import { useCart } from '../context/CartContext';
import { NotFound } from './NotFound';

const availabilityLabel: Record<string, string> = {
  sofort: 'Sofort lieferbar',
  kurzfristig: 'Kurzfristig lieferbar',
  'auf-anfrage': 'Auf Anfrage',
};

export function ProductDetail() {
  const { slug } = useParams();
  const product = slug ? getProduct(slug) : undefined;
  const [variantId, setVariantId] = useState(product?.variants[0].id ?? '');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { add } = useCart();

  useSeo({
    title: product ? product.name : 'Produkt',
    description: product?.shortDescription,
    jsonLd: product
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.shortDescription,
            sku: product.gpsr.productId,
            material: product.gpsr.material,
            offers: product.variants.map((v) => ({
              '@type': 'Offer',
              price: (v.priceCents / 100).toFixed(2),
              priceCurrency: 'EUR',
              availability:
                product.availability === 'auf-anfrage'
                  ? 'https://schema.org/PreOrder'
                  : 'https://schema.org/InStock',
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Shop', item: `${company.website}/shop` },
              { '@type': 'ListItem', position: 2, name: product.name },
            ],
          },
        ]
      : undefined,
  });

  if (!product) return <NotFound />;

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const hasDiscount = variant.lowest30dCents != null && variant.lowest30dCents < variant.priceCents;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Start', to: '/' },
          { label: 'Shop', to: '/shop' },
          { label: product.name },
        ]}
      />

      <article className="container-x grid gap-10 pb-16 lg:grid-cols-2">
        {/* Bildergalerie (Platzhalter, mehrere Ansichten) */}
        <div>
          <div className="overflow-hidden rounded-xl2 border border-line">
            <ProductImage
              alt={product.imageAlt}
              variant={product.category === 'sichtschutz' ? 'sicht' : product.category === 'doppelstabmattenzaun' ? 'zaun' : 'tor'}
              swatch={product.swatch}
              className="aspect-[4/3] w-full"
            />
          </div>
          <ul className="mt-3 grid grid-cols-3 gap-3" aria-label="Weitere Ansichten">
            {['Frontansicht', 'Detailansicht', 'Montagebeispiel'].map((view, i) => (
              <li key={view} className="overflow-hidden rounded-lg border border-line">
                <ProductImage alt={`${product.name} – ${view} (Platzhalter)`} variant="zaun" swatch={i === 1 ? '#55606a' : product.swatch} className="aspect-square w-full" />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            [PLATZHALTER-BILDER: durch lizenzierte Produktfotos mit Zoom ersetzen.]
          </p>
        </div>

        {/* Kaufbereich */}
        <div>
          <h1 className="text-3xl">{product.name}</h1>
          <p className="mt-3 text-muted">{product.description}</p>

          <div className="mt-6 card p-5">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-bold text-anthracite">{formatEuro(variant.priceCents)}</span>
              <span className="text-sm text-muted">inkl. MwSt., zzgl. Versand</span>
            </div>

            {hasDiscount && (
              <p className="mt-1 text-sm text-muted">
                Niedrigster Preis der letzten 30 Tage:{' '}
                <span className="font-semibold">{formatEuro(variant.lowest30dCents!)}</span> (Angabe gem. PAngV)
              </p>
            )}

            {product.basePriceCents && product.basePriceUnit && (
              <p className="mt-1 text-sm text-muted">
                Grundpreis: {formatEuro(product.basePriceCents)} {product.basePriceUnit}
              </p>
            )}

            {/* Variantenauswahl */}
            <div className="mt-4">
              <label htmlFor="variant" className="field-label">
                Ausführung
              </label>
              <select
                id="variant"
                className="field-input"
                value={variantId}
                onChange={(e) => {
                  setVariantId(e.target.value);
                  setAdded(false);
                }}
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} – {formatEuro(v.priceCents)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex items-end gap-3">
              <div className="w-28">
                <label htmlFor="qty" className="field-label">
                  Menge
                </label>
                <input
                  id="qty"
                  type="number"
                  min={1}
                  className="field-input"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => {
                  add(product.slug, variant.id, qty);
                  setAdded(true);
                }}
              >
                In den Warenkorb
              </button>
            </div>

            {added && (
              <p role="status" className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">
                ✓ „{product.name}" wurde in den Warenkorb gelegt.{' '}
                <Link to="/warenkorb" className="link-text">
                  Zum Warenkorb
                </Link>
              </p>
            )}

            <dl className="mt-5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="font-semibold">Verfügbarkeit:</dt>
                <dd>{availabilityLabel[product.availability]}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-semibold">Lieferzeit:</dt>
                <dd>{product.deliveryTime}</dd>
              </div>
            </dl>
          </div>

          {/* Trust-Elemente */}
          <ul className="mt-5 grid grid-cols-1 gap-2 text-sm text-muted sm:grid-cols-3">
            <li>✓ Beratung &amp; Aufmaß</li>
            <li>✓ Lieferung in ganz NRW</li>
            <li>✓ 14 Tage Widerrufsrecht</li>
          </ul>

          <ul className="mt-5 space-y-1 text-sm">
            {product.highlights.map((h) => (
              <li key={h} className="flex gap-2">
                <span aria-hidden="true" className="text-bronze">
                  ✓
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      </article>

      {/* GPSR – Produktsicherheit (EU 2023/988) */}
      <section className="bg-surface" aria-labelledby="gpsr-h">
        <div className="container-x py-12">
          <h2 id="gpsr-h" className="text-2xl">
            Produktsicherheit &amp; Herstellerangaben (GPSR)
          </h2>
          <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-muted">Hersteller</dt>
              <dd>{product.gpsr.manufacturer}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted">Verantwortliche Person in der EU</dt>
              <dd>{product.gpsr.euResponsible}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted">Produktkennung</dt>
              <dd>{product.gpsr.productId}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted">Material</dt>
              <dd>{product.gpsr.material}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-muted">Maße / Ausführung</dt>
              <dd>{product.gpsr.dimensions}</dd>
            </div>
          </dl>
          {product.gpsr.warnings.length > 0 && (
            <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <h3 className="text-base font-semibold text-amber-900">Sicherheits- und Warnhinweise</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                {product.gpsr.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
