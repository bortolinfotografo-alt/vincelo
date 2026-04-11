'use client';

// ============================================================
// STORIES BAR
// Barra horizontal de stories no topo do feed.
//
// UX:
//   - Primeiro círculo = próprios stories do usuário.
//     Se tiver stories ativos: anel colorido, clique → viewer.
//     Ícone "+" sobreposto para adicionar novo story.
//     Se não tiver stories: círculo tracejado com "+".
//   - Demais círculos = pessoas que o usuário segue.
//
// Bug fix: o fetch só ocorre depois que a autenticação
// termina (loading = false), evitando race-condition com
// a renovação do token no AuthProvider.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { Plus, BadgeCheck } from 'lucide-react';
import StoryViewer from './StoryViewer';
import StoryPublishModal from './StoryPublishModal';
import api from '@/lib/api';
import { useAuth } from '@/app/auth-context';
import toast from 'react-hot-toast';

// Círculo de story de outro usuário
function StoryCircle({ group, index, onOpen }) {
  const hasUnseen = group.hasUnseen;
  const displayName = group.author.company?.companyName || group.author.name || '';
  const firstName = displayName.split(' ')[0];

  return (
    <button
      onClick={() => onOpen(index)}
      className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
    >
      <div className={`p-0.5 rounded-full ${
        hasUnseen
          ? 'bg-gradient-to-tr from-primary-500 to-orange-400'
          : 'bg-gray-300 dark:bg-gray-600'
      }`}>
        <div className="bg-white p-0.5 rounded-full dark:bg-gray-950">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
            {group.author.avatar ? (
              <img src={group.author.avatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
      <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors truncate w-16 text-center dark:text-gray-400 dark:group-hover:text-gray-200">
        {firstName}
      </span>
    </button>
  );
}

export default function StoriesBar() {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState([]);          // todos os grupos (API)
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [viewingOwn, setViewingOwn] = useState(false); // abre viewer apenas com próprios stories
  const [pendingFile, setPendingFile] = useState(null); // aguardando confirmação no modal
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ── Carrega o feed de stories ─────────────────────────────
  // Espera auth terminar para evitar race-condition com refresh token
  useEffect(() => {
    if (authLoading || !user) return;

    api.get('/stories/feed')
      .then((res) => {
        const fetched = (res.data.groups || []).map((g) => ({
          ...g,
          stories: [...g.stories].reverse(), // mais antigo primeiro dentro do grupo
        }));
        setGroups(fetched);
      })
      .catch(() => {});
  }, [authLoading, user]);

  // ── Separa próprio grupo dos outros ──────────────────────
  const ownGroup   = groups.find((g) => g.author.id === user?.id);
  const otherGroups = groups.filter((g) => g.author.id !== user?.id);

  // ── Abre o viewer (outros usuários) ──────────────────────
  const openViewer = (index) => {
    setViewingOwn(false);
    setStartIndex(index);
    setViewerOpen(true);
  };

  // ── Abre o viewer (próprios stories) ─────────────────────
  const openOwnViewer = () => {
    if (!ownGroup) return;
    setViewingOwn(true);
    setViewerOpen(true);
  };

  // ── Seleciona arquivo → abre modal de preview ────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    e.target.value = '';
  };

  // ── Publica story (chamado pelo StoryPublishModal) ────────
  const handlePublish = async (file, caption) => {
    setUploading(true);
    const data = new FormData();
    data.append('media', file);
    if (caption) data.append('caption', caption);

    try {
      await api.post('/stories', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Story publicado!');
      setPendingFile(null);

      // Recarrega o feed
      const res = await api.get('/stories/feed');
      const fetched = (res.data.groups || []).map((g) => ({
        ...g,
        stories: [...g.stories].reverse(),
      }));
      setGroups(fetched);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao publicar story');
      throw err; // propaga para o modal manter loading=false
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-1">

          {/* ── Círculo do próprio usuário ── */}
          {user && (
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="relative">
                {/* Área clicável para ver os próprios stories (se existir) */}
                <button
                  onClick={ownGroup ? openOwnViewer : () => fileInputRef.current?.click()}
                  className={`p-0.5 rounded-full block ${
                    ownGroup
                      ? 'bg-gradient-to-tr from-primary-500 to-orange-400'
                      : 'bg-transparent'
                  }`}
                >
                  <div className={`bg-white p-0.5 rounded-full dark:bg-gray-950 ${!ownGroup ? 'p-0' : ''}`}>
                    <div className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center ${
                      ownGroup
                        ? 'bg-gray-200 dark:bg-gray-700'
                        : 'bg-gray-100 border-2 border-dashed border-gray-400 hover:border-primary-500 transition-colors dark:bg-gray-800 dark:border-gray-600'
                    }`}>
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        !ownGroup && null
                      )}
                      {!ownGroup && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {uploading ? (
                            <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus size={20} className="text-primary-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Botão "+" para adicionar novo story (quando já tem stories) */}
                {ownGroup && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950 hover:bg-primary-600 transition-colors"
                    title="Adicionar story"
                  >
                    <Plus size={11} className="text-white" />
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <span className="text-xs text-gray-500 truncate w-16 text-center dark:text-gray-400">
                {ownGroup ? 'Seu story' : 'Adicionar'}
              </span>
            </div>
          )}

          {/* ── Stories das pessoas seguidas ── */}
          {otherGroups.map((group, i) => (
            <StoryCircle
              key={group.author.id}
              group={group}
              index={i}
              onOpen={openViewer}
            />
          ))}

          {otherGroups.length === 0 && !ownGroup && (
            <p className="text-xs text-gray-500 py-2 ml-2 dark:text-gray-400">
              Siga pessoas para ver os stories delas aqui.
            </p>
          )}
        </div>
      </div>

      {/* Modal de pré-publicação */}
      {pendingFile && (
        <StoryPublishModal
          file={pendingFile}
          onPublish={handlePublish}
          onCancel={() => setPendingFile(null)}
        />
      )}

      {/* Viewer de stories */}
      {viewerOpen && (viewingOwn ? ownGroup : otherGroups.length > 0) && (
        <StoryViewer
          groups={viewingOwn ? [ownGroup] : otherGroups}
          startGroupIndex={viewingOwn ? 0 : startIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
