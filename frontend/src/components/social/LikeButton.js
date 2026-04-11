'use client';

// Botao de curtida com animacao de coracao
import { useState } from 'react';
import { Heart } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function LikeButton({ postId, initialLiked = false, initialCount = 0 }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setCount((c) => c + (newLiked ? 1 : -1));
    if (newLiked) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 300);
    }

    try {
      const res = await api.post(`/posts/${postId}/like`);
      setLiked(res.data.liked);
      setCount(res.data.likeCount);
    } catch (err) {
      // Reverte em caso de erro
      setLiked(!newLiked);
      setCount((c) => c + (newLiked ? -1 : 1));
      toast.error('Erro ao curtir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1.5 text-sm transition-all ${
        liked ? 'text-red-500' : 'text-gray-500 hover:text-red-400 dark:text-gray-400'
      }`}
    >
      <Heart
        size={20}
        className={`transition-transform ${animate ? 'scale-125' : 'scale-100'}`}
        fill={liked ? 'currentColor' : 'none'}
      />
      <span>{count > 0 ? count : ''}</span>
    </button>
  );
}
