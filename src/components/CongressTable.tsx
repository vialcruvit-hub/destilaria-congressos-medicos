import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bookmark,
  Calendar,
  Check,
  ChevronRight,
  ExternalLink,
  MapPin,
  Minus,
  Users,
} from 'lucide-react';
import type { Congresso, SortDirection, SortField } from '../types/congresso';
import { MODALIDADE_LABEL, buildGoogleSearchUrl, formatDateRange } from '../lib/formatters';
import { EmptyCaneIllustration } from './BrandLogo';

interface CongressTableProps {
  items: Congresso[];
  viewMode: 'table' | 'cards';
  selectedSlugs: Set<string>;
  myInterestSlugs: Set<string>;
  interestCounts: Map<string, number>;
  onToggleSelect: (slug: string) => void;
  onToggleSelectAllFiltered: () => void;
  onToggleInterest: (c: Congresso) => void;
  onOpenDetail: (c: Congresso) => void;
  sortField: SortField;
  sortDir: SortDirection;
  onSort: (field: SortField) => void;
  onClearFilters: () => void;
}

export function CongressTable({
  items,
  viewMode,
  selectedSlugs,
  myInterestSlugs,
  interestCounts,
  onToggleSelect,
  onToggleSelectAllFiltered,
  onToggleInterest,
  onOpenDetail,
  sortField,
  sortDir,
  onSort,
  onClearFilters,
}: CongressTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E6E0D5] bg-white px-6 py-14 text-center shadow-xs">
        <EmptyCaneIllustration />
        <h3 className="font-editorial text-xl font-medium text-[#1F1D1A]">
          Nenhum congresso encontrado com esses filtros
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-[#5E584F]">
          Experimente remover um dos filtros ativos ou buscar por outra cidade ou especialidade.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#E6E0D5] bg-[#F8F6F1] px-4 py-2 text-xs font-semibold text-[#1F1D1A] hover:border-[#CFC7B8]"
        >
          Limpar todos os filtros
        </button>
      </div>
    );
  }

  const selectedInFiltered = items.filter((i) => selectedSlugs.has(i.slug)).length;
  const allSelected = selectedInFiltered === items.length && items.length > 0;
  const someSelected = selectedInFiltered > 0 && !allSelected;

  if (viewMode === 'cards') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={onToggleSelectAllFiltered}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#5E584F] hover:text-[#1F1D1A]"
          >
            <CheckboxBox checked={allSelected} indeterminate={someSelected} />
            <span>
              {allSelected
                ? 'Desmarcar todos os filtrados'
                : `Selecionar todos os ${items.length} filtrados`}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((c, idx) => {
            const checked = selectedSlugs.has(c.slug);
            const interested = myInterestSlugs.has(c.slug);
            const groupCount = interestCounts.get(c.slug) ?? 0;

            return (
              <motion.article
                key={c.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.22,
                  delay: Math.min(idx * 0.012, 0.18),
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -2 }}
                onClick={() => onOpenDetail(c)}
                className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all ${
                  checked
                    ? 'border-[#5A6D3A] bg-[#F6F8F2] shadow-sm'
                    : 'border-[#E6E0D5] bg-white shadow-xs hover:border-[#CFC7B8] hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center rounded-md bg-[#EEF2E7] px-2.5 py-0.5 text-[11px] font-medium text-[#45562B]">
                      {c.tema_principal}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleInterest(c);
                        }}
                        title={
                          interested
                            ? 'Remover interesse para artigo'
                            : 'Marcar interesse para escrever artigo'
                        }
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
                          interested
                            ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
                            : 'border-[#E6E0D5] bg-white text-[#5E584F] hover:text-[#1F1D1A]'
                        }`}
                      >
                        <Bookmark className={`h-3 w-3 ${interested ? 'fill-current' : ''}`} />
                        {groupCount > 0 && <span className="tabular-nums">{groupCount}</span>}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelect(c.slug);
                        }}
                        aria-label={`Selecionar ${c.nome}`}
                        className="p-0.5"
                      >
                        <CheckboxBox checked={checked} />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-3 font-display text-[15px] font-semibold leading-snug text-[#1F1D1A] group-hover:text-[#5A6D3A]">
                    {c.nome}
                  </h3>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-[#EFEBE2] pt-3 text-xs text-[#5E584F]">
                  <div className="flex items-center gap-2 font-medium text-[#1F1D1A]">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-[#5A6D3A]" />
                    <span className="tabular-nums">{formatDateRange(c)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#8F6B3A]" />
                      <span className="truncate">{c.local_formatado}</span>
                    </span>
                    <a
                      href={buildGoogleSearchUrl(c)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#E6E0D5] bg-[#F8F6F1] px-2 py-0.5 text-[11px] font-medium text-[#5E584F] hover:border-[#CFC7B8] hover:text-[#1F1D1A]"
                    >
                      <span>Google</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E6E0D5] bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E6E0D5] bg-[#F8F6F1] text-[11px] font-semibold uppercase tracking-wider text-[#5E584F]">
              <th className="w-11 px-4 py-3.5">
                <button
                  type="button"
                  onClick={onToggleSelectAllFiltered}
                  aria-label="Selecionar todos os filtrados"
                  className="flex items-center justify-center"
                >
                  <CheckboxBox checked={allSelected} indeterminate={someSelected} />
                </button>
              </th>
              <SortableTh
                label="Data"
                active={sortField === 'data'}
                dir={sortDir}
                onClick={() => onSort('data')}
                className="min-w-[165px]"
              />
              <SortableTh
                label="Congresso"
                active={sortField === 'nome'}
                dir={sortDir}
                onClick={() => onSort('nome')}
                className="min-w-[270px]"
              />
              <SortableTh
                label="Local"
                active={sortField === 'local'}
                dir={sortDir}
                onClick={() => onSort('local')}
                className="min-w-[180px]"
              />
              <SortableTh
                label="Tema / Especialidade"
                active={sortField === 'tema'}
                dir={sortDir}
                onClick={() => onSort('tema')}
                className="min-w-[200px]"
              />
              <th className="w-28 px-3 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFEBE2]">
            {items.map((c, idx) => {
              const checked = selectedSlugs.has(c.slug);
              const interested = myInterestSlugs.has(c.slug);
              const groupCount = interestCounts.get(c.slug) ?? 0;

              return (
                <motion.tr
                  key={c.slug}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.16, delay: Math.min(idx * 0.006, 0.14) }}
                  onClick={() => onOpenDetail(c)}
                  className={`group cursor-pointer transition-colors ${
                    checked ? 'bg-[#EEF2E7]/55' : 'hover:bg-[#FAF8F4]'
                  }`}
                >
                  <td
                    className="px-4 py-3.5 align-top"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(c.slug);
                    }}
                  >
                    <CheckboxBox checked={checked} />
                  </td>

                  <td className="px-4 py-3.5 align-top">
                    <div className="text-xs sm:text-[13px] font-medium text-[#1F1D1A] tabular-nums">
                      {formatDateRange(c)}
                    </div>
                    {c.data_observacao && (
                      <div className="mt-0.5 text-[11px] text-[#8F6B3A]">{c.data_observacao}</div>
                    )}
                  </td>

                  <td className="px-4 py-3.5 align-top">
                    <div className="font-display text-[13px] sm:text-sm font-semibold leading-snug text-[#1F1D1A] group-hover:text-[#5A6D3A]">
                      {c.nome}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#8A8378]">
                      <span>{MODALIDADE_LABEL[c.modalidade]}</span>
                      <span>·</span>
                      <span>
                        {c.fontes.length} {c.fontes.length === 1 ? 'fonte' : 'fontes'}
                      </span>
                      {groupCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 font-medium text-[#5A6D3A]">
                            <Users className="h-3 w-3" />
                            {groupCount} no grupo
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-top text-xs sm:text-[13px] text-[#433F39]">
                    {c.local_formatado}
                  </td>

                  <td className="px-4 py-3.5 align-top">
                    <span className="inline-block rounded-md bg-[#EEF2E7] px-2.5 py-0.5 text-[11px] font-medium text-[#45562B]">
                      {c.tema_principal}
                    </span>
                    {c.temas.length > 1 && (
                      <div className="mt-1 line-clamp-1 text-[11px] text-[#8A8378]">
                        +{c.temas.slice(1).join(', ')}
                      </div>
                    )}
                  </td>

                  <td
                    className="px-3 py-3.5 align-top text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleInterest(c)}
                        title={
                          interested
                            ? 'Remover interesse para artigo'
                            : 'Marcar interesse para escrever artigo'
                        }
                        className={`rounded-lg border p-1.5 transition-colors ${
                          interested
                            ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
                            : 'border-[#E6E0D5] bg-white text-[#8A8378] hover:border-[#CFC7B8] hover:text-[#1F1D1A]'
                        }`}
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${interested ? 'fill-current' : ''}`} />
                      </button>

                      <a
                        href={buildGoogleSearchUrl(c)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Pesquisar informações no Google"
                        className="rounded-lg border border-[#E6E0D5] bg-white p-1.5 text-[#8A8378] transition-colors hover:border-[#CFC7B8] hover:text-[#1F1D1A]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => onOpenDetail(c)}
                        aria-label={`Ver detalhes de ${c.nome}`}
                        className="rounded-lg p-1.5 text-[#8A8378] hover:text-[#1F1D1A]"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
  className = '',
}: {
  label: string;
  active: boolean;
  dir: SortDirection;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={`px-4 py-3.5 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 text-left font-semibold uppercase tracking-wider text-[#5E584F] hover:text-[#1F1D1A]"
      >
        <span>{label}</span>
        {active ? (
          dir === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-[#1F1D1A]" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-[#1F1D1A]" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-45" />
        )}
      </button>
    </th>
  );
}

function CheckboxBox({
  checked,
  indeterminate = false,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) {
  return (
    <motion.span
      animate={{ scale: checked || indeterminate ? [1, 1.08, 1] : 1 }}
      transition={{ duration: 0.16 }}
      className={`inline-flex h-4.5 w-4.5 items-center justify-center rounded border transition-colors ${
        checked || indeterminate
          ? 'border-[#5A6D3A] bg-[#5A6D3A] text-white'
          : 'border-[#CFC7B8] bg-white hover:border-[#5A6D3A]'
      }`}
    >
      {checked && <Check className="h-3 w-3 stroke-[2.8]" />}
      {!checked && indeterminate && <Minus className="h-3 w-3 stroke-[2.8]" />}
    </motion.span>
  );
}
