import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  Check,
  ChevronRight,
  MapPin,
  Minus,
} from 'lucide-react';
import type { Congresso, SortDirection, SortField } from '../types/congresso';
import { MODALIDADE_LABEL, formatDateRange } from '../lib/formatters';
import { EmptyCaneIllustration } from './BrandLogo';

interface CongressTableProps {
  items: Congresso[];
  viewMode: 'table' | 'cards';
  selectedSlugs: Set<string>;
  onToggleSelect: (slug: string) => void;
  onToggleSelectAllFiltered: () => void;
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
  onToggleSelect,
  onToggleSelectAllFiltered,
  onOpenDetail,
  sortField,
  sortDir,
  onSort,
  onClearFilters,
}: CongressTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-[#211F1C] bg-white px-6 py-14 text-center shadow-[5px_5px_0px_#211F1C]">
        <EmptyCaneIllustration />
        <h3 className="font-display text-lg font-bold text-[#211F1C]">
          Nenhum congresso encontrado com esses filtros
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-[#6B655B]">
          Experimente remover um dos filtros ativos ou buscar por outra cidade ou especialidade.
        </p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={onClearFilters}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl border-2 border-[#211F1C] bg-[#F3D2A2] px-4 py-2 text-xs font-bold text-[#211F1C] shadow-[2px_2px_0px_#211F1C] hover:bg-[#EFC384]"
        >
          Limpar todos os filtros
        </motion.button>
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
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#5C554C] hover:text-[#211F1C]"
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
            return (
              <motion.article
                key={c.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(idx * 0.015, 0.22) }}
                whileHover={{ y: -3 }}
                onClick={() => onOpenDetail(c)}
                className={`group relative flex cursor-pointer flex-col justify-between rounded-3xl border-2 p-4 transition-shadow ${
                  checked
                    ? 'border-[#211F1C] bg-[#FDF6E9] shadow-[5px_5px_0px_#B7CC49]'
                    : 'border-[#211F1C] bg-white shadow-[4px_4px_0px_#211F1C] hover:shadow-[6px_6px_0px_#211F1C]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center rounded-full border border-[#211F1C] bg-[#F2F6DF] px-2.5 py-0.5 text-[11px] font-bold text-[#211F1C]">
                      {c.tema_principal}
                    </span>
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

                  <h3 className="mt-3 font-display text-[15px] font-bold leading-snug text-[#211F1C] group-hover:underline">
                    {c.nome}
                  </h3>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-[#EFE8DA] pt-3 text-xs text-[#5C554C]">
                  <div className="flex items-center gap-2 font-medium text-[#211F1C]">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-[#859D20]" />
                    <span className="tabular-nums">{formatDateRange(c)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#D49A4A]" />
                      <span className="truncate">{c.local_formatado}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[#FAF7F1] px-2 py-0.5 text-[10px] font-semibold text-[#6B655B] border border-[#E4DDD0]">
                      {MODALIDADE_LABEL[c.modalidade]}
                    </span>
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
    <div className="overflow-hidden rounded-3xl border-2 border-[#211F1C] bg-white shadow-[5px_5px_0px_#211F1C]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-[#211F1C] bg-[#FDF6E9] text-[11px] font-bold uppercase tracking-wider text-[#5C554C]">
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
                className="min-w-[210px]"
              />
              <th className="w-10 px-3 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE8DA]">
            {items.map((c, idx) => {
              const checked = selectedSlugs.has(c.slug);
              return (
                <motion.tr
                  key={c.slug}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.16, delay: Math.min(idx * 0.008, 0.16) }}
                  onClick={() => onOpenDetail(c)}
                  className={`group cursor-pointer transition-colors ${
                    checked ? 'bg-[#FDF4E3]/80' : 'hover:bg-[#FAF7F1]'
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
                    <div className="font-semibold text-[#211F1C] tabular-nums text-xs sm:text-[13px]">
                      {formatDateRange(c)}
                    </div>
                    {c.data_observacao && (
                      <div className="mt-0.5 text-[11px] text-[#8E6528]">{c.data_observacao}</div>
                    )}
                  </td>

                  <td className="px-4 py-3.5 align-top">
                    <div className="font-display font-bold text-[#211F1C] group-hover:underline text-[13px] sm:text-sm leading-snug">
                      {c.nome}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-[#E4DDD0] bg-[#FAF7F1] px-2 py-0.5 text-[10px] font-semibold text-[#6B655B]">
                        {MODALIDADE_LABEL[c.modalidade]}
                      </span>
                      <span className="text-[10px] text-[#8E8679]">
                        {c.fontes.length} {c.fontes.length === 1 ? 'fonte' : 'fontes'}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-top text-xs sm:text-[13px] text-[#3F3B35]">
                    {c.local_formatado}
                  </td>

                  <td className="px-4 py-3.5 align-top">
                    <span className="inline-block rounded-full border border-[#211F1C] bg-[#F2F6DF] px-2.5 py-0.5 text-[11px] font-bold text-[#211F1C]">
                      {c.tema_principal}
                    </span>
                    {c.temas.length > 1 && (
                      <div className="mt-1 text-[11px] text-[#6B655B] line-clamp-1">
                        +{c.temas.slice(1).join(', ')}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-3.5 align-middle text-[#8E8679] group-hover:text-[#211F1C]">
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
        className="inline-flex items-center gap-1.5 text-left font-bold uppercase tracking-wider text-[#5C554C] hover:text-[#211F1C]"
      >
        <span>{label}</span>
        {active ? (
          dir === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-[#211F1C]" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-[#211F1C]" />
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
      animate={{ scale: checked || indeterminate ? [1, 1.15, 1] : 1 }}
      transition={{ duration: 0.18 }}
      className={`inline-flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
        checked || indeterminate
          ? 'border-[#211F1C] bg-[#B7CC49] text-[#211F1C] shadow-[1.5px_1.5px_0px_#211F1C]'
          : 'border-[#BDB4A4] bg-white hover:border-[#211F1C]'
      }`}
    >
      {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
      {!checked && indeterminate && <Minus className="h-3.5 w-3.5 stroke-[3]" />}
    </motion.span>
  );
}
