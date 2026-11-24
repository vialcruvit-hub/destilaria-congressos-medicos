import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import type { Congresso, MemberProfile } from '../types/congresso';
import { buildGoogleSearchUrl, formatDateRange } from '../lib/formatters';
import { batchAddCongressInterests, upsertMemberProfile } from '../lib/supabase';

interface TypeformWizardProps {
  open: boolean;
  userId: string;
  userEmail: string;
  initialProfile: MemberProfile | null;
  congressos: Congresso[];
  availableThemes: { name: string; count: number }[];
  initialSelectedSlugs: string[];
  onClose: () => void;
  onCompleted: (profile: MemberProfile, addedSlugs: string[]) => void;
}

const ACADEMIC_STAGES = [
  'Graduação em Medicina',
  'Internato',
  'Residência Médica',
  'Pós-graduação / Mestrado / Doutorado',
  'Médico(a) / Pesquisador(a)',
];

const RESEARCH_GOALS = [
  'Artigo original',
  'Revisão sistemática / Meta-análise',
  'Relato de caso / Pôster científico',
  'Apresentação oral em congresso',
  'Colaboração multicêntrica e networking',
];

const MODALIDADES_OPTIONS = [
  { id: 'presencial', label: 'Presencial' },
  { id: 'online', label: 'Online' },
  { id: 'hibrido', label: 'Híbrido' },
];

const SCOPES_OPTIONS = [
  { id: 'nacional', label: 'Congressos no Brasil' },
  { id: 'internacional', label: 'Congressos Internacionais' },
];

const YEARS_OPTIONS = ['2026', '2027', '2028'];

