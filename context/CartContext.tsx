import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { CATALOG, type CatalogModel } from '@/data/catalog';

const STORAGE_KEY = '@model_market_cart_v1';

export type CartLine = {
  model: CatalogModel;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  ready: boolean;
  add: (model: CatalogModel) => void;
  remove: (modelId: string) => void;
  setQuantity: (modelId: string, quantity: number) => void;
  clear: () => void;
  totalQuantity: number;
  subtotal: number;
};

const CartContext = createContext<CartState | null>(null);

async function loadLines(): Promise<CartLine[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { modelId: string; quantity: number }[];
    const lines: CartLine[] = [];
    for (const row of parsed) {
      const model = CATALOG.find((m) => m.id === row.modelId);
      if (model && row.quantity > 0) {
        lines.push({ model, quantity: row.quantity });
      }
    }
    return lines;
  } catch {
    return [];
  }
}

async function saveLines(lines: CartLine[]): Promise<void> {
  const payload = lines.map((l) => ({ modelId: l.model.id, quantity: l.quantity }));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadLines().then((loaded) => {
      if (!cancelled) {
        setLines(loaded);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    void saveLines(next);
  }, []);

  const add = useCallback(
    (model: CatalogModel) => {
      setLines((prev) => {
        const idx = prev.findIndex((l) => l.model.id === model.id);
        let next: CartLine[];
        if (idx >= 0) {
          next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        } else {
          next = [...prev, { model, quantity: 1 }];
        }
        void saveLines(next);
        return next;
      });
    },
    []
  );

  const remove = useCallback((modelId: string) => {
    setLines((prev) => {
      const next = prev.filter((l) => l.model.id !== modelId);
      void saveLines(next);
      return next;
    });
  }, []);

  const setQuantity = useCallback((modelId: string, quantity: number) => {
    setLines((prev) => {
      const q = Math.max(0, Math.floor(quantity));
      let next: CartLine[];
      if (q === 0) {
        next = prev.filter((l) => l.model.id !== modelId);
      } else {
        next = prev.map((l) =>
          l.model.id === modelId ? { ...l, quantity: q } : l
        );
      }
      void saveLines(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  const totalQuantity = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines]
  );

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.model.price * l.quantity, 0),
    [lines]
  );

  const value = useMemo(
    () => ({
      lines,
      ready,
      add,
      remove,
      setQuantity,
      clear,
      totalQuantity,
      subtotal,
    }),
    [lines, ready, add, remove, setQuantity, clear, totalQuantity, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
