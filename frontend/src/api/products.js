import api from './axios';

export const getProductsApi = (params) => api.get('/products', { params });
export const getProductApi = (id) => api.get(`/products/${id}`);
export const getCategoriesApi = () => api.get('/products/categories');
export const getMaterialsApi = () => api.get('/products/materials');
