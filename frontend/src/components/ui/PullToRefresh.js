'use client';

// ============================================================
// PULL TO REFRESH
// Gesto de arrastar para baixo para atualizar o conteúdo.
// Só ativa quando a página está rolada até o topo (scrollY === 0).
// Props:
//   onRefresh: async () => void  — chamado ao soltar o gesto
//   children: ReactNode
// ============================================================

import { useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 72; // px de arraste para ativar

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance]   = useState(0); // 0–THRESHOLD
  const [refreshing, setRefreshing]       = useState(false);
  const startYRef   = useRef(null);
  const pullingRef  = useRef(false);

  const handleTouchStart = useCallback((e) => {
    // Só ativa se estiver no topo da página
    if (window.scrollY > 0) return;
    startYRef.current = e.touches[0].clientY;
    pullingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startYRef.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) { setPullDistance(0); return; }

    // Resiste à medida que se afasta do limiar (efeito elástico)
    const clamped = Math.min(delta * 0.5, THRESHOLD);
    setPullDistance(clamped);
    pullingRef.current = clamped >= THRESHOLD;

    // Previne o scroll nativo apenas quando estamos puxando ativamente
    if (delta > 8) e.preventDefault();
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (startYRef.current === null) return;
    startYRef.current = null;

    if (!pullingRef.current) {
      setPullDistance(0);
      return;
    }

    // Ativou — executa o refresh
    setRefreshing(true);
    setPullDistance(THRESHOLD);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showIndicator = pullDistance > 0 || refreshing;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: pullDistance > 0 ? 'none' : 'pan-y' }}
    >
      {/* Indicador de pull */}
      <div
        className="flex justify-center overflow-hidden transition-all duration-150"
        style={{ height: showIndicator ? `${Math.max(pullDistance, refreshing ? THRESHOLD : 0)}px` : 0 }}
      >
        <div className="flex items-center justify-center">
          <div
            className={`w-9 h-9 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center transition-transform ${
              refreshing ? 'scale-100' : ''
            }`}
            style={{ transform: `scale(${0.5 + progress * 0.5})` }}
          >
            <RefreshCw
              size={18}
              className={`text-primary-500 transition-all ${refreshing ? 'animate-spin' : ''}`}
              style={{ transform: `rotate(${progress * 180}deg)` }}
            />
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
