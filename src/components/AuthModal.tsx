import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KeyRound, Lock, Mail, User, X } from 'lucide-react';
import { registerWithInviteToken, supabase } from '../lib/supabase';

interface AuthModalProps {
  open: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onAuthenticated: (isNewAccount: boolean) => void;
}

export function AuthModal({
  open,
  initialMode = 'login',
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [token, setToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetMessages = () => setError(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signErr) {
        setError('E-mail ou senha inválidos. Verifique os dados informados.');
        setLoading(false);
        return;
      }
      setLoading(false);
      onAuthenticated(false);
      onClose();
    } catch {
      setError('Erro de conexão ao autenticar. Tente novamente.');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (password.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas digitadas não conferem.');
      return;
    }

    setLoading(true);
    const res = await registerWithInviteToken({
      token: token.trim().toUpperCase(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    if (!res.ok) {
      setError(res.error || 'Não foi possível concluir o cadastro.');
      setLoading(false);
      return;
    }

    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);
    if (signErr) {
      setError('Conta criada com sucesso! Faça login na aba Entrar.');
      setMode('login');
      return;
    }

    onAuthenticated(true);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1F1D1A]/35 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#DCD4C6] bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[#E6E0D5] bg-[#F8F6F1] px-6 py-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[#5A6D3A]">
                  Acesso de Membros
                </div>
                <h2 className="mt-1 font-editorial text-2xl font-medium text-[#1F1D1A]">
                  Destilaria Research Group
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#E6E0D5] bg-white p-1.5 text-[#5E584F] hover:text-[#1F1D1A]"
                aria-label="Fechar login"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 border-b border-[#E6E0D5] bg-[#FAF8F4] p-1.5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetMessages();
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                  mode === 'login'
                    ? 'bg-white text-[#1F1D1A] shadow-xs border border-[#E6E0D5]'
                    : 'text-[#5E584F] hover:text-[#1F1D1A]'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  resetMessages();
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                  mode === 'register'
                    ? 'bg-white text-[#1F1D1A] shadow-xs border border-[#E6E0D5]'
                    : 'text-[#5E584F] hover:text-[#1F1D1A]'
                }`}
              >
                Criar conta com token
              </button>
            </div>

            <form
              onSubmit={mode === 'login' ? handleLogin : handleRegister}
              className="space-y-4 px-6 py-5"
            >
              {mode === 'register' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#1F1D1A]">
                      Token único de convite
                    </label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6D3A]" />
                      <input
                        type="text"
                        required
                        value={token}
                        onChange={(e) => setToken(e.target.value.toUpperCase())}
                        placeholder="Ex.: DRG-XXXX-XXXX-XXXX"
                        className="w-full rounded-xl border border-[#DCD4C6] bg-[#F8F6F1] py-2.5 pl-9 pr-3 font-mono text-xs uppercase tracking-wider text-[#1F1D1A] placeholder:normal-case placeholder:tracking-normal placeholder:text-[#8A8378] focus:border-[#5A6D3A] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[#5E584F]">
                      Cole aqui o token enviado pela coordenação. Ele é invalidado após o uso.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#1F1D1A]">
                      Nome completo
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8378]" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Como aparecerá para o grupo"
                        className="w-full rounded-xl border border-[#DCD4C6] bg-[#F8F6F1] py-2.5 pl-9 pr-3 text-sm text-[#1F1D1A] placeholder:text-[#8A8378] focus:border-[#5A6D3A] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#1F1D1A]">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8378]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@instituicao.edu.br"
                    className="w-full rounded-xl border border-[#DCD4C6] bg-[#F8F6F1] py-2.5 pl-9 pr-3 text-sm text-[#1F1D1A] placeholder:text-[#8A8378] focus:border-[#5A6D3A] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#1F1D1A]">
                  Senha {mode === 'register' && <span className="font-normal text-[#5E584F]">(mín. 8 caracteres)</span>}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8378]" />
                  <input
                    type="password"
                    required
                    minLength={mode === 'register' ? 8 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#DCD4C6] bg-[#F8F6F1] py-2.5 pl-9 pr-3 text-sm text-[#1F1D1A] placeholder:text-[#8A8378] focus:border-[#5A6D3A] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#1F1D1A]">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8378]" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-[#DCD4C6] bg-[#F8F6F1] py-2.5 pl-9 pr-3 text-sm text-[#1F1D1A] placeholder:text-[#8A8378] focus:border-[#5A6D3A] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-[#D8B4A0] bg-[#FAF0EA] px-3.5 py-2.5 text-xs text-[#7D3B23]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-[#1F1D1A] py-2.5 text-sm font-semibold text-[#F8F6F1] transition-colors hover:bg-[#36322D] disabled:opacity-60"
              >
                {loading
                  ? 'Processando...'
                  : mode === 'login'
                    ? 'Entrar na plataforma'
                    : 'Validar token e criar conta'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
