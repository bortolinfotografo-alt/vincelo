'use client';

/**
 * FollowButton — sem estado de hover via JS.
 *
 * O flicker mobile era causado por onMouseEnter/onMouseLeave que trocavam
 * o CONTEÚDO (texto + ícone) do botão. Em telas touch, o mouseenter dispara
 * ao tocar, o mouseleave pode não disparar até outra interação — o botão
 * fica preso no estado "hover" causando oscilação visual.
 *
 * Solução: a mudança de conteúdo (texto/ícone) é removida completamente.
 * Somente a COR muda no hover, e apenas via CSS (group-hover:), sem JS.
 * O estado do botão muda exclusivamente via clique/toque real.
 */

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { UserPlus, UserCheck } from 'lucide-react';

export default function FollowButton({
  userId,
  initialFollowing = false,
  onFollowChange,
  size = 'md',
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post(`/follow/${userId}`);
      setFollowing(res.data.following);
      if (onFollowChange) onFollowChange(res.data);
      // Notifica a StoriesBar para atualizar instantaneamente
      if (res.data.following) {
        window.dispatchEvent(new CustomEvent('followedUser', { detail: { userId } }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao seguir');
    } finally {
      setLoading(false);
    }
  };

  const pad = size === 'sm' ? 'px-3 py-1' : 'px-4 py-2';
  const txt = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 12 : 14;

  if (!following) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`
          ${pad} ${txt}
          rounded-lg font-semibold flex items-center gap-1.5
          bg-primary-500 text-white
          hover:bg-primary-600
          active:scale-95
          disabled:opacity-50
          transition-all duration-150
          touch-manipulation
        `}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
        ) : (
          <UserPlus size={iconSize} />
        )}
        Seguir
      </button>
    );
  }

  // Estado "Seguindo": conteúdo sempre igual, hover muda só a cor (via CSS)
  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        group
        ${pad} ${txt}
        rounded-lg font-semibold flex items-center gap-1.5
        bg-gray-100 text-gray-700 border border-gray-300
        dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
        hover:bg-red-50 hover:text-red-500 hover:border-red-300
        dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-500/40
        active:scale-95
        disabled:opacity-50
        transition-all duration-150
        touch-manipulation
      `}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
      ) : (
        <UserCheck size={iconSize} />
      )}
      Seguindo
    </button>
  );
}
