import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { products } from '../data/products';

export interface CartLine {
  productSlug: string;
  variantId: string;
  qty: number;
}

export interface ResolvedLine extends CartLine {
  name: string;
  variantLabel: string;
  unitPriceCents: number;
  lineTotalCents: number;
}

const STORAGE_KEY = 'aztz-cart';

// Versandkosten (Beispielwert, brutto). PLATZHALTER – vor Livegang ersetzen.
export const SHIPPING_FLAT_CENTS = 990;
export const FREE_SHIPPING_THRESHOLD_CENTS = 50000;
export const VAT_RATE = 0.19;

interface CartContextValue {
  lines: CartLine[];
  resolved: ResolvedLine[];
  count: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  vatIncludedCents: number;
  add: (productSlug: string, variantId: string, qty?: number) => void;
  setQty: (productSlug: string, variantId: string, qty: number) => void;
  remove: (productSlug: string, variantId: string) => void;
  clear: () => void;
  /** Letzte Mengenänderung – für aria-live-Ankündigung an Screenreader. */
  lastAnnouncement: string;
}

const CartContext = createContext<CartContextValue | null>(null);

function resolve(lines: CartLine[]): ResolvedLine[] {
  const out: ResolvedLine[] = [];
  for (const line of lines) {
    const product = products.find((p) => p.slug === line.productSlug);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant) continue;
    out.push({
      ...line,
      name: product.name,
      variantLabel: variant.label,
      unitPriceCents: variant.priceCents,
      lineTotalCents: variant.priceCents * line.qty,
    });
  }
  return out;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [lastAnnouncement, setLastAnnouncement] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  function announce(msg: string) {
    setLastAnnouncement(msg);
  }

  const value = useMemo<CartContextValue>(() => {
    const resolved = resolve(lines);
    const subtotalCents = resolved.reduce((s, l) => s + l.lineTotalCents, 0);
    const shippingCents =
      resolved.length === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
    const totalCents = subtotalCents + shippingCents;
    const vatIncludedCents = Math.round((totalCents / (1 + VAT_RATE)) * VAT_RATE);
    const count = resolved.reduce((s, l) => s + l.qty, 0);

    return {
      lines,
      resolved,
      count,
      subtotalCents,
      shippingCents,
      totalCents,
      vatIncludedCents,
      lastAnnouncement,
      add: (productSlug, variantId, qty = 1) => {
        setLines((prev) => {
          const existing = prev.find((l) => l.productSlug === productSlug && l.variantId === variantId);
          if (existing) {
            return prev.map((l) =>
              l === existing ? { ...l, qty: l.qty + qty } : l,
            );
          }
          return [...prev, { productSlug, variantId, qty }];
        });
        announce('Artikel zum Warenkorb hinzugefügt.');
      },
      setQty: (productSlug, variantId, qty) => {
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => !(l.productSlug === productSlug && l.variantId === variantId))
            : prev.map((l) =>
                l.productSlug === productSlug && l.variantId === variantId ? { ...l, qty } : l,
              ),
        );
        announce('Warenkorb aktualisiert.');
      },
      remove: (productSlug, variantId) => {
        setLines((prev) => prev.filter((l) => !(l.productSlug === productSlug && l.variantId === variantId)));
        announce('Artikel aus dem Warenkorb entfernt.');
      },
      clear: () => {
        setLines([]);
        announce('Warenkorb geleert.');
      },
    };
  }, [lines, lastAnnouncement]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
