import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { PageHeader, Section } from '../components/ui';
import { ProductImage } from '../components/ProductImage';
import { categories, products, formatEuro } from '../data/products';

export function Products() {
  useSeo({
    title: 'Produkte & Leistungen',
    description:
      'Doppelstabmattenzaun, Schiebetore, Drehtore und Sichtschutz aus Metall – Übersicht der Produkte und Leistungen von A-Z Tor & Zaun GmbH.',
  });

  return (
    <>
      <PageHeader
        title="Produkte & Leistungen"
        lead="Metallzäune, Tore und Zubehör – als Komplettsystem oder Einzelelement, auf Wunsch mit Planung und Montage."
      />

      {categories.map((cat) => {
        const items = products.filter((p) => p.category === cat.id);
        const headingId = `cat-${cat.id}`;
        return (
          <Section key={cat.id} labelledBy={headingId}>
            <div className="mb-6">
              <h2 id={headingId} className="text-2xl">
                {cat.label}
              </h2>
              <p className="mt-2 max-w-prose text-muted">{cat.description}</p>
            </div>
            {items.length > 0 ? (
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <li key={p.slug} className="card flex flex-col overflow-hidden">
                    <ProductImage
                      alt={p.imageAlt}
                      variant={p.category === 'sichtschutz' ? 'sicht' : p.category === 'doppelstabmattenzaun' ? 'zaun' : 'tor'}
                      swatch={p.swatch}
                      className="h-44 w-full"
                    />
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg">{p.name}</h3>
                      <p className="mt-1 flex-1 text-sm text-muted">{p.shortDescription}</p>
                      <p className="mt-3 font-semibold text-anthracite">
                        ab {formatEuro(Math.min(...p.variants.map((v) => v.priceCents)))}{' '}
                        <span className="text-xs font-normal text-muted">inkl. MwSt.</span>
                      </p>
                      <Link to={`/produkte/${p.slug}`} className="btn-outline mt-3">
                        Details ansehen
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">Weitere Produkte auf Anfrage.</p>
            )}
          </Section>
        );
      })}
    </>
  );
}
