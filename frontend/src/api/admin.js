import api from './axios';

export const getAdminOrdersApi = (params) => api.get('/admin/orders', { params });
export const updateOrderStatusApi = (id, status, cancelReason = null) =>
  api.patch(`/admin/orders/${id}/status`, { status, cancel_reason: cancelReason });

export const createProductApi = (data) => api.post('/admin/products', data);
export const updateProductApi = (id, data) => api.put(`/admin/products/${id}`, data);
export const deleteProductApi = (id) => api.delete(`/admin/products/${id}`);

export const uploadProductImageApi = (file) => {
  const fd = new FormData();
  fd.append('image', file);
  return api.post('/admin/products/upload-image', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
