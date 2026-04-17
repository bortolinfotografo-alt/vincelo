'use client';

// ============================================================
// MEDIA CAROUSEL
// Exibe 1 ou mais mídias (foto/vídeo) com navegação por setas,
// dots e swipe. Suporta thumbnails (poster) em vídeos.
// Usado em PostCard (feed) e no modal do perfil.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Pause } from 'lucide-react';

// ── Vídeo com autoplay por IntersectionObserver ───────────────
export function AutoplayVideo({ src, poster, className }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('videoMuted') !== 'false';
  });
  const [playing, setPlaying] = useState(false);
  const [showPauseOverlay, setShowPauseOverlay] = useState(false);

  // Sincroniza mute com outros vídeos via evento global
  useEffect(() => {
    const onMuteChange = (e) => setMuted(e.detail.muted);
    window.addEventListener('videoMuteChange', onMuteChange);
    return () => window.removeEventListener('videoMuteChange', onMuteChange);
  }, []);

  // IntersectionObserver para autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().then(() => setPlaying(true)).catch(() => {});
        } else {
          video.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggleMute = (e) => {
    e.stopPropagation();
    const newMuted = !muted;
    setMuted(newMuted);
    localStorage.setItem('videoMuted', String(newMuted));
    window.dispatchEvent(new CustomEvent('videoMuteChange', { detail: { muted: newMuted } }));
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
    // Mostra overlay brevemente
    setShowPauseOverlay(true);
    setTimeout(() => setShowPauseOverlay(false), 800);
  };

  return (
    <div className="relative w-full h-full" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        // Sem poster no feed: inicia direto no primeiro frame, sem delay
        muted={muted}
        loop
        playsInline
        preload="auto"
        className={className}
      />

      {/* Overlay play/pause ao clicar */}
      {showPauseOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-3 animate-ping-once">
            {playing
              ? <Pause size={28} className="text-white fill-white" />
              : <Play  size={28} className="text-white fill-white" />
            }
          </div>
        </div>
      )}

      {/* Botão mute */}
      <button
        onClick={toggleMute}
        className="absolute bottom-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors z-10"
        title={muted ? 'Ativar som' : 'Mutar'}
      >
        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>

      {/* Botão play/pause fixo (canto inferior esquerdo) */}
      <button
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        className="absolute bottom-2 left-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors z-10"
        title={playing ? 'Pausar' : 'Reproduzir'}
      >
        {playing
          ? <Pause size={14} className="fill-white" />
          : <Play  size={14} className="fill-white" />
        }
      </button>
    </div>
  );
}

// Mapeia aspectRatio (enum DB) para classe CSS
function getAspectClass(aspectRatio) {
  switch (aspectRatio) {
    case 'PORTRAIT':    return 'aspect-[9/16]';
    case 'SQUARE':      return 'aspect-square';
    case 'LANDSCAPE_43': return 'aspect-[4/3]';
    case 'PORTRAIT_34': return 'aspect-[3/4]';
    default:            return 'aspect-square'; // LANDSCAPE → square no feed (melhor UX)
  }
}

// ── Carrossel principal ───────────────────────────────────────
export default function MediaCarousel({ post }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  // Normaliza: usa post.media[] se disponível, senão cria item único a partir de mediaUrl
  const items =
    post.media?.length > 0
      ? post.media
      : post.mediaUrl
      ? [{ mediaUrl: post.mediaUrl, mediaType: post.mediaType, thumbnailUrl: post.thumbnailUrl || null }]
      : [];

  if (items.length === 0) return null;

  const current = items[index];
  const isPortrait = post.aspectRatio === 'PORTRAIT';
  const wrapperClass = isPortrait ? 'bg-black flex justify-center' : 'bg-black';
  const innerAspect  = getAspectClass(post.aspectRatio);
  const innerClass   = isPortrait ? 'w-full max-w-[340px]' : 'w-full';

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(items.length - 1, i + 1));

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
    touchStartX.current = null;
  };

  return (
    <div
      className={wrapperClass}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`${innerClass} ${innerAspect} relative`}>
        {current.mediaType === 'VIDEO' ? (
          <AutoplayVideo
            src={current.mediaUrl}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={current.mediaUrl}
            alt={post.description || 'Post'}
            className="w-full h-full object-cover"
          />
        )}

        {/* Setas de navegação */}
        {items.length > 1 && (
          <>
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 disabled:opacity-0 transition-all z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goNext}
              disabled={index === items.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 disabled:opacity-0 transition-all z-10"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Dots + contador */}
        {items.length > 1 && (
          <>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'bg-white w-4' : 'bg-white/50 w-1.5'
                  }`}
                />
              ))}
            </div>
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-medium rounded-full px-2 py-0.5 z-10">
              {index + 1}/{items.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
