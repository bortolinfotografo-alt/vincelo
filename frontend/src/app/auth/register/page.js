'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/app/auth-context';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { User, Building2, Eye, EyeOff, Loader2, ChevronLeft } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const initialRole = searchParams.get('role') === 'COMPANY' ? 'COMPANY' : 'FREELANCER';
  const [role, setRole] = useState(initialRole);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    location: '', companyName: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return toast.error('As senhas não coincidem');
    if (formData.password.length < 6) return toast.error('A senha deve ter pelo menos 6 caracteres');

    setLoading(true);
    const profileData = role === 'FREELANCER'
      ? { location: formData.location || '' }
      : { companyName: formData.companyName || formData.name };

    try {
      await register({ name: formData.name, email: formData.email, password: formData.password, role, profileData });
      toast.success('Conta criada com sucesso!');
      router.push('/feed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-colors";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-white">

      {/* Logo + back */}
      <div className="w-full max-w-sm mb-6 flex items-center">
        <Link href="/auth/login" className="p-2 -ml-2 text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shadow-md shadow-orange-100 mb-2">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M6 9L16 25L26 9" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-base font-black text-gray-900 tracking-tight">Vin<span className="text-orange-500">celo</span></p>
        </div>
        <div className="w-10" /> {/* espaçador */}
      </div>

      <div className="w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Criar conta</h2>
        <p className="text-sm text-gray-400 mb-5">Junte-se à rede do audiovisual</p>

        {/* Seleção de perfil */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { value: 'FREELANCER', label: 'Freelancer', icon: <User size={18} />, desc: 'Fotógrafo, videomaker...' },
            { value: 'COMPANY', label: 'Empresa', icon: <Building2 size={18} />, desc: 'Contratante, produtora...' },
          ].map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                role === r.value
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className={`mb-1.5 ${role === r.value ? 'text-orange-500' : 'text-gray-400'}`}>{r.icon}</div>
              <p className={`text-sm font-bold ${role === r.value ? 'text-orange-600' : 'text-gray-700'}`}>{r.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{r.desc}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {role === 'COMPANY' ? 'Nome do responsável' : 'Seu nome completo'}
            </label>
            <input type="text" name="name" value={formData.name} onChange={handleChange}
              placeholder={role === 'COMPANY' ? 'João Silva' : 'Maria Santos'}
              required className={inputClass} autoComplete="name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              placeholder="seu@email.com" required className={inputClass} autoComplete="email" />
          </div>

          {role === 'FREELANCER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade (opcional)</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange}
                placeholder="São Paulo, SP" className={inputClass} />
            </div>
          )}

          {role === 'COMPANY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da empresa (opcional)</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange}
                placeholder="Produtora XYZ" className={inputClass} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} name="password" value={formData.password}
                onChange={handleChange} placeholder="Mínimo 6 caracteres"
                required className={`${inputClass} pr-11`} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPw((p) => !p)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar senha</label>
            <div className="relative">
              <input type={showConfirmPw ? 'text' : 'password'} name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange}
                placeholder="Repita a senha" required className={`${inputClass} pr-11`} autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirmPw((p) => !p)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed pt-1">
            Ao criar sua conta, você concorda com os{' '}
            <Link href="/termos" className="text-orange-500 hover:underline">Termos de Uso</Link> e{' '}
            <Link href="/privacidade" className="text-orange-500 hover:underline">Política de Privacidade</Link>.
          </p>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold text-sm py-3.5 rounded-xl transition-colors">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Criando conta...</> : 'Criar minha conta'}
          </button>

          {/* Login com Google */}
          <div className="mt-4">
            <a
              href="/api/google-auth/google"
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm py-3 rounded-xl transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.64 12 18.64C9.14 18.64 6.71 16.69 5.84 14.09H2.18V16.96C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
                <path d="M5.84 14.09C5.62 13.37 5.49 12.62 5.49 11.85C5.49 11.08 5.62 10.33 5.84 9.61V6.74H2.18C1.43 8.24 1 9.96 1 11.85C1 13.74 1.43 15.46 2.18 16.96L5.84 14.09Z" fill="#FBBC05"/>
                <path d="M12 5.36C13.62 5.36 15.06 5.93 16.21 7.03L19.36 3.88C17.45 2.07 14.97 1 12 1C7.7 1 3.99 3.47 2.18 6.74L5.84 9.61C6.71 6.92 9.14 5.36 12 5.36Z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </a>
          </div>
        </form>

        <p className="text-center text-sm text-gray-400 mt-5">
          Já tem conta?{' '}
          <Link href="/auth/login" className="text-orange-500 font-semibold hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-orange-500" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
