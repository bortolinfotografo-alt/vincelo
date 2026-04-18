'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import toast from 'react-hot-toast';

export default function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      toast.error('Falha no login com Google');
      router.push('/auth/login?error=google_auth_failed');
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${apiBase}/api/google-auth/exchange?code=${encodeURIComponent(code)}`, { credentials: 'include' })
      .then((res) => res.json())
      .then(({ token }) => {
        if (!token) throw new Error('sem token');
        setToken(token);
        toast.success('Login com Google realizado com sucesso!');
        router.push('/feed');
      })
      .catch(() => {
        toast.error('Falha no login com Google');
        router.push('/auth/login?error=google_auth_failed');
      });
  }, [searchParams, setToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Processando login com Google...</p>
      </div>
    </div>
  );
}