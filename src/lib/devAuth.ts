import type {
  InterestLevel,
  InviteToken,
  MemberCongressInterest,
  MemberProfile,
  MemberRole,
} from '../types/congresso';

export const DEV_TEST_EMAIL = 'teste@teste.com';
export const DEV_TEST_PASSWORD = 'teste';
export const DEV_USER_ID = '00000000-0000-4000-8000-000000000001';

const KEY_SESSION = 'drg_dev_session';
const KEY_PROFILES = 'drg_dev_profiles';
const KEY_INTERESTS = 'drg_dev_interests';
const KEY_INVITES = 'drg_dev_invites';

export interface AppSession {
  user: {
    id: string;
    email?: string;
  };
  access_token: string;
}

const DEMO_COLLEAGUE_1 = '00000000-0000-4000-8000-000000000002';
const DEMO_COLLEAGUE_2 = '00000000-0000-4000-8000-000000000003';

function ensureSeeded(): void {
  if (typeof window === 'undefined') return;

  if (!window.localStorage.getItem(KEY_PROFILES)) {
    const now = new Date().toISOString();
    const initialProfiles: MemberProfile[] = [
      {
        user_id: DEV_USER_ID,
        email: DEV_TEST_EMAIL,
        full_name: 'Pesquisador Teste (Admin)',
        role: 'admin',
        academic_stage: 'Residência Médica',
        institution: 'Destilaria Research Group',
        whatsapp: null,
        areas_of_interest: [
          'Cardiologia',
          'Neurologia',
          'Radiologia e Diagnóstico por Imagem',
        ],
        preferred_modalities: ['presencial', 'hibrido'],
        preferred_scopes: ['nacional', 'internacional'],
        preferred_years: ['2027'],
        research_goals: ['Artigo original', 'Revisão sistemática / Meta-análise'],
        notes: 'Interesse em estudos multicêntricos e revisões sistemáticas.',
        onboarding_completed: true,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: DEMO_COLLEAGUE_1,
        email: 'helena.costa@destilaria.org',
        full_name: 'Dra. Helena Costa',
        role: 'member',
        academic_stage: 'Pós-graduação / Mestrado / Doutorado',
        institution: 'FMUSP',
        whatsapp: null,
        areas_of_interest: ['Neurologia', 'Psiquiatria', 'Medicina da Dor'],
        preferred_modalities: ['presencial', 'online'],
        preferred_scopes: ['nacional'],
        preferred_years: ['2027'],
        research_goals: ['Revisão sistemática / Meta-análise', 'Apresentação oral em congresso'],
        notes: 'Buscando coautores em neurociência clínica e cognição.',
        onboarding_completed: true,
        created_at: now,
        updated_at: now,
      },
      {
        user_id: DEMO_COLLEAGUE_2,
        email: 'rafael.mendes@destilaria.org',
        full_name: 'Dr. Rafael Mendes',
        role: 'member',
        academic_stage: 'Médico(a) / Pesquisador(a)',
        institution: 'UNIFESP',
        whatsapp: null,
        areas_of_interest: [
          'Radiologia e Diagnóstico por Imagem',
          'Cardiologia',
          'Medicina Intensiva',
        ],
        preferred_modalities: ['presencial', 'hibrido'],
        preferred_scopes: ['nacional', 'internacional'],
        preferred_years: ['2027'],
        research_goals: ['Artigo original', 'Colaboração multicêntrica e networking'],
        notes: 'Foco em imagem cardiovascular e inteligência artificial aplicada.',
        onboarding_completed: true,
        created_at: now,
        updated_at: now,
      },
    ];
    window.localStorage.setItem(KEY_PROFILES, JSON.stringify(initialProfiles));
  }

  if (!window.localStorage.getItem(KEY_INTERESTS)) {
    const now = new Date().toISOString();
    const initialInterests: MemberCongressInterest[] = [
      {
        id: 1,
        user_id: DEV_USER_ID,
        congress_slug: '57a-jornada-paulista-de-radiologia-jpr-2027',
        interest_level: 'escrever_artigo',
        proposed_topic: 'IA em imagem torácica e cardiovascular',
        created_at: now,
      },
      {
        id: 2,
        user_id: DEMO_COLLEAGUE_2,
        congress_slug: '57a-jornada-paulista-de-radiologia-jpr-2027',
        interest_level: 'escrever_artigo',
        proposed_topic: 'Acurácia diagnóstica em TC cardíaca',
        created_at: now,
      },
      {
        id: 3,
        user_id: DEMO_COLLEAGUE_1,
        congress_slug: 'brain-2027-congress-on-brain-behavior-and-emotions-2027',
        interest_level: 'escrever_artigo',
        proposed_topic: 'Biomarcadores cognitivos em neuropsiquiatria',
        created_at: now,
      },
      {
        id: 4,
        user_id: DEMO_COLLEAGUE_2,
        congress_slug:
          'concardio-2027-ii-congresso-nacional-de-cardiologia-e-praticas-clinicas-avancadas-2027',
        interest_level: 'prioritario',
        proposed_topic: 'Prevenção primária e estratificação de risco',
        created_at: now,
      },
    ];
    window.localStorage.setItem(KEY_INTERESTS, JSON.stringify(initialInterests));
  }

  if (!window.localStorage.getItem(KEY_INVITES)) {
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const initialInvites: InviteToken[] = [
      {
        id: 'dev-inv-1',
        token: 'DRG-DEMO-4K8P-2M9Q',
        role: 'member',
        invited_label: 'Convite exemplo — Novo membro',
        created_by: DEV_USER_ID,
        used_by: null,
        used_at: null,
        expires_at: expires,
        created_at: now.toISOString(),
      },
      {
        id: 'dev-inv-2',
        token: 'DRG-HLN9-3R7T-5W2X',
        role: 'member',
        invited_label: 'Dra. Helena Costa',
        created_by: DEV_USER_ID,
        used_by: DEMO_COLLEAGUE_1,
        used_at: now.toISOString(),
        expires_at: expires,
        created_at: now.toISOString(),
      },
    ];
    window.localStorage.setItem(KEY_INVITES, JSON.stringify(initialInvites));
  }
}

