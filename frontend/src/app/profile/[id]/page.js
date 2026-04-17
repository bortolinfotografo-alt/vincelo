// ============================================================
// PUBLIC PROFILE PAGE
// Perfil publico de qualquer usuario (freelancer ou empresa)
// Layout social estilo Instagram, dark theme
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/app/auth-context';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  MapPin, Heart, MessageCircle, BadgeCheck, Grid3x3,
  Briefcase, ChevronRight, Play, MoreHorizontal, Trash2, Pencil, X, Zap,
} from 'lucide-react';
import BoostModal from '@/components/ui/BoostModal';
import FollowButton from '@/components/social/FollowButton';
import StoryViewer from '@/components/social/StoryViewer';
import MediaCarousel from '@/components/social/MediaCarousel';
import LikeButton from '@/components/social/LikeButton';
import CommentSection from '@/components/social/CommentSection';

// ============================================================
// Grid de posts (3 colunas, quadrado)
// ============================================================
function PostsGrid({ userId, isCurrentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [menuPostId, setMenuPostId] = useState(null);
  const [editPost, setEditPost] = useState(null); // { id, description }
  const [editText, setEditText] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    api.get(`/posts/user/${userId}?limit=9`)
      .then((res) => setPosts(res.data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleDelete = async (postId) => {
    if (!confirm('Excluir este post? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setMenuPostId(null);
      if (selectedPost?.id === postId) setSelectedPost(null);
    } catch {
      alert('Erro ao excluir post.');
    }
  };

  const openEdit = (post) => {
    setEditPost(post);
    setEditText(post.description || '');
    setMenuPostId(null);
    setSelectedPost(null);
  };

  const handleEdit = async () => {
    if (!editPost) return;
    setEditLoading(true);
    try {
      const res = await api.put(`/posts/${editPost.id}`, { description: editText });
      const updated = res.data.post || { ...editPost, description: editText };
      setPosts((prev) => prev.map((p) => (p.id === editPost.id ? { ...p, description: updated.description } : p)));
      setEditPost(null);
    } catch {
      alert('Erro ao editar post.');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) return (
    <div className="grid grid-cols-3 gap-0.5">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200 animate-pulse dark:bg-gray-800" />
      ))}
    </div>
  );

  if (posts.length === 0) return (
    <div className="text-center py-12">
      <Grid3x3 size={40} className="text-gray-700 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">Nenhum post ainda.</p>
      {isCurrentUser && (
        <Link href="/feed" className="text-primary-400 text-sm hover:underline mt-2 block">
          Publique algo no feed
        </Link>
      )}
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post) => (
          <div key={post.id} className="relative aspect-square group overflow-hidden bg-gray-200 dark:bg-gray-800">
            <button
              onClick={() => { setMenuPostId(null); setSelectedPost(post); }}
              className="w-full h-full"
            >
              {post.mediaUrl || post.media?.length > 0 ? (
                (() => {
                  // Thumbnail do grid: usa imagem de capa se disponível (melhor performance)
                  const firstMedia = post.media?.[0];
                  const isVideo = (firstMedia?.mediaType || post.mediaType) === 'VIDEO';
                  const thumbSrc = firstMedia?.thumbnailUrl || post.thumbnailUrl;
                  const mediaSrc = firstMedia?.mediaUrl || post.mediaUrl;

                  // Indicador de carrossel
                  const isCarousel = (post.media?.length || 0) > 1;

                  return (
                    <>
                      {isVideo && thumbSrc ? (
                        <img src={thumbSrc} alt="" className="w-full h-full object-cover" />
                      ) : isVideo ? (
                        <video src={mediaSrc} className="w-full h-full object-cover" />
                      ) : (
                        <img src={mediaSrc} alt="" className="w-full h-full object-cover" />
                      )}
                      {isVideo && (
                        <div className="absolute top-1.5 right-1.5">
                          <Play size={14} className="text-white drop-shadow" fill="white" />
                        </div>
                      )}
                      {isCarousel && (
                        <div className="absolute top-1.5 left-1.5 bg-black/50 rounded-full p-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                            <rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/>
                          </svg>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 p-2 dark:bg-gray-800">
                  <p className="text-gray-500 text-xs text-center line-clamp-3 dark:text-gray-400">{post.description}</p>
                </div>
              )}
              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-semibold">
                <span className="flex items-center gap-1">
                  <Heart size={14} fill="white" /> {post.likeCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={14} fill="white" /> {post.commentCount}
                </span>
              </div>
            </button>

            {/* Menu três pontos — só para o dono */}
            {isCurrentUser && (
              <div className="absolute top-1 right-1 z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuPostId(menuPostId === post.id ? null : post.id); }}
                  className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal size={14} className="text-white" />
                </button>
                {menuPostId === post.id && (
                  <div className="absolute top-8 right-0 w-36 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 z-20">
                    <button
                      onClick={() => openEdit(post)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Pencil size={14} /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de post individual — estilo Instagram */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedPost(null)}
        >
          {/* Botão fechar flutuante */}
          <button
            onClick={() => setSelectedPost(null)}
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors"
          >
            <X size={26} />
          </button>

          <div
            className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden w-full mx-4 flex flex-col md:flex-row md:mx-8"
            style={{ maxWidth: 900, maxHeight: '92vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Esquerda: Mídia */}
            <div className="md:w-[58%] bg-black flex items-center justify-center flex-shrink-0 min-h-0">
              <MediaCarousel post={selectedPost} />
            </div>

            {/* Direita: Info + comentários */}
            <div className="md:w-[42%] flex flex-col min-h-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800">
              {/* Data */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                <p className="text-xs text-gray-400">
                  {new Date(selectedPost.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Conteúdo rolável — sem scrollbar visível */}
              <div
                className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {selectedPost.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{selectedPost.description}</p>
                )}
                <CommentSection
                  postId={selectedPost.id}
                  initialCount={selectedPost.commentCount}
                />
              </div>

              {/* Ações fixas no rodapé */}
              <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 flex-shrink-0 space-y-2">
                <div className="flex items-center gap-4">
                  <LikeButton
                    postId={selectedPost.id}
                    initialLiked={selectedPost.isLiked}
                    initialCount={selectedPost.likeCount}
                  />
                </div>
                {isCurrentUser && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(selectedPost)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Pencil size={13} /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(selectedPost.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 size={13} /> Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {editPost && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setEditPost(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Editar post</h3>
              <button onClick={() => setEditPost(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              placeholder="Descrição do post..."
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:border-primary-500 resize-none"
              maxLength={500}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setEditPost(null)}
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                disabled={editLoading}
                className="px-4 py-2 text-sm rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {editLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// Perfil Freelancer
// ============================================================
function FreelancerProfile({ profile, followStats: initialFollowStats, isCurrentUser, currentUser }) {
  const [stories, setStories] = useState([]);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [followStats, setFollowStats] = useState(initialFollowStats);
  const [boostOpen, setBoostOpen] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  const handleFollowChange = (data) => {
    setFollowStats((prev) => ({
      ...prev,
      followersCount: data.followersCount,
      followingCount: data.followingCount,
      isFollowing: data.following,
    }));
  };

  useEffect(() => {
    api.get(`/stories/user/${profile.id}`)
      .then((res) => setStories(res.data.stories || []))
      .catch(() => {});
  }, [profile.id]);

  // Função para verificar se há stories ativos (não expirados)
  const hasActiveStories = stories.length > 0;

  // Funções para buscar listas de seguidores/seguindo
  const fetchFollowers = async () => {
    if (followersList.length > 0) return; // Já carregado

    setLoadingFollowers(true);
    try {
      const res = await api.get(`/follow/${profile.id}/followers`);
      setFollowersList(res.data.users || []);
    } catch (error) {
      console.error('Erro ao buscar seguidores:', error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    if (followingList.length > 0) return; // Já carregado

    setLoadingFollowing(true);
    try {
      const res = await api.get(`/follow/${profile.id}/following`);
      setFollowingList(res.data.users || []);
    } catch (error) {
      console.error('Erro ao buscar usuários que segue:', error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
          {/* Avatar + stories */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => hasActiveStories && setStoryViewerOpen(true)}
              className={`p-0.5 rounded-full ${
                hasActiveStories
                  ? 'bg-gradient-to-tr from-primary-500 to-orange-400 cursor-pointer'
                  : 'bg-gray-300 cursor-default dark:bg-gray-800'
              }`}
            >
              <div className="bg-white p-1 rounded-full dark:bg-gray-950">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500 dark:text-gray-400">
                      {profile.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </button>
            {hasActiveStories && (
              <span className="text-xs text-primary-400">Ver stories</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                {profile.isVerified && (
                  <BadgeCheck size={18} className="text-primary-400" />
                )}
              </div>
              {!isCurrentUser && currentUser && (
                <FollowButton
                  userId={profile.id}
                  initialFollowing={followStats.isFollowing}
                  onFollowChange={handleFollowChange}
                />
              )}
              {!isCurrentUser && currentUser && (
                <Link href={`/chat?userId=${profile.id}`}>
                  <button className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1.5 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                    <MessageCircle size={14} /> Mensagem
                  </button>
                </Link>
              )}
              {isCurrentUser && (
                <>
                  <Link href="/profile">
                    <button className="px-4 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                      Editar perfil
                    </button>
                  </Link>
                  <button
                    onClick={() => setBoostOpen(true)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 flex items-center gap-1.5 font-medium transition-colors">
                    <Zap size={14} fill="currentColor" /> Impulsionar
                  </button>
                  <BoostModal
                    open={boostOpen}
                    onClose={() => setBoostOpen(false)}
                    targetId={profile.id}
                    type="PROFILE"
                    label="seu perfil"
                    onSuccess={() => setBoostOpen(false)}
                  />
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 mb-3">
              <div className="text-center">
                <span className="text-gray-900 font-bold dark:text-white">{profile._count?.posts ?? 0}</span>
                <p className="text-xs text-gray-500">posts</p>
              </div>
              <button
                className="text-center hover:opacity-80"
                onClick={() => {
                  setShowFollowers(true);
                  fetchFollowers();
                }}
              >
                <span className="text-gray-900 font-bold dark:text-white">{followStats.followersCount}</span>
                <p className="text-xs text-gray-500">seguidores</p>
              </button>
              <button
                className="text-center hover:opacity-80"
                onClick={() => {
                  setShowFollowing(true);
                  fetchFollowing();
                }}
              >
                <span className="text-gray-900 font-bold dark:text-white">{followStats.followingCount}</span>
                <p className="text-xs text-gray-500">seguindo</p>
              </button>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              {profile.description && (
                <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap">{profile.description}</p>
              )}
              {profile.freelancer?.location && (
                <Link
                  href={`/freelancers?location=${encodeURIComponent(profile.freelancer.location)}`}
                  className="text-sm text-gray-500 flex items-center gap-1 hover:text-primary-400 transition-colors w-fit"
                >
                  <MapPin size={13} /> {profile.freelancer.location}
                </Link>
              )}
              {profile.avgRating > 0 && (
                <p className="text-sm text-yellow-400 flex items-center gap-1">
                  <Star size={13} fill="currentColor" />
                  {profile.avgRating} ({profile.reviewCount} avaliacoes)
                </p>
              )}
              {profile.freelancer?.hourlyRate > 0 && (
                <p className="text-sm text-primary-400 font-medium">
                  R$ {Number(profile.freelancer.hourlyRate).toFixed(2)}{profile.freelancer.rateType === 'DAILY' ? '/diária' : '/hora'}
                </p>
              )}
            </div>

            {/* Especialidades */}
            {profile.freelancer?.specialties?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.freelancer.specialties.map((s) => (
                  <span key={s} className="px-2.5 py-0.5 bg-primary-500/20 text-primary-300 text-xs rounded-full border border-primary-500/30">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Posts */}
        <div className="border-t border-gray-200 mb-1 dark:border-gray-800">
          <div className="flex items-center gap-1.5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-white">
            <Grid3x3 size={14} /> Posts
          </div>
          <PostsGrid userId={profile.id} isCurrentUser={isCurrentUser} />
        </div>
      </div>

      {/* Story viewer */}
      {storyViewerOpen && stories.length > 0 && (
        <StoryViewer
          groups={[{ author: profile, stories, hasUnseen: true }]}
          startGroupIndex={0}
          onClose={() => setStoryViewerOpen(false)}
        />
      )}

      {/* Modal de seguidores */}
      {showFollowers && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seguidores</h3>
              <button
                onClick={() => {
                  setShowFollowers(false);
                  setFollowersList([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingFollowers ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : followersList.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum seguidor ainda
                </div>
              ) : (
                <div className="space-y-3">
                  {followersList.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-300">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        {user.freelancer?.location && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.freelancer.location}
                          </p>
                        )}
                      </div>

                      <FollowButton userId={user.id} initialFollowing={user.isFollowing ?? false} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de usuários que está seguindo */}
      {showFollowing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seguindo</h3>
              <button
                onClick={() => {
                  setShowFollowing(false);
                  setFollowingList([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingFollowing ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : followingList.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum usuário sendo seguido
                </div>
              ) : (
                <div className="space-y-3">
                  {followingList.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-300">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        {user.freelancer?.location && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.freelancer.location}
                          </p>
                        )}
                      </div>

                      <FollowButton userId={user.id} initialFollowing={true} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Perfil Empresa
// ============================================================
function CompanyProfile({ profile, followStats: initialFollowStats, isCurrentUser, currentUser }) {
  const [openJobs, setOpenJobs] = useState([]);
  const [stories, setStories] = useState([]);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [followStats, setFollowStats] = useState(initialFollowStats);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  const handleFollowChange = (data) => {
    setFollowStats((prev) => ({
      ...prev,
      followersCount: data.followersCount,
      followingCount: data.followingCount,
      isFollowing: data.following,
    }));
  };

  useEffect(() => {
    api.get(`/stories/user/${profile.id}`)
      .then((res) => setStories(res.data.stories || []))
      .catch(() => {});
    // Busca vagas abertas da empresa (usa company.id, não o user.id)
    if (profile.company?.id) {
      api.get(`/jobs?companyId=${profile.company.id}&status=OPEN&limit=3`)
        .then((res) => setOpenJobs(res.data.jobs || []))
        .catch(() => {});
    }
  }, [profile.id]);

  // Funções para buscar listas de seguidores/seguindo
  const fetchFollowers = async () => {
    if (followersList.length > 0) return; // Já carregado

    setLoadingFollowers(true);
    try {
      const res = await api.get(`/follow/${profile.id}/followers`);
      setFollowersList(res.data.users || []);
    } catch (error) {
      console.error('Erro ao buscar seguidores:', error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    if (followingList.length > 0) return; // Já carregado

    setLoadingFollowing(true);
    try {
      const res = await api.get(`/follow/${profile.id}/following`);
      setFollowingList(res.data.users || []);
    } catch (error) {
      console.error('Erro ao buscar usuários que segue:', error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const companyName = profile.company?.companyName || profile.name;

  // Função para verificar se há stories ativos (não expirados)
  const hasActiveStories = stories.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
          <button
            onClick={() => hasActiveStories && setStoryViewerOpen(true)}
            className={`p-0.5 rounded-full flex-shrink-0 ${
              hasActiveStories ? 'bg-gradient-to-tr from-primary-500 to-orange-400' : 'bg-gray-300 dark:bg-gray-800'
            }`}
          >
            <div className="bg-white p-1 rounded-full dark:bg-gray-950">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center dark:bg-gray-700">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={companyName} className="w-full h-full object-cover" />
                ) : (
                  <Briefcase size={32} className="text-gray-400" />
                )}
              </div>
            </div>
          </button>
          {hasActiveStories && (
            <span className="text-xs text-primary-400">Ver stories</span>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{companyName}</h1>
                {profile.isVerified && <BadgeCheck size={18} className="text-primary-400" />}
              </div>
              {!isCurrentUser && currentUser && (
                <FollowButton userId={profile.id} initialFollowing={followStats.isFollowing} onFollowChange={handleFollowChange} />
              )}
              {!isCurrentUser && currentUser && (
                <Link href={`/chat?userId=${profile.id}`}>
                  <button className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1.5 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                    <MessageCircle size={14} /> Mensagem
                  </button>
                </Link>
              )}
              {isCurrentUser && (
                <>
                  <Link href="/profile">
                    <button className="px-4 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                      Editar perfil
                    </button>
                  </Link>
                  <button
                    onClick={() => setBoostOpen(true)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 flex items-center gap-1.5 font-medium transition-colors">
                    <Zap size={14} fill="currentColor" /> Impulsionar
                  </button>
                  <BoostModal
                    open={boostOpen}
                    onClose={() => setBoostOpen(false)}
                    targetId={profile.id}
                    type="PROFILE"
                    label="seu perfil"
                    onSuccess={() => setBoostOpen(false)}
                  />
                </>
              )}
            </div>

            {/* Stats empresa */}
            <div className="flex gap-6 mb-3">
              <div className="text-center">
                <button
                  className="text-center hover:opacity-80"
                  onClick={() => {
                    setShowFollowers(true);
                    fetchFollowers();
                  }}
                >
                  <span className="text-gray-900 font-bold dark:text-white">{followStats.followersCount}</span>
                  <p className="text-xs text-gray-500">seguidores</p>
                </button>
              </div>
              <div className="text-center">
                <span className="text-gray-900 font-bold dark:text-white">{profile._count?.posts ?? 0}</span>
                <p className="text-xs text-gray-500">posts</p>
              </div>
              {profile.avgRating > 0 && (
                <div className="text-center">
                  <span className="text-yellow-400 font-bold flex items-center gap-0.5 justify-center">
                    <Star size={12} fill="currentColor" /> {profile.avgRating}
                  </span>
                  <p className="text-xs text-gray-500">avaliacao</p>
                </div>
              )}
            </div>

            {profile.description && (
              <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap">{profile.description}</p>
            )}
            {profile.company?.segment && (
              <p className="text-xs text-gray-500 mt-1">{profile.company.segment}</p>
            )}
            {profile.company?.companyWebsite && (
              <a href={profile.company.companyWebsite} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary-400 hover:underline mt-1 block">
                {profile.company.companyWebsite}
              </a>
            )}
          </div>
        </div>

        {/* Vagas em aberto */}
        {openJobs.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 dark:text-white">
                <Briefcase size={14} className="text-primary-400" />
                Vagas em aberto
              </h3>
              <Link href="/jobs" className="text-xs text-primary-400 hover:underline flex items-center gap-0.5">
                Ver todas <ChevronRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {openJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg hover:bg-gray-150 transition-colors dark:bg-gray-800 dark:hover:bg-gray-750">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.serviceType} · {job.location}</p>
                  </div>
                  <span className="text-xs text-primary-400 font-medium">
                    R$ {Number(job.budget).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts da empresa */}
        <div className="border-t border-gray-200 mb-1 pt-0 dark:border-gray-800">
          <div className="flex items-center gap-2 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-white">
            <Grid3x3 size={14} /> Posts
          </div>
          <PostsGrid userId={profile.id} isCurrentUser={isCurrentUser} />
        </div>
      </div>

      {storyViewerOpen && stories.length > 0 && (
        <StoryViewer
          groups={[{ author: profile, stories, hasUnseen: true }]}
          startGroupIndex={0}
          onClose={() => setStoryViewerOpen(false)}
        />
      )}

      {/* Modal de seguidores */}
      {showFollowers && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seguidores</h3>
              <button
                onClick={() => {
                  setShowFollowers(false);
                  setFollowersList([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingFollowers ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : followersList.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum seguidor ainda
                </div>
              ) : (
                <div className="space-y-3">
                  {followersList.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-300">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        {user.freelancer?.location && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.freelancer.location}
                          </p>
                        )}
                      </div>

                      <FollowButton userId={user.id} initialFollowing={user.isFollowing ?? false} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de usuários que está seguindo */}
      {showFollowing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seguindo</h3>
              <button
                onClick={() => {
                  setShowFollowing(false);
                  setFollowingList([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingFollowing ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : followingList.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum usuário sendo seguido
                </div>
              ) : (
                <div className="space-y-3">
                  {followingList.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-300">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        {user.freelancer?.location && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.freelancer.location}
                          </p>
                        )}
                      </div>

                      <FollowButton userId={user.id} initialFollowing={true} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Pagina principal: carrega perfil e decide layout
// ============================================================
export default function PublicProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0, isFollowing: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/follow/${id}/status`),
    ])
      .then(([profileRes, followRes]) => {
        setProfile(profileRes.data);
        setFollowStats(followRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center dark:bg-gray-950">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center dark:bg-gray-950">
        <p className="text-gray-500">Perfil nao encontrado.</p>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === id;

  if (profile.role === 'COMPANY') {
    return (
      <CompanyProfile
        profile={profile}
        followStats={followStats}
        isCurrentUser={isCurrentUser}
        currentUser={currentUser}
      />
    );
  }

  return (
    <FreelancerProfile
      profile={profile}
      followStats={followStats}
      isCurrentUser={isCurrentUser}
      currentUser={currentUser}
    />
  );
}
