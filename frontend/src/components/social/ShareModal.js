'use client';

// Modal de compartilhamento de post
// Aba 1: Chat interno (envia link ao contato)
// Aba 2: Redes externas (WhatsApp, Facebook, X, copiar)

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, MessageCircle, Share2, Copy, Check, ExternalLink, Send } from 'lucide-react';
import toast from 'react-hot-toast';

// Ícones SVG das redes externas
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-green-500"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-blue-600"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-gray-900 dark:text-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);

// ── Aba: Chat Interno ─────────────────────────────────────────
function InternalShareTab({ postUrl, postText, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [sent, setSent] = useState({});

  useEffect(() => {
    api.get('/chat')
      .then((res) => setConversations(res.data.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async (userId) => {
    setSending(userId);
    const message = `${postText}\n\n🔗 ${postUrl}`;
    try {
      await api.post('/chat', { receiverId: userId, content: message });
      setSent((prev) => ({ ...prev, [userId]: true }));
      toast.success('Post compartilhado no chat!');
    } catch {
      toast.error('Erro ao enviar');
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-sm text-gray-400">Carregando contatos...</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="py-8 text-center">
        <MessageCircle size={32} className="text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Nenhuma conversa ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-64 overflow-y-auto">
      {conversations.map((conv) => {
        const name = conv.user.company?.companyName || conv.user.name || '';
        const isSent = sent[conv.user.id];
        return (
          <div key={conv.user.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
              {conv.user.avatar
                ? <img src={conv.user.avatar} alt="" className="w-full h-full object-cover" />
                : name.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">{name}</span>
            <button
              onClick={() => handleSend(conv.user.id)}
              disabled={!!sending || isSent}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isSent
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50'
              }`}
            >
              {isSent ? <><Check size={12} /> Enviado</> : sending === conv.user.id ? '...' : <><Send size={12} /> Enviar</>}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Aba: Redes Externas ───────────────────────────────────────
function ExternalShareTab({ postUrl, postText }) {
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    {
      label: 'WhatsApp',
      icon: <WhatsAppIcon />,
      bg: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40',
      url: `https://wa.me/?text=${encodeURIComponent(`${postText}\n\n${postUrl}`)}`,
    },
    {
      label: 'Facebook',
      icon: <FacebookIcon />,
      bg: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}&quote=${encodeURIComponent(postText)}`,
    },
    {
      label: 'X (Twitter)',
      icon: <XIcon />,
      bg: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
      url: `https://x.com/intent/tweet?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(postUrl)}`,
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Vincelo', text: postText, url: postUrl }).catch(() => {});
    }
  };

  return (
    <div className="space-y-3">
      {/* Redes */}
      <div className="grid grid-cols-3 gap-2">
        {shareLinks.map((s) => (
          <a
            key={s.label}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${s.bg}`}
          >
            {s.icon}
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{s.label}</span>
          </a>
        ))}
      </div>

      {/* Copiar link */}
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-700">
        <ExternalLink size={14} className="text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-500 truncate flex-1">{postUrl}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs font-semibold text-primary-500 hover:text-primary-600 flex-shrink-0"
        >
          {copied ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
        </button>
      </div>

      {/* Web Share API (mobile) */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <button
          onClick={handleNativeShare}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Share2 size={15} /> Compartilhar via...
        </button>
      )}
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────
export default function ShareModal({ post, authorName, onClose }) {
  const [tab, setTab] = useState('internal');

  const postUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/profile/${post.author?.id || post.authorId}`
    : '';
  const postText = `Confira este post de ${authorName} na Vincelo${post.description ? ': "' + post.description.slice(0, 80) + (post.description.length > 80 ? '..."' : '"') : ''}`;

  // Fecha ao pressionar Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Compartilhar</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          {[
            { id: 'internal', icon: <MessageCircle size={14} />, label: 'Chat Interno' },
            { id: 'external', icon: <Share2 size={14} />,        label: 'Redes Externas' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Conteúdo da aba */}
        <div className="p-4">
          {tab === 'internal'
            ? <InternalShareTab postUrl={postUrl} postText={postText} onClose={onClose} />
            : <ExternalShareTab postUrl={postUrl} postText={postText} />
          }
        </div>
      </div>
    </div>
  );
}