export function isDevSessionActive(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem(KEY_SESSION));
}

export function getDevSession(): AppSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY_SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppSession;
  } catch {
    return null;
  }
}

export function signInDevAccount(email: string, password: string): boolean {
  if (
    email.trim().toLowerCase() !== DEV_TEST_EMAIL ||
    password !== DEV_TEST_PASSWORD
  ) {
    return false;
  }
  ensureSeeded();
  const session: AppSession = {
    user: { id: DEV_USER_ID, email: DEV_TEST_EMAIL },
    access_token: 'dev-local-token',
  };
  window.localStorage.setItem(KEY_SESSION, JSON.stringify(session));
  return true;
}

export function signOutDevAccount(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY_SESSION);
}

export function getDevAllProfiles(): MemberProfile[] {
  ensureSeeded();
  try {
    return JSON.parse(window.localStorage.getItem(KEY_PROFILES) || '[]') as MemberProfile[];
  } catch {
    return [];
  }
}

export function getDevProfile(userId: string): MemberProfile | null {
  return getDevAllProfiles().find((p) => p.user_id === userId) ?? null;
}

export function saveDevProfile(
  profile: Omit<MemberProfile, 'role' | 'created_at' | 'updated_at'> & { role?: MemberRole }
): MemberProfile {
  const all = getDevAllProfiles();
  const idx = all.findIndex((p) => p.user_id === profile.user_id);
  const now = new Date().toISOString();
  const existing = idx >= 0 ? all[idx] : null;
  const saved: MemberProfile = {
    ...profile,
    role: existing?.role ?? 'admin',
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  if (idx >= 0) {
    all[idx] = saved;
  } else {
    all.push(saved);
  }
  window.localStorage.setItem(KEY_PROFILES, JSON.stringify(all));
  return saved;
}

export function getDevGroupInterests(): MemberCongressInterest[] {
  ensureSeeded();
  try {
    return JSON.parse(
      window.localStorage.getItem(KEY_INTERESTS) || '[]'
    ) as MemberCongressInterest[];
  } catch {
    return [];
  }
}

export function saveDevCongressInterest(
  userId: string,
  congressSlug: string,
  level: InterestLevel,
  proposedTopic: string | null
): MemberCongressInterest {
  const list = getDevGroupInterests();
  const idx = list.findIndex(
    (i) => i.user_id === userId && i.congress_slug === congressSlug
  );
  const item: MemberCongressInterest = {
    id: idx >= 0 ? list[idx].id : Date.now(),
    user_id: userId,
    congress_slug: congressSlug,
    interest_level: level,
    proposed_topic: proposedTopic?.trim() || null,
    created_at: idx >= 0 ? list[idx].created_at : new Date().toISOString(),
  };
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.unshift(item);
  }
  window.localStorage.setItem(KEY_INTERESTS, JSON.stringify(list));
  return item;
}

export function removeDevCongressInterest(userId: string, congressSlug: string): void {
  const list = getDevGroupInterests().filter(
    (i) => !(i.user_id === userId && i.congress_slug === congressSlug)
  );
  window.localStorage.setItem(KEY_INTERESTS, JSON.stringify(list));
}

export function batchAddDevCongressInterests(
  userId: string,
  slugs: string[],
  level: InterestLevel
): void {
  for (const slug of slugs) {
    saveDevCongressInterest(userId, slug, level, null);
  }
}

export function getDevInvites(): InviteToken[] {
  ensureSeeded();
  try {
    return JSON.parse(window.localStorage.getItem(KEY_INVITES) || '[]') as InviteToken[];
  } catch {
    return [];
  }
}

export function createDevInvite(payload: {
  invitedLabel?: string;
  role?: MemberRole;
  expiresInDays?: number;
}): InviteToken {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(12);
  window.crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  const token = `DRG-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
  const days = payload.expiresInDays && payload.expiresInDays > 0 ? payload.expiresInDays : 30;
  const now = new Date();
  const inv: InviteToken = {
    id: `dev-inv-${Date.now()}`,
    token,
    role: payload.role === 'admin' ? 'admin' : 'member',
    invited_label: payload.invitedLabel?.trim() || null,
    created_by: DEV_USER_ID,
    used_by: null,
    used_at: null,
    expires_at: new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString(),
    created_at: now.toISOString(),
  };
  const all = [inv, ...getDevInvites()];
  window.localStorage.setItem(KEY_INVITES, JSON.stringify(all));
  return inv;
}

export function revokeDevInvite(id: string): boolean {
  const all = getDevInvites();
  const next = all.filter((i) => !(i.id === id && !i.used_at));
  if (next.length === all.length) return false;
  window.localStorage.setItem(KEY_INVITES, JSON.stringify(next));
  return true;
}
