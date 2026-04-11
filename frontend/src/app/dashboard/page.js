// ============================================================
// DASHBOARD PAGE
// Mostra dados diferentes para freelancer e empresa
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/app/auth-context';
import { Camera, Briefcase, Clock, Star, Users, CheckCircle, XCircle, AlertCircle, DollarSign, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api
        .get('/dashboard')
        .then((res) => setDashboard(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!authLoading && !user) return null;
  if (loading) return <div className="flex justify-center py-20">Carregando...</div>;

  if (user?.role === 'FREELANCER') {
    return <FreelancerDashboard dashboard={dashboard} />;
  }

  return <CompanyDashboard dashboard={dashboard} />;
}

function FreelancerDashboard({ dashboard }) {
  const { user } = useAuth();
  const stats = dashboard?.stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-surface-500">Bem-vindo de volta, {user?.name}!</p>
        </div>
        {!user?.isActive && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            <span>Assinatura inativa</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Briefcase size={20} />} label="Candidaturas" value={stats.proposalsApplied || 0} />
        <StatCard icon={<Clock size={20} />} label="Aguardando" value={stats.pendingProposals || 0} color="yellow" />
        <StatCard icon={<CheckCircle size={20} />} label="Aprovadas" value={stats.acceptedProposals || 0} color="green" />
        <StatCard icon={<Star size={20} />} label="Avaliacao" value={stats.avgRating || 'N/A'} />
      </div>

      {/* Minhas Candidaturas */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6 mb-6 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Minhas Candidaturas</h2>
          <Link href="/jobs" className="text-sm text-primary-600 hover:underline">Ver vagas</Link>
        </div>
        {!dashboard?.recentProposals || dashboard.recentProposals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-surface-500 mb-3">Voce ainda nao se candidatou a nenhuma vaga.</p>
            <Link href="/jobs" className="btn-primary text-sm">Explorar Vagas</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {dashboard.recentProposals.map((proposal) => (
              <div key={proposal.id} className="flex items-center justify-between p-4 bg-surface-50 rounded-lg dark:bg-gray-800">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{proposal.job?.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-surface-500 mt-1">
                    <span>{proposal.job?.company?.user?.name}</span>
                    {proposal.job?.location && (
                      <span className="flex items-center gap-0.5"><MapPin size={11} />{proposal.job.location}</span>
                    )}
                    {proposal.proposedBudget && (
                      <span className="flex items-center gap-0.5"><DollarSign size={11} />R$ {Number(proposal.proposedBudget).toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    proposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                    proposal.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {proposal.status === 'ACCEPTED' ? 'Aceita' :
                     proposal.status === 'REJECTED' ? 'Recusada' : 'Aguardando'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Jobs Contratados */}
      {dashboard?.recentJobs && dashboard.recentJobs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6 dark:bg-gray-900 dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Jobs em Andamento / Concluidos</h2>
          <div className="space-y-4">
            {dashboard.recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-surface-50 rounded-lg dark:bg-gray-800">
                <div>
                  <h3 className="font-medium">{job.title}</h3>
                  <p className="text-sm text-surface-500">{job.company?.user?.name}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    job.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {job.status === 'COMPLETED' ? 'Concluido' :
                     job.status === 'IN_PROGRESS' ? 'Em andamento' : 'Cancelado'}
                  </span>
                  <p className="text-sm text-surface-600 mt-1">
                    R$ {Number(job.budget).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompanyDashboard({ dashboard }) {
  const { user } = useAuth();
  const stats = dashboard?.stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-surface-500">Gerencie suas vagas e profissionais.</p>
        </div>
        {!user?.isActive && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            <span>Assinatura inativa</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Briefcase size={20} />} label="Total de Vagas" value={stats.totalJobs || 0} />
        <StatCard icon={<Clock size={20} />} label="Vagas Abertas" value={stats.openJobs || 0} color="yellow" />
        <StatCard icon={<Users size={20} />} label="Em Andamento" value={stats.inProgressJobs || 0} color="blue" />
        <StatCard icon={<CheckCircle size={20} />} label="Concluidas" value={stats.completedJobs || 0} color="green" />
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6 dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Vagas Recentes</h2>
        {!dashboard?.recentJobs || dashboard.recentJobs.length === 0 ? (
          <p className="text-surface-500 text-center py-8">Nenhuma vaga criada ainda.</p>
        ) : (
          <div className="space-y-4">
            {dashboard.recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-surface-50 rounded-lg dark:bg-gray-800">
                <div>
                  <h3 className="font-medium">{job.title}</h3>
                  <p className="text-sm text-surface-500">{job.serviceType} - {job.location}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    job.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    job.status === 'OPEN' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {job.status === 'COMPLETED' ? 'Concluido' :
                     job.status === 'IN_PROGRESS' ? 'Em andamento' :
                     job.status === 'OPEN' ? 'Aberto' : 'Cancelado'}
                  </span>
                  <p className="text-sm text-surface-500 mt-1">
                    {job._count?.proposals || 0} candidato(s)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color = 'primary' }) {
  const colors = {
    primary: 'text-primary-500 bg-primary-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    green: 'text-green-600 bg-green-50',
    blue: 'text-blue-600 bg-blue-50',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-5 dark:bg-gray-900 dark:border-gray-800">
      <div className={`${colors[color]} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-surface-500">{label}</p>
    </div>
  );
}
