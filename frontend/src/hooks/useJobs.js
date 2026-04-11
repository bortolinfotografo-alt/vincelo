'use client';

// ============================================================
// useJobs — hook para listagem e filtragem de vagas
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';

/**
 * @param {object} initialFilters - filtros iniciais
 */
export function useJobs(initialFilters = {}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState(initialFilters);

  // Debounce para evitar requests a cada tecla
  const debounceRef = useRef(null);

  const fetchJobs = useCallback(async (currentFilters, currentPage) => {
    setLoading(true);
    try {
      const params = { ...currentFilters, page: currentPage, limit: 20 };
      // Remove valores vazios dos params
      Object.keys(params).forEach((k) => {
        if (params[k] === '' || params[k] === undefined || params[k] === null) {
          delete params[k];
        }
      });

      const res = await api.get('/jobs', { params });
      setJobs(res.data.jobs);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar vagas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchJobs(filters, page);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [filters, page, fetchJobs]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1); // reseta paginação ao filtrar
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  return {
    jobs,
    loading,
    error,
    total,
    page,
    totalPages,
    filters,
    setPage,
    updateFilters,
    clearFilters,
    refresh: () => fetchJobs(filters, page),
  };
}

/**
 * Hook para as minhas vagas (autenticado)
 */
export function useMyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/jobs/my');
      setJobs(res.data.jobs);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar suas vagas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { jobs, loading, error, refresh: fetch };
}
