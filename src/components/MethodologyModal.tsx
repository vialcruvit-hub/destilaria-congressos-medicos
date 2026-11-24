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
  { nome: 'agrupamed.com.br', qtd: '7 eventos', nota: 'Listagem reduzida (extraída via JSON-LD embutido)' },
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
            className="absolute inset-0 bg-[#1F1D1A]/35 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#DCD4C6] bg-[#FFFFFF] shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[#E6E0D5] bg-[#F8F6F1] px-6 py-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#5A6D3A]">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Nota Metodológica</span>
                </div>
                <h2 className="mt-1 font-editorial text-2xl font-medium text-[#1F1D1A]">
                  Como os dados foram coletados e selecionados
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#E6E0D5] bg-white p-1.5 text-[#5E584F] hover:border-[#CFC7B8] hover:text-[#1F1D1A]"
                aria-label="Fechar nota metodológica"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-[#433F39]">
              <section className="space-y-2">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-[#1F1D1A]">
                  <Layers className="h-4 w-4 text-[#5A6D3A]" />
                  1. Coleta automatizada e escopo das 9 fontes
                </h3>
                <p>
                  Foi executado um pipeline em Python (<code>requests</code> +{' '}
                  <code>BeautifulSoup</code>) sobre as 9 fontes públicas indicadas pelo grupo,
                  totalizando <strong>333 registros brutos</strong>. Fontes sem barreiras técnicas
                  foram lidas diretamente; fontes com listagem restrita ou página única tiveram sua
                  cobertura registrada abaixo:
                </p>
                <div className="mt-2 divide-y divide-[#EFEBE2] rounded-xl border border-[#E6E0D5] bg-[#F8F6F1]/60">
                  {FONTES.map((f) => (
                    <div
                      key={f.nome}
                      className="flex flex-col justify-between gap-1 px-3.5 py-2 text-xs sm:flex-row sm:items-center"
                    >
                      <span className="font-mono font-semibold text-[#1F1D1A]">{f.nome}</span>
                      <span className="text-[#5E584F]">{f.nota}</span>
                      <span className="shrink-0 font-semibold text-[#5A6D3A] tabular-nums">
                        {f.qtd}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-[#1F1D1A]">
                  <CheckCircle2 className="h-4 w-4 text-[#5A6D3A]" />
                  2. Deduplicação e critério de seleção
                </h3>
                <ul className="list-disc space-y-1.5 pl-5 text-[13px] text-[#4A453E]">
                  <li>
                    <strong>Normalização e siglas:</strong> remoção de numerais romanos, ordinais e
                    termos genéricos (como &ldquo;Congresso Brasileiro de&rdquo;), comparando siglas
                    oficiais (ex.: <em>CBR27, CBGO, SIMASP, CBAEM, MEDTROP</em>) e tokens temáticos
                    específicos.
                  </li>
                  <li>
                    <strong>Compatibilidade temporal e geográfica:</strong> eventos só são
                    unificados quando possuem datas compatíveis e/ou mesma cidade/UF, evitando falsas
                    fusões entre encontros diferentes da mesma especialidade.
                  </li>
                  <li>
                    <strong>Consolidação de campos:</strong> os 333 registros brutos foram
                    destilados em <strong>165 eventos únicos</strong>, preservando as datas exatas
                    mais completas, padronizando locais (<code>Cidade, UF - Brasil</code> ou{' '}
                    <code>Cidade, País</code>) e unificando sinônimos de especialidades para carga
                    em PostgreSQL.
                  </li>
                </ul>
              </section>
            </div>

            <div className="flex items-center justify-between border-t border-[#E6E0D5] bg-[#F8F6F1] px-6 py-3.5 text-xs text-[#5E584F]">
              <span>Destilaria Research Group · Curadoria de Evidências &amp; Eventos</span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-[#1F1D1A] px-3.5 py-1.5 font-semibold text-[#F8F6F1] hover:bg-[#35322D]"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
