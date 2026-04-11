'use client';

// ============================================================
// STORY PUBLISH MODAL
// Preview 9:16 com caption antes de publicar o story.
// Exibe exatamente como o story vai aparecer para os outros.
// ============================================================

import { useRef, useState } from 'react';
import { X, Send } from 'lucide-react';

export default function StoryPublishModal({ file, onPublish, onCancel }) {
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  // Object URL criado uma vez e reutilizado
  const previewUrl = useRef(
    typeof window !== 'undefined' ? URL.createObjectURL(file) : ''
  ).current;

  const isVideo = file.type.startsWith('video/');

  const handlePublish = async () => {
    setLoading(true);
    try {
      await onPublish(file, caption.trim() || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4">
      <div className="relative w-full max-w-[340px] flex flex-col gap-4">

        {/* Fechar */}
        <button
          onClick={onCancel}
          className="absolute -top-2 -right-2 z-10 bg-gray-800 text-white rounded-full p-1.5 hover:bg-gray-700 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Preview 9:16 — igual a como vai aparecer no viewer */}
        <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl">
          {isVideo ? (
            <video
              src={previewUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Preview do story"
              className="w-full h-full object-cover"
            />
          )}

          {/* Caption sobreposta no preview */}
          {caption && (
            <div className="absolute bottom-16 left-0 right-0 px-4 pointer-events-none">
              <p className="text-white text-sm text-center bg-black/50 rounded-xl px-3 py-2 leading-relaxed">
                {caption}
              </p>
            </div>
          )}

          {/* Label de preview */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/50 text-white/70 text-xs rounded-full px-3 py-1">
            Prévia
          </div>
        </div>

        {/* Campo de legenda */}
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2.5">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Adicionar legenda..."
            maxLength={200}
            className="flex-1 bg-transparent text-white placeholder-white/40 text-sm focus:outline-none"
          />
          {caption && (
            <span className="text-white/40 text-xs flex-shrink-0">{caption.length}/200</span>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full border border-white/25 text-white text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send size={14} />
                Publicar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
