'use client';

// ============================================================
// MEDIA CAROUSEL
// Exibe 1 ou mais mídias (foto/vídeo) com navegação por setas,
// dots e swipe. Suporta thumbnails (poster) em vídeos.
// Usado em PostCard (feed) e no modal do perfil.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

// ── Vídeo com autoplay por IntersectionObserver ───────────────
export function AutoplayVideo({ src, poster, className }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('videoMuted') !== 'false';
  });

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
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
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

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        loop
        playsInline
        className={className}
      />
      <button
        onClick={toggleMute}
        className="absolute bottom-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
        title={muted ? 'Ativar som' : 'Mutar'}
      >
        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
    </div>
  );
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
  const innerClass = isPortrait ? 'w-full max-w-[340px] aspect-[9/16]' : 'w-full aspect-square';

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(items.length - 1, i + 1));

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className={wrapperClass}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`${innerClass} relative`}>
        {current.mediaType === 'VIDEO' ? (
          <AutoplayVideo
            src={current.mediaUrl}
            poster={current.thumbnailUrl || post.thumbnailUrl || undefined}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={current.mediaUrl}
            alt={post.description || 'Post'}
            className="w-full h-full object-cover"
          />
        )}

        {/* Setas de navegação — desktop */}
        {items.length > 1 && (
          <>
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 disabled:opacity-0 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goNext}
              disabled={index === items.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 disabled:opacity-0 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Dots + contador */}
        {items.length > 1 && (
          <>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
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
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-medium rounded-full px-2 py-0.5">
              {index + 1}/{items.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
