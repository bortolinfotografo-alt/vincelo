'use client';

import { useState, useEffect } from 'react';
import { Zap, X, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

const DURATION_DAYS = 7;

/**
 * Modal de impulsionamento reutilizável.
 * Props:
 *   open       – boolean
 *   onClose    – fn
 *   targetId   – string (userId para perfil, jobId para vaga)
 *   type       – 'PROFILE' | 'JOB'
 *   label      – string exibida no modal (ex: "seu perfil" | "esta vaga")
 *   onSuccess  – fn(boost) chamada após ativação
 */
export default function BoostModal({ open, onClose, targetId, type, label = 'este item', onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [activeBoost, setActiveBoost] = useState(null);
  const [checking, setChecking] = useState(false);

  // Verifica se já há boost ativo ao abrir
  useEffect(() => {
    if (!open || !targetId) return;
    setChecking(true);
    api.get('/boosts/me')
      .then((r) => {
        const found = r.data.boosts.find(
          (b) => b.targetId === targetId && b.type === type && b.status === 'ACTIVE'
        );
        setActiveBoost(found || null);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [open, targetId, type]);

  const handleBoost = async () => {
    setLoading(true);
    try {
      const r = await api.post('/boosts', { targetId, type });
      toast.success('Impulsionamento ativado por 7 dias!');
      setActiveBoost(r.data.boost);
      onSuccess?.(r.data.boost);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao impulsionar');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeBoost) return;
    setLoading(true);
    try {
      await api.delete(`/boosts/${activeBoost.id}`);
      toast.success('Impulsionamento cancelado');
      setActiveBoost(null);
      onSuccess?.(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao cancelar');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const endDate = activeBoost
    ? new Date(activeBoost.endDate).toLocaleDateString('pt-BR')
    : (() => { const d = new Date(); d.setDate(d.getDate() + DURATION_DAYS); return d.toLocaleDateString('pt-BR'); })();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Zap size={16} className="text-amber-500" fill="currentColor" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Impulsionar</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {checking ? (
            <div className="py-6 text-center text-sm text-gray-400">Verificando...</div>
          ) : activeBoost ? (
            /* Estado: já impulsionado */
            <>
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <CheckCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Impulsionamento ativo</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    {label.charAt(0).toUpperCase() + label.slice(1)} está em destaque até <strong>{endDate}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={handleCancel}
                disabled={loading}
                className="w-full py-2.5 text-sm font-medium text-red-500 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                {loading ? 'Cancelando...' : 'Cancelar impulsionamento'}
              </button>
            </>
          ) : (
            /* Estado: sem boost ativo */
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Destaque <span className="font-semibold text-gray-900 dark:text-white">{label}</span> no topo das listagens por <strong>{DURATION_DAYS} dias</strong>.
              </p>

              {/* Benefícios */}
              <div className="space-y-2">
                {[
                  { icon: TrendingUp, text: 'Aparece antes dos demais nas buscas' },
                  { icon: Zap, text: 'Badge de destaque visível para outros usuários' },
                  { icon: Clock, text: `Duração de ${DURATION_DAYS} dias corridos` },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                      <Icon size={12} className="text-primary-500" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{text}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-500 dark:text-gray-400">
                O impulsionamento será ativado imediatamente e expira automaticamente em <strong>{endDate}</strong>.
              </div>

              <button
                onClick={handleBoost}
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25">
                <Zap size={16} fill="currentColor" />
                {loading ? 'Ativando...' : 'Impulsionar agora'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
