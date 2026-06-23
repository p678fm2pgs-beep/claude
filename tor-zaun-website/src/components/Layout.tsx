import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ConsentBanner } from './ConsentBanner';
import { useCart } from '../context/CartContext';

export function Layout() {
  const { pathname } = useLocation();
  const { lastAnnouncement } = useCart();

  // Fokus/Scroll bei Seitenwechsel zurücksetzen (Screenreader-freundlich).
  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.getElementById('main');
    if (main) main.focus();
  }, [pathname]);

  return (
    <>
      <a href="#main" className="skip-link">
        Zum Inhalt springen
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Footer />
      <ConsentBanner />
      {/* Globale Live-Region: Warenkorb-Änderungen werden Screenreadern angekündigt */}
      <div aria-live="polite" role="status" className="sr-only">
        {lastAnnouncement}
      </div>
    </>
  );
}
