import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Check,
  ChevronDown,
  Globe2,
  LayoutGrid,
  Search,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Tag,
  X,
} from 'lucide-react';
import type { DataStatus, FilterState, Modalidade } from '../types/congresso';
import { DATA_STATUS_LABEL, MODALIDADE_LABEL, formatMonthKeyLabel } from '../lib/formatters';

export type QuickLens = 'all' | 'group' | 'my_areas' | 'online' | 'intl' | 'y2027';

interface FilterBarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  quickLens: QuickLens;
  onQuickLensChange: (lens: QuickLens) => void;
  hasGroupInterests: boolean;
  hasMyAreas: boolean;
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  availableThemes: { name: string; count: number }[];
  availableMonths: { key: string; count: number }[];
  availableUFs: { uf: string; count: number }[];
  totalFiltered: number;
  totalAll: number;
}

type FilterPanelKey = 'temas' | 'mesAno' | 'modalidade' | 'regiao' | 'dataStatus';

export function FilterBar({
  filters,
  onChange,
  quickLens,
  onQuickLensChange,
  hasGroupInterests,
  hasMyAreas,
  viewMode,
  onViewModeChange,
  availableThemes,
  availableMonths,
  availableUFs,
  totalFiltered,
  totalAll,
}: FilterBarProps) {
  const [openPanel, setOpenPanel] = useState<FilterPanelKey | null>(null);
  const [themeQuery, setThemeQuery] = useState('');
  const [enabledPanels, setEnabledPanels] = useState<FilterPanelKey[]>([
    'temas',
    'mesAno',
    'modalidade',
    'regiao',
  ]);
  const [showFilterChooser, setShowFilterChooser] = useState(false);

  const filteredThemes = useMemo(() => {
    const q = themeQuery.trim().toLowerCase();
    if (!q) return availableThemes;
    return availableThemes.filter((t) => t.name.toLowerCase().includes(q));
  }, [availableThemes, themeQuery]);

  const activeCount =
    (filters.busca ? 1 : 0) +
    filters.temas.length +
    (filters.mesAno !== 'todos' ? 1 : 0) +
    (filters.modalidade !== 'todos' ? 1 : 0) +
    (filters.regiao !== 'todos' ? 1 : 0) +
    (filters.dataStatus !== 'todos' ? 1 : 0) +
    (quickLens !== 'all' ? 1 : 0);

  const toggleTheme = (theme: string) => {
    const exists = filters.temas.includes(theme);
    const next = exists
      ? filters.temas.filter((t) => t !== theme)
      : [...filters.temas, theme];
    onChange({ ...filters, temas: next });
  };

  const toggleEnabledPanel = (key: FilterPanelKey) => {
    if (enabledPanels.includes(key)) {
      setEnabledPanels((prev) => prev.filter((k) => k !== key));
      if (openPanel === key) setOpenPanel(null);
    } else {
      setEnabledPanels((prev) => [...prev, key]);
      setOpenPanel(key);
    }
  };

  const clearAll = () => {
    onChange({
      busca: '',
      temas: [],
      mesAno: 'todos',
      modalidade: 'todos',
      regiao: 'todos',
      dataStatus: 'todos',
    });
    onQuickLensChange('all');
    setOpenPanel(null);
  };

  const panelMeta: { key: FilterPanelKey; label: string; icon: typeof Tag }[] = [
    { key: 'temas', label: 'Especialidade / Tema', icon: Tag },
    { key: 'mesAno', label: 'Período (Mês/Ano)', icon: Calendar },
    { key: 'modalidade', label: 'Modalidade', icon: Sparkles },
    { key: 'regiao', label: 'Local / UF / País', icon: Globe2 },
    { key: 'dataStatus', label: 'Status da Data', icon: SlidersHorizontal },
  ];

  const lenses: { id: QuickLens; label: string; visible: boolean }[] = [
    { id: 'all', label: 'Todos', visible: true },
    { id: 'group', label: 'Com interesse no grupo', visible: hasGroupInterests },
    { id: 'my_areas', label: 'Meus temas', visible: hasMyAreas },
    { id: 'online', label: 'Online', visible: true },
    { id: 'intl', label: 'Internacionais', visible: true },
    { id: 'y2027', label: '2027', visible: true },
  ];

  return (
    <section className="relative z-20 space-y-3">
      {/* Linha 1 direto no canvas pontilhado: Busca + Escolher filtros + View Switch */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B655B]" />
          <input
            type="text"
            value={filters.busca}
            onChange={(e) => onChange({ ...filters, busca: e.target.value })}
            placeholder="Buscar congresso, sigla (ex.: CBR27), cidade ou especialidade..."
            className="w-full rounded-2xl border-2 border-[#211F1C] bg-white py-2.5 pl-11 pr-10 text-sm text-[#211F1C] shadow-[3px_3px_0px_#211F1C] placeholder:text-[#8E8679] transition-shadow focus:shadow-[4px_4px_0px_#B7CC49] focus:outline-none"
          />
          <AnimatePresence>
            {filters.busca && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={() => onChange({ ...filters, busca: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#6B655B] hover:bg-[#EFE8DA] hover:text-[#211F1C]"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setShowFilterChooser((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-2xl border-2 border-[#211F1C] px-3.5 py-2.5 text-xs font-bold transition-all ${
                showFilterChooser
                  ? 'bg-[#F3D2A2] text-[#211F1C] shadow-[2px_2px_0px_#211F1C]'
                  : 'bg-white text-[#211F1C] shadow-[3px_3px_0px_#211F1C] hover:bg-[#FDF6E9]'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Escolher filtros</span>
              <span className="rounded-full bg-[#211F1C] px-1.5 py-0.5 text-[10px] font-bold text-[#FAF7F1] tabular-nums">
                {enabledPanels.length}
              </span>
            </motion.button>

            <AnimatePresence>
              {showFilterChooser && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                  className="absolute right-0 mt-2 w-64 rounded-2xl border-2 border-[#211F1C] bg-white p-3 shadow-[4px_4px_0px_#211F1C] z-30"
                >
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6B655B]">
                    Filtros visíveis na barra
                  </div>
                  <div className="space-y-1">
                    {panelMeta.map((p) => {
                      const active = enabledPanels.includes(p.key);
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => toggleEnabledPanel(p.key)}
                          className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-medium transition-colors hover:bg-[#FAF7F1]"
                        >
                          <span className="flex items-center gap-2 text-[#211F1C]">
                            <Icon className="h-3.5 w-3.5 text-[#6B655B]" />
                            {p.label}
                          </span>
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border ${
                              active
                                ? 'border-[#211F1C] bg-[#B7CC49] text-[#211F1C]'
                                : 'border-[#CFC6B8] bg-white'
                            }`}
                          >
                            {active && <Check className="h-3 w-3 stroke-[3]" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View Mode Toggle movido para perto da lista */}
          <div className="inline-flex rounded-2xl border-2 border-[#211F1C] bg-white p-0.5 shadow-[3px_3px_0px_#211F1C]">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
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
              onClick={() => onViewModeChange('cards')}
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

          <span className="px-1 text-xs font-medium text-[#6B655B] tabular-nums">
            <strong className="font-bold text-[#211F1C]">{totalFiltered}</strong>/{totalAll}
          </span>
        </div>
      </div>

      {/* Linha 2: Atalhos rápidos (Quick Lenses) + Gatilhos de filtro sem box externo */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {lenses
            .filter((l) => l.visible)
            .map((l) => {
              const active = quickLens === l.id;
              return (
                <motion.button
                  key={l.id}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => onQuickLensChange(active && l.id !== 'all' ? 'all' : l.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    active
                      ? 'border-2 border-[#211F1C] bg-[#F3D2A2] text-[#211F1C] shadow-[2px_2px_0px_#211F1C]'
                      : 'text-[#5C554C] hover:bg-[#EFE8DA] hover:text-[#211F1C]'
                  }`}
                >
                  {l.label}
                </motion.button>
              );
            })}
        </div>

        <span className="hidden h-4 w-px bg-[#DCD3C4] sm:inline-block" />

        <div className="flex flex-wrap items-center gap-2">
          {enabledPanels.includes('temas') && (
            <FilterTriggerButton
              active={openPanel === 'temas'}
              hasValue={filters.temas.length > 0}
              label={
                filters.temas.length > 0
                  ? `Tema (${filters.temas.length})`
                  : 'Especialidade'
              }
              icon={<Tag className="h-3.5 w-3.5" />}
              onClick={() => setOpenPanel(openPanel === 'temas' ? null : 'temas')}
            />
          )}

          {enabledPanels.includes('mesAno') && (
            <FilterTriggerButton
              active={openPanel === 'mesAno'}
              hasValue={filters.mesAno !== 'todos'}
              label={
                filters.mesAno !== 'todos'
                  ? `Período: ${formatMonthKeyLabel(filters.mesAno)}`
                  : 'Período'
              }
              icon={<Calendar className="h-3.5 w-3.5" />}
              onClick={() => setOpenPanel(openPanel === 'mesAno' ? null : 'mesAno')}
            />
          )}

          {enabledPanels.includes('modalidade') && (
            <FilterTriggerButton
              active={openPanel === 'modalidade'}
              hasValue={filters.modalidade !== 'todos'}
              label={
                filters.modalidade !== 'todos'
                  ? `Modalidade: ${MODALIDADE_LABEL[filters.modalidade]}`
                  : 'Modalidade'
              }
              icon={<Sparkles className="h-3.5 w-3.5" />}
              onClick={() => setOpenPanel(openPanel === 'modalidade' ? null : 'modalidade')}
            />
          )}

          {enabledPanels.includes('regiao') && (
            <FilterTriggerButton
              active={openPanel === 'regiao'}
              hasValue={filters.regiao !== 'todos'}
              label={
                filters.regiao === 'todos'
                  ? 'Local / UF'
                  : filters.regiao === 'brasil'
                    ? 'Brasil'
                    : filters.regiao === 'exterior'
                      ? 'Exterior'
                      : `UF: ${filters.regiao.replace('UF:', '')}`
              }
              icon={<Globe2 className="h-3.5 w-3.5" />}
              onClick={() => setOpenPanel(openPanel === 'regiao' ? null : 'regiao')}
            />
          )}

          {enabledPanels.includes('dataStatus') && (
            <FilterTriggerButton
              active={openPanel === 'dataStatus'}
              hasValue={filters.dataStatus !== 'todos'}
              label={
                filters.dataStatus !== 'todos'
                  ? `Status: ${DATA_STATUS_LABEL[filters.dataStatus]}`
                  : 'Status da Data'
              }
              icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
              onClick={() => setOpenPanel(openPanel === 'dataStatus' ? null : 'dataStatus')}
            />
          )}

          <AnimatePresence>
            {activeCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-full bg-[#FDF4E3] px-3 py-1 text-xs font-semibold text-[#7A4F16] ring-1 ring-[#D49A4A] hover:bg-[#F9E8C6]"
              >
                <X className="h-3.5 w-3.5" />
                <span>Limpar ({activeCount})</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Painel expansível de filtros */}
      <AnimatePresence initial={false}>
        {openPanel && (
          <motion.div
            key={openPanel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border-2 border-[#211F1C] bg-white p-4 shadow-[4px_4px_0px_#211F1C]">
              {openPanel === 'temas' && (
                <div>
                  <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B655B]">
                      Selecione uma ou mais especialidades
                    </span>
                    <input
                      type="text"
                      value={themeQuery}
                      onChange={(e) => setThemeQuery(e.target.value)}
                      placeholder="Filtrar especialidades..."
                      className="rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] px-3 py-1.5 text-xs focus:border-[#211F1C] focus:bg-white focus:outline-none sm:w-56"
                    />
                  </div>
                  <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pr-1">
                    {filteredThemes.map((t) => {
                      const selected = filters.temas.includes(t.name);
                      return (
                        <motion.button
                          key={t.name}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={() => toggleTheme(t.name)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                            selected
                              ? 'border-[#211F1C] bg-[#B7CC49] text-[#211F1C] shadow-[1.5px_1.5px_0px_#211F1C]'
                              : 'border-[#DDD4C4] bg-[#FAF7F1] text-[#413D37] hover:border-[#211F1C] hover:bg-white'
                          }`}
                        >
                          <span>{t.name}</span>
                          <span className="rounded-full bg-black/5 px-1.5 text-[10px] tabular-nums">
                            {t.count}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {openPanel === 'mesAno' && (
                <div className="flex flex-wrap gap-1.5">
                  <ChipOption
                    selected={filters.mesAno === 'todos'}
                    label="Todos os períodos"
                    onClick={() => onChange({ ...filters, mesAno: 'todos' })}
                  />
                  {availableMonths.map((m) => (
                    <ChipOption
                      key={m.key}
                      selected={filters.mesAno === m.key}
                      label={`${formatMonthKeyLabel(m.key)} (${m.count})`}
                      onClick={() => onChange({ ...filters, mesAno: m.key })}
                    />
                  ))}
                </div>
              )}

              {openPanel === 'modalidade' && (
                <div className="flex flex-wrap gap-1.5">
                  {(['todos', 'presencial', 'online', 'hibrido', 'a_definir'] as const).map(
                    (mod) => (
                      <ChipOption
                        key={mod}
                        selected={filters.modalidade === mod}
                        label={mod === 'todos' ? 'Todas' : MODALIDADE_LABEL[mod as Modalidade]}
                        onClick={() => onChange({ ...filters, modalidade: mod })}
                      />
                    )
                  )}
                </div>
              )}

              {openPanel === 'regiao' && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    <ChipOption
                      selected={filters.regiao === 'todos'}
                      label="Todos os locais"
                      onClick={() => onChange({ ...filters, regiao: 'todos' })}
                    />
                    <ChipOption
                      selected={filters.regiao === 'brasil'}
                      label="Somente Brasil"
                      onClick={() => onChange({ ...filters, regiao: 'brasil' })}
                    />
                    <ChipOption
                      selected={filters.regiao === 'exterior'}
                      label="Exterior (Internacional)"
                      onClick={() => onChange({ ...filters, regiao: 'exterior' })}
                    />
                  </div>
                  <div className="border-t border-[#EFE8DA] pt-2">
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B655B]">
                      Estados (UF)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableUFs.map((u) => (
                        <ChipOption
                          key={u.uf}
                          selected={filters.regiao === `UF:${u.uf}`}
                          label={`${u.uf} (${u.count})`}
                          onClick={() => onChange({ ...filters, regiao: `UF:${u.uf}` })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {openPanel === 'dataStatus' && (
                <div className="flex flex-wrap gap-1.5">
                  {(['todos', 'confirmada', 'a_confirmar', 'a_definir'] as const).map((st) => (
                    <ChipOption
                      key={st}
                      selected={filters.dataStatus === st}
                      label={st === 'todos' ? 'Todos' : DATA_STATUS_LABEL[st as DataStatus]}
                      onClick={() => onChange({ ...filters, dataStatus: st })}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chips de temas ativos */}
      <AnimatePresence>
        {filters.temas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-wrap items-center gap-1.5"
          >
            <span className="text-[11px] font-semibold text-[#6B655B]">Temas ativos:</span>
            {filters.temas.map((t) => (
              <motion.button
                key={t}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                type="button"
                onClick={() => toggleTheme(t)}
                className="inline-flex items-center gap-1 rounded-full border border-[#211F1C] bg-[#F2F6DF] px-2.5 py-0.5 text-xs font-semibold text-[#211F1C] hover:bg-[#E4EEB8]"
              >
                <span>{t}</span>
                <X className="h-3 w-3" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function FilterTriggerButton({
  active,
  hasValue,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  hasValue: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-semibold transition-all ${
        active
          ? 'border-[#211F1C] bg-[#211F1C] text-[#FAF7F1]'
          : hasValue
            ? 'border-[#211F1C] bg-[#B7CC49] text-[#211F1C] shadow-[2px_2px_0px_#211F1C]'
            : 'border-[#DCD3C4] bg-white text-[#3F3B35] hover:border-[#211F1C]'
      }`}
    >
      {icon}
      <span>{label}</span>
      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${active ? 'rotate-180' : ''}`} />
    </motion.button>
  );
}

function ChipOption({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
        selected
          ? 'border-[#211F1C] bg-[#F3D2A2] text-[#211F1C] shadow-[1.5px_1.5px_0px_#211F1C]'
          : 'border-[#DDD4C4] bg-[#FAF7F1] text-[#413D37] hover:border-[#211F1C] hover:bg-white'
      }`}
    >
      {label}
    </motion.button>
  );
}
