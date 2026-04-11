'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, BadgeCheck, Pause, Play } from 'lucide-react';
import StoryProgressBar from './StoryProgressBar';
import api from '@/lib/api';
import { useAuth } from '@/app/auth-context';
import Link from 'next/link';

const STORY_DURATION = 5000;

export default function StoryViewer({ groups, startGroupIndex = 0, onClose }) {
  const { user } = useAuth();
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [paused, setPaused] = useState(false);
  const holdRef = useRef(false);
  const videoRef = useRef(null);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];

  // Pausa automática quando painel de viewers está aberto
  const isPaused = paused || showViewers;

  // Pausa/retoma o vídeo quando isPaused muda
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPaused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isPaused]);

  // Registra visualizacao ao mudar de story
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
  // Ignora clique se foi um hold (touchend após pressionar)
  const handleAreaClick = (e) => {
    if (holdRef.current) return;
    const { clientX, currentTarget } = e;
    const rect = currentTarget.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    if (relativeX < rect.width * 0.35) goPrev();
    else goNext();
  };

  // ── Controles de pausa ──────────────────────────────────────

  // Desktop: botão play/pause
  const togglePause = (e) => {
    e.stopPropagation();
    setPaused((p) => !p);
  };

  // Mobile: pressionar e segurar pausa; soltar retoma
  const handleTouchStart = (e) => {
    holdRef.current = false;
    const timeout = setTimeout(() => {
      holdRef.current = true;
      setPaused(true);
    }, 150); // 150ms de hold para diferenciar de tap
    e._holdTimeout = timeout;
  };

  const handleTouchEnd = (e) => {
    clearTimeout(e._holdTimeout);
    if (holdRef.current) {
      setPaused(false);
      holdRef.current = false;
    }
  };

  const loadViewers = async (e) => {
    e.stopPropagation();
    if (!story || !user || user.id !== story.authorId) return;
    try {
      const res = await api.get(`/stories/${story.id}/views`);
      setViewers(res.data.views || []);
      setShowViewers(true); // pausa automaticamente via isPaused
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
          {isPaused && !showViewers && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/40 rounded-full p-4">
                <Pause size={32} className="text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-12 pointer-events-none">
            <p className="text-white text-sm leading-relaxed">{story.caption}</p>
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
