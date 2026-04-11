'use client';

/**
 * CreatePost — mídia obrigatória.
 *
 * Três inputs de arquivo separados, cada um com seu próprio ref:
 *   anyInputRef   → área central  → accept="image/*,video/*"
 *   imageInputRef → botão "Foto"  → accept="image/*"
 *   videoInputRef → botão "Vídeo" → accept="video/*"
 *
 * Todos convergem para o mesmo handleFile, que detecta o tipo pelo
 * MIME type real do arquivo (não pelo accept do input).
 */

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ImagePlus, Video, Send, X, Monitor, Smartphone, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/app/auth-context';
import { Avatar } from '@/components/ui/Avatar';
import toast from 'react-hot-toast';

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [aspectRatio, setAspectRatio] = useState('LANDSCAPE');
  const [loading, setLoading] = useState(false);
  const [showMediaWarning, setShowMediaWarning] = useState(false);

  // Um ref por input — nunca compartilhados
  const anyInputRef   = useRef(null); // área central: foto OU vídeo
  const imageInputRef = useRef(null); // botão "Foto": só imagem
  const videoInputRef = useRef(null); // botão "Vídeo": só vídeo

  if (!user) return null;

  const displayName = user.company?.companyName || user.name || '';

  // Único handler de arquivo — detecta tipo pelo MIME do arquivo real
  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Limpa os outros inputs para não manter state inconsistente
    [anyInputRef, imageInputRef, videoInputRef].forEach((ref) => {
      if (ref.current && ref.current !== e.target) ref.current.value = '';
    });
    setFile(f);
    setShowMediaWarning(false);
    setPreview({
      url: URL.createObjectURL(f),
      // Detecta pelo MIME type real, independentemente de qual input foi usado
      type: f.type.startsWith('video/') ? 'video' : 'image',
    });
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    [anyInputRef, imageInputRef, videoInputRef].forEach((ref) => {
      if (ref.current) ref.current.value = '';
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setShowMediaWarning(true);
      return;
    }
    setLoading(true);
    const data = new FormData();
    if (text.trim()) data.append('description', text.trim());
    data.append('media', file);
    data.append('aspectRatio', aspectRatio);
    try {
      const res = await api.post('/posts', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Post publicado!');
      setText('');
      clearFile();
      setAspectRatio('LANDSCAPE');
      setShowMediaWarning(false);
      if (onPostCreated) onPostCreated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao publicar');
    } finally {
      setLoading(false);
    }
  };

  const previewContainerClass =
    aspectRatio === 'PORTRAIT' ? 'relative w-full max-w-[260px] mx-auto' : 'relative w-full';
  const previewAspectClass =
    aspectRatio === 'PORTRAIT' ? 'aspect-[9/16]' : 'aspect-video';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-gray-900 dark:border-gray-800"
    >
      {/* ── Linha 1: Avatar + legenda (topo) ── */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar src={user.avatar} name={displayName} size="md" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva uma legenda para o seu post..."
          maxLength={2200}
          rows={2}
          className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm resize-none focus:outline-none dark:text-gray-200 dark:placeholder-gray-600"
        />
      </div>

      {/* ── Aviso de mídia obrigatória ── */}
      {showMediaWarning && !file && (
        <div className="mb-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="flex-shrink-0" />
          <span>
            Adicione uma <strong>foto ou vídeo</strong> para publicar.
            Posts sem mídia não são permitidos.
          </span>
        </div>
      )}

      {/* ── Área central de upload (sem arquivo selecionado) ── */}
      {!preview && (
        <>
          <input
            ref={anyInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFile}
            className="hidden"
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => anyInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && anyInputRef.current?.click()}
            className={`mb-3 border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors select-none ${
              showMediaWarning
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-primary-50/30 dark:hover:border-primary-600 dark:hover:bg-primary-900/10'
            }`}
          >
            <ImagePlus
              size={28}
              className={showMediaWarning ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}
            />
            <p className={`text-sm font-medium ${
              showMediaWarning ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'
            }`}>
              {showMediaWarning
                ? 'Mídia obrigatória — clique para selecionar'
                : 'Clique para adicionar foto ou vídeo'}
            </p>
            <p className="text-xs text-gray-300 dark:text-gray-600">
              JPG, PNG, GIF, MP4, MOV
            </p>
          </div>
        </>
      )}

      {/* ── Preview + seletor de formato ── */}
      {preview && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Formato:</span>
            {[
              { value: 'LANDSCAPE', label: '16:9', icon: <Monitor size={12} /> },
              { value: 'PORTRAIT',  label: '9:16', icon: <Smartphone size={12} /> },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAspectRatio(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  aspectRatio === opt.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
          <div className={previewContainerClass}>
            <div className={`${previewAspectClass} bg-black rounded-lg overflow-hidden relative`}>
              {preview.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <video src={preview.url} controls className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Barra de ações ── */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
            <ImagePlus size={17} />
            <span>Foto</span>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
          <label className="cursor-pointer flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
            <Video size={17} />
            <span>Vídeo</span>
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleFile} className="hidden" />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading || !file}
          onClick={() => { if (!file) setShowMediaWarning(true); }}
          title={!file ? 'Adicione uma foto ou vídeo para publicar' : 'Publicar post'}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            !file
              ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95'
          } disabled:opacity-60`}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Publicar
        </button>
      </div>
    </form>
  );
}
