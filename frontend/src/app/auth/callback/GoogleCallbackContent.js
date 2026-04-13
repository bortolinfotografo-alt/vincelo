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
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (token) {
      // Armazena o token no contexto de autenticação
      setToken(token);

      // Mostra mensagem de sucesso
      toast.success('Login com Google realizado com sucesso!');

      // Redireciona para o feed
      router.push('/feed');
    } else {
      // Se não houver token, redireciona para login com erro
      toast.error('Falha no login com Google');
      router.push('/auth/login?error=google_auth_failed');
    }
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