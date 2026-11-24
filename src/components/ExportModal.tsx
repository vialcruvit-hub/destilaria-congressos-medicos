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
            className="absolute inset-0 bg-[#1F1D1A]/35 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#DCD4C6] bg-[#F8F6F1] shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[#E6E0D5] bg-white px-6 py-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[#5A6D3A]">
                  {isSelection ? 'Lista selecionada' : 'Lista filtrada atual'}
                </div>
                <h2 className="mt-1 font-editorial text-2xl font-medium text-[#1F1D1A]">
                  Exportar {items.length} {items.length === 1 ? 'congresso' : 'congressos'}
                </h2>
                <p className="text-xs text-[#5E584F]">
                  Texto organizado com links de busca rápida no Google para compartilhar no WhatsApp
                  do grupo.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#E6E0D5] bg-[#F8F6F1] p-1.5 text-[#5E584F] hover:text-[#1F1D1A]"
                aria-label="Fechar exportação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-[#E6E0D5] bg-[#FAF8F4] px-6 py-3">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'border-[#1F1D1A] bg-[#1F1D1A] text-[#F8F6F1]'
                        : 'border-[#E6E0D5] bg-white text-[#433F39] hover:border-[#CFC7B8]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-auto p-5">
              <pre className="whitespace-pre-wrap rounded-xl border border-[#E6E0D5] bg-white p-4 font-mono text-xs leading-relaxed text-[#1F1D1A]">
                {content}
              </pre>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E6E0D5] bg-white px-6 py-3.5">
              <span className="text-xs text-[#5E584F]">
                Destilaria Research Group · Formato{' '}
                <strong className="text-[#1F1D1A]">{tab.toUpperCase()}</strong>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={buildWhatsAppBulkShareUrl(items)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#CED9BC] bg-[#EEF2E7] px-3.5 py-2 text-xs font-semibold text-[#35441E] transition-colors hover:bg-[#E4ECD8]"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Enviar no WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCD4C6] bg-[#F8F6F1] px-3.5 py-2 text-xs font-semibold text-[#1F1D1A] transition-colors hover:border-[#CFC7B8]"
                >
                  {copied ? <Check className="h-4 w-4 text-[#5A6D3A]" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copiado!' : 'Copiar texto'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F1D1A] px-4 py-2 text-xs font-semibold text-[#F8F6F1] transition-colors hover:bg-[#35322D]"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar arquivo</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
