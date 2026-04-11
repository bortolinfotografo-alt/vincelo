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
import { Send, MessageCircle, Search, X, Loader2 } from 'lucide-react';

const POLLING_INTERVAL = 5000;

// ── Componente interno (requer useSearchParams dentro de Suspense) ────────────
function ChatContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState([]);
  // conversationsLoaded distingue "ainda carregando" de "carregado mas vazio"
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false); // buscando usuário via URL param
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  const messagesEnd = useRef(null);
  const pollingRef = useRef(null);
  const selectedUserRef = useRef(null);
  // Flag: auto-select via URL param já foi processado
  const didAutoSelect = useRef(false);

  // Mantém ref sincronizada para o intervalo de polling sem stale closure
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  // Redireciona se não autenticado
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  // Carrega conversas e inicia polling quando o usuário estiver disponível
  useEffect(() => {
    if (!user) return;
    fetchConversations();
    startPolling();
    return () => stopPolling();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // AUTO-SELECT via ?userId=
  // Aguarda conversationsLoaded=true (garante que o fetch terminou),
  // independente de conversations estar vazio ou não.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (didAutoSelect.current) return;
    const targetId = searchParams.get('userId');
    if (!targetId || !conversationsLoaded) return; // aguarda fim do carregamento

    didAutoSelect.current = true; // marca imediatamente para evitar dupla execução

    const existingConv = conversations.find(
      (c) => String(c.user.id) === String(targetId)
    );

    if (existingConv) {
      // Conversa já existe — seleciona direto
      setSelectedUser(existingConv.user);
    } else {
      // Sem histórico com esse usuário — busca os dados dele e abre thread em branco
      setLoadingThread(true);
      api.get(`/users/${targetId}`)
        .then((res) => {
          // getUserById retorna o objeto do usuário no topo (não aninhado em .user)
          const u = res.data.user ?? res.data;
          if (u?.id) {
            setSelectedUser(u);
          } else {
            console.error('[Chat] Usuário não encontrado para userId:', targetId);
          }
        })
        .catch(() => {
          // Falha silenciosa — usuário vê o estado vazio sem travar
        })
        .finally(() => setLoadingThread(false));
    }
  }, [conversationsLoaded, conversations, searchParams]);

  // Carrega mensagens sempre que o usuário selecionado mudar
  useEffect(() => {
    if (selectedUser) fetchMessages(selectedUser.id);
    else setMessages([]);
  }, [selectedUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll automático para a última mensagem
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─────────────────────────────────────────────────────────────────────────
  // Funções de dados
  // ─────────────────────────────────────────────────────────────────────────
  function fetchConversations() {
    api.get('/chat')
      .then((res) => setConversations(res.data.conversations || []))
      .catch(() => {})
      .finally(() => {
        setLoadingConvs(false);
        setConversationsLoaded(true); // sinaliza que o fetch terminou, mesmo se vazio
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
      .catch(() => {});
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    try {
      await api.post('/chat', { receiverId: selectedUser.id, content });
      fetchMessages(selectedUser.id);
      fetchConversations();
    } catch {
      setNewMessage(content); // restaura texto se falhou
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Filtra lista pelo campo de busca
  const filtered = search.trim()
    ? conversations.filter((c) => {
        const name = (c.user.company?.companyName || c.user.name || '').toLowerCase();
        return name.includes(search.toLowerCase());
      })
    : conversations;

  // Nome de exibição do usuário selecionado
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
          <div className="border-r border-gray-200 dark:border-gray-800 flex flex-col">
            {/* Campo de busca */}
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
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

            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
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
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0 overflow-hidden">
                          {conv.user.avatar
                            ? <img src={conv.user.avatar} alt="" className="w-full h-full object-cover" />
                            : name.charAt(0).toUpperCase() || '?'}
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
          <div className="md:col-span-2 flex flex-col">
            {loadingThread ? (
              /* Spinner enquanto busca o usuário via URL param */
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-primary-500" />
              </div>

            ) : selectedUser ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center font-semibold text-primary-600 dark:text-primary-400 overflow-hidden flex-shrink-0">
                    {selectedUser.avatar
                      ? <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover" />
                      : selectedName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedName}</h3>
                    <p className="text-xs text-gray-400">Atualiza a cada 5s</p>
                  </div>
                </div>

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">
                      Nenhuma mensagem ainda. Diga olá!
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                            isMine
                              ? 'bg-primary-500 text-white rounded-br-sm'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
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

                {/* Input — habilitado apenas quando selectedUser está definido */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
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
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
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
              /* Estado vazio — nenhuma conversa selecionada */
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
