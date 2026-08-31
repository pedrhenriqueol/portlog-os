import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para injetar token do sessionStorage (fallback caso o navegador bloqueie 3rd-party cookies)
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('portlog_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor global para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Erro inesperado de comunicação com o servidor.';
    return Promise.reject(new Error(message));
  }
);
