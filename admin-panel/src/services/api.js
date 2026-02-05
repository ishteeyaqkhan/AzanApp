import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SERVER_URL = API_BASE_URL.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = async (username, password) => {
  const response = await api.post('/admin/login', { username, password });
  return response.data;
};

// Prayers
export const getPrayers = async (date) => {
  const params = date ? { date } : {};
  const response = await api.get('/prayers', { params });
  return response.data;
};

export const getPrayerById = async (id) => {
  const response = await api.get(`/prayers/${id}`);
  return response.data;
};

export const createPrayer = async (formData) => {
  const response = await api.post('/prayers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updatePrayer = async (id, formData) => {
  const response = await api.put(`/prayers/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deletePrayer = async (id) => {
  const response = await api.delete(`/prayers/${id}`);
  return response.data;
};

export const getTodayPrayers = async () => {
  const today = new Date().toISOString().split('T')[0];
  return getPrayers(today);
};

// Voices
export const getVoices = async (activeOnly) => {
  const params = activeOnly ? { active: 'true' } : {};
  const response = await api.get('/voices', { params });
  return response.data;
};

export const getVoiceById = async (id) => {
  const response = await api.get(`/voices/${id}`);
  return response.data;
};

export const createVoice = async (formData) => {
  const response = await api.post('/voices', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateVoice = async (id, formData) => {
  const response = await api.put(`/voices/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteVoice = async (id) => {
  const response = await api.delete(`/voices/${id}`);
  return response.data;
};

// Events
export const getEvents = async () => {
  const response = await api.get('/events');
  return response.data;
};

export const getEventById = async (id) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};

export const createEvent = async (data) => {
  const response = await api.post('/events', data);
  return response.data;
};

export const updateEvent = async (id, data) => {
  const response = await api.put(`/events/${id}`, data);
  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await api.delete(`/events/${id}`);
  return response.data;
};

export const getTodayEvents = async () => {
  const response = await api.get('/events/today/list');
  return response.data;
};

// Stats
export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export default api;
