import { createClient } from '@supabase/supabase-js';
import type {
  Congresso,
  InterestLevel,
  InviteToken,
  MemberCongressInterest,
  MemberProfile,
  MemberRole,
} from '../types/congresso';
import fallbackData from '../data/congressosFallback.json';
import {
  batchAddDevCongressInterests,
  createDevInvite,
  getDevAllProfiles,
  getDevGroupInterests,
  getDevInvites,
  getDevProfile,
  isDevSessionActive,
  removeDevCongressInterest,
  revokeDevInvite,
  saveDevCongressInterest,
  saveDevProfile,
} from './devAuth';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://yzuzasrpypsjucxrebjg.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_YkNmW8KzC9RNfN5xm819Yg_Pd9krq5s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function fetchCongressos(): Promise<Congresso[]> {
  try {
    const { data, error } = await supabase
      .from('congressos')
      .select('*')
      .order('data_inicio', { ascending: true, nullsFirst: false });

    if (error || !data || data.length === 0) {
      return fallbackData as Congresso[];
    }
    return data as Congresso[];
  } catch {
    return fallbackData as Congresso[];
  }
}

export async function fetchMemberProfile(userId: string): Promise<MemberProfile | null> {
  if (isDevSessionActive()) {
    return getDevProfile(userId);
  }
  const { data, error } = await supabase
    .from('member_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar perfil do membro:', error);
    return null;
  }
  return (data as MemberProfile | null) ?? null;
}

export async function upsertMemberProfile(
  profile: Omit<MemberProfile, 'role' | 'created_at' | 'updated_at'> & { role?: MemberRole }
): Promise<{ data: MemberProfile | null; error: string | null }> {
  if (isDevSessionActive()) {
    return { data: saveDevProfile(profile), error: null };
  }
  const { role: _ignoredRole, ...safeUpdate } = profile;
  const { data: existing } = await supabase
    .from('member_profiles')
    .select('user_id')
    .eq('user_id', profile.user_id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('member_profiles')
      .update(safeUpdate)
      .eq('user_id', profile.user_id)
      .select('*')
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as MemberProfile, error: null };
  }

  const { data, error } = await supabase
    .from('member_profiles')
    .insert({ ...safeUpdate, role: 'member' })
    .select('*')
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as MemberProfile, error: null };
}

export async function fetchAllMemberProfiles(): Promise<MemberProfile[]> {
  if (isDevSessionActive()) {
    return getDevAllProfiles();
  }
  const { data, error } = await supabase
    .from('member_profiles')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar membros do grupo:', error);
    return [];
  }
  return (data as MemberProfile[]) ?? [];
}

export async function fetchGroupInterests(): Promise<MemberCongressInterest[]> {
  if (isDevSessionActive()) {
    return getDevGroupInterests();
  }
  const { data, error } = await supabase
    .from('member_congress_interests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar interesses do grupo:', error);
    return [];
  }
  return (data as MemberCongressInterest[]) ?? [];
}

export async function saveCongressInterest(
  userId: string,
  congressSlug: string,
  level: InterestLevel,
  proposedTopic: string | null
): Promise<{ data: MemberCongressInterest | null; error: string | null }> {
  if (isDevSessionActive()) {
    return {
      data: saveDevCongressInterest(userId, congressSlug, level, proposedTopic),
      error: null,
    };
  }
  const { data, error } = await supabase
    .from('member_congress_interests')
    .upsert(
      {
        user_id: userId,
        congress_slug: congressSlug,
        interest_level: level,
        proposed_topic: proposedTopic?.trim() || null,
      },
      { onConflict: 'user_id,congress_slug' }
    )
    .select('*')
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as MemberCongressInterest, error: null };
}

export async function removeCongressInterest(
  userId: string,
  congressSlug: string
): Promise<{ error: string | null }> {
  if (isDevSessionActive()) {
    removeDevCongressInterest(userId, congressSlug);
    return { error: null };
  }
  const { error } = await supabase
    .from('member_congress_interests')
    .delete()
    .eq('user_id', userId)
    .eq('congress_slug', congressSlug);

  return { error: error ? error.message : null };
}

export async function batchAddCongressInterests(
  userId: string,
  slugs: string[],
  level: InterestLevel = 'escrever_artigo'
): Promise<{ error: string | null }> {
  if (isDevSessionActive()) {
    batchAddDevCongressInterests(userId, slugs, level);
    return { error: null };
  }
  if (slugs.length === 0) return { error: null };
  const rows = slugs.map((slug) => ({
    user_id: userId,
    congress_slug: slug,
    interest_level: level,
  }));
  const { error } = await supabase
    .from('member_congress_interests')
    .upsert(rows, { onConflict: 'user_id,congress_slug' });

  return { error: error ? error.message : null };
}

export async function registerWithInviteToken(payload: {
  token: string;
  fullName: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; role?: MemberRole; error?: string }> {
  try {
    const res = await fetch('/api/auth-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok?: boolean; role?: MemberRole; error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error || 'Não foi possível criar a conta.' };
    }
    return { ok: true, role: data.role };
  } catch {
    return {
      ok: false,
      error: 'Erro de conexão com o servidor de registro. Tente novamente.',
    };
  }
}

export async function listInvites(accessToken: string): Promise<{
  invites: InviteToken[];
  error?: string;
}> {
  if (isDevSessionActive()) {
    return { invites: getDevInvites() };
  }
  try {
    const res = await fetch('/api/invites', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as { invites?: InviteToken[]; error?: string };
    if (!res.ok) return { invites: [], error: data.error || 'Erro ao carregar convites.' };
    return { invites: data.invites ?? [] };
  } catch {
    return { invites: [], error: 'Erro de conexão ao buscar convites.' };
  }
}

export async function createInvite(
  accessToken: string,
  payload: { invitedLabel?: string; role?: MemberRole; expiresInDays?: number }
): Promise<{ invite?: InviteToken; error?: string }> {
  if (isDevSessionActive()) {
    return { invite: createDevInvite(payload) };
  }
  try {
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { invite?: InviteToken; error?: string };
    if (!res.ok) return { error: data.error || 'Erro ao gerar token.' };
    return { invite: data.invite };
  } catch {
    return { error: 'Erro de conexão ao gerar token.' };
  }
}

export async function revokeInvite(
  accessToken: string,
  id: string
): Promise<{ ok: boolean; error?: string }> {
  if (isDevSessionActive()) {
    const ok = revokeDevInvite(id);
    return ok ? { ok: true } : { ok: false, error: 'Token não encontrado ou já utilizado.' };
  }
  try {
    const res = await fetch(`/api/invites?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) return { ok: false, error: data.error || 'Erro ao revogar token.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Erro de conexão ao revogar token.' };
  }
}
