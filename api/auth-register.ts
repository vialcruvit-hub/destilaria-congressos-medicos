import { createClient } from '@supabase/supabase-js';

interface RegisterPayload {
  token?: string;
  fullName?: string;
  email?: string;
  password?: string;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('auth-register: missing SUPABASE_URL or SUPABASE_SECRET_KEY env vars');
      return jsonResponse(
        { error: 'Servidor sem configuração do Supabase. Contate a coordenação.' },
        500
      );
    }

    let payload: RegisterPayload;
    try {
      payload = (await request.json()) as RegisterPayload;
    } catch {
      return jsonResponse({ error: 'Corpo da requisição inválido.' }, 400);
    }

    const token = (payload.token ?? '').trim().toUpperCase();
    const fullName = (payload.fullName ?? '').trim();
    const email = (payload.email ?? '').trim().toLowerCase();
    const password = payload.password ?? '';

    if (!token || token.length < 8) {
      return jsonResponse({ error: 'Informe um token de convite válido.' }, 400);
    }
    if (fullName.length < 2) {
      return jsonResponse({ error: 'Informe seu nome completo.' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: 'Informe um endereço de e-mail válido.' }, 400);
    }
    if (password.length < 8) {
      return jsonResponse(
        { error: 'A senha deve ter pelo menos 8 caracteres.' },
        400
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: tokenRow, error: tokenErr } = await admin
      .from('invite_tokens')
      .select('id, token, role, used_at, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (tokenErr) {
      console.error('auth-register: error querying invite_tokens', tokenErr);
      return jsonResponse({ error: 'Erro ao validar token no banco de dados.' }, 500);
    }

    if (!tokenRow) {
      return jsonResponse({ error: 'Token de convite inválido.' }, 403);
    }
    if (tokenRow.used_at) {
      return jsonResponse({ error: 'Este token de convite já foi utilizado.' }, 403);
    }
    if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() <= Date.now()) {
      return jsonResponse({ error: 'Este token de convite expirou.' }, 403);
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createErr || !created.user) {
      console.error('auth-register: createUser failed', createErr);
      const msg = createErr?.message?.toLowerCase() ?? '';
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return jsonResponse(
          { error: 'Já existe uma conta cadastrada com este e-mail.' },
          409
        );
      }
      return jsonResponse(
        { error: createErr?.message || 'Não foi possível criar a conta.' },
        400
      );
    }

    const userId = created.user.id;

    // Consumo atômico: garante uso único mesmo sob requisições concorrentes
    const { data: consumedRows, error: consumeErr } = await admin
      .from('invite_tokens')
      .update({
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq('id', tokenRow.id)
      .is('used_at', null)
      .select('id');

    if (consumeErr || !consumedRows || consumedRows.length === 0) {
      console.error('auth-register: failed atomic token consumption', consumeErr);
      await admin.auth.admin.deleteUser(userId);
      return jsonResponse(
        { error: 'Este token já foi utilizado por outro membro.' },
        409
      );
    }

    const { error: profileErr } = await admin.from('member_profiles').insert({
      user_id: userId,
      email,
      full_name: fullName,
      role: tokenRow.role,
      onboarding_completed: false,
    });

    if (profileErr) {
      console.error('auth-register: failed creating member_profiles', profileErr);
      // Mantém usuário autenticado; o perfil será completado no Typeform
    }

    return jsonResponse({ ok: true, role: tokenRow.role }, 201);
  } catch (err) {
    console.error('auth-register: unexpected error', err);
    return jsonResponse({ error: 'Erro interno ao processar cadastro.' }, 500);
  }
}
