import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Check,
  ChevronDown,
  Globe2,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import type { DataStatus, FilterState, Modalidade } from '../types/congresso';
import { DATA_STATUS_LABEL, MODALIDADE_LABEL, formatMonthKeyLabel } from '../lib/formatters';

interface FilterBarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
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
    (filters.dataStatus !== 'todos' ? 1 : 0);

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
    setOpenPanel(null);
  };

  const panelMeta: { key: FilterPanelKey; label: string; icon: typeof Tag }[] = [
    { key: 'temas', label: 'Especialidade / Tema', icon: Tag },
    { key: 'mesAno', label: 'Período (Mês/Ano)', icon: Calendar },
    { key: 'modalidade', label: 'Modalidade', icon: Sparkles },
    { key: 'regiao', label: 'Local / UF / País', icon: Globe2 },
    { key: 'dataStatus', label: 'Status da Data', icon: SlidersHorizontal },
  ];

  return (
    <section className="relative z-20 rounded-2xl border border-[#E6E0D5] bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8378]" />
          <input
            type="text"
            value={filters.busca}
            onChange={(e) => onChange({ ...filters, busca: e.target.value })}
            placeholder="Buscar por nome do congresso, sigla (ex.: CBR27), cidade ou especialidade..."
            className="w-full rounded-xl border border-[#E6E0D5] bg-[#F8F6F1] py-2.5 pl-10 pr-10 text-sm text-[#1F1D1A] placeholder:text-[#8A8378] transition-colors focus:border-[#5A6D3A] focus:bg-white focus:outline-none"
          />
          <AnimatePresence>
            {filters.busca && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                type="button"
                onClick={() => onChange({ ...filters, busca: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#5E584F] hover:bg-[#EFEBE2] hover:text-[#1F1D1A]"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterChooser((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                showFilterChooser
                  ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
                  : 'border-[#E6E0D5] bg-[#F8F6F1] text-[#1F1D1A] hover:border-[#CFC7B8]'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#5E584F]" />
              <span>Escolher filtros</span>
              <span className="text-[11px] text-[#5E584F] tabular-nums">
                ({enabledPanels.length})
              </span>
            </button>

            <AnimatePresence>
              {showFilterChooser && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 mt-2 w-64 rounded-xl border border-[#DCD4C6] bg-white p-2.5 shadow-lg z-30"
                >
                  <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#8A8378]">
                    Filtros ativos na barra
                  </div>
                  <div className="space-y-0.5">
                    {panelMeta.map((p) => {
                      const active = enabledPanels.includes(p.key);
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => toggleEnabledPanel(p.key)}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors hover:bg-[#F8F6F1]"
                        >
                          <span className="flex items-center gap-2 text-[#1F1D1A]">
                            <Icon className="h-3.5 w-3.5 text-[#5E584F]" />
                            {p.label}
                          </span>
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border ${
                              active
                                ? 'border-[#5A6D3A] bg-[#5A6D3A] text-white'
                                : 'border-[#CFC7B8] bg-white'
                            }`}
                          >
                            {active && <Check className="h-3 w-3" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="px-1 text-xs text-[#5E584F] tabular-nums">
            Exibindo <strong className="font-semibold text-[#1F1D1A]">{totalFiltered}</strong> de{' '}
            {totalAll}
          </span>
        </div>
      </div>

      {/* Filter dimension triggers */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {enabledPanels.includes('temas') && (
          <FilterTriggerButton
            active={openPanel === 'temas'}
            hasValue={filters.temas.length > 0}
            label={
              filters.temas.length > 0
                ? `Tema (${filters.temas.length})`
                : 'Especialidade / Tema'
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
                  ? 'Local: Brasil'
                  : filters.regiao === 'exterior'
                    ? 'Local: Exterior'
                    : `Local: ${filters.regiao.replace('UF:', '')}`
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded-full border border-[#DFCEB2] bg-[#F6EFE4] px-3 py-1.5 text-xs font-medium text-[#7A592A] transition-colors hover:bg-[#EFE2CE]"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpar filtros ({activeCount})</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Expandable Filter Tray */}
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
            <div className="mt-3 rounded-xl border border-[#E6E0D5] bg-[#F8F6F1] p-3.5">
              {openPanel === 'temas' && (
                <div>
                  <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5E584F]">
                      Selecione uma ou mais especialidades
                    </span>
                    <input
                      type="text"
                      value={themeQuery}
                      onChange={(e) => setThemeQuery(e.target.value)}
                      placeholder="Filtrar especialidades..."
                      className="rounded-lg border border-[#DCD4C6] bg-white px-3 py-1.5 text-xs focus:border-[#5A6D3A] focus:outline-none sm:w-56"
                    />
                  </div>
                  <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pr-1">
                    {filteredThemes.map((t) => {
                      const selected = filters.temas.includes(t.name);
                      return (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => toggleTheme(t.name)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            selected
                              ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
                              : 'border-[#E6E0D5] bg-white text-[#433F39] hover:border-[#CFC7B8]'
                          }`}
                        >
                          <span>{t.name}</span>
                          <span className="text-[10px] text-[#8A8378] tabular-nums">
                            {t.count}
                          </span>
                        </button>
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
                  <div className="border-t border-[#E6E0D5] pt-2">
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#5E584F]">
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

      {/* Active selected theme chips */}
      <AnimatePresence>
        {filters.temas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-[#EFEBE2] pt-2.5"
          >
            <span className="text-[11px] font-medium text-[#5E584F]">Temas ativos:</span>
            {filters.temas.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTheme(t)}
                className="inline-flex items-center gap-1 rounded-full border border-[#CED9BC] bg-[#EEF2E7] px-2.5 py-0.5 text-xs font-medium text-[#35441E] hover:bg-[#E4ECD8]"
              >
                <span>{t}</span>
                <X className="h-3 w-3" />
              </button>
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
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-[#1F1D1A] bg-[#1F1D1A] text-[#F8F6F1]'
          : hasValue
            ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
            : 'border-[#E6E0D5] bg-white text-[#433F39] hover:border-[#CFC7B8] hover:bg-[#FAF8F4]'
      }`}
    >
      {icon}
      <span>{label}</span>
      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${active ? 'rotate-180' : ''}`} />
    </button>
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
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        selected
          ? 'border-[#8F6B3A] bg-[#F6EFE4] text-[#5C411D]'
          : 'border-[#E6E0D5] bg-white text-[#433F39] hover:border-[#CFC7B8]'
      }`}
    >
      {label}
    </button>
  );
}
