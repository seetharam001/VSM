import api from './client';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

export const vehicleApi = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/vehicles/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

export const serviceApi = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  toggle: (id) => api.patch(`/services/${id}/toggle`),
};

export const bookingApi = {
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  updateStatus: (id, data) => api.patch(`/bookings/${id}/status`, data),
  addRepairNote: (id, data) => api.post(`/bookings/${id}/repair-notes`, data),
  getCustomerDashboard: () => api.get('/bookings/customer/dashboard'),
};

export const mechanicApi = {
  getAll: (params) => api.get('/mechanics', { params }),
  getById: (id) => api.get(`/mechanics/${id}`),
  create: (data) => api.post('/mechanics', data),
  update: (id, data) => api.put(`/mechanics/${id}`, data),
  delete: (id) => api.delete(`/mechanics/${id}`),
  getBookings: (id, params) => api.get(`/mechanics/${id}/bookings`, { params }),
  getDashboard: () => api.get('/mechanics/dashboard'),
};

export const invoiceApi = {
  getById: (id) => api.get(`/invoices/${id}`),
  getByBooking: (bookingId) => api.get(`/invoices/booking/${bookingId}`),
  generate: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  updatePayment: (id, data) => api.patch(`/invoices/${id}/payment`, data),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getCustomers: (params) => api.get('/admin/customers', { params }),
  getCustomerById: (id) => api.get(`/admin/customers/${id}`),
  toggleCustomerStatus: (id) => api.put(`/admin/customers/${id}/toggle-status`),
  getMonthlyReport: () => api.get('/admin/reports/monthly'),
  getPopularServices: () => api.get('/admin/reports/popular-services'),
  getTopMechanics: () => api.get('/admin/reports/top-mechanics'),
  search: (q) => api.get('/admin/search', { params: { q } }),
};

export const notificationApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const feedbackApi = {
  create: (data) => api.post('/feedback', data),
  getAll: (params) => api.get('/feedback', { params }),
  reply: (id, data) => api.put(`/feedback/${id}/reply`, data),
  updateStatus: (id, data) => api.patch(`/feedback/${id}/status`, data),
};

export const profileApi = {
  update: (data) => api.put('/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/profile/change-password', data),
};
