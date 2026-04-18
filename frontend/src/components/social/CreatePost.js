'use client';

import { useState, useRef, useCallback } from 'react';
import { ImagePlus, Video, Send, X, AlertCircle, ChevronLeft, ChevronRight, Crop } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/app/auth-context';
import { Avatar } from '@/components/ui/Avatar';
import ImageCropper from '@/components/ui/ImageCropper';
import toast from 'react-hot-toast';

const MAX_FILES = 10;

const RATIO_OPTIONS = [
  { value: 'SQUARE',       label: '1:1',  aspect: 1,       icon: '⬜' },
  { value: 'LANDSCAPE',    label: '16:9', aspect: 16/9,    icon: '▭' },
  { value: 'LANDSCAPE_43', label: '4:3',  aspect: 4/3,     icon: '▬' },
  { value: 'PORTRAIT',     label: '9:16', aspect: 9/16,    icon: '▯' },
  { value: 'PORTRAIT_34',  label: '3:4',  aspect: 3/4,     icon: '▮' },
];

function blobToFile(blob, name) {
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
}

export default function CreatePost({ onPostCreated, inModal = false }) {
  const { user } = useAuth();
  const [text, setText]                         = useState('');
  const [files, setFiles]                       = useState([]);
  const [previews, setPreviews]                 = useState([]);
  const [currentIndex, setCurrentIndex]         = useState(0);
  const [thumbnailFile, setThumbnailFile]       = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [aspectRatio, setAspectRatio]           = useState('SQUARE');
  const [loading, setLoading]                   = useState(false);
  const [showMediaWarning, setShowMediaWarning] = useState(false);
  const [cropSrc, setCropSrc]                   = useState(null);
  const [cropTarget, setCropTarget]             = useState(null);
  const [cropAspect, setCropAspect]             = useState(1);

  const anyInputRef   = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const thumbnailRef  = useRef(null);

  if (!user) return null;

  const displayName  = user.company?.companyName || user.name || '';
  const currentRatio = RATIO_OPTIONS.find((r) => r.value === aspectRatio);

  // ── File handling ────────────────────────────────────────────
  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const combined = [...files, ...selected].slice(0, MAX_FILES);
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    const newPreviews = combined.map((f) => ({
      url:  URL.createObjectURL(f),
      type: f.type.startsWith('video/') ? 'video' : 'image',
    }));
    setFiles(combined);
    setPreviews(newPreviews);
    setShowMediaWarning(false);
    setCurrentIndex(Math.min(currentIndex, combined.length - 1));
    if (e.target) e.target.value = '';
  };

  const handleThumbnail = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setCropSrc(URL.createObjectURL(f));
    setCropTarget('thumbnail');
    setCropAspect(16 / 9);
    if (e.target) e.target.value = '';
  };

  const clearThumbnail = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const openCropForImage = (idx) => {
    const p = previews[idx];
    if (!p || p.type !== 'image') return;
    setCropSrc(p.url);
    setCropTarget(`image-${idx}`);
    setCropAspect(currentRatio?.aspect ?? 1);
  };

  const handleCropDone = useCallback(async (blob) => {
    if (cropTarget === 'thumbnail') {
      const url = URL.createObjectURL(blob);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      setThumbnailFile(blobToFile(blob, 'thumbnail.jpg'));
      setThumbnailPreview(url);
    } else if (cropTarget?.startsWith('image-')) {
      const idx  = parseInt(cropTarget.split('-')[1], 10);
      const url  = URL.createObjectURL(blob);
      URL.revokeObjectURL(previews[idx].url);
      setFiles((prev)    => { const a = [...prev]; a[idx] = blobToFile(blob, files[idx]?.name || `image-${idx}.jpg`); return a; });
      setPreviews((prev) => { const a = [...prev]; a[idx] = { ...a[idx], url }; return a; });
    }
    setCropSrc(null);
    setCropTarget(null);
  }, [cropTarget, thumbnailPreview, files, previews]);

  const handleCropCancel = () => { setCropSrc(null); setCropTarget(null); };

  const removeFile = (idx) => {
    URL.revokeObjectURL(previews[idx].url);
    const nf = files.filter((_, i) => i !== idx);
    const np = previews.filter((_, i) => i !== idx);
    setFiles(nf);
    setPreviews(np);
    setCurrentIndex(Math.min(currentIndex, Math.max(0, nf.length - 1)));
    if (idx === currentIndex && previews[idx]?.type === 'video') clearThumbnail();
  };

  const clearAll = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    clearThumbnail();
    setFiles([]); setPreviews([]); setCurrentIndex(0);
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) { setShowMediaWarning(true); return; }
    setLoading(true);
    const data = new FormData();
    if (text.trim()) data.append('description', text.trim());
    files.forEach((f) => data.append('media', f));
    if (thumbnailFile) data.append('thumbnail', thumbnailFile);
    data.append('aspectRatio', aspectRatio);
    try {
      const res = await api.post('/posts', data);
      toast.success('Post publicado!');
      setText(''); clearAll();
      setAspectRatio('SQUARE'); setShowMediaWarning(false);
      if (onPostCreated) onPostCreated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao publicar');
    } finally {
      setLoading(false);
    }
  };

  const currentPreview = previews[currentIndex];
  const isCurrentVideo = currentPreview?.type === 'video';

  // Aspect class (feed only)
  const previewAspect = currentRatio?.aspect ?? 1;
  const aspectClass = {
    1:      'aspect-square',
    [16/9]: 'aspect-video',
    [4/3]:  'aspect-[4/3]',
    [9/16]: 'aspect-[9/16]',
    [3/4]:  'aspect-[3/4]',
  }[previewAspect] ?? 'aspect-square';

  // ── Shared render helpers (plain functions, not React components) ──
  const renderFormatSelector = (padded) => (
    <div className={`flex items-center gap-1.5 flex-wrap ${padded ? 'px-4 pt-3' : ''}`}>
      <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Formato:</span>
      {RATIO_OPTIONS.map((opt) => (
        <button key={opt.value} type="button" onClick={() => setAspectRatio(opt.value)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            aspectRatio === opt.value
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}>
          <span className="text-[10px]">{opt.icon}</span> {opt.label}
        </button>
      ))}
      <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{files.length}/{MAX_FILES}</span>
    </div>
  );

  const renderOverlays = () => (
    <>
      <button type="button" onClick={() => removeFile(currentIndex)}
        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors z-10">
        <X size={14} />
      </button>
      {currentPreview?.type === 'image' && (
        <button type="button" onClick={() => openCropForImage(currentIndex)}
          className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black transition-colors z-10"
          title="Recortar imagem">
          <Crop size={14} />
        </button>
      )}
      {previews.length > 1 && (
        <>
          <button type="button" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 disabled:opacity-30 transition-colors z-10">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => setCurrentIndex((i) => Math.min(previews.length - 1, i + 1))}
            disabled={currentIndex === previews.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 disabled:opacity-30 transition-colors z-10">
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {previews.map((_, i) => (
              <button key={i} type="button" onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-white w-3' : 'bg-white/50 w-1.5'}`} />
            ))}
          </div>
        </>
      )}
    </>
  );

  const renderVideoThumbnail = () => isCurrentVideo && (
    <div className="flex items-center gap-2">
      <input ref={thumbnailRef} type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
      <button type="button" onClick={() => thumbnailRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
        <ImagePlus size={12} />
        {thumbnailPreview ? 'Trocar capa' : 'Adicionar capa do vídeo'}
      </button>
      {thumbnailPreview && (
        <div className="relative w-9 h-9 rounded overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnailPreview} alt="capa" className="w-full h-full object-cover" />
          <button type="button" onClick={clearThumbnail}
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <X size={10} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );

  const renderThumbnailStrip = () => previews.length > 1 && (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {previews.map((p, i) => (
        <button key={i} type="button" onClick={() => setCurrentIndex(i)}
          className={`relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
            i === currentIndex ? 'border-primary-500' : 'border-transparent opacity-60 hover:opacity-80'
          }`}>
          {p.type === 'image'
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={p.url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gray-800 flex items-center justify-center"><Video size={16} className="text-gray-400" /></div>
          }
        </button>
      ))}
      {files.length < MAX_FILES && (
        <label className="flex-shrink-0 w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
          <ImagePlus size={16} className="text-gray-400" />
          <input type="file" accept="image/*,video/*" onChange={handleFiles} className="hidden" multiple />
        </label>
      )}
    </div>
  );

  const renderActionBar = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <label className="cursor-pointer flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
          <ImagePlus size={17} /><span>Foto</span>
          <input ref={imageInputRef} type="file" accept="image/*" onChange={handleFiles} className="hidden" multiple />
        </label>
        <label className="cursor-pointer flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
          <Video size={17} /><span>Vídeo</span>
          <input ref={videoInputRef} type="file" accept="video/*" onChange={handleFiles} className="hidden" multiple />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading || files.length === 0}
        onClick={() => { if (files.length === 0) setShowMediaWarning(true); }}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
          files.length === 0
            ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
            : 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95'
        } disabled:opacity-60`}
      >
        {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
        Publicar
      </button>
    </div>
  );

  const cropper = cropSrc && (
    <ImageCropper
      imageSrc={cropSrc}
      aspect={cropAspect}
      onDone={handleCropDone}
      onCancel={handleCropCancel}
      title={cropTarget === 'thumbnail' ? 'Enquadrar capa do vídeo' : 'Recortar imagem'}
    />
  );

  // ════════════════════════════════════════════════════════════
  // MODAL LAYOUT
  // ════════════════════════════════════════════════════════════
  if (inModal) {
    return (
      <>
        {cropper}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">

          {/* Warning */}
          {showMediaWarning && files.length === 0 && (
            <div className="mx-4 mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="flex-shrink-0" />
              Adicione uma <strong className="mx-1">foto ou vídeo</strong> para publicar.
            </div>
          )}

          {/* Media area */}
          {previews.length > 0 ? (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {renderFormatSelector(true)}
              {/* Main preview — fills remaining height */}
              <div className="flex-1 min-h-0 relative bg-black overflow-hidden mt-2">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="max-h-full max-w-full overflow-hidden"
                    style={{ aspectRatio: currentRatio?.aspect ?? 1 }}
                  >
                    {currentPreview?.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentPreview.url} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={currentPreview?.url} poster={thumbnailPreview || undefined} controls className="w-full h-full object-cover" />
                    )}
                  </div>
                </div>
                {renderOverlays()}
              </div>
            </div>
          ) : (
            /* Empty state — centered add prompt */
            <div
              className="flex-1 flex flex-col items-center justify-center gap-3 cursor-pointer select-none"
              onClick={() => anyInputRef.current?.click()}
            >
              <input ref={anyInputRef} type="file" accept="image/*,video/*" onChange={handleFiles} className="hidden" multiple />
              <ImagePlus size={40} className="text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Clique para adicionar fotos ou vídeos</p>
              <p className="text-xs text-gray-300 dark:text-gray-600">JPG, PNG, GIF, MP4, MOV · até {MAX_FILES} arquivos</p>
            </div>
          )}

          {/* Footer — always visible */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 px-4 pt-3 pb-4 space-y-3">
            {/* Caption */}
            <div className="flex items-start gap-3">
              <Avatar src={user.avatar} name={displayName} size="md" />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva uma legenda..."
                maxLength={2200}
                rows={2}
                className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm resize-none focus:outline-none dark:text-gray-200 dark:placeholder-gray-600"
              />
            </div>
            {renderVideoThumbnail()}
            {renderThumbnailStrip()}
            {renderActionBar()}
          </div>
        </form>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════
  // FEED / INLINE LAYOUT
  // ════════════════════════════════════════════════════════════
  return (
    <>
      {cropper}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-gray-900 dark:border-gray-800"
      >
        {/* Avatar + caption */}
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

        {/* Warning */}
        {showMediaWarning && files.length === 0 && (
          <div className="mb-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg px-3 py-2">
            <AlertCircle size={13} className="flex-shrink-0" />
            Adicione uma <strong className="mx-1">foto ou vídeo</strong> para publicar.
          </div>
        )}

        {/* Preview */}
        {previews.length > 0 && (
          <div className="mb-3 space-y-2">
            {renderFormatSelector(false)}
            <div className="relative w-full">
              <div className={`${aspectClass} bg-black rounded-lg overflow-hidden relative`}>
                {currentPreview?.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentPreview.url} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={currentPreview?.url} poster={thumbnailPreview || undefined} controls className="w-full h-full object-cover" />
                )}
                {renderOverlays()}
              </div>
            </div>
            {renderVideoThumbnail()}
            {renderThumbnailStrip()}
          </div>
        )}

        {/* Action bar */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
          {renderActionBar()}
        </div>
      </form>
    </>
  );
}
