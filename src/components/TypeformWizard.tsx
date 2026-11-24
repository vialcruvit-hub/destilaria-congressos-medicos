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

  const handleStepKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && step < totalSteps - 1) {
      e.preventDefault();
      next();
    }
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
            className="absolute inset-0 bg-[#211F1C]/45 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-2 border-[#211F1C] bg-[#FAF7F1] shadow-[8px_8px_0px_#211F1C]"
          >
            {/* Top progress bar */}
            <div className="border-b-2 border-[#211F1C] bg-[#FDF6E9] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[#211F1C] bg-[#F3D2A2] px-2.5 py-0.5 text-[11px] font-extrabold text-[#211F1C] tabular-nums">
                    0{step + 1} / 0{totalSteps}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B655B]">
                    Perfil &amp; Interesses do Pesquisador
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border-2 border-[#211F1C] bg-white p-1 text-[#211F1C] hover:bg-[#F3D2A2]"
                  aria-label="Fechar questionário"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full border border-[#211F1C] bg-white">
                <motion.div
                  className="h-full bg-[#B7CC49]"
                  initial={false}
                  animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                />
              </div>
            </div>

            {/* Step Body */}
            <div className="flex-1 overflow-y-auto bg-white px-6 py-6 sm:px-8">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -24 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                >
                  {step === 0 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#211F1C]">
                          Como os colegas devem identificar você?
                        </h2>
                        <p className="mt-1 text-sm text-[#6B655B]">
                          Esses dados conectam membros para formar grupos e escrever artigos juntos.
                        </p>
                      </div>

                      <div className="grid gap-3.5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-bold text-[#211F1C]">
                            Nome completo
                          </label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            onKeyDown={handleStepKeyDown}
                            placeholder="Ex.: Lucas Andrade"
                            className="w-full rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] px-3.5 py-2.5 text-sm focus:border-[#211F1C] focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold text-[#211F1C]">
                            Instituição / Liga / Hospital
                          </label>
                          <input
                            type="text"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            onKeyDown={handleStepKeyDown}
                            placeholder="Ex.: USP / UNIFESP / HC"
                            className="w-full rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] px-3.5 py-2.5 text-sm focus:border-[#211F1C] focus:bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold text-[#211F1C]">
                            WhatsApp (opcional)
                          </label>
                          <input
                            type="text"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            onKeyDown={handleStepKeyDown}
                            placeholder="(11) 99999-9999"
                            className="w-full rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] px-3.5 py-2.5 text-sm focus:border-[#211F1C] focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold text-[#211F1C]">
                          Momento acadêmico / profissional
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {ACADEMIC_STAGES.map((st) => {
                            const active = academicStage === st;
                            return (
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                key={st}
                                type="button"
                                onClick={() => setAcademicStage(st)}
                                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                  active
                                    ? 'border-[#211F1C] bg-[#B7CC49] text-[#211F1C] shadow-[2px_2px_0px_#211F1C]'
                                    : 'border-[#DDD4C4] bg-[#FAF7F1] text-[#3F3B35] hover:border-[#211F1C]'
                                }`}
                              >
                                {st}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#211F1C]">
                          Quais áreas médicas mais te interessam?
                        </h2>
                        <p className="mt-1 text-sm text-[#6B655B]">
                          Escolha uma ou mais especialidades para encontrar pares com interesses em
                          comum.
                        </p>
                      </div>

                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8679]" />
                        <input
                          type="text"
                          value={areaSearch}
                          onChange={(e) => setAreaSearch(e.target.value)}
                          placeholder="Filtrar especialidades (ex.: Cardiologia, Neurologia, Oncologia)..."
                          className="w-full rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] py-2 pl-9 pr-3 text-xs focus:border-[#211F1C] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="flex max-h-60 flex-wrap gap-1.5 overflow-y-auto pr-1">
                        {filteredThemeOptions.map((t) => {
                          const selected = areas.includes(t.name);
                          return (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              key={t.name}
                              type="button"
                              onClick={() => toggleItem(areas, setAreas, t.name)}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                                selected
                                  ? 'border-[#211F1C] bg-[#B7CC49] text-[#211F1C] shadow-[1.5px_1.5px_0px_#211F1C]'
                                  : 'border-[#DDD4C4] bg-[#FAF7F1] text-[#3F3B35] hover:border-[#211F1C] hover:bg-white'
                              }`}
                            >
                              {selected && <Check className="h-3 w-3 stroke-[3]" />}
                              <span>{t.name}</span>
                              <span className="text-[10px] opacity-65 tabular-nums">{t.count}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#211F1C]">
                          Que tipos de congresso você busca?
                        </h2>
                        <p className="mt-1 text-sm text-[#6B655B]">
                          Defina modalidade, abrangência e anos preferidos.
                        </p>
                      </div>

                      <div>
                        <div className="mb-2 text-xs font-bold text-[#211F1C]">Modalidade</div>
                        <div className="flex flex-wrap gap-2">
                          {MODALIDADES_OPTIONS.map((m) => {
                            const active = modalities.includes(m.id);
                            return (
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                key={m.id}
                                type="button"
                                onClick={() => toggleItem(modalities, setModalities, m.id)}
                                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                                  active
                                    ? 'border-[#211F1C] bg-[#F3D2A2] text-[#211F1C] shadow-[2px_2px_0px_#211F1C]'
                                    : 'border-[#DDD4C4] bg-[#FAF7F1] text-[#3F3B35] hover:border-[#211F1C]'
                                }`}
                              >
                                {m.label}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 text-xs font-bold text-[#211F1C]">Abrangência</div>
                        <div className="flex flex-wrap gap-2">
                          {SCOPES_OPTIONS.map((sc) => {
                            const active = scopes.includes(sc.id);
                            return (
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                key={sc.id}
                                type="button"
                                onClick={() => toggleItem(scopes, setScopes, sc.id)}
                                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                                  active
                                    ? 'border-[#211F1C] bg-[#F3D2A2] text-[#211F1C] shadow-[2px_2px_0px_#211F1C]'
                                    : 'border-[#DDD4C4] bg-[#FAF7F1] text-[#3F3B35] hover:border-[#211F1C]'
                                }`}
                              >
                                {sc.label}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 text-xs font-bold text-[#211F1C]">
                          Horizonte de planejamento
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {YEARS_OPTIONS.map((y) => {
                            const active = years.includes(y);
                            return (
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                key={y}
                                type="button"
                                onClick={() => toggleItem(years, setYears, y)}
                                className={`rounded-full border px-4 py-1.5 text-xs font-bold tabular-nums transition-all ${
                                  active
                                    ? 'border-[#211F1C] bg-[#B7CC49] text-[#211F1C] shadow-[2px_2px_0px_#211F1C]'
                                    : 'border-[#DDD4C4] bg-[#FAF7F1] text-[#3F3B35] hover:border-[#211F1C]'
                                }`}
                              >
                                {y}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#211F1C]">
                          Como você quer atuar nos artigos do grupo?
                        </h2>
                        <p className="mt-1 text-sm text-[#6B655B]">
                          Selecione formatos de produção e descreva temas que gostaria de pesquisar.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {RESEARCH_GOALS.map((g) => {
                          const active = goals.includes(g);
                          return (
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              key={g}
                              type="button"
                              onClick={() => toggleItem(goals, setGoals, g)}
                              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                active
                                  ? 'border-[#211F1C] bg-[#B7CC49] text-[#211F1C] shadow-[2px_2px_0px_#211F1C]'
                                  : 'border-[#DDD4C4] bg-[#FAF7F1] text-[#3F3B35] hover:border-[#211F1C]'
                              }`}
                            >
                              {g}
                            </motion.button>
                          );
                        })}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-[#211F1C]">
                          Temas específicos ou ideias iniciais de artigo (opcional)
                        </label>
                        <textarea
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ex.: Tenho interesse em revisão sistemática em cardiologia preventiva ou cirurgia minimamente invasiva..."
                          className="w-full rounded-xl border-2 border-[#E4DDD0] bg-[#FAF7F1] p-3 text-sm text-[#211F1C] placeholder:text-[#8E8679] focus:border-[#211F1C] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-4">
                      <div>
                        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#211F1C]">
                          Congressos alinhados ao seu perfil
                        </h2>
                        <p className="mt-1 text-sm text-[#6B655B]">
                          Marque eventos que deseja sinalizar como interesse comum do grupo (use o
                          botão do Google para conferir detalhes antes).
                        </p>
                      </div>

                      {suggestedCongresses.length === 0 ? (
                        <div className="rounded-2xl border border-[#DDD4C4] bg-[#FAF7F1] p-4 text-xs text-[#6B655B]">
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
                                className={`flex items-start justify-between gap-3 rounded-2xl border-2 p-3 transition-all ${
                                  selected
                                    ? 'border-[#211F1C] bg-[#FDF6E9] shadow-[3px_3px_0px_#B7CC49]'
                                    : 'border-[#E4DDD0] bg-[#FAF7F1] hover:border-[#211F1C] hover:bg-white'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleItem(chosenSlugs, setChosenSlugs, c.slug)}
                                  className="flex flex-1 items-start gap-2.5 text-left"
                                >
                                  <span
                                    className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border-2 ${
                                      selected
                                        ? 'border-[#211F1C] bg-[#B7CC49] text-[#211F1C]'
                                        : 'border-[#BDB4A4] bg-white'
                                    }`}
                                  >
                                    {selected && <Check className="h-3 w-3 stroke-[3]" />}
                                  </span>
                                  <div>
                                    <div className="font-display text-xs font-bold text-[#211F1C]">
                                      {c.nome}
                                    </div>
                                    <div className="mt-0.5 text-[11px] text-[#6B655B]">
                                      {formatDateRange(c)} · {c.local_formatado} ·{' '}
                                      {c.tema_principal}
                                    </div>
                                  </div>
                                </button>

                                <a
                                  href={buildGoogleSearchUrl(c)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#5C554C] hover:bg-[#F3D2A2] hover:text-[#211F1C]"
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
                <div className="mt-4 rounded-xl border border-[#D8B4A0] bg-[#FAF0EA] px-3.5 py-2.5 text-xs font-medium text-[#7D3B23]">
                  {error}
                </div>
              )}
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between border-t-2 border-[#211F1C] bg-[#FDF6E9] px-6 py-4">
              <button
                type="button"
                onClick={back}
                disabled={step === 0 || saving}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#211F1C] bg-white px-3.5 py-2 text-xs font-bold text-[#211F1C] hover:bg-[#FAF7F1] disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Voltar</span>
              </button>

              {step < totalSteps - 1 ? (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#211F1C] bg-[#F3D2A2] px-4 py-2 text-xs font-bold text-[#211F1C] shadow-[2px_2px_0px_#211F1C] hover:bg-[#EFC384]"
                >
                  <span>Continuar</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={handleFinish}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#211F1C] bg-[#B7CC49] px-5 py-2 text-xs font-bold text-[#211F1C] shadow-[2px_2px_0px_#211F1C] hover:bg-[#A6BD36] disabled:opacity-60"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{saving ? 'Salvando...' : 'Salvar preferências'}</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
