// Header de visitante — exibido apenas para usuários não logados no desktop
'use client';

import Link from 'next/link';
import { useAuth } from '@/app/auth-context';
import { LogOut, LayoutDashboard, Settings, UserCircle, User, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotificationPanel from '@/components/ui/NotificationPanel';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  const handleLogout = () => {
    logout();
    setSettingsOpen(false);
    setMobileOpen(false);
    router.push('/');
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shadow-sm shadow-orange-200 flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <path d="M6 9L16 25L26 9" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Vin<span className="text-primary-500">celo</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <Link href="/feed" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">Feed</Link>
                <Link href="/freelancers" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">Explorar</Link>
                <Link href="/jobs" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">Vagas</Link>
                <Link href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-1.5">
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
                <NotificationPanel />
                <div className="w-px h-6 bg-gray-200 mx-2" />
                <div className="relative" ref={settingsRef}>
                  <button
                    onClick={() => setSettingsOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {user.avatar
                      ? <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                      : <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold">{user.name?.charAt(0) || '?'}</div>}
                    <Settings size={14} className="text-gray-400" />
                  </button>
                  {settingsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link href={`/profile/${user.id}`} onClick={() => setSettingsOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <UserCircle size={15} className="text-gray-400" /> Meu Perfil
                      </Link>
                      <Link href="/profile" onClick={() => setSettingsOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <User size={15} className="text-gray-400" /> Editar Perfil
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut size={15} /> Sair
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Entrar</Link>
                <Link href="/auth/register" className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors ml-1">Cadastrar</Link>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-1">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-gray-100">
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                  : <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">{user.name?.charAt(0) || '?'}</div>}
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
              <Link href="/feed" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50">Feed</Link>
              <Link href="/freelancers" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50">Explorar</Link>
              <Link href="/jobs" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50">Vagas</Link>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50">
                <LayoutDashboard size={15} className="text-gray-400" /> Dashboard
              </Link>
              <Link href="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50">
                Atividade
              </Link>
              <div className="border-t border-gray-100 my-1 pt-1">
                <Link href={`/profile/${user.id}`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50">
                  <UserCircle size={15} className="text-gray-400" /> Meu Perfil
                </Link>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50">
                  <User size={15} className="text-gray-400" /> Editar Perfil
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-2 py-2.5 rounded-lg text-red-500 hover:bg-red-50">
                  <LogOut size={15} /> Sair
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="block px-2 py-2.5 text-gray-700 rounded-lg hover:bg-gray-50">Entrar</Link>
              <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="block px-2 py-2.5 text-white bg-primary-500 rounded-lg text-center font-medium">Cadastrar</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
