import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Shop } from './pages/Shop';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Faq } from './pages/Faq';
import { Contact } from './pages/Contact';
import { Impressum } from './pages/legal/Impressum';
import { Datenschutz } from './pages/legal/Datenschutz';
import { Agb } from './pages/legal/Agb';
import { Widerruf } from './pages/legal/Widerruf';
import { WiderrufButton } from './pages/legal/WiderrufButton';
import { VersandZahlung } from './pages/legal/VersandZahlung';
import { Barrierefreiheit } from './pages/legal/Barrierefreiheit';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="ueber-uns" element={<About />} />
        <Route path="produkte" element={<Products />} />
        <Route path="produkte/:slug" element={<ProductDetail />} />
        <Route path="shop" element={<Shop />} />
        <Route path="warenkorb" element={<Cart />} />
        <Route path="kasse" element={<Checkout />} />
        <Route path="bestellbestaetigung" element={<OrderConfirmation />} />
        <Route path="faq" element={<Faq />} />
        <Route path="kontakt" element={<Contact />} />
        <Route path="impressum" element={<Impressum />} />
        <Route path="datenschutz" element={<Datenschutz />} />
        <Route path="agb" element={<Agb />} />
        <Route path="widerruf" element={<Widerruf />} />
        <Route path="widerruf-button" element={<WiderrufButton />} />
        <Route path="versand-zahlung" element={<VersandZahlung />} />
        <Route path="barrierefreiheit" element={<Barrierefreiheit />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
