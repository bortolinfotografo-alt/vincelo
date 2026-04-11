'use client';

// Landing page — exibida apenas para visitantes no desktop.
// Em mobile, o AppShell intercepta antes e redireciona para /auth/login.

import Link from 'next/link';
import { Camera, Search, MessageCircle, Play, ChevronRight } from 'lucide-react';

// ── Telas do app (dark mode) para o mockup ───────────────────

// Ícone V da Vincelo
const VLogo = ({ size = 8 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.3, background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 32 32" fill="none">
      <path d="M6 9L16 25L26 9" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// Tela 1: Feed principal
function FeedScreen() {
  const posts = [
    {
      avatarImg: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&q=70',
      name: 'Lucas M.', sub: 'Videomaker',
      postImg: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300&q=70',
      likes: '1.2k', comments: '34',
    },
    {
      avatarImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=70',
      name: 'Ana R.', sub: 'Fotógrafa',
      postImg: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300&q=70',
      likes: '876', comments: '21',
    },
  ];
  const storyImgs = [
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&q=60',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=60',
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=60&q=60',
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=60&q=60',
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=60&q=60',
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#09090b', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'system-ui,sans-serif' }}>
      {/* Status bar */}
      <div style={{ height: 14, background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', flexShrink: 0 }}>
        <div style={{ fontSize: 5, color: '#9ca3af', fontWeight: 600 }}>9:41</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {[1,1,1].map((_, i) => <div key={i} style={{ width: 3, height: 3, borderRadius: 1, background: '#9ca3af' }} />)}
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 6px', flexShrink: 0 }}>
        <VLogo size={16} />
        <span style={{ color: '#fff', fontSize: 8, fontWeight: 800, letterSpacing: 0.3 }}>Vincelo</span>
        <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=40&q=60" alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #f97316' }} />
      </div>

      {/* Stories */}
      <div style={{ display: 'flex', gap: 7, padding: '0 10px 8px', overflowX: 'hidden', flexShrink: 0 }}>
        {storyImgs.map((src, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${i === 0 ? '#f97316' : '#374151'}`, padding: 1.5, boxSizing: 'border-box' }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ width: 18, height: 3, background: '#1f2937', borderRadius: 2 }} />
          </div>
        ))}
      </div>

      {/* Posts */}
      <div style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {posts.map((p, i) => (
          <div key={i} style={{ background: '#111827', flexShrink: 0 }}>
            {/* Post header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px 5px' }}>
              <img src={p.avatarImg} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#f3f4f6', fontSize: 6, fontWeight: 700 }}>{p.name}</div>
                <div style={{ color: '#6b7280', fontSize: 5, marginTop: 1 }}>{p.sub}</div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {[0,1,2].map(j => <div key={j} style={{ width: 2, height: 2, borderRadius: '50%', background: '#4b5563' }} />)}
              </div>
            </div>
            {/* Imagem do post */}
            <img src={p.postImg} alt="" style={{ width: '100%', height: 70, objectFit: 'cover', display: 'block' }} />
            {/* Ações */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span style={{ color: '#6b7280', fontSize: 5 }}>{p.likes}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span style={{ color: '#6b7280', fontSize: 5 }}>{p.comments}</span>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '7px 0 10px', background: '#111827', borderTop: '1px solid #1f2937', flexShrink: 0 }}>
        {/* Home */}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="#f97316" stroke="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22" fill="#f97316"/></svg>
        {/* Search */}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        {/* Add */}
        <div style={{ width: 18, height: 18, borderRadius: 6, background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        {/* Chat */}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        {/* Profile */}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
    </div>
  );
}

// Tela 2: Post em destaque (detalhe)
function PostScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#09090b', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'system-ui,sans-serif' }}>
      {/* Status bar */}
      <div style={{ height: 14, background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', flexShrink: 0 }}>
        <div style={{ fontSize: 5, color: '#9ca3af', fontWeight: 600 }}>9:41</div>
      </div>

      {/* Header do post */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px 8px', flexShrink: 0 }}>
        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=70" alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f97316', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: '#f3f4f6', fontSize: 7, fontWeight: 700 }}>Marina Silva</div>
          <div style={{ color: '#6b7280', fontSize: 5.5, marginTop: 1 }}>Fotógrafa • São Paulo</div>
        </div>
        <div style={{ background: '#f97316', borderRadius: 6, padding: '3px 7px' }}>
          <span style={{ color: '#fff', fontSize: 5.5, fontWeight: 700 }}>Contratar</span>
        </div>
      </div>

      {/* Foto principal */}
      <div style={{ width: '100%', height: 120, position: 'relative', flexShrink: 0 }}>
        <img src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=75" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '2px 5px' }}>
          <span style={{ color: '#fff', fontSize: 4.5, fontWeight: 600 }}>@marina.foto</span>
        </div>
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px 5px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#f97316" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span style={{ color: '#f97316', fontSize: 6, fontWeight: 600 }}>2.4k</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span style={{ color: '#6b7280', fontSize: 6 }}>89</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </div>
      </div>

      {/* Descrição */}
      <div style={{ padding: '0 10px 8px', flexShrink: 0 }}>
        <span style={{ color: '#f3f4f6', fontSize: 6, fontWeight: 600 }}>marina.foto </span>
        <span style={{ color: '#9ca3af', fontSize: 6 }}>Ensaio corporativo para startup de tech — luz natural e ambiente clean 📷✨</span>
      </div>

      {/* Comentários */}
      <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
        {[
          { user: 'Pedro A.', color: '#0891b2', text: 'Trabalho incrível! 🔥' },
          { user: 'Julia F.', color: '#16a34a', text: 'Quero contratar para meu evento!' },
        ].map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.color, flexShrink: 0, marginTop: 1 }} />
            <div>
              <span style={{ color: '#e5e7eb', fontSize: 5.5, fontWeight: 700 }}>{c.user} </span>
              <span style={{ color: '#9ca3af', fontSize: 5.5 }}>{c.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Input de comentário */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', marginTop: 'auto', borderTop: '1px solid #1f2937', flexShrink: 0 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#374151' }} />
        <div style={{ flex: 1, height: 14, borderRadius: 7, background: '#1f2937', display: 'flex', alignItems: 'center', padding: '0 6px' }}>
          <span style={{ color: '#4b5563', fontSize: 5.5 }}>Adicionar comentário...</span>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '7px 0 10px', background: '#111827', borderTop: '1px solid #1f2937', flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <div style={{ width: 18, height: 18, borderRadius: 6, background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
    </div>
  );
}

// Tela 3: Story viewer
function StoryScreen() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'system-ui,sans-serif', position: 'relative' }}>
      {/* Foto de fundo do story */}
      <img src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&q=75" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {/* Overlay escuro para legibilidade */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.1) 40%,rgba(0,0,0,0.6) 100%)' }} />

      {/* Barras de progresso */}
      <div style={{ position: 'relative', display: 'flex', gap: 2, padding: '14px 8px 6px', flexShrink: 0, zIndex: 10 }}>
        {[1, 0.4, 0.4, 0.4].map((fill, i) => (
          <div key={i} style={{ flex: 1, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
            <div style={{ width: `${fill * 100}%`, height: '100%', background: '#fff', borderRadius: 1 }} />
          </div>
        ))}
      </div>

      {/* Header do story */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px 0', zIndex: 10, flexShrink: 0 }}>
        <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&q=70" alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f97316', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 6.5, fontWeight: 700 }}>Rafael Costa</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 5, marginTop: 1 }}>há 2 horas</div>
        </div>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>

      {/* Conteúdo central do story */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', zIndex: 5, paddingBottom: 12 }}>
        <div style={{ textAlign: 'center', padding: '0 12px' }}>
          <div style={{ color: '#fff', fontSize: 7.5, fontWeight: 800, lineHeight: 1.3, textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>Bastidores do ensaio</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 6, marginTop: 4, lineHeight: 1.4, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>Dia de shooting com a equipe — São Paulo 📍</div>
        </div>
      </div>

      {/* Rodapé do story */}
      <div style={{ position: 'relative', zIndex: 10, padding: '8px 10px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 5.5 }}>Responder...</span>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </div>
      </div>
    </div>
  );
}

// ── Frame de celular ──────────────────────────────────────────
function PhoneMockup({ screen, style = {} }) {
  const width = style.width || 176;
  const screenHeight = Math.round(width * (19.5 / 9));

  return (
    <div className="relative flex-shrink-0" style={{ width, ...style }}>
      {/* Corpo */}
      <div
        className="rounded-[14%] border-[3px] border-gray-800 bg-gray-950 overflow-hidden shadow-2xl w-full"
        style={{ height: screenHeight }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-[28%] h-[3.5%] bg-gray-950 rounded-b-[40%]" />
        <div className="w-full h-full">{screen}</div>
      </div>
      {/* Botões laterais decorativos */}
      <div className="absolute right-0 top-[18%] w-[3px] h-[8%] bg-gray-700 rounded-l-sm" />
      <div className="absolute left-0 top-[14%] w-[3px] h-[6%] bg-gray-700 rounded-r-sm" />
      <div className="absolute left-0 top-[22%] w-[3px] h-[6%] bg-gray-700 rounded-r-sm" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-white">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-14 pb-12 sm:pt-20 sm:pb-16">
        {/* Glow blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Texto */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-5">
                A rede social do{' '}
                <span className="text-orange-500">Audiovisual</span>{' '}
                no Brasil
              </h1>

              <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed">
                Descubra fotógrafos, videomakers e editores incríveis em um feed visual — e contrate direto do conteúdo.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/auth/register?role=COMPANY"
                  className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base px-7 py-3.5 rounded-xl transition-colors"
                >
                  Sou Empresa <ChevronRight size={16} />
                </Link>
                <Link
                  href="/auth/register?role=FREELANCER"
                  className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-900 font-bold text-base px-7 py-3.5 rounded-xl transition-colors"
                >
                  Sou Freelancer
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-10 justify-center lg:justify-start">
                {[
                  { value: '500+', label: 'Freelancers' },
                  { value: '1k+', label: 'Jobs realizados' },
                  { value: '4.8★', label: 'Avaliação média' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xl font-black text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Phones */}
            <div className="hidden lg:flex items-center justify-center relative h-[420px]">
              <div className="absolute left-1/2 top-8 -translate-x-[200px] -rotate-[10deg] opacity-70">
                <PhoneMockup screen={<StoryScreen />} style={{ width: 158 }} />
              </div>
              <div className="relative z-10">
                <PhoneMockup screen={<FeedScreen />} style={{ width: 176 }} />
              </div>
              <div className="absolute left-1/2 top-8 translate-x-[24px] rotate-[10deg] opacity-70">
                <PhoneMockup screen={<PostScreen />} style={{ width: 158 }} />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── GALERIA ───────────────────────────────────────────── */}
      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Veja o que está sendo criado</h2>
            <p className="text-gray-500">Conteúdo real, profissionais reais.</p>
          </div>

          {/* Grid responsivo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { src: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=80', label: '📷 Fotografia', tall: true },
              { src: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&q=80', label: '🚁 Drone 4K', video: true },
              { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80', label: '📷 Casamento' },
              { src: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=80', label: '🎬 Edição' },
              { src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80', label: '📷 Retrato' },
              { src: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80', label: '🎥 Bastidores', video: true },
              { src: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80', label: '🎥 Videomaker' },
            ].map((item, i) => (
              <div
                key={i}
                className={`relative rounded-2xl overflow-hidden bg-gray-200 group cursor-pointer ${item.tall ? 'row-span-2' : ''}`}
                style={{ minHeight: item.tall ? 200 : 100 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt={item.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ minHeight: item.tall ? 200 : 100 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-2.5 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5">
                  {item.video && <Play size={11} className="text-white fill-white" />}
                  <span className="text-white text-xs font-semibold">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────── */}
      <section className="py-14 sm:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 text-center mb-10">Como funciona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: <Camera size={22} className="text-orange-500" />, title: 'Explore o feed', desc: 'Veja trabalhos incríveis de fotógrafos e videomakers reais.' },
              { icon: <Search size={22} className="text-orange-500" />, title: 'Encontre talentos', desc: 'Filtre pelo portfólio e avaliações para achar o profissional ideal.' },
              { icon: <MessageCircle size={22} className="text-orange-500" />, title: 'Contrate direto', desc: 'Envie mensagem e faça seu orçamento sem intermediários.' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
                  {step.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-orange-500 py-16 px-5">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-6 leading-tight">
            Comece a mostrar seu trabalho ou encontre profissionais agora
          </h2>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-white text-orange-500 hover:bg-orange-50 font-bold text-base px-8 py-3.5 rounded-xl transition-colors"
          >
            Criar conta grátis <ChevronRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  );
}
