'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import api from '@/lib/api';
import { Check, Zap, Star, Shield, TrendingUp, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: Camera,     text: 'Perfil destacado nas buscas' },
  { icon: TrendingUp, text: 'Impulsionar perfil e vagas' },
  { icon: Star,       text: 'Badge de verificado' },
  { icon: Shield,     text: 'Acesso a vagas exclusivas' },
  { icon: Zap,        text: 'Propostas ilimitadas' },
  { icon: Check,      text: 'Suporte prioritário' },
];

export default function AssinarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [subscribing, setSubscribing]   = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    api.get('/payments/status')
      .then((res) => setSubscription(res.data.subscription))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubscribe = async () => {
    if (subscribing) return;
    setSubscribing(true);
    try {
      const res = await api.post('/payments/subscribe');
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao iniciar pagamento');
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancelar assinatura? O acesso continua até o fim do período pago.')) return;
    try {
      await api.post('/payments/cancel');
      toast.success('Assinatura cancelada. Acesso até o fim do período.');
      setSubscription((s) => ({ ...s, status: 'CANCELLED' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao cancelar');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) return null;

  const isActive    = subscription?.status === 'ACTIVE';
  const isCancelled = subscription?.status === 'CANCELLED';
  const isPastDue   = subscription?.status === 'PAST_DUE';

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <Zap size={12} fill="currentColor" /> Vincelo Pro
        </span>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Impulsione sua carreira
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Acesso completo a todas as funcionalidades da plataforma
        </p>
      </div>

      {/* Card de preço */}
      <div className="bg-white dark:bg-gray-900 border-2 border-primary-500 rounded-2xl p-8 shadow-xl shadow-primary-500/10 mb-6">
        <div className="flex items-end gap-1 mb-1">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">R$&nbsp;9</span>
          <span className="text-4xl font-bold text-gray-900 dark:text-white">,90</span>
          <span className="text-gray-400 text-sm mb-1">/mês</span>
        </div>
        <p className="text-xs text-gray-400 mb-6">Cobrado mensalmente · Cancele quando quiser</p>

        <ul className="space-y-3 mb-8">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                <Icon size={11} className="text-primary-500" />
              </span>
              {text}
            </li>
          ))}
        </ul>

        {/* Status atual */}
        {isActive && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-xl text-sm font-medium">
              <Check size={16} />
              Assinatura ativa
              {subscription?.nextChargeDate && (
                <span className="ml-auto text-xs font-normal text-gray-400">
                  Próx. cobrança: {new Date(subscription.nextChargeDate).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
            <button
              onClick={handleCancel}
              className="w-full py-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              Cancelar assinatura
            </button>
          </div>
        )}

        {isCancelled && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-xl text-sm font-medium">
              <Shield size={16} />
              Cancelada — acesso até fim do período
            </div>
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {subscribing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              Reativar assinatura
            </button>
          </div>
        )}

        {isPastDue && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl text-sm font-medium">
              Pagamento pendente
            </div>
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {subscribing ? <Loader2 size={16} className="animate-spin" /> : null}
              Atualizar pagamento
            </button>
          </div>
        )}

        {!isActive && !isCancelled && !isPastDue && (
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {subscribing
              ? <Loader2 size={16} className="animate-spin" />
              : <Zap size={16} fill="currentColor" />
            }
            {subscribing ? 'Redirecionando...' : 'Assinar agora'}
          </button>
        )}
      </div>

      <p className="text-center text-xs text-gray-400">
        Pagamento seguro via Stripe · Dados criptografados
      </p>
    </div>
  );
}