'use client';

// ============================================================
// STORY PUBLISH MODAL — Estilo Instagram (v2)
// • Drag + pinch para reenquadrar
// • Texto sobre o story: múltiplas fontes, cores, fundos
// • Texto ocupa largura total (sem corte nas bordas)
// • Arrastar texto = somente posição vertical (Y)
// • Clique em "Aa" no modo texto = cicla entre fontes
// ============================================================

import { useRef, useState, useEffect } from 'react';
import { X, Type, Bold, RotateCw, AlignLeft, AlignCenter, AlignRight, Check } from 'lucide-react';

// ── Fontes disponíveis ──────────────────────────────────────
const FONTS = [
  {
    id: 'classic',
    label: 'Clássico',
    family: 'system-ui, -apple-system, sans-serif',
    weight: '400',
  },
  {
    id: 'strong',
    label: 'Strong',
    family: 'Impact, "Arial Black", sans-serif',
    weight: '900',
    spacing: 1,
  },
  {
    id: 'serif',
    label: 'Serif',
    family: 'Georgia, "Times New Roman", serif',
    weight: '400',
    italic: true,
  },
  {
    id: 'mono',
    label: 'Typewriter',
    family: '"Courier New", Courier, monospace',
    weight: '400',
  },
  {
    id: 'rounded',
    label: 'Rounded',
    family: '"Trebuchet MS", "Lucida Grande", Arial, sans-serif',
    weight: '700',
  },
  {
    id: 'neon',
    label: 'Neon',
    family: 'system-ui, sans-serif',
    weight: '700',
    glow: true,
  },
  {
    id: 'outline',
    label: 'Outline',
    family: 'Impact, "Arial Black", sans-serif',
    weight: '900',
    outline: true,
  },
];

// ── Paleta de cores ─────────────────────────────────────────
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

const ALIGN_CYCLE = ['center', 'left', 'right'];

// ── Gera estilo do texto (editor + viewer) ──────────────────
export function buildTextStyle(t) {
  const font = FONTS.find((f) => f.id === t.font) || FONTS[0];

  const base = {
    fontFamily: font.family,
    fontWeight: t.bold ? '700' : (font.weight || '400'),
    fontStyle: font.italic ? 'italic' : 'normal',
    letterSpacing: font.spacing ? `${font.spacing}px` : 'normal',
    fontSize: t.size,
    lineHeight: 1.35,
    textAlign: t.align || 'center',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    display: 'inline-block',
  };

  if (font.outline) {
    Object.assign(base, {
      WebkitTextStroke: `2px ${t.color}`,
      color: 'transparent',
      textShadow: 'none',
    });
    return base;
  }

  if (font.glow) {
    Object.assign(base, {
      color: t.color,
      textShadow: `0 0 8px ${t.color}, 0 0 20px ${t.color}, 0 0 40px ${t.color}`,
    });
  } else {
    base.color = t.bg === 'light' ? '#111' : t.color;
    if (t.bg === 'none') base.textShadow = '0 1px 8px rgba(0,0,0,0.95)';
  }

  if (t.bg === 'dark' && !font.glow) {
    Object.assign(base, { background: 'rgba(0,0,0,0.65)', padding: '5px 16px', borderRadius: 8 });
  } else if (t.bg === 'light' && !font.glow) {
    Object.assign(base, { background: 'rgba(255,255,255,0.90)', padding: '5px 16px', borderRadius: 8 });
  }

  return base;
}

