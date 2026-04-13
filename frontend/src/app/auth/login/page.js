'use client';

import { useState } from 'react';
import { useAuth } from '@/app/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData);
      toast.success('Bem-vindo de volta!');
      router.push('/feed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-white">

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
          {/* V mark */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 9L16 25L26 9" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Vin<span className="text-orange-500">celo</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">Rede social do audiovisual</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Entrar</h2>
        <p className="text-sm text-gray-400 mb-6">Acesse sua conta para continuar</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Senha */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <Link href="/auth/forgot-password" className="text-xs text-orange-500 hover:underline">
                Esqueceu?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold text-sm py-3.5 rounded-xl transition-colors mt-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Entrando...</> : 'Entrar'}
          </button>

          {/* Login com Google */}
          <div className="mt-4">
            <a
              href="/api/google-auth/google"
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm py-3 rounded-xl transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.64 12 18.64C9.14 18.64 6.71 16.69 5.84 14.09H2.18V16.96C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
                <path d="M5.84 14.09C5.62 13.37 5.49 12.62 5.49 11.85C5.49 11.08 5.62 10.33 5.84 9.61V6.74H2.18C1.43 8.24 1 9.96 1 11.85C1 13.74 1.43 15.46 2.18 16.96L5.84 14.09Z" fill="#FBBC05"/>
                <path d="M12 5.36C13.62 5.36 15.06 5.93 16.21 7.03L19.36 3.88C17.45 2.07 14.97 1 12 1C7.7 1 3.99 3.47 2.18 6.74L5.84 9.61C6.71 6.92 9.14 5.36 12 5.36Z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </a>
          </div>
        </form>

        {/* Cadastro */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Não tem conta?{' '}
          <Link href="/auth/register" className="text-orange-500 font-semibold hover:underline">
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
