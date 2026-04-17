'use client';

// ============================================================
// STORY PUBLISH MODAL — Estilo Instagram
// • Drag + pinch para reenquadrar a mídia
// • Botão "Aa" para adicionar texto sobre o story
// • Cores, negrito, fundo do texto
// • Múltiplos textos arrastáveis
// ============================================================

import { useRef, useState, useEffect } from 'react';
import { X, Type, Bold } from 'lucide-react';

const COLORS = [
  '#ffffff', '#000000', '#ff3b30', '#ff9500',
  '#ffcc00', '#34c759', '#5ac8fa', '#007aff',
  '#af52de', '#ff2d55',
];

const BG_OPTIONS = [
  { id: 'none',  label: 'Sem fundo' },
  { id: 'dark',  label: 'Escuro' },
  { id: 'light', label: 'Claro' },
];

function getTextStyle(t) {
  const base = {
    color: t.color,
    fontSize: t.size,
    fontWeight: t.bold ? '700' : '400',
    textAlign: 'center',
    lineHeight: 1.3,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxWidth: 220,
    display: 'block',
    textShadow: t.bg === 'none' ? '0 1px 6px rgba(0,0,0,0.9)' : 'none',
  };
  if (t.bg === 'dark')  return { ...base, background: 'rgba(0,0,0,0.65)', padding: '5px 14px', borderRadius: 8 };
  if (t.bg === 'light') return { ...base, background: 'rgba(255,255,255,0.88)', color: '#111', padding: '5px 14px', borderRadius: 8 };
  return base;
}

