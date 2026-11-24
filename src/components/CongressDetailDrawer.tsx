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
            className="absolute inset-0 bg-[#211F1C]/45 backdrop-blur-xs"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l-2 border-[#211F1C] bg-[#FAF7F1] shadow-[-8px_0px_0px_rgba(33,31,28,0.12)]"
          >
            <div className="flex items-center justify-between border-b-2 border-[#211F1C] bg-[#FDF6E9] px-5 py-4">
              <span className="font-display text-xs font-bold uppercase tracking-widest text-[#6B655B]">
                Ficha do Congresso
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border-2 border-[#211F1C] bg-white p-1.5 text-[#211F1C] hover:bg-[#F3D2A2]"
                aria-label="Fechar detalhes"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full border border-[#211F1C] bg-[#B7CC49] px-2.5 py-0.5 font-bold text-[#211F1C]">
                    {congresso.tema_principal}
                  </span>
                  <span className="font-semibold text-[#6B655B]">
                    {MODALIDADE_LABEL[congresso.modalidade]} ·{' '}
                    {DATA_STATUS_LABEL[congresso.data_status]}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-xl font-extrabold leading-snug text-[#211F1C]">
                  {congresso.nome}
                </h3>
              </div>

              {/* Ações externas rápidas */}
              <div className="grid grid-cols-2 gap-2.5">
                <motion.a
                  whileTap={{ scale: 0.97 }}
                  href={buildGoogleSearchUrl(congresso)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-[#211F1C] bg-[#FDF6E9] px-3 py-2.5 text-xs font-bold text-[#211F1C] shadow-[3px_3px_0px_#211F1C] hover:bg-[#F7E8CE]"
                >
                  <span>Pesquisar no Google</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </motion.a>

                <motion.a
                  whileTap={{ scale: 0.97 }}
                  href={buildWhatsAppShareUrl(congresso, topic)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-[#211F1C] bg-[#B7CC49] px-3 py-2.5 text-xs font-bold text-[#211F1C] shadow-[3px_3px_0px_#211F1C] hover:bg-[#A6BD36]"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Enviar no WhatsApp</span>
                </motion.a>
              </div>

              {/* Metadados abertos com divisores limpos (sem caixas aninhadas) */}
              <div className="space-y-3 border-t border-[#E4DDD0] pt-4">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#859D20]" />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B655B]">
                      Período
                    </div>
                    <div className="text-sm font-semibold text-[#211F1C]">
                      {formatDateRange(congresso)}
                    </div>
                    {congresso.data_observacao && (
                      <div className="mt-0.5 text-xs text-[#7A4F16]">
                        Obs.: {congresso.data_observacao}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-[#EFE8DA] pt-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D49A4A]" />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B655B]">
                      Localização
                    </div>
                    <div className="text-sm font-semibold text-[#211F1C]">
                      {congresso.local_formatado}
                    </div>
                    {congresso.pais && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-[#6B655B]">
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

                <div className="flex items-start gap-3 border-t border-[#EFE8DA] pt-3">
                  <Tag className="mt-0.5 h-4 w-4 shrink-0 text-[#211F1C]" />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B655B]">
                      Temas e Especialidades
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {congresso.temas.length > 0 ? (
                        congresso.temas.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-[#DCD3C4] bg-white px-2.5 py-0.5 text-xs font-medium text-[#211F1C]"
                          >
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#6B655B]">Não informado pelas fontes</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-[#EFE8DA] pt-3">
                  <Database className="mt-0.5 h-4 w-4 shrink-0 text-[#6B655B]" />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B655B]">
                      Fontes ({congresso.fontes.length})
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {congresso.fontes.map((f) => (
                        <span
                          key={f}
                          className="rounded-lg bg-white px-2 py-0.5 font-mono text-[11px] text-[#5C554C] ring-1 ring-[#E4DDD0]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interesse para formar grupo de artigo */}
              <div className="space-y-3 rounded-2xl border-2 border-[#211F1C] bg-white p-4 shadow-[4px_4px_0px_#211F1C]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#211F1C]">
                    <Bookmark className="h-4 w-4 text-[#859D20]" />
                    <span>Interesse para grupo de artigo</span>
                  </div>
                  {colleagueInterests.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F2F6DF] px-2 py-0.5 text-[11px] font-bold text-[#211F1C]">
                      <Users className="h-3 w-3" />
                      {colleagueInterests.length}
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
                          className="rounded-lg bg-[#FAF7F1] px-2 py-1 text-[11px] text-[#211F1C] ring-1 ring-[#E4DDD0]"
                        >
                          <strong>{p?.full_name || 'Membro'}</strong>
                          {it.proposed_topic ? ` — ${it.proposed_topic}` : ''}
                        </span>
                      );
                    })}
                  </div>
                )}

                {isAuthenticated ? (
                  <div className="space-y-2.5 border-t border-[#EFE8DA] pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(['escrever_artigo', 'prioritario', 'interessado'] as InterestLevel[]).map(
                        (lv) => (
                          <button
                            key={lv}
                            type="button"
                            onClick={() => setLevel(lv)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                              level === lv
                                ? 'border-[#211F1C] bg-[#F3D2A2] text-[#211F1C] shadow-[1.5px_1.5px_0px_#211F1C]'
                                : 'border-[#DDD4C4] bg-[#FAF7F1] text-[#5C554C]'
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
                      className="w-full rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] px-3 py-2 text-xs text-[#211F1C] placeholder:text-[#8E8679] focus:border-[#211F1C] focus:bg-white focus:outline-none"
                    />

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 rounded-xl border-2 border-[#211F1C] bg-[#B7CC49] py-2 text-xs font-bold text-[#211F1C] shadow-[2px_2px_0px_#211F1C] hover:bg-[#A6BD36] disabled:opacity-60"
                      >
                        {saving
                          ? 'Salvando...'
                          : myInterest
                            ? 'Atualizar interesse'
                            : 'Marcar interesse'}
                      </motion.button>
                      {myInterest && (
                        <button
                          type="button"
                          onClick={handleRemove}
                          disabled={saving}
                          className="rounded-xl border border-[#D8B4A0] bg-[#FAF0EA] px-3 py-2 text-xs font-semibold text-[#7D3B23]"
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
                    className="w-full rounded-xl border-2 border-[#211F1C] bg-[#FDF6E9] py-2 text-xs font-bold text-[#211F1C] hover:bg-[#F7E8CE]"
                  >
                    Entre com sua conta para sinalizar interesse
                  </button>
                )}
              </div>
            </div>

            <div className="border-t-2 border-[#211F1C] bg-white p-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => onToggleSelect(congresso.slug)}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#211F1C] py-2.5 text-sm font-bold shadow-[3px_3px_0px_#211F1C] transition-colors ${
                  selected
                    ? 'bg-[#B7CC49] text-[#211F1C]'
                    : 'bg-[#F3D2A2] text-[#211F1C] hover:bg-[#EFC384]'
                }`}
              >
                {selected ? <Check className="h-4 w-4 stroke-[2.8]" /> : <Plus className="h-4 w-4" />}
                <span>{selected ? 'Selecionado na lista' : 'Adicionar à minha seleção'}</span>
              </motion.button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
