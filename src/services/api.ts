import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { createClient } from '@supabase/supabase-js';

const API_URL = 'https://paddyapi-aheec7dvhtf7graj.canadacentral-01.azurewebsites.net/';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is expired or invalid
      const { logout } = useAuthStore.getState();
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);