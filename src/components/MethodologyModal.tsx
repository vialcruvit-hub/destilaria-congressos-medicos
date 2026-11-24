import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Layers, X } from 'lucide-react';

interface MethodologyModalProps {
  open: boolean;
  onClose: () => void;
}

const FONTES = [
  { nome: 'medsearch.app', qtd: '116 eventos', nota: 'Catálogo público de congressos médicos 2026–2028' },
  { nome: 'querocongressos.com.br', qtd: '65 eventos', nota: 'Agenda nacional por mês (2027–2028)' },
  { nome: 'usebip.com', qtd: '56 eventos', nota: 'Calendário de congressos confirmados e previstos 2027' },
  { nome: 'agenciadomedico.com.br', qtd: '40 eventos', nota: 'Panorama nacional e internacional 2027' },
  { nome: 'tivita.com', qtd: '26 eventos', nota: 'Agenda de saúde 2027' },
  { nome: 'star.med.br', qtd: '15 eventos', nota: 'Principais eventos médicos nacionais e internacionais' },
  { nome: 'agrupamed.com.br', qtd: '7 eventos', nota: 'Listagem reduzida (lida via JSON-LD embutido)' },
  { nome: 'medicinahub.com.br', qtd: '7 eventos', nota: 'Agenda futura (conjunto coincidente ao AgrupaMED)' },
  { nome: 'bibliomed.com.br', qtd: '1 evento', nota: 'Página específica do AAIC 2027 (cng_id=12030)' },
];

export function MethodologyModal({ open, onClose }: MethodologyModalProps) {
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
            className="relative z-10 flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-2 border-[#211F1C] bg-[#FAF7F1] shadow-[8px_8px_0px_#211F1C]"
          >
            <div className="flex items-start justify-between border-b-2 border-[#211F1C] bg-[#FDF6E9] px-6 py-4">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5A6D1F]">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Nota Metodológica</span>
                </div>
                <h2 className="mt-1 font-display text-xl font-extrabold text-[#211F1C]">
                  Como os dados foram coletados e selecionados
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border-2 border-[#211F1C] bg-white p-1.5 text-[#211F1C] hover:bg-[#F3D2A2]"
                aria-label="Fechar nota metodológica"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-[#3F3B35]">
              <section className="space-y-2.5">
                <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#211F1C]">
                  <Layers className="h-4 w-4 text-[#859D20]" />
                  1. Coleta automatizada e escopo das 9 fontes
                </h3>
                <p className="text-[13px]">
                  Um script em Python (<code>requests</code> + <code>BeautifulSoup</code>) coletou{' '}
                  <strong>333 registros brutos</strong> das 9 fontes indicadas, registrando abaixo a
                  cobertura efetiva de cada página:
                </p>
                <div className="divide-y divide-[#E4DDD0] rounded-2xl border border-[#DDD4C4] bg-white">
                  {FONTES.map((f) => (
                    <div
                      key={f.nome}
                      className="flex flex-col justify-between gap-1 px-4 py-2 text-xs sm:flex-row sm:items-center"
                    >
                      <span className="font-mono font-bold text-[#211F1C]">{f.nome}</span>
                      <span className="text-[#6B655B]">{f.nota}</span>
                      <span className="shrink-0 font-bold text-[#5A6D1F] tabular-nums">
                        {f.qtd}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="flex items-center gap-2 font-display text-sm font-bold text-[#211F1C]">
                  <CheckCircle2 className="h-4 w-4 text-[#859D20]" />
                  2. Deduplicação e critério de seleção
                </h3>
                <ul className="list-disc space-y-1.5 pl-5 text-[13px] text-[#3F3B35]">
                  <li>
                    <strong>Normalização e siglas:</strong> remoção de numerais romanos, ordinais e
                    termos genéricos, cruzando siglas oficiais (<em>CBR27, CBGO, SIMASP, CBAEM</em>)
                    e palavras-chave específicas de cada evento.
                  </li>
                  <li>
                    <strong>Compatibilidade de data e local:</strong> dois registros só são
                    unificados quando possuem datas compatíveis e/ou mesma cidade/UF, evitando
                    mesclar congressos distintos da mesma área.
                  </li>
                  <li>
                    <strong>Padronização PostgreSQL:</strong> os 333 registros brutos foram
                    destilados em <strong>165 eventos únicos</strong>, com datas ISO-8601, locais
                    decompostos e sinônimos de especialidade unificados.
                  </li>
                </ul>
              </section>
            </div>

            <div className="flex items-center justify-between border-t-2 border-[#211F1C] bg-white px-6 py-3.5 text-xs text-[#6B655B]">
              <span>Destilaria Research Group · Base PostgreSQL/Supabase</span>
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={onClose}
                className="rounded-xl border-2 border-[#211F1C] bg-[#B7CC49] px-4 py-1.5 font-bold text-[#211F1C] shadow-[2px_2px_0px_#211F1C] hover:bg-[#A6BD36]"
              >
                Entendi
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
