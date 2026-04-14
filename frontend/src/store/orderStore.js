import { create } from 'zustand';
import { getOrdersApi, createCustomOrderApi, cancelUserOrderApi } from '../api/orders';
import { getAdminOrdersApi, updateOrderStatusApi } from '../api/admin';

const useOrderStore = create((set) => ({
  orders: [],
  adminOrders: [],
  loading: false,
  error: null,

  fetchUserOrders: async () => {
    set({ loading: true });
    try {
      const { data } = await getOrdersApi();
      set({ orders: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  submitCustomOrder: async (formData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await createCustomOrderApi(formData);
      set({ loading: false });
      return { success: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.error || 'Ошибка отправки заказа';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  cancelUserOrder: async (id) => {
    try {
      await cancelUserOrderApi(id);
      set((state) => ({
        orders: state.orders.map((o) => o.id === id ? { ...o, status: 'cancelled' } : o),
      }));
      return true;
    } catch {
      return false;
    }
  },

  fetchAdminOrders: async (params) => {
    set({ loading: true });
    try {
      const { data } = await getAdminOrdersApi(params);
      set({ adminOrders: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  updateStatus: async (id, status, cancelReason = null) => {
    try {
      await updateOrderStatusApi(id, status, cancelReason);
      set((state) => ({
        adminOrders: state.adminOrders.map((o) =>
          o.id === id ? { ...o, status, cancel_reason: cancelReason } : o
        ),
      }));
      return true;
    } catch {
      return false;
    }
  },
}));

export default useOrderStore;
