// ============================================================
// FEED PAGE
// Feed social principal: stories + posts + sidebars
// ============================================================

'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import api from '@/lib/api';
import StoriesBar from '@/components/social/StoriesBar';
import PostCard from '@/components/social/PostCard';
import CreatePost from '@/components/social/CreatePost';
import PullToRefresh from '@/components/ui/PullToRefresh';
import {
  Compass, Users, Bookmark, UserPlus, BadgeCheck,
  Search, X, Briefcase, MapPin, ChevronRight, DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ============================================================
// Sidebar esquerda — Vagas Recentes
// ============================================================
function VagasRecentesPanel() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/jobs?limit=5&status=OPEN')
      .then((res) => setJobs(res.data.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-gray-900 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
        <Briefcase size={14} className="text-primary-400" />
        Vagas Recentes
      </h3>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-1.5">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">Nenhuma vaga aberta no momento.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="group">
              <Link href={`/jobs/${job.id}`} className="block hover:opacity-80 transition-opacity">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-primary-500 transition-colors">
                  {job.title}
                </p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {job.company?.user?.name || 'Empresa'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {job.location && (
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                      <MapPin size={9} /> {job.location}
                    </span>
                  )}
                  {job.budget && (
                    <span className="flex items-center gap-0.5 text-[10px] text-primary-400 font-medium">
                      <DollarSign size={9} /> R$ {Number(job.budget).toFixed(0)}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ))}

          <Link
            href="/jobs"
            className="flex items-center gap-1 text-[11px] text-primary-500 hover:text-primary-600 font-medium mt-1 pt-2 border-t border-gray-100 dark:border-gray-800"
          >
            Ver todas as vagas <ChevronRight size={11} />
          </Link>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sidebar direita — Sugestões de quem seguir
// ============================================================
function SuggestionsPanel() {
  const [suggestions, setSuggestions] = useState([]);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    api.get('/follow/suggestions')
      .then((res) => setSuggestions(res.data.suggestions || []))
      .catch(() => {});
  }, []);

  const handleFollow = async (userId) => {
    try {
      const res = await api.post(`/follow/${userId}`);
      setFollowing((prev) => ({ ...prev, [userId]: res.data.following }));
    } catch {
      toast.error('Erro ao seguir');
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-gray-900 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
        <UserPlus size={14} className="text-primary-400" />
        Sugestoes para seguir
      </h3>
      <div className="space-y-3">
        {suggestions.map((u) => {
          const displayName = u.company?.companyName || u.name || '';
          const sub =
            u.role === 'FREELANCER'
              ? u.freelancer?.specialties?.slice(0, 1).join('') || 'Freelancer'
              : 'Empresa';
          return (
            <div key={u.id} className="flex items-center gap-3">
              <Link href={`/profile/${u.id}`}>
                <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 dark:bg-gray-700">
                  {u.avatar ? (
                    <img src={u.avatar} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <Link href={`/profile/${u.id}`} className="text-xs font-semibold text-gray-900 hover:underline truncate dark:text-white">
                    {displayName}
                  </Link>
                  {u.isVerified && <BadgeCheck size={11} className="text-primary-400 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 truncate">{sub}</p>
              </div>
              <button
                onClick={() => handleFollow(u.id)}
                className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors flex-shrink-0 ${
                  following[u.id]
                    ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    : 'text-primary-500 hover:text-primary-600'
                }`}
              >
                {following[u.id] ? 'Seguindo' : 'Seguir'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Tabs: feed / explore / saved
// ============================================================
function FeedTabs({ tab, setTab }) {
  const tabs = [
    { id: 'feed',    icon: <Users size={16} />,   label: 'Seguindo' },
    { id: 'explore', icon: <Compass size={16} />,  label: 'Explorar' },
    { id: 'saved',   icon: <Bookmark size={16} />, label: 'Salvos' },
  ];
  return (
    <div className="bg-white border border-gray-200 rounded-xl flex overflow-hidden dark:bg-gray-900 dark:border-gray-800">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
            tab === t.id
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Barra de pesquisa
// ============================================================
function SearchBar({ onSearch, activeTag, onClearTag }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    try {
      const res = await api.get('/users/freelancers', { params: { search: val, limit: 5 } });
      setResults(res.data.freelancers || []);
      setOpen(true);
    } catch { setResults([]); }
  };

  const handleHashtagSearch = () => {
    const tag = query.replace(/^#/, '').trim();
    if (!tag) return;
    onSearch(tag);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 dark:bg-gray-900 dark:border-gray-800">
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={(e) => { if (e.key === 'Enter') handleHashtagSearch(); }}
          placeholder="Buscar perfil ou #hashtag..."
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none dark:text-gray-200 dark:placeholder-gray-600"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {activeTag && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Filtrando por:</span>
          <span className="flex items-center gap-1 bg-primary-500/10 text-primary-500 text-xs px-2 py-0.5 rounded-full border border-primary-500/30">
            #{activeTag}
            <button onClick={onClearTag} className="hover:text-primary-700 ml-0.5">
              <X size={11} />
            </button>
          </span>
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden dark:bg-gray-900 dark:border-gray-800">
          {results.map((u) => (
            <Link key={u.id} href={`/profile/${u.id}`} onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors dark:hover:bg-gray-800"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 dark:bg-gray-700">
                {u.avatar
                  ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">{u.name?.charAt(0).toUpperCase()}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                <p className="text-xs text-gray-500 truncate">{u.location || 'Freelancer'}</p>
              </div>
            </Link>
          ))}
          {query && (
            <button onClick={handleHashtagSearch}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-800"
            >
              <Search size={14} />
              Buscar posts com #{query.replace(/^#/, '')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Feed principal
// ============================================================
function FeedContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTag, setActiveTag] = useState(() => searchParams.get('tag') || '');

  useEffect(() => { if (!authLoading && !user) setTab('explore'); }, [user, authLoading]);

  useEffect(() => {
    setActiveTag(searchParams.get('tag') || '');
  }, [searchParams]);

  const loadPosts = useCallback(async (pageNum = 1, replace = true) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    try {
      let endpoint;
      if (activeTag) {
        endpoint = `/posts/explore?page=${pageNum}&tag=${encodeURIComponent(activeTag)}`;
      } else if (tab === 'saved' && user) {
        endpoint = `/posts/saved?page=${pageNum}`;
      } else if (tab === 'feed' && user) {
        endpoint = `/posts/feed?page=${pageNum}`;
      } else {
        endpoint = `/posts/explore?page=${pageNum}`;
      }
      const res = await api.get(endpoint);
      const newPosts = res.data.posts || [];
      if (replace) setPosts(newPosts); else setPosts((prev) => [...prev, ...newPosts]);
      setTotalPages(res.data.totalPages || 1);
    } catch { /* silencioso */ } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tab, user, activeTag]);

  useEffect(() => { setPage(1); loadPosts(1, true); }, [tab, activeTag]);

  const handleLoadMore = () => { const n = page + 1; setPage(n); loadPosts(n, false); };
  const handlePostCreated = (p) => setPosts((prev) => [p, ...prev]);
  const handlePostDeleted = (id) => setPosts((prev) => prev.filter((p) => p.id !== id));
  const handleHashtagSearch = (tag) => router.push(`/feed?tag=${encodeURIComponent(tag)}`);
  const handleClearTag = () => router.push('/feed');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-4">

          {/* ── Sidebar esquerda — Vagas Recentes (xl+) ── */}
          {user && (
            <aside className="w-60 flex-shrink-0 hidden xl:block">
              <div className="sticky top-6 space-y-4">
                <VagasRecentesPanel />
              </div>
            </aside>
          )}

          {/* ── Coluna principal ── */}
          <PullToRefresh onRefresh={() => loadPosts(1, true)}>
          <div className="flex-1 min-w-0 max-w-2xl mx-auto w-full space-y-4">
            {user && <StoriesBar />}

            <SearchBar
              onSearch={handleHashtagSearch}
              activeTag={activeTag}
              onClearTag={handleClearTag}
            />

            {user && !activeTag && <CreatePost onPostCreated={handlePostCreated} />}
            {!activeTag && <FeedTabs tab={tab} setTab={setTab} />}

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-200 rounded-xl h-64 animate-pulse dark:bg-gray-900" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center dark:bg-gray-900 dark:border-gray-800">
                <Compass size={40} className="text-gray-400 mx-auto mb-3 dark:text-gray-700" />
                <h3 className="text-gray-600 font-medium mb-2 dark:text-gray-400">
                  {activeTag ? `Nenhum post com #${activeTag}` : tab === 'feed' ? 'Seu feed está vazio' : tab === 'saved' ? 'Nenhum post salvo' : 'Nenhum post ainda'}
                </h3>
                <p className="text-gray-500 text-sm dark:text-gray-600">
                  {activeTag ? 'Tente outra hashtag.' : tab === 'feed' ? 'Siga outros usuários para ver posts aqui.' : tab === 'saved' ? 'Salve posts clicando no marcador.' : 'Seja o primeiro a publicar algo!'}
                </p>
                {(tab === 'feed' || activeTag) && (
                  <button onClick={() => { handleClearTag(); setTab('explore'); }} className="mt-4 text-sm text-primary-400 hover:underline">
                    Explorar todos os posts
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
                ))}
                {page < totalPages && (
                  <div className="flex justify-center py-4">
                    <button onClick={handleLoadMore} disabled={loadingMore} className="text-sm text-primary-400 hover:underline disabled:opacity-50">
                      {loadingMore ? 'Carregando...' : 'Carregar mais'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          </PullToRefresh>

          {/* ── Sidebar direita — Perfil + Sugestões (lg+) ── */}
          {user && (
            <aside className="w-64 flex-shrink-0 hidden xl:block">
              <div className="sticky top-6 space-y-4">
                {/* Perfil resumido */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 dark:bg-gray-900 dark:border-gray-800">
                  <Link href={`/profile/${user.id}`}>
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden dark:bg-gray-700">
                      {user.avatar
                        ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 dark:text-gray-300">{user.name?.charAt(0).toUpperCase()}</div>
                      }
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${user.id}`}>
                      <p className="text-sm font-semibold text-gray-900 hover:underline truncate dark:text-white">
                        {user.company?.companyName || user.name}
                      </p>
                    </Link>
                    <p className="text-xs text-gray-500">{user.role === 'FREELANCER' ? 'Freelancer' : 'Empresa'}</p>
                  </div>
                </div>
                <SuggestionsPanel />
              </div>
            </aside>
          )}

        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}>
      <FeedContent />
    </Suspense>
  );
}
