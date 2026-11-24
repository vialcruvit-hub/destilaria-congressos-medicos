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
            className="absolute inset-0 bg-[#211F1C]/45 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border-2 border-[#211F1C] bg-[#FAF7F1] shadow-[8px_8px_0px_#211F1C]"
          >
            <div className="flex items-start justify-between border-b-2 border-[#211F1C] bg-[#FDF6E9] px-6 py-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#5A6D1F]">
                  Acesso de Membros
                </div>
                <h2 className="mt-0.5 font-display text-xl font-extrabold text-[#211F1C]">
                  Destilaria Research Group
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border-2 border-[#211F1C] bg-white p-1.5 text-[#211F1C] hover:bg-[#F3D2A2]"
                aria-label="Fechar login"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 border-b border-[#E4DDD0] bg-white p-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetMessages();
                }}
                className={`rounded-xl py-2 text-xs font-bold transition-all ${
                  mode === 'login'
                    ? 'bg-[#211F1C] text-[#FAF7F1]'
                    : 'text-[#5C554C] hover:bg-[#FAF7F1] hover:text-[#211F1C]'
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
                className={`rounded-xl py-2 text-xs font-bold transition-all ${
                  mode === 'register'
                    ? 'bg-[#B7CC49] text-[#211F1C] border-2 border-[#211F1C] shadow-[2px_2px_0px_#211F1C]'
                    : 'text-[#5C554C] hover:bg-[#FAF7F1] hover:text-[#211F1C]'
                }`}
              >
                Criar conta com token
              </button>
            </div>

            <form
              onSubmit={mode === 'login' ? handleLogin : handleRegister}
              className="space-y-4 bg-white px-6 py-5"
            >
              {mode === 'register' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#211F1C]">
                      Token único de convite
                    </label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#859D20]" />
                      <input
                        type="text"
                        required
                        value={token}
                        onChange={(e) => setToken(e.target.value.toUpperCase())}
                        placeholder="Ex.: DRG-XXXX-XXXX-XXXX"
                        className="w-full rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] py-2.5 pl-9 pr-3 font-mono text-xs uppercase tracking-wider text-[#211F1C] placeholder:normal-case placeholder:tracking-normal placeholder:text-[#8E8679] focus:border-[#211F1C] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[#6B655B]">
                      Cole o token enviado pela coordenação. Ele é invalidado após o uso.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#211F1C]">
                      Nome completo
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8679]" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Como aparecerá para o grupo"
                        className="w-full rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] py-2.5 pl-9 pr-3 text-sm text-[#211F1C] placeholder:text-[#8E8679] focus:border-[#211F1C] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#211F1C]">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8679]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@instituicao.edu.br"
                    className="w-full rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] py-2.5 pl-9 pr-3 text-sm text-[#211F1C] placeholder:text-[#8E8679] focus:border-[#211F1C] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#211F1C]">
                  Senha{' '}
                  {mode === 'register' && (
                    <span className="font-normal text-[#6B655B]">(mín. 8 caracteres)</span>
                  )}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8679]" />
                  <input
                    type="password"
                    required
                    minLength={mode === 'register' ? 8 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] py-2.5 pl-9 pr-3 text-sm text-[#211F1C] placeholder:text-[#8E8679] focus:border-[#211F1C] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#211F1C]">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8679]" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] py-2.5 pl-9 pr-3 text-sm text-[#211F1C] placeholder:text-[#8E8679] focus:border-[#211F1C] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-[#D8B4A0] bg-[#FAF0EA] px-3.5 py-2.5 text-xs font-medium text-[#7D3B23]">
                  {error}
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-2xl border-2 border-[#211F1C] bg-[#B7CC49] py-2.5 text-sm font-bold text-[#211F1C] shadow-[3px_3px_0px_#211F1C] transition-colors hover:bg-[#A6BD36] disabled:opacity-60"
              >
                {loading
                  ? 'Processando...'
                  : mode === 'login'
                    ? 'Entrar na plataforma'
                    : 'Validar token e criar conta'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
