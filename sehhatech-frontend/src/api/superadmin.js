import api from './axios';

export const superadmin = {
  // params: { startDate?: 'YYYY-MM-DD', endDate?: 'YYYY-MM-DD' }
  getDashboard: (params = {}) =>
    api.get('/api/SuperAdmin/dashboard', { params }).then(r => r.data.data ?? r.data),
  getTenants: () => api.get('/api/SuperAdmin/tenants').then(r => r.data.data ?? r.data),
  getTenant: (id) => api.get(`/api/SuperAdmin/tenants/${id}`).then(r => r.data.data ?? r.data),
  toggleTenant: (id) => api.put(`/api/SuperAdmin/tenants/${id}/toggle`).then(r => r.data.data ?? r.data),
  deleteTenant: (id) => api.delete(`/api/SuperAdmin/tenants/${id}`).then(r => r.data),
  getReports: () => api.get('/api/SuperAdmin/reports').then(r => r.data.data ?? r.data),
  getProfile: () => api.get('/api/SuperAdmin/profile').then(r => r.data),
  changePassword: (oldPassword, newPassword) => api.post('/api/SuperAdmin/change-password', { oldPassword, newPassword }).then(r => r.data),
};