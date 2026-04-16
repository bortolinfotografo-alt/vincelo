'use client';

// ============================================================
// NOTIFICATION PANEL
// Ícone de atividade + painel dropdown de notificações.
// Agrupamento por tipo+alvo (estilo Instagram).
// Polling leve a cada 30s no contador; lista completa ao abrir.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, X, Heart, MessageCircle, UserPlus, Clapperboard } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/app/auth-context';

// Texto e ícone por tipo
function notifMeta(type) {
  switch (type) {
    case 'LIKE':        return { label: 'curtiram sua publicação',  Icon: Heart,          color: 'text-red-500'     };
    case 'COMMENT':     return { label: 'comentou na sua publicação', Icon: MessageCircle,  color: 'text-blue-500'    };
    case 'FOLLOW':      return { label: 'passou a te seguir',       Icon: UserPlus,       color: 'text-green-500'   };
    case 'STORY_LIKE':  return { label: 'curtiu seu story',         Icon: Clapperboard,   color: 'text-orange-500'  };
    case 'STORY_REPLY': return { label: 'respondeu ao seu story',   Icon: MessageCircle,  color: 'text-primary-500' };
    default:            return { label: 'interagiu com você',       Icon: Activity,       color: 'text-gray-500'    };
  }
}

// Link de destino da notificação
function notifHref(notif) {
  if (notif.postId)  return `/feed#post-${notif.postId}`;
  if (notif.storyId) return `/feed`;
  if (notif.type === 'FOLLOW') return `/profile/${notif.actorId}`;
  return '/feed';
}

// Formata tempo relativo
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// Thumbnail do post (primeiro frame do carrossel ou imagem direta)
function PostThumb({ post }) {
  if (!post) return null;
  const url = post.media?.[0]?.mediaUrl || post.mediaUrl;
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
  );
}

// ── Agrupa notificações por (type + postId + storyId) ────────
// Retorna array de grupos: { key, type, actors[], post, story, isRead, createdAt }
function groupNotifications(notifications) {
  const map = new Map();

  for (const n of notifications) {
    const key = `${n.type}-${n.postId || ''}-${n.storyId || ''}`;
    if (!map.has(key)) {
      map.set(key, { key, type: n.type, actors: [], post: n.post, story: n.story, isRead: n.isRead, createdAt: n.createdAt });
    }
    const group = map.get(key);
    // Adiciona ator se ainda não está no grupo (evita repetição)
    if (!group.actors.find((a) => a.id === n.actor.id)) {
      group.actors.push(n.actor);
    }
    // Grupo não lido se qualquer notificação do grupo é não lida
    if (!n.isRead) group.isRead = false;
    // Mantém a data mais recente
    if (new Date(n.createdAt) > new Date(group.createdAt)) group.createdAt = n.createdAt;
  }

  return Array.from(map.values());
}

// ── Texto do grupo de atores ─────────────────────────────────
function actorsText(actors) {
  if (actors.length === 1) return actors[0].name;
  if (actors.length === 2) return `${actors[0].name} e ${actors[1].name}`;
  return `${actors[0].name}, ${actors[1].name} e mais ${actors.length - 2}`;
}

// side='top'  → abre para baixo (header desktop)
// side='bottom' → abre para cima (barra inferior mobile)
export default function NotificationPanel({ side = 'top' }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const pollRef = useRef(null);

  // ── Polling leve do contador (30s) ───────────────────────
  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count || 0);
    } catch { /* silencioso */ }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchCount();
    pollRef.current = setInterval(fetchCount, 30000);
    return () => clearInterval(pollRef.current);
  }, [user, fetchCount]);

  // ── Fecha ao clicar fora ─────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Abre painel: carrega lista e marca como lidas ────────
  const handleOpen = async () => {
    if (open) { setOpen(false); return; }

    // Primeiro abrir para calcular dimensões
    setOpen(true);
    setLoading(true);

    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(0);
      // Marca todas como lidas em background
      api.post('/notifications/read-all').catch(() => {});
    } catch { /* silencioso */ } finally {
      setLoading(false);
    }
  };

  // Posição do painel: 'bottom' = abre para cima (barra inferior), 'top' = abre para baixo (header)
  const panelPositionCls = side === 'bottom'
    ? 'bottom-full mb-2 right-0'
    : 'top-full mt-2 right-0';

  if (!user) return null;

  const groups = groupNotifications(notifications);

  return (
    <div className="relative">
      {/* Botão ícone */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        title="Atividade"
      >
        <Activity size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel dropdown */}
      {open && (
        <div
          className={`absolute w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden dark:bg-gray-900 dark:border-gray-700 ${panelPositionCls}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Atividade</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={16} />
            </button>
          </div>

          {/* Lista */}
          <div className="max-h-[440px] overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                      <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="py-12 text-center">
                <Activity size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-400">Nenhuma atividade ainda</p>
              </div>
            ) : (
              groups.map((group) => {
                const { label, Icon, color } = notifMeta(group.type);
                const href = notifHref({ ...group, actorId: group.actors[0]?.id });
                const firstActor = group.actors[0];
                return (
                  <Link
                    key={group.key}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0 ${
                      !group.isRead ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''
                    }`}
                  >
                    {/* Avatar do primeiro ator com ícone de tipo */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        {firstActor?.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={firstActor.avatar} alt={firstActor.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-300">
                            {firstActor?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm`}>
                        <Icon size={11} className={color} />
                      </div>
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug">
                        <span className="font-semibold">{actorsText(group.actors)}</span>
                        {' '}{label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(group.createdAt)}</p>
                    </div>

                    {/* Thumbnail do post/story */}
                    {group.post && <PostThumb post={group.post} />}
                    {group.story && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={group.story.mediaUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    )}

                    {/* Bolinha de não lido */}
                    {!group.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
