import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { company } from '../data/company';

const nav = [
  { to: '/', label: 'Start', end: true },
  { to: '/produkte', label: 'Produkte' },
  { to: '/shop', label: 'Shop' },
  { to: '/ueber-uns', label: 'Über uns' },
  { to: '/faq', label: 'FAQ' },
  { to: '/kontakt', label: 'Kontakt' },
];

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="container-x flex items-center justify-between gap-4 py-3">
        <Link to="/" className="flex items-center gap-2" aria-label={`${company.name} – zur Startseite`}>
          <img src="/favicon.svg" alt="" width={36} height={36} />
          <span className="font-serif text-lg font-semibold text-anthracite sm:text-xl">
            A-Z Tor &amp; Zaun
          </span>
        </Link>

        <nav aria-label="Hauptnavigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-anthracite text-white' : 'text-ink hover:bg-line'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/warenkorb" className="btn-outline relative px-3 py-2" aria-label={`Warenkorb, ${count} Artikel`}>
            <span aria-hidden="true">🛒</span>
            <span className="hidden sm:inline">Warenkorb</span>
            <span
              className="ml-1 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-bronze px-1.5 py-0.5 text-xs font-bold text-white"
              aria-hidden="true"
            >
              {count}
            </span>
          </Link>
          <button
            type="button"
            className="btn-outline px-3 py-2 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true">☰</span>
            <span className="sr-only">Menü</span>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Hauptnavigation (mobil)" className="border-t border-line bg-paper md:hidden">
          <ul className="container-x flex flex-col py-2">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-3 text-base font-medium ${
                      isActive ? 'bg-anthracite text-white' : 'text-ink hover:bg-line'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
