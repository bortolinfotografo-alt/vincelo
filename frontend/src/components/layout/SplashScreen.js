'use client';

import { useEffect, useState } from 'react';

/**
 * SplashScreen mobile-only
 * Exibido na primeira visita do usuário em dispositivos móveis.
 * Anima o logotipo e dispara onDone() após a conclusão.
 */
export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('enter'); // 'enter' | 'hold' | 'exit'

  useEffect(() => {
    // enter: 500ms → hold: 1200ms → exit: 500ms → done
    const t1 = setTimeout(() => setPhase('hold'), 500);
    const t2 = setTimeout(() => setPhase('exit'), 1700);
    const t3 = setTimeout(() => onDone?.(), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.5s ease',
        opacity: phase === 'exit' ? 0 : 1,
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease',
          transform: phase === 'enter' ? 'scale(0.6)' : 'scale(1)',
          opacity: phase === 'enter' ? 0 : 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Ícone — câmera estilizada */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 60px rgba(249,115,22,0.35)',
        }}>
          {/* Ícone V estilizado */}
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path
              d="M8 12L22 34L36 12"
              stroke="white"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="22" cy="10" r="3.5" fill="white" opacity="0.6" />
          </svg>
        </div>

        {/* Nome do app */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: 32,
            fontWeight: 900,
            color: '#111111',
            letterSpacing: -1,
            margin: 0,
            lineHeight: 1,
          }}>
            Vin<span style={{ color: '#f97316' }}>celo</span>
          </p>
          <p style={{
            fontSize: 13,
            color: '#9ca3af',
            marginTop: 6,
            fontWeight: 500,
            letterSpacing: 0.5,
          }}>
            Rede social do audiovisual
          </p>
        </div>
      </div>

      {/* Indicador de loading */}
      <div style={{
        position: 'absolute',
        bottom: 48,
        display: 'flex',
        gap: 6,
        opacity: phase === 'enter' ? 0 : 1,
        transition: 'opacity 0.4s ease 0.3s',
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#f97316',
            animation: `splash-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