// ── Componente principal ────────────────────────────────────
export default function StoryPublishModal({ file, onPublish, onCancel }) {
  const isVideo = file.type.startsWith('video/');
  const previewUrl = useRef(
    typeof window !== 'undefined' ? URL.createObjectURL(file) : ''
  ).current;

  // Transform (reenquadrar)
  const [pan, setPan]     = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // Texto
  const [textMode, setTextMode]       = useState(false);
  const [draft, setDraft]             = useState('');
  const [color, setColor]             = useState('#ffffff');
  const [bg, setBg]                   = useState('none');
  const [bold, setBold]               = useState(false);
  const [size, setSize]               = useState(28);
  const [fontIdx, setFontIdx]         = useState(0);
  const [align, setAlign]             = useState('center');
  const [overlays, setOverlays]       = useState([]);
  const [activeId, setActiveId]       = useState(null);
  const [editingOverlay, setEditingOverlay] = useState(null); // overlay em edição

  // Snap visual ao centro (linhas guia)
  const [snapLines, setSnapLines] = useState({ x: false, y: false });

  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const inputRef     = useRef(null);
  const nextId       = useRef(1);

  // Refs de drag (sem re-render)
  const mediaDrag  = useRef({ active: false, sx: 0, sy: 0, spx: 0, spy: 0 });
  const pinchRef   = useRef({ active: false, startDist: 0, startScale: 1 });
  const textDrag   = useRef({ active: false, id: null, sx: 0, sy: 0, stx: 50, sty: 50 });
  const rotateDrag = useRef({ active: false, id: null, cx: 0, cy: 0, startAngle: 0, startRotate: 0 });
  const didMove    = useRef(false);

  useEffect(() => {
    if (textMode) setTimeout(() => inputRef.current?.focus(), 80);
  }, [textMode]);

  function clientXY(e) {
    if (e.touches?.length > 0) return [e.touches[0].clientX, e.touches[0].clientY];
    return [e.clientX, e.clientY];
  }

  // ── Media drag ──────────────────────────────
  function onMediaDown(e) {
    if (textMode) return;
    if (e.touches?.length === 2) return;
    e.preventDefault();
    const [cx, cy] = clientXY(e);
    mediaDrag.current = { active: true, sx: cx, sy: cy, spx: pan.x, spy: pan.y };
    didMove.current = false;
  }

  function onMove(e) {
    // Pinch zoom
    if (e.touches?.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (!pinchRef.current.active) {
        pinchRef.current = { active: true, startDist: dist, startScale: scale };
      } else {
        setScale(Math.max(1, Math.min(4, pinchRef.current.startScale * (dist / pinchRef.current.startDist))));
      }
      return;
    }

    // Rotate drag
    if (rotateDrag.current.active) {
      const [px, py] = clientXY(e);
      const { cx, cy, startAngle, startRotate } = rotateDrag.current;
      const angle = Math.atan2(py - cy, px - cx) * (180 / Math.PI);
      let newRotate = startRotate + (angle - startAngle);
      // Snap a 0°, ±45°, ±90°, 180°
      const snaps = [0, 45, -45, 90, -90, 135, -135, 180, -180];
      for (const s of snaps) {
        if (Math.abs(newRotate - s) < 5) { newRotate = s; break; }
      }
      setOverlays((prev) => prev.map((t) => t.id === rotateDrag.current.id ? { ...t, rotate: newRotate } : t));
      didMove.current = true;
      return;
    }

    // Text drag (X e Y)
    if (textDrag.current.active) {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const [cx, cy] = clientXY(e);
      const dx = ((cx - textDrag.current.sx) / rect.width) * 100;
      const dy = ((cy - textDrag.current.sy) / rect.height) * 100;
      let nx = Math.max(5, Math.min(95, textDrag.current.stx + dx));
      let ny = Math.max(5, Math.min(95, textDrag.current.sty + dy));

      // Snap ao centro (±3%)
      const snapX = Math.abs(nx - 50) < 3;
      const snapY = Math.abs(ny - 50) < 3;
      setSnapLines({ x: snapX, y: snapY });
      if (snapX) nx = 50;
      if (snapY) ny = 50;

      setOverlays((prev) => prev.map((t) => t.id === textDrag.current.id ? { ...t, x: nx, y: ny } : t));
      didMove.current = true;
      return;
    }

    // Media pan
    if (mediaDrag.current.active) {
      const [cx, cy] = clientXY(e);
      setPan({
        x: mediaDrag.current.spx + (cx - mediaDrag.current.sx) / scale,
        y: mediaDrag.current.spy + (cy - mediaDrag.current.sy) / scale,
      });
      didMove.current = true;
    }
  }

  function onUp() {
    mediaDrag.current.active  = false;
    textDrag.current.active   = false;
    rotateDrag.current.active = false;
    pinchRef.current.active   = false;
    setSnapLines({ x: false, y: false });
  }

  function onWheel(e) {
    if (textMode) return;
    e.preventDefault();
    setScale((s) => Math.max(1, Math.min(4, s + (e.deltaY > 0 ? -0.08 : 0.08))));
  }

  // ── Text drag start ─────────────────────────
  function onTextDown(e, id) {
    e.stopPropagation();
    setActiveId(id);
    const [cx, cy] = clientXY(e);
    const t = overlays.find((o) => o.id === id);
    textDrag.current = { active: true, id, sx: cx, sy: cy, stx: t.x ?? 50, sty: t.y };
    didMove.current = false;
  }

  // ── Rotate drag start ───────────────────────
  function onRotateDown(e, id) {
    e.stopPropagation();
    e.preventDefault();
    const container = containerRef.current;
    const overlay = overlays.find((o) => o.id === id);
    if (!container || !overlay) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.left + ((overlay.x ?? 50) / 100) * rect.width;
    const cy = rect.top  + (overlay.y / 100) * rect.height;
    const [px, py] = clientXY(e);
    const startAngle = Math.atan2(py - cy, px - cx) * (180 / Math.PI);
    rotateDrag.current = { active: true, id, cx, cy, startAngle, startRotate: overlay.rotate || 0 };
    didMove.current = false;
  }

  // ── Abre modo texto (ou cicla fonte se já estiver no modo) ─
  function cycleFont() {
    if (!textMode) { setTextMode(true); setDraft(''); setEditingOverlay(null); return; }
    setFontIdx((i) => (i + 1) % FONTS.length);
  }

  // ── Cancela modo texto (restaura overlay editado se houver) ─
  function cancelText() {
    if (editingOverlay) {
      setOverlays((prev) => [...prev, editingOverlay]);
    }
    setDraft('');
    setTextMode(false);
    setEditingOverlay(null);
  }

  // ── Confirma texto ──────────────────────────────────────────
  function confirmText() {
    if (!draft.trim()) {
      // Draft vazio ao editar = intenção de deletar o overlay
      setDraft('');
      setTextMode(false);
      setEditingOverlay(null);
      return;
    }
    const id = editingOverlay?.id ?? nextId.current++;
    const newOverlay = {
      id,
      content: draft.trim(),
      x: editingOverlay?.x ?? 50,
      y: editingOverlay?.y ?? 50,
      rotate: editingOverlay?.rotate ?? 0,
      color,
      bg,
      bold,
      size,
      font: FONTS[fontIdx].id,
      align,
    };
    setOverlays((prev) => {
      const without = prev.filter((t) => t.id !== id);
      return [...without, newOverlay];
    });
    setDraft('');
    setTextMode(false);
    setEditingOverlay(null);
    setActiveId(id);
  }

  // ── Abre overlay existente para edição ──────────────────────
  function editOverlay(id) {
    const overlay = overlays.find((o) => o.id === id);
    if (!overlay) return;
    setDraft(overlay.content);
    setColor(overlay.color);
    setBg(overlay.bg);
    setBold(overlay.bold);
    setSize(overlay.size);
    setAlign(overlay.align || 'center');
    setFontIdx(Math.max(0, FONTS.findIndex((f) => f.id === overlay.font)));
    setEditingOverlay(overlay);
    setOverlays((prev) => prev.filter((t) => t.id !== id));
    setTextMode(true);
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

  const currentFont = FONTS[fontIdx];
  const draftStyle  = buildTextStyle({ color, bg, bold, size, font: currentFont.id, align });

  return (
    <div
      className="fixed inset-0 z-[60] bg-black flex flex-col"
      style={{ userSelect: textMode ? 'text' : 'none', WebkitUserSelect: textMode ? 'text' : 'none' }}
    >
      {/* ── Toolbar superior ─────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0 z-20">
        {!textMode ? (
          <>
            <button onClick={onCancel} className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <button
              onClick={cycleFont}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white rounded-full px-4 py-1.5 font-bold text-sm tracking-wide transition-colors"
              title="Adicionar texto"
            >
              <Type size={15} /> Aa
            </button>
          </>
        ) : (
          <>
            {/* Cancelar modo texto */}
            <button
              onClick={cancelText}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            {/* Cicla alinhamento */}
            <button
              onClick={() => setAlign((a) => { const i = ALIGN_CYCLE.indexOf(a); return ALIGN_CYCLE[(i + 1) % 3]; })}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              title="Alinhamento"
            >
              {align === 'left'  && <AlignLeft  size={18} />}
              {align === 'center' && <AlignCenter size={18} />}
              {align === 'right' && <AlignRight size={18} />}
            </button>
            {/* Fonte atual */}
            <button
              onClick={cycleFont}
              className="bg-white/15 hover:bg-white/25 text-white rounded-full px-3 py-1.5 font-bold text-sm transition-colors"
              title={`Fonte: ${currentFont.label}`}
            >
              Aa
            </button>
            {/* Confirmar */}
            <button
              onClick={confirmText}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-black hover:bg-white/90 active:scale-95 transition-all shadow-lg"
              title="Confirmar"
            >
              <Check size={18} strokeWidth={3} />
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
            cursor: textMode ? 'text' : (mediaDrag.current.active ? 'grabbing' : 'grab'),
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

          {/* Hint reenquadrar */}
          {scale === 1 && pan.x === 0 && pan.y === 0 && !textMode && overlays.length === 0 && (
            <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
              <span className="text-white/45 text-xs bg-black/30 rounded-full px-3 py-1">
                Arraste · Pinça para zoom
              </span>
            </div>
          )}

          {/* Linhas guia de snap (centro horizontal e vertical) */}
          {snapLines.y && (
            <div className="absolute inset-x-0 top-1/2 pointer-events-none z-20">
              <div className="w-full h-px bg-white/60" style={{ boxShadow: '0 0 4px rgba(255,255,255,0.8)' }} />
            </div>
          )}
          {snapLines.x && (
            <div className="absolute inset-y-0 left-1/2 pointer-events-none z-20">
              <div className="h-full w-px bg-white/60" style={{ boxShadow: '0 0 4px rgba(255,255,255,0.8)' }} />
            </div>
          )}

          {/* Input de texto (modo texto) */}
          {textMode && (
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ background: 'rgba(0,0,0,0.22)' }}
              onClick={(e) => { e.stopPropagation(); inputRef.current?.focus(); }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Wrapper centralizado — textarea cobre exatamente este bloco */}
              <div style={{ width: '78%', textAlign: align, position: 'relative' }}>

                {/* Preview styled em tempo real */}
                <span
                  style={{
                    ...draftStyle,
                    display: 'block',
                    visibility: draft ? 'visible' : 'hidden',
                    pointerEvents: 'none',
                    // mínimo de 1 linha para manter altura mesmo vazio
                    minHeight: `${size * 1.35 + 10}px`,
                  }}
                >
                  {draft || ' '}
                </span>

                {/* Placeholder */}
                {!draft && (
                  <span
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: size,
                      fontFamily: currentFont.family,
                      textAlign: 'center',
                    }}
                  >
                    Escreva algo...
                  </span>
                )}

                {/* Textarea invisível sobre o preview — cursor alinhado com o texto */}
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={200}
                  className="absolute inset-0 w-full h-full resize-none focus:outline-none"
                  style={{
                    background: 'transparent',
                    color: 'transparent',
                    caretColor: 'white',
                    border: 'none',
                    padding: '5px 0',
                    fontSize: size,
                    fontFamily: currentFont.family,
                    fontWeight: draftStyle.fontWeight,
                    lineHeight: 1.35,
                    textAlign: align,
                    letterSpacing: draftStyle.letterSpacing,
                  }}
                />
              </div>
            </div>
          )}

          {/* Textos posicionados livremente (X, Y e rotação) */}
          {overlays.map((overlay) => (
            <div
              key={overlay.id}
              className="absolute z-[12]"
              style={{
                left: `${overlay.x ?? 50}%`,
                top: `${overlay.y}%`,
                transform: `translate(-50%, -50%) rotate(${overlay.rotate || 0}deg)`,
                cursor: 'move',
                touchAction: 'none',
                width: '78%',
                textAlign: overlay.align || 'center',
              }}
              onMouseDown={(e) => onTextDown(e, overlay.id)}
              onTouchStart={(e) => onTextDown(e, overlay.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (!didMove.current) editOverlay(overlay.id);
              }}
            >
              <span style={buildTextStyle(overlay)}>{overlay.content}</span>

              {/* Alça de rotação (somente quando ativo, sem clicar) */}
              {activeId === overlay.id && (
                <>
                  {/* Girar */}
                  <div
                    className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 pointer-events-auto"
                    style={{ touchAction: 'none' }}
                    onMouseDown={(e) => { e.stopPropagation(); onRotateDown(e, overlay.id); }}
                    onTouchStart={(e) => { e.stopPropagation(); onRotateDown(e, overlay.id); }}
                  >
                    <div className="w-px h-2 bg-white/60" />
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing">
                      <RotateCw size={12} className="text-gray-800" />
                    </div>
                  </div>
                  {/* Deletar */}
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 pointer-events-auto"
                    onMouseDown={(e) => { e.stopPropagation(); setOverlays((p) => p.filter((t) => t.id !== overlay.id)); setActiveId(null); }}
                    onTouchStart={(e) => { e.stopPropagation(); setOverlays((p) => p.filter((t) => t.id !== overlay.id)); setActiveId(null); }}
                  >
                    <div className="w-7 h-7 bg-black/60 border border-white/30 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/80 transition-colors">
                      <X size={13} className="text-white" />
                    </div>
                    <div className="w-px h-2 bg-white/60" />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Toolbar de texto ─────────────────── */}
      {textMode && (
        <div className="flex-shrink-0 px-4 pb-3 pt-1 space-y-3 z-20">

          {/* Paleta de cores */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="rounded-full flex-shrink-0 transition-all"
                style={{
                  background: c,
                  width: color === c ? 30 : 26,
                  height: color === c ? 30 : 26,
                  border: color === c ? '3px solid white' : '2px solid rgba(255,255,255,0.25)',
                  boxShadow: color === c ? '0 0 0 2px rgba(0,0,0,0.5)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Estilo: negrito + fundo */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setBold((b) => !b)}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                bold ? 'bg-white border-white' : 'border-white/35 bg-transparent'
              }`}
            >
              <Bold size={16} className={bold ? 'text-black' : 'text-white'} />
            </button>
            {BG_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setBg(opt.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  bg === opt.id ? 'bg-white text-black border-white' : 'border-white/35 text-white/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Tamanho da fonte */}
          <div className="flex items-center gap-3 px-2">
            <span className="text-white/45 font-bold" style={{ fontSize: 12 }}>A</span>
            <input
              type="range" min={14} max={48} step={1}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="flex-1 accent-primary-500 h-1 cursor-pointer"
            />
            <span className="text-white font-bold" style={{ fontSize: 22 }}>A</span>
          </div>

          {/* Prévia das fontes (scroll horizontal) */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {FONTS.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setFontIdx(i)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl border transition-all ${
                  fontIdx === i
                    ? 'border-white bg-white/15'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span
                  style={{
                    fontFamily: f.family,
                    fontWeight: f.weight || '400',
                    fontStyle: f.italic ? 'italic' : 'normal',
                    color: f.outline ? 'transparent' : '#fff',
                    WebkitTextStroke: f.outline ? '1.5px #fff' : undefined,
                    textShadow: f.glow ? '0 0 8px #fff, 0 0 16px #fff' : undefined,
                    fontSize: 14,
                    display: 'block',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Botões publicar ──────────────────── */}
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
