import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import type { Session } from '@supabase/supabase-js';
import {
  CheckCircle2,
  ClipboardList,
  Download,
  KeyRound,
  LogOut,
  Sparkles,
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
import { BrandLogo, HeroCaneDoodle } from './components/BrandLogo';
import { FilterBar, type QuickLens } from './components/FilterBar';
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
  const [quickLens, setQuickLens] = useState<QuickLens>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [detailTarget, setDetailTarget] = useState<Congresso | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<MemberProfile[]>([]);
  const [groupInterests, setGroupInterests] = useState<MemberCongressInterest[]>([]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [typeformOpen, setTypeformOpen] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast((cur) => (cur === message ? null : cur));
    }, 2800);
  }, []);

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

  const filtered = useMemo(() => {
    const q = filters.busca.trim().toLowerCase();
    const myAreas = profile?.areas_of_interest ?? [];

    const list = congressos.filter((c) => {
      if (quickLens === 'group' && (interestCounts.get(c.slug) ?? 0) === 0) return false;
      if (quickLens === 'online' && c.modalidade !== 'online') return false;
      if (quickLens === 'intl' && (!c.pais || c.pais === 'Brasil')) return false;
      if (quickLens === 'y2027' && (!c.data_inicio || !c.data_inicio.startsWith('2027'))) {
        return false;
      }
      if (quickLens === 'my_areas' && myAreas.length > 0) {
        const evThemes = c.temas.length > 0 ? c.temas : [c.tema_principal];
        if (!myAreas.some((a) => evThemes.includes(a))) return false;
      }

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
  }, [congressos, filters, quickLens, interestCounts, profile, sortField, sortDir]);

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
      showToast('Interesse removido da lista do grupo.');
    } else {
      await saveCongressInterest(uid, c.slug, 'escrever_artigo', null);
      showToast('Interesse marcado para grupo de artigo!');
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
    showToast('Interesse salvo para o grupo!');
  };

  const handleRemoveDetailInterest = async (c: Congresso) => {
    const uid = session?.user?.id;
    if (!uid) return;
    await removeCongressInterest(uid, c.slug);
    const ints = await fetchGroupInterests();
    setGroupInterests(ints);
    showToast('Interesse removido.');
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await supabase.auth.signOut();
    showToast('Sessão encerrada.');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen pb-28">
        {/* Top Bar aberta, logo solta sem box */}
        <header className="sticky top-0 z-30 border-b border-[#E7DFD2] bg-[#FAF7F1]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-7">
              <BrandLogo />

              {/* Navegação aberta sem box container */}
              <nav className="hidden items-center gap-5 sm:flex">
                <button
                  type="button"
                  onClick={() => setActiveTab('calendario')}
                  className={`relative py-1.5 text-sm font-bold transition-colors ${
                    activeTab === 'calendario'
                      ? 'text-[#211F1C]'
                      : 'text-[#6B655B] hover:text-[#211F1C]'
                  }`}
                >
                  <span>Calendário</span>
                  {activeTab === 'calendario' && (
                    <motion.span
                      layoutId="navIndicator"
                      className="absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-[#B7CC49] ring-1 ring-[#211F1C]"
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('grupo')}
                  className={`relative inline-flex items-center gap-1.5 py-1.5 text-sm font-bold transition-colors ${
                    activeTab === 'grupo'
                      ? 'text-[#211F1C]'
                      : 'text-[#6B655B] hover:text-[#211F1C]'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Interesses do Grupo</span>
                  {activeTab === 'grupo' && (
                    <motion.span
                      layoutId="navIndicator"
                      className="absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-[#B7CC49] ring-1 ring-[#211F1C]"
                    />
                  )}
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-2.5">
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setExportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-[#211F1C] bg-[#B7CC49] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#211F1C] shadow-[3px_3px_0px_#211F1C] transition-colors hover:bg-[#A8BE38]"
              >
                <Download className="h-4 w-4" />
                <span>
                  {selectedItems.length > 0
                    ? `Exportar (${selectedItems.length})`
                    : 'Exportar'}
                </span>
              </motion.button>

              {session ? (
                <div className="relative">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#211F1C] bg-white px-3 py-2 text-xs font-bold text-[#211F1C] shadow-[3px_3px_0px_#211F1C] hover:bg-[#FDF6E9]"
                  >
                    <UserCheck className="h-4 w-4 text-[#859D20]" />
                    <span className="max-w-[120px] truncate">
                      {profile?.full_name || session.user.email}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                        className="absolute right-0 mt-2 w-56 rounded-2xl border-2 border-[#211F1C] bg-white p-1.5 shadow-[4px_4px_0px_#211F1C] z-40"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setTypeformOpen(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#211F1C] hover:bg-[#FAF7F1]"
                        >
                          <ClipboardList className="h-3.5 w-3.5 text-[#859D20]" />
                          <span>Meu questionário de áreas</span>
                        </button>

                        {profile?.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              setInvitesOpen(true);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#211F1C] hover:bg-[#FAF7F1]"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-[#D49A4A]" />
                            <span>Gerar tokens de convite</span>
                          </button>
                        )}

                        <div className="my-1 border-t border-[#EFE8DA]" />

                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#7D3B23] hover:bg-[#FAF0EA]"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Sair</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-[#211F1C] bg-[#211F1C] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#FAF7F1] shadow-[3px_3px_0px_#B7CC49] hover:bg-[#35322D]"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Entrar / Convite</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="flex gap-4 border-t border-[#E7DFD2] px-4 py-2 sm:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('calendario')}
              className={`text-xs font-bold ${
                activeTab === 'calendario' ? 'text-[#211F1C] underline decoration-[#B7CC49] decoration-2 underline-offset-4' : 'text-[#6B655B]'
              }`}
            >
              Calendário
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('grupo')}
              className={`text-xs font-bold ${
                activeTab === 'grupo' ? 'text-[#211F1C] underline decoration-[#B7CC49] decoration-2 underline-offset-4' : 'text-[#6B655B]'
              }`}
            >
              Interesses do Grupo
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6">
          {/* Hero aberto diretamente no canvas pontilhado — SEM BOX */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-between gap-4 pt-1 lg:flex-row lg:items-center"
          >
            <div className="max-w-3xl">
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#211F1C]">
                Radar de Congressos Médicos
              </h1>
              <p className="mt-2 text-sm sm:text-[15px] text-[#5C554C] leading-relaxed">
                Encontre congressos de interesse comum entre os membros do Destilaria Research
                Group para formar grupos de pesquisa e escrever artigos juntos.{' '}
                <button
                  type="button"
                  onClick={() => setMethodologyOpen(true)}
                  className="inline font-bold text-[#211F1C] underline decoration-[#B7CC49] decoration-2 underline-offset-4 transition-colors hover:text-[#5A6D1F]"
                >
                  Como selecionamos os congressos →
                </button>
              </p>

              {session && (
                <div className="mt-4">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setTypeformOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#211F1C] bg-[#FDF6E9] px-4 py-2 text-xs font-bold text-[#211F1C] shadow-[3px_3px_0px_#211F1C] hover:bg-[#F3D2A2]"
                  >
                    <ClipboardList className="h-4 w-4 text-[#859D20]" />
                    <span>
                      {profile?.onboarding_completed
                        ? 'Editar minhas áreas e questionário'
                        : 'Preencher questionário de interesses'}
                    </span>
                  </motion.button>
                </div>
              )}
            </div>

            <HeroCaneDoodle />
          </motion.section>

          {activeTab === 'calendario' ? (
            <>
              <FilterBar
                filters={filters}
                onChange={setFilters}
                quickLens={quickLens}
                onQuickLensChange={setQuickLens}
                hasGroupInterests={groupInterests.length > 0}
                hasMyAreas={(profile?.areas_of_interest.length ?? 0) > 0}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                availableThemes={availableThemes}
                availableMonths={availableMonths}
                availableUFs={availableUFs}
                totalFiltered={filtered.length}
                totalAll={congressos.length}
              />

              {loading ? (
                <div className="rounded-3xl border-2 border-[#211F1C] bg-white p-12 text-center shadow-[5px_5px_0px_#211F1C]">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-[#E4DDD0] border-t-[#211F1C]" />
                  <p className="mt-3 text-sm font-medium text-[#5C554C]">
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
                  onClearFilters={() => {
                    setFilters(INITIAL_FILTERS);
                    setQuickLens('all');
                  }}
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

        {/* Toast de feedback tátil */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              className="fixed bottom-20 right-5 z-50 rounded-2xl border-2 border-[#211F1C] bg-[#B7CC49] px-4 py-2 text-xs font-bold text-[#211F1C] shadow-[4px_4px_0px_#211F1C]"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra flutuante de seleção */}
        <AnimatePresence>
          {selectedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-[#211F1C] bg-[#211F1C] px-4 py-2.5 text-[#FAF7F1] shadow-[5px_5px_0px_#B7CC49]"
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-[#B7CC49]" />
                <span className="tabular-nums">
                  {selectedItems.length}{' '}
                  {selectedItems.length === 1 ? 'selecionado' : 'selecionados'}
                </span>
              </div>

              <div className="h-4 w-px bg-white/20" />

              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setExportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#B7CC49] px-3 py-1.5 text-xs font-bold text-[#211F1C] hover:bg-[#CBE05A]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Exportar em linguagem simples</span>
              </motion.button>

              <button
                type="button"
                onClick={() => setSelectedSlugs(new Set())}
                className="rounded-lg p-1.5 text-[#CFC6B8] hover:bg-white/10 hover:text-white"
                title="Limpar seleção"
                aria-label="Limpar seleção"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modais & Drawers */}
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
                setQuickLens('my_areas');
              }
              showToast('Preferências salvas com sucesso!');
            }}
          />
        )}

        <InviteManagerModal
          open={invitesOpen}
          accessToken={session?.access_token ?? null}
          onClose={() => setInvitesOpen(false)}
        />

        <footer className="mx-auto mt-12 max-w-7xl px-4 text-center text-xs text-[#6B655B] sm:px-6">
          Destilaria Research Group · Planejamento Colaborativo de Congressos Médicos
        </footer>
      </div>
    </MotionConfig>
  );
}

export default App;
