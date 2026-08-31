import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1',
  withCredentials: true, // Garante o envio automático de cookies HttpOnly seguros
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor global para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Erro inesperado de comunicação com o servidor.';
    return Promise.reject(new Error(message));
  }
);
