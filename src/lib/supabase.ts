import { createClient } from '@supabase/supabase-js';
import type { Congresso } from '../types/congresso';
import fallbackData from '../data/congressosFallback.json';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://yzuzasrpypsjucxrebjg.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_YkNmW8KzC9RNfN5xm819Yg_Pd9krq5s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

export interface FetchResult {
  data: Congresso[];
  source: 'supabase' | 'snapshot';
  notice?: string;
}

export async function fetchCongressos(): Promise<FetchResult> {
  try {
    const { data, error } = await supabase
      .from('congressos')
      .select('*')
      .order('data_inicio', { ascending: true, nullsFirst: false });

    if (error) {
      return {
        data: fallbackData as Congresso[],
        source: 'snapshot',
        notice: `Supabase aguardando tabela/RLS (${error.code ?? error.message}). Exibindo snapshot sincronizado.`,
      };
    }

    if (!data || data.length === 0) {
      return {
        data: fallbackData as Congresso[],
        source: 'snapshot',
        notice: 'Tabela congressos vazia no Supabase. Exibindo snapshot sincronizado.',
      };
    }

    return {
      data: data as Congresso[],
      source: 'supabase',
    };
  } catch {
    return {
      data: fallbackData as Congresso[],
      source: 'snapshot',
      notice: 'Sem conexão direta ao Supabase no momento. Exibindo snapshot sincronizado.',
    };
  }
}
