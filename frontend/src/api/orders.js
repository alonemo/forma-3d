import api from './axios';

export const getOrdersApi = () => api.get('/orders');
export const createCatalogOrderApi = (data) => api.post('/orders/catalog', data);
export const createCustomOrderApi = (data) => api.post('/orders/custom', data);
export const cancelUserOrderApi = (id) => api.patch(`/orders/${id}/cancel`);
