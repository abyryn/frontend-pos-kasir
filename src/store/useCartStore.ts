import { create } from 'zustand';
import { CartItem, Customer, HoldTransaction, Product } from '../types';

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  holdTransactions: HoldTransaction[];
  discount: number;
  discountType: 'percentage' | 'nominal';

  // Computed
  subtotal: () => number;
  discountAmount: () => number;
  total: () => number;

  // Actions
  addProduct: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  applyItemDiscount: (productId: string, discount: number, type: 'percentage' | 'nominal') => void;
  applyCartDiscount: (discount: number, type: 'percentage' | 'nominal') => void;
  setCustomer: (customer: Customer | null) => void;
  clearCart: () => void;
  holdTransaction: () => void;
  recallTransaction: (holdId: string) => void;
  removeHold: (holdId: string) => void;
}

const calculateSubtotal = (item: CartItem): number => {
  const base = item.price * item.quantity;
  const disc =
    item.discountType === 'percentage'
      ? base * (item.discount / 100)
      : item.discount;
  return Math.max(0, base - disc);
};

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  customer: null,
  holdTransactions: [],
  discount: 0,
  discountType: 'nominal',

  subtotal: () => get().items.reduce((sum, item) => sum + item.subtotal, 0),

  discountAmount: () => {
    const { discount, discountType } = get();
    const sub = get().subtotal();
    if (discountType === 'percentage') return sub * (discount / 100);
    return discount;
  },

  total: () => Math.max(0, get().subtotal() - get().discountAmount()),

  addProduct: (product, qty = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + qty, subtotal: calculateSubtotal({ ...i, quantity: i.quantity + qty }) }
              : i
          ),
        };
      }
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        price: product.sellingPrice,
        quantity: qty,
        discount: 0,
        discountType: 'nominal',
        tax: product.tax,
        subtotal: product.sellingPrice * qty,
      };
      return { items: [...state.items, newItem] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }));
  },

  updateQuantity: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, quantity: qty, subtotal: calculateSubtotal({ ...i, quantity: qty }) }
          : i
      ),
    }));
  },

  applyItemDiscount: (productId, discount, type) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, discount, discountType: type, subtotal: calculateSubtotal({ ...i, discount, discountType: type }) }
          : i
      ),
    }));
  },

  applyCartDiscount: (discount, type) => {
    set({ discount, discountType: type });
  },

  setCustomer: (customer) => set({ customer }),

  clearCart: () => set({ items: [], customer: null, discount: 0, discountType: 'nominal' }),

  holdTransaction: () => {
    const { items, customer } = get();
    if (!items.length) return;
    const holdCount = get().holdTransactions.length + 1;
    const hold: HoldTransaction = {
      id: `hold-${Date.now()}`,
      label: `HOLD #${String(holdCount).padStart(3, '0')}`,
      items: [...items],
      customer: customer ?? undefined,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      holdTransactions: [...state.holdTransactions, hold],
      items: [],
      customer: null,
      discount: 0,
    }));
  },

  recallTransaction: (holdId) => {
    const { holdTransactions } = get();
    const hold = holdTransactions.find((h) => h.id === holdId);
    if (!hold) return;
    set({
      items: hold.items,
      customer: hold.customer ?? null,
      holdTransactions: holdTransactions.filter((h) => h.id !== holdId),
    });
  },

  removeHold: (holdId) => {
    set((state) => ({
      holdTransactions: state.holdTransactions.filter((h) => h.id !== holdId),
    }));
  },
}));
