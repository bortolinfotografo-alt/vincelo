'use client';

// ============================================================
// useFreelancers — hook para listagem e filtragem de freelancers
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';

/**
 * @param {object} initialFilters
 */
export function useFreelancers(initialFilters = {}) {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState(initialFilters);

  const debounceRef = useRef(null);

  const fetchFreelancers = useCallback(async (currentFilters, currentPage) => {
    setLoading(true);
    try {
      const params = { ...currentFilters, page: currentPage, limit: 20 };
      Object.keys(params).forEach((k) => {
        if (params[k] === '' || params[k] === undefined || params[k] === null) {
          delete params[k];
        }
      });

      const res = await api.get('/users/freelancers', { params });
      setFreelancers(res.data.freelancers);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar freelancers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchFreelancers(filters, page);
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [filters, page, fetchFreelancers]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  return {
    freelancers,
    loading,
    error,
    total,
    page,
    totalPages,
    filters,
    setPage,
    updateFilters,
    clearFilters,
    refresh: () => fetchFreelancers(filters, page),
  };
}
