import type { Congresso, DataStatus, InterestLevel, Modalidade } from '../types/congresso';

const MESES_CURTOS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

const MESES_LONGOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function parseIsoParts(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

export function formatDateRange(c: Congresso): string {
  if (!c.data_inicio) {
    return 'Data a definir';
  }
  const ini = parseIsoParts(c.data_inicio);
  if (!ini) return c.data_inicio;
  const fim = c.data_fim ? parseIsoParts(c.data_fim) : null;

  if (!fim || (ini.y === fim.y && ini.m === fim.m && ini.d === fim.d)) {
    return `${ini.d} de ${MESES_CURTOS[ini.m - 1]}. de ${ini.y}`;
  }

  if (ini.y === fim.y && ini.m === fim.m) {
    return `${ini.d}–${fim.d} de ${MESES_CURTOS[ini.m - 1]}. de ${ini.y}`;
  }

  if (ini.y === fim.y) {
    return `${ini.d}/${String(ini.m).padStart(2, '0')} a ${fim.d}/${String(ini.m).padStart(2, '0')}/${ini.y}`;
  }

  return `${ini.d}/${String(ini.m).padStart(2, '0')}/${ini.y} a ${fim.d}/${String(ini.m).padStart(2, '0')}/${fim.y}`;
}

export function formatMonthGroup(iso: string | null): string {
  if (!iso) return 'Datas a definir';
  const p = parseIsoParts(iso);
  if (!p) return 'Datas a definir';
  return `${MESES_LONGOS[p.m - 1]} de ${p.y}`;
}

export function getMonthKey(iso: string | null): string {
  if (!iso || iso.length < 7) return 'a_definir';
  return iso.slice(0, 7);
}

export function formatMonthKeyLabel(key: string): string {
  if (key === 'a_definir') return 'A definir';
  const [y, m] = key.split('-');
  const idx = Number(m) - 1;
  if (idx < 0 || idx > 11) return key;
  return `${MESES_CURTOS[idx].toUpperCase()}/${y}`;
}

export const MODALIDADE_LABEL: Record<Modalidade, string> = {
  presencial: 'Presencial',
  online: 'Online',
  hibrido: 'Híbrido',
  a_definir: 'A definir',
};

export const DATA_STATUS_LABEL: Record<DataStatus, string> = {
  confirmada: 'Confirmada',
  a_confirmar: 'A confirmar',
  a_definir: 'A definir',
};

export const INTEREST_LEVEL_LABEL: Record<InterestLevel, string> = {
  escrever_artigo: 'Escrever artigo em grupo',
  prioritario: 'Prioritário',
  interessado: 'Interessado',
};

export function buildGoogleSearchUrl(c: Congresso): string {
  const year = c.data_inicio ? c.data_inicio.slice(0, 4) : '2027';
  const place =
    c.local_formatado && c.local_formatado !== 'Online' && c.local_formatado !== 'A definir'
      ? c.cidade || c.local_formatado
      : '';
  const query = [c.nome, place, year, 'site oficial submissão trabalhos programação']
    .filter(Boolean)
    .join(' ');
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function buildWhatsAppShareUrl(c: Congresso, extraNote?: string): string {
  const data = formatDateRange(c);
  const obs = c.data_observacao ? ` (${c.data_observacao})` : '';
  const tema = c.temas.length > 0 ? c.temas.join(', ') : c.tema_principal;
  const googleUrl = buildGoogleSearchUrl(c);

  const lines = [
    `*Destilaria Research Group — Sugestão de Congresso*`,
    ``,
    `*${c.nome}*`,
    `Quando: ${data}${obs}`,
    `Local: ${c.local_formatado} (${MODALIDADE_LABEL[c.modalidade]})`,
    `Tema: ${tema}`,
  ];
  if (extraNote?.trim()) {
    lines.push(`Ideia / foco de artigo: ${extraNote.trim()}`);
  }
  lines.push(`Pesquisa rápida: ${googleUrl}`);
  lines.push(``, `Alguém tem interesse em montar grupo para submeter trabalho?`);

  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildWhatsAppBulkShareUrl(items: Congresso[]): string {
  const text = exportPlainLanguageText(items);
  const trimmed =
    text.length > 1800
      ? text.slice(0, 1750) + '\n\n(...lista resumida — veja todos na plataforma)'
      : text;
  return `https://wa.me/?text=${encodeURIComponent(trimmed)}`;
}

export function exportPlainLanguageText(
  items: Congresso[],
  titulo = 'Seleção de Congressos Médicos — Destilaria Research Group'
): string {
  if (items.length === 0) return 'Nenhum congresso selecionado.';

  const groups = new Map<string, Congresso[]>();
  for (const item of items) {
    const key = formatMonthGroup(item.data_inicio);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  const lines: string[] = [
    titulo,
    `Total: ${items.length} ${items.length === 1 ? 'evento' : 'eventos'}`,
    '',
  ];

  for (const [monthLabel, events] of groups.entries()) {
    lines.push(`=== ${monthLabel} ===`);
    for (const ev of events) {
      const data = formatDateRange(ev);
      const obs = ev.data_observacao ? ` (${ev.data_observacao})` : '';
      const mod = MODALIDADE_LABEL[ev.modalidade];
      const local =
        ev.local_formatado === 'Online' ? '100% Online' : `${ev.local_formatado} · ${mod}`;
      const tema = ev.temas.length > 0 ? ev.temas.join(', ') : ev.tema_principal;
      lines.push(`• ${ev.nome}`);
      lines.push(`  Quando: ${data}${obs}`);
      lines.push(`  Onde: ${local}`);
      lines.push(`  Tema: ${tema}`);
      lines.push(`  Buscar detalhes: ${buildGoogleSearchUrl(ev)}`);
      lines.push('');
    }
  }

  lines.push('Organizado pelo Destilaria Research Group');
  return lines.join('\n').trim();
}

export function exportMarkdown(items: Congresso[]): string {
  const header = [
    '# Seleção de Congressos Médicos — Destilaria Research Group',
    '',
    `Total de eventos: **${items.length}**`,
    '',
    '| Congresso | Data | Local | Modalidade | Tema Principal |',
    '|---|---|---|---|---|',
  ];
  const rows = items.map((ev) => {
    const data = formatDateRange(ev) + (ev.data_observacao ? ` (${ev.data_observacao})` : '');
    const nome = ev.nome.replace(/\|/g, '\\|');
    const local = ev.local_formatado.replace(/\|/g, '\\|');
    const tema = ev.tema_principal.replace(/\|/g, '\\|');
    return `| ${nome} | ${data} | ${local} | ${MODALIDADE_LABEL[ev.modalidade]} | ${tema} |`;
  });
  return [...header, ...rows].join('\n');
}

export function exportCsv(items: Congresso[]): string {
  const esc = (v: string | null | undefined) => {
    const s = v ?? '';
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = [
    'Congresso',
    'Data Inicio',
    'Data Fim',
    'Observacao Data',
    'Modalidade',
    'Local',
    'Tema Principal',
    'Temas',
    'Fontes',
  ].join(',');
  const rows = items.map((ev) =>
    [
      esc(ev.nome),
      esc(ev.data_inicio),
      esc(ev.data_fim),
      esc(ev.data_observacao),
      esc(MODALIDADE_LABEL[ev.modalidade]),
      esc(ev.local_formatado),
      esc(ev.tema_principal),
      esc(ev.temas.join('; ')),
      esc(ev.fontes.join('; ')),
    ].join(',')
  );
  return '\uFEFF' + [header, ...rows].join('\n');
}
