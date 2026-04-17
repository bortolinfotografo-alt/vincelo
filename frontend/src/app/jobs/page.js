// ============================================================
// JOBS PAGE
// Lista vagas disponiveis com formulario de criacao para empresas
// Inclui validacao inline e data minima (hoje)
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/app/auth-context';
import { Search, MapPin, Calendar, DollarSign, Plus, Briefcase, AlertCircle, X, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const SERVICE_TYPES = ['fotografia', 'video', 'drone', 'edicao', 'design', 'evento'];

// Data minima = hoje no formato YYYY-MM-DD
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

const INITIAL_FORM = {
  title: '',
  description: '',
  serviceType: '',
  location: '',
  jobDate: '',
  jobTime: '',
  budget: '',
};

function validateForm(data) {
  const errors = {};
  if (!data.title.trim()) errors.title = 'Titulo e obrigatorio';
  else if (data.title.trim().length < 5) errors.title = 'Titulo muito curto (minimo 5 caracteres)';

  if (!data.description.trim()) errors.description = 'Descricao e obrigatoria';
  else if (data.description.trim().length < 20) errors.description = 'Descricao muito curta (minimo 20 caracteres)';

  if (!data.serviceType) errors.serviceType = 'Tipo de servico e obrigatorio';

  if (!data.location.trim()) errors.location = 'Local e obrigatorio';

  if (!data.jobDate) errors.jobDate = 'Data e obrigatoria';
  else if (data.jobDate < getTodayString()) errors.jobDate = 'A data deve ser hoje ou no futuro';

  if (!data.budget) errors.budget = 'Orcamento e obrigatorio';
  else if (Number(data.budget) <= 0) errors.budget = 'Orcamento deve ser maior que zero';

  return errors;
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
      <AlertCircle size={12} />
      {message}
    </p>
  );
}

const INITIAL_APPLY = { coverLetter: '', proposedBudget: '' };

