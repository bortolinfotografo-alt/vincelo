// ============================================================
// PROFILE PAGE
// Perfil editavel do usuario logado + Agenda com calendario
// ============================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, X, Loader2 } from 'lucide-react';
import ImageCropper from '@/components/ui/ImageCropper';

// ── Calendário de disponibilidade ────────────────────────────
function AvailabilityCalendar({ freelancerId, generalAvailable, onToggleGeneral, onSyncUser }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [unavailableMap, setUnavailableMap] = useState({}); // "YYYY-MM-DD" → id
  const [toggling, setToggling] = useState(null); // date string being toggled
  const [togglingGeneral, setTogglingGeneral] = useState(false);
  const [reasonModal, setReasonModal] = useState(null); // date string to add reason to

  const toKey = (d) => {
    const dd = new Date(d);
    const y = dd.getFullYear();
    const m = String(dd.getMonth() + 1).padStart(2, '0');
    const day = String(dd.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const fetchAvailability = useCallback(() => {
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    api.get(`/schedule/availability/${freelancerId}?startDate=${startDate}&endDate=${endDate}`)
      .then((res) => {
        const map = {};
        (res.data.unavailableDates || []).forEach((d) => { map[toKey(d.date)] = d.id; });
        setUnavailableMap(map);
        // Sincroniza com o valor real do banco (corrige estado obsoleto do contexto)
        if (res.data.available !== undefined) onToggleGeneral(res.data.available);
      })
      .catch(() => {});
  }, [freelancerId, year, month, onToggleGeneral]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  const handleDayClick = async (dateKey) => {
    if (toggling) return;
    setToggling(dateKey);
    try {
      if (unavailableMap[dateKey]) {
        await api.delete(`/schedule/unavailable/${unavailableMap[dateKey]}`);
        setUnavailableMap((prev) => { const n = { ...prev }; delete n[dateKey]; return n; });
        toast.success('Dia liberado');
      } else {
        const res = await api.post('/schedule/unavailable', { date: dateKey });
        setUnavailableMap((prev) => ({ ...prev, [dateKey]: res.data.unavailability.id }));
        toast.success('Dia marcado como indisponível');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar');
    } finally {
      setToggling(null);
    }
  };

  const handleToggleGeneral = async () => {
    const newValue = !generalAvailable;
    onToggleGeneral(newValue);   // atualiza UI imediatamente (otimista)
    onSyncUser(newValue);        // sincroniza contexto de auth imediatamente
    setTogglingGeneral(true);
    try {
      const res = await api.put('/schedule/availability', { available: newValue });
      onToggleGeneral(res.data.available);
      onSyncUser(res.data.available);
      toast.success(res.data.available ? 'Disponibilidade ativada' : 'Disponibilidade desativada');
    } catch {
      onToggleGeneral(!newValue);  // reverte em caso de erro
      onSyncUser(!newValue);
      toast.error('Erro ao atualizar disponibilidade');
    } finally {
      setTogglingGeneral(false);
    }
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toKey(today);

  const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const unavailableCount = Object.keys(unavailableMap).length;

  return (
    <div className="space-y-6">
      {/* Status geral */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Disponibilidade Geral</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {generalAvailable ? 'Você aparece como disponível para contratação' : 'Você está pausando novos projetos'}
          </p>
        </div>
        <button
          onClick={handleToggleGeneral}
          disabled={togglingGeneral}
          className="flex-shrink-0"
        >
          {togglingGeneral ? (
            <Loader2 size={28} className="animate-spin text-primary-500" />
          ) : generalAvailable ? (
            <ToggleRight size={32} className="text-primary-500" />
          ) : (
            <ToggleLeft size={32} className="text-gray-400" />
          )}
        </button>
      </div>

      {/* Calendário */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {/* Nav do mês */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Grade */}
        <div className="p-4">
          {/* Cabeçalho dias da semana */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Dias */}
          <div className="grid grid-cols-7 gap-1">
            {/* Espaços vazios antes do dia 1 */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}

            {/* Dias do mês */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const dateKey = toKey(date);
              const isUnavailable = !!unavailableMap[dateKey];
              const isToday = dateKey === todayKey;
              const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const isLoading = toggling === dateKey;

              return (
                <button
                  key={day}
                  onClick={() => !isPast && handleDayClick(dateKey)}
                  disabled={isPast || !!toggling}
                  className={`
                    relative aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all
                    ${isPast
                      ? 'text-gray-300 dark:text-gray-700 cursor-default'
                      : isUnavailable
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                        : isToday
                          ? 'bg-primary-500 text-white hover:bg-primary-600'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }
                  `}
                  title={isPast ? '' : isUnavailable ? 'Clique para liberar' : 'Clique para marcar indisponível'}
                >
                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : day}
                  {isToday && !isUnavailable && (
                    <span className="sr-only">Hoje</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 px-4 pb-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-primary-500 flex-shrink-0" /> Hoje
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-100 dark:bg-red-900/30 flex-shrink-0" /> Indisponível
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700 flex-shrink-0" /> Disponível
          </span>
        </div>
      </div>

      {/* Resumo datas */}
      <p className="text-xs text-gray-400 text-center">
        {unavailableCount === 0
          ? 'Nenhum dia bloqueado neste mês. Clique em um dia para marcar como indisponível.'
          : `${unavailableCount} dia${unavailableCount > 1 ? 's' : ''} bloqueado${unavailableCount > 1 ? 's' : ''} neste mês.`}
      </p>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function ProfilePage() {
  const { user, setUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [generalAvailable, setGeneralAvailable] = useState(false);
  const [avatarCropSrc, setAvatarCropSrc] = useState(null);
  const avatarInputRef = useRef(null);

  // Atualiza o contexto de auth para manter available sincronizado
  const syncAvailableInUser = useCallback((available) => {
    setUser((prev) => {
      if (!prev || !prev.freelancer) return prev;
      return { ...prev, freelancer: { ...prev.freelancer, available } };
    });
  }, [setUser]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    description: '',
    location: '',
    specialties: [],
    skills: '',
    hourlyRate: '',
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        description: user.description || '',
        location: user.freelancer?.location || '',
        specialties: user.freelancer?.specialties || [],
        skills: user.freelancer?.skills?.join(', ') || '',
        hourlyRate: user.freelancer?.hourlyRate || '',
      });
      // Inicializa o toggle com o valor do contexto (já sincronizado por syncAvailableInUser)
      setGeneralAvailable(user.freelancer?.available ?? false);
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const profileData = {};
    if (user.role === 'FREELANCER') {
      profileData.location = formData.location;
      profileData.specialties = formData.specialties;
      profileData.skills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      profileData.hourlyRate = formData.hourlyRate ? Number(formData.hourlyRate) : undefined;
    }

    try {
      const res = await api.put('/users/profile', {
        name: formData.name,
        phone: formData.phone,
        description: formData.description,
        profileData,
      });
      if (res.data.user) setUser(res.data.user);
      toast.success('Perfil atualizado!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar');
    } finally {
      setLoading(false);
    }
  };

  // Etapa 1: abre seletor, leva para o cropper
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarCropSrc(URL.createObjectURL(file));
    if (e.target) e.target.value = '';
  };

  // Etapa 2: recebe o blob recortado, faz upload
  const handleAvatarCropDone = async (blob) => {
    setAvatarCropSrc(null);
    const data = new FormData();
    data.append('avatar', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
    try {
      const res = await api.put('/users/profile', data);
      if (res.data.user) setUser(res.data.user);
      toast.success('Avatar atualizado!');
    } catch {
      toast.error('Erro ao enviar avatar');
    }
  };

  const SPECIALTIES = ['fotografia', 'video', 'drone', 'edicao', 'design'];
  const toggleSpecialty = (spec) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter(s => s !== spec)
        : [...prev.specialties, spec],
    }));
  };

  if (!user) return null;

  return (
    <>
    {avatarCropSrc && (
      <ImageCropper
        imageSrc={avatarCropSrc}
        aspect={1}
        circular
        title="Recortar foto de perfil"
        onDone={handleAvatarCropDone}
        onCancel={() => setAvatarCropSrc(null)}
      />
    )}
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Meu Perfil</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setTab('info')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            tab === 'info'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Informações
        </button>
        {user.role === 'FREELANCER' && (
          <button
            onClick={() => setTab('schedule')}
            className={`pb-2 px-1 text-sm font-medium transition-colors ${
              tab === 'schedule'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Agenda
          </button>
        )}
      </div>

      {/* Info Tab */}
      {tab === 'info' && (
        <form onSubmit={handleUpdate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5 dark:bg-gray-900 dark:border-gray-800">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                user.name?.charAt(0) || '?'
              )}
            </div>
            <div>
              <label className="btn-secondary text-sm cursor-pointer">
                <Upload size={14} className="inline mr-1" />
                Alterar Avatar
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="label">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input type="email" value={user.email} className="input-field bg-gray-50 dark:bg-gray-800" disabled />
          </div>

          <div>
            <label className="label">Telefone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="input-field"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="label">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input-field"
              rows={3}
              placeholder="Fale sobre você..."
            />
          </div>

          {user.role === 'FREELANCER' && (
            <>
              <div>
                <label className="label">Localização</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="input-field"
                  placeholder="São Paulo, SP"
                />
              </div>

              <div>
                <label className="label">Especialidades</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        formData.specialties.includes(s)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Skills (separadas por vírgula)</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  className="input-field"
                  placeholder="Photoshop, Premiere, DaVinci..."
                />
              </div>

              <div>
                <label className="label">Valor/Hora (R$)</label>
                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  className="input-field"
                  placeholder="50.00"
                  step="0.01"
                />
              </div>
            </>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      )}

      {/* Schedule Tab */}
      {tab === 'schedule' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">Minha Agenda</h2>
            <p className="text-xs text-gray-400 mt-1">
              Clique nos dias do calendário para marcar quando você está indisponível para novos projetos.
            </p>
          </div>
          <AvailabilityCalendar
            freelancerId={user.freelancer?.id}
            generalAvailable={generalAvailable}
            onToggleGeneral={setGeneralAvailable}
            onSyncUser={syncAvailableInUser}
          />
        </div>
      )}
    </div>
    </>
  );
}