export function TypeformWizard({
  open,
  userId,
  userEmail,
  initialProfile,
  congressos,
  availableThemes,
  initialSelectedSlugs,
  onClose,
  onCompleted,
}: TypeformWizardProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [academicStage, setAcademicStage] = useState(initialProfile?.academic_stage || '');
  const [institution, setInstitution] = useState(initialProfile?.institution || '');
  const [whatsapp, setWhatsapp] = useState(initialProfile?.whatsapp || '');

  const [areas, setAreas] = useState<string[]>(initialProfile?.areas_of_interest || []);
  const [areaSearch, setAreaSearch] = useState('');

  const [modalities, setModalities] = useState<string[]>(
    initialProfile?.preferred_modalities?.length
      ? initialProfile.preferred_modalities
      : ['presencial', 'hibrido']
  );
  const [scopes, setScopes] = useState<string[]>(
    initialProfile?.preferred_scopes?.length
      ? initialProfile.preferred_scopes
      : ['nacional', 'internacional']
  );
  const [years, setYears] = useState<string[]>(
    initialProfile?.preferred_years?.length ? initialProfile.preferred_years : ['2027']
  );

  const [goals, setGoals] = useState<string[]>(initialProfile?.research_goals || []);
  const [notes, setNotes] = useState(initialProfile?.notes || '');

  const [chosenSlugs, setChosenSlugs] = useState<string[]>(initialSelectedSlugs);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 5;

  const filteredThemeOptions = useMemo(() => {
    const q = areaSearch.trim().toLowerCase();
    return availableThemes.filter(
      (t) => t.name !== 'Não informado' && (!q || t.name.toLowerCase().includes(q))
    );
  }, [availableThemes, areaSearch]);

  const suggestedCongresses = useMemo(() => {
    return congressos
      .filter((c) => {
        if (areas.length > 0) {
          const evThemes = c.temas.length > 0 ? c.temas : [c.tema_principal];
          if (!areas.some((a) => evThemes.includes(a))) return false;
        }
        if (modalities.length > 0 && c.modalidade !== 'a_definir') {
          if (!modalities.includes(c.modalidade)) return false;
        }
        if (scopes.length === 1) {
          const isBrazil = c.pais === 'Brasil' || c.modalidade === 'online';
          if (scopes[0] === 'nacional' && !isBrazil) return false;
          if (scopes[0] === 'internacional' && c.pais === 'Brasil') return false;
        }
        if (years.length > 0 && c.data_inicio) {
          const y = c.data_inicio.slice(0, 4);
          if (!years.includes(y)) return false;
        }
        return true;
      })
      .slice(0, 24);
  }, [congressos, areas, modalities, scopes, years]);

  const toggleItem = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const next = () => {
    setError(null);
    if (step === 0 && fullName.trim().length < 2) {
      setError('Informe seu nome completo para identificar suas escolhas no grupo.');
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  };

  const back = () => {
    setError(null);
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleFinish = async () => {
    setSaving(true);
    setError(null);
    const profRes = await upsertMemberProfile({
      user_id: userId,
      email: userEmail,
      full_name: fullName.trim() || initialProfile?.full_name || userEmail,
      academic_stage: academicStage || null,
      institution: institution.trim() || null,
      whatsapp: whatsapp.trim() || null,
      areas_of_interest: areas,
      preferred_modalities: modalities,
      preferred_scopes: scopes,
      preferred_years: years,
      research_goals: goals,
      notes: notes.trim() || null,
      onboarding_completed: true,
    });

    if (profRes.error || !profRes.data) {
      setError(profRes.error || 'Não foi possível salvar seu questionário.');
      setSaving(false);
      return;
    }

    if (chosenSlugs.length > 0) {
      const intRes = await batchAddCongressInterests(userId, chosenSlugs, 'escrever_artigo');
      if (intRes.error) {
        setError(intRes.error);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onCompleted(profRes.data, chosenSlugs);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1F1D1A]/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#DCD4C6] bg-[#FFFFFF] shadow-2xl"
          >
            {/* Top progress bar */}
            <div className="border-b border-[#E6E0D5] bg-[#F8F6F1] px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#5A6D3A]">
                  Mapeamento do Pesquisador · Etapa {step + 1} de {totalSteps}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-[#E6E0D5] bg-white p-1 text-[#5E584F] hover:text-[#1F1D1A]"
                  aria-label="Fechar questionário"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#E6E0D5]">
                <motion.div
                  className="h-full rounded-full bg-[#5A6D3A]"
                  initial={false}
                  animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            {/* Step Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -20 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  {step === 0 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="font-editorial text-2xl font-medium text-[#1F1D1A]">
                          Como os colegas devem identificar você?
                        </h2>
                        <p className="mt-1 text-sm text-[#5E584F]">
                          Esses dados ajudam a conectar membros para escrever artigos e submeter
                          trabalhos em conjunto.
                        </p>
                      </div>

                      <div className="grid gap-3.5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-semibold text-[#1F1D1A]">
                            Nome completo
                          </label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ex.: Lucas Andrade"
                            className="w-full rounded-xl border border-[#DCD4C6] bg-[#F8F6F1] px-3.5 py-2.5 text-sm focus:border-[#5A6D3A] focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#1F1D1A]">
                            Instituição / Liga / Hospital
                          </label>
                          <input
                            type="text"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            placeholder="Ex.: USP / UNIFESP / HC"
                            className="w-full rounded-xl border border-[#DCD4C6] bg-[#F8F6F1] px-3.5 py-2.5 text-sm focus:border-[#5A6D3A] focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#1F1D1A]">
                            WhatsApp (opcional)
                          </label>
                          <input
                            type="text"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            placeholder="(11) 99999-9999"
                            className="w-full rounded-xl border border-[#DCD4C6] bg-[#F8F6F1] px-3.5 py-2.5 text-sm focus:border-[#5A6D3A] focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-[#1F1D1A]">
                          Momento acadêmico / profissional
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {ACADEMIC_STAGES.map((st) => {
                            const active = academicStage === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setAcademicStage(st)}
                                className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors ${
                                  active
                                    ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
                                    : 'border-[#E6E0D5] bg-white text-[#433F39] hover:border-[#CFC7B8]'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="font-editorial text-2xl font-medium text-[#1F1D1A]">
                          Quais áreas médicas mais te interessam?
                        </h2>
                        <p className="mt-1 text-sm text-[#5E584F]">
                          Escolha uma ou mais especialidades para encontrar pares com interesses em
                          comum.
                        </p>
                      </div>

                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8378]" />
                        <input
                          type="text"
                          value={areaSearch}
                          onChange={(e) => setAreaSearch(e.target.value)}
                          placeholder="Filtrar especialidades (ex.: Cardiologia, Neurologia, Oncologia)..."
                          className="w-full rounded-xl border border-[#DCD4C6] bg-[#F8F6F1] py-2 pl-9 pr-3 text-xs focus:border-[#5A6D3A] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="flex max-h-60 flex-wrap gap-1.5 overflow-y-auto pr-1">
                        {filteredThemeOptions.map((t) => {
                          const selected = areas.includes(t.name);
                          return (
                            <button
                              key={t.name}
                              type="button"
                              onClick={() => toggleItem(areas, setAreas, t.name)}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                selected
                                  ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
                                  : 'border-[#E6E0D5] bg-white text-[#433F39] hover:border-[#CFC7B8]'
                              }`}
                            >
                              {selected && <Check className="h-3 w-3" />}
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

                  {step === 2 && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="font-editorial text-2xl font-medium text-[#1F1D1A]">
                          Que tipos de congresso você busca?
                        </h2>
                        <p className="mt-1 text-sm text-[#5E584F]">
                          Defina modalidade, abrangência e janela de tempo preferida.
                        </p>
                      </div>

                      <div>
                        <div className="mb-2 text-xs font-semibold text-[#1F1D1A]">Modalidade</div>
                        <div className="flex flex-wrap gap-2">
                          {MODALIDADES_OPTIONS.map((m) => {
                            const active = modalities.includes(m.id);
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => toggleItem(modalities, setModalities, m.id)}
                                className={`rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                                  active
                                    ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
                                    : 'border-[#E6E0D5] bg-white text-[#433F39] hover:border-[#CFC7B8]'
                                }`}
                              >
                                {m.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 text-xs font-semibold text-[#1F1D1A]">Abrangência</div>
                        <div className="flex flex-wrap gap-2">
                          {SCOPES_OPTIONS.map((sc) => {
                            const active = scopes.includes(sc.id);
                            return (
                              <button
                                key={sc.id}
                                type="button"
                                onClick={() => toggleItem(scopes, setScopes, sc.id)}
                                className={`rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                                  active
                                    ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
                                    : 'border-[#E6E0D5] bg-white text-[#433F39] hover:border-[#CFC7B8]'
                                }`}
                              >
                                {sc.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 text-xs font-semibold text-[#1F1D1A]">
                          Horizonte de planejamento
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {YEARS_OPTIONS.map((y) => {
                            const active = years.includes(y);
                            return (
                              <button
                                key={y}
                                type="button"
                                onClick={() => toggleItem(years, setYears, y)}
                                className={`rounded-xl border px-4 py-2 text-xs font-medium tabular-nums transition-colors ${
                                  active
                                    ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
                                    : 'border-[#E6E0D5] bg-white text-[#433F39] hover:border-[#CFC7B8]'
                                }`}
                              >
                                {y}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="font-editorial text-2xl font-medium text-[#1F1D1A]">
                          Como você quer atuar nos artigos do grupo?
                        </h2>
                        <p className="mt-1 text-sm text-[#5E584F]">
                          Selecione formatos de produção e descreva temas que gostaria de pesquisar.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {RESEARCH_GOALS.map((g) => {
                          const active = goals.includes(g);
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => toggleItem(goals, setGoals, g)}
                              className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors ${
                                active
                                  ? 'border-[#5A6D3A] bg-[#EEF2E7] text-[#35441E]'
                                  : 'border-[#E6E0D5] bg-white text-[#433F39] hover:border-[#CFC7B8]'
                              }`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#1F1D1A]">
                          Temas específicos ou ideias iniciais de artigo (opcional)
                        </label>
                        <textarea
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ex.: Tenho interesse em revisão sistemática em cardiologia preventiva ou cirurgia minimamente invasiva..."
                          className="w-full rounded-xl border border-[#DCD4C6] bg-[#F8F6F1] p-3 text-sm text-[#1F1D1A] placeholder:text-[#8A8378] focus:border-[#5A6D3A] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="font-editorial text-2xl font-medium text-[#1F1D1A]">
                          Congressos alinhados ao seu perfil
                        </h2>
                        <p className="mt-1 text-sm text-[#5E584F]">
                          Marque os eventos que deseja sinalizar como interesse comum do grupo (você
                          também pode pesquisar no Google antes de decidir).
                        </p>
                      </div>

                      {suggestedCongresses.length === 0 ? (
                        <div className="rounded-xl border border-[#E6E0D5] bg-[#F8F6F1] p-4 text-xs text-[#5E584F]">
                          Nenhum evento corresponde exatamente à combinação escolhida. Você pode
                          concluir e explorar toda a tabela na tela principal.
                        </div>
                      ) : (
                        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                          {suggestedCongresses.map((c) => {
                            const selected = chosenSlugs.includes(c.slug);
                            return (
                              <div
                                key={c.slug}
                                className={`flex items-start justify-between gap-3 rounded-xl border p-3 transition-colors ${
                                  selected
                                    ? 'border-[#5A6D3A] bg-[#EEF2E7]/70'
                                    : 'border-[#E6E0D5] bg-white hover:border-[#CFC7B8]'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleItem(chosenSlugs, setChosenSlugs, c.slug)}
                                  className="flex flex-1 items-start gap-2.5 text-left"
                                >
                                  <span
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                      selected
                                        ? 'border-[#5A6D3A] bg-[#5A6D3A] text-white'
                                        : 'border-[#CFC7B8] bg-white'
                                    }`}
                                  >
                                    {selected && <Check className="h-3 w-3" />}
                                  </span>
                                  <div>
                                    <div className="text-xs font-semibold text-[#1F1D1A]">
                                      {c.nome}
                                    </div>
                                    <div className="mt-0.5 text-[11px] text-[#5E584F]">
                                      {formatDateRange(c)} · {c.local_formatado} ·{' '}
                                      {c.tema_principal}
                                    </div>
                                  </div>
                                </button>

                                <a
                                  href={buildGoogleSearchUrl(c)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#E6E0D5] bg-[#F8F6F1] px-2 py-1 text-[11px] font-medium text-[#5E584F] hover:text-[#1F1D1A]"
                                  title="Pesquisar informações no Google"
                                >
                                  <span>Google</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {error && (
                <div className="mt-4 rounded-xl border border-[#D8B4A0] bg-[#FAF0EA] px-3.5 py-2.5 text-xs text-[#7D3B23]">
                  {error}
                </div>
              )}
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between border-t border-[#E6E0D5] bg-[#F8F6F1] px-6 py-4">
              <button
                type="button"
                onClick={back}
                disabled={step === 0 || saving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E0D5] bg-white px-3.5 py-2 text-xs font-semibold text-[#5E584F] hover:text-[#1F1D1A] disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Voltar</span>
              </button>

              {step < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F1D1A] px-4 py-2 text-xs font-semibold text-[#F8F6F1] hover:bg-[#35322D]"
                >
                  <span>Continuar</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#5A6D3A] px-5 py-2 text-xs font-semibold text-white hover:bg-[#495A2E] disabled:opacity-60"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{saving ? 'Salvando...' : 'Salvar preferências'}</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
