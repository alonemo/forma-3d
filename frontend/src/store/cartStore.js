import { create } from 'zustand';
import { createCatalogOrderApi } from '../api/orders';

const useCartStore = create((set, get) => ({
  items: [],
  open: false,

  addItem: (product) => {
    const items = get().items;
    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      set({ items: items.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ items: [...items, { ...product, quantity: 1 }] });
    }
  },

  removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

  updateQuantity: (id, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter((i) => i.id !== id) });
    } else {
      set({ items: get().items.map((i) => i.id === id ? { ...i, quantity: qty } : i) });
    }
  },

  clearCart: () => set({ items: [] }),

  toggleDrawer: (val) => set({ open: val !== undefined ? val : !get().open }),

  get total() {
    return get().items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  },

  get count() {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },

  checkout: async () => {
    const items = get().items.map((i) => ({ product_id: i.id, quantity: i.quantity }));
    try {
      const { data } = await createCatalogOrderApi({ items });
      set({ items: [] });
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Ошибка оформления заказа' };
    }
  },
}));

export default useCartStore;
