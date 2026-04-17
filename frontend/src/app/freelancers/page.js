'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import {
  Search, MapPin, Star, CalendarCheck, X, SlidersHorizontal,
  CheckCircle2, Clock, Loader2,
} from 'lucide-react';
import Link from 'next/link';

const SPECIALTIES = ['fotografia', 'video', 'drone', 'edicao', 'design'];

const SPECIALTY_LABELS = {
  fotografia: 'Fotografia',
  video: 'Vídeo',
  drone: 'Drone',
  edicao: 'Edição',
  design: 'Design',
};

// Retorna "YYYY-MM-DD" no fuso local (sem conversão UTC)
function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function today() {
  return toLocalDateString(new Date());
}

// ── Card de freelancer ────────────────────────────────────────
function FreelancerCard({ f }) {
  const displayAvail = f.available;

  return (
    <Link href={`/profile/${f.id}`} className="block group">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-primary-200 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-primary-700 transition-all duration-200">
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-500/20 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-primary-600 dark:text-primary-400 text-lg">
            {f.avatar
              ? <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
              : f.name?.charAt(0)?.toUpperCase() || '?'}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-500 transition-colors">
              {f.name}
            </h3>
            {f.location && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="flex-shrink-0" /> {f.location}
              </p>
            )}
          </div>

          {/* Badge disponibilidade */}
          <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            displayAvail
              ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
          }`}>
            {displayAvail
              ? <><CheckCircle2 size={9} /> Disponível</>
              : <><Clock size={9} /> Ocupado</>}
          </span>
        </div>

        {/* Descrição */}
        {f.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {f.description}
          </p>
        )}

        {/* Especialidades */}
        {f.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {f.specialties.slice(0, 3).map((s) => (
              <span key={s} className="px-2 py-0.5 bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 text-[10px] font-medium rounded-full">
                {SPECIALTY_LABELS[s] || s}
              </span>
            ))}
            {f.specialties.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 text-[10px] rounded-full">
                +{f.specialties.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: rating + valor */}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-800">
          {f.avgRating > 0 ? (
            <div className="flex items-center gap-1 text-xs">
              <Star size={12} className="text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">{f.avgRating.toFixed(1)}</span>
              <span className="text-gray-400">({f.reviewCount})</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300 dark:text-gray-600">Sem avaliações</span>
          )}
          {f.hourlyRate && (
            <span className="text-xs font-semibold text-primary-500">
              R$ {Number(f.hourlyRate).toFixed(0)}/h
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Skeletons ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 dark:bg-gray-900 dark:border-gray-800 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
        </div>
        <div className="w-16 h-5 bg-gray-100 dark:bg-gray-800 rounded-full" />
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-full" />
        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded-full" />
        <div className="h-4 w-14 bg-gray-100 dark:bg-gray-800 rounded-full" />
      </div>
      <div className="h-px bg-gray-100 dark:bg-gray-800 mb-2.5" />
      <div className="flex justify-between">
        <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="h-3 w-12 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
function FreelancersContent() {
  const searchParams = useSearchParams();
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    location: searchParams.get('location') || '',
    specialty: searchParams.get('specialty') || '',
    available: '',
    availableOn: '',
  });

  // Debounce no campo de busca para não disparar a cada letra
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 350);
    return () => clearTimeout(t);
  }, [filters.search]);

  const fetchFreelancers = useCallback(() => {
    setLoading(true);
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.location) params.location = filters.location;
    if (filters.specialty) params.specialty = filters.specialty;
    if (filters.available) params.available = filters.available;
    if (filters.availableOn) params.availableOn = filters.availableOn;

    api.get('/users/freelancers', { params })
      .then((res) => {
        setFreelancers(res.data.freelancers || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, filters.location, filters.specialty, filters.available, filters.availableOn]);

  useEffect(() => { fetchFreelancers(); }, [fetchFreelancers]);

  const set = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const activeFilterCount = [
    filters.location,
    filters.specialty,
    filters.available,
    filters.availableOn,
  ].filter(Boolean).length;

  const clearAll = () => setFilters({ search: '', location: '', specialty: '', available: '', availableOn: '' });

  const inputClass = 'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 dark:text-gray-200 placeholder-gray-400 transition-colors';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Freelancers</h1>
          {!loading && (
            <p className="text-xs text-gray-400 mt-0.5">{total} profissional{total !== 1 ? 'is' : ''} encontrado{total !== 1 ? 's' : ''}</p>
          )}
        </div>
        {/* Botão de filtros (mobile) */}
        <button
          onClick={() => setShowFilters((p) => !p)}
          className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
            activeFilterCount > 0
              ? 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-700'
              : 'bg-white text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filtros
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Barra de busca ───────────────────────────────────── */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nome, especialidade ou skill..."
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-primary-500 text-gray-800 dark:text-gray-200 placeholder-gray-400 transition-colors"
        />
        {filters.search && (
          <button onClick={() => set('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Painel de filtros ─────────────────────────────────── */}
      {/* Desktop: sempre visível | Mobile: toggle */}
      <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Localização */}
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cidade, Estado..."
                value={filters.location}
                onChange={(e) => set('location', e.target.value)}
                className={`${inputClass} pl-8`}
              />
            </div>

            {/* Especialidade */}
            <select
              value={filters.specialty}
              onChange={(e) => set('specialty', e.target.value)}
              className={inputClass}
            >
              <option value="">Todas as especialidades</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{SPECIALTY_LABELS[s]}</option>
              ))}
            </select>

            {/* Disponibilidade geral */}
            <select
              value={filters.available}
              onChange={(e) => set('available', e.target.value)}
              className={inputClass}
            >
              <option value="">Todos</option>
              <option value="true">Disponíveis agora</option>
              <option value="false">Indisponíveis</option>
            </select>

            {/* ── Filtro por data de disponibilidade (Agenda) ── */}
            <div className="relative">
              <CalendarCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={filters.availableOn}
                min={today()}
                onChange={(e) => set('availableOn', e.target.value)}
                className={`${inputClass} pl-8 ${filters.availableOn ? 'text-primary-600 dark:text-primary-400 font-medium' : ''}`}
                title="Ver quem está livre nesta data"
              />
              {filters.availableOn && (
                <button
                  onClick={() => set('availableOn', '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Info sobre o filtro de data */}
          {filters.availableOn && (
            <div className="mt-3 flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/40 rounded-lg px-3 py-2">
              <CalendarCheck size={13} />
              Exibindo apenas freelancers livres em{' '}
              <strong>
                {new Date(filters.availableOn + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long', day: '2-digit', month: 'long',
                })}
              </strong>
            </div>
          )}

          {/* Limpar filtros */}
          {activeFilterCount > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={clearAll}
                className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <X size={12} /> Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Grade de resultados ───────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : freelancers.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum freelancer encontrado</p>
          <p className="text-sm text-gray-400 mt-1">
            {filters.availableOn
              ? 'Tente outra data ou remova o filtro de disponibilidade'
              : 'Tente ajustar os filtros de busca'}
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="mt-4 text-sm text-primary-500 hover:underline">
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {freelancers.map((f) => <FreelancerCard key={f.id} f={f} />)}
        </div>
      )}
    </div>
  );
}

export default function FreelancersPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-10 text-gray-400 text-center">Carregando...</div>}>
      <FreelancersContent />
    </Suspense>
  );
}
