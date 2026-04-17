'use client';

/**
 * ImageCropper — modal de recorte reutilizável (avatar, post, capa de vídeo).
 *
 * Props:
 *   imageSrc   : string (object URL ou data URL)
 *   aspect     : number (ex.: 1 = quadrado, 16/9 = landscape)
 *   onDone     : (croppedBlob: Blob) => void
 *   onCancel   : () => void
 *   title      : string (opcional)
 *   circular   : bool   (overlay circular para avatar)
 */

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

// Usa canvas para extrair a região recortada como Blob
async function getCroppedBlob(imageSrc, pixelCrop, outputType = 'image/jpeg') {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas is empty'));
    }, outputType, 0.9);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function ImageCropper({
  imageSrc,
  aspect = 1,
  onDone,
  onCancel,
  title = 'Ajustar imagem',
  circular = false,
}) {
  const [crop, setCrop]       = useState({ x: 0, y: 0 });
  const [zoom, setZoom]       = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [saving, setSaving]   = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedArea(pixels);
  }, []);

  const handleDone = async () => {
    if (!croppedArea) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedArea);
      onDone(blob);
    } catch {
      // silencioso
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm flex-shrink-0">
        <button onClick={onCancel} className="text-white/70 hover:text-white p-1">
          <X size={22} />
        </button>
        <p className="text-white text-sm font-semibold">{title}</p>
        <button
          onClick={handleDone}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check size={16} />
          )}
          Aplicar
        </button>
      </div>

      {/* Crop area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={circular ? 'round' : 'rect'}
          showGrid={!circular}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#000' },
            cropAreaStyle:  { border: '2px solid rgba(249,115,22,0.8)' },
          }}
        />
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-3 px-6 py-4 bg-black/80 backdrop-blur-sm flex-shrink-0">
        <ZoomOut size={18} className="text-white/60 flex-shrink-0" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-primary-500"
        />
        <ZoomIn size={18} className="text-white/60 flex-shrink-0" />
      </div>
    </div>
  );
}
