import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import { App } from './App';
import { ConsentProvider } from './context/ConsentContext';
import { CartProvider } from './context/CartContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ConsentProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </ConsentProvider>
    </HashRouter>
  </StrictMode>,
);
