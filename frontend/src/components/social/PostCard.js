'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Bookmark, BookmarkCheck, BadgeCheck, Trash2, ExternalLink, Volume2, VolumeX, Share2 } from 'lucide-react';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import api from '@/lib/api';
import { useAuth } from '@/app/auth-context';
import toast from 'react-hot-toast';

// ── Avatar ────────────────────────────────────────────────────
// Usa o componente Avatar reutilizável do sistema de design
import { Avatar } from '@/components/ui/Avatar';
function UserAvatar({ user, size = 10 }) {
  // Mapeia o tamanho numérico para o sistema do Avatar component
  const sizeMap = { 8: 'sm', 10: 'md', 14: 'lg', 20: 'xl' };
  return <Avatar src={user?.avatar} name={user?.name} size={sizeMap[size] || 'md'} />;
}

// ── Renderiza descrição com #hashtags clicáveis ───────────────
function PostDescription({ text, authorId, authorName }) {
  if (!text) return null;

  const parts = text.split(/(#\w[\w\u00C0-\u017F]*)/g);

  return (
    <p className="text-sm text-gray-700 leading-relaxed dark:text-gray-200">
      <Link
        href={`/profile/${authorId}`}
        className="font-semibold text-gray-900 hover:underline mr-1 dark:text-white"
      >
        {authorName}
      </Link>
      {parts.map((part, i) =>
        part.startsWith('#') ? (
          <Link
            key={i}
            href={`/feed?tag=${encodeURIComponent(part.slice(1))}`}
            className="text-primary-500 hover:underline"
          >
            {part}
          </Link>
        ) : (
          part
        )
      )}
    </p>
  );
}

// ── Vídeo com autoplay por IntersectionObserver ───────────────
function AutoplayVideo({ src, className }) {
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
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
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
    // Propaga para todos os outros vídeos na página
    window.dispatchEvent(new CustomEvent('videoMuteChange', { detail: { muted: newMuted } }));
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        muted={muted}
        loop
        playsInline
        className={className}
      />
      {/* Botão mute */}
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

// ── PostCard principal ────────────────────────────────────────
export default function PostCard({ post, onDelete }) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(post.isSaved || false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const displayName = post.author?.company?.companyName || post.author?.name || 'Usuario';
  const subtitle =
    post.author?.role === 'FREELANCER'
      ? post.author.freelancer?.specialties?.slice(0, 2).join(' · ') || 'Freelancer'
      : 'Empresa';

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const handleSave = async () => {
    try {
      const res = await api.post(`/posts/${post.id}/save`);
      setSaved(res.data.saved);
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remover este post?')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      toast.success('Post removido');
      if (onDelete) onDelete(post.id);
    } catch {
      toast.error('Erro ao remover');
    }
    setMenuOpen(false);
  };

  // Aspect ratio
  const isPortrait = post.aspectRatio === 'PORTRAIT';
  const mediaWrapperClass = isPortrait ? 'bg-black flex justify-center' : 'bg-black';
  const mediaInnerClass = isPortrait ? 'w-full max-w-[340px] aspect-[9/16]' : 'w-full aspect-video';

  return (
    <article className="bg-white border border-gray-200 rounded-xl overflow-hidden dark:bg-gray-900 dark:border-gray-800">
      {/* Header: autor */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 hover:opacity-80">
          <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary-500 to-orange-400">
            <div className="bg-white p-0.5 rounded-full dark:bg-gray-900">
              <UserAvatar user={post.author} size={9} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{displayName}</span>
              {post.author.isVerified && (
                <BadgeCheck size={14} className="text-primary-400 fill-primary-400/20" />
              )}
            </div>
            <p className="text-xs text-gray-500">{subtitle} · {timeAgo(post.createdAt)}</p>
          </div>
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-500 hover:text-gray-700 p-1 dark:hover:text-gray-300"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-xl z-10 min-w-32 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              {currentUser && currentUser.id === post.author.id && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              )}
              <button
                onClick={() => { router.push(`/profile/${post.author.id}`); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <ExternalLink size={14} /> Ver perfil
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mídia */}
      {post.mediaUrl && (
        <div className={mediaWrapperClass}>
          <div className={mediaInnerClass}>
            {post.mediaType === 'VIDEO' ? (
              <AutoplayVideo src={post.mediaUrl} className="w-full h-full object-cover" />
            ) : (
              <img src={post.mediaUrl} alt={post.description || 'Post'} className="w-full h-full object-cover" />
            )}
          </div>
        </div>
      )}

      {/* Ações e descrição */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LikeButton postId={post.id} initialLiked={post.isLiked} initialCount={post.likeCount} />
            <CommentSection postId={post.id} initialCount={post.commentCount} />
            {/* Botão Compartilhar */}
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              title="Compartilhar"
            >
              <Share2 size={18} />
            </button>
          </div>
          <button
            onClick={handleSave}
            className={`transition-colors ${saved ? 'text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {saved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
          </button>
        </div>

        {/* Descrição com hashtags */}
        <PostDescription
          text={post.description}
          authorId={post.author.id}
          authorName={displayName}
        />
      </div>

      {/* Modal de compartilhamento */}
      {shareOpen && (
        <ShareModal
          post={post}
          authorName={displayName}
          onClose={() => setShareOpen(false)}
        />
      )}
    </article>
  );
}
