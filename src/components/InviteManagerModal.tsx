import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, KeyRound, MessageCircle, Plus, Trash2, X } from 'lucide-react';
import type { InviteToken, MemberRole } from '../types/congresso';
import { createInvite, listInvites, revokeInvite } from '../lib/supabase';

interface InviteManagerModalProps {
  open: boolean;
  accessToken: string | null;
  onClose: () => void;
}

export function InviteManagerModal({ open, accessToken, onClose }: InviteManagerModalProps) {
  const [invites, setInvites] = useState<InviteToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState('');
  const [role, setRole] = useState<MemberRole>('member');
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    const res = await listInvites(accessToken);
    if (res.error) setError(res.error);
    setInvites(res.invites);
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    if (open) {
      load();
    }
  }, [open, load]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setCreating(true);
    setError(null);
    const res = await createInvite(accessToken, {
      invitedLabel: label.trim() || undefined,
      role,
      expiresInDays: 30,
    });
    setCreating(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setLabel('');
    if (res.invite) {
      setInvites((prev) => [res.invite!, ...prev]);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!accessToken) return;
    const res = await revokeInvite(accessToken, id);
    if (!res.ok) {
      setError(res.error || 'Erro ao revogar token.');
      return;
    }
    setInvites((prev) => prev.filter((i) => i.id !== id));
  };

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const buildWhatsAppInviteUrl = (tok: InviteToken) => {
    const appUrl = window.location.origin;
    const msg = [
      `Olá! Segue seu token de convite único para o *Destilaria Research Group*:`,
      ``,
      `Token: *${tok.token}*`,
      `Link: ${appUrl}`,
      ``,
      `Clique em "Entrar / Convite" → "Criar conta com token", cole o código acima e preencha o questionário rápido com suas áreas e congressos de interesse.`,
    ].join('\n');
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const getStatus = (inv: InviteToken): { label: string; style: string } => {
    if (inv.used_at) {
      return { label: 'Utilizado', style: 'bg-[#F2ECE1] text-[#6B655B] border-[#DCD3C4]' };
    }
    if (inv.expires_at && new Date(inv.expires_at).getTime() <= Date.now()) {
      return { label: 'Expirado', style: 'bg-[#FAF0EA] text-[#7D3B23] border-[#D8B4A0]' };
    }
    return { label: 'Disponível', style: 'bg-[#F2F6DF] text-[#211F1C] border-[#211F1C]' };
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
            className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-2 border-[#211F1C] bg-[#FAF7F1] shadow-[8px_8px_0px_#211F1C]"
          >
            <div className="flex items-start justify-between border-b-2 border-[#211F1C] bg-[#FDF6E9] px-6 py-4">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5A6D1F]">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Administração de Convites</span>
                </div>
                <h2 className="mt-1 font-display text-xl font-extrabold text-[#211F1C]">
                  Gerar tokens de acesso único
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border-2 border-[#211F1C] bg-white p-1.5 text-[#211F1C] hover:bg-[#F3D2A2]"
                aria-label="Fechar gerenciador de convites"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleGenerate}
              className="flex flex-col gap-3 border-b border-[#E4DDD0] bg-white px-6 py-4 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label className="mb-1 block text-xs font-bold text-[#211F1C]">
                  Identificação do convidado (opcional)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex.: Dra. Mariana Silva"
                  className="w-full rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] px-3 py-2 text-sm text-[#211F1C] placeholder:text-[#8E8679] focus:border-[#211F1C] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:w-36">
                <label className="mb-1 block text-xs font-bold text-[#211F1C]">
                  Perfil
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as MemberRole)}
                  className="w-full rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] px-3 py-2 text-sm text-[#211F1C] focus:border-[#211F1C] focus:bg-white focus:outline-none"
                >
                  <option value="member">Membro</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit"
                disabled={creating}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#211F1C] bg-[#B7CC49] px-4 py-2 text-sm font-bold text-[#211F1C] shadow-[2px_2px_0px_#211F1C] hover:bg-[#A6BD36] disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                <span>{creating ? 'Gerando...' : 'Gerar token'}</span>
              </motion.button>
            </form>

            {error && (
              <div className="mx-6 mt-4 rounded-xl border border-[#D8B4A0] bg-[#FAF0EA] px-3.5 py-2.5 text-xs font-medium text-[#7D3B23]">
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading ? (
                <div className="py-10 text-center text-sm text-[#6B655B]">
                  Carregando convites...
                </div>
              ) : invites.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#6B655B]">
                  Nenhum token emitido ainda.
                </div>
              ) : (
                <div className="divide-y divide-[#E4DDD0] rounded-2xl border border-[#DDD4C4] bg-white">
                  {invites.map((inv) => {
                    const st = getStatus(inv);
                    const canUse = !inv.used_at;
                    return (
                      <div
                        key={inv.id}
                        className="flex flex-col justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <code className="font-mono text-xs font-bold text-[#211F1C]">
                              {inv.token}
                            </code>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${st.style}`}
                            >
                              {st.label}
                            </span>
                            {inv.role === 'admin' && (
                              <span className="rounded-full border border-[#211F1C] bg-[#F3D2A2] px-2 py-0.5 text-[10px] font-bold text-[#211F1C]">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-[#6B655B]">
                            {inv.invited_label || 'Convite sem rótulo'} · Criado em{' '}
                            {new Date(inv.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>

                        {canUse && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => copyText(inv.id, inv.token)}
                              className="inline-flex items-center gap-1 rounded-xl border border-[#DCD3C4] bg-[#FAF7F1] px-2.5 py-1.5 text-xs font-semibold text-[#211F1C] hover:border-[#211F1C]"
                            >
                              {copiedId === inv.id ? (
                                <Check className="h-3.5 w-3.5 text-[#5A6D1F]" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              <span>{copiedId === inv.id ? 'Copiado' : 'Copiar'}</span>
                            </button>

                            <a
                              href={buildWhatsAppInviteUrl(inv)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-xl border border-[#211F1C] bg-[#F2F6DF] px-2.5 py-1.5 text-xs font-bold text-[#211F1C] hover:bg-[#E4EEB8]"
                              title="Enviar convite por WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => handleRevoke(inv.id)}
                              className="rounded-xl p-1.5 text-[#8E8679] hover:bg-[#FAF0EA] hover:text-[#7D3B23]"
                              title="Revogar token"
                              aria-label="Revogar token"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
