'use client';

// ============================================================
// AUTH CONTEXT
// Estado global de autenticação.
//
// Tokens:
//   access token  → memória (React state + tokenStore)
//   refresh token → httpOnly cookie (preferencial) + localStorage (fallback)
//
// O fallback em localStorage garante que o refresh funciona mesmo
// em desenvolvimento com frontend e backend em portas diferentes,
// onde o cookie pode ser bloqueado pelo browser.
// ============================================================

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { setToken, clearToken } from '@/lib/tokenStore';

const AuthContext = createContext(null);

const RT_KEY = '_rt'; // chave no localStorage para o refresh token

function saveRefreshToken(token) {
  if (token && typeof window !== 'undefined') {
    localStorage.setItem(RT_KEY, token);
  }
}

function loadRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(RT_KEY);
}

function removeRefreshToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(RT_KEY);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const interceptorRef = useRef(null);

  function clearSession() {
    clearToken();
    removeRefreshToken();
    delete api.defaults.headers.common['Authorization'];
  }

  // Na montagem: tenta renovar via cookie httpOnly (preferencial)
  // ou via localStorage (fallback para dev com portas diferentes)
  useEffect(() => {
    const storedRt = loadRefreshToken();

    api
      .post('/auth/refresh', storedRt ? { refreshToken: storedRt } : {})
      .then((res) => {
        const { token, refreshToken } = res.data;
        setToken(token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        if (refreshToken) saveRefreshToken(refreshToken);
        return api.get('/auth/me');
      })
      .then((res) => setUser(res.data))
      .catch(() => {
        clearSession();
      })
      .finally(() => setLoading(false));
  }, []);

  // Interceptor de refresh automático em 401
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const isAuthRoute = originalRequest?.url?.includes('/auth/');

        if (
          error.response?.status === 401 &&
          !originalRequest?._retry &&
          !isAuthRoute
        ) {
          originalRequest._retry = true;
          try {
            const storedRt = loadRefreshToken();
            const res = await api.post('/auth/refresh', storedRt ? { refreshToken: storedRt } : {});
            const { token: newToken, refreshToken: newRt } = res.data;

            setToken(newToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            if (newRt) saveRefreshToken(newRt);

            return api(originalRequest);
          } catch {
            clearSession();
            setUser(null);
          }
        }

        return Promise.reject(error);
      }
    );

    interceptorRef.current = interceptor;
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const login = async (data) => {
    const res = await api.post('/auth/login', data);
    const { token, refreshToken, user: userData } = res.data;

    setToken(token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (refreshToken) saveRefreshToken(refreshToken);
    setUser(userData);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, refreshToken, user: userData } = res.data;

    setToken(token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (refreshToken) saveRefreshToken(refreshToken);
    setUser(userData);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continua mesmo se a request falhar
    }
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
