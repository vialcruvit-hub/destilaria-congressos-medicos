import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  Calendar,
  Check,
  Database,
  ExternalLink,
  Globe2,
  MapPin,
  MessageCircle,
  Plus,
  Tag,
  Users,
  X,
} from 'lucide-react';
import type {
  Congresso,
  InterestLevel,
  MemberCongressInterest,
  MemberProfile,
} from '../types/congresso';
import {
  DATA_STATUS_LABEL,
  INTEREST_LEVEL_LABEL,
  MODALIDADE_LABEL,
  buildGoogleSearchUrl,
  buildWhatsAppShareUrl,
  formatDateRange,
} from '../lib/formatters';

interface CongressDetailDrawerProps {
  congresso: Congresso | null;
  selected: boolean;
  isAuthenticated: boolean;
  myInterest: MemberCongressInterest | null;
  colleagueInterests: MemberCongressInterest[];
  profileMap: Map<string, MemberProfile>;
  onToggleSelect: (slug: string) => void;
  onSaveInterest: (c: Congresso, level: InterestLevel, topic: string) => Promise<void>;
  onRemoveInterest: (c: Congresso) => Promise<void>;
  onRequireAuth: () => void;
  onClose: () => void;
}

export function CongressDetailDrawer({
  congresso,
  selected,
  isAuthenticated,
  myInterest,
  colleagueInterests,
  profileMap,
  onToggleSelect,
  onSaveInterest,
  onRemoveInterest,
  onRequireAuth,
  onClose,
}: CongressDetailDrawerProps) {
  const [level, setLevel] = useState<InterestLevel>('escrever_artigo');
  const [topic, setTopic] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (myInterest) {
      setLevel(myInterest.interest_level);
      setTopic(myInterest.proposed_topic || '');
    } else {
      setLevel('escrever_artigo');
      setTopic('');
    }
  }, [congresso?.slug, myInterest]);

  const handleSave = async () => {
    if (!congresso) return;
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    setSaving(true);
    await onSaveInterest(congresso, level, topic);
    setSaving(false);
  };

  const handleRemove = async () => {
    if (!congresso) return;
    setSaving(true);
    await onRemoveInterest(congresso);
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {congresso && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1F1D1A]/35 backdrop-blur-xs"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#DCD4C6] bg-[#F8F6F1] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E6E0D5] bg-white px-5 py-4">
              <span className="font-display text-xs font-semibold uppercase tracking-widest text-[#5E584F]">
                Ficha do Congresso
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#E6E0D5] bg-[#F8F6F1] p-1.5 text-[#5E584F] hover:text-[#1F1D1A]"
                aria-label="Fechar detalhes"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded-md bg-[#EEF2E7] px-2.5 py-0.5 font-medium text-[#45562B]">
                    {congresso.tema_principal}
                  </span>
                  <span className="text-[#5E584F]">
                    · {MODALIDADE_LABEL[congresso.modalidade]} ·{' '}
                    {DATA_STATUS_LABEL[congresso.data_status]}
                  </span>
                </div>
                <h3 className="mt-2.5 font-editorial text-2xl font-medium leading-snug text-[#1F1D1A]">
                  {congresso.nome}
                </h3>
              </div>

              {/* Ações rápidas externas (Google + WhatsApp) */}
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={buildGoogleSearchUrl(congresso)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#DCD4C6] bg-white px-3 py-2.5 text-xs font-semibold text-[#1F1D1A] transition-colors hover:border-[#5A6D3A]"
                >
                  <span>Pesquisar no Google</span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#5E584F]" />
                </a>

                <a
                  href={buildWhatsAppShareUrl(congresso, topic)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#CED9BC] bg-[#EEF2E7] px-3 py-2.5 text-xs font-semibold text-[#35441E] transition-colors hover:bg-[#E4ECD8]"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Enviar no WhatsApp</span>
                </a>
              </div>

              {/* Metadados */}
              <div className="space-y-3 rounded-2xl border border-[#E6E0D5] bg-white p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#5A6D3A]" />
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8378]">
                      Período
                    </div>
                    <div className="text-sm font-semibold text-[#1F1D1A]">
                      {formatDateRange(congresso)}
                    </div>
                    {congresso.data_observacao && (
                      <div className="mt-0.5 text-xs text-[#8F6B3A]">
                        Obs.: {congresso.data_observacao}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-[#EFEBE2] pt-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8F6B3A]" />
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8378]">
                      Localização
                    </div>
                    <div className="text-sm font-semibold text-[#1F1D1A]">
                      {congresso.local_formatado}
                    </div>
                    {congresso.pais && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-[#5E584F]">
                        <Globe2 className="h-3 w-3" />
                        <span>
                          {[congresso.cidade, congresso.estado_uf, congresso.pais]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-[#EFEBE2] pt-3">
                  <Tag className="mt-0.5 h-4 w-4 shrink-0 text-[#5E584F]" />
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8378]">
                      Temas e Especialidades
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {congresso.temas.length > 0 ? (
                        congresso.temas.map((t) => (
                          <span
                            key={t}
                            className="rounded-md border border-[#E6E0D5] bg-[#F8F6F1] px-2.5 py-0.5 text-xs font-medium text-[#1F1D1A]"
                          >
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#5E584F]">Não informado pelas fontes</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-[#EFEBE2] pt-3">
                  <Database className="mt-0.5 h-4 w-4 shrink-0 text-[#8A8378]" />
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8378]">
                      Fontes ({congresso.fontes.length})
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {congresso.fontes.map((f) => (
                        <span
                          key={f}
                          className="rounded-md border border-[#E6E0D5] bg-[#F8F6F1] px-2 py-0.5 font-mono text-[11px] text-[#5E584F]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco de interesse para escrever artigo em grupo */}
              <div className="space-y-3 rounded-2xl border border-[#E6E0D5] bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1F1D1A]">
                    <Bookmark className="h-4 w-4 text-[#5A6D3A]" />
                    <span>Interesse para grupo de artigo</span>
                  </div>
                  {colleagueInterests.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5A6D3A]">
                      <Users className="h-3 w-3" />
                      {colleagueInterests.length} no grupo
                    </span>
                  )}
                </div>

                {colleagueInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {colleagueInterests.map((it) => {
                      const p = profileMap.get(it.user_id);
                      return (
                        <span
                          key={it.user_id}
                          className="rounded-lg border border-[#E6E0D5] bg-[#F8F6F1] px-2 py-1 text-[11px] text-[#433F39]"
                        >
                          <strong>{p?.full_name || 'Membro'}</strong>
                          {it.proposed_topic ? ` — ${it.proposed_topic}` : ''}
                        </span>
                      );
                    })}
                  </div>
                )}

                {isAuthenticated ? (
                  <div className="space-y-2.5 border-t border-[#EFEBE2] pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(['escrever_artigo', 'prioritario', 'interessado'] as InterestLevel[]).map(
                        (lv) => (
                          <button
                            key={lv}
                            type="button"
                            onClick={() => setLevel(lv)}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                              level === lv
                                ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
                                : 'border-[#E6E0D5] bg-white text-[#5E584F]'
                            }`}
                          >
                            {INTEREST_LEVEL_LABEL[lv]}
                          </button>
                        )
                      )}
                    </div>

                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Ideia de tema ou eixo de artigo (opcional)"
                      className="w-full rounded-xl border border-[#DCD4C6] bg-[#F8F6F1] px-3 py-2 text-xs text-[#1F1D1A] placeholder:text-[#8A8378] focus:border-[#5A6D3A] focus:bg-white focus:outline-none"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 rounded-xl bg-[#5A6D3A] py-2 text-xs font-semibold text-white hover:bg-[#495A2E] disabled:opacity-60"
                      >
                        {saving
                          ? 'Salvando...'
                          : myInterest
                            ? 'Atualizar meu interesse'
                            : 'Marcar meu interesse'}
                      </button>
                      {myInterest && (
                        <button
                          type="button"
                          onClick={handleRemove}
                          disabled={saving}
                          className="rounded-xl border border-[#E6E0D5] bg-white px-3 py-2 text-xs font-medium text-[#7D3B23] hover:bg-[#FAF0EA]"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onRequireAuth}
                    className="w-full rounded-xl border border-[#DCD4C6] bg-[#F8F6F1] py-2 text-xs font-semibold text-[#1F1D1A] hover:border-[#5A6D3A]"
                  >
                    Entre com sua conta para sinalizar interesse ao grupo
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-[#E6E0D5] bg-white p-4">
              <button
                type="button"
                onClick={() => onToggleSelect(congresso.slug)}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                  selected
                    ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
                    : 'border-[#1F1D1A] bg-[#1F1D1A] text-[#F8F6F1] hover:bg-[#35322D]'
                }`}
              >
                {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span>
                  {selected ? 'Selecionado para exportação' : 'Selecionar para exportação'}
                </span>
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
