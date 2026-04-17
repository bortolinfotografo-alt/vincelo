'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Send, Trash2, Pencil, Check, X } from 'lucide-react';
import { useAuth } from '@/app/auth-context';
import toast from 'react-hot-toast';
import Link from 'next/link';
import EmojiButton from '@/components/ui/EmojiButton';

function Avatar({ user, size = 8 }) {
  const s = `w-${size} h-${size}`;
  return (
    <div className={`${s} rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
      {user?.avatar
        ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        : <span className="text-xs font-bold text-gray-300">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
      }
    </div>
  );
}

// ── Item de comentário (com edição inline) ────────────────────
function CommentItem({ comment, currentUser, postId, onDelete, onUpdate }) {
  const [editing, setEditing]   = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [saving, setSaving]     = useState(false);

  const isOwn = currentUser && currentUser.id === comment.author.id;

  const handleSave = async () => {
    if (!editText.trim() || editText.trim() === comment.content) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await api.put(`/posts/${postId}/comments/${comment.id}`, { content: editText.trim() });
      onUpdate(res.data);
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao editar');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => { setEditText(comment.content); setEditing(false); };

  return (
    <div className="flex items-start gap-2">
      <Avatar user={comment.author} size={7} />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-100 rounded-lg px-3 py-2 dark:bg-gray-800">
          <Link href={`/profile/${comment.author.id}`} className="text-xs font-semibold text-gray-800 hover:underline dark:text-gray-200">
            {comment.author.name}
          </Link>

          {editing ? (
            <div className="mt-1 flex items-center gap-1.5">
              <input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
                maxLength={500}
                autoFocus
                className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary-500"
              />
              <button onClick={handleSave} disabled={saving} className="text-primary-500 hover:text-primary-400 disabled:opacity-50">
                <Check size={14} />
              </button>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-600 mt-0.5 dark:text-gray-300 break-words">{comment.content}</p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5 ml-1">
          <p className="text-xs text-gray-400">
            {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </p>
          {isOwn && !editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-primary-500 flex items-center gap-0.5 transition-colors">
              <Pencil size={11} /> Editar
            </button>
          )}
        </div>
      </div>

      {isOwn && (
        <button onClick={() => onDelete(comment.id)} className="text-gray-400 hover:text-red-400 mt-1 flex-shrink-0">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

// ── Seção principal ───────────────────────────────────────────
export default function CommentSection({ postId, initialCount = 0 }) {
  const { user } = useAuth();
  const [open, setOpen]         = useState(false);
  const [comments, setComments] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [count, setCount]       = useState(initialCount);

  useEffect(() => { if (open && comments.length === 0) loadComments(); }, [open]);

  async function loadComments() {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data.comments);
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: text.trim() });
      setComments((prev) => [...prev, res.data]);
      setCount((c) => c + 1);
      setText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao comentar');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(commentId) {
    api.delete(`/posts/${postId}/comments/${commentId}`)
      .then(() => { setComments((prev) => prev.filter((c) => c.id !== commentId)); setCount((c) => c - 1); })
      .catch(() => toast.error('Erro ao remover comentario'));
  }

  function handleUpdate(updated) {
    setComments((prev) => prev.map((c) => c.id === updated.id ? updated : c));
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>{count > 0 ? count : ''}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-gray-200 pt-3 dark:border-gray-700">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">Nenhum comentario ainda.</p>
          ) : (
            comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                currentUser={user}
                postId={postId}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))
          )}

          {user && (
            <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
              <Avatar user={user} size={7} />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Adicione um comentario..."
                maxLength={500}
                className="flex-1 bg-gray-100 border border-gray-300 rounded-full px-4 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
              />
              <EmojiButton onEmoji={(e) => setText((p) => p + e)} side="top" />
              <button type="submit" disabled={loading || !text.trim()} className="text-primary-500 hover:text-primary-400 disabled:opacity-30">
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
