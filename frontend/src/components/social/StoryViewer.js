'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, BadgeCheck, Pause, Play, Heart, Share2, Send } from 'lucide-react';
import StoryProgressBar from './StoryProgressBar';
import api from '@/lib/api';
import { useAuth } from '@/app/auth-context';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STORY_DURATION = 5000;

export default function StoryViewer({ groups, startGroupIndex = 0, onClose }) {
  const { user } = useAuth();
  const [groupIndex, setGroupIndex]   = useState(startGroupIndex);
  const [storyIndex, setStoryIndex]   = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers]         = useState([]);
  const [paused, setPaused]           = useState(false);

  // Overrides de like por storyId — evita sangramento de estado entre stories.
  // Chave: story.id → { liked: bool, likeCount: number }
  // Quando não há override, usa os dados vindos da API (story.isLiked / story.likeCount).
  const [likeOverrides, setLikeOverrides] = useState({});

  // Resposta por DM
  const [replyText, setReplyText]       = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyFocused, setReplyFocused] = useState(false);

  const holdRef  = useRef(false);
  const videoRef = useRef(null);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];

  // Like derivado: override tem prioridade sobre dado da API
  const override  = story ? likeOverrides[story.id] : undefined;
  const liked     = override !== undefined ? override.liked     : (story?.isLiked   || false);
  const likeCount = override !== undefined ? override.likeCount : (story?.likeCount || 0);

  // Pausa quando viewers abertos, reply focado ou paused manual
  const isPaused = paused || showViewers || replyFocused;

  // Pausa/retoma vídeo com isPaused
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPaused) video.pause();
    else video.play().catch(() => {});
  }, [isPaused]);

  // Registra visualização ao mudar de story
  useEffect(() => {
    if (!story || !user) return;
    api.post(`/stories/${story.id}/view`).catch(() => {});
  }, [story?.id]);

  const goNext = useCallback(() => {
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }, [storyIndex, groupIndex, group, groups, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((i) => i - 1);
      setStoryIndex(groups[groupIndex - 1].stories.length - 1);
    }
  }, [storyIndex, groupIndex, groups]);

  // Clique na área de mídia: 35% esquerda = voltar, resto = avançar
  const handleAreaClick = (e) => {
    if (holdRef.current) return;
    if (replyFocused) return; // não navega quando input está focado
    const { clientX, currentTarget } = e;
    const rect = currentTarget.getBoundingClientRect();
    if ((clientX - rect.left) < rect.width * 0.35) goPrev();
    else goNext();
  };

  // Desktop: botão play/pause
  const togglePause = (e) => {
    e.stopPropagation();
    setPaused((p) => !p);
  };

  // Mobile: pressionar e segurar pausa
  const handleTouchStart = (e) => {
    holdRef.current = false;
    const timeout = setTimeout(() => {
      holdRef.current = true;
      setPaused(true);
    }, 150);
    e._holdTimeout = timeout;
  };

  const handleTouchEnd = (e) => {
    clearTimeout(e._holdTimeout);
    if (holdRef.current) {
      setPaused(false);
      holdRef.current = false;
    }
  };

  // Curtir story — usa override isolado por storyId, sem vazar para outros stories
  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user || !story) return;
    const storyId   = story.id;
    const newLiked  = !liked;
    const newCount  = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    // Atualização otimista somente para este story
    setLikeOverrides((prev) => ({ ...prev, [storyId]: { liked: newLiked, likeCount: newCount } }));

    try {
      const res = await api.post(`/stories/${storyId}/like`);
      setLikeOverrides((prev) => ({ ...prev, [storyId]: { liked: res.data.liked, likeCount: res.data.likeCount } }));
    } catch {
      // Reverte somente este story
      setLikeOverrides((prev) => ({ ...prev, [storyId]: { liked, likeCount } }));
    }
  };

  // Compartilhar — copia link do perfil do autor
  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/profile/${group.author.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => toast.success('Link copiado!'))
        .catch(() => toast.error('Não foi possível copiar o link'));
    } else {
      toast.error('Navegador não suporta cópia automática');
    }
  };

  // Resposta privada → DM
  const handleReply = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!replyText.trim() || !user || !story) return;

    setReplyLoading(true);
    const storyContext = story.caption
      ? `"${story.caption}"`
      : `de ${new Date(story.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    try {
      await api.post('/chat', {
        receiverId: story.authorId,
        content: `↩ Respondeu ao seu story ${storyContext}: "${replyText.trim()}"`,
      });
      setReplyText('');
      setReplyFocused(false);
      toast.success('Resposta enviada!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao enviar resposta');
    } finally {
      setReplyLoading(false);
    }
  };

  const loadViewers = async (e) => {
    e.stopPropagation();
    if (!story || !user || user.id !== story.authorId) return;
    try {
      const res = await api.get(`/stories/${story.id}/views`);
      setViewers(res.data.views || []);
      setShowViewers(true);
    } catch {}
  };

  if (!group || !story) return null;

  const isAuthor = user?.id === story.authorId;
  const timeLeft = Math.max(0, Math.floor((new Date(story.expiresAt) - Date.now()) / 3600000));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">

      {/* Fechar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 text-white p-2 hover:bg-white/10 rounded-full"
      >
        <X size={24} />
      </button>

      {/* Navegar entre grupos — desktop */}
      {groupIndex > 0 && (
        <button
          onClick={() => { setGroupIndex((i) => i - 1); setStoryIndex(0); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full hidden md:flex z-30"
        >
          <ChevronLeft size={28} />
        </button>
      )}
      {groupIndex < groups.length - 1 && (
        <button
          onClick={() => { setGroupIndex((i) => i + 1); setStoryIndex(0); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full hidden md:flex z-30"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Container 9:16 */}
      <div
        className="relative bg-black overflow-hidden shadow-2xl rounded-2xl"
        style={{
          width: 'min(100vw, calc(100vh * 9 / 16))',
          height: 'min(100vh, calc(100vw * 16 / 9))',
          maxHeight: '100vh',
        }}
      >
        {/* Barra de progresso */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-2">
          <StoryProgressBar
            total={group.stories.length}
            current={storyIndex}
            duration={STORY_DURATION}
            onNext={goNext}
            paused={isPaused}
          />
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 flex items-center gap-3 px-4 py-2">
          <Link href={`/profile/${group.author.id}`} onClick={onClose}>
            <div className="w-10 h-10 rounded-full border-2 border-primary-400 overflow-hidden flex-shrink-0">
              {group.author.avatar ? (
                <img src={group.author.avatar} alt={group.author.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm">
                  {group.author.name?.charAt(0)}
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-white text-sm font-semibold truncate">{group.author.name}</span>
              {group.author.isVerified && (
                <BadgeCheck size={13} className="text-primary-400 flex-shrink-0" />
              )}
            </div>
            <span className="text-white/60 text-xs">{timeLeft}h restantes</span>
          </div>

          {/* Botão play/pause — desktop */}
          <button
            onClick={togglePause}
            className="hidden md:flex text-white/70 hover:text-white p-1 transition-colors"
            title={isPaused ? 'Reproduzir' : 'Pausar'}
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>

          {/* Views — só para autor */}
          {isAuthor && (
            <button
              onClick={loadViewers}
              className="text-white/70 hover:text-white p-1 transition-colors"
              title="Ver visualizações"
            >
              <Eye size={18} />
            </button>
          )}
        </div>

        {/* Mídia — área clicável com suporte a hold no mobile */}
        <div
          className="absolute inset-0 cursor-pointer select-none"
          onClick={handleAreaClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {story.mediaType === 'VIDEO' ? (
            <video
              key={story.id}
              ref={videoRef}
              src={story.mediaUrl}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              key={story.id}
              src={story.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}

          {/* Zonas de navegação (hover desktop) */}
          <div className="absolute inset-y-0 left-0 w-1/3 flex items-center justify-start pl-3 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <ChevronLeft size={32} className="text-white drop-shadow" />
          </div>
          <div className="absolute inset-y-0 right-0 w-1/3 flex items-center justify-end pr-3 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <ChevronRight size={32} className="text-white drop-shadow" />
          </div>

          {/* Indicador de pausado */}
          {isPaused && !showViewers && !replyFocused && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/40 rounded-full p-4">
                <Pause size={32} className="text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-20 left-0 right-0 z-10 px-4 pointer-events-none">
            <p className="text-white text-sm leading-relaxed text-center bg-black/40 rounded-xl px-3 py-2">
              {story.caption}
            </p>
          </div>
        )}

        {/* ── Barra inferior: reply + like + share ── */}
        {user && (
          <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-4 pt-2">
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>

              {/* Input de resposta (só para quem não é o autor) */}
              {!isAuthor && (
                <form onSubmit={handleReply} className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => setReplyFocused(true)}
                    onBlur={() => setReplyFocused(false)}
                    placeholder="Responder ao story..."
                    maxLength={300}
                    className="flex-1 bg-white/15 border border-white/25 text-white placeholder-white/50 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-white/50 transition-colors backdrop-blur-sm"
                  />
                  {replyText.trim() && (
                    <button
                      type="submit"
                      disabled={replyLoading}
                      className="bg-primary-500 text-white rounded-full p-2 hover:bg-primary-600 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {replyLoading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                      ) : (
                        <Send size={14} />
                      )}
                    </button>
                  )}
                </form>
              )}

              {/* Espaçador quando é o autor */}
              {isAuthor && <div className="flex-1" />}

              {/* Like */}
              <button
                onClick={handleLike}
                className="flex flex-col items-center gap-0.5 flex-shrink-0 group"
                title={liked ? 'Descurtir' : 'Curtir'}
              >
                <Heart
                  size={24}
                  className={`transition-all ${
                    liked
                      ? 'text-red-500 fill-red-500 scale-110'
                      : 'text-white/80 group-hover:text-white'
                  }`}
                />
                {likeCount > 0 && (
                  <span className="text-white/70 text-xs leading-none">{likeCount}</span>
                )}
              </button>

              {/* Compartilhar */}
              <button
                onClick={handleShare}
                className="text-white/80 hover:text-white transition-colors flex-shrink-0 p-1"
                title="Compartilhar"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Painel de viewers — sobrepõe e pausa o story */}
        {showViewers && (
          <div className="absolute inset-0 bg-black/85 z-30 flex flex-col rounded-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Eye size={16} className="text-primary-400" />
                Visualizações ({viewers.length})
              </h3>
              <button
                onClick={() => setShowViewers(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
              {viewers.length === 0 ? (
                <p className="text-gray-400 text-center mt-8 text-sm">Nenhuma visualização ainda</p>
              ) : (
                viewers.map((v) => (
                  <div key={v.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {v.viewer?.avatar ? (
                        <img src={v.viewer.avatar} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-xs text-gray-300 font-bold">
                          {v.viewer?.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{v.viewer?.name}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(v.viewedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
