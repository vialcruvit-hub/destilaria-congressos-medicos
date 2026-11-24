import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  CheckCircle2,
  Database,
  Download,
  LayoutGrid,
  Sparkles,
  Table2,
  Trash2,
} from 'lucide-react';
import type { Congresso, FilterState, SortDirection, SortField } from './types/congresso';
import { fetchCongressos } from './lib/supabase';
import { getMonthKey } from './lib/formatters';
import { BrandLogo } from './components/BrandLogo';
import { FilterBar } from './components/FilterBar';
import { CongressTable } from './components/CongressTable';
import { ExportModal } from './components/ExportModal';
import { CongressDetailDrawer } from './components/CongressDetailDrawer';

const INITIAL_FILTERS: FilterState = {
  busca: '',
  temas: [],
  mesAno: 'todos',
  modalidade: 'todos',
  regiao: 'todos',
  dataStatus: 'todos',
};

export function App() {
  const [congressos, setCongressos] = useState<Congresso[]>([]);
  const [dataSource, setDataSource] = useState<'supabase' | 'snapshot'>('snapshot');
  const [notice, setNotice] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [detailTarget, setDetailTarget] = useState<Congresso | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetchCongressos().then((res) => {
      if (!active) return;
      setCongressos(res.data);
      setDataSource(res.source);
      setNotice(res.notice);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const availableThemes = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of congressos) {
      const set = new Set<string>(c.temas.length > 0 ? c.temas : [c.tema_principal]);
      for (const t of set) {
        map.set(t, (map.get(t) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
  }, [congressos]);

  const availableMonths = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of congressos) {
      const k = getMonthKey(c.data_inicio);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => {
        if (a.key === 'a_definir') return 1;
        if (b.key === 'a_definir') return -1;
        return a.key.localeCompare(b.key);
      });
  }, [congressos]);

  const availableUFs = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of congressos) {
      if (c.estado_uf) {
        map.set(c.estado_uf, (map.get(c.estado_uf) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([uf, count]) => ({ uf, count }))
      .sort((a, b) => b.count - a.count || a.uf.localeCompare(b.uf));
  }, [congressos]);

  const filtered = useMemo(() => {
    const q = filters.busca.trim().toLowerCase();
    const list = congressos.filter((c) => {
      if (q) {
        const hay = [
          c.nome,
          c.local_formatado,
          c.tema_principal,
          ...c.temas,
          ...c.fontes,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (filters.temas.length > 0) {
        const eventThemes = c.temas.length > 0 ? c.temas : [c.tema_principal];
        const match = filters.temas.some((t) => eventThemes.includes(t));
        if (!match) return false;
      }

      if (filters.mesAno !== 'todos') {
        if (getMonthKey(c.data_inicio) !== filters.mesAno) return false;
      }

      if (filters.modalidade !== 'todos' && c.modalidade !== filters.modalidade) {
        return false;
      }

      if (filters.regiao !== 'todos') {
        if (filters.regiao === 'brasil' && c.pais !== 'Brasil') return false;
        if (filters.regiao === 'exterior' && (!c.pais || c.pais === 'Brasil')) return false;
        if (filters.regiao.startsWith('UF:')) {
          const uf = filters.regiao.slice(3);
          if (c.estado_uf !== uf) return false;
        }
      }

      if (filters.dataStatus !== 'todos' && c.data_status !== filters.dataStatus) {
        return false;
      }

      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'data') {
        const da = a.data_inicio ?? '9999-12-31';
        const db = b.data_inicio ?? '9999-12-31';
        cmp = da.localeCompare(db) || a.nome.localeCompare(b.nome, 'pt-BR');
      } else if (sortField === 'nome') {
        cmp = a.nome.localeCompare(b.nome, 'pt-BR');
      } else if (sortField === 'local') {
        cmp = a.local_formatado.localeCompare(b.local_formatado, 'pt-BR');
      } else if (sortField === 'tema') {
        cmp = a.tema_principal.localeCompare(b.tema_principal, 'pt-BR');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [congressos, filters, sortField, sortDir]);

  const selectedItems = useMemo(
    () => congressos.filter((c) => selectedSlugs.has(c.slug)),
    [congressos, selectedSlugs]
  );

  const exportTargetItems = selectedItems.length > 0 ? selectedItems : filtered;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const toggleSelect = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      const allIn = filtered.every((c) => next.has(c.slug));
      if (allIn) {
        for (const c of filtered) next.delete(c.slug);
      } else {
        for (const c of filtered) next.add(c.slug);
      }
      return next;
    });
  };

  const confirmedCount = useMemo(
    () => congressos.filter((c) => c.data_status === 'confirmada').length,
    [congressos]
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen pb-28">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b-2 border-[#211F1C] bg-[#FAF7F1]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
            <BrandLogo />

            <div className="flex flex-wrap items-center gap-2.5">
              {/* View Mode Switch */}
              <div className="inline-flex rounded-2xl border-2 border-[#211F1C] bg-white p-0.5 shadow-[2px_2px_0px_#211F1C]">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    viewMode === 'table'
                      ? 'bg-[#211F1C] text-[#FAF7F1]'
                      : 'text-[#5C554C] hover:text-[#211F1C]'
                  }`}
                >
                  <Table2 className="h-3.5 w-3.5" />
                  <span>Tabela</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-[#211F1C] text-[#FAF7F1]'
                      : 'text-[#5C554C] hover:text-[#211F1C]'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Cards</span>
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setExportOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#211F1C] bg-[#B7CC49] px-4 py-2 text-xs sm:text-sm font-bold text-[#211F1C] shadow-[3px_3px_0px_#211F1C] transition-colors hover:bg-[#A8BE38]"
              >
                <Download className="h-4 w-4" />
                <span>
                  {selectedItems.length > 0
                    ? `Exportar seleção (${selectedItems.length})`
                    : 'Exportar lista'}
                </span>
              </motion.button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6">
          {/* Hero Card */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border-2 border-[#211F1C] bg-gradient-to-br from-[#FDF6E9] via-[#FAF7F1] to-[#F2F6DF] p-5 sm:p-7 shadow-[6px_6px_0px_#211F1C]"
          >
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#211F1C] bg-white px-3 py-1 text-[11px] font-bold text-[#211F1C] shadow-[2px_2px_0px_#211F1C]">
                  <Sparkles className="h-3.5 w-3.5 text-[#859D20]" />
                  <span>Curadoria Inteligente · 9 fontes médicas deduplicadas</span>
                </div>
                <h1 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#211F1C]">
                  Radar de Congressos Médicos 2026–2028
                </h1>
                <p className="mt-1.5 text-sm text-[#5C554C] leading-relaxed">
                  Explore, combine filtros por especialidade, período e localidade, selecione seus
                  eventos prioritários e exporte em linguagem simples pronta para compartilhar.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <StatPill label="Eventos únicos" value={congressos.length} accent="bg-white" />
                <StatPill
                  label="Datas confirmadas"
                  value={confirmedCount}
                  accent="bg-[#F2F6DF]"
                />
                <div
                  title={notice || 'Conectado ao Supabase'}
                  className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#211F1C] bg-white px-3.5 py-2 text-xs font-semibold text-[#211F1C]"
                >
                  <Database
                    className={`h-3.5 w-3.5 ${
                      dataSource === 'supabase' ? 'text-[#7B9218]' : 'text-[#D49A4A]'
                    }`}
                  />
                  <span>
                    {dataSource === 'supabase' ? 'Supabase ao vivo' : 'Snapshot local'}
                  </span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Filter Bar */}
          <FilterBar
            filters={filters}
            onChange={setFilters}
            availableThemes={availableThemes}
            availableMonths={availableMonths}
            availableUFs={availableUFs}
            totalFiltered={filtered.length}
            totalAll={congressos.length}
          />

          {/* Table / Cards */}
          {loading ? (
            <div className="rounded-3xl border-2 border-[#211F1C] bg-white p-12 text-center shadow-[5px_5px_0px_#211F1C]">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-[#E4DDD0] border-t-[#211F1C]" />
              <p className="mt-3 text-sm font-medium text-[#5C554C]">
                Carregando calendário de congressos...
              </p>
            </div>
          ) : (
            <CongressTable
              items={filtered}
              viewMode={viewMode}
              selectedSlugs={selectedSlugs}
              onToggleSelect={toggleSelect}
              onToggleSelectAllFiltered={toggleSelectAllFiltered}
              onOpenDetail={setDetailTarget}
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              onClearFilters={() => setFilters(INITIAL_FILTERS)}
            />
          )}
        </main>

        {/* Floating Selection Bar */}
        <AnimatePresence>
          {selectedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-[#211F1C] bg-[#211F1C] px-4 py-2.5 text-[#FAF7F1] shadow-[5px_5px_0px_#B7CC49]"
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-[#B7CC49]" />
                <span className="tabular-nums">
                  {selectedItems.length}{' '}
                  {selectedItems.length === 1 ? 'selecionado' : 'selecionados'}
                </span>
              </div>

              <div className="h-4 w-px bg-white/20" />

              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setExportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#B7CC49] px-3 py-1.5 text-xs font-bold text-[#211F1C] hover:bg-[#CBE05A]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Exportar em linguagem simples</span>
              </motion.button>

              <button
                type="button"
                onClick={() => setSelectedSlugs(new Set())}
                className="rounded-lg p-1.5 text-[#CFC6B8] hover:bg-white/10 hover:text-white"
                title="Limpar seleção"
                aria-label="Limpar seleção"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail Drawer */}
        <CongressDetailDrawer
          congresso={detailTarget}
          selected={detailTarget ? selectedSlugs.has(detailTarget.slug) : false}
          onToggleSelect={toggleSelect}
          onClose={() => setDetailTarget(null)}
        />

        {/* Export Modal */}
        <ExportModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          items={exportTargetItems}
          isSelection={selectedItems.length > 0}
        />

        {/* Footer */}
        <footer className="mx-auto mt-12 max-w-7xl px-4 text-center text-xs text-[#6B655B] sm:px-6">
          Destilaria Research Group · Base PostgreSQL/Supabase (`yzuzasrpypsjucxrebjg`) ·{' '}
          {notice ?? 'Sincronizado via Supabase REST API'}
        </footer>
      </div>
    </MotionConfig>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div
      className={`rounded-2xl border-2 border-[#211F1C] ${accent} px-3.5 py-2 shadow-[2px_2px_0px_#211F1C]`}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B655B]">{label}</div>
      <div className="font-display text-lg font-extrabold text-[#211F1C] tabular-nums">{value}</div>
    </div>
  );
}

export default App;