export default function JobsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({ search: '', serviceType: '', location: '' });
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  // Apply modal state
  const [applyModal, setApplyModal] = useState(null); // job object or null
  const [applyForm, setApplyForm] = useState(INITIAL_APPLY);
  const [applyErrors, setApplyErrors] = useState({});
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  useEffect(() => {
    fetchJobs();
  }, [filters, pagination.page]);

  // Load user's existing proposals to know which jobs they already applied to
  useEffect(() => {
    if (user?.role === 'FREELANCER') {
      api.get('/proposals/my')
        .then((res) => {
          const ids = new Set((res.data.proposals || []).map((p) => p.jobId));
          setAppliedJobIds(ids);
        })
        .catch(() => {});
    }
  }, [user]);

  function fetchJobs() {
    setLoading(true);
    api.get('/jobs', { params: { ...filters, page: pagination.page, limit: 20 } })
      .then((res) => {
        setJobs(res.data.jobs || []);
        setPagination((prev) => ({ ...prev, totalPages: res.data.totalPages || 1 }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpa erro do campo ao editar
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/jobs', { ...formData, budget: Number(formData.budget) });
      toast.success('Vaga criada com sucesso!');
      setShowCreateForm(false);
      setFormData(INITIAL_FORM);
      setFormErrors({});
      fetchJobs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao criar vaga');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setFormData(INITIAL_FORM);
    setFormErrors({});
  };

  const openApplyModal = (job) => {
    setApplyModal(job);
    setApplyForm(INITIAL_APPLY);
    setApplyErrors({});
  };

  const closeApplyModal = () => {
    setApplyModal(null);
    setApplyForm(INITIAL_APPLY);
    setApplyErrors({});
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!applyForm.coverLetter.trim()) errors.coverLetter = 'Carta de apresentacao e obrigatoria';
    else if (applyForm.coverLetter.trim().length < 30) errors.coverLetter = 'Minimo 30 caracteres';
    if (applyForm.proposedBudget && Number(applyForm.proposedBudget) <= 0)
      errors.proposedBudget = 'Valor deve ser maior que zero';

    if (Object.keys(errors).length > 0) {
      setApplyErrors(errors);
      return;
    }

    setApplySubmitting(true);
    try {
      await api.post('/proposals', {
        jobId: applyModal.id,
        coverLetter: applyForm.coverLetter.trim(),
        proposedBudget: applyForm.proposedBudget ? Number(applyForm.proposedBudget) : undefined,
      });
      toast.success('Candidatura enviada com sucesso!');
      setAppliedJobIds((prev) => new Set([...prev, applyModal.id]));
      closeApplyModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao enviar candidatura');
    } finally {
      setApplySubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vagas Disponiveis</h1>

        {user?.role === 'COMPANY' && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Criar Vaga
          </button>
        )}
      </div>

      {/* Formulario de criacao de vaga */}
      {showCreateForm && (
        <form onSubmit={handleCreateJob} className="bg-white rounded-xl shadow-sm border border-surface-200 p-6 mb-6 dark:bg-gray-900 dark:border-gray-800" noValidate>
          <h2 className="text-lg font-semibold mb-4">Nova Vaga</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Titulo da Vaga *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`input-field ${formErrors.title ? 'border-red-400' : ''}`}
                placeholder="Ex: Fotografo para evento corporativo"
              />
              <FieldError message={formErrors.title} />
            </div>

            <div className="md:col-span-2">
              <label className="label">Descricao *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`input-field ${formErrors.description ? 'border-red-400' : ''}`}
                rows={3}
                placeholder="Descreva o servico necessario (minimo 20 caracteres)"
              />
              <div className="flex justify-between">
                <FieldError message={formErrors.description} />
                <span className="text-xs text-surface-400 mt-1">{formData.description.length} caracteres</span>
              </div>
            </div>

            <div>
              <label className="label">Tipo de Servico *</label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                className={`input-field ${formErrors.serviceType ? 'border-red-400' : ''}`}
              >
                <option value="">Selecione...</option>
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <FieldError message={formErrors.serviceType} />
            </div>

            <div>
              <label className="label">Local *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`input-field ${formErrors.location ? 'border-red-400' : ''}`}
                placeholder="Sao Paulo, SP"
              />
              <FieldError message={formErrors.location} />
            </div>

            <div>
              <label className="label">Data *</label>
              <input
                type="date"
                name="jobDate"
                value={formData.jobDate}
                onChange={handleInputChange}
                className={`input-field ${formErrors.jobDate ? 'border-red-400' : ''}`}
                min={getTodayString()}
              />
              <FieldError message={formErrors.jobDate} />
            </div>

            <div>
              <label className="label">Horario</label>
              <input
                type="time"
                name="jobTime"
                value={formData.jobTime}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Orcamento (R$) *</label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                className={`input-field ${formErrors.budget ? 'border-red-400' : ''}`}
                placeholder="500.00"
                step="0.01"
                min="0.01"
              />
              <FieldError message={formErrors.budget} />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={handleCancelForm} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Criando...' : 'Criar Vaga'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-4 mb-6 dark:bg-gray-900 dark:border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
            <input
              type="text"
              placeholder="Buscar vagas..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={filters.serviceType}
            onChange={(e) => handleFilterChange('serviceType', e.target.value)}
            className="input-field"
          >
            <option value="">Todos os tipos</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
            <input
              type="text"
              placeholder="Localizacao..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      {/* Lista de Jobs */}
      {loading ? (
        <div className="flex justify-center py-20 text-surface-500">Carregando...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 text-surface-500">Nenhuma vaga encontrada.</div>
      ) : (
        <>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl shadow-sm border border-surface-200 p-5 hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-800"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                        job.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700' :
                        job.status === 'COMPLETED' ? 'bg-surface-100 text-surface-600' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {job.status === 'OPEN' ? 'Aberta' :
                         job.status === 'IN_PROGRESS' ? 'Preenchida' :
                         job.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                      </span>
                    </div>

                    <p className="text-surface-500 text-sm mb-3 line-clamp-2">{job.description}</p>

                    <div className="flex flex-wrap gap-3 text-sm text-surface-500">
                      <span className="flex items-center gap-1"><Briefcase size={14} /> {job.serviceType}</span>
                      <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                      {job.jobDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(job.jobDate).toLocaleDateString('pt-BR')}
                          {job.jobTime && ` as ${job.jobTime}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-lg font-semibold text-primary-600 justify-end">
                      <DollarSign size={20} />
                      R$ {Number(job.budget).toFixed(2)}
                    </div>
                    {job._count?.proposals > 0 && (
                      <p className="text-xs text-surface-500">{job._count.proposals} candidato(s)</p>
                    )}
                    <p className="text-xs text-surface-400 mt-1">{job.company?.user?.name}</p>
                    {user?.role === 'FREELANCER' && job.status === 'OPEN' && (
                      <div className="mt-3">
                        {appliedJobIds.has(job.id) ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                            ✓ Candidatura enviada
                          </span>
                        ) : (
                          <button
                            onClick={() => openApplyModal(job)}
                            className="btn-primary text-sm py-1.5 px-4 flex items-center gap-1.5"
                          >
                            <FileText size={14} />
                            Candidatar-se
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginacao */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-secondary disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-surface-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn-secondary disabled:opacity-40"
              >
                Proxima
              </button>
            </div>
          )}
        </>
      )}
      {/* Apply Modal */}
      {applyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg dark:bg-gray-900">
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold">Candidatar-se</h2>
                <p className="text-sm text-surface-500 mt-0.5 line-clamp-1">{applyModal.title}</p>
              </div>
              <button onClick={closeApplyModal} className="text-surface-400 hover:text-surface-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4" noValidate>
              <div className="bg-surface-50 rounded-lg p-3 text-sm text-surface-600 flex gap-3 dark:bg-gray-800 dark:text-gray-400">
                <div className="flex items-center gap-1"><DollarSign size={14} /> R$ {Number(applyModal.budget).toFixed(2)}</div>
                <div className="flex items-center gap-1"><MapPin size={14} /> {applyModal.location}</div>
              </div>

              <div>
                <label className="label">Carta de Apresentacao *</label>
                <textarea
                  value={applyForm.coverLetter}
                  onChange={(e) => {
                    setApplyForm((prev) => ({ ...prev, coverLetter: e.target.value }));
                    if (applyErrors.coverLetter) setApplyErrors((prev) => ({ ...prev, coverLetter: undefined }));
                  }}
                  className={`input-field ${applyErrors.coverLetter ? 'border-red-400' : ''}`}
                  rows={5}
                  placeholder="Descreva sua experiencia, por que voce e a pessoa certa para esta vaga e como pode ajudar o cliente (minimo 30 caracteres)"
                />
                <div className="flex justify-between">
                  <FieldError message={applyErrors.coverLetter} />
                  <span className="text-xs text-surface-400 mt-1">{applyForm.coverLetter.length} caracteres</span>
                </div>
              </div>

              <div>
                <label className="label">Valor Proposto (R$) <span className="text-surface-400 font-normal">— opcional</span></label>
                <input
                  type="number"
                  value={applyForm.proposedBudget}
                  onChange={(e) => {
                    setApplyForm((prev) => ({ ...prev, proposedBudget: e.target.value }));
                    if (applyErrors.proposedBudget) setApplyErrors((prev) => ({ ...prev, proposedBudget: undefined }));
                  }}
                  className={`input-field ${applyErrors.proposedBudget ? 'border-red-400' : ''}`}
                  placeholder={`Orcamento da vaga: R$ ${Number(applyModal.budget).toFixed(2)}`}
                  step="0.01"
                  min="0.01"
                />
                <FieldError message={applyErrors.proposedBudget} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeApplyModal} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary" disabled={applySubmitting}>
                  {applySubmitting ? 'Enviando...' : 'Enviar Candidatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
