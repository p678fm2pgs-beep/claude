import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';
import { PageHeader } from '../components/ui';
import { ProductImage } from '../components/ProductImage';
import { categories, products, formatEuro, type Category } from '../data/products';
import { useCart } from '../context/CartContext';

type SortKey = 'name' | 'preis-auf' | 'preis-ab';

function minPrice(slug: string): number {
  const p = products.find((x) => x.slug === slug)!;
  return Math.min(...p.variants.map((v) => v.priceCents));
}

export function Shop() {
  useSeo({
    title: 'Shop',
    description:
      'Zäune, Tore und Sichtschutz aus Metall online ansehen und bestellen. Filtern Sie nach Kategorie, suchen und sortieren Sie nach Preis.',
  });

  const [params, setParams] = useSearchParams();
  const activeCat = (params.get('kategorie') as Category | null) ?? 'alle';
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const { add } = useCart();

  const filtered = useMemo(() => {
    let list = products.filter((p) => (activeCat === 'alle' ? true : p.category === activeCat));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, 'de'));
    if (sort === 'preis-auf') sorted.sort((a, b) => minPrice(a.slug) - minPrice(b.slug));
    if (sort === 'preis-ab') sorted.sort((a, b) => minPrice(b.slug) - minPrice(a.slug));
    return sorted;
  }, [activeCat, query, sort]);

  function setCat(cat: string) {
    const next = new URLSearchParams(params);
    if (cat === 'alle') next.delete('kategorie');
    else next.set('kategorie', cat);
    setParams(next);
  }

  return (
    <>
      <PageHeader
        title="Shop"
        lead="Alle Preise sind Beispielwerte zur Orientierung und verstehen sich inkl. MwSt. Für montierte Anlagen erstellen wir ein individuelles Angebot."
      />

      <div className="container-x py-8">
        {/* Filter / Suche / Sortierung */}
        <div className="card mb-8 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="shop-search" className="field-label">
                Suche
              </label>
              <input
                id="shop-search"
                type="search"
                className="field-input"
                placeholder="z. B. Schiebetor"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="shop-cat" className="field-label">
                Kategorie
              </label>
              <select id="shop-cat" className="field-input" value={activeCat} onChange={(e) => setCat(e.target.value)}>
                <option value="alle">Alle Kategorien</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="shop-sort" className="field-label">
                Sortierung
              </label>
              <select
                id="shop-sort"
                className="field-input"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="name">Name (A–Z)</option>
                <option value="preis-auf">Preis aufsteigend</option>
                <option value="preis-ab">Preis absteigend</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ergebnis-Anzahl wird Screenreadern angekündigt */}
        <p aria-live="polite" className="mb-4 text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? 'Produkt' : 'Produkte'} gefunden
        </p>

        {filtered.length === 0 ? (
          <p className="card p-8 text-center text-muted">Keine Produkte gefunden. Bitte passen Sie Ihre Suche an.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const from = minPrice(p.slug);
              return (
                <li key={p.slug} className="card flex flex-col overflow-hidden">
                  <Link to={`/produkte/${p.slug}`} className="block">
                    <ProductImage
                      alt={p.imageAlt}
                      variant={p.category === 'sichtschutz' ? 'sicht' : p.category === 'doppelstabmattenzaun' ? 'zaun' : 'tor'}
                      swatch={p.swatch}
                      className="h-44 w-full"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="text-lg">
                      <Link to={`/produkte/${p.slug}`} className="hover:text-bronze">
                        {p.name}
                      </Link>
                    </h2>
                    <p className="mt-1 flex-1 text-sm text-muted">{p.shortDescription}</p>
                    <p className="mt-3">
                      <span className="font-semibold text-anthracite">ab {formatEuro(from)}</span>{' '}
                      <span className="text-xs text-muted">inkl. MwSt., zzgl. Versand</span>
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Link to={`/produkte/${p.slug}`} className="btn-outline flex-1">
                        Details
                      </Link>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => add(p.slug, p.variants[0].id)}
                      >
                        In den Warenkorb
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
