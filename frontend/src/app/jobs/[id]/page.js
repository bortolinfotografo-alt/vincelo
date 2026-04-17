'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/app/auth-context';
import toast from 'react-hot-toast';
import {
  Briefcase, MapPin, Calendar, DollarSign, Clock,
  ArrowLeft, Send, User, BadgeCheck, MessageCircle, CheckCircle, XCircle, Zap,
} from 'lucide-react';
import BoostModal from '@/components/ui/BoostModal';

const SERVICE_TYPE_LABELS = {
  fotografia: 'Fotografia',
  video: 'Vídeo',
  drone: 'Drone',
  edicao: 'Edição',
  design: 'Design',
  evento: 'Evento',
};

const STATUS_LABELS = {
  OPEN: { label: 'Aberta', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  IN_PROGRESS: { label: 'Preenchida', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  COMPLETED: { label: 'Concluída', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  CLOSED: { label: 'Encerrada', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
};

export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [boostOpen, setBoostOpen] = useState(false);
  const [proposedBudget, setProposedBudget] = useState('');
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [updatingProposal, setUpdatingProposal] = useState(null);

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then((res) => {
        const j = res.data.job;
        setJob(j);
        // Verifica se o usuário já se candidatou
        if (user && j.proposals) {
          const applied = j.proposals.some(
            (p) => p.freelancer?.user?.id === user.id
          );
          setAlreadyApplied(applied);
        }
      })
      .catch(() => toast.error('Vaga não encontrada'))
      .finally(() => setLoading(false));
  }, [id, user]);

  const handleProposalStatus = async (proposalId, status) => {
    setUpdatingProposal(proposalId);
    try {
      await api.put(`/proposals/${proposalId}/status`, { status });
      toast.success(status === 'ACCEPTED' ? 'Candidatura aceita!' : 'Candidatura recusada');
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data.job);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar candidatura');
    } finally {
      setUpdatingProposal(null);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) { router.push('/auth/login'); return; }
    if (!coverLetter.trim()) { toast.error('Escreva uma mensagem'); return; }

    if (coverLetter.trim().length < 30) {
      toast.error('Mensagem muito curta (mínimo 30 caracteres)');
      return;
    }
    setApplying(true);
    try {
      await api.post('/proposals', {
        jobId: id,
        coverLetter: coverLetter.trim(),
        proposedBudget: proposedBudget ? Number(proposedBudget) : undefined,
      });
      toast.success('Candidatura enviada!');
      setAlreadyApplied(true);
      setShowApply(false);
    } catch (err) {
      const firstError = err.response?.data?.errors?.[0]?.message;
      toast.error(firstError || err.response?.data?.message || 'Erro ao enviar candidatura');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Vaga não encontrada.</p>
        <Link href="/jobs" className="mt-4 inline-block text-primary-500 hover:underline text-sm">
          ← Voltar às vagas
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[job.status] || STATUS_LABELS.OPEN;
  const isCompanyOwner = user?.id === job.company?.user?.id;
  const isFreelancer = user?.role === 'FREELANCER';
  const canApply = isFreelancer && job.status === 'OPEN' && !alreadyApplied && !isCompanyOwner;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors">
        <ArrowLeft size={16} /> Voltar às vagas
      </Link>

      {/* Card principal */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden dark:bg-gray-900 dark:border-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
                {job.serviceType && (
                  <span className="text-xs bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 px-2.5 py-1 rounded-full font-medium">
                    {SERVICE_TYPE_LABELS[job.serviceType] || job.serviceType}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 mt-4">
            {job.location && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin size={14} className="text-gray-400" />
                {job.location}
              </div>
            )}
            {job.jobDate && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Calendar size={14} className="text-gray-400" />
                {new Date(job.jobDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                {job.jobTime && (
                  <span className="flex items-center gap-1 ml-1">
                    <Clock size={12} /> {job.jobTime}
                  </span>
                )}
              </div>
            )}
            {job.budget && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-primary-500">
                <DollarSign size={14} />
                R$ {Number(job.budget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        </div>

        {/* Descrição */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Descrição</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {job.description}
          </p>
        </div>

        {/* Empresa */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Publicado por</h2>
          <Link
            href={`/profile/${job.company?.user?.id}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
              {job.company?.user?.avatar
                ? <img src={job.company.user.avatar} alt="" className="w-full h-full object-cover" />
                : (job.company?.user?.name?.charAt(0) || '?')}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{job.company?.user?.name || 'Empresa'}</p>
              <p className="text-xs text-gray-400">Ver perfil</p>
            </div>
          </Link>
        </div>

        {/* Ações */}
        <div className="p-6 flex flex-wrap gap-3">
          {canApply && !showApply && (
            <button
              onClick={() => setShowApply(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Send size={15} /> Candidatar-se
            </button>
          )}
          {alreadyApplied && (
            <span className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-xl text-sm font-medium">
              ✓ Candidatura enviada
            </span>
          )}
          {!isCompanyOwner && user && job.company?.user?.id && (
            <Link href={`/chat?userId=${job.company.user.id}`}>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors">
                <MessageCircle size={15} /> Mensagem
              </button>
            </Link>
          )}
          {!user && job.status === 'OPEN' && (
            <Link href="/auth/login">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors">
                <User size={15} /> Entrar para candidatar
              </button>
            </Link>
          )}
          {isCompanyOwner && job.status === 'OPEN' && (
            <>
              <button
                onClick={() => setBoostOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-semibold transition-colors">
                <Zap size={15} fill="currentColor" /> Impulsionar vaga
              </button>
              <BoostModal
                open={boostOpen}
                onClose={() => setBoostOpen(false)}
                targetId={job.id}
                type="JOB"
                label="esta vaga"
                onSuccess={() => setBoostOpen(false)}
              />
            </>
          )}
        </div>

        {/* Formulário de candidatura */}
        {showApply && (
          <form onSubmit={handleApply} className="px-6 pb-6 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sua candidatura</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Mensagem de apresentação <span className="text-red-500">*</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Conte por que você é a pessoa certa para este projeto..."
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 dark:text-gray-200 placeholder-gray-400 resize-none"
              />
              <div className="flex justify-between mt-0.5">
                <span className={`text-[10px] ${coverLetter.trim().length < 30 ? 'text-red-400' : 'text-green-500'}`}>
                  {coverLetter.trim().length < 30 ? `Mínimo 30 caracteres (${30 - coverLetter.trim().length} restantes)` : '✓ Ok'}
                </span>
                <span className="text-[10px] text-gray-400">{coverLetter.length}/1000</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Proposta de valor (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                <input
                  type="number"
                  value={proposedBudget}
                  onChange={(e) => setProposedBudget(e.target.value)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 dark:text-gray-200"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={applying || !coverLetter.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Send size={15} /> {applying ? 'Enviando...' : 'Enviar candidatura'}
              </button>
              <button
                type="button"
                onClick={() => setShowApply(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Candidatos (só empresa vê) */}
      {isCompanyOwner && job.proposals?.length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl overflow-hidden dark:bg-gray-900 dark:border-gray-800">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Candidatos ({job.proposals.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {job.proposals.map((proposal) => (
              <div key={proposal.id} className="p-4 flex items-start gap-3">
                <Link href={`/profile/${proposal.freelancer?.user?.id}`} className="flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-500">
                    {proposal.freelancer?.user?.avatar
                      ? <img src={proposal.freelancer.user.avatar} alt="" className="w-full h-full object-cover" />
                      : proposal.freelancer?.user?.name?.charAt(0) || '?'}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <Link href={`/profile/${proposal.freelancer?.user?.id}`} className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-primary-500 transition-colors">
                        {proposal.freelancer?.user?.name || 'Freelancer'}
                      </Link>
                      {proposal.proposedBudget && (
                        <span className="ml-2 text-xs text-primary-500 font-medium">R$ {Number(proposal.proposedBudget).toFixed(2)}</span>
                      )}
                    </div>
                    {proposal.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProposalStatus(proposal.id, 'ACCEPTED')}
                          disabled={updatingProposal === proposal.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <CheckCircle size={13} /> Aceitar
                        </button>
                        <button
                          onClick={() => handleProposalStatus(proposal.id, 'REJECTED')}
                          disabled={updatingProposal === proposal.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
                        >
                          <XCircle size={13} /> Recusar
                        </button>
                      </div>
                    )}
                    {proposal.status === 'ACCEPTED' && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-xs font-medium">
                        <CheckCircle size={13} /> Aceito
                      </span>
                    )}
                    {proposal.status === 'REJECTED' && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-400 dark:bg-gray-800 rounded-lg text-xs font-medium">
                        <XCircle size={13} /> Recusado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{proposal.coverLetter}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
