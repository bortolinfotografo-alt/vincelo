'use client';

// ============================================================
// useProfile — hook para dados de perfil de um usuário
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.get(`/users/${userId}`);
      setProfile(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { profile, loading, error, refresh: fetch, setProfile };
}
