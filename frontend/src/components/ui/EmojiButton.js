'use client';

// ============================================================
// EMOJI BUTTON
// Botão com seletor de emojis (emoji-picker-react, SSR-safe)
// Props:
//   onEmoji(emoji: string) — chamado ao selecionar um emoji
//   side: 'top' | 'bottom' (default: 'top') — posição do painel
//   dark: bool — força tema escuro
// ============================================================

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Smile } from 'lucide-react';

// Carrega o picker apenas no cliente (SSR-unsafe)
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function EmojiButton({ onEmoji, side = 'top', dark = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (emojiData) => {
    onEmoji(emojiData.emoji);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative flex-shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="text-gray-400 hover:text-yellow-400 transition-colors p-1"
        title="Emojis"
      >
        <Smile size={18} />
      </button>

      {open && (
        <div
          className={`absolute z-50 ${side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0`}
          // Evita que o click interno feche o picker via bubbling
          onMouseDown={(e) => e.stopPropagation()}
        >
          <EmojiPicker
            onEmojiClick={handleSelect}
            theme={dark ? 'dark' : 'auto'}
            searchPlaceholder="Buscar emoji..."
            lazyLoadEmojis
            width={300}
            height={380}
          />
        </div>
      )}
    </div>
  );
}
