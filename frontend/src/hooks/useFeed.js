'use client';

// ============================================================
// useFeed — hook para o feed social de posts
// Extrai a lógica de dados do componente de UI.
// Suporta feed personalizado (followed) e explore (todos).
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

/**
 * @param {'feed'|'explore'|'saved'} type - tipo de feed
 */
export function useFeed(type = 'feed') {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const endpoint = {
    feed: '/posts/feed',
    explore: '/posts/explore',
    saved: '/posts/saved',
  }[type];

  const fetchPosts = useCallback(
    async (pageNum = 1, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await api.get(endpoint, { params: { page: pageNum, limit: 10 } });
        const { posts: newPosts, totalPages } = res.data;

        setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
        setHasMore(pageNum < totalPages);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao carregar posts');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [endpoint]
  );

  useEffect(() => {
    setPage(1);
    fetchPosts(1, false);
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchPosts(next, true);
  }, [page, loadingMore, hasMore, fetchPosts]);

  const addPost = useCallback((newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const removePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const updatePost = useCallback((postId, updater) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...updater(p) } : p))
    );
  }, []);

  return {
    posts,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    addPost,
    removePost,
    updatePost,
    refresh: () => fetchPosts(1, false),
  };
}
