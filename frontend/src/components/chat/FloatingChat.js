'use client';

// Chat flutuante estilo Instagram Web — tema claro/escuro dinâmico
// Estados: collapsed → list → thread

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/app/auth-context';
import api from '@/lib/api';
import { MessageCircle, X, ChevronLeft, Send, Maximize2 } from 'lucide-react';
import Link from 'next/link';

const POLL_MS = 5000;

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function Avatar({ user, size = 10 }) {
  const name = user?.company?.companyName || user?.name || '';
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-600 dark:text-white`}>
      {user?.avatar
        ? <img src={user.avatar} alt={name} className="w-full h-full object-cover" />
        : name.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

// ── Lista de conversas ────────────────────────────────────────
function ConvList({ conversations, loading, onSelect }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {loading ? (
        <div className="flex justify-center py-6 text-sm text-gray-400">Carregando...</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-8 px-4 text-sm text-gray-400">Nenhuma conversa ainda.</div>
      ) : (
        conversations.map((conv, i) => (
          <button
            key={i}
            onClick={() => onSelect(conv)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <div className="relative flex-shrink-0">
              <Avatar user={conv.user} size={10} />
              {conv.unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                {conv.user.company?.companyName || conv.user.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
            </div>
            {conv.lastMessageAt && (
              <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(conv.lastMessageAt)}</span>
            )}
          </button>
        ))
      )}
    </div>
  );
}

// ── Thread de mensagens ───────────────────────────────────────
function MessageThread({ currentUser, partner, messages, onBack, onSend }) {
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <Avatar user={partner} size={8} />
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1">
          {partner.company?.companyName || partner.name}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 text-xs py-4">Nenhuma mensagem. Diga olá!</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                  isMine
                    ? 'bg-primary-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-0.5 ${isMine ? 'text-primary-200 text-right' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {isMine && <span className="ml-1">{msg.isRead ? '✓✓' : '✓'}</span>}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 dark:border-gray-800">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Mensagem..."
          maxLength={2000}
          className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-primary-500"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="text-primary-500 hover:text-primary-600 disabled:text-gray-300 dark:disabled:text-gray-600 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function FloatingChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState('list');
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const pollRef = useRef(null);
  const selectedRef = useRef(null);

  useEffect(() => { selectedRef.current = selectedConv; }, [selectedConv]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/chat');
      const convs = res.data.conversations || [];
      setConversations(convs);
      setUnreadTotal(convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0));
    } catch { /* silencioso */ }
  }, [user]);

  const fetchMessages = useCallback(async (userId, silent = false) => {
    try {
      const res = await api.get(`/chat/${userId}`);
      const msgs = res.data.messages || [];
      if (silent) {
        setMessages((prev) => {
          if (prev.length === msgs.length && prev[prev.length - 1]?.id === msgs[msgs.length - 1]?.id) return prev;
          return msgs;
        });
      } else {
        setMessages(msgs);
      }
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
    if (!open) return;
    pollRef.current = setInterval(() => {
      fetchConversations();
      if (selectedRef.current) fetchMessages(selectedRef.current.user.id, true);
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [user, open, fetchConversations, fetchMessages]);

  useEffect(() => {
    if (open && conversations.length === 0) {
      setLoadingConvs(true);
      fetchConversations().finally(() => setLoadingConvs(false));
    }
  }, [open]);

  const handleSelectConv = (conv) => {
    setSelectedConv(conv);
    setScreen('thread');
    fetchMessages(conv.user.id);
  };

  const handleBack = () => {
    setScreen('list');
    setSelectedConv(null);
    setMessages([]);
    fetchConversations();
  };

  const handleSend = async (content) => {
    if (!selectedConv) return;
    try {
      await api.post('/chat', { receiverId: selectedConv.user.id, content });
      fetchMessages(selectedConv.user.id);
      fetchConversations();
    } catch { /* silencioso */ }
  };

  if (!user) return null;

  return (
    <div className="hidden md:flex fixed bottom-24 right-5 z-[60] flex-col items-end gap-2">
      {/* Painel expandido */}
      {open && (
        <div className="w-80 h-[420px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden dark:bg-gray-900 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Mensagens
              {unreadTotal > 0 && (
                <span className="ml-2 bg-primary-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              <Link href="/chat" onClick={() => setOpen(false)}>
                <button className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Abrir em tela cheia">
                  <Maximize2 size={14} />
                </button>
              </Link>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {screen === 'list' ? (
            <ConvList conversations={conversations} loading={loadingConvs} onSelect={handleSelectConv} />
          ) : (
            <MessageThread
              currentUser={user}
              partner={selectedConv.user}
              messages={messages}
              onBack={handleBack}
              onSend={handleSend}
            />
          )}
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative w-12 h-12 bg-white border border-gray-200 rounded-full shadow-xl flex items-center justify-center hover:bg-gray-50 transition-colors dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        <MessageCircle size={22} className={open ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'} />
        {!open && unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold px-0.5">
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </span>
        )}
      </button>
    </div>
  );
}
