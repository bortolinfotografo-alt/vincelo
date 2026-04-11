'use client';

// Barra de stories no topo do feed (horizontal, estilo Instagram)
import { useState, useEffect, useRef } from 'react';
import { Plus, BadgeCheck } from 'lucide-react';
import StoryViewer from './StoryViewer';
import api from '@/lib/api';
import { useAuth } from '@/app/auth-context';
import toast from 'react-hot-toast';

// Card de story de um usuario
function StoryCircle({ group, index, onOpen }) {
  const hasUnseen = group.hasUnseen;
  const displayName = group.author.company?.companyName || group.author.name || '';
  const firstName = displayName.split(' ')[0];

  return (
    <button onClick={() => onOpen(index)} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
      <div className={`p-0.5 rounded-full ${hasUnseen
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
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/stories/feed')
      .then((res) => {
        const groups = (res.data.groups || []).map((g) => ({
          ...g,
          stories: [...g.stories].reverse(),
        }));
        setGroups(groups);
      })
      .catch(() => {});
  }, [user]);

  const openViewer = (index) => {
    setStartIndex(index);
    setViewerOpen(true);
  };

  const handleAddStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append('media', file);
    try {
      await api.post('/stories', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Story publicado!');
      // Recarrega os stories
      const res = await api.get('/stories/feed');
      const groups = (res.data.groups || []).map((g) => ({
        ...g,
        stories: [...g.stories].reverse(),
      }));
      setGroups(groups);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao publicar story');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-1">
          {/* Botao de adicionar story (proprio usuario) */}
          {user && (
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <label className="cursor-pointer relative">
                <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-dashed border-gray-400 flex items-center justify-center hover:border-primary-500 transition-colors overflow-hidden dark:bg-gray-800 dark:border-gray-600">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover opacity-60" />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus size={20} className="text-primary-400" />
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleAddStory}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-gray-500">Seu story</span>
            </div>
          )}

          {/* Stories de outros usuarios */}
          {groups.map((group, i) => (
            <StoryCircle key={group.author.id} group={group} index={i} onOpen={openViewer} />
          ))}

          {groups.length === 0 && (
            <p className="text-xs text-gray-600 py-2 ml-2">
              Siga pessoas para ver os stories delas aqui.
            </p>
          )}
        </div>
      </div>

      {/* Visualizador fullscreen */}
      {viewerOpen && groups.length > 0 && (
        <StoryViewer
          groups={groups}
          startGroupIndex={startIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
