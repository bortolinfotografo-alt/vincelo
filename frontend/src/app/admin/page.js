'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/auth-context';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
  Shield, Users, FileText, Activity, Search, Ban, CheckCircle,
  ChevronLeft, ChevronRight, RefreshCw, Trash2,
} from 'lucide-react';

const ROLE_LEVELS = { USER: 0, MODERATOR: 1, ADMIN: 2, OWNER: 3 };

const ROLE_COLORS = {
  USER: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  MODERATOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  OWNER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const USER_ROLE_COLORS = {
  FREELANCER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  COMPANY: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
};

function Badge({ label, colorCls }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorCls}`}>{label}</span>
  );
}

function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center gap-2 justify-center mt-4">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)}
        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-gray-500">{page} / {pages}</span>
      <button disabled={page >= pages} onClick={() => onPage(page + 1)}
        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Stats Tab ──────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => toast.error('Erro ao carregar stats'));
  }, []);

  if (!stats) return <div className="p-8 text-center text-gray-400">Carregando...</div>;

  const cards = [
    { label: 'Usuários', value: stats.totalUsers },
    { label: 'Ativos', value: stats.activeUsers },
    { label: 'Banidos', value: stats.bannedUsers },
    { label: 'Posts', value: stats.totalPosts },
    { label: 'Stories', value: stats.totalStories },
    { label: 'Vagas', value: stats.totalJobs },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ações Recentes</h3>
        <div className="space-y-2">
          {stats.recentLogs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800">
              {log.admin.avatar
                ? <img src={log.admin.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                : <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 text-xs font-bold flex-shrink-0">{log.admin.name.charAt(0)}</div>}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{log.admin.name}</p>
                <p className="text-xs text-gray-500">{log.action}</p>
              </div>
              <span className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────
const QUICK_FILTERS = [
  { label: 'Todos', role: null, adminRole: null },
  { label: 'Freelancers', role: 'FREELANCER', adminRole: null },
  { label: 'Empresas', role: 'COMPANY', adminRole: null },
  { label: 'Admins', role: null, adminRole: '__any_admin__' },
];

function UsersTab({ myAdminRole }) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [changingRole, setChangingRole] = useState(null);

  const fetch = useCallback(async (p = 1, q = search, filterIdx = activeFilter) => {
    setLoading(true);
    try {
      const f = QUICK_FILTERS[filterIdx];
      const params = { page: p, limit: 20 };
      if (q) params.search = q;
      if (f.role) params.role = f.role;
      if (f.adminRole === '__any_admin__') params.adminRole = 'MODERATOR,ADMIN,OWNER';
      const r = await api.get('/admin/users', { params });
      setUsers(r.data.users);
      setTotal(r.data.total);
      setPages(r.data.pages);
      setPage(p);
    } catch { toast.error('Erro ao carregar usuários'); }
    finally { setLoading(false); }
  }, [search, activeFilter]);

  useEffect(() => { fetch(1, '', 0); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetch(1, search, activeFilter);
  };

  const handleFilter = (idx) => {
    setActiveFilter(idx);
    fetch(1, search, idx);
  };

  const handleToggleActive = async (user) => {
    try {
      const r = await api.patch(`/admin/users/${user.id}/toggle-active`);
      toast.success(r.data.message);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: r.data.isActive } : u));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  const handleRoleChange = async (user, newRole) => {
    setChangingRole(null);
    try {
      await api.patch(`/admin/users/${user.id}/admin-role`, { adminRole: newRole });
      toast.success('Role atualizado');
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, adminRole: newRole } : u));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro');
    }
  };

  const myLevel = ROLE_LEVELS[myAdminRole] ?? 0;
  const availableRoles = Object.keys(ROLE_LEVELS).filter((r) => ROLE_LEVELS[r] < myLevel);

  return (
    <div className="space-y-4">
      {/* Quick filters */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_FILTERS.map((f, idx) => (
          <button key={idx} onClick={() => handleFilter(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              activeFilter === idx
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-purple-400'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors">Buscar</button>
      </form>

      <p className="text-xs text-gray-400">{total} {QUICK_FILTERS[activeFilter].label.toLowerCase()} encontrados</p>

      {loading ? (
        <div className="py-8 text-center text-gray-400">Carregando...</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const targetLevel = ROLE_LEVELS[u.adminRole] ?? 0;
            const canModify = targetLevel < myLevel;
            return (
              <div key={u.id} className={`bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 ${!u.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3">
                  {u.avatar
                    ? <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 text-sm font-bold flex-shrink-0">{u.name.charAt(0)}</div>}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.name}</span>
                      <Badge label={u.adminRole} colorCls={ROLE_COLORS[u.adminRole]} />
                      <Badge label={u.role} colorCls={USER_ROLE_COLORS[u.role]} />
                      {!u.isActive && <Badge label="BANIDO" colorCls="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" />}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>

                  {canModify && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Role selector */}
                      {availableRoles.length > 0 && (
                        <div className="relative">
                          {changingRole === u.id ? (
                            <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-10 min-w-[130px]">
                              {availableRoles.map((r) => (
                                <button key={r} onClick={() => handleRoleChange(u, r)}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                                  {r}
                                </button>
                              ))}
                              <button onClick={() => setChangingRole(null)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400">
                                Cancelar
                              </button>
                            </div>
                          ) : null}
                          <button onClick={() => setChangingRole(changingRole === u.id ? null : u.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Alterar role">
                            <Shield size={15} className="text-purple-500" />
                          </button>
                        </div>
                      )}

                      {/* Ban/Unban */}
                      <button onClick={() => handleToggleActive(u)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title={u.isActive ? 'Banir usuário' : 'Desbanir usuário'}>
                        {u.isActive
                          ? <Ban size={15} className="text-red-400" />
                          : <CheckCircle size={15} className="text-green-500" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} onPage={(p) => fetch(p)} />
    </div>
  );
}

// ── Audit Logs Tab ─────────────────────────────────────────────
function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const r = await api.get('/admin/audit-logs', { params: { page: p, limit: 30 } });
      setLogs(r.data.logs);
      setPages(r.data.pages);
      setPage(p);
    } catch { toast.error('Erro ao carregar logs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(1); }, []);

  const ACTION_LABELS = {
    BAN_USER: '🚫 Banir usuário',
    UNBAN_USER: '✅ Desbanir usuário',
    UPDATE_ADMIN_ROLE: '🛡️ Alterar role',
    DELETE_POST: '🗑️ Remover post',
    DELETE_STORY: '🗑️ Remover story',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Histórico de Ações</p>
        <button onClick={() => fetch(1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <RefreshCw size={14} className="text-gray-400" />
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400">Carregando...</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800">
              <div className="flex items-start gap-3">
                {log.admin.avatar
                  ? <img src={log.admin.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                  : <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 text-xs font-bold flex-shrink-0 mt-0.5">{log.admin.name.charAt(0)}</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{log.admin.name}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{ACTION_LABELS[log.action] || log.action}</p>
                  {log.details && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {log.details.from && log.details.to ? `${log.details.from} → ${log.details.to}` : null}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} onPage={fetch} />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('stats');

  useEffect(() => {
    if (!authLoading && (!user || !['MODERATOR', 'ADMIN', 'OWNER'].includes(user.adminRole))) {
      router.replace('/feed');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;
  if (!['MODERATOR', 'ADMIN', 'OWNER'].includes(user.adminRole)) return null;

  const tabs = [
    { id: 'stats', label: 'Visão Geral', icon: Activity },
    { id: 'users', label: 'Usuários', icon: Users },
    ...(ROLE_LEVELS[user.adminRole] >= 2 ? [{ id: 'logs', label: 'Logs', icon: FileText }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-purple-500" />
            <h1 className="text-base font-bold text-gray-900 dark:text-white">Painel Admin</h1>
            <Badge label={user.adminRole} colorCls={ROLE_COLORS[user.adminRole]} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tab === id
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}>
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {tab === 'stats' && <StatsTab />}
        {tab === 'users' && <UsersTab myAdminRole={user.adminRole} />}
        {tab === 'logs' && <LogsTab />}
      </div>
    </div>
  );
}
