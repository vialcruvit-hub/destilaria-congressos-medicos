import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getAdminClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireAdmin(
  request: Request,
  admin: SupabaseClient
): Promise<{ userId: string } | { errorResponse: Response }> {
  const authHeader = request.headers.get('authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!jwt) {
    return { errorResponse: jsonResponse({ error: 'Sessão não autenticada.' }, 401) };
  }

  const { data: userRes, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userRes.user) {
    console.error('invites: getUser failed', userErr);
    return { errorResponse: jsonResponse({ error: 'Sessão inválida ou expirada.' }, 401) };
  }

  const { data: profile, error: profErr } = await admin
    .from('member_profiles')
    .select('role')
    .eq('user_id', userRes.user.id)
    .maybeSingle();

  if (profErr) {
    console.error('invites: profile lookup failed', profErr);
    return { errorResponse: jsonResponse({ error: 'Erro ao verificar permissões.' }, 500) };
  }

  if (!profile || profile.role !== 'admin') {
    return {
      errorResponse: jsonResponse(
        { error: 'Apenas administradores podem gerenciar tokens de convite.' },
        403
      ),
    };
  }

  return { userId: userRes.user.id };
}

function generateUniqueToken(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `DRG-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const admin = getAdminClient();
    if (!admin) {
      console.error('invites GET: missing Supabase env vars');
      return jsonResponse({ error: 'Configuração de servidor ausente.' }, 500);
    }

    const auth = await requireAdmin(request, admin);
    if ('errorResponse' in auth) return auth.errorResponse;

    const { data, error } = await admin
      .from('invite_tokens')
      .select('id, token, role, invited_label, created_by, used_by, used_at, expires_at, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('invites GET: query error', error);
      return jsonResponse({ error: 'Erro ao listar tokens de convite.' }, 500);
    }

    return jsonResponse({ invites: data ?? [] }, 200);
  } catch (err) {
    console.error('invites GET: unexpected error', err);
    return jsonResponse({ error: 'Erro interno ao listar convites.' }, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const admin = getAdminClient();
    if (!admin) {
      console.error('invites POST: missing Supabase env vars');
      return jsonResponse({ error: 'Configuração de servidor ausente.' }, 500);
    }

    const auth = await requireAdmin(request, admin);
    if ('errorResponse' in auth) return auth.errorResponse;

    let body: { invitedLabel?: string; role?: string; expiresInDays?: number } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      body = {};
    }

    const invitedLabel = (body.invitedLabel ?? '').trim() || null;
    const role = body.role === 'admin' ? 'admin' : 'member';
    const days =
      typeof body.expiresInDays === 'number' && body.expiresInDays > 0 && body.expiresInDays <= 365
        ? body.expiresInDays
        : 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const token = generateUniqueToken();

    const { data, error } = await admin
      .from('invite_tokens')
      .insert({
        token,
        role,
        invited_label: invitedLabel,
        created_by: auth.userId,
        expires_at: expiresAt,
      })
      .select('id, token, role, invited_label, created_by, used_by, used_at, expires_at, created_at')
      .single();

    if (error) {
      console.error('invites POST: insert error', error);
      return jsonResponse({ error: 'Erro ao gerar novo token de convite.' }, 500);
    }

    return jsonResponse({ invite: data }, 201);
  } catch (err) {
    console.error('invites POST: unexpected error', err);
    return jsonResponse({ error: 'Erro interno ao gerar convite.' }, 500);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const admin = getAdminClient();
    if (!admin) {
      console.error('invites DELETE: missing Supabase env vars');
      return jsonResponse({ error: 'Configuração de servidor ausente.' }, 500);
    }

    const auth = await requireAdmin(request, admin);
    if ('errorResponse' in auth) return auth.errorResponse;

    const url = new URL(request.url);
    const id = url.searchParams.get('id')?.trim();
    if (!id) {
      return jsonResponse({ error: 'Parâmetro id é obrigatório.' }, 400);
    }

    const { data, error } = await admin
      .from('invite_tokens')
      .delete()
      .eq('id', id)
      .is('used_at', null)
      .select('id');

    if (error) {
      console.error('invites DELETE: error', error);
      return jsonResponse({ error: 'Erro ao revogar token.' }, 500);
    }

    if (!data || data.length === 0) {
      return jsonResponse(
        { error: 'Token não encontrado ou já utilizado.' },
        404
      );
    }

    return jsonResponse({ ok: true, id }, 200);
  } catch (err) {
    console.error('invites DELETE: unexpected error', err);
    return jsonResponse({ error: 'Erro interno ao revogar convite.' }, 500);
  }
}
