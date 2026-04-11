'use client';

import { useState, useEffect } from 'react';

/**
 * Detecta se o dispositivo é mobile (largura < breakpoint).
 * Retorna `false` durante SSR para evitar mismatch de hidratação.
 * Só passa a `true` após a montagem no cliente.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    setMounted(true);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return { isMobile, mounted };
}
