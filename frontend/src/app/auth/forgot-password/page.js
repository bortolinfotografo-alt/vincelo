// ============================================================
// FORGOT PASSWORD PAGE
// Fluxo de recuperacao de senha via email
// Em dev: token aparece no console do backend (sem email configurado)
// ============================================================

'use client';

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Camera, ArrowLeft, Mail, Key, Eye, EyeOff } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState('email'); // email | token | success
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = () => {
    if (!email) return 'Email e obrigatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email invalido';
    return null;
  };

  const validatePassword = () => {
    const errs = {};
    if (!resetToken) errs.resetToken = 'Token de reset e obrigatorio';
    if (!newPassword) errs.newPassword = 'Nova senha e obrigatoria';
    else if (newPassword.length < 6) errs.newPassword = 'Minimo de 6 caracteres';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Senhas nao coincidem';
    return errs;
  };

  const handleSendReset = async (e) => {
    e.preventDefault();

    const emailError = validateEmail();
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Se o email estiver cadastrado, voce recebera as instrucoes!');
      setStep('token');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();

    const errs = validatePassword();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword });
      toast.success('Senha alterada com sucesso!');
      setStep('success');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Token invalido ou expirado. Solicite um novo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Camera className="text-primary-500 mx-auto mb-4" size={40} />
          <h1 className="text-2xl font-bold">Recuperar Senha</h1>
          <p className="text-surface-500 mt-2">
            {step === 'email' && 'Informe seu email para receber as instrucoes'}
            {step === 'token' && 'Insira o token recebido por email'}
            {step === 'success' && 'Senha redefinida com sucesso!'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6 space-y-4">
          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendReset} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                    className={`input-field pl-10 ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="seu@email.com"
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar instrucoes'}
              </button>
            </form>
          )}

          {/* Step 2: Token + Nova Senha */}
          {step === 'token' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Verifique seu email</p>
                <p>Se o email <strong>{email}</strong> estiver cadastrado, voce recebera um token de reset em instantes.</p>
                <p className="mt-1 text-xs">Em ambiente de desenvolvimento, o token e exibido no console do servidor (backend).</p>
              </div>

              <div>
                <label className="label">Token de Reset</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => { setResetToken(e.target.value); setErrors({}); }}
                    className={`input-field pl-10 font-mono text-sm ${errors.resetToken ? 'border-red-400' : ''}`}
                    placeholder="Cole o token aqui..."
                    autoComplete="off"
                  />
                </div>
                {errors.resetToken && <p className="text-red-500 text-xs mt-1">{errors.resetToken}</p>}
              </div>

              <div>
                <label className="label">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setErrors({}); }}
                    className={`input-field pr-10 ${errors.newPassword ? 'border-red-400' : ''}`}
                    placeholder="Minimo 6 caracteres"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
              </div>

              <div>
                <label className="label">Confirmar Senha</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}); }}
                  className={`input-field ${errors.confirmPassword ? 'border-red-400' : ''}`}
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Redefinindo...' : 'Redefinir Senha'}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-sm text-primary-500 hover:underline w-full text-center"
              >
                Solicitar novo token
              </button>
            </form>
          )}

          {/* Step 3: Sucesso */}
          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">✓</span>
              </div>
              <p className="text-surface-600">
                Sua senha foi redefinida com sucesso. Voce ja pode fazer login com a nova senha.
              </p>
              <Link href="/auth/login" className="btn-primary w-full block text-center">
                Ir para o Login
              </Link>
            </div>
          )}

          <div className="text-center pt-2">
            <Link href="/auth/login" className="text-sm text-primary-500 hover:underline flex items-center justify-center gap-1">
              <ArrowLeft size={14} />
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
