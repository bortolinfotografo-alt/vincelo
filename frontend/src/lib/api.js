// ============================================================
// API CLIENT
// Instância do Axios configurada com baseURL do backend.
//
// Tokens:
//   access token  → lido do tokenStore (memória, não localStorage)
//   refresh token → enviado automaticamente pelo browser via cookie httpOnly
//
// withCredentials: true é necessário para que o browser envie
// o cookie httpOnly do refresh token nas requests.
// ============================================================

import axios from 'axios';
import { getToken } from '@/lib/tokenStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true, // necessário para cookies httpOnly (refresh token)
});

// Interceptor que adiciona access token do tokenStore em cada request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
