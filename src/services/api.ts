import axios from 'axios';

// Usar variável de ambiente ou detectar automaticamente
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:3006/api' 
    : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (userData: any) =>
    api.post('/auth/register', userData),
  profile: () =>
    api.get('/auth/profile'),
};

// Contacts endpoints
export const contactsAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; segment?: string }) =>
    api.get('/contacts', { params }),
  getById: (id: string) =>
    api.get(`/contacts/${id}`),
  create: (contact: any) =>
    api.post('/contacts', contact),
  update: (id: string, contact: any) =>
    api.put(`/contacts/${id}`, contact),
  delete: (id: string) =>
    api.delete(`/contacts/${id}`),
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/contacts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportExcel: () =>
    api.get('/contacts/export', { responseType: 'blob' }),
};

// Segments endpoints
export const segmentsAPI = {
  getAll: () =>
    api.get('/segments'),
  getById: (id: string) =>
    api.get(`/segments/${id}`),
  create: (segment: any) =>
    api.post('/segments', segment),
  update: (id: string, segment: any) =>
    api.put(`/segments/${id}`, segment),
  delete: (id: string) =>
    api.delete(`/segments/${id}`),
  getContacts: (id: string) =>
    api.get(`/segments/${id}/contacts`),
};

// Campaigns endpoints
export const campaignsAPI = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/campaigns', { params }),
  getById: (id: string) =>
    api.get(`/campaigns/${id}`),
  create: (campaign: any) =>
    api.post('/campaigns', campaign),
  update: (id: string, campaign: any) =>
    api.put(`/campaigns/${id}`, campaign),
  delete: (id: string) =>
    api.delete(`/campaigns/${id}`),
  start: (id: string) =>
    api.post(`/campaigns/${id}/start`),
  pause: (id: string) =>
    api.post(`/campaigns/${id}/pause`).then(res => res.data),
  stop: (id: string) =>
    api.post(`/campaigns/${id}/stop`),
  getStats: (id: string) =>
    api.get(`/campaigns/${id}/stats`),
};

// Messages endpoints
export const messagesAPI = {
  getAll: (params?: { page?: number; limit?: number; campaignId?: string; status?: string }) =>
    api.get('/messages', { params }),
  getById: (id: string) =>
    api.get(`/messages/${id}`),
  create: (message: any) =>
    api.post('/messages', message),
  update: (id: string, message: any) =>
    api.put(`/messages/${id}`, message),
  delete: (id: string) =>
    api.delete(`/messages/${id}`),
  send: (messageId: string) =>
    api.post(`/messages/${messageId}/send`),
};

// WhatsApp Instances endpoints
export const whatsappAPI = {
  getAll: () =>
    api.get('/whatsapp/instances'),
  getById: (id: string) =>
    api.get(`/whatsapp/instances/${id}`),
  create: (instance: any) =>
    api.post('/whatsapp/instances', instance),
  update: (id: string, instance: any) =>
    api.put(`/whatsapp/instances/${id}`, instance),
  delete: (id: string) =>
    api.delete(`/whatsapp/instances/${id}`),
  connect: (id: string) =>
    api.post(`/whatsapp/instances/${id}/connect`),
  disconnect: (id: string) =>
    api.post(`/whatsapp/instances/${id}/disconnect`),
  getQRCode: (id: string) =>
    api.get(`/whatsapp/instances/${id}/qr-code`),
  getStatus: (id: string) =>
    api.get(`/whatsapp/instances/${id}/status`),
};

// TTS endpoints
export const ttsAPI = {
  getConfigs: () =>
    api.get('/tts/configs'),
  createConfig: (config: any) =>
    api.post('/tts/configs', config),
  updateConfig: (id: string, config: any) =>
    api.put(`/tts/configs/${id}`, config),
  deleteConfig: (id: string) =>
    api.delete(`/tts/configs/${id}`),
  synthesize: (text: string, configId?: string) =>
    api.post('/tts/synthesize', { text, configId }),
  getMetrics: () =>
    api.get('/tts/metrics'),
};

// Anti-blocking endpoints
export const antiBlockingAPI = {
  getConfig: () =>
    api.get('/anti-blocking/config'),
  updateConfig: (config: any) =>
    api.put('/anti-blocking/config', config),
  getMetrics: () =>
    api.get('/anti-blocking/metrics'),
};

// Analytics endpoints
export const analyticsAPI = {
  getDashboard: () =>
    api.get('/analytics/dashboard'),
  getCampaignAnalytics: (campaignId: string) =>
    api.get(`/analytics/campaigns/${campaignId}`),
  getDeliveryStats: () =>
    api.get('/analytics/delivery-stats'),
  getTTSStats: () =>
    api.get('/analytics/tts-stats'),
};

// File upload endpoints
export const fileAPI = {
  upload: (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: () =>
    api.get('/files'),
  delete: (id: string) =>
    api.delete(`/files/${id}`),
};

export default api;