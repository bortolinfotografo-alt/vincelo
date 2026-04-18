// ============================================================
// CHAT PAGE
// Lista conversas, pré-seleciona via ?userId=, busca por nome
// Polling a cada 5s para novas mensagens (sem websocket)
// ============================================================

'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import api from '@/lib/api';
import { Send, MessageCircle, Search, X, Loader2, Paperclip, FileText, ChevronLeft, Download, ZoomIn, CornerUpLeft } from 'lucide-react';
import EmojiButton from '@/components/ui/EmojiButton';
import toast from 'react-hot-toast';

const POLLING_INTERVAL = 5000;
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutos

function isOnline(lastSeenAt) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

function OnlineBadge({ lastSeenAt, showLabel = true }) {
  const online = isOnline(lastSeenAt);
  return (
    <span className="flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${online ? 'bg-green-400' : 'bg-gray-400'}`} />
      {showLabel && (
        <span className={`text-xs ${online ? 'text-green-400' : 'text-gray-400'}`}>
          {online ? 'Online' : 'Offline'}
        </span>
      )}
    </span>
  );
}

// ── Citação de mensagem respondida (dentro do balão) ─────────
function ReplyQuote({ replyTo, isMine }) {
  if (!replyTo) return null;

  const hasImage = replyTo.mediaUrl && !replyTo.mediaUrl.toLowerCase().endsWith('.pdf');
  const hasGroup = replyTo.mediaGroup && (Array.isArray(replyTo.mediaGroup) ? replyTo.mediaGroup : JSON.parse(replyTo.mediaGroup)).length > 0;
  const firstGroupUrl = hasGroup
    ? (Array.isArray(replyTo.mediaGroup) ? replyTo.mediaGroup : JSON.parse(replyTo.mediaGroup))[0]?.url
    : null;
  const thumbUrl = firstGroupUrl || (hasImage ? replyTo.mediaUrl : null);

  const borderCls = isMine ? 'border-white/40 bg-white/10' : 'border-gray-300 dark:border-gray-600 bg-gray-200/60 dark:bg-gray-600/50';
  const nameCls   = isMine ? 'text-white/80' : 'text-primary-500 dark:text-primary-400';
  const textCls   = isMine ? 'text-white/70' : 'text-gray-500 dark:text-gray-400';

  return (
    <div className={`flex gap-2 rounded-lg border-l-4 px-2 py-1.5 mb-1.5 ${borderCls}`}>
      {thumbUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className={`text-[11px] font-semibold truncate ${nameCls}`}>{replyTo.sender?.name || 'Usuário'}</p>
        <p className={`text-[11px] truncate ${textCls}`}>
          {replyTo.content || (hasGroup ? '📷 Galeria' : hasImage ? '📷 Imagem' : '📎 Arquivo')}
        </p>
      </div>
    </div>
  );
}

// ── Miniatura do story respondido ────────────────────────────
function StoryReplyThumb({ previewUrl }) {
  if (!previewUrl) return null;
  const isVideo = /\.(mp4|mov|avi|webm)(\?|$)/i.test(previewUrl);
  return (
    <button
      type="button"
      onClick={() => window.open(previewUrl, '_blank')}
      className="block mb-1.5 relative group w-full text-left"
      title="Ver story"
    >
      {isVideo ? (
        <video src={previewUrl} className="w-full max-h-40 object-cover rounded-xl" muted playsInline />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Story" className="w-full max-h-40 object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
      )}
      <div className="absolute inset-0 rounded-xl bg-black/20 group-hover:bg-black/10 transition-colors flex items-end p-2">
        <span className="text-white text-[10px] font-medium bg-black/50 px-2 py-0.5 rounded-full">↩ Story</span>
      </div>
    </button>
  );
}

// ── Helpers de tipo ───────────────────────────────────────────
const IMG_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const VID_EXTS = ['mp4', 'mov', 'avi', 'webm'];

function fileIsImage(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  return file.type.startsWith('image/') || IMG_EXTS.includes(ext);
}
function fileIsVideo(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  return file.type.startsWith('video/') || VID_EXTS.includes(ext);
}

// ── Lightbox com navegação entre imagens ─────────────────────
function ImageLightbox({ items, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const [downloading, setDownloading] = useState(false);
  const current = items[idx];

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(current.url);
      const blob = await res.blob();
      const ext = current.url.split('?')[0].split('.').pop() || 'jpg';
      const filename = `arquivo.${ext}`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch {
      // fallback: abre em nova aba se fetch falhar (CORS restrito)
      window.open(current.url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, items.length - 1));
      if (e.key === 'ArrowLeft')  setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, items.length]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/92" onClick={onClose}>
      {/* Barra topo */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10" onClick={(e) => e.stopPropagation()}>
        <span className="text-white/60 text-sm">{items.length > 1 ? `${idx + 1} / ${items.length}` : ''}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors disabled:opacity-50"
          >
            <Download size={14} /> {downloading ? 'Baixando...' : 'Baixar'}
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Seta esquerda */}
      {idx > 0 && (
        <button onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl transition-colors z-10">
          ‹
        </button>
      )}

      {/* Mídia */}
      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {current.type === 'video' ? (
          <video src={current.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.url} alt="" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
        )}
      </div>

      {/* Seta direita */}
      {idx < items.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl transition-colors z-10">
          ›
        </button>
      )}

      {/* Miniaturas */}
      {items.length > 1 && (
        <div className="absolute bottom-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {items.map((item, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-colors ${i === idx ? 'border-white' : 'border-white/30'}`}>
              {item.type === 'video'
                ? <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-xs">▶</div>
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={item.url} alt="" className="w-full h-full object-cover" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Grade de mídia para media_group ──────────────────────────
function MediaGroup({ items, onOpen }) {
  const visible = items.slice(0, 4);
  const extra   = items.length - 4;
  const single  = items.length === 1;
  const gridCls = single ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <div className={`grid gap-0.5 mt-1 rounded-xl overflow-hidden ${gridCls}`} style={{ maxWidth: 280 }}>
      {visible.map((item, i) => {
        const isLast = i === 3 && extra > 0;
        return (
          <button key={i} type="button" onClick={() => onOpen(i)}
            className="relative aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden hover:opacity-90 transition-opacity">
            {item.type === 'video' ? (
              <>
                <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                    <span className="text-gray-800 text-xs ml-0.5">▶</span>
                  </div>
                </div>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url} alt="" className="w-full h-full object-cover" />
            )}
            {isLast && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{extra}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Renderiza mídia de arquivo único dentro de uma bolha ──────
function MessageMedia({ mediaUrl, mediaType, isPdf, onOpenImage }) {
  if (!mediaUrl) return null;
  if (isPdf) {
    return (
      <a href={mediaUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 mt-1 underline text-sm opacity-90">
        <FileText size={16} /> Abrir documento
      </a>
    );
  }
  if (mediaType === 'VIDEO') {
    return <video src={mediaUrl} controls className="mt-1 rounded-xl max-w-full max-h-48 object-cover" />;
  }
  return (
    <div className="relative mt-1 group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaUrl} alt="Anexo" className="rounded-xl max-w-full max-h-48 object-cover cursor-pointer"
        onClick={() => onOpenImage?.([{ type: 'image', url: mediaUrl }], 0)} />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-black/50 rounded-full p-2"><ZoomIn size={18} className="text-white" /></div>
      </div>
    </div>
  );
}

// ── Componente interno (requer useSearchParams dentro de Suspense) ────────────
function ChatContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [lightbox, setLightbox] = useState(null);     // { items: [{type,url}], index: number }
  const [replyingTo, setReplyingTo] = useState(null); // msg sendo respondida
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  // Anexos múltiplos
  const [attachFiles, setAttachFiles] = useState([]); // [{ file, preview, isImage, isVideo }]
  const fileInputRef = useRef(null);

  const messagesEnd = useRef(null);
  const pollingRef = useRef(null);
  const selectedUserRef = useRef(null);
  const didAutoSelect = useRef(false);

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
    startPolling();
    return () => stopPolling();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (didAutoSelect.current) return;
    const targetId = searchParams.get('userId');
    if (!targetId || !conversationsLoaded) return;

    didAutoSelect.current = true;

    const existingConv = conversations.find(
      (c) => String(c.user.id) === String(targetId)
    );

    if (existingConv) {
      setSelectedUser(existingConv.user);
    } else {
      setLoadingThread(true);
      api.get(`/users/${targetId}`)
        .then((res) => {
          const u = res.data.user ?? res.data;
          if (u?.id) setSelectedUser(u);
        })
        .catch(() => {})
        .finally(() => setLoadingThread(false));
    }
  }, [conversationsLoaded, conversations, searchParams]);

  useEffect(() => {
    if (selectedUser) fetchMessages(selectedUser.id);
    else setMessages([]);
  }, [selectedUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Limpa preview ao trocar de conversa
  useEffect(() => {
    clearAttach();
  }, [selectedUser]);

  function fetchConversations() {
    api.get('/chat')
      .then((res) => setConversations(res.data.conversations || []))
      .catch(() => {})
      .finally(() => {
        setLoadingConvs(false);
        setConversationsLoaded(true);
      });
  }

  function fetchMessages(userId, silent = false) {
    api.get(`/chat/${userId}`)
      .then((res) => {
        const newMsgs = res.data.messages || [];
        if (silent) {
          setMessages((prev) => {
            if (prev.length !== newMsgs.length) return newMsgs;
            const lastPrev = prev[prev.length - 1]?.id;
            const lastNew = newMsgs[newMsgs.length - 1]?.id;
            return lastPrev !== lastNew ? newMsgs : prev;
          });
        } else {
          setMessages(newMsgs);
        }
      })
      .catch((err) => {
        if (!silent) console.error('[Chat] Erro ao carregar mensagens:', err?.response?.status, err?.response?.data);
      });
  }

  function startPolling() {
    stopPolling();
    pollingRef.current = setInterval(() => {
      fetchConversations();
      if (selectedUserRef.current) fetchMessages(selectedUserRef.current.id, true);
    }, POLLING_INTERVAL);
  }

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  // ── Gerencia múltiplos anexos ──────────────────────────────
  const handleAttachSelect = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;

    const items = newFiles.slice(0, 10 - attachFiles.length).map((file) => {
      const isImage = fileIsImage(file);
      const isVideo = fileIsVideo(file);
      const preview = (isImage || isVideo) ? URL.createObjectURL(file) : null;
      return { file, preview, isImage, isVideo };
    });

    setAttachFiles((prev) => [...prev, ...items].slice(0, 10));
    e.target.value = '';
  };

  const removeAttach = (index) => {
    setAttachFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAttach = () => setAttachFiles([]);

  // Limpa reply ao trocar de conversa
  useEffect(() => { setReplyingTo(null); }, [selectedUser]);

  // ── Envia mensagem (texto e/ou múltiplos anexos) ─────────────
  const sendMessage = async () => {
    const hasText = newMessage.trim();
    if (!hasText && attachFiles.length === 0) return;
    if (!selectedUser || sending) return;

    setSending(true);
    const content = newMessage.trim();
    const filesToSend = [...attachFiles];
    const replyRef = replyingTo;
    setNewMessage('');
    clearAttach();
    setReplyingTo(null);

    try {
      const data = new FormData();
      data.append('receiverId', selectedUser.id);
      if (content) data.append('content', content);
      if (replyRef) data.append('replyToId', replyRef.id);
      filesToSend.forEach(({ file }) => data.append('media', file));

      await api.post('/chat', data, { timeout: 60000 });
      fetchMessages(selectedUser.id);
      fetchConversations();
    } catch (err) {
      setNewMessage(content);
      setAttachFiles(filesToSend);
      const msg = err?.response?.data?.message || err?.message || 'Erro ao enviar';
      console.error('[Chat] Erro ao enviar:', err?.response?.status, msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const filtered = search.trim()
    ? conversations.filter((c) => {
        const name = (c.user.company?.companyName || c.user.name || '').toLowerCase();
        return name.includes(search.toLowerCase());
      })
    : conversations;

  const selectedName = selectedUser
    ? (selectedUser.company?.companyName || selectedUser.name || 'Usuário')
    : '';

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {lightbox && <ImageLightbox items={lightbox.items} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Mensagens</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden dark:bg-gray-900 dark:border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">

          {/* ── Lista de conversas ─────────────────────────────────── */}
          <div className={`border-r border-gray-200 dark:border-gray-800 flex-col h-full overflow-hidden ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar conversa..."
                  className="w-full pl-8 pr-8 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-700 rounded-lg outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex flex-col gap-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm px-4">
                  {search ? 'Nenhum resultado.' : 'Nenhuma conversa ainda.'}
                </p>
              ) : (
                filtered.map((conv, i) => {
                  const name = conv.user.company?.companyName || conv.user.name || '';
                  const isSelected = selectedUser?.id === conv.user.id;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedUser(conv.user)}
                      className={`w-full text-left p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        isSelected ? 'bg-primary-50 dark:bg-primary-500/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center font-semibold text-primary-600 dark:text-primary-400 overflow-hidden">
                            {conv.user.avatar
                              ? <img src={conv.user.avatar} alt="" className="w-full h-full object-cover" />
                              : name.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${isOnline(conv.user.lastSeenAt) ? 'bg-green-400' : 'bg-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${
                            conv.unreadCount > 0
                              ? 'font-semibold text-gray-900 dark:text-white'
                              : 'font-medium text-gray-700 dark:text-gray-300'
                          }`}>
                            {name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-primary-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center flex-shrink-0 font-bold">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Área de chat ───────────────────────────────────────── */}
          <div className={`md:col-span-2 flex-col h-full overflow-hidden ${selectedUser || loadingThread ? 'flex' : 'hidden md:flex'}`}>
            {loadingThread ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-primary-500" />
              </div>

            ) : selectedUser ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 -ml-1 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center font-semibold text-primary-600 dark:text-primary-400 overflow-hidden">
                      {selectedUser.avatar
                        ? <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover" />
                        : selectedName.charAt(0).toUpperCase()}
                    </div>
                    {/* Bolinha de status no avatar */}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${isOnline(selectedUser.lastSeenAt) ? 'bg-green-400' : 'bg-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedName}</h3>
                    <OnlineBadge lastSeenAt={selectedUser.lastSeenAt} />
                  </div>
                </div>

                {/* Mensagens */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">
                      Nenhuma mensagem ainda. Diga olá!
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isMine   = msg.senderId === user.id;
                      const isPdfUrl = msg.mediaUrl?.toLowerCase().endsWith('.pdf');
                      const group    = msg.mediaGroup
                        ? (Array.isArray(msg.mediaGroup) ? msg.mediaGroup : JSON.parse(msg.mediaGroup))
                        : null;
                      const hasVisualMedia = (group || (msg.mediaUrl && !isPdfUrl));
                      const hasText        = !!msg.content;
                      const hasPdf         = isPdfUrl && msg.mediaUrl;
                      const timestamp      = new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      const alignCls       = isMine ? 'items-end' : 'items-start';
                      const bubbleCls      = isMine
                        ? 'bg-primary-500 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm';
                      const timeCls        = isMine ? 'text-primary-200 text-right' : 'text-gray-400';

                      return (
                        <div key={msg.id} className={`group flex items-end gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>

                          {/* Botão responder — aparece no hover, lado esquerdo para mensagem própria */}
                          {isMine && (
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 mb-1"
                              title="Responder"
                            >
                              <CornerUpLeft size={14} />
                            </button>
                          )}

                          <div className={`flex flex-col gap-1 max-w-[75%] ${alignCls}`}>
                            <StoryReplyThumb previewUrl={msg.storyPreviewUrl} />

                            {/* ── Mídia visual (sem balão colorido) ── */}
                            {hasVisualMedia && (
                              <div className="relative">
                                {/* Citação acima da mídia */}
                                {msg.replyTo && (
                                  <div className={`rounded-xl px-3 py-2 mb-0.5 ${isMine ? 'bg-primary-500/80' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <ReplyQuote replyTo={msg.replyTo} isMine={isMine} />
                                  </div>
                                )}
                                {group ? (
                                  <MediaGroup items={group} onOpen={(i) => setLightbox({ items: group, index: i })} />
                                ) : (
                                  <MessageMedia
                                    mediaUrl={msg.mediaUrl}
                                    mediaType={msg.mediaType}
                                    isPdf={false}
                                    onOpenImage={(items, idx) => setLightbox({ items, index: idx })}
                                  />
                                )}
                                {!hasText && !hasPdf && (
                                  <div className="absolute bottom-1.5 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
                                    {timestamp}
                                    {isMine && <span className="ml-1">{msg.isRead ? '✓✓' : '✓'}</span>}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* ── PDF ── */}
                            {hasPdf && (
                              <div className={`rounded-2xl px-4 py-2.5 ${bubbleCls}`}>
                                {msg.replyTo && <ReplyQuote replyTo={msg.replyTo} isMine={isMine} />}
                                <MessageMedia mediaUrl={msg.mediaUrl} mediaType={msg.mediaType} isPdf={true} onOpenImage={() => {}} />
                                <p className={`text-[10px] mt-1 ${timeCls}`}>{timestamp}{isMine && <span className="ml-1">{msg.isRead ? '✓✓' : '✓'}</span>}</p>
                              </div>
                            )}

                            {/* ── Balão de texto ── */}
                            {hasText && (
                              <div className={`rounded-2xl px-4 py-2.5 ${bubbleCls}`}>
                                {msg.replyTo && !hasVisualMedia && <ReplyQuote replyTo={msg.replyTo} isMine={isMine} />}
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                <p className={`text-[10px] mt-0.5 ${timeCls}`}>{timestamp}{isMine && <span className="ml-1">{msg.isRead ? '✓✓' : '✓'}</span>}</p>
                              </div>
                            )}

                            {/* ── Só timestamp (fallback) ── */}
                            {!hasVisualMedia && !hasPdf && !hasText && (
                              <div className={`rounded-2xl px-4 py-2.5 ${bubbleCls}`}>
                                <p className={`text-[10px] ${timeCls}`}>{timestamp}</p>
                              </div>
                            )}
                          </div>

                          {/* Botão responder — lado direito para mensagem do outro */}
                          {!isMine && (
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 mb-1"
                              title="Responder"
                            >
                              <CornerUpLeft size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEnd} />
                </div>

                {/* Barra de resposta */}
                {replyingTo && (
                  <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
                    <div className="w-0.5 h-8 bg-primary-500 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-primary-500">
                        {replyingTo.senderId === user.id ? 'Você' : selectedName}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {replyingTo.content || (replyingTo.mediaGroup ? '📷 Galeria' : replyingTo.mediaUrl ? '📷 Imagem' : '📎 Arquivo')}
                      </p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Preview de múltiplos anexos */}
                {attachFiles.length > 0 && (
                  <div className="px-3 pt-2 pb-1 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      {attachFiles.map(({ file, preview, isImage, isVideo }, i) => (
                        <div key={i} className="relative flex-shrink-0">
                          {preview && isImage
                            ? <img src={preview} alt="" className="h-14 w-14 object-cover rounded-lg" />
                            : preview && isVideo
                              ? <video src={preview} className="h-14 w-14 object-cover rounded-lg" />
                              : (
                                <div className="h-14 w-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center gap-0.5">
                                  <FileText size={18} className="text-gray-500" />
                                  <span className="text-[9px] text-gray-500 px-1 truncate w-full text-center">
                                    {file.name.split('.').pop().toUpperCase()}
                                  </span>
                                </div>
                              )
                          }
                          <button onClick={() => removeAttach(i)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-800 text-white rounded-full flex items-center justify-center">
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                      {attachFiles.length < 10 && (
                        <button onClick={() => fileInputRef.current?.click()}
                          className="h-14 w-14 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-400 transition-colors flex-shrink-0">
                          <span className="text-xl leading-none">+</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{attachFiles.length}/10 arquivo{attachFiles.length !== 1 ? 's' : ''}</p>
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
                  {/* Clipe — seleciona arquivo */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-400 hover:text-primary-500 transition-colors flex-shrink-0"
                    title="Anexar arquivo"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,application/pdf"
                    multiple
                    onChange={handleAttachSelect}
                    className="hidden"
                  />

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Mensagem para ${selectedName}...`}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-700 rounded-full px-4 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none transition-colors"
                    disabled={sending}
                    maxLength={2000}
                    autoFocus
                  />

                  <EmojiButton onEmoji={(e) => setNewMessage((p) => p + e)} side="top" />

                  <button
                    onClick={sendMessage}
                    disabled={sending || (!newMessage.trim() && attachFiles.length === 0)}
                    className="w-10 h-10 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-200 dark:disabled:bg-gray-700 text-white disabled:text-gray-400 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                    title="Enviar (Enter)"
                  >
                    {sending
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Send size={16} />}
                  </button>
                </div>
              </>

            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Selecione uma conversa para começar</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Wrapper com Suspense (obrigatório para useSearchParams no App Router) ─────
export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
