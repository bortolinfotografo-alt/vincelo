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
import { Send, MessageCircle, Search, X, Loader2, Paperclip, FileText, ChevronLeft } from 'lucide-react';
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

// ── Renderiza mídia dentro de uma bolha ───────────────────────
function MessageMedia({ mediaUrl, mediaType, isPdf }) {
  if (!mediaUrl) return null;
  if (isPdf) {
    return (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-1 underline text-sm opacity-90"
      >
        <FileText size={16} />
        Abrir documento
      </a>
    );
  }
  if (mediaType === 'VIDEO') {
    return (
      <video
        src={mediaUrl}
        controls
        className="mt-1 rounded-xl max-w-full max-h-48 object-cover"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl}
      alt="Anexo"
      className="mt-1 rounded-xl max-w-full max-h-48 object-cover cursor-pointer"
      onClick={() => window.open(mediaUrl, '_blank')}
    />
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
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  // Anexo
  const [attachFile, setAttachFile] = useState(null);   // File | null
  const [attachPreview, setAttachPreview] = useState(null); // URL | null
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

  // ── Gerencia anexo ──────────────────────────────────────────
  const handleAttachSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Detecta tipo pelo mimetype OU pela extensão (fallback para Windows screenshots)
    const ext = file.name.split('.').pop().toLowerCase();
    const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const videoExts = ['mp4', 'mov', 'avi', 'webm'];
    const isImage = file.type.startsWith('image/') || imageExts.includes(ext);
    const isVideo = file.type.startsWith('video/') || videoExts.includes(ext);
    setAttachFile(file);
    if (isImage || isVideo) {
      setAttachPreview(URL.createObjectURL(file));
    } else {
      setAttachPreview(null);
    }
    e.target.value = '';
  };

  const clearAttach = () => {
    setAttachFile(null);
    setAttachPreview(null);
  };

  // ── Envia mensagem (texto e/ou anexo) ──────────────────────
  const sendMessage = async () => {
    const hasText = newMessage.trim();
    if (!hasText && !attachFile) return;
    if (!selectedUser || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    const fileToSend = attachFile;
    clearAttach();

    try {
      const data = new FormData();
      data.append('receiverId', selectedUser.id);
      if (content) data.append('content', content);
      if (fileToSend) data.append('media', fileToSend);

      // Não define Content-Type manualmente — axios detecta FormData e inclui o boundary automaticamente
      await api.post('/chat', data, { timeout: 60000 });
      fetchMessages(selectedUser.id);
      fetchConversations();
    } catch (err) {
      // Restaura em caso de erro
      setNewMessage(content);
      if (fileToSend) {
        setAttachFile(fileToSend);
        const ext = fileToSend.name.split('.').pop().toLowerCase();
        const isImg = fileToSend.type.startsWith('image/') || ['jpg','jpeg','png','webp','gif'].includes(ext);
        const isVid = fileToSend.type.startsWith('video/') || ['mp4','mov','avi','webm'].includes(ext);
        if (isImg || isVid) setAttachPreview(URL.createObjectURL(fileToSend));
      }
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
                      const isMine = msg.senderId === user.id;
                      const isPdfUrl = msg.mediaUrl?.toLowerCase().endsWith('.pdf');
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                            isMine
                              ? 'bg-primary-500 text-white rounded-br-sm'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                          }`}>
                            <StoryReplyThumb previewUrl={msg.storyPreviewUrl} />
                            {msg.content && (
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                            <MessageMedia
                              mediaUrl={msg.mediaUrl}
                              mediaType={msg.mediaType}
                              isPdf={isPdfUrl}
                            />
                            <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-200 text-right' : 'text-gray-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {isMine && <span className="ml-1">{msg.isRead ? '✓✓' : '✓'}</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEnd} />
                </div>

                {/* Preview do anexo */}
                {attachFile && (
                  <div className="px-3 pb-0 pt-2 flex items-center gap-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="relative">
                      {(() => {
                        const ext = attachFile.name.split('.').pop().toLowerCase();
                        const isImg = attachFile.type.startsWith('image/') || ['jpg','jpeg','png','webp','gif'].includes(ext);
                        const isVid = attachFile.type.startsWith('video/') || ['mp4','mov','avi','webm'].includes(ext);
                        if (attachPreview && isImg) return <img src={attachPreview} alt="" className="h-16 w-16 object-cover rounded-lg" />;
                        if (attachPreview && isVid) return <video src={attachPreview} className="h-16 w-16 object-cover rounded-lg" />;
                        return (
                          <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center gap-1">
                            <FileText size={20} className="text-gray-500" />
                            <span className="text-[10px] text-gray-500 text-center px-1 truncate w-full">{ext.toUpperCase()}</span>
                          </div>
                        );
                      })()}
                      <button
                        onClick={clearAttach}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center"
                      >
                        <X size={10} />
                      </button>
                    </div>
                    <span className="text-xs text-gray-500 truncate max-w-[200px]">{attachFile.name}</span>
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
                    disabled={sending || (!newMessage.trim() && !attachFile)}
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
