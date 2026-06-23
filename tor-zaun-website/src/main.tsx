import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { App } from './App';
import { ConsentProvider } from './context/ConsentContext';
import { CartProvider } from './context/CartContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ConsentProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </ConsentProvider>
    </BrowserRouter>
  </StrictMode>,
);
