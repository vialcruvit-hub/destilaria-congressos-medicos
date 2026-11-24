export type DataStatus = 'confirmada' | 'a_confirmar' | 'a_definir';
export type Modalidade = 'presencial' | 'online' | 'hibrido' | 'a_definir';
export type MemberRole = 'admin' | 'member';
export type InterestLevel = 'prioritario' | 'interessado' | 'escrever_artigo';

export interface Congresso {
  id: number;
  slug: string;
  nome: string;
  data_inicio: string | null;
  data_fim: string | null;
  data_status: DataStatus;
  data_observacao: string | null;
  modalidade: Modalidade;
  cidade: string | null;
  estado_uf: string | null;
  pais: string | null;
  local_formatado: string;
  tema_principal: string;
  temas: string[];
  fontes: string[];
  atualizado_em: string;
}

export interface MemberProfile {
  user_id: string;
  email: string;
  full_name: string;
  role: MemberRole;
  academic_stage: string | null;
  institution: string | null;
  whatsapp: string | null;
  areas_of_interest: string[];
  preferred_modalities: string[];
  preferred_scopes: string[];
  preferred_years: string[];
  research_goals: string[];
  notes: string | null;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MemberCongressInterest {
  id?: number;
  user_id: string;
  congress_slug: string;
  interest_level: InterestLevel;
  proposed_topic: string | null;
  created_at?: string;
}

export interface InviteToken {
  id: string;
  token: string;
  role: MemberRole;
  invited_label: string | null;
  created_by: string | null;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export type SortField = 'data' | 'nome' | 'local' | 'tema';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  busca: string;
  temas: string[];
  mesAno: string; // 'todos' | 'YYYY-MM' | 'a_definir'
  modalidade: 'todos' | Modalidade;
  regiao: string; // 'todos' | 'brasil' | 'exterior' | 'UF:SP'
  dataStatus: 'todos' | DataStatus;
}
