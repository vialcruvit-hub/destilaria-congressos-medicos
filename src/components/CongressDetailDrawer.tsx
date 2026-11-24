import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Check, Database, Globe2, MapPin, Plus, Tag, X } from 'lucide-react';
import type { Congresso } from '../types/congresso';
import { DATA_STATUS_LABEL, MODALIDADE_LABEL, formatDateRange } from '../lib/formatters';

interface CongressDetailDrawerProps {
  congresso: Congresso | null;
  selected: boolean;
  onToggleSelect: (slug: string) => void;
  onClose: () => void;
}

export function CongressDetailDrawer({
  congresso,
  selected,
  onToggleSelect,
  onClose,
}: CongressDetailDrawerProps) {
  return (
    <AnimatePresence>
      {congresso && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#211F1C]/40 backdrop-blur-xs"
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
                className="rounded-xl border border-[#211F1C] bg-white p-1.5 text-[#211F1C] hover:bg-[#F3D2A2]"
                aria-label="Fechar detalhes"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-[#211F1C] bg-[#B7CC49] px-2.5 py-0.5 text-[11px] font-bold text-[#211F1C]">
                    {congresso.tema_principal}
                  </span>
                  <span className="rounded-full border border-[#DCD3C4] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#5C554C]">
                    {MODALIDADE_LABEL[congresso.modalidade]}
                  </span>
                  <span className="rounded-full border border-[#DCD3C4] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#5C554C]">
                    {DATA_STATUS_LABEL[congresso.data_status]}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-xl font-extrabold leading-snug text-[#211F1C]">
                  {congresso.nome}
                </h3>
              </div>

              <div className="space-y-3 rounded-2xl border-2 border-[#211F1C] bg-white p-4 shadow-[4px_4px_0px_#211F1C]">
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
                            className="rounded-full border border-[#E4DDD0] bg-[#FAF7F1] px-2.5 py-0.5 text-xs font-medium text-[#211F1C]"
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
                      Fontes consolidadas ({congresso.fontes.length})
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {congresso.fontes.map((f) => (
                        <span
                          key={f}
                          className="rounded-lg border border-[#E4DDD0] bg-[#FAF7F1] px-2 py-0.5 font-mono text-[11px] text-[#5C554C]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
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
