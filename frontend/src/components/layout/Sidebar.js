'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import { useTheme } from '@/app/theme-context';
import {
  Home, Compass, Briefcase, LayoutDashboard, Plus,
  LogOut, Sun, Moon, UserCircle, Settings, MessageCircle, Shield,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import NotificationPanel from '@/components/ui/NotificationPanel';
import api from '@/lib/api';

// Ordem: Home, Freelancers, Vagas | + | Chat, Atividade, Config
const NAV_ITEMS = [
  { href: '/feed',        icon: Home,           label: 'Home' },
  { href: '/freelancers', icon: Compass,         label: 'Freelancers' },
  { href: '/jobs',        icon: Briefcase,       label: 'Vagas' },
  { href: '/chat',        icon: MessageCircle,   label: 'Chat' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/chat/unread-count');
      setUnreadMessages(res.data.count || 0);
    } catch { /* silencioso */ }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnread]);

  const handleLogout = () => {
    logout();
    setSettingsOpen(false);
    router.push('/');
  };

  useEffect(() => {
    function handler(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (href) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  // Shared class builders
  const itemCls = 'flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors group min-w-[44px] touch-manipulation';
  const iconCls = (active) =>
    active
      ? 'text-primary-500 dark:text-primary-400'
      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors';
  const labelCls = (active) =>
    `text-[10px] font-medium transition-colors ${
      active
        ? 'text-primary-500 dark:text-primary-400'
        : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-500'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 dark:bg-gray-950 dark:border-gray-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-2xl mx-auto flex items-end justify-around px-1 pt-1 pb-0.5">

        {/* ── Home, Freelancers, Vagas ── */}
        {NAV_ITEMS.slice(0, 3).map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className={itemCls}>
              <Icon size={22} className={iconCls(active)} />
              <span className={labelCls(active)}>{label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-primary-500 mt-px" />}
            </Link>
          );
        })}

        {/* ── + Post (centro elevado) ── */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openCreatePost'))}
          className="flex flex-col items-center gap-0.5 -mt-4 mx-0.5 touch-manipulation"
          title="Novo Post"
        >
          <div className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30 hover:bg-primary-600 active:scale-95 transition-all">
            <Plus size={26} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-600">Postar</span>
        </button>

        {/* ── Chat ── */}
        {NAV_ITEMS.slice(3).map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className={itemCls} onClick={() => setUnreadMessages(0)}>
              <div className="relative">
                <Icon size={22} className={iconCls(active)} />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </div>
              <span className={labelCls(active)}>{label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-primary-500 mt-px" />}
            </Link>
          );
        })}

        {/* ── Atividade (notificações) — standalone na barra ── */}
        <div className="flex flex-col items-center gap-0.5">
          <NotificationPanel side="bottom" />
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-600">Atividade</span>
        </div>

        {/* ── Config ── */}
        <div className="relative min-w-[44px]" ref={settingsRef}>
          <button
            onClick={() => setSettingsOpen((p) => !p)}
            className={`${itemCls} w-full`}
          >
            <Settings
              size={22}
              className={settingsOpen
                ? 'text-primary-500 dark:text-primary-400'
                : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors'}
            />
            <span className={labelCls(settingsOpen)}>Config</span>
          </button>

          {/* Dropdown — abre para cima, alinhado à direita */}
          {settingsOpen && (
            <div className="absolute bottom-full right-0 mb-3 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl py-1 overflow-hidden dark:bg-gray-900 dark:border-gray-700 z-50">
              {/* Info do usuário */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm flex-shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>

              <Link
                href={user ? `/profile/${user.id}` : '/auth/login'}
                onClick={() => setSettingsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <UserCircle size={16} className="text-gray-400" />
                Meu Perfil
              </Link>
              <Link
                href="/profile"
                onClick={() => setSettingsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <UserCircle size={16} className="text-gray-400" />
                Editar Perfil
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setSettingsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <LayoutDashboard size={16} className="text-gray-400" />
                Dashboard
              </Link>

              {['MODERATOR', 'ADMIN', 'OWNER'].includes(user?.adminRole) && (
                <Link
                  href="/admin"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <Shield size={16} className="text-purple-500" />
                  Painel Admin
                </Link>
              )}

              <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                <button
                  onClick={() => { toggleTheme(); }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    {theme === 'dark'
                      ? <Sun size={16} className="text-yellow-400" />
                      : <Moon size={16} className="text-blue-400" />}
                    {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    theme === 'dark'
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {theme === 'dark' ? 'DARK' : 'LIGHT'}
                  </span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <LogOut size={16} />
                  Sair da conta
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
