'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';
import FloatingChat from '@/components/chat/FloatingChat';
import CreatePost from '@/components/social/CreatePost';
import SplashScreen from './SplashScreen';
import { useIsMobile } from '@/hooks/useIsMobile';
import { X } from 'lucide-react';

// Páginas de auth (não recebem shell de visitante nem splash redirect)
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password'];

// ── Modal de criar post ───────────────────────────────────────
function CreatePostModal({ onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-lg">Novo Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <CreatePost onPostCreated={onClose} />
      </div>
    </div>
  );
}

// ── AppShell principal ────────────────────────────────────────
export function AppShell({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, mounted } = useIsMobile(768);

  const [showCreate, setShowCreate] = useState(false);
  // Splash mostrado apenas 1x por sessão em mobile
  const [splashDone, setSplashDone] = useState(false);
  const [splashChecked, setSplashChecked] = useState(false);

  // ── Dark mode: só aplica quando logado ───────────────────────
  useEffect(() => {
    const html = document.documentElement;
    if (loading) {
      // Garante modo claro enquanto verifica autenticação
      html.classList.remove('dark');
      return;
    }
    if (!user) {
      html.classList.remove('dark');
    } else {
      const saved = localStorage.getItem('theme') || 'dark';
      // Persiste para o ThemeProvider restaurar na próxima visita
      if (!localStorage.getItem('theme')) localStorage.setItem('theme', 'dark');
      if (saved === 'dark') html.classList.add('dark');
      else html.classList.remove('dark');
    }
  }, [user, loading]);

  // ── Lógica do splash (mobile, visitante, fora de auth pages) ─
  useEffect(() => {
    if (!mounted) return;

    const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

    if (!isMobile || loading || user || isAuthPage) {
      // Desktop, logado ou em página de auth: pula splash
      setSplashDone(true);
      setSplashChecked(true);
      return;
    }

    // Mobile + visitante: verifica se splash já foi mostrado nesta sessão
    const shown = sessionStorage.getItem('splashShown');
    if (shown) {
      setSplashDone(true);
      setSplashChecked(true);
    } else {
      setSplashChecked(true); // mostra splash
    }
  }, [mounted, isMobile, loading, user, pathname]);

  // Quando splash termina: marca sessão e redireciona para login
  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem('splashShown', '1');
    setSplashDone(true);
    const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
    if (!isAuthPage) {
      router.replace('/auth/login');
    }
  }, [pathname, router]);

  // ── Botão + da Sidebar ────────────────────────────────────────
  useEffect(() => {
    const handler = () => setShowCreate(true);
    window.addEventListener('openCreatePost', handler);
    return () => window.removeEventListener('openCreatePost', handler);
  }, []);

  // ── Estados de carregamento ───────────────────────────────────
  // Aguarda montagem do cliente antes de qualquer decisão
  if (!mounted || !splashChecked) {
    return (
      <>
        <div className="h-16 bg-white border-b border-gray-200 dark:bg-gray-950 dark:border-gray-800" />
        <main className="flex-1 min-h-screen pb-20">{children}</main>
      </>
    );
  }

  // Splash ativo (mobile, visitante, primeira visita)
  if (!splashDone) {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  // Auth loading (aguarda resposta do servidor de autenticação)
  if (loading) {
    return (
      <>
        <div className="h-16 bg-white border-b border-gray-200 dark:bg-gray-950 dark:border-gray-800" />
        <main className="flex-1 min-h-screen pb-20">{children}</main>
      </>
    );
  }

  // ── Usuário logado ────────────────────────────────────────────
  if (user) {
    return (
      <>
        <Sidebar />
        <main className="flex-1 pb-20">{children}</main>
        <FloatingChat />
        {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
      </>
    );
  }

  // ── Visitante (desktop) ───────────────────────────────────────
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
