import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { Session } from '@supabase/supabase-js';
import {
  CheckCircle2,
  ClipboardList,
  Download,
  KeyRound,
  LayoutGrid,
  LogOut,
  Sparkles,
  Table2,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import type {
  Congresso,
  FilterState,
  InterestLevel,
  MemberCongressInterest,
  MemberProfile,
  SortDirection,
  SortField,
} from './types/congresso';
import {
  fetchAllMemberProfiles,
  fetchCongressos,
  fetchGroupInterests,
  fetchMemberProfile,
  removeCongressInterest,
  saveCongressInterest,
  supabase,
} from './lib/supabase';
import { getMonthKey } from './lib/formatters';
import { BrandLogo } from './components/BrandLogo';
import { FilterBar } from './components/FilterBar';
import { CongressTable } from './components/CongressTable';
import { ExportModal } from './components/ExportModal';
import { CongressDetailDrawer } from './components/CongressDetailDrawer';
import { MethodologyModal } from './components/MethodologyModal';
import { AuthModal } from './components/AuthModal';
import { InviteManagerModal } from './components/InviteManagerModal';
import { TypeformWizard } from './components/TypeformWizard';
import { GroupConsensusView } from './components/GroupConsensusView';

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
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'calendario' | 'grupo'>('calendario');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [detailTarget, setDetailTarget] = useState<Congresso | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  // Auth & Pesquisa em grupo
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<MemberProfile[]>([]);
  const [groupInterests, setGroupInterests] = useState<MemberCongressInterest[]>([]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [typeformOpen, setTypeformOpen] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const loadGroupState = useCallback(async (userId: string, openOnboardingIfPending = false) => {
    const [prof, allProfs, ints] = await Promise.all([
      fetchMemberProfile(userId),
      fetchAllMemberProfiles(),
      fetchGroupInterests(),
    ]);
    setProfile(prof);
    setAllProfiles(allProfs);
    setGroupInterests(ints);
    if (openOnboardingIfPending && (!prof || !prof.onboarding_completed)) {
      setTypeformOpen(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchCongressos().then((rows) => {
      if (!active) return;
      setCongressos(rows);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        loadGroupState(data.session.user.id, false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        loadGroupState(nextSession.user.id, false);
      } else {
        setProfile(null);
        setAllProfiles([]);
        setGroupInterests([]);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadGroupState]);

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
        const hay = [c.nome, c.local_formatado, c.tema_principal, ...c.temas, ...c.fontes]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (filters.temas.length > 0) {
        const eventThemes = c.temas.length > 0 ? c.temas : [c.tema_principal];
        if (!filters.temas.some((t) => eventThemes.includes(t))) return false;
      }

      if (filters.mesAno !== 'todos' && getMonthKey(c.data_inicio) !== filters.mesAno) {
        return false;
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

  const profileMap = useMemo(() => {
    const m = new Map<string, MemberProfile>();
    for (const p of allProfiles) m.set(p.user_id, p);
    return m;
  }, [allProfiles]);

  const myInterestSlugs = useMemo(() => {
    const uid = session?.user?.id;
    if (!uid) return new Set<string>();
    return new Set(groupInterests.filter((i) => i.user_id === uid).map((i) => i.congress_slug));
  }, [groupInterests, session]);

  const interestCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of groupInterests) {
      m.set(i.congress_slug, (m.get(i.congress_slug) ?? 0) + 1);
    }
    return m;
  }, [groupInterests]);

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

  const handleQuickToggleInterest = async (c: Congresso) => {
    const uid = session?.user?.id;
    if (!uid) {
      setAuthModalOpen(true);
      return;
    }
    if (myInterestSlugs.has(c.slug)) {
      await removeCongressInterest(uid, c.slug);
    } else {
      await saveCongressInterest(uid, c.slug, 'escrever_artigo', null);
    }
    const ints = await fetchGroupInterests();
    setGroupInterests(ints);
  };

  const handleSaveDetailInterest = async (c: Congresso, level: InterestLevel, topic: string) => {
    const uid = session?.user?.id;
    if (!uid) {
      setAuthModalOpen(true);
      return;
    }
    await saveCongressInterest(uid, c.slug, level, topic);
    const ints = await fetchGroupInterests();
    setGroupInterests(ints);
  };

  const handleRemoveDetailInterest = async (c: Congresso) => {
    const uid = session?.user?.id;
    if (!uid) return;
    await removeCongressInterest(uid, c.slug);
    const ints = await fetchGroupInterests();
    setGroupInterests(ints);
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await supabase.auth.signOut();
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen pb-24">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-[#E6E0D5] bg-[#F8F6F1]/92 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-6">
              <BrandLogo />

              <nav className="hidden items-center gap-1 rounded-xl border border-[#E6E0D5] bg-white p-1 sm:inline-flex">
                <button
                  type="button"
                  onClick={() => setActiveTab('calendario')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeTab === 'calendario'
                      ? 'bg-[#1F1D1A] text-[#F8F6F1]'
                      : 'text-[#5E584F] hover:text-[#1F1D1A]'
                  }`}
                >
                  Calendário
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('grupo')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeTab === 'grupo'
                      ? 'bg-[#1F1D1A] text-[#F8F6F1]'
                      : 'text-[#5E584F] hover:text-[#1F1D1A]'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Interesses do Grupo</span>
                </button>
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeTab === 'calendario' && (
                <div className="inline-flex rounded-xl border border-[#E6E0D5] bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-[#F2EEE6] text-[#1F1D1A]'
                        : 'text-[#5E584F] hover:text-[#1F1D1A]'
                    }`}
                  >
                    <Table2 className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Tabela</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      viewMode === 'cards'
                        ? 'bg-[#F2EEE6] text-[#1F1D1A]'
                        : 'text-[#5E584F] hover:text-[#1F1D1A]'
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Cards</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setExportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#CED9BC] bg-[#EEF2E7] px-3.5 py-2 text-xs font-semibold text-[#35441E] transition-colors hover:bg-[#E4ECD8]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>
                  {selectedItems.length > 0
                    ? `Exportar (${selectedItems.length})`
                    : 'Exportar'}
                </span>
              </button>

              {/* Auth / Member Menu */}
              {session ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E6E0D5] bg-white px-3 py-2 text-xs font-semibold text-[#1F1D1A] hover:border-[#CFC7B8]"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-[#5A6D3A]" />
                    <span className="max-w-[130px] truncate">
                      {profile?.full_name || session.user.email}
                    </span>
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl border border-[#DCD4C6] bg-white p-1.5 shadow-lg z-40"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setTypeformOpen(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#1F1D1A] hover:bg-[#F8F6F1]"
                        >
                          <ClipboardList className="h-3.5 w-3.5 text-[#5A6D3A]" />
                          <span>Meu questionário de áreas</span>
                        </button>

                        {profile?.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              setInvitesOpen(true);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#1F1D1A] hover:bg-[#F8F6F1]"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-[#8F6B3A]" />
                            <span>Gerar tokens de convite</span>
                          </button>
                        )}

                        <div className="my-1 border-t border-[#EFEBE2]" />

                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#7D3B23] hover:bg-[#FAF0EA]"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Sair</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F1D1A] px-3.5 py-2 text-xs font-semibold text-[#F8F6F1] transition-colors hover:bg-[#35322D]"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Entrar / Convite</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile navigation */}
          <div className="flex border-t border-[#E6E0D5] bg-white px-4 py-1.5 sm:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('calendario')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                activeTab === 'calendario' ? 'bg-[#1F1D1A] text-[#F8F6F1]' : 'text-[#5E584F]'
              }`}
            >
              Calendário
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('grupo')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                activeTab === 'grupo' ? 'bg-[#1F1D1A] text-[#F8F6F1]' : 'text-[#5E584F]'
              }`}
            >
              Interesses do Grupo
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6">
          {/* Editorial Hero (limpo, sem excesso de badges nem mostradores de estatística) */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-[#E6E0D5] bg-white px-6 py-6 sm:px-8 sm:py-7 shadow-xs"
          >
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <h1 className="font-editorial text-2xl sm:text-4xl font-medium tracking-tight text-[#1F1D1A]">
                  Radar de Congressos Médicos
                </h1>
                <p className="mt-2 text-sm text-[#5E584F] leading-relaxed">
                  Mapeamento colaborativo para identificar congressos de interesse comum entre os
                  membros do Destilaria Research Group e organizar frentes para escrita de artigos
                  científicos.{' '}
                  <button
                    type="button"
                    onClick={() => setMethodologyOpen(true)}
                    className="inline font-medium text-[#5A6D3A] underline decoration-[#5A6D3A]/45 underline-offset-4 transition-colors hover:text-[#35441E] hover:decoration-[#35441E]"
                  >
                    Metodologia e critérios de seleção →
                  </button>
                </p>
              </div>

              {session && (
                <button
                  type="button"
                  onClick={() => setTypeformOpen(true)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#CED9BC] bg-[#EEF2E7] px-4 py-2.5 text-xs font-semibold text-[#35441E] transition-colors hover:bg-[#E4ECD8]"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>
                    {profile?.onboarding_completed
                      ? 'Editar áreas de interesse'
                      : 'Preencher questionário de interesses'}
                  </span>
                </button>
              )}
            </div>
          </motion.section>

          {activeTab === 'calendario' ? (
            <>
              <FilterBar
                filters={filters}
                onChange={setFilters}
                availableThemes={availableThemes}
                availableMonths={availableMonths}
                availableUFs={availableUFs}
                totalFiltered={filtered.length}
                totalAll={congressos.length}
              />

              {loading ? (
                <div className="rounded-2xl border border-[#E6E0D5] bg-white p-12 text-center shadow-xs">
                  <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#E6E0D5] border-t-[#5A6D3A]" />
                  <p className="mt-3 text-sm font-medium text-[#5E584F]">
                    Carregando calendário de congressos...
                  </p>
                </div>
              ) : (
                <CongressTable
                  items={filtered}
                  viewMode={viewMode}
                  selectedSlugs={selectedSlugs}
                  myInterestSlugs={myInterestSlugs}
                  interestCounts={interestCounts}
                  onToggleSelect={toggleSelect}
                  onToggleSelectAllFiltered={toggleSelectAllFiltered}
                  onToggleInterest={handleQuickToggleInterest}
                  onOpenDetail={setDetailTarget}
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  onClearFilters={() => setFilters(INITIAL_FILTERS)}
                />
              )}
            </>
          ) : (
            <GroupConsensusView
              isAuthenticated={Boolean(session)}
              currentUserId={session?.user?.id ?? null}
              congressos={congressos}
              profiles={allProfiles}
              interests={groupInterests}
              onOpenAuth={() => setAuthModalOpen(true)}
              onOpenTypeform={() => setTypeformOpen(true)}
              onOpenDetail={setDetailTarget}
              onToggleInterest={handleQuickToggleInterest}
            />
          )}
        </main>

        {/* Floating Selection Bar */}
        <AnimatePresence>
          {selectedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#36322D] bg-[#1F1D1A] px-4 py-2.5 text-[#F8F6F1] shadow-xl"
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-[#8E9F63]" />
                <span className="tabular-nums">
                  {selectedItems.length}{' '}
                  {selectedItems.length === 1 ? 'selecionado' : 'selecionados'}
                </span>
              </div>

              <div className="h-4 w-px bg-white/15" />

              <button
                type="button"
                onClick={() => setExportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#5A6D3A] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#6B8047]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Exportar em linguagem simples</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSlugs(new Set())}
                className="rounded-lg p-1.5 text-[#B9B09F] hover:bg-white/10 hover:text-white"
                title="Limpar seleção"
                aria-label="Limpar seleção"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals & Drawers */}
        <CongressDetailDrawer
          congresso={detailTarget}
          selected={detailTarget ? selectedSlugs.has(detailTarget.slug) : false}
          isAuthenticated={Boolean(session)}
          myInterest={
            detailTarget && session?.user
              ? (groupInterests.find(
                  (i) =>
                    i.congress_slug === detailTarget.slug && i.user_id === session.user.id
                ) ?? null)
              : null
          }
          colleagueInterests={
            detailTarget
              ? groupInterests.filter((i) => i.congress_slug === detailTarget.slug)
              : []
          }
          profileMap={profileMap}
          onToggleSelect={toggleSelect}
          onSaveInterest={handleSaveDetailInterest}
          onRemoveInterest={handleRemoveDetailInterest}
          onRequireAuth={() => {
            setDetailTarget(null);
            setAuthModalOpen(true);
          }}
          onClose={() => setDetailTarget(null)}
        />

        <ExportModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          items={exportTargetItems}
          isSelection={selectedItems.length > 0}
        />

        <MethodologyModal open={methodologyOpen} onClose={() => setMethodologyOpen(false)} />

        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onAuthenticated={async (isNew) => {
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
              await loadGroupState(data.session.user.id, isNew);
            }
          }}
        />

        {session?.user && (
          <TypeformWizard
            open={typeformOpen}
            userId={session.user.id}
            userEmail={session.user.email || ''}
            initialProfile={profile}
            congressos={congressos}
            availableThemes={availableThemes}
            initialSelectedSlugs={Array.from(myInterestSlugs)}
            onClose={() => setTypeformOpen(false)}
            onCompleted={async (updatedProfile) => {
              setProfile(updatedProfile);
              await loadGroupState(session.user.id, false);
              if (updatedProfile.areas_of_interest.length > 0) {
                setFilters((prev) => ({
                  ...prev,
                  temas: updatedProfile.areas_of_interest,
                }));
              }
            }}
          />
        )}

        <InviteManagerModal
          open={invitesOpen}
          accessToken={session?.access_token ?? null}
          onClose={() => setInvitesOpen(false)}
        />

        <footer className="mx-auto mt-12 max-w-7xl px-4 text-center text-xs text-[#8A8378] sm:px-6">
          Destilaria Research Group · Planejamento Colaborativo de Congressos Médicos
        </footer>
      </div>
    </MotionConfig>
  );
}

export default App;