export default function StoryPublishModal({ file, onPublish, onCancel }) {
  const isVideo = file.type.startsWith('video/');
  const previewUrl = useRef(
    typeof window !== 'undefined' ? URL.createObjectURL(file) : ''
  ).current;

  // ── Transform (reenquadrar) ─────────────────
  const [pan, setPan]     = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // ── Text overlays ───────────────────────────
  const [textMode, setTextMode]   = useState(false);
  const [draft, setDraft]         = useState('');
  const [color, setColor]         = useState('#ffffff');
  const [bg, setBg]               = useState('dark');
  const [bold, setBold]           = useState(false);
  const [size, setSize]           = useState(22);
  const [overlays, setOverlays]   = useState([]);
  const [activeId, setActiveId]   = useState(null);

  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const inputRef     = useRef(null);
  const nextId       = useRef(1);

  // Refs para rastreio de drag (sem causar re-render)
  const mediaDrag = useRef({ active: false, sx: 0, sy: 0, spx: 0, spy: 0 });
  const pinchRef  = useRef({ active: false, startDist: 0, startScale: 1 });
  const textDrag  = useRef({ active: false, id: null, sx: 0, sy: 0, stx: 0, sty: 0 });
  const didMove   = useRef(false);

  // ── Focus input ao entrar em modo texto ─────
  useEffect(() => {
    if (textMode) setTimeout(() => inputRef.current?.focus(), 80);
  }, [textMode]);

  // ── Helpers de coordenadas ──────────────────
  function clientXY(e) {
    if (e.touches?.length > 0) return [e.touches[0].clientX, e.touches[0].clientY];
    return [e.clientX, e.clientY];
  }

  // ── Media: drag start ───────────────────────
  function onMediaDown(e) {
    if (textMode) return;
    if (e.touches?.length === 2) return;
    e.preventDefault();
    const [cx, cy] = clientXY(e);
    mediaDrag.current = { active: true, sx: cx, sy: cy, spx: pan.x, spy: pan.y };
    didMove.current = false;
  }

  // ── Move (media pan + pinch + text drag) ────
  function onMove(e) {
    // Pinch zoom
    if (e.touches?.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (!pinchRef.current.active) {
        pinchRef.current = { active: true, startDist: dist, startScale: scale };
      } else {
        const ns = Math.max(1, Math.min(4, pinchRef.current.startScale * (dist / pinchRef.current.startDist)));
        setScale(ns);
      }
      return;
    }

    // Text drag
    if (textDrag.current.active) {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const [cx, cy] = clientXY(e);
      const dx = ((cx - textDrag.current.sx) / rect.width)  * 100;
      const dy = ((cy - textDrag.current.sy) / rect.height) * 100;
      const nx = Math.max(5, Math.min(95, textDrag.current.stx + dx));
      const ny = Math.max(5, Math.min(95, textDrag.current.sty + dy));
      setOverlays(prev => prev.map(t => t.id === textDrag.current.id ? { ...t, x: nx, y: ny } : t));
      didMove.current = true;
      return;
    }

    // Media pan
    if (mediaDrag.current.active) {
      const [cx, cy] = clientXY(e);
      const dx = (cx - mediaDrag.current.sx) / scale;
      const dy = (cy - mediaDrag.current.sy) / scale;
      setPan({ x: mediaDrag.current.spx + dx, y: mediaDrag.current.spy + dy });
      didMove.current = true;
    }
  }

  function onUp() {
    mediaDrag.current.active = false;
    textDrag.current.active  = false;
    pinchRef.current.active  = false;
  }

  // Scroll para zoom (desktop)
  function onWheel(e) {
    if (textMode) return;
    e.preventDefault();
    setScale(s => Math.max(1, Math.min(4, s + (e.deltaY > 0 ? -0.08 : 0.08))));
  }

  // ── Text overlay drag start ─────────────────
  function onTextDown(e, id) {
    e.stopPropagation();
    setActiveId(id);
    const [cx, cy] = clientXY(e);
    const t = overlays.find(o => o.id === id);
    textDrag.current = { active: true, id, sx: cx, sy: cy, stx: t.x, sty: t.y };
    didMove.current = false;
  }

  // ── Confirmar texto ─────────────────────────
  function confirmText() {
    if (!draft.trim()) { setTextMode(false); return; }
    const id = nextId.current++;
    setOverlays(prev => [...prev, { id, content: draft.trim(), x: 50, y: 50, color, bg, bold, size }]);
    setDraft('');
    setTextMode(false);
    setActiveId(id);
  }

  // ── Publicar ────────────────────────────────
  async function handlePublish() {
    setLoading(true);
    try {
      const hasMeta = overlays.length > 0 || scale !== 1 || pan.x !== 0 || pan.y !== 0;
      const caption = hasMeta
        ? JSON.stringify({ texts: overlays, transform: { scale, panX: pan.x, panY: pan.y } })
        : null;
      await onPublish(file, caption);
    } finally {
      setLoading(false);
    }
  }

  // ── Preview do texto digitando ──────────────
  const draftStyle = getTextStyle({ color, bg, bold, size });

  return (
    <div
      className="fixed inset-0 z-[60] bg-black flex flex-col"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* ── Toolbar superior ─────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0 z-20">
        {!textMode ? (
          <>
            <button onClick={onCancel} className="text-white/75 hover:text-white transition-colors">
              <X size={26} />
            </button>
            <button
              onClick={() => { setTextMode(true); setDraft(''); }}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white rounded-full px-4 py-1.5 text-sm font-bold tracking-wide transition-colors"
            >
              <Type size={15} /> Aa
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setTextMode(false)} className="text-white/75 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <button
              onClick={confirmText}
              className="bg-primary-500 hover:bg-primary-600 text-white rounded-full px-5 py-1.5 text-sm font-bold transition-colors"
            >
              Concluir
            </button>
          </>
        )}
      </div>

      {/* ── Canvas 9:16 ──────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        <div
          ref={containerRef}
          className="relative bg-black overflow-hidden rounded-2xl shadow-2xl"
          style={{
            aspectRatio: '9/16',
            height: '100%',
            maxHeight: 580,
            maxWidth: 327,
            width: '100%',
            touchAction: 'none',
            cursor: textMode ? 'text' : 'grab',
          }}
          onMouseDown={onMediaDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onMediaDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
          onWheel={onWheel}
          onClick={() => { if (!didMove.current) setActiveId(null); }}
        >
          {/* Mídia transformada */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'center center',
            }}
          >
            {isVideo ? (
              <video src={previewUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" draggable={false} />
            )}
          </div>

          {/* Hint de reenquadrar (some após interação) */}
          {scale === 1 && pan.x === 0 && pan.y === 0 && !textMode && overlays.length === 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <span className="text-white/50 text-xs bg-black/30 rounded-full px-3 py-1">
                Arraste para reenquadrar · Pinça para zoom
              </span>
            </div>
          )}

          {/* Modo texto: input centralizado + overlay escuro */}
          {textMode && (
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ background: 'rgba(0,0,0,0.25)' }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escreva algo..."
                maxLength={150}
                rows={3}
                className="bg-transparent focus:outline-none resize-none placeholder-white/40 text-center w-4/5"
                style={draftStyle}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmText(); } }}
              />
            </div>
          )}

          {/* Textos posicionados e arrastáveis */}
          {overlays.map(overlay => (
            <div
              key={overlay.id}
              className="absolute z-[12]"
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: 'move',
              }}
              onMouseDown={(e) => onTextDown(e, overlay.id)}
              onTouchStart={(e) => onTextDown(e, overlay.id)}
            >
              <span style={getTextStyle(overlay)}>{overlay.content}</span>
              {activeId === overlay.id && (
                <button
                  className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                  onMouseDown={(e) => { e.stopPropagation(); setOverlays(p => p.filter(t => t.id !== overlay.id)); setActiveId(null); }}
                  onTouchStart={(e) => { e.stopPropagation(); setOverlays(p => p.filter(t => t.id !== overlay.id)); setActiveId(null); }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Toolbar de texto ─────────────────── */}
      {textMode && (
        <div className="flex-shrink-0 px-4 pb-4 space-y-3 z-20">
          {/* Paleta de cores */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="rounded-full transition-all flex-shrink-0"
                style={{
                  background: c,
                  width: color === c ? 30 : 26,
                  height: color === c ? 30 : 26,
                  border: color === c ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
                  boxShadow: color === c ? '0 0 0 2px rgba(0,0,0,0.4)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Estilo: negrito + fundo */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setBold(b => !b)}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${bold ? 'bg-white border-white' : 'border-white/40'}`}
            >
              <Bold size={16} className={bold ? 'text-black' : 'text-white'} />
            </button>
            {BG_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setBg(opt.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${bg === opt.id ? 'bg-white text-black border-white' : 'border-white/35 text-white/80'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Tamanho da fonte */}
          <div className="flex items-center gap-3 px-2">
            <span className="text-white/50 text-xs font-bold" style={{ fontSize: 12 }}>A</span>
            <input
              type="range" min={14} max={44} step={1}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="flex-1 accent-primary-500 h-1"
            />
            <span className="text-white font-bold" style={{ fontSize: 20 }}>A</span>
          </div>
        </div>
      )}

      {/* ── Botões de publicar ────────────────── */}
      {!textMode && (
        <div className="flex-shrink-0 flex gap-3 px-4 pb-6 pt-2 z-20">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-full border border-white/25 text-white font-medium hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="flex-1 py-3 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-bold active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : '→ Publicar'}
          </button>
        </div>
      )}
    </div>
  );
}
