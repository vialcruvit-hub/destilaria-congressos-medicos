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
      <div className="rounded-3xl border-2 border-[#211F1C] bg-white px-6 py-14 text-center shadow-[5px_5px_0px_#211F1C]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#211F1C] bg-[#FDF6E9] shadow-[3px_3px_0px_#211F1C]">
          <Lock className="h-6 w-6 text-[#211F1C]" />
        </div>
        <h2 className="font-display text-xl font-extrabold text-[#211F1C]">
          Consenso e Grupos de Artigos
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[#6B655B]">
          Entre com sua conta ou cole seu token único de convite para visualizar quais congressos
          reúnem mais membros interessados em escrever artigos juntos.
        </p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={onOpenAuth}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border-2 border-[#211F1C] bg-[#B7CC49] px-5 py-2.5 text-xs font-bold text-[#211F1C] shadow-[3px_3px_0px_#211F1C] hover:bg-[#A6BD36]"
        >
          <span>Entrar ou criar conta com token</span>
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho aberto no canvas (sem box externo) */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#211F1C]">
            Interesses em comum do grupo ({profiles.length}{' '}
            {profiles.length === 1 ? 'membro' : 'membros'})
          </h2>
          <p className="mt-1 text-sm text-[#6B655B]">
            Encontre convergências para formar grupos de escrita e alinhar submissões no WhatsApp.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={onOpenTypeform}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border-2 border-[#211F1C] bg-[#F3D2A2] px-4 py-2 text-xs font-bold text-[#211F1C] shadow-[3px_3px_0px_#211F1C] hover:bg-[#EFC384]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Atualizar meu questionário</span>
        </motion.button>
      </div>

      {/* Áreas mais votadas abertas no canvas */}
      {topThemes.length > 0 && (
        <section className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#6B655B]">
            Áreas mais escolhidas pelos membros
          </div>
          <div className="flex flex-wrap gap-2">
            {topThemes.map((t) => (
              <span
                key={t.name}
                className="inline-flex items-center gap-2 rounded-full border border-[#211F1C] bg-white px-3 py-1 text-xs font-semibold text-[#211F1C]"
              >
                <span>{t.name}</span>
                <span className="rounded-full bg-[#B7CC49] px-1.5 text-[10px] font-bold text-[#211F1C] tabular-nums">
                  {t.count}
                </span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Ranking de Congressos */}
      <section className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#6B655B]">
          Congressos com interesse sinalizado ({rankedCongresses.length})
        </div>

        {rankedCongresses.length === 0 ? (
          <div className="rounded-3xl border-2 border-[#211F1C] bg-white p-8 text-center text-sm text-[#6B655B] shadow-[4px_4px_0px_#211F1C]">
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border-2 border-[#211F1C] bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#211F1C]"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onOpenDetail(congresso)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#211F1C] bg-[#B7CC49] px-2.5 py-0.5 text-xs font-bold text-[#211F1C] tabular-nums">
                          <Users className="h-3 w-3" />
                          {items.length} {items.length === 1 ? 'interessado' : 'interessados'}
                        </span>
                        <span className="text-xs font-semibold text-[#6B655B]">
                          {congresso.tema_principal}
                        </span>
                      </div>
                      <h3 className="mt-2 font-display text-base font-extrabold text-[#211F1C] hover:underline">
                        {congresso.nome}
                      </h3>
                      <div className="mt-1 text-xs text-[#6B655B]">
                        {formatDateRange(congresso)} · {congresso.local_formatado}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {items.map((it) => {
                          const p = profileMap.get(it.user_id);
                          return (
                            <span
                              key={it.user_id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF7F1] px-2.5 py-1 text-[11px] text-[#211F1C] ring-1 ring-[#E4DDD0]"
                              title={it.proposed_topic || undefined}
                            >
                              <span className="font-bold">{p?.full_name || 'Membro'}</span>
                              <span className="text-[#6B655B]">
                                · {INTEREST_LEVEL_LABEL[it.interest_level]}
                              </span>
                              {it.proposed_topic && (
                                <span className="italic text-[#5A6D1F]">
                                  &ldquo;{it.proposed_topic}&rdquo;
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => onToggleInterest(congresso)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border-2 border-[#211F1C] px-3 py-1.5 text-xs font-bold transition-colors ${
                          myInterest
                            ? 'bg-[#B7CC49] text-[#211F1C]'
                            : 'bg-white text-[#211F1C] hover:bg-[#FAF7F1]'
                        }`}
                      >
                        {myInterest ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        <span>{myInterest ? 'Interesse marcado' : 'Também quero'}</span>
                      </motion.button>

                      <a
                        href={buildGoogleSearchUrl(congresso)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#211F1C] bg-[#FDF6E9] px-3 py-1.5 text-xs font-bold text-[#211F1C] hover:bg-[#F3D2A2]"
                      >
                        <span>Google</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      <a
                        href={buildWhatsAppShareUrl(congresso)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#211F1C] bg-[#F2F6DF] px-3 py-1.5 text-xs font-bold text-[#211F1C] hover:bg-[#E4EEB8]"
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

      {/* Diretório de membros */}
      {profiles.length > 0 && (
        <section className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#6B655B]">
            Membros do grupo ({profiles.length})
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <div
                key={p.user_id}
                className="rounded-3xl border-2 border-[#211F1C] bg-white p-4 text-xs shadow-[3px_3px_0px_#211F1C]"
              >
                <div className="font-display text-sm font-extrabold text-[#211F1C]">
                  {p.full_name}
                </div>
                <div className="mt-0.5 text-[#6B655B]">
                  {[p.academic_stage, p.institution].filter(Boolean).join(' · ') ||
                    'Pesquisador(a)'}
                </div>
                {p.areas_of_interest.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {p.areas_of_interest.slice(0, 4).map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-[#F2F6DF] px-2 py-0.5 text-[10px] font-bold text-[#211F1C] ring-1 ring-[#211F1C]/20"
                      >
                        {a}
                      </span>
                    ))}
                    {p.areas_of_interest.length > 4 && (
                      <span className="text-[10px] text-[#6B655B]">
                        +{p.areas_of_interest.length - 4}
                      </span>
                    )}
                  </div>
                )}
                {p.notes && (
                  <p className="mt-2 line-clamp-2 italic text-[#6B655B]">
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
