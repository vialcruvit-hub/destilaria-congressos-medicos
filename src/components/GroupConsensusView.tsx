import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  ExternalLink,
  Lock,
  MessageCircle,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import type {
  Congresso,
  MemberCongressInterest,
  MemberProfile,
} from '../types/congresso';
import {
  INTEREST_LEVEL_LABEL,
  buildGoogleSearchUrl,
  buildWhatsAppShareUrl,
  formatDateRange,
} from '../lib/formatters';

interface GroupConsensusViewProps {
  isAuthenticated: boolean;
  currentUserId: string | null;
  congressos: Congresso[];
  profiles: MemberProfile[];
  interests: MemberCongressInterest[];
  onOpenAuth: () => void;
  onOpenTypeform: () => void;
  onOpenDetail: (c: Congresso) => void;
  onToggleInterest: (c: Congresso) => void;
}

export function GroupConsensusView({
  isAuthenticated,
  currentUserId,
  congressos,
  profiles,
  interests,
  onOpenAuth,
  onOpenTypeform,
  onOpenDetail,
  onToggleInterest,
}: GroupConsensusViewProps) {
  const profileMap = useMemo(() => {
    const m = new Map<string, MemberProfile>();
    for (const p of profiles) m.set(p.user_id, p);
    return m;
  }, [profiles]);

  const congressMap = useMemo(() => {
    const m = new Map<string, Congresso>();
    for (const c of congressos) m.set(c.slug, c);
    return m;
  }, [congressos]);

  const rankedCongresses = useMemo(() => {
    const bySlug = new Map<string, MemberCongressInterest[]>();
    for (const item of interests) {
      const list = bySlug.get(item.congress_slug) ?? [];
      list.push(item);
      bySlug.set(item.congress_slug, list);
    }

    return Array.from(bySlug.entries())
      .map(([slug, items]) => ({
        congresso: congressMap.get(slug),
        items,
      }))
      .filter((x): x is { congresso: Congresso; items: MemberCongressInterest[] } =>
        Boolean(x.congresso)
      )
      .sort(
        (a, b) =>
          b.items.length - a.items.length ||
          (a.congresso.data_inicio ?? '9999').localeCompare(b.congresso.data_inicio ?? '9999')
      );
  }, [interests, congressMap]);

  const topThemes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of profiles) {
      for (const area of p.areas_of_interest) {
        counts.set(area, (counts.get(area) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [profiles]);

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-[#E6E0D5] bg-white px-6 py-14 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E6E0D5] bg-[#F8F6F1] text-[#5A6D3A]">
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="font-editorial text-2xl font-medium text-[#1F1D1A]">
          Consenso e Grupos de Artigos
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[#5E584F]">
          Entre com sua conta ou utilize o token de convite enviado pelo grupo para visualizar quais
          congressos reúnem mais membros interessados em produzir artigos juntos.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1F1D1A] px-5 py-2.5 text-xs font-semibold text-[#F8F6F1] hover:bg-[#35322D]"
        >
          <span>Entrar ou criar conta com token</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E6E0D5] bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-editorial text-xl font-medium text-[#1F1D1A]">
            Interesses em comum do grupo ({profiles.length}{' '}
            {profiles.length === 1 ? 'membro' : 'membros'})
          </h2>
          <p className="mt-0.5 text-xs text-[#5E584F]">
            Identifique convergências para formar grupos de escrita e alinhar submissões no WhatsApp.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenTypeform}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#CED9BC] bg-[#EEF2E7] px-3.5 py-2 text-xs font-semibold text-[#35441E] hover:bg-[#E4ECD8]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Atualizar meu questionário</span>
        </button>
      </div>

      {/* Top Shared Areas */}
      {topThemes.length > 0 && (
        <section className="rounded-2xl border border-[#E6E0D5] bg-white p-5">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#5E584F]">
            Áreas mais escolhidas pelos membros
          </div>
          <div className="flex flex-wrap gap-2">
            {topThemes.map((t) => (
              <span
                key={t.name}
                className="inline-flex items-center gap-2 rounded-full border border-[#E6E0D5] bg-[#F8F6F1] px-3 py-1 text-xs font-medium text-[#1F1D1A]"
              >
                <span>{t.name}</span>
                <span className="font-semibold text-[#5A6D3A] tabular-nums">{t.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Congress Consensus Ranking */}
      <section className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#5E584F]">
          Congressos com interesse sinalizado ({rankedCongresses.length})
        </div>

        {rankedCongresses.length === 0 ? (
          <div className="rounded-2xl border border-[#E6E0D5] bg-white p-8 text-center text-sm text-[#5E584F]">
            Nenhum congresso foi sinalizado ainda. Marque interesse diretamente na tabela ou pelo
            questionário para iniciar o consenso.
          </div>
        ) : (
          <div className="space-y-3">
            {rankedCongresses.map(({ congresso, items }) => {
              const myInterest = items.find((i) => i.user_id === currentUserId);
              return (
                <motion.div
                  key={congresso.slug}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[#E6E0D5] bg-white p-4 transition-colors hover:border-[#CFC7B8]"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onOpenDetail(congresso)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2E7] px-2.5 py-0.5 text-xs font-semibold text-[#45562B] tabular-nums">
                          <Users className="h-3 w-3" />
                          {items.length} {items.length === 1 ? 'interessado' : 'interessados'}
                        </span>
                        <span className="text-xs font-medium text-[#5E584F]">
                          {congresso.tema_principal}
                        </span>
                      </div>
                      <h3 className="mt-2 font-display text-base font-semibold text-[#1F1D1A] hover:underline">
                        {congresso.nome}
                      </h3>
                      <div className="mt-1 text-xs text-[#5E584F]">
                        {formatDateRange(congresso)} · {congresso.local_formatado}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {items.map((it) => {
                          const p = profileMap.get(it.user_id);
                          return (
                            <span
                              key={it.user_id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6E0D5] bg-[#F8F6F1] px-2.5 py-1 text-[11px] text-[#1F1D1A]"
                              title={it.proposed_topic || undefined}
                            >
                              <span className="font-medium">
                                {p?.full_name || 'Membro'}
                              </span>
                              <span className="text-[#8A8378]">
                                · {INTEREST_LEVEL_LABEL[it.interest_level]}
                              </span>
                              {it.proposed_topic && (
                                <span className="italic text-[#5A6D3A]">
                                  &ldquo;{it.proposed_topic}&rdquo;
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleInterest(congresso)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          myInterest
                            ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
                            : 'border-[#E6E0D5] bg-white text-[#1F1D1A] hover:border-[#CFC7B8]'
                        }`}
                      >
                        {myInterest ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        <span>{myInterest ? 'Interesse marcado' : 'Também tenho interesse'}</span>
                      </button>

                      <a
                        href={buildGoogleSearchUrl(congresso)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E0D5] bg-[#F8F6F1] px-3 py-1.5 text-xs font-medium text-[#1F1D1A] hover:border-[#CFC7B8]"
                      >
                        <span>Google</span>
                        <ExternalLink className="h-3.5 w-3.5 text-[#5E584F]" />
                      </a>

                      <a
                        href={buildWhatsAppShareUrl(congresso)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#CED9BC] bg-[#EEF2E7] px-3 py-1.5 text-xs font-medium text-[#35441E] hover:bg-[#E4ECD8]"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Member directory */}
      {profiles.length > 0 && (
        <section className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#5E584F]">
            Diretório de Membros ({profiles.length})
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <div
                key={p.user_id}
                className="rounded-2xl border border-[#E6E0D5] bg-white p-4 text-xs"
              >
                <div className="font-display text-sm font-semibold text-[#1F1D1A]">
                  {p.full_name}
                </div>
                <div className="mt-0.5 text-[#5E584F]">
                  {[p.academic_stage, p.institution].filter(Boolean).join(' · ') ||
                    'Pesquisador(a)'}
                </div>
                {p.areas_of_interest.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {p.areas_of_interest.slice(0, 4).map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-[#EEF2E7] px-2 py-0.5 text-[10px] font-medium text-[#45562B]"
                      >
                        {a}
                      </span>
                    ))}
                    {p.areas_of_interest.length > 4 && (
                      <span className="text-[10px] text-[#8A8378]">
                        +{p.areas_of_interest.length - 4}
                      </span>
                    )}
                  </div>
                )}
                {p.notes && (
                  <p className="mt-2 line-clamp-2 italic text-[#5E584F]">
                    &ldquo;{p.notes}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
