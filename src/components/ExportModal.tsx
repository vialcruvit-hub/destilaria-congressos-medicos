import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  Sparkles,
  X,
} from 'lucide-react';
import type { Congresso } from '../types/congresso';
import {
  buildWhatsAppBulkShareUrl,
  exportCsv,
  exportMarkdown,
  exportPlainLanguageText,
} from '../lib/formatters';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  items: Congresso[];
  isSelection: boolean;
}

type ExportTab = 'texto' | 'markdown' | 'csv' | 'json';

export function ExportModal({ open, onClose, items, isSelection }: ExportModalProps) {
  const [tab, setTab] = useState<ExportTab>('texto');
  const [copied, setCopied] = useState(false);

  const content = useMemo(() => {
    if (tab === 'texto') return exportPlainLanguageText(items);
    if (tab === 'markdown') return exportMarkdown(items);
    if (tab === 'csv') return exportCsv(items);
    return JSON.stringify(items, null, 2);
  }, [tab, items]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = tab === 'texto' ? 'txt' : tab === 'markdown' ? 'md' : tab;
    const mime =
      tab === 'csv'
        ? 'text/csv;charset=utf-8'
        : tab === 'json'
          ? 'application/json;charset=utf-8'
          : 'text/plain;charset=utf-8';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `destilaria-congressos-${items.length}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: ExportTab; label: string; icon: typeof FileText }[] = [
    { id: 'texto', label: 'Linguagem Simples', icon: Sparkles },
    { id: 'markdown', label: 'Markdown', icon: FileText },
    { id: 'csv', label: 'Planilha CSV', icon: FileSpreadsheet },
    { id: 'json', label: 'JSON', icon: FileText },
  ];

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
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border-2 border-[#211F1C] bg-[#FAF7F1] shadow-[8px_8px_0px_#211F1C]"
          >
            <div className="flex items-start justify-between border-b-2 border-[#211F1C] bg-[#FDF6E9] px-5 py-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6D1F]">
                  {isSelection ? 'Lista selecionada' : 'Lista filtrada atual'}
                </span>
                <h2 className="mt-0.5 font-display text-lg sm:text-xl font-extrabold text-[#211F1C]">
                  Exportar {items.length} {items.length === 1 ? 'congresso' : 'congressos'}
                </h2>
                <p className="text-xs text-[#6B655B]">
                  Pronto para enviar no grupo do WhatsApp, e-mail ou abrir em planilhas.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border-2 border-[#211F1C] bg-white p-1.5 text-[#211F1C] transition-colors hover:bg-[#F3D2A2]"
                aria-label="Fechar exportação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-[#E4DDD0] bg-white px-5 py-3">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? 'border-[#211F1C] bg-[#211F1C] text-[#FAF7F1]'
                        : 'border-[#DDD4C4] bg-[#FAF7F1] text-[#3F3B35] hover:border-[#211F1C]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-auto p-5">
              <pre className="whitespace-pre-wrap rounded-2xl border border-[#DDD4C4] bg-white p-4 font-mono text-xs leading-relaxed text-[#211F1C]">
                {content}
              </pre>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#211F1C] bg-white px-5 py-3.5">
              <span className="text-xs text-[#6B655B]">
                Destilaria Research Group ·{' '}
                <strong className="text-[#211F1C]">{tab.toUpperCase()}</strong>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <motion.a
                  whileTap={{ scale: 0.96 }}
                  href={buildWhatsAppBulkShareUrl(items)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#211F1C] bg-[#B7CC49] px-3.5 py-2 text-xs font-bold text-[#211F1C] shadow-[2px_2px_0px_#211F1C] hover:bg-[#A6BD36]"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </motion.a>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#211F1C] bg-[#F3D2A2] px-3.5 py-2 text-xs font-bold text-[#211F1C] shadow-[2px_2px_0px_#211F1C] hover:bg-[#EFC384]"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copiado!' : 'Copiar texto'}</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#211F1C] bg-[#211F1C] px-4 py-2 text-xs font-bold text-[#FAF7F1] shadow-[2px_2px_0px_#B7CC49] hover:bg-[#35322D]"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar arquivo</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
